import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/server/db.js', async () => {
	const { migratedTestDb } = await import('./test-db');
	return { db: await migratedTestDb() };
});
vi.mock('#lib/server/email.js', () => ({ sendPasswordResetEmail: vi.fn(async () => true) }));
vi.mock('$app/env', () => ({ dev: false, browser: false, building: false }));

import { fakeCookies, uniqueAddress } from './route-helpers';
import { authHeaders, enableTotp, hasSession, seedAdmin, signIn } from './auth-helpers';
import { getTestDb } from './test-db';
import {
	createAdmin,
	generateRecoveryKey,
	hashSecret,
	loginAttempts,
	normalizeRecoveryKey,
	requestEmailPasswordReset,
	resetAttempts,
	signInWithPassword,
	validateNewPassword,
	validateProfile,
	verifySecret
} from '#lib/server/auth.js';
import { sendPasswordResetEmail } from '#lib/server/email.js';

const testDb = getTestDb();
const PASSWORD = 'supersecret123';
const DAY = 24 * 60 * 60 * 1000;

beforeEach(async () => {
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date('2026-01-15T12:00:10Z'));
	await seedAdmin('Admin', 'admin@example.com', PASSWORD);
});

afterEach(() => {
	vi.useRealTimers();
});

describe('password hashing', () => {
	it('hashes with argon2id and verifies only the right secret', async () => {
		const stored = await hashSecret('hunter22');

		expect(stored).toMatch(/^\$argon2id\$/);
		expect(await hashSecret('hunter22')).not.toBe(stored);
		expect(await verifySecret('hunter22', stored)).toBe(true);
		expect(await verifySecret('hunter23', stored)).toBe(false);
	});

	it('treats missing or malformed hashes as a mismatch', async () => {
		for (const stored of [null, undefined, '', 'not-a-hash']) {
			expect(await verifySecret('hunter22', stored), String(stored)).toBe(false);
		}
		expect(await verifySecret('', await hashSecret('x'))).toBe(false);
	});
});

describe('recovery keys', () => {
	it('generates distinct grouped keys and normalizes what people type', () => {
		const key = generateRecoveryKey();

		expect(key).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
		expect(generateRecoveryKey()).not.toBe(key);
		expect(normalizeRecoveryKey(' ab12-cd34 ef56_gh78 ')).toBe('AB12CD34EF56GH78');
	});
});

describe('input validation', () => {
	it('checks the profile', () => {
		expect(validateProfile('admin', 'admin@example.com')).toBeNull();
		expect(validateProfile('', 'admin@example.com')).toMatch(/required/);
		expect(validateProfile('me@home', 'admin@example.com')).toMatch(/@/);
		expect(validateProfile('admin', 'nope')).toMatch(/valid email/);
	});

	it('checks new passwords', () => {
		expect(validateNewPassword('long-enough', 'long-enough')).toBeNull();
		expect(validateNewPassword('short', 'short')).toMatch(/at least 8/);
		expect(validateNewPassword('x'.repeat(129), 'x'.repeat(129))).toMatch(/at most 128/);
		expect(validateNewPassword('long-enough', 'different')).toMatch(/do not match/);
	});
});

describe('attempt limits', () => {
	it('locks an address after five failures and counts only failures', async () => {
		const address = uniqueAddress();
		for (let i = 0; i < 10; i++)
			expect(await loginAttempts.guard(address, async () => true)).toBe(true);
		for (let i = 0; i < 5; i++)
			expect(await loginAttempts.guard(address, async () => false)).toBe(false);

		const check = vi.fn(async () => true);
		expect(await loginAttempts.guard(address, check)).toBe('locked');
		expect(check).not.toHaveBeenCalled();
	});

	it('unlocks after 15 minutes or when cleared', async () => {
		const address = uniqueAddress();
		for (let i = 0; i < 5; i++) await loginAttempts.guard(address, async () => false);

		await loginAttempts.clear(address);
		expect(await loginAttempts.guard(address, async () => true)).toBe(true);

		for (let i = 0; i < 6; i++) await loginAttempts.guard(address, async () => false);
		vi.useRealTimers();
		vi.useFakeTimers({ toFake: ['Date'], now: Date.now() + 15 * 60 * 1000 + 1000 });
		expect(await loginAttempts.guard(address, async () => true)).toBe(true);
	});

	it('does not count a check that throws', async () => {
		const address = uniqueAddress();
		for (let i = 0; i < 6; i++) {
			await expect(
				loginAttempts.guard(address, async () => {
					throw new Error('database unavailable');
				})
			).rejects.toThrow('database unavailable');
		}
		expect(await loginAttempts.guard(address, async () => 'still running')).toBe('still running');
	});

	it('keeps login and reset limits apart, and stores them in the database', async () => {
		const address = uniqueAddress();
		for (let i = 0; i < 5; i++) await loginAttempts.guard(address, async () => false);

		expect(await resetAttempts.take(address)).toBe(true);
		expect(
			testDb.prepare('SELECT COUNT(*) AS n FROM login_attempts WHERE key LIKE ?').get(`%${address}`)
		).toEqual({ n: 1 });
	});
});

describe('admin account', () => {
	it('allows only one account, even when inserted directly', async () => {
		expect(await createAdmin('second', 'second@example.com', PASSWORD)).toBeNull();
		expect(() =>
			testDb
				.prepare(
					`INSERT INTO "user" (id, name, email, emailVerified, createdAt, updatedAt) VALUES ('x', 'x', 'x@example.com', 0, '', '')`
				)
				.run()
		).toThrow(/Only one admin account/);
	});

	it('signs in by username in any case or by email, and rejects anything else', async () => {
		const headers = new Headers();
		for (const identifier of ['admin', 'ADMIN', ' Admin ', 'Admin@Example.com']) {
			authHeaders(fakeCookies());
			expect(await signInWithPassword(headers, identifier, PASSWORD), identifier).toEqual({
				twoFactor: false
			});
		}
		for (const [identifier, password] of [
			['admin', 'wrong-password'],
			['someone', PASSWORD],
			['', PASSWORD],
			['admin', '']
		]) {
			expect(await signInWithPassword(headers, identifier, password)).toBeNull();
		}
	});

	it('ends sessions after seven days', async () => {
		const cookies = await signIn(PASSWORD);
		expect(await hasSession(cookies)).toBe(true);

		vi.setSystemTime(Date.now() + 7 * DAY + 1000);
		expect(await hasSession(cookies)).toBe(false);
	});
});

describe('stored secrets', () => {
	const columnValues = (table: string) =>
		JSON.stringify(testDb.prepare(`SELECT * FROM "${table}"`).all());

	it('keeps reset tokens only as hashes', async () => {
		authHeaders(fakeCookies());
		await requestEmailPasswordReset('admin');
		const link = vi.mocked(sendPasswordResetEmail).mock.calls.at(-1)?.[1] ?? '';
		const token = new URL(link).searchParams.get('token') ?? '';

		expect(token).toHaveLength(24);
		expect(columnValues('verification')).not.toContain(token);
	});

	it('encrypts the authenticator secret and backup codes', async () => {
		const { totp, backupCodes } = await enableTotp(await signIn(PASSWORD), PASSWORD);

		const stored = columnValues('twoFactor');
		expect(stored).not.toContain(totp.secret.base32);
		for (const code of backupCodes) expect(stored).not.toContain(code);
	});
});
