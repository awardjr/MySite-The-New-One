import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/server/db', async () => {
	const { getTestDb } = await import('./test-db');
	return { db: getTestDb() };
});

import { getTestDb } from './test-db';
import {
	checkCredentials,
	checkPassword,
	createAdmin,
	createPasswordResetToken,
	createSession,
	deleteSession,
	generateRecoveryKey,
	getAdminProfile,
	guardLogin,
	guardReset,
	hasRecoveryKey,
	invalidateAllResetTokens,
	invalidateAllSessions,
	isAdminConfigured,
	isLoginLocked,
	isResetLocked,
	normalizeRecoveryKey,
	recordFailedLogin,
	recordFailedReset,
	recordSuccessfulLogin,
	recordSuccessfulReset,
	redeemRecoveryKey,
	requestEmailPasswordReset,
	resetPasswordWithRecoveryKey,
	resetPasswordWithToken,
	setAdminCredentials,
	setRecoveryKey,
	updateAdminProfile,
	verifyRecoveryKey,
	verifyResetToken,
	verifySessionToken,
	cancelTotpSetup,
	completeTwoFactorChallenge,
	confirmTotpSetup,
	createTwoFactorChallenge,
	disableTotp,
	getPendingTotpSecret,
	hasTwoFactorChallenge,
	isTotpEnabled,
	startTotpSetup,
	verifySecondFactor,
	verifyTotpCode,
	validateNewPassword
} from '../src/lib/server/auth';
import { totpCode, totpStep } from '../src/lib/server/totp';

const testDb = getTestDb();
const TEST_TOTP_ENCRYPTION_KEY = 'test-only-totp-encryption-key-with-more-than-32-bytes';

beforeEach(() => {
	process.env.TOTP_ENCRYPTION_KEY = TEST_TOTP_ENCRYPTION_KEY;
	testDb.exec('DELETE FROM admin_user');
	testDb.exec('DELETE FROM sessions');
	testDb.exec('DELETE FROM password_reset_tokens');
});

describe('admin credentials and profile', () => {
	it('is not configured until credentials are set', async () => {
		expect(isAdminConfigured()).toBe(false);
		expect(getAdminProfile()).toBeNull();
	});

	it('configures username, email, password, and recovery key', async () => {
		await setAdminCredentials(
			'adminuser',
			'admin@example.com',
			'supersecret123',
			'A1B2-C3D4-E5F6-G7H8'
		);
		expect(isAdminConfigured()).toBe(true);

		const profile = getAdminProfile();
		expect(profile).toEqual({
			username: 'adminuser',
			email: 'admin@example.com'
		});
		expect(hasRecoveryKey()).toBe(true);
		expect(await checkPassword('supersecret123')).toBe(true);
	});

	it('verifies login credentials by username or email case-insensitively', async () => {
		await setAdminCredentials('MyUsername', 'Admin@Example.COM', 'correct-password');

		expect(await checkCredentials('MyUsername', 'correct-password')).toBe(true);
		expect(await checkCredentials('myusername', 'correct-password')).toBe(true);
		expect(await checkCredentials('admin@example.com', 'correct-password')).toBe(true);
		expect(await checkCredentials('ADMIN@EXAMPLE.COM', 'correct-password')).toBe(true);

		expect(await checkCredentials('wronguser', 'correct-password')).toBe(false);
		expect(await checkCredentials('', 'correct-password')).toBe(false);
		expect(await checkCredentials('   ', 'correct-password')).toBe(false);
		expect(await checkCredentials('myusername', '')).toBe(false);
		expect(await checkCredentials('myusername', 'wrong-password')).toBe(false);
		expect(await checkCredentials('admin@example.com', 'wrong-password')).toBe(false);
	});

	it('updates admin profile username and email', async () => {
		await setAdminCredentials('olduser', 'old@example.com', 'password123');
		updateAdminProfile('newuser', 'new@example.com');

		const profile = getAdminProfile();
		expect(profile).toEqual({
			username: 'newuser',
			email: 'new@example.com'
		});
		expect(await checkCredentials('newuser', 'password123')).toBe(true);
	});
});

describe('emergency recovery key', () => {
	it('generates formatted recovery keys and normalizes them', async () => {
		const key = generateRecoveryKey();
		expect(key).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
		expect(normalizeRecoveryKey(' a1b2-c3d4-e5f6-g7h8 ')).toBe('A1B2C3D4E5F6G7H8');
	});

	it('verifies a valid recovery key ignoring hyphens and case', async () => {
		await setAdminCredentials('admin', 'admin@example.com', 'pass12345', '1234-ABCD-5678-EF90');

		expect(await verifyRecoveryKey('1234-ABCD-5678-EF90')).toBe(true);
		expect(await verifyRecoveryKey('1234abcd5678ef90')).toBe(true);
		expect(await verifyRecoveryKey(' 1234-abcd-5678-ef90 ')).toBe(true);
		expect(await verifyRecoveryKey('wrong-recovery-key-1')).toBe(false);
	});

	it('rotates the recovery key when setRecoveryKey is called', async () => {
		await setAdminCredentials('admin', 'admin@example.com', 'pass12345', 'AAAA-AAAA-AAAA-AAAA');
		expect(await verifyRecoveryKey('AAAA-AAAA-AAAA-AAAA')).toBe(true);

		await setRecoveryKey('BBBB-BBBB-BBBB-BBBB');
		expect(await verifyRecoveryKey('AAAA-AAAA-AAAA-AAAA')).toBe(false);
		expect(await verifyRecoveryKey('BBBB-BBBB-BBBB-BBBB')).toBe(true);
	});

	it('resets password using emergency recovery code and revokes active sessions', async () => {
		await setAdminCredentials('admin', 'admin@example.com', 'old-password', 'RECO-VERY-CODE-1234');
		const sessionToken = createSession();
		expect(verifySessionToken(sessionToken)).toBe(true);

		const newKey = await resetPasswordWithRecoveryKey('reco-very-code-1234', 'brand-new-password');
		expect(newKey).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

		expect(await checkPassword('brand-new-password')).toBe(true);
		expect(await checkPassword('old-password')).toBe(false);
		expect(verifySessionToken(sessionToken)).toBe(false);
	});

	it('rejects a wrong recovery code without changing the password', async () => {
		await setAdminCredentials('admin', 'admin@example.com', 'old-password', 'RECO-VERY-CODE-1234');

		expect(await resetPasswordWithRecoveryKey('WRONG-CODE-0000-0000', 'new-password')).toBeNull();
		expect(await checkPassword('old-password')).toBe(true);
		expect(await verifyRecoveryKey('RECO-VERY-CODE-1234')).toBe(true);
	});

	it('uses up a recovery code when it is redeemed and returns its replacement', async () => {
		await setAdminCredentials('admin', 'admin@example.com', 'pass12345', 'AAAA-AAAA-AAAA-AAAA');

		expect(await redeemRecoveryKey('WRONG-CODE-0000-0000')).toBeNull();
		const replacement = await redeemRecoveryKey('aaaa-aaaa-aaaa-aaaa');
		expect(replacement).not.toBeNull();

		expect(await verifyRecoveryKey('AAAA-AAAA-AAAA-AAAA')).toBe(false);
		expect(await redeemRecoveryKey('AAAA-AAAA-AAAA-AAAA')).toBeNull();
		expect(await verifyRecoveryKey(replacement!)).toBe(true);
	});

	it('lets only one of two simultaneous redemptions of the same code succeed', async () => {
		await setAdminCredentials('admin', 'admin@example.com', 'pass12345', 'AAAA-AAAA-AAAA-AAAA');

		const results = await Promise.all([
			redeemRecoveryKey('AAAA-AAAA-AAAA-AAAA'),
			redeemRecoveryKey('AAAA-AAAA-AAAA-AAAA')
		]);
		expect(results.filter(Boolean)).toHaveLength(1);
	});
});

describe('first-time setup', () => {
	it('creates the admin account once and refuses to overwrite it', async () => {
		expect(
			await createAdmin('first', 'first@example.com', 'first-password', 'AAAA-AAAA-AAAA-AAAA')
		).toBe(true);
		expect(
			await createAdmin('second', 'second@example.com', 'second-password', 'BBBB-BBBB-BBBB-BBBB')
		).toBe(false);

		expect(getAdminProfile()).toEqual({ username: 'first', email: 'first@example.com' });
		expect(await checkPassword('first-password')).toBe(true);
	});

	it('lets only one of two simultaneous setup requests win', async () => {
		const results = await Promise.all([
			createAdmin('first', 'first@example.com', 'first-password', 'AAAA-AAAA-AAAA-AAAA'),
			createAdmin('second', 'second@example.com', 'second-password', 'BBBB-BBBB-BBBB-BBBB')
		]);
		expect(results.filter(Boolean)).toHaveLength(1);
	});
});

describe('new password validation', () => {
	it('requires a minimum length and a matching confirmation', () => {
		expect(validateNewPassword('short', 'short')).toMatch(/at least 8 characters/);
		expect(validateNewPassword('long-enough', 'different')).toBe('Passwords do not match.');
		expect(validateNewPassword('long-enough', 'long-enough')).toBeNull();
	});
});

describe('email reset link and password reset tokens', () => {
	it('creates and verifies a valid single-use reset token', async () => {
		const token = createPasswordResetToken();
		expect(verifyResetToken(token)).toBe(true);
	});

	it('rejects an unknown or expired reset token', async () => {
		expect(verifyResetToken('fake-token')).toBe(false);
		expect(verifyResetToken(null)).toBe(false);

		const token = createPasswordResetToken();
		testDb
			.prepare('UPDATE password_reset_tokens SET expires_at = ?')
			.run(new Date(Date.now() - 1000).toISOString());

		expect(verifyResetToken(token)).toBe(false);
	});

	it('stores only a hash of the reset token', async () => {
		const token = createPasswordResetToken();
		const rows = testDb.prepare('SELECT token_hash FROM password_reset_tokens').all() as {
			token_hash: string;
		}[];
		expect(rows).toHaveLength(1);
		expect(rows[0].token_hash).not.toBe(token);
		expect(rows[0].token_hash).toMatch(/^[0-9a-f]{64}$/);
	});

	it('redeems a reset token only once, even for simultaneous requests', async () => {
		await setAdminCredentials('admin', 'admin@example.com', 'initial-pass');
		const token = createPasswordResetToken();

		const results = await Promise.all([
			resetPasswordWithToken(token, 'first-new-password'),
			resetPasswordWithToken(token, 'second-new-password')
		]);
		expect(results).toEqual([true, false]);
		expect(await checkPassword('first-new-password')).toBe(true);
	});

	it('invalidates all reset tokens', async () => {
		const token = createPasswordResetToken();
		invalidateAllResetTokens();
		expect(verifyResetToken(token)).toBe(false);
	});

	it('dispatches email reset request when username or email matches', async () => {
		await setAdminCredentials('siteadmin', 'contact@example.com', 'secretpass');

		const matchedEmail = await requestEmailPasswordReset(
			'contact@example.com',
			'http://localhost:5173'
		);
		expect(matchedEmail).toBe(true);

		const matchedUser = await requestEmailPasswordReset('siteadmin', 'http://localhost:5173');
		expect(matchedUser).toBe(true);

		const notMatched = await requestEmailPasswordReset(
			'unknown@example.com',
			'http://localhost:5173'
		);
		expect(notMatched).toBe(false);
	});

	it('resets password with token, consumes token, and revokes sessions', async () => {
		await setAdminCredentials('admin', 'admin@example.com', 'initial-pass');
		const sessionToken = createSession();
		const resetToken = createPasswordResetToken();

		expect(verifyResetToken(resetToken)).toBe(true);

		const result = await resetPasswordWithToken(resetToken, 'fresh-password-123');
		expect(result).toBe(true);

		expect(await checkPassword('fresh-password-123')).toBe(true);
		expect(await checkPassword('initial-pass')).toBe(false);
		expect(verifyResetToken(resetToken)).toBe(false);
		expect(verifySessionToken(sessionToken)).toBe(false);
	});
});

describe('sessions', () => {
	it('creates a session that verifies as valid', async () => {
		const token = createSession();
		expect(verifySessionToken(token)).toBe(true);
	});

	it('rejects a missing token', async () => {
		expect(verifySessionToken(undefined)).toBe(false);
		expect(verifySessionToken(null)).toBe(false);
	});

	it('rejects an unknown token', async () => {
		expect(verifySessionToken('not-a-real-token')).toBe(false);
	});

	it('rejects a token after it has been deleted', async () => {
		const token = createSession();
		deleteSession(token);
		expect(verifySessionToken(token)).toBe(false);
	});

	it('rejects and removes an expired session', async () => {
		const token = createSession();
		testDb
			.prepare('UPDATE sessions SET expires_at = ?')
			.run(new Date(Date.now() - 1000).toISOString());

		expect(verifySessionToken(token)).toBe(false);

		expect(testDb.prepare('SELECT token_hash FROM sessions').all()).toEqual([]);
	});

	it('stores only a hash of the session id', async () => {
		const token = createSession();
		const rows = testDb.prepare('SELECT token_hash FROM sessions').all() as {
			token_hash: string;
		}[];
		expect(rows).toHaveLength(1);
		expect(rows[0].token_hash).not.toBe(token);
		expect(rows[0].token_hash).toMatch(/^[0-9a-f]{64}$/);
	});

	it('invalidates every session at once', async () => {
		const tokenA = createSession();
		const tokenB = createSession();

		invalidateAllSessions();

		expect(verifySessionToken(tokenA)).toBe(false);
		expect(verifySessionToken(tokenB)).toBe(false);
	});
});

describe('brute force attempt lockouts', () => {
	it('locks out login attempts after threshold and clears on success', async () => {
		expect(isLoginLocked('1.1.1.1')).toBe(false);

		for (let i = 0; i < 5; i++) {
			recordFailedLogin('1.1.1.1');
		}
		expect(isLoginLocked('1.1.1.1')).toBe(true);

		recordSuccessfulLogin('1.1.1.1');
		expect(isLoginLocked('1.1.1.1')).toBe(false);
	});

	it('locks out reset attempts after threshold and clears on success', async () => {
		expect(isResetLocked('2.2.2.2')).toBe(false);

		for (let i = 0; i < 5; i++) {
			recordFailedReset('2.2.2.2');
		}
		expect(isResetLocked('2.2.2.2')).toBe(true);

		recordSuccessfulReset('2.2.2.2');
		expect(isResetLocked('2.2.2.2')).toBe(false);
	});

	it('forgets old failures and lifts the lockout after 15 minutes', async () => {
		vi.useFakeTimers();
		try {
			for (let i = 0; i < 4; i++) recordFailedLogin('3.3.3.3');
			vi.advanceTimersByTime(15 * 60 * 1000);
			recordFailedLogin('3.3.3.3');
			expect(isLoginLocked('3.3.3.3')).toBe(false);

			for (let i = 0; i < 4; i++) recordFailedLogin('3.3.3.3');
			expect(isLoginLocked('3.3.3.3')).toBe(true);
			vi.advanceTimersByTime(15 * 60 * 1000);
			expect(isLoginLocked('3.3.3.3')).toBe(false);
		} finally {
			vi.useRealTimers();
		}
	});
});

describe('guarded secret checks', () => {
	it('counts falsy results as failures and refuses to run the check once locked', async () => {
		let calls = 0;
		const wrong = async () => {
			calls++;
			return false;
		};

		for (let i = 0; i < 5; i++) expect(await guardLogin('4.4.4.4', wrong)).toBe(false);
		expect(isLoginLocked('4.4.4.4')).toBe(true);

		expect(await guardLogin('4.4.4.4', wrong)).toBe('locked');
		expect(calls).toBe(5);
	});

	it('holds the limit when many attempts arrive at once', async () => {
		let calls = 0;
		const wrong = async () => {
			calls++;
			await new Promise((resolve) => setTimeout(resolve, 1));
			return null;
		};

		const results = await Promise.all(
			Array.from({ length: 20 }, () => guardReset('5.5.5.5', wrong))
		);
		expect(calls).toBe(5);
		expect(results.filter((result) => result === 'locked')).toHaveLength(15);
	});

	it('passes a successful result through without recording a failure', async () => {
		expect(await guardLogin('6.6.6.6', async () => ({ ok: true }))).toEqual({ ok: true });
		expect(isLoginLocked('6.6.6.6')).toBe(false);
	});
});

describe('two-factor authentication', () => {
	const currentCode = (secret: string, offset = 0) => totpCode(secret, totpStep() + offset);

	beforeEach(async () => {
		await setAdminCredentials(
			'admin',
			'admin@example.com',
			'supersecret123',
			'A1B2-C3D4-E5F6-G7H8'
		);
	});

	it('only turns on after the pending secret is confirmed with a valid code', async () => {
		expect(isTotpEnabled()).toBe(false);
		const secret = startTotpSetup();
		expect(getPendingTotpSecret()).toBe(secret);
		expect(isTotpEnabled()).toBe(false);

		// A code from 5 steps (2.5 minutes) ahead is outside the drift window.
		expect(confirmTotpSetup(currentCode(secret, 5))).toBe(false);
		expect(isTotpEnabled()).toBe(false);

		expect(confirmTotpSetup(currentCode(secret))).toBe(true);
		expect(isTotpEnabled()).toBe(true);
		expect(getPendingTotpSecret()).toBeNull();
	});

	it('stores pending and enabled secrets as ciphertext', async () => {
		const secret = startTotpSetup();
		const pending = testDb
			.prepare('SELECT totp_pending_secret FROM admin_user WHERE id = 1')
			.get() as { totp_pending_secret: string };
		expect(pending.totp_pending_secret).toMatch(/^v1:/);
		expect(pending.totp_pending_secret).not.toContain(secret);
		expect(getPendingTotpSecret()).toBe(secret);

		expect(confirmTotpSetup(currentCode(secret))).toBe(true);
		const active = testDb.prepare('SELECT totp_secret FROM admin_user WHERE id = 1').get() as {
			totp_secret: string;
		};
		expect(active.totp_secret).toMatch(/^v1:/);
		expect(active.totp_secret).not.toContain(secret);
	});

	it('upgrades legacy plaintext TOTP secrets on read', async () => {
		const secret = startTotpSetup();
		testDb.prepare('UPDATE admin_user SET totp_pending_secret = ? WHERE id = 1').run(secret);
		expect(getPendingTotpSecret()).toBe(secret);
		const pending = testDb
			.prepare('SELECT totp_pending_secret FROM admin_user WHERE id = 1')
			.get() as { totp_pending_secret: string };
		expect(pending.totp_pending_secret).toMatch(/^v1:/);

		expect(confirmTotpSetup(currentCode(secret))).toBe(true);
		testDb.prepare('UPDATE admin_user SET totp_secret = ? WHERE id = 1').run(secret);
		expect(verifyTotpCode(currentCode(secret, 1))).toBe(true);
		const active = testDb.prepare('SELECT totp_secret FROM admin_user WHERE id = 1').get() as {
			totp_secret: string;
		};
		expect(active.totp_secret).toMatch(/^v1:/);
	});

	it('fails closed on an incorrect encryption key but keeps recovery available', async () => {
		const secret = startTotpSetup();
		expect(confirmTotpSetup(currentCode(secret, -1))).toBe(true);

		process.env.TOTP_ENCRYPTION_KEY = 'wrong-key-that-is-also-longer-than-32-bytes';
		try {
			expect(isTotpEnabled()).toBe(true);
			expect(verifyTotpCode(currentCode(secret))).toBe(false);
			expect(await verifySecondFactor('A1B2-C3D4-E5F6-G7H8')).toMatchObject({ method: 'recovery' });
		} finally {
			process.env.TOTP_ENCRYPTION_KEY = TEST_TOTP_ENCRYPTION_KEY;
		}
	});

	it('refuses to start setup without a sufficiently long encryption key', async () => {
		process.env.TOTP_ENCRYPTION_KEY = 'short';
		expect(() => startTotpSetup()).toThrow('TOTP_ENCRYPTION_KEY');
	});

	it('can cancel a pending setup without turning 2FA on', async () => {
		startTotpSetup();
		cancelTotpSetup();
		expect(getPendingTotpSecret()).toBeNull();
		expect(isTotpEnabled()).toBe(false);
	});

	it('accepts each code only once and rejects older ones', async () => {
		const secret = startTotpSetup();
		confirmTotpSetup(currentCode(secret, -1));

		// The confirming code (and anything older) can't be reused.
		expect(verifyTotpCode(currentCode(secret, -1))).toBe(false);
		expect(verifyTotpCode(currentCode(secret))).toBe(true);
		expect(verifyTotpCode(currentCode(secret))).toBe(false);
	});

	it('accepts the recovery code as a second factor', async () => {
		const secret = startTotpSetup();
		confirmTotpSetup(currentCode(secret));
		expect(await verifySecondFactor('WRONG-CODE')).toBeNull();
		expect(await verifySecondFactor(currentCode(secret, 5))).toBeNull();
		expect(await verifySecondFactor(currentCode(secret, 1))).toEqual({ method: 'totp' });

		const factor = await verifySecondFactor('a1b2-c3d4-e5f6-g7h8');
		expect(factor).toMatchObject({ method: 'recovery' });
		// The recovery code is single-use: only its replacement works afterwards.
		expect(await verifySecondFactor('a1b2-c3d4-e5f6-g7h8')).toBeNull();
		const replacement = factor?.method === 'recovery' ? factor.newRecoveryKey : '';
		expect(await verifySecondFactor(replacement)).toMatchObject({ method: 'recovery' });
	});

	it('completes a login challenge with a valid code and discards it after use', async () => {
		const secret = startTotpSetup();
		confirmTotpSetup(currentCode(secret, -1));

		const token = createTwoFactorChallenge();
		expect(hasTwoFactorChallenge(token)).toBe(true);
		expect(await completeTwoFactorChallenge(token, currentCode(secret))).toEqual({
			method: 'totp'
		});
		expect(hasTwoFactorChallenge(token)).toBe(false);
		expect(await completeTwoFactorChallenge('not-a-token', currentCode(secret, 1))).toBeNull();
	});

	it('discards a login challenge after too many wrong codes or when sessions are revoked', async () => {
		const secret = startTotpSetup();
		confirmTotpSetup(currentCode(secret));

		const token = createTwoFactorChallenge();
		for (let i = 0; i < 5; i++) await completeTwoFactorChallenge(token, 'WRONG-CODE');
		expect(hasTwoFactorChallenge(token)).toBe(false);
		expect(await completeTwoFactorChallenge(token, 'A1B2-C3D4-E5F6-G7H8')).toBeNull();

		const other = createTwoFactorChallenge();
		invalidateAllSessions();
		expect(hasTwoFactorChallenge(other)).toBe(false);
	});

	it('expires a login challenge after 5 minutes', async () => {
		vi.useFakeTimers();
		try {
			const token = createTwoFactorChallenge();
			vi.advanceTimersByTime(5 * 60 * 1000);
			expect(hasTwoFactorChallenge(token)).toBe(false);
		} finally {
			vi.useRealTimers();
		}
	});

	it('turns off and forgets the secret', async () => {
		const secret = startTotpSetup();
		confirmTotpSetup(currentCode(secret));
		disableTotp();
		expect(isTotpEnabled()).toBe(false);
		expect(verifyTotpCode(currentCode(secret, 1))).toBe(false);
	});
});
