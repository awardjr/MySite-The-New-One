import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/server/db.js', async () => {
	const { getTestDb } = await import('./test-db');
	return { db: getTestDb() };
});
vi.mock('#lib/server/email.js', () => ({ sendPasswordResetEmail: vi.fn(async () => true) }));
vi.mock('$app/env', () => ({ dev: false, browser: false }));

import { fakeCookies, loadPage, outcome, submit, uniqueAddress } from './route-helpers';
import { lockLogin, recoveryKeyMatches, seedAdmin } from './auth-helpers';
import { getTestDb } from './test-db';
import {
	checkCredentials,
	checkPassword,
	clearTwoFactorChallenges,
	confirmTotpSetup,
	createPasswordResetToken,
	createSession,
	createTwoFactorChallenge,
	getAdminProfile,
	getPendingTotpSecret,
	hasTwoFactorChallenge,
	isAdminConfigured,
	resetAttempts,
	isTotpEnabled,
	SESSION_COOKIE_NAME,
	startTotpSetup,
	TWO_FACTOR_COOKIE_NAME,
	verifyResetToken,
	verifySessionToken
} from '#lib/server/auth.js';
import { sendPasswordResetEmail } from '#lib/server/email.js';
import { totpCode, totpStep } from '#lib/server/totp.js';
import * as login from '../src/routes/admin/login/+page.server';
import * as setup from '../src/routes/admin/setup/+page.server';
import * as reset from '../src/routes/admin/reset/+page.server';
import * as forgot from '../src/routes/admin/forgot-password/+page.server';
import * as settings from '../src/routes/admin/(app)/settings/+page.server';
import { POST as logout } from '../src/routes/admin/logout/+server';

const testDb = getTestDb();
const PASSWORD = 'correct-password';
const NEW_PASSWORD = 'brand-new-password';
const RECOVERY_KEY = 'AAAA-BBBB-CCCC-DDDD';
const LOGIN_URL = 'https://example.test/admin/login';

const sentEmail = vi.mocked(sendPasswordResetEmail);
const sessionCount = () =>
	(testDb.prepare('SELECT COUNT(*) AS n FROM sessions').get() as { n: number }).n;
const code = (secret: string, offset = 0) => totpCode(secret, totpStep() + offset);
/** Turns 2FA on with the previous code, leaving the current and next ones unused. */
const enableTotp = () => {
	const secret = startTotpSetup();
	expect(confirmTotpSetup(code(secret, -1))).toBe(true);
	return secret;
};
const newPasswordFields = { newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD };

beforeEach(async () => {
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date('2026-01-15T12:00:10Z'));
	vi.stubEnv('TOTP_ENCRYPTION_KEY', 'test-only-totp-encryption-key-with-more-than-32-bytes');
	vi.stubEnv('SETUP_TOKEN', '');
	vi.stubEnv('ORIGIN', '');
	testDb.exec('DELETE FROM admin_user');
	testDb.exec('DELETE FROM sessions');
	testDb.exec('DELETE FROM password_reset_tokens');
	testDb.exec('DELETE FROM home');
	clearTwoFactorChallenges();
	sentEmail.mockReset();
	sentEmail.mockResolvedValue(true);
	await seedAdmin('admin', 'admin@example.com', PASSWORD, RECOVERY_KEY);
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

describe('login page', () => {
	const signIn = (
		cookies = fakeCookies(),
		address = uniqueAddress(),
		password = PASSWORD,
		url = LOGIN_URL
	) =>
		submit(login.actions.default, {
			fields: { username: 'admin', password },
			cookies,
			address,
			url
		});

	it('starts a session and goes to the dashboard after a correct password', async () => {
		const cookies = fakeCookies();

		expect(await signIn(cookies)).toMatchObject({
			kind: 'redirect',
			status: 303,
			location: '/admin'
		});
		expect(verifySessionToken(cookies.get(SESSION_COOKIE_NAME))).toBe(true);
	});

	it('follows redirectTo only inside the admin area', async () => {
		for (const [target, location] of [
			['/admin/works', '/admin/works'],
			['/admin?tab=1', '/admin?tab=1'],
			['https://evil.test/', '/admin'],
			['//evil.test/admin/', '/admin'],
			['/\\evil.test', '/admin'],
			['/admin/\\evil.test', '/admin'],
			['/administrator', '/admin']
		]) {
			const url = `${LOGIN_URL}?redirectTo=${encodeURIComponent(target)}`;
			const result = await signIn(fakeCookies(), uniqueAddress(), PASSWORD, url);
			expect(result.location, target).toBe(location);
		}
	});

	it('rejects a wrong password, keeping the username but not the password', async () => {
		const cookies = fakeCookies();
		const result = await signIn(cookies, uniqueAddress(), 'wrong-password');

		expect(result).toMatchObject({ kind: 'failure', status: 401 });
		expect(result.data.username).toBe('admin');
		expect(JSON.stringify(result.data)).not.toContain('wrong-password');
		expect(cookies.values.size).toBe(0);
		expect(sessionCount()).toBe(0);
		// Passwords are compared exactly as typed.
		expect((await signIn(fakeCookies(), uniqueAddress(), ` ${PASSWORD} `)).status).toBe(401);
	});

	it('locks an address out after five failures, even for the right password', async () => {
		const address = uniqueAddress();
		for (let i = 0; i < 5; i++) {
			expect((await signIn(fakeCookies(), address, 'wrong-password')).status).toBe(401);
		}

		const cookies = fakeCookies();
		expect(await signIn(cookies, address)).toMatchObject({ kind: 'failure', status: 429 });
		expect(cookies.values.size).toBe(0);
	});

	it('forgets earlier failures after a successful login', async () => {
		const address = uniqueAddress();
		for (let round = 0; round < 2; round++) {
			for (let i = 0; i < 4; i++) await signIn(fakeCookies(), address, 'wrong-password');
			expect((await signIn(fakeCookies(), address)).kind).toBe('redirect');
		}
	});

	it('sends visitors to setup when no admin exists', async () => {
		testDb.exec('DELETE FROM admin_user');
		expect((await signIn()).location).toBe('/admin/setup');
		expect((await loadPage(login.load, { url: LOGIN_URL })).location).toBe('/admin/setup');
	});

	it('skips the form for a signed-in admin, honoring only safe targets', async () => {
		const load = (target: string) =>
			loadPage(login.load, {
				url: `${LOGIN_URL}?redirectTo=${encodeURIComponent(target)}`,
				locals: { isAdmin: true }
			});
		expect((await load('/admin/press')).location).toBe('/admin/press');
		expect((await load('https://evil.test')).location).toBe('/admin');
	});

	it('tells the form about a pending code step and a completed reset', async () => {
		const cookies = fakeCookies({ [TWO_FACTOR_COOKIE_NAME]: createTwoFactorChallenge() });
		expect((await loadPage(login.load, { url: `${LOGIN_URL}?reset`, cookies })).data).toEqual({
			twoFactor: true,
			passwordReset: true
		});
		expect((await loadPage(login.load, { url: LOGIN_URL })).data).toEqual({
			twoFactor: false,
			passwordReset: false
		});
	});

	describe('with two-factor authentication on', () => {
		let secret: string;
		let cookies: ReturnType<typeof fakeCookies>;
		let address: string;

		const submitCode = (value: string, url = LOGIN_URL) =>
			submit(login.actions.default, { fields: { code: value }, cookies, address, url });

		beforeEach(async () => {
			secret = enableTotp();
			cookies = fakeCookies();
			address = uniqueAddress();
		});

		it('asks for a code after the password instead of starting a session', async () => {
			await signIn(cookies, address, 'wrong-password');
			expect(cookies.get(TWO_FACTOR_COOKIE_NAME)).toBeUndefined();

			expect(await signIn(cookies, address)).toMatchObject({
				kind: 'ok',
				data: { twoFactor: true }
			});
			expect(cookies.get(SESSION_COOKIE_NAME)).toBeUndefined();
			expect(sessionCount()).toBe(0);
			expect(hasTwoFactorChallenge(cookies.get(TWO_FACTOR_COOKIE_NAME))).toBe(true);
		});

		it('starts a session after a correct code and honors the redirect target', async () => {
			for (let i = 0; i < 4; i++) await signIn(fakeCookies(), address, 'wrong-password');
			await signIn(cookies, address);

			const result = await submitCode(code(secret), `${LOGIN_URL}?redirectTo=/admin/works`);

			expect(result).toMatchObject({ kind: 'redirect', location: '/admin/works' });
			expect(verifySessionToken(cookies.get(SESSION_COOKIE_NAME))).toBe(true);
			expect(cookies.get(TWO_FACTOR_COOKIE_NAME)).toBeUndefined();

			// The completed login cleared the earlier failures, so this address isn't near a lockout.
			await signIn(fakeCookies(), address, 'wrong-password');
			expect((await signIn(fakeCookies(), address, 'wrong-password')).status).toBe(401);
		});

		it('rejects a code without a pending password step', async () => {
			const result = await submitCode(code(secret));

			expect(result).toMatchObject({ kind: 'failure', status: 400, data: { twoFactor: false } });
			expect(sessionCount()).toBe(0);
		});

		it('keeps the challenge after a wrong code, then ends it on the fifth', async () => {
			await signIn(cookies, address);

			for (let i = 0; i < 4; i++) {
				expect(await submitCode('000000x')).toMatchObject({
					status: 401,
					data: { twoFactor: true }
				});
			}
			expect(await submitCode('000000x')).toMatchObject({
				status: 401,
				data: { twoFactor: false }
			});
			expect(cookies.get(TWO_FACTOR_COOKIE_NAME)).toBeUndefined();
		});

		it('refuses a correct code from a locked-out address', async () => {
			await signIn(cookies, address);
			await lockLogin(address);

			expect(await submitCode(code(secret))).toMatchObject({ kind: 'failure', status: 429 });
			expect(sessionCount()).toBe(0);
		});

		it('signs in with the recovery code and shows its replacement once', async () => {
			await signIn(cookies, address);

			const result = await submitCode(
				RECOVERY_KEY.toLowerCase(),
				`${LOGIN_URL}?redirectTo=/admin/press`
			);

			expect(result.kind).toBe('ok');
			expect(result.data.continueTo).toBe('/admin/press');
			expect(await recoveryKeyMatches(result.data.newRecoveryKey)).toBe(true);
			expect(await recoveryKeyMatches(RECOVERY_KEY)).toBe(false);
			expect(verifySessionToken(cookies.get(SESSION_COOKIE_NAME))).toBe(true);
		});

		it('forgets the pending login when going back', async () => {
			await signIn(cookies, address);
			const challenge = cookies.get(TWO_FACTOR_COOKIE_NAME);

			const result = await submit(login.actions.default, {
				fields: { cancel: '1' },
				cookies,
				address
			});

			expect(result.data).toEqual({ twoFactor: false });
			expect(hasTwoFactorChallenge(challenge)).toBe(false);
			expect(cookies.get(TWO_FACTOR_COOKIE_NAME)).toBeUndefined();
		});

		it('replaces an earlier challenge when the password is entered again', async () => {
			await signIn(cookies, address);
			const first = cookies.get(TWO_FACTOR_COOKIE_NAME);
			await signIn(cookies, address);

			expect(hasTwoFactorChallenge(first)).toBe(false);
			expect(hasTwoFactorChallenge(cookies.get(TWO_FACTOR_COOKIE_NAME))).toBe(true);
		});
	});
});

describe('first-time setup page', () => {
	const validFields = {
		username: ' owner ',
		email: 'Owner@Example.com',
		password: NEW_PASSWORD,
		confirmPassword: NEW_PASSWORD
	};

	beforeEach(() => {
		testDb.exec('DELETE FROM admin_user');
	});

	it('creates the account, signs in and shows a working recovery code', async () => {
		const cookies = fakeCookies();

		const result = await submit(setup.actions.default, { fields: validFields, cookies });

		expect(result.kind).toBe('ok');
		expect(getAdminProfile()).toEqual({ username: 'owner', email: 'owner@example.com' });
		expect(await checkPassword(NEW_PASSWORD)).toBe(true);
		expect(await recoveryKeyMatches(result.data.recoveryKey)).toBe(true);
		expect(verifySessionToken(cookies.get(SESSION_COOKIE_NAME))).toBe(true);
	});

	it('rejects invalid details without creating an account', async () => {
		const cookies = fakeCookies();

		for (const overrides of [
			{ username: '  ' },
			{ email: '' },
			{ email: 'not-an-email' },
			{ confirmPassword: 'something-else' }
		]) {
			const result = await submit(setup.actions.default, {
				fields: { ...validFields, ...overrides },
				cookies
			});

			expect(result, JSON.stringify(overrides)).toMatchObject({ kind: 'failure', status: 400 });
			expect(JSON.stringify(result.data)).not.toContain(NEW_PASSWORD);
		}

		expect(isAdminConfigured()).toBe(false);
		expect(cookies.values.size).toBe(0);
	});

	it('requires the setup token only when one is configured', async () => {
		expect((await loadPage(setup.load)).data).toEqual({ setupTokenRequired: false });

		vi.stubEnv('SETUP_TOKEN', 'deploy-secret');
		expect((await loadPage(setup.load)).data).toEqual({ setupTokenRequired: true });

		for (const setupToken of ['', 'wrong-secret']) {
			const result = await submit(setup.actions.default, {
				fields: { ...validFields, setupToken }
			});
			expect(result).toMatchObject({ kind: 'failure', status: 400 });
			expect(isAdminConfigured()).toBe(false);
		}

		const result = await submit(setup.actions.default, {
			fields: { ...validFields, setupToken: ' deploy-secret ' }
		});
		expect(result.kind).toBe('ok');
	});

	it('refuses to run once an account exists, even for a request racing the first', async () => {
		const results = await Promise.all(
			[fakeCookies(), fakeCookies()].map((cookies) =>
				submit(setup.actions.default, { fields: validFields, cookies })
			)
		);
		expect(results.map((result) => result.kind).sort()).toEqual(['ok', 'redirect']);
		expect(sessionCount()).toBe(1);

		await seedAdmin('admin', 'admin@example.com', PASSWORD);
		const cookies = fakeCookies();

		const result = await submit(setup.actions.default, { fields: validFields, cookies });

		expect(result).toMatchObject({ kind: 'redirect', location: '/admin/login' });
		expect(getAdminProfile()?.username).toBe('admin');
		expect(await checkPassword(PASSWORD)).toBe(true);
		expect(cookies.values.size).toBe(0);
		// The form is not even validated, so it reveals nothing about the setup requirements.
		expect((await submit(setup.actions.default)).location).toBe('/admin/login');
	});

	it('closes the page once an account exists, except to show the new recovery code', async () => {
		await seedAdmin('admin', 'admin@example.com', PASSWORD);

		expect((await loadPage(setup.load)).location).toBe('/admin/login');
		expect((await loadPage(setup.load, { locals: { isAdmin: true } })).location).toBe('/admin');
		expect((await loadPage(setup.load, { method: 'POST' })).kind).toBe('ok');
	});
});

describe('password reset link page', () => {
	const submitReset = (token: string, address = uniqueAddress(), fields = newPasswordFields) =>
		submit(reset.actions.default, { fields: { token, ...fields }, address });

	it('reports whether the link is valid', async () => {
		const token = createPasswordResetToken();
		const url = `https://example.test/admin/reset?token=${token}`;

		expect((await loadPage(reset.load, { url })).data).toEqual({ token, valid: true });
		expect(
			(await loadPage(reset.load, { url: 'https://example.test/admin/reset?token=nope' })).data
				.valid
		).toBe(false);
		expect((await loadPage(reset.load, { url, locals: { isAdmin: true } })).location).toBe(
			'/admin'
		);
	});

	it('changes the password and sends the admin to log in, without a session', async () => {
		const existingSession = createSession();
		const token = createPasswordResetToken();

		expect(await submitReset(token)).toMatchObject({
			kind: 'redirect',
			location: '/admin/login?reset'
		});

		expect(await checkPassword(NEW_PASSWORD)).toBe(true);
		expect(await checkPassword(PASSWORD)).toBe(false);
		expect(verifyResetToken(token)).toBe(false);
		expect(verifySessionToken(existingSession)).toBe(false);
		expect(sessionCount()).toBe(0);
	});

	it('keeps the link usable when the new password is rejected', async () => {
		const token = createPasswordResetToken();
		const address = uniqueAddress();

		const result = await submitReset(token, address, {
			newPassword: 'short',
			confirmPassword: 'short'
		});

		expect(result).toMatchObject({ kind: 'failure', status: 400 });
		expect(await checkPassword(PASSWORD)).toBe(true);
		expect(verifyResetToken(token)).toBe(true);
		expect(resetAttempts.isLocked(address)).toBe(false);
	});

	it('locks out an address guessing tokens, even for a real one afterwards', async () => {
		const address = uniqueAddress();
		for (let i = 0; i < 5; i++) {
			expect((await submitReset('guess', address)).status).toBe(400);
		}

		const token = createPasswordResetToken();
		expect((await submitReset(token, address)).status).toBe(429);
		expect(await checkPassword(PASSWORD)).toBe(true);
		expect(verifyResetToken(token)).toBe(true);
	});

	it('clears the failure count after a successful reset', async () => {
		const address = uniqueAddress();
		for (let i = 0; i < 4; i++) await submitReset('guess', address);

		await submitReset(createPasswordResetToken(), address);
		await submitReset('guess', address);

		expect(resetAttempts.isLocked(address)).toBe(false);
	});
});

describe('forgot password page', () => {
	const requestLink = (identifier: string, address = uniqueAddress(), url?: string) =>
		submit(forgot.actions.requestEmailLink, { fields: { identifier }, address, url });
	const resetWithKey = (
		recoveryKey: string,
		address = uniqueAddress(),
		fields = newPasswordFields
	) =>
		submit(forgot.actions.resetWithRecoveryKey, {
			fields: { recoveryKey, ...fields },
			address
		});

	it('redirects signed-in admins and sites without an account', async () => {
		expect((await loadPage(forgot.load, { locals: { isAdmin: true } })).location).toBe('/admin');
		testDb.exec('DELETE FROM admin_user');
		expect((await loadPage(forgot.load)).location).toBe('/admin/setup');
	});

	it('answers identically for known and unknown accounts, emailing only the admin', async () => {
		const known = await requestLink('admin');
		expect(sentEmail).toHaveBeenCalledOnce();
		expect(sentEmail.mock.calls[0][0]).toBe('admin@example.com');

		const unknown = await requestLink('stranger@example.com');
		expect(sentEmail).toHaveBeenCalledOnce();
		expect(unknown).toEqual(known);
		expect(known.data).toEqual({ emailSent: true });
	});

	it('builds the link from ORIGIN rather than the request host', async () => {
		vi.stubEnv('ORIGIN', 'https://configured.test');

		await requestLink('admin', uniqueAddress(), 'https://attacker.test/admin/forgot-password');

		expect(sentEmail.mock.calls[0][1]).toMatch(/^https:\/\/configured\.test\/admin\/reset\?token=/);
	});

	it('requires an identifier without counting the blank attempt', async () => {
		const address = uniqueAddress();
		for (let i = 0; i < 5; i++) {
			expect(await requestLink('   ', address)).toMatchObject({ kind: 'failure', status: 400 });
		}
		expect(resetAttempts.isLocked(address)).toBe(false);
		expect(sentEmail).not.toHaveBeenCalled();
	});

	it('limits every address to five emails', async () => {
		const address = uniqueAddress();
		for (let i = 0; i < 5; i++) expect((await requestLink('admin', address)).kind).toBe('ok');

		expect((await requestLink('admin', address)).status).toBe(429);
		expect(sentEmail).toHaveBeenCalledTimes(5);
	});

	it('still answers normally when sending fails, and logs the error', async () => {
		const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
		sentEmail.mockRejectedValueOnce(new Error('smtp down'));

		expect((await requestLink('admin')).data).toEqual({ emailSent: true });
		await new Promise((resolve) => setImmediate(resolve));

		expect(logged).toHaveBeenCalledOnce();
	});

	it('resets with the recovery code, shows its replacement and signs nobody in', async () => {
		const existingSession = createSession();
		const resetToken = createPasswordResetToken();
		const address = uniqueAddress();
		for (let i = 0; i < 4; i++) await resetWithKey('FFFF-0000-0000-0000', address);

		const result = await resetWithKey(RECOVERY_KEY.toLowerCase(), address);

		expect(result.data.passwordReset).toBe(true);
		expect(await recoveryKeyMatches(result.data.newRecoveryKey)).toBe(true);
		expect(await recoveryKeyMatches(RECOVERY_KEY)).toBe(false);
		expect(await checkPassword(NEW_PASSWORD)).toBe(true);
		expect(verifyResetToken(resetToken)).toBe(false);
		expect(verifySessionToken(existingSession)).toBe(false);
		expect(sessionCount()).toBe(0);

		// The successful reset cleared the earlier failures.
		await resetWithKey('FFFF-0000-0000-0000', address);
		expect(resetAttempts.isLocked(address)).toBe(false);
	});

	it('rejects invalid input without using up the code', async () => {
		const address = uniqueAddress();

		for (const [key, fields] of [
			['   ', newPasswordFields],
			[RECOVERY_KEY, { newPassword: NEW_PASSWORD, confirmPassword: 'different-password' }]
		] as const) {
			expect(await resetWithKey(key, address, fields)).toMatchObject({
				kind: 'failure',
				status: 400
			});
		}

		// Blank submissions never reach the code check, so they don't count toward the lockout.
		for (let i = 0; i < 5; i++) await resetWithKey('   ', address);

		expect(await checkPassword(PASSWORD)).toBe(true);
		expect(await recoveryKeyMatches(RECOVERY_KEY)).toBe(true);
		expect(resetAttempts.isLocked(address)).toBe(false);
	});

	it('locks out an address guessing recovery codes, even for the right one', async () => {
		const address = uniqueAddress();
		for (let i = 0; i < 5; i++) {
			expect((await resetWithKey('FFFF-0000-0000-0000', address)).status).toBe(400);
		}

		expect((await resetWithKey(RECOVERY_KEY, address)).status).toBe(429);
		expect(await checkPassword(PASSWORD)).toBe(true);
		expect(await recoveryKeyMatches(RECOVERY_KEY)).toBe(true);
	});
});

describe('logout endpoint', () => {
	it('ends the session and clears the cookie', async () => {
		const token = createSession();
		const other = createSession();
		const cookies = fakeCookies({ [SESSION_COOKIE_NAME]: token });

		const result = await outcome(() => logout({ cookies } as never));

		expect(result).toMatchObject({ kind: 'redirect', location: '/admin/login' });
		expect(verifySessionToken(token)).toBe(false);
		expect(verifySessionToken(other)).toBe(true);
		expect(cookies.get(SESSION_COOKIE_NAME)).toBeUndefined();
	});
});

describe('account settings', () => {
	const WRONG = { currentPassword: 'wrong-password' };
	const RIGHT = { currentPassword: PASSWORD };
	const profile = { username: 'renamed', email: 'Renamed@Example.com' };

	it('shows the account state without any pending setup', async () => {
		expect((await loadPage(settings.load)).data).toEqual({
			username: 'admin',
			email: 'admin@example.com',
			twoFactorEnabled: false,
			twoFactorKeyConfigured: true,
			twoFactorSetup: null
		});
	});

	it('shows a QR code and readable secret while 2FA setup is pending', async () => {
		const secret = startTotpSetup();

		const { twoFactorSetup } = (
			await loadPage<{ twoFactorSetup: { secret: string; qrCode: string } }>(settings.load)
		).data;

		expect(twoFactorSetup.secret.replaceAll(' ', '')).toBe(secret);
		expect(twoFactorSetup.secret).toMatch(/^[A-Z2-7]{4} /);
		expect(twoFactorSetup.qrCode).toMatch(/^data:image\/png;base64,/);
	});

	describe('profile', () => {
		const update = (fields: Record<string, string>, address = uniqueAddress()) =>
			submit(settings.actions.updateProfile, { fields, address });

		it('updates the profile after the current password is confirmed', async () => {
			expect((await update({ ...profile, ...RIGHT })).data).toEqual({ profileSuccess: true });
			expect(getAdminProfile()).toEqual({ username: 'renamed', email: 'renamed@example.com' });
		});

		it('rejects bad input, leaving the profile and reset links alone', async () => {
			const token = createPasswordResetToken();
			const attempts: [Record<string, string>, number][] = [
				[{ ...profile, ...WRONG }, 401],
				[profile, 401],
				[{ ...profile, ...RIGHT, username: ' ' }, 400],
				[{ ...profile, ...RIGHT, email: 'nope' }, 400]
			];

			for (const [fields, status] of attempts) {
				expect(await update(fields), JSON.stringify(fields)).toMatchObject({
					kind: 'failure',
					status
				});
			}

			expect(getAdminProfile()?.username).toBe('admin');
			expect(verifyResetToken(token)).toBe(true);
		});

		it('needs a valid second factor when 2FA is on', async () => {
			const secret = enableTotp();

			expect((await update({ ...profile, ...RIGHT })).status).toBe(401);
			expect((await update({ ...profile, ...RIGHT, code: '000000x' })).status).toBe(401);
			expect(getAdminProfile()?.username).toBe('admin');

			expect((await update({ ...profile, ...RIGHT, code: code(secret) })).data).toEqual({
				profileSuccess: true
			});
			expect(getAdminProfile()?.username).toBe('renamed');
		});

		it('shows the replacement when a recovery code was used as the second factor', async () => {
			enableTotp();

			const { data } = await update({ ...profile, ...RIGHT, code: RECOVERY_KEY });

			expect(data.recoverySuccess).toBe(true);
			expect(await recoveryKeyMatches(data.newRecoveryKey)).toBe(true);
		});

		it('invalidates pending reset links only when the email really changes', async () => {
			const token = createPasswordResetToken();

			await update({ username: 'renamed', email: 'ADMIN@example.com', ...RIGHT });
			expect(getAdminProfile()?.username).toBe('renamed');
			expect(verifyResetToken(token)).toBe(true);

			await update({ ...profile, ...RIGHT });
			expect(verifyResetToken(token)).toBe(false);
		});
	});

	describe('password change', () => {
		const change = (fields: Record<string, string>, cookies = fakeCookies()) =>
			submit(settings.actions.changePassword, { fields, cookies });

		it('changes the password, revokes other sessions and keeps this browser in', async () => {
			const other = createSession();
			const resetToken = createPasswordResetToken();
			const cookies = fakeCookies();

			const result = await change({ ...RIGHT, ...newPasswordFields }, cookies);

			expect(result.data).toEqual({ passwordSuccess: true });
			expect(verifyResetToken(resetToken)).toBe(false);
			expect(await checkCredentials('admin', NEW_PASSWORD)).toBe(true);
			expect(await checkPassword(PASSWORD)).toBe(false);
			expect(verifySessionToken(other)).toBe(false);
			expect(verifySessionToken(cookies.get(SESSION_COOKIE_NAME))).toBe(true);
		});

		it('rejects bad input, leaving the password, sessions and reset links alone', async () => {
			const session = createSession();
			const resetToken = createPasswordResetToken();
			const attempts: [Record<string, string>, number][] = [
				[{ ...WRONG, ...newPasswordFields }, 401],
				[{ ...RIGHT, newPassword: NEW_PASSWORD, confirmPassword: 'different-password' }, 400]
			];

			for (const [fields, status] of attempts) {
				expect(await change(fields)).toMatchObject({ kind: 'failure', status });
			}

			expect(await checkPassword(PASSWORD)).toBe(true);
			expect(verifySessionToken(session)).toBe(true);
			expect(verifyResetToken(resetToken)).toBe(true);
		});
	});

	describe('recovery key rotation', () => {
		const rotate = (fields: Record<string, string>) =>
			submit(settings.actions.rotateRecoveryKey, { fields });

		it('replaces the key after the password is confirmed', async () => {
			const { data } = await rotate(RIGHT);

			expect(data.recoverySuccess).toBe(true);
			expect(await recoveryKeyMatches(data.newRecoveryKey)).toBe(true);
			expect(await recoveryKeyMatches(RECOVERY_KEY)).toBe(false);
		});

		it('rejects a wrong password', async () => {
			expect((await rotate(WRONG)).status).toBe(401);
			expect(await recoveryKeyMatches(RECOVERY_KEY)).toBe(true);
		});

		it('needs a valid second factor when 2FA is on', async () => {
			const secret = enableTotp();

			expect((await rotate(RIGHT)).status).toBe(401);
			expect(await recoveryKeyMatches(RECOVERY_KEY)).toBe(true);

			expect((await rotate({ ...RIGHT, code: code(secret) })).data.recoverySuccess).toBe(true);
			expect(await recoveryKeyMatches(RECOVERY_KEY)).toBe(false);
		});

		it('returns the key that works when the old key was the second factor', async () => {
			enableTotp();

			const { data } = await rotate({ ...RIGHT, code: RECOVERY_KEY });

			expect(await recoveryKeyMatches(data.newRecoveryKey)).toBe(true);
		});
	});

	describe('turning two-factor authentication on', () => {
		const start = (fields: Record<string, string>) =>
			submit(settings.actions.startTwoFactor, { fields });
		const confirm = (value: string, cookies = fakeCookies(), address = uniqueAddress()) =>
			submit(settings.actions.confirmTwoFactor, { fields: { code: value }, cookies, address });

		it('starts setup after the password is confirmed', async () => {
			expect((await start(RIGHT)).kind).toBe('ok');
			expect(getPendingTotpSecret()).not.toBeNull();
			expect(isTotpEnabled()).toBe(false);
		});

		it('refuses a wrong password, or starting while 2FA is already on', async () => {
			expect((await start(WRONG)).status).toBe(401);
			expect(getPendingTotpSecret()).toBeNull();

			enableTotp();
			expect((await start(RIGHT)).status).toBe(400);
			expect(getPendingTotpSecret()).toBeNull();
		});

		it('explains when the encryption key is missing', async () => {
			vi.stubEnv('TOTP_ENCRYPTION_KEY', '');

			expect((await start(RIGHT)).status).toBe(503);
			expect((await confirm('123456')).status).toBe(503);
		});

		it('turns on with a valid code, signing out everything but this browser', async () => {
			const secret = startTotpSetup();
			const other = createSession();
			const cookies = fakeCookies();

			const { data } = await confirm(code(secret), cookies);

			expect(isTotpEnabled()).toBe(true);
			expect(verifySessionToken(other)).toBe(false);
			expect(verifySessionToken(cookies.get(SESSION_COOKIE_NAME))).toBe(true);
			expect(await recoveryKeyMatches(data.twoFactorRecoveryKey)).toBe(true);
			expect(await recoveryKeyMatches(RECOVERY_KEY)).toBe(false);
		});

		it('stays off after a wrong code and locks out repeated guesses', async () => {
			const secret = startTotpSetup();
			const address = uniqueAddress();
			for (let i = 0; i < 5; i++) {
				expect((await confirm('000000x', fakeCookies(), address)).status).toBe(400);
			}

			expect((await confirm(code(secret), fakeCookies(), address)).status).toBe(429);
			expect(isTotpEnabled()).toBe(false);
		});

		it('can cancel a pending setup', async () => {
			startTotpSetup();
			await submit(settings.actions.cancelTwoFactor);
			expect(getPendingTotpSecret()).toBeNull();
		});
	});

	describe('turning two-factor authentication off', () => {
		const disable = (fields: Record<string, string>) =>
			submit(settings.actions.disableTwoFactor, { fields });

		it('stays on without both the password and a valid code', async () => {
			const secret = enableTotp();

			for (const fields of [
				{ ...WRONG, code: code(secret) },
				{ ...RIGHT, code: '000000x' },
				RIGHT
			]) {
				expect((await disable(fields)).status, JSON.stringify(fields)).toBe(401);
			}

			expect(isTotpEnabled()).toBe(true);
		});

		it('turns off with the password and a valid code', async () => {
			const secret = enableTotp();

			const { data } = await disable({ ...RIGHT, code: code(secret) });

			expect(data.twoFactorSuccess).toMatch(/now off/);
			expect(data.newRecoveryKey).toBeUndefined();
			expect(isTotpEnabled()).toBe(false);
		});

		it('shows the replacement when the recovery code was used', async () => {
			enableTotp();

			const { data } = await disable({ ...RIGHT, code: RECOVERY_KEY });

			expect(isTotpEnabled()).toBe(false);
			expect(await recoveryKeyMatches(data.newRecoveryKey)).toBe(true);
		});
	});

	it('shares the login lockout across password checks', async () => {
		const address = uniqueAddress();
		resetAttempts.recordFailure(address);
		for (let i = 0; i < 5; i++) {
			await submit(settings.actions.changePassword, {
				fields: { ...WRONG, ...newPasswordFields },
				address
			});
		}

		const result = await submit(settings.actions.changePassword, {
			fields: { ...RIGHT, ...newPasswordFields },
			address
		});

		expect(result.status).toBe(401);
		expect(await checkPassword(PASSWORD)).toBe(true);
	});
});
