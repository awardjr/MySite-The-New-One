import crypto from 'node:crypto';
import { db } from './db';

export const SESSION_COOKIE_NAME = 'cms_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const SCRYPT_KEY_LENGTH = 64;

function hashPassword(password: string): string {
	const salt = crypto.randomBytes(16).toString('hex');
	const derived = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex');
	return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
	const [salt, derivedHex] = stored.split(':');
	if (!salt || !derivedHex) return false;
	const derived = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH);
	const expected = Buffer.from(derivedHex, 'hex');
	if (derived.length !== expected.length) return false;
	return crypto.timingSafeEqual(derived, expected);
}

const getAdminStmt = db.prepare('SELECT password_hash FROM admin_user WHERE id = 1');
const upsertAdminStmt = db.prepare(
	'INSERT INTO admin_user (id, password_hash, updated_at) VALUES (1, @passwordHash, @updatedAt) ' +
		'ON CONFLICT(id) DO UPDATE SET password_hash = excluded.password_hash, updated_at = excluded.updated_at'
);

/** Returns true once an admin password has been set up in the database. */
export function isAdminConfigured(): boolean {
	return getAdminStmt.get() !== undefined;
}

/** Sets (or replaces) the single admin password. */
export function setAdminPassword(password: string): void {
	upsertAdminStmt.run({
		passwordHash: hashPassword(password),
		updatedAt: new Date().toISOString()
	});
}

/** Checks a submitted login password against the stored admin password. */
export function checkPassword(candidate: string): boolean {
	if (!candidate) return false;
	const row = getAdminStmt.get() as { password_hash: string } | undefined;
	if (!row) return false;
	return verifyPassword(candidate, row.password_hash);
}

const insertSessionStmt = db.prepare(
	'INSERT INTO sessions (id, created_at, expires_at) VALUES (?, ?, ?)'
);
const getSessionStmt = db.prepare('SELECT expires_at FROM sessions WHERE id = ?');
const deleteSessionStmt = db.prepare('DELETE FROM sessions WHERE id = ?');
const deleteExpiredSessionsStmt = db.prepare('DELETE FROM sessions WHERE expires_at <= ?');

/** Creates a new session row and returns its id, to be stored in the session cookie. */
export function createSession(): string {
	const id = crypto.randomBytes(32).toString('hex');
	const now = new Date();
	const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);
	insertSessionStmt.run(id, now.toISOString(), expiresAt.toISOString());
	return id;
}

/** Verifies a session id from a cookie against the sessions table. */
export function verifySessionToken(token: string | undefined | null): boolean {
	if (!token) return false;
	const row = getSessionStmt.get(token) as { expires_at: string } | undefined;
	if (!row) return false;
	if (new Date(row.expires_at).getTime() <= Date.now()) {
		deleteSessionStmt.run(token);
		return false;
	}
	return true;
}

/** Deletes a session (used on logout). Opportunistically sweeps other expired sessions too. */
export function deleteSession(token: string | undefined | null): void {
	if (token) deleteSessionStmt.run(token);
	deleteExpiredSessionsStmt.run(new Date().toISOString());
}

export const sessionCookieOptions = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	maxAge: SESSION_MAX_AGE_SECONDS
};
