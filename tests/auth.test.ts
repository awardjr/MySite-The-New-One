import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/server/db', async () => {
	const { getTestDb } = await import('./test-db');
	return { db: getTestDb() };
});

import { getTestDb } from './test-db';
import {
	checkPassword,
	createSession,
	deleteSession,
	isAdminConfigured,
	setAdminPassword,
	verifySessionToken
} from '../src/lib/server/auth';

const testDb = getTestDb();

beforeEach(() => {
	testDb.exec('DELETE FROM admin_user');
	testDb.exec('DELETE FROM sessions');
});

describe('admin password', () => {
	it('is not configured until a password is set', () => {
		expect(isAdminConfigured()).toBe(false);
	});

	it('is configured once a password has been set', () => {
		setAdminPassword('correct-horse');
		expect(isAdminConfigured()).toBe(true);
	});

	it('accepts the correct password', () => {
		setAdminPassword('correct-horse');
		expect(checkPassword('correct-horse')).toBe(true);
	});

	it('rejects an incorrect password', () => {
		setAdminPassword('correct-horse');
		expect(checkPassword('wrong-password')).toBe(false);
	});

	it('rejects an empty candidate', () => {
		setAdminPassword('correct-horse');
		expect(checkPassword('')).toBe(false);
	});

	it('rejects any password when none is configured', () => {
		expect(checkPassword('anything')).toBe(false);
	});

	it('replaces the previous password when set again', () => {
		setAdminPassword('first-password');
		setAdminPassword('second-password');
		expect(checkPassword('first-password')).toBe(false);
		expect(checkPassword('second-password')).toBe(true);
	});
});

describe('sessions', () => {
	it('creates a session that verifies as valid', () => {
		const token = createSession();
		expect(verifySessionToken(token)).toBe(true);
	});

	it('rejects a missing token', () => {
		expect(verifySessionToken(undefined)).toBe(false);
		expect(verifySessionToken(null)).toBe(false);
	});

	it('rejects an unknown token', () => {
		expect(verifySessionToken('not-a-real-token')).toBe(false);
	});

	it('rejects a token after it has been deleted', () => {
		const token = createSession();
		deleteSession(token);
		expect(verifySessionToken(token)).toBe(false);
	});

	it('rejects and removes an expired session', () => {
		const token = createSession();
		testDb
			.prepare('UPDATE sessions SET expires_at = ? WHERE id = ?')
			.run(new Date(Date.now() - 1000).toISOString(), token);

		expect(verifySessionToken(token)).toBe(false);

		const row = testDb.prepare('SELECT id FROM sessions WHERE id = ?').get(token);
		expect(row).toBeUndefined();
	});
});
