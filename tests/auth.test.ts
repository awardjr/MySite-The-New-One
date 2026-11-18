import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/server/db.js', async () => {
	const { getTestDb } = await import('./test-db');
	return { db: getTestDb() };
});
vi.mock('#lib/server/email.js', () => ({ sendPasswordResetEmail: vi.fn(async () => true) }));
// Cookie options depend on this; assert on what production gets.
vi.mock('$app/env', () => ({ dev: false, browser: false }));

import { recoveryKeyMatches, seedAdmin } from './auth-helpers';
import { fakeCookies, uniqueAddress } from './route-helpers';
import { getTestDb } from './test-db';
import {
	cancelTwoFactorChallenge,
	checkCredentials,
	checkPassword,
	clearTwoFactorChallenges,
	completeTwoFactorChallenge,
	confirmTotpSetup,
	createAdmin,
	createPasswordResetToken,
	createSession,
	createTwoFactorChallenge,
	deleteSession,
	disableTotp,
	endSession,
	generateRecoveryKey,
	getAdminProfile,
	getPendingTotpSecret,
	loginAttempts,
	resetAttempts,
	hashSecret,
	hasTwoFactorChallenge,
	invalidateAllSessions,
	isAdminConfigured,
	isTotpEnabled,
	isValidEmail,
	normalizeRecoveryKey,
	redeemRecoveryKey,
	requestEmailPasswordReset,
	resetPasswordWithToken,
	safeEqual,
	SESSION_COOKIE_NAME,
	sessionCookieOptions,
	startSession,
	startTotpSetup,
	twoFactorCookieOptions,
	updateAdminProfile,
	validateNewPassword,
	verifyResetToken,
	verifySecondFactor,
	verifySecret,
	verifySessionToken,
	verifyTotpCode
} from '#lib/server/auth.js';
import { sendPasswordResetEmail } from '#lib/server/email.js';
import { totpCode, totpStep } from '#lib/server/totp.js';

const testDb = getTestDb();
const TEST_TOTP_ENCRYPTION_KEY = 'test-only-totp-encryption-key-with-more-than-32-bytes';
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const RECOVERY_KEY_FORMAT = /^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/;

const sentEmail = vi.mocked(sendPasswordResetEmail);
const advanceClock = (ms: number) => vi.setSystemTime(Date.now() + ms);
const rowCount = (table: string) =>
	(testDb.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

beforeEach(() => {
	// Only Date is faked: scrypt and the guard queue still run for real, while TOTP codes and
	// expiry checks can't shift if a test happens to cross a time boundary.
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date('2026-01-15T12:00:10Z'));
	process.env.TOTP_ENCRYPTION_KEY = TEST_TOTP_ENCRYPTION_KEY;
	testDb.exec('DELETE FROM admin_user');
	testDb.exec('DELETE FROM sessions');
	testDb.exec('DELETE FROM password_reset_tokens');
	clearTwoFactorChallenges();
	sentEmail.mockClear();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('admin credentials and profile', () => {
	it('fails closed for every check until an admin exists', async () => {
		expect(isAdminConfigured()).toBe(false);
		expect(getAdminProfile()).toBeNull();
		expect(await checkPassword('anything')).toBe(false);
		expect(await checkCredentials('admin', 'anything')).toBe(false);
		expect(await redeemRecoveryKey('AAAA-AAAA-AAAA-AAAA')).toBeNull();
		expect(await requestEmailPasswordReset('admin', 'https://example.test')).toBe(false);
	});

	it('verifies login credentials by username or email case-insensitively', async () => {
		await seedAdmin('MyUsername', 'Admin@Example.COM', 'correct-password');

		for (const identifier of [
			'MyUsername',
			'myusername',
			' myusername ',
			'admin@example.com',
			'ADMIN@EXAMPLE.COM'
		]) {
			expect(await checkCredentials(identifier, 'correct-password')).toBe(true);
		}

		expect(await checkCredentials('wronguser', 'correct-password')).toBe(false);
		expect(await checkCredentials('', 'correct-password')).toBe(false);
		expect(await checkCredentials('   ', 'correct-password')).toBe(false);
		expect(await checkCredentials('myusername', '')).toBe(false);
		expect(await checkCredentials('myusername', 'wrong-password')).toBe(false);
		expect(await checkCredentials('admin@example.com', 'wrong-password')).toBe(false);
		// Passwords are compared exactly as typed.
		expect(await checkCredentials('myusername', 'Correct-Password')).toBe(false);
		expect(await checkCredentials('myusername', ' correct-password')).toBe(false);
	});

	it('moves login over to the updated username and email', async () => {
		await seedAdmin('olduser', 'old@example.com', 'password123');
		updateAdminProfile(' newuser ', ' New@Example.com ');

		expect(getAdminProfile()).toEqual({ username: 'newuser', email: 'new@example.com' });
		expect(await checkCredentials('newuser', 'password123')).toBe(true);
		expect(await checkCredentials('new@example.com', 'password123')).toBe(true);
		expect(await checkCredentials('olduser', 'password123')).toBe(false);
		expect(await checkCredentials('old@example.com', 'password123')).toBe(false);
	});
});

describe('secret hashing helpers', () => {
	it('salts each hash and verifies only the original secret', async () => {
		const first = await hashSecret('same-secret');
		const second = await hashSecret('same-secret');

		expect(first).not.toBe(second);
		expect(first).not.toContain('same-secret');
		expect(await verifySecret('same-secret', first)).toBe(true);
		expect(await verifySecret('same-secret', second)).toBe(true);
		expect(await verifySecret('other-secret', first)).toBe(false);
	});

	it('rejects a malformed stored hash', async () => {
		for (const stored of ['', 'no-separator', 'salt:', 'salt:abcd']) {
			expect(await verifySecret('secret', stored), stored).toBe(false);
		}
	});

	it('compares strings of any length for equality', () => {
		expect(safeEqual('setup-token', 'setup-token')).toBe(true);
		expect(safeEqual('setup-token', 'setup-tokeN')).toBe(false);
		expect(safeEqual('setup-token', 'setup-token-longer')).toBe(false);
		expect(safeEqual('', 'setup-token')).toBe(false);
	});
});

describe('emergency recovery key', () => {
	it('generates formatted, unique keys and normalizes typed ones', () => {
		const key = generateRecoveryKey();
		expect(key).toMatch(RECOVERY_KEY_FORMAT);
		expect(generateRecoveryKey()).not.toBe(key);
		expect(normalizeRecoveryKey(' a1b2-c3d4 e5f6-a7b8 ')).toBe('A1B2C3D4E5F6A7B8');
	});

	it('uses up a recovery code when it is redeemed and returns its replacement', async () => {
		await seedAdmin('admin', 'admin@example.com', 'pass12345', 'AAAA-AAAA-AAAA-AAAA');

		expect(await redeemRecoveryKey('FFFF-0000-0000-0000')).toBeNull();
		const replacement = await redeemRecoveryKey('aaaa-aaaa-aaaa-aaaa');
		expect(replacement).toMatch(RECOVERY_KEY_FORMAT);

		expect(await recoveryKeyMatches('AAAA-AAAA-AAAA-AAAA')).toBe(false);
		expect(await redeemRecoveryKey('AAAA-AAAA-AAAA-AAAA')).toBeNull();
		expect(await recoveryKeyMatches(replacement!)).toBe(true);
	});

	it('lets only one of two simultaneous redemptions of the same code succeed', async () => {
		await seedAdmin('admin', 'admin@example.com', 'pass12345', 'AAAA-AAAA-AAAA-AAAA');

		const results = await Promise.all([
			redeemRecoveryKey('AAAA-AAAA-AAAA-AAAA'),
			redeemRecoveryKey('AAAA-AAAA-AAAA-AAAA')
		]);

		const winners = results.filter((key): key is string => key !== null);
		expect(winners).toHaveLength(1);
		expect(await recoveryKeyMatches(winners[0])).toBe(true);
	});
});

describe('first-time setup', () => {
	it('creates the admin account once and refuses to overwrite it', async () => {
		expect(
			await createAdmin('first', 'First@Example.com', 'first-password', 'AAAA-AAAA-AAAA-AAAA')
		).toBe(true);
		expect(
			await createAdmin('second', 'second@example.com', 'second-password', 'BBBB-BBBB-BBBB-BBBB')
		).toBe(false);

		expect(getAdminProfile()).toEqual({ username: 'first', email: 'first@example.com' });
		expect(await checkPassword('first-password')).toBe(true);
		expect(await recoveryKeyMatches('AAAA-AAAA-AAAA-AAAA')).toBe(true);
		expect(await recoveryKeyMatches('BBBB-BBBB-BBBB-BBBB')).toBe(false);
	});

	it('lets only one of two simultaneous setup requests win', async () => {
		const results = await Promise.all([
			createAdmin('first', 'first@example.com', 'first-password', 'AAAA-AAAA-AAAA-AAAA'),
			createAdmin('second', 'second@example.com', 'second-password', 'BBBB-BBBB-BBBB-BBBB')
		]);

		expect(results.filter(Boolean)).toHaveLength(1);
		expect(rowCount('admin_user')).toBe(1);
		const winner = results[0] ? 'first-password' : 'second-password';
		expect(await checkPassword(winner)).toBe(true);
	});
});

describe('input validation', () => {
	it('requires at least 8 characters and a matching confirmation', () => {
		expect(validateNewPassword('1234567', '1234567')).toMatch(/at least 8 characters/);
		expect(validateNewPassword('12345678', '12345678')).toBeNull();
		expect(validateNewPassword('long-enough', 'different')).toBe('Passwords do not match.');
		expect(validateNewPassword('long-enough', 'long-enough ')).toBe('Passwords do not match.');
	});

	it('accepts only plausible email addresses', () => {
		expect(isValidEmail('first.last+tag@sub.example.co')).toBe(true);
		for (const email of ['', 'me@example', '@example.com', 'me @example.com', 'me@@example.com']) {
			expect(isValidEmail(email), email).toBe(false);
		}
	});
});

describe.each([
	{
		name: 'reset token',
		table: 'password_reset_tokens',
		lifetime: 15 * MINUTE,
		create: createPasswordResetToken,
		verify: verifyResetToken
	},
	{
		name: 'session',
		table: 'sessions',
		lifetime: 7 * DAY,
		create: createSession,
		verify: verifySessionToken
	}
])('$name storage', ({ table, lifetime, create, verify }) => {
	it('stores only a hash and accepts nothing but the issued token', () => {
		const token = create();
		const { token_hash: stored } = testDb.prepare(`SELECT token_hash FROM ${table}`).get() as {
			token_hash: string;
		};

		expect(stored).not.toBe(token);
		expect(stored).toMatch(/^[0-9a-f]{64}$/);
		for (const wrong of [stored, 'unknown-token', '', null, undefined]) {
			expect(verify(wrong)).toBe(false);
		}
		expect(verify(token)).toBe(true);
	});

	it('removes a token at the exact end of its lifetime', () => {
		const token = create();

		advanceClock(lifetime - 1);
		expect(verify(token)).toBe(true);

		advanceClock(1);
		expect(verify(token)).toBe(false);
		expect(rowCount(table)).toBe(0);
	});
});

describe('email reset link and password reset tokens', () => {
	const linkToken = (call = 0) =>
		new URL(sentEmail.mock.calls[call][1]).searchParams.get('token') as string;

	it('invalidates the previous link when a new one is issued', () => {
		const first = createPasswordResetToken();
		const second = createPasswordResetToken();

		expect(verifyResetToken(first)).toBe(false);
		expect(verifyResetToken(second)).toBe(true);
	});

	it('redeems a reset token only once, even for simultaneous requests', async () => {
		await seedAdmin('admin', 'admin@example.com', 'initial-pass');
		const token = createPasswordResetToken();

		const results = await Promise.all([
			resetPasswordWithToken(token, 'first-new-password'),
			resetPasswordWithToken(token, 'second-new-password')
		]);

		expect(results).toEqual([true, false]);
		expect(await checkPassword('first-new-password')).toBe(true);
		expect(await resetPasswordWithToken(token, 'third-new-password')).toBe(false);
		expect(await checkPassword('first-new-password')).toBe(true);
	});

	it('emails a working link when the username or email is submitted', async () => {
		await seedAdmin('siteadmin', 'contact@example.com', 'secretpass');

		for (const [call, identifier] of [' CONTACT@example.com ', 'SiteAdmin'].entries()) {
			expect(await requestEmailPasswordReset(identifier, 'https://example.test')).toBe(true);

			const [to, link] = sentEmail.mock.calls[call];
			expect(to).toBe('contact@example.com');
			expect(link.startsWith('https://example.test/admin/reset?token=')).toBe(true);
			expect(verifyResetToken(linkToken(call))).toBe(true);
		}
	});

	it('keeps the earlier link and drops the new one when the email cannot be sent', async () => {
		await seedAdmin('siteadmin', 'contact@example.com', 'secretpass');
		const earlier = createPasswordResetToken();
		sentEmail.mockResolvedValueOnce(false);

		expect(await requestEmailPasswordReset('siteadmin', 'https://example.test')).toBe(false);

		expect(verifyResetToken(earlier)).toBe(true);
		expect(verifyResetToken(linkToken())).toBe(false);
	});

	it('replaces the earlier link once the new one has been sent', async () => {
		await seedAdmin('siteadmin', 'contact@example.com', 'secretpass');
		const earlier = createPasswordResetToken();

		expect(await requestEmailPasswordReset('siteadmin', 'https://example.test')).toBe(true);

		expect(verifyResetToken(earlier)).toBe(false);
		expect(verifyResetToken(linkToken())).toBe(true);
	});

	it('invalidates a link still being sent when an earlier one resets the password', async () => {
		await seedAdmin('siteadmin', 'contact@example.com', 'secretpass');
		const earlier = createPasswordResetToken();
		sentEmail.mockImplementationOnce(async () => {
			expect(await resetPasswordWithToken(earlier, 'brand-new-password')).toBe(true);
			return true;
		});

		await requestEmailPasswordReset('siteadmin', 'https://example.test');

		expect(verifyResetToken(linkToken())).toBe(false);
	});
});

describe('sessions', () => {
	it('deletes only the given session and sweeps expired ones', () => {
		const expired = createSession();
		advanceClock(7 * DAY);
		const signedOut = createSession();
		const other = createSession();

		deleteSession(signedOut);

		expect(verifySessionToken(signedOut)).toBe(false);
		expect(verifySessionToken(other)).toBe(true);
		expect(rowCount('sessions')).toBe(1);
		expect(verifySessionToken(expired)).toBe(false);

		advanceClock(7 * DAY);
		deleteSession(undefined);
		expect(rowCount('sessions')).toBe(0);
	});

	it('signs a browser in with a hardened cookie and signs it out again', () => {
		const cookies = fakeCookies();

		startSession(cookies as never);
		const token = cookies.get(SESSION_COOKIE_NAME);
		expect(verifySessionToken(token)).toBe(true);
		expect(cookies.options.get(SESSION_COOKIE_NAME)).toEqual({
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 7 * 24 * 60 * 60
		});
		expect(sessionCookieOptions.secure).toBe(true);

		endSession(cookies as never);
		expect(cookies.get(SESSION_COOKIE_NAME)).toBeUndefined();
		expect(verifySessionToken(token)).toBe(false);
	});
});

function limiterHelpers(guard: typeof loginAttempts.guard) {
	const fail = (address: string) => guard(address, async () => false);
	const failTimes = async (address: string, times: number) => {
		for (let i = 0; i < times; i++) await fail(address);
	};
	// A passing check records nothing, so it can probe the lockout without changing it.
	const isLocked = async (address: string, limiter = guard) =>
		(await limiter(address, async () => true)) === 'locked';
	return { fail, failTimes, isLocked };
}

describe.each([
	{
		name: 'login',
		guard: loginAttempts.guard,
		otherGuard: resetAttempts.guard,
		clear: loginAttempts.clear
	},
	{
		name: 'password reset',
		guard: resetAttempts.guard,
		otherGuard: loginAttempts.guard,
		clear: resetAttempts.clear
	}
])('$name attempt limiter', ({ guard, otherGuard, clear }) => {
	const { failTimes, isLocked } = limiterHelpers(guard);

	it('tracks each address separately and leaves the other limiter alone', async () => {
		const address = uniqueAddress();
		await failTimes(address, 5);

		expect(await isLocked(address)).toBe(true);
		expect(await isLocked(uniqueAddress())).toBe(false);
		expect(await isLocked(address, otherGuard)).toBe(false);
	});

	it('clears the lockout and the failure count on success', async () => {
		const address = uniqueAddress();
		await failTimes(address, 5);
		clear(address);
		expect(await isLocked(address)).toBe(false);

		await failTimes(address, 4);
		expect(await isLocked(address)).toBe(false);
	});
});

// Both limiters share one implementation, so its counting and timing are tested once.
describe('attempt limiter timing', () => {
	const { fail, failTimes, isLocked } = limiterHelpers(loginAttempts.guard);

	it('counts failures within a 15 minute window', async () => {
		const address = uniqueAddress();
		await failTimes(address, 4);
		advanceClock(15 * MINUTE - 1);
		await fail(address);
		expect(await isLocked(address)).toBe(true);
	});

	it('forgets failures older than 15 minutes', async () => {
		const address = uniqueAddress();
		await failTimes(address, 4);
		advanceClock(15 * MINUTE);
		await fail(address);
		expect(await isLocked(address)).toBe(false);

		await failTimes(address, 3);
		expect(await isLocked(address)).toBe(false);
		await fail(address);
		expect(await isLocked(address)).toBe(true);
	});

	it('keeps the lockout for a full 15 minutes from the moment it starts', async () => {
		const address = uniqueAddress();
		await failTimes(address, 4);
		advanceClock(14 * MINUTE);
		await fail(address);

		advanceClock(15 * MINUTE - 1);
		expect(await isLocked(address)).toBe(true);
		advanceClock(1);
		expect(await isLocked(address)).toBe(false);
	});
});

describe('guarded secret checks', () => {
	const failLogin = (address: string) => loginAttempts.guard(address, async () => false);

	it('counts falsy results as failures and refuses to run the check once locked', async () => {
		const address = uniqueAddress();
		const wrong = vi.fn(async () => false);

		for (let i = 0; i < 5; i++) expect(await loginAttempts.guard(address, wrong)).toBe(false);

		expect(await loginAttempts.guard(address, wrong)).toBe('locked');
		expect(wrong).toHaveBeenCalledTimes(5);
	});

	it('holds the limit when many attempts arrive at once', async () => {
		const address = uniqueAddress();
		const wrong = vi.fn(async () => {
			await new Promise((resolve) => setTimeout(resolve, 1));
			return null;
		});

		const results = await Promise.all(
			Array.from({ length: 20 }, () => resetAttempts.guard(address, wrong))
		);

		expect(wrong).toHaveBeenCalledTimes(5);
		expect(results.filter((result) => result === 'locked')).toHaveLength(15);
	});

	it('passes a successful result through without recording a failure', async () => {
		const address = uniqueAddress();
		for (let i = 0; i < 4; i++) await failLogin(address);

		expect(await loginAttempts.guard(address, async () => ({ ok: true }))).toEqual({ ok: true });
		expect(await loginAttempts.guard(address, async () => 'not locked')).toBe('not locked');
	});

	it('keeps working after a check throws, without counting it as a failure', async () => {
		const address = uniqueAddress();
		for (let i = 0; i < 4; i++) await failLogin(address);

		await expect(
			loginAttempts.guard(address, async () => {
				throw new Error('database unavailable');
			})
		).rejects.toThrow('database unavailable');

		expect(await loginAttempts.guard(address, async () => 'still running')).toBe('still running');
	});
});

describe('two-factor authentication', () => {
	const RECOVERY_KEY = 'A1B2-C3D4-E5F6-A7B8';
	const currentCode = (secret: string, offset = 0) => totpCode(secret, totpStep() + offset);
	const adminRow = () =>
		testDb
			.prepare('SELECT totp_secret, totp_pending_secret, totp_last_step FROM admin_user')
			.get() as {
			totp_secret: string | null;
			totp_pending_secret: string | null;
			totp_last_step: number | null;
		};
	/** Turns 2FA on with the previous code, leaving the current and next ones unused. */
	const enableTotp = () => {
		const secret = startTotpSetup();
		expect(confirmTotpSetup(currentCode(secret, -1))).toBe(true);
		return secret;
	};

	beforeEach(async () => {
		await seedAdmin('admin', 'admin@example.com', 'supersecret123', RECOVERY_KEY);
	});

	it('only turns on after the pending secret is confirmed with a valid code', () => {
		expect(isTotpEnabled()).toBe(false);
		expect(confirmTotpSetup('123456')).toBe(false);

		const secret = startTotpSetup();
		expect(getPendingTotpSecret()).toBe(secret);
		expect(isTotpEnabled()).toBe(false);

		// A code from 5 steps (2.5 minutes) ahead is outside the drift window.
		expect(confirmTotpSetup(currentCode(secret, 5))).toBe(false);
		expect(isTotpEnabled()).toBe(false);
		expect(getPendingTotpSecret()).toBe(secret);

		expect(confirmTotpSetup(currentCode(secret))).toBe(true);
		expect(isTotpEnabled()).toBe(true);
		expect(getPendingTotpSecret()).toBeNull();
	});

	it('stores pending and enabled secrets as ciphertext', () => {
		const secret = startTotpSetup();
		expect(adminRow().totp_pending_secret).toMatch(/^v1:/);
		expect(adminRow().totp_pending_secret).not.toContain(secret);
		expect(getPendingTotpSecret()).toBe(secret);

		expect(confirmTotpSetup(currentCode(secret))).toBe(true);
		expect(adminRow().totp_secret).toMatch(/^v1:/);
		expect(adminRow().totp_secret).not.toContain(secret);
	});

	it('fails closed on an unreadable secret but keeps recovery available', async () => {
		const secret = enableTotp();

		process.env.TOTP_ENCRYPTION_KEY = 'wrong-key-that-is-also-longer-than-32-bytes';
		expect(isTotpEnabled()).toBe(true);
		expect(verifyTotpCode(currentCode(secret))).toBe(false);
		expect(await verifySecondFactor(RECOVERY_KEY)).toMatchObject({ method: 'recovery' });

		process.env.TOTP_ENCRYPTION_KEY = TEST_TOTP_ENCRYPTION_KEY;
		testDb.prepare('UPDATE admin_user SET totp_secret = ? WHERE id = 1').run(secret);
		expect(verifyTotpCode(currentCode(secret))).toBe(false);
	});

	it('accepts each code only once and rejects older ones', () => {
		const secret = enableTotp();

		// The confirming code (and anything older) can't be reused.
		expect(verifyTotpCode(currentCode(secret, -1))).toBe(false);
		expect(verifyTotpCode(currentCode(secret))).toBe(true);
		expect(verifyTotpCode(currentCode(secret))).toBe(false);
		expect(verifyTotpCode(currentCode(secret, -1))).toBe(false);
		expect(verifyTotpCode(currentCode(secret, 1))).toBe(true);
	});

	it('accepts an authenticator code or the recovery code as a second factor', async () => {
		const secret = enableTotp();
		expect(await verifySecondFactor('WRONG-CODE')).toBeNull();
		expect(await verifySecondFactor(currentCode(secret, 5))).toBeNull();

		const spaced = currentCode(secret).replace(/^(\d{3})/, '$1 ');
		expect(await verifySecondFactor(spaced)).toEqual({ method: 'totp' });

		const pairs = currentCode(secret, 1).replace(/(\d{2})(?=\d)/g, '$1 ');
		expect(await verifySecondFactor(pairs)).toEqual({ method: 'totp' });

		const factor = await verifySecondFactor('a1b2-c3d4-e5f6-a7b8');
		expect(factor).toMatchObject({ method: 'recovery' });
		// The recovery code is single-use: only its replacement works afterwards.
		expect(await verifySecondFactor('a1b2-c3d4-e5f6-a7b8')).toBeNull();
		const replacement = factor?.method === 'recovery' ? factor.newRecoveryKey : '';
		expect(await verifySecondFactor(replacement)).toMatchObject({ method: 'recovery' });
	});

	it('completes a login challenge with a valid code and discards it after use', async () => {
		const secret = enableTotp();
		const token = createTwoFactorChallenge();
		expect(hasTwoFactorChallenge(token)).toBe(true);

		expect(await completeTwoFactorChallenge(token, currentCode(secret))).toEqual({
			method: 'totp'
		});

		expect(hasTwoFactorChallenge(token)).toBe(false);
		expect(await completeTwoFactorChallenge(token, currentCode(secret, 1))).toBeNull();
	});

	it('rejects missing and unknown challenges without spending the code', async () => {
		const secret = enableTotp();
		expect(hasTwoFactorChallenge(undefined)).toBe(false);
		expect(hasTwoFactorChallenge(null)).toBe(false);
		expect(await completeTwoFactorChallenge(undefined, currentCode(secret))).toBeNull();
		expect(await completeTwoFactorChallenge('not-a-token', currentCode(secret))).toBeNull();

		expect(verifyTotpCode(currentCode(secret))).toBe(true);
	});

	it('discards pending logins when sessions are revoked', () => {
		const token = createTwoFactorChallenge();
		invalidateAllSessions();
		expect(hasTwoFactorChallenge(token)).toBe(false);
	});

	it('ends a login cancelled during its code check, keeping the recovery code', async () => {
		const token = createTwoFactorChallenge();

		const pending = completeTwoFactorChallenge(token, RECOVERY_KEY);
		cancelTwoFactorChallenge(token);

		expect(await pending).toBeNull();
		expect(await verifySecondFactor(RECOVERY_KEY)).toMatchObject({ method: 'recovery' });
	});

	it('keeps a login challenge for exactly 5 minutes', () => {
		const token = createTwoFactorChallenge();

		advanceClock(5 * MINUTE - 1);
		expect(hasTwoFactorChallenge(token)).toBe(true);

		advanceClock(1);
		expect(hasTwoFactorChallenge(token)).toBe(false);
	});

	it('limits the challenge cookie to the login page', () => {
		expect(twoFactorCookieOptions).toEqual({
			path: '/admin/login',
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 5 * 60
		});
	});

	it('turns off and forgets the secret', () => {
		const secret = enableTotp();
		disableTotp();

		expect(isTotpEnabled()).toBe(false);
		expect(verifyTotpCode(currentCode(secret, 1))).toBe(false);
		expect(adminRow()).toEqual({
			totp_secret: null,
			totp_pending_secret: null,
			totp_last_step: null
		});
	});
});
