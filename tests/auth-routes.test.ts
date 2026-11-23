import { TOTP } from 'otpauth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/server/db.js', async () => {
	const { migratedTestDb } = await import('./test-db');
	return { db: await migratedTestDb() };
});
vi.mock('#lib/server/email.js', () => ({ sendPasswordResetEmail: vi.fn(async () => true) }));
vi.mock('$app/env', () => ({ dev: false, browser: false, building: false }));

import { fakeCookies, loadPage, submit, uniqueAddress } from './route-helpers';
import {
	authHeaders,
	clearAuth,
	enableTotp,
	hasSession,
	lockLogin,
	passwordMatches,
	recoveryKeyMatches,
	seedAdmin,
	sessionCount,
	signIn,
	totpCode
} from './auth-helpers';
import { getTestDb } from './test-db';
import {
	getAdmin,
	getAdminProfile,
	isAdminConfigured,
	isValidResetToken,
	requestEmailPasswordReset,
	twoFactorCookie
} from '#lib/server/auth.js';
import { sendPasswordResetEmail } from '#lib/server/email.js';
import * as login from '../src/routes/admin/login/+page.server';
import * as setup from '../src/routes/admin/setup/+page.server';
import * as reset from '../src/routes/admin/reset/+page.server';
import * as forgot from '../src/routes/admin/forgot-password/+page.server';
import * as settings from '../src/routes/admin/(app)/settings/+page.server';
import { POST as logout } from '../src/routes/admin/logout/+server';

type Cookies = ReturnType<typeof fakeCookies>;

const testDb = getTestDb();
const PASSWORD = 'correct-password';
const NEW_PASSWORD = 'brand-new-password';
const RECOVERY_KEY = 'AAAA-BBBB-CCCC-DDDD';
const LOGIN_URL = 'https://example.test/admin/login';

const sentEmail = vi.mocked(sendPasswordResetEmail);
const newPasswordFields = { newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD };
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

async function issueResetToken(): Promise<string> {
	authHeaders(fakeCookies());
	await requestEmailPasswordReset('admin');
	const link = sentEmail.mock.calls.at(-1)?.[1] ?? '';
	return new URL(link).searchParams.get('token') ?? '';
}

beforeEach(async () => {
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date('2026-01-15T12:00:10Z'));
	vi.stubEnv('SETUP_TOKEN', '');
	vi.stubEnv('ORIGIN', '');
	testDb.exec('DELETE FROM home');
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
	const submitPassword = (
		cookies = fakeCookies(),
		address = uniqueAddress(),
		password = PASSWORD,
		url = LOGIN_URL,
		username = 'admin'
	) => submit(login.actions.default, { fields: { username, password }, cookies, address, url });

	it('starts a session and goes to the dashboard after a correct password', async () => {
		const cookies = fakeCookies();

		expect(await submitPassword(cookies)).toMatchObject({
			kind: 'redirect',
			status: 303,
			location: '/admin'
		});
		expect(await hasSession(cookies)).toBe(true);
	});

	it('accepts the username in any case, or the email address', async () => {
		for (const username of ['ADMIN', 'Admin@Example.com']) {
			const cookies = fakeCookies();
			const result = await submitPassword(cookies, uniqueAddress(), PASSWORD, LOGIN_URL, username);
			expect(result.kind, username).toBe('redirect');
			expect(await hasSession(cookies), username).toBe(true);
		}
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
			const result = await submitPassword(fakeCookies(), uniqueAddress(), PASSWORD, url);
			expect(result.location, target).toBe(location);
		}
	});

	it('rejects a wrong password, keeping the username but not the password', async () => {
		const cookies = fakeCookies();
		const result = await submitPassword(cookies, uniqueAddress(), 'wrong-password');

		expect(result).toMatchObject({ kind: 'failure', status: 401 });
		expect(result.data.username).toBe('admin');
		expect(JSON.stringify(result.data)).not.toContain('wrong-password');
		expect(cookies.values.size).toBe(0);
		expect(sessionCount()).toBe(0);
		expect((await submitPassword(fakeCookies(), uniqueAddress(), ` ${PASSWORD} `)).status).toBe(
			401
		);
	});

	it('locks an address out after five failures, even for the right password', async () => {
		const address = uniqueAddress();
		for (let i = 0; i < 5; i++) {
			expect((await submitPassword(fakeCookies(), address, 'wrong-password')).status).toBe(401);
		}

		const cookies = fakeCookies();
		expect(await submitPassword(cookies, address)).toMatchObject({ kind: 'failure', status: 429 });
		expect(cookies.values.size).toBe(0);
	});

	it('forgets earlier failures after a successful login', async () => {
		const address = uniqueAddress();
		for (let round = 0; round < 2; round++) {
			for (let i = 0; i < 4; i++) await submitPassword(fakeCookies(), address, 'wrong-password');
			expect((await submitPassword(fakeCookies(), address)).kind).toBe('redirect');
		}
	});

	it('sends visitors to setup when no admin exists', async () => {
		clearAuth();
		expect((await submitPassword()).location).toBe('/admin/setup');
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
		const cookies = fakeCookies({ [twoFactorCookie.name]: 'pending' });
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
		let totp: TOTP;
		let backupCodes: string[];
		let cookies: Cookies;
		let address: string;
		let sessionsBefore: number;

		const submitCode = (value: string, url = LOGIN_URL, from = address) =>
			submit(login.actions.default, { fields: { code: value }, cookies, address: from, url });

		beforeEach(async () => {
			({ totp, backupCodes } = await enableTotp(await signIn(PASSWORD), PASSWORD));
			cookies = fakeCookies();
			address = uniqueAddress();
			sessionsBefore = sessionCount();
		});

		it('asks for a code after the password instead of starting a session', async () => {
			await submitPassword(cookies, address, 'wrong-password');
			expect(cookies.get(twoFactorCookie.name)).toBeUndefined();

			expect(await submitPassword(cookies, address)).toMatchObject({
				kind: 'ok',
				data: { twoFactor: true }
			});
			expect(await hasSession(cookies)).toBe(false);
			expect(sessionCount()).toBe(sessionsBefore);
			expect(cookies.get(twoFactorCookie.name)).toBeTruthy();
		});

		it('starts a session after a correct code and honors the redirect target', async () => {
			for (let i = 0; i < 4; i++) await submitPassword(fakeCookies(), address, 'wrong-password');
			await submitPassword(cookies, address);

			const result = await submitCode(totpCode(totp), `${LOGIN_URL}?redirectTo=/admin/works`);

			expect(result).toMatchObject({ kind: 'redirect', location: '/admin/works' });
			expect(await hasSession(cookies)).toBe(true);
			expect(cookies.get(twoFactorCookie.name)).toBeFalsy();

			await submitPassword(fakeCookies(), address, 'wrong-password');
			expect((await submitPassword(fakeCookies(), address, 'wrong-password')).status).toBe(401);
		});

		it('accepts codes from one step either side of now', async () => {
			for (const offset of [-1, 1]) {
				cookies = fakeCookies();
				await submitPassword(cookies, address);
				expect((await submitCode(totpCode(totp, offset))).kind, String(offset)).toBe('redirect');
			}
		});

		it('rejects a code without a pending password step', async () => {
			const result = await submitCode(totpCode(totp));

			expect(result).toMatchObject({ kind: 'failure', status: 400, data: { twoFactor: false } });
			expect(sessionCount()).toBe(sessionsBefore);
		});

		it('keeps the challenge after wrong codes, and the address lockout stops the sixth', async () => {
			await submitPassword(cookies, address);

			for (let i = 0; i < 5; i++) {
				expect(await submitCode('000000')).toMatchObject({
					status: 401,
					data: { twoFactor: true }
				});
			}
			expect((await submitCode(totpCode(totp))).status).toBe(429);
			expect(await hasSession(cookies)).toBe(false);
		});

		it('ends the challenge after five wrong codes, even from different addresses', async () => {
			await submitPassword(cookies, address);
			for (let i = 0; i < 5; i++) await submitCode('000000', LOGIN_URL, uniqueAddress());

			expect(await submitCode(totpCode(totp), LOGIN_URL, uniqueAddress())).toMatchObject({
				status: 401,
				data: { twoFactor: false }
			});
			expect(cookies.get(twoFactorCookie.name)).toBeUndefined();
			expect(await hasSession(cookies)).toBe(false);
		});

		it('refuses a correct code from a locked-out address', async () => {
			await submitPassword(cookies, address);
			await lockLogin(address);

			expect(await submitCode(totpCode(totp))).toMatchObject({ kind: 'failure', status: 429 });
			expect(await hasSession(cookies)).toBe(false);
		});

		it('signs in once with each backup code', async () => {
			await submitPassword(cookies, address);
			expect((await submitCode(` ${backupCodes[0]} `)).kind).toBe('redirect');
			expect(await hasSession(cookies)).toBe(true);

			cookies = fakeCookies();
			await submitPassword(cookies, address);
			expect((await submitCode(backupCodes[0])).status).toBe(401);
			expect((await submitCode(backupCodes[1])).kind).toBe('redirect');
		});

		it('forgets the pending login when going back', async () => {
			await submitPassword(cookies, address);

			const result = await submit(login.actions.default, {
				fields: { cancel: '1' },
				cookies,
				address
			});

			expect(result.data).toEqual({ twoFactor: false });
			expect(cookies.get(twoFactorCookie.name)).toBeUndefined();
			expect((await submitCode(totpCode(totp))).status).toBe(400);
		});
	});
});

describe('first-time setup page', () => {
	const validFields = {
		username: ' Owner ',
		email: 'Owner@Example.com',
		password: NEW_PASSWORD,
		confirmPassword: NEW_PASSWORD
	};

	beforeEach(() => {
		clearAuth();
	});

	it('creates the account, signs in and shows a working recovery code', async () => {
		const cookies = fakeCookies();

		const result = await submit(setup.actions.default, { fields: validFields, cookies });

		expect(result.kind).toBe('ok');
		expect(await getAdminProfile()).toEqual({ username: 'Owner', email: 'owner@example.com' });
		expect(await passwordMatches(NEW_PASSWORD)).toBe(true);
		expect(await recoveryKeyMatches(result.data.recoveryKey)).toBe(true);
		expect(await hasSession(cookies)).toBe(true);
	});

	it('rejects invalid details without creating an account', async () => {
		const cookies = fakeCookies();

		for (const overrides of [
			{ username: '  ' },
			{ username: 'me@home' },
			{ email: '' },
			{ email: 'not-an-email' },
			{ password: 'short', confirmPassword: 'short' },
			{ confirmPassword: 'something-else' }
		]) {
			const result = await submit(setup.actions.default, {
				fields: { ...validFields, ...overrides },
				cookies
			});

			expect(result, JSON.stringify(overrides)).toMatchObject({ kind: 'failure', status: 400 });
			expect(JSON.stringify(result.data)).not.toContain(NEW_PASSWORD);
		}

		expect(await isAdminConfigured()).toBe(false);
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
			expect(await isAdminConfigured()).toBe(false);
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
		expect((await getAdminProfile())?.username).toBe('admin');
		expect(await passwordMatches(PASSWORD)).toBe(true);
		expect(cookies.values.size).toBe(0);
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
		const token = await issueResetToken();
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
		const existingSession = await signIn(PASSWORD);
		const token = await issueResetToken();

		expect(await submitReset(token)).toMatchObject({
			kind: 'redirect',
			location: '/admin/login?reset'
		});

		expect(await passwordMatches(NEW_PASSWORD)).toBe(true);
		expect(await passwordMatches(PASSWORD)).toBe(false);
		expect(await isValidResetToken(token)).toBe(false);
		expect(await hasSession(existingSession)).toBe(false);
		expect(sessionCount()).toBe(0);
	});

	it('keeps the link usable when the new password is rejected', async () => {
		const token = await issueResetToken();

		const result = await submitReset(token, uniqueAddress(), {
			newPassword: 'short',
			confirmPassword: 'short'
		});

		expect(result).toMatchObject({ kind: 'failure', status: 400 });
		expect(await passwordMatches(PASSWORD)).toBe(true);
		expect(await isValidResetToken(token)).toBe(true);
	});

	it('expires the link after 15 minutes', async () => {
		const token = await issueResetToken();
		vi.setSystemTime(Date.now() + 15 * 60 * 1000 + 1000);

		expect((await submitReset(token)).status).toBe(400);
		expect(await passwordMatches(PASSWORD)).toBe(true);
	});

	it('locks out an address guessing tokens, even for a real one afterwards', async () => {
		const address = uniqueAddress();
		for (let i = 0; i < 5; i++) {
			expect((await submitReset('guess', address)).status).toBe(400);
		}

		const token = await issueResetToken();
		expect((await submitReset(token, address)).status).toBe(429);
		expect(await passwordMatches(PASSWORD)).toBe(true);
		expect(await isValidResetToken(token)).toBe(true);
	});

	it('clears the failure count after a successful reset', async () => {
		const address = uniqueAddress();
		for (let i = 0; i < 4; i++) await submitReset('guess', address);

		await submitReset(await issueResetToken(), address);
		for (let i = 0; i < 4; i++) expect((await submitReset('guess', address)).status).toBe(400);
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
		clearAuth();
		expect((await loadPage(forgot.load)).location).toBe('/admin/setup');
	});

	it('answers identically for known and unknown accounts, emailing only the admin', async () => {
		const known = await requestLink('ADMIN');
		await vi.waitFor(() => expect(sentEmail).toHaveBeenCalledOnce());
		expect(sentEmail.mock.calls[0][0]).toBe('admin@example.com');

		const unknown = await requestLink('stranger@example.com');
		await settle();
		expect(sentEmail).toHaveBeenCalledOnce();
		expect(unknown).toEqual(known);
		expect(known.data).toEqual({ emailSent: true });
	});

	it('builds the link from ORIGIN rather than the request host', async () => {
		vi.stubEnv('ORIGIN', 'https://configured.test');

		await requestLink('admin', uniqueAddress(), 'https://attacker.test/admin/forgot-password');

		await vi.waitFor(() => expect(sentEmail).toHaveBeenCalledOnce());
		expect(sentEmail.mock.calls[0][1]).toMatch(/^https:\/\/configured\.test\/admin\/reset\?token=/);
	});

	it('keeps only the newest link working', async () => {
		const first = await issueResetToken();
		const second = await issueResetToken();

		expect(await isValidResetToken(first)).toBe(false);
		expect(await isValidResetToken(second)).toBe(true);
	});

	it('requires an identifier without counting the blank attempt', async () => {
		const address = uniqueAddress();
		for (let i = 0; i < 5; i++) {
			expect(await requestLink('   ', address)).toMatchObject({ kind: 'failure', status: 400 });
		}
		expect((await requestLink('admin', address)).kind).toBe('ok');
	});

	it('limits every address to five emails', async () => {
		const address = uniqueAddress();
		for (let i = 0; i < 5; i++) expect((await requestLink('admin', address)).kind).toBe('ok');

		expect((await requestLink('admin', address)).status).toBe(429);
		await settle();
		expect(sentEmail).toHaveBeenCalledTimes(5);
	});

	it('still answers normally when sending fails, and logs the error', async () => {
		const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
		sentEmail.mockRejectedValueOnce(new Error('smtp down'));

		expect((await requestLink('admin')).data).toEqual({ emailSent: true });

		await vi.waitFor(() => expect(logged).toHaveBeenCalledOnce());
	});

	it('resets with the recovery code, shows its replacement and signs nobody in', async () => {
		const existingSession = await signIn(PASSWORD);
		const resetToken = await issueResetToken();
		const address = uniqueAddress();
		for (let i = 0; i < 4; i++) await resetWithKey('FFFF-0000-0000-0000', address);

		const result = await resetWithKey(RECOVERY_KEY.toLowerCase(), address);

		expect(result.data.passwordReset).toBe(true);
		expect(await recoveryKeyMatches(result.data.newRecoveryKey)).toBe(true);
		expect(await recoveryKeyMatches(RECOVERY_KEY)).toBe(false);
		expect(await passwordMatches(NEW_PASSWORD)).toBe(true);
		expect(await isValidResetToken(resetToken)).toBe(false);
		expect(await hasSession(existingSession)).toBe(false);
		expect(sessionCount()).toBe(0);

		for (let i = 0; i < 4; i++) {
			expect((await resetWithKey('FFFF-0000-0000-0000', address)).status).toBe(400);
		}
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

		for (let i = 0; i < 5; i++) await resetWithKey('   ', address);

		expect(await passwordMatches(PASSWORD)).toBe(true);
		expect(await recoveryKeyMatches(RECOVERY_KEY)).toBe(true);
		expect((await resetWithKey(RECOVERY_KEY, address)).data.passwordReset).toBe(true);
	});

	it('locks out an address guessing recovery codes, even for the right one', async () => {
		const address = uniqueAddress();
		for (let i = 0; i < 5; i++) {
			expect((await resetWithKey('FFFF-0000-0000-0000', address)).status).toBe(400);
		}

		expect((await resetWithKey(RECOVERY_KEY, address)).status).toBe(429);
		expect(await passwordMatches(PASSWORD)).toBe(true);
		expect(await recoveryKeyMatches(RECOVERY_KEY)).toBe(true);
	});
});

describe('logout endpoint', () => {
	it('ends this session only and clears its cookie', async () => {
		const cookies = await signIn(PASSWORD);
		const other = await signIn(PASSWORD);

		const result = await submit(logout, { cookies });

		expect(result).toMatchObject({ kind: 'redirect', location: '/admin/login' });
		expect(await hasSession(cookies)).toBe(false);
		expect(await hasSession(other)).toBe(true);
		expect([...cookies.values.values()].filter(Boolean)).toEqual([]);
	});
});

describe('account settings', () => {
	const WRONG = { currentPassword: 'wrong-password' };
	const RIGHT = { currentPassword: PASSWORD };
	const profile = { username: 'Renamed', email: 'Renamed@Example.com' };
	let cookies: Cookies;

	const act = (action: (event: never) => unknown, fields: Record<string, string> = {}) =>
		submit(action, { fields, cookies });
	const twoFactorEnabled = async () => (await getAdmin())?.twoFactorEnabled;
	const pendingSetup = async () =>
		(
			await loadPage<{ twoFactorSetup: { secret: string; qrCode: string } | null }>(settings.load, {
				cookies
			})
		).data.twoFactorSetup;

	beforeEach(async () => {
		cookies = await signIn(PASSWORD);
	});

	it('shows the account state without any pending setup', async () => {
		expect((await loadPage(settings.load, { cookies })).data).toEqual({
			username: 'admin',
			email: 'admin@example.com',
			twoFactorEnabled: false,
			backupCodesLeft: null,
			twoFactorSetup: null
		});
	});

	it('shows a QR code and readable secret while 2FA setup is pending', async () => {
		await act(settings.actions.startTwoFactor, RIGHT);

		const setupData = await pendingSetup();

		expect(setupData?.secret).toMatch(/^[A-Z2-7]{4}( [A-Z2-7]{1,4})+$/);
		expect(setupData?.qrCode).toMatch(/^data:image\/png;base64,/);
	});

	describe('profile', () => {
		const update = (fields: Record<string, string>) => act(settings.actions.updateProfile, fields);

		it('updates the profile after the current password is confirmed', async () => {
			expect((await update({ ...profile, ...RIGHT })).data).toEqual({ profileSuccess: true });
			expect(await getAdminProfile()).toEqual({
				username: 'Renamed',
				email: 'renamed@example.com'
			});
			expect((await signIn(PASSWORD, 'renamed')).values.size).toBeGreaterThan(0);
		});

		it('rejects bad input, leaving the profile and reset links alone', async () => {
			const token = await issueResetToken();
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

			expect((await getAdminProfile())?.username).toBe('admin');
			expect(await isValidResetToken(token)).toBe(true);
		});

		it('needs a valid second factor when 2FA is on', async () => {
			const { totp } = await enableTotp(cookies, PASSWORD);

			expect((await update({ ...profile, ...RIGHT })).status).toBe(401);
			expect((await update({ ...profile, ...RIGHT, code: '000000' })).status).toBe(401);
			expect((await getAdminProfile())?.username).toBe('admin');

			expect((await update({ ...profile, ...RIGHT, code: totpCode(totp) })).data).toEqual({
				profileSuccess: true
			});
			expect((await getAdminProfile())?.username).toBe('Renamed');
		});

		it('uses up a backup code given as the second factor', async () => {
			const { backupCodes } = await enableTotp(cookies, PASSWORD);

			expect((await update({ ...profile, ...RIGHT, code: backupCodes[0] })).data).toEqual({
				profileSuccess: true
			});
			expect((await update({ ...profile, ...RIGHT, code: backupCodes[0] })).status).toBe(401);
		});

		it('invalidates pending reset links only when the email really changes', async () => {
			const token = await issueResetToken();

			await update({ username: 'renamed', email: 'ADMIN@example.com', ...RIGHT });
			expect((await getAdminProfile())?.username).toBe('renamed');
			expect(await isValidResetToken(token)).toBe(true);

			await update({ ...profile, ...RIGHT });
			expect(await isValidResetToken(token)).toBe(false);
		});
	});

	describe('password change', () => {
		const change = (fields: Record<string, string>) => act(settings.actions.changePassword, fields);

		it('changes the password, revokes other sessions and keeps this browser in', async () => {
			const other = await signIn(PASSWORD);
			const resetToken = await issueResetToken();

			const result = await change({ ...RIGHT, ...newPasswordFields });

			expect(result.data).toEqual({ passwordSuccess: true });
			expect(await isValidResetToken(resetToken)).toBe(false);
			expect(await passwordMatches(NEW_PASSWORD)).toBe(true);
			expect(await hasSession(other)).toBe(false);
			expect(await hasSession(cookies)).toBe(true);
		});

		it('rejects bad input, leaving the password, sessions and reset links alone', async () => {
			const other = await signIn(PASSWORD);
			const resetToken = await issueResetToken();
			const attempts: [Record<string, string>, number][] = [
				[{ ...WRONG, ...newPasswordFields }, 401],
				[{ ...RIGHT, newPassword: NEW_PASSWORD, confirmPassword: 'different-password' }, 400]
			];

			for (const [fields, status] of attempts) {
				expect(await change(fields)).toMatchObject({ kind: 'failure', status });
			}

			expect(await passwordMatches(PASSWORD)).toBe(true);
			expect(await hasSession(other)).toBe(true);
			expect(await isValidResetToken(resetToken)).toBe(true);
		});

		it('shares the login lockout across password checks', async () => {
			const address = uniqueAddress();
			for (let i = 0; i < 5; i++) {
				await submit(settings.actions.changePassword, {
					fields: { ...WRONG, ...newPasswordFields },
					cookies,
					address
				});
			}

			const result = await submit(settings.actions.changePassword, {
				fields: { ...RIGHT, ...newPasswordFields },
				cookies,
				address
			});

			expect(result.status).toBe(401);
			expect(await passwordMatches(PASSWORD)).toBe(true);
		});
	});

	describe('recovery key rotation', () => {
		const rotate = (fields: Record<string, string>) =>
			act(settings.actions.rotateRecoveryKey, fields);

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
			const { totp } = await enableTotp(cookies, PASSWORD);

			expect((await rotate(RIGHT)).status).toBe(401);
			expect(await recoveryKeyMatches(RECOVERY_KEY)).toBe(true);

			expect((await rotate({ ...RIGHT, code: totpCode(totp) })).data.recoverySuccess).toBe(true);
			expect(await recoveryKeyMatches(RECOVERY_KEY)).toBe(false);
		});
	});

	describe('turning two-factor authentication on', () => {
		const start = (fields: Record<string, string>) => act(settings.actions.startTwoFactor, fields);
		const confirm = (value: string, address = uniqueAddress()) =>
			submit(settings.actions.confirmTwoFactor, { fields: { code: value }, cookies, address });
		const pendingTotp = async () => {
			const setupData = await pendingSetup();
			return new TOTP({ secret: setupData?.secret.replaceAll(' ', '') ?? '' });
		};

		it('starts setup after the password is confirmed', async () => {
			expect((await start(RIGHT)).kind).toBe('ok');
			expect(await pendingSetup()).not.toBeNull();
			expect(await twoFactorEnabled()).toBe(false);
		});

		it('refuses a wrong password, or starting while 2FA is already on', async () => {
			expect((await start(WRONG)).status).toBe(401);
			expect(await pendingSetup()).toBeNull();

			await enableTotp(cookies, PASSWORD);
			expect((await start(RIGHT)).status).toBe(400);
		});

		it('turns on with a valid code, signing out everything but this browser', async () => {
			await start(RIGHT);
			const totp = await pendingTotp();
			const other = await signIn(PASSWORD);

			const { data } = await confirm(totp.generate());

			expect(await twoFactorEnabled()).toBe(true);
			expect(await hasSession(other)).toBe(false);
			expect(await hasSession(cookies)).toBe(true);
			expect(data.backupCodes).toHaveLength(10);
			expect(await pendingSetup()).toBeNull();
		});

		it('stays off after a wrong code and locks out repeated guesses', async () => {
			await start(RIGHT);
			const totp = await pendingTotp();
			const address = uniqueAddress();
			for (let i = 0; i < 5; i++) {
				expect((await confirm('000000', address)).status).toBe(400);
			}

			expect((await confirm(totp.generate(), address)).status).toBe(429);
			expect(await twoFactorEnabled()).toBe(false);
		});

		it('can cancel a pending setup', async () => {
			await start(RIGHT);
			await act(settings.actions.cancelTwoFactor);
			expect(await pendingSetup()).toBeNull();
		});
	});

	describe('with two-factor authentication on', () => {
		let totp: TOTP;
		let backupCodes: string[];

		beforeEach(async () => {
			({ totp, backupCodes } = await enableTotp(cookies, PASSWORD));
		});

		it('reports how many backup codes are left', async () => {
			await act(settings.actions.rotateRecoveryKey, { ...RIGHT, code: backupCodes[0] });

			expect((await loadPage(settings.load, { cookies })).data).toMatchObject({
				twoFactorEnabled: true,
				backupCodesLeft: 9
			});
		});

		it('stays on without both the password and a valid code', async () => {
			for (const fields of [
				{ ...WRONG, code: totpCode(totp) },
				{ ...RIGHT, code: '000000' },
				RIGHT
			]) {
				expect((await act(settings.actions.disableTwoFactor, fields)).status).toBe(401);
			}

			expect(await twoFactorEnabled()).toBe(true);
		});

		it('turns off with the password and a valid code', async () => {
			const { data } = await act(settings.actions.disableTwoFactor, {
				...RIGHT,
				code: totpCode(totp)
			});

			expect(data.twoFactorSuccess).toMatch(/now off/);
			expect(await twoFactorEnabled()).toBe(false);
		});

		it('replaces the backup codes after the password and a code are confirmed', async () => {
			expect((await act(settings.actions.regenerateBackupCodes, RIGHT)).status).toBe(401);

			const { data } = await act(settings.actions.regenerateBackupCodes, {
				...RIGHT,
				code: totpCode(totp)
			});

			expect(data.regeneratedBackupCodes).toHaveLength(10);
			expect(data.regeneratedBackupCodes).not.toContain(backupCodes[1]);
			expect(
				(await act(settings.actions.disableTwoFactor, { ...RIGHT, code: backupCodes[1] })).status
			).toBe(401);
		});
	});
});
