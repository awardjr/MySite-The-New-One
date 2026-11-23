import { TOTP, URI } from 'otpauth';
import {
	auth,
	createAdmin,
	getAdmin,
	hashSecret,
	isSignedIn,
	loginAttempts,
	normalizeRecoveryKey,
	verifySecret
} from '#lib/server/auth.js';
import * as login from '../src/routes/admin/login/+page.server';
import { setActiveEvent } from './request-event';
import { cookieHeader, fakeCookies, submit } from './route-helpers';
import { getTestDb } from './test-db';

type Cookies = ReturnType<typeof fakeCookies>;

const DEFAULT_RECOVERY_KEY = 'FFFF-EEEE-DDDD-CCCC';
const AUTH_TABLES = ['twoFactor', 'session', 'account', 'verification', 'user'];
const LIMITER_TABLES = ['login_attempts', 'reset_attempts'];

const context = await auth.$context;

export function clearAuth(): void {
	const db = getTestDb();
	for (const table of [...AUTH_TABLES, ...LIMITER_TABLES]) db.exec(`DELETE FROM "${table}"`);
}

export async function seedAdmin(
	username: string,
	email: string,
	password: string,
	recoveryKey = DEFAULT_RECOVERY_KEY
): Promise<void> {
	clearAuth();
	setActiveEvent(undefined);
	await createAdmin(username, email, password);
	await context.internalAdapter.deleteUserSessions(await adminId());
	await context.internalAdapter.updateUser(await adminId(), {
		recoveryKeyHash: await hashSecret(normalizeRecoveryKey(recoveryKey))
	});
}

async function adminId(): Promise<string> {
	const admin = await getAdmin();
	if (!admin) throw new Error('No admin account.');
	return admin.id;
}

export async function recoveryKeyMatches(candidate: unknown): Promise<boolean> {
	if (typeof candidate !== 'string') return false;
	return verifySecret(normalizeRecoveryKey(candidate), (await getAdmin())?.recoveryKeyHash);
}

export async function passwordMatches(password: string): Promise<boolean> {
	const [account] = await context.internalAdapter.findAccounts(await adminId());
	return verifySecret(password, account?.password);
}

export async function lockLogin(address: string): Promise<void> {
	for (let i = 0; i < 5; i++) await loginAttempts.guard(address, async () => false);
}

export function authHeaders(cookies: Cookies): Headers {
	setActiveEvent({ cookies, url: new URL('https://example.test/') });
	return new Headers({ cookie: cookieHeader(cookies) });
}

export function hasSession(cookies: Cookies): Promise<boolean> {
	return isSignedIn(authHeaders(cookies));
}

export function sessionCount(): number {
	return (getTestDb().prepare('SELECT COUNT(*) AS n FROM session').get() as { n: number }).n;
}

export async function signIn(password: string, identifier = 'admin'): Promise<Cookies> {
	const cookies = fakeCookies();
	const result = await submit(login.actions.default, {
		fields: { username: identifier, password },
		cookies
	});
	if (result.kind !== 'redirect') throw new Error(`Sign-in failed: ${JSON.stringify(result)}`);
	return cookies;
}

export async function enableTotp(
	cookies: Cookies,
	password: string
): Promise<{ totp: TOTP; backupCodes: string[] }> {
	const enabled = await auth.api.enableTwoFactor({
		body: { password },
		headers: authHeaders(cookies)
	});
	if (!('totpURI' in enabled)) throw new Error('Expected a TOTP setup.');
	const { totpURI, backupCodes } = enabled;
	const totp = URI.parse(totpURI) as TOTP;
	await auth.api.verifyTOTP({ body: { code: totp.generate() }, headers: authHeaders(cookies) });
	return { totp, backupCodes };
}

export function totpCode(totp: TOTP, offset = 0): string {
	return totp.generate({ timestamp: Date.now() + offset * 30_000 });
}
