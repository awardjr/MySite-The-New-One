import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/env';
import { db } from '../db';
import { hashToken, newToken } from './secrets';
import { clearTwoFactorChallenges } from './twoFactor';

export const SESSION_COOKIE_NAME = 'cms_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Only a hash of each session id is stored; the id itself lives in the admin's cookie.
const insertSessionStmt = db.prepare(
	'INSERT INTO sessions (token_hash, created_at, expires_at) VALUES (?, ?, ?)'
);
const getSessionStmt = db.prepare('SELECT expires_at FROM sessions WHERE token_hash = ?');
const deleteSessionStmt = db.prepare('DELETE FROM sessions WHERE token_hash = ?');
const deleteExpiredSessionsStmt = db.prepare('DELETE FROM sessions WHERE expires_at <= ?');
const deleteAllSessionsStmt = db.prepare('DELETE FROM sessions WHERE token_hash IS NOT NULL');

/** Creates a new session row and returns its id, to be stored in the session cookie. */
export function createSession(): string {
	const id = newToken();
	const now = new Date();
	const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);
	insertSessionStmt.run(hashToken(id), now.toISOString(), expiresAt.toISOString());
	return id;
}

/** Verifies a session id from a cookie against the sessions table. */
export function verifySessionToken(token: string | undefined | null): boolean {
	if (!token) return false;
	const tokenHash = hashToken(token);
	const row = getSessionStmt.get(tokenHash) as { expires_at: string } | undefined;
	if (!row) return false;
	if (new Date(row.expires_at).getTime() <= Date.now()) {
		deleteSessionStmt.run(tokenHash);
		return false;
	}
	return true;
}

/** Deletes a session (used on logout). Opportunistically sweeps other expired sessions too. */
export function deleteSession(token: string | undefined | null): void {
	if (token) deleteSessionStmt.run(hashToken(token));
	deleteExpiredSessionsStmt.run(new Date().toISOString());
}

/** Deletes every active session. Used when the admin password changes, so any stolen session is revoked. */
export function invalidateAllSessions(): void {
	deleteAllSessionsStmt.run();
	clearTwoFactorChallenges();
}

export const sessionCookieOptions = {
	path: '/',
	httpOnly: true,
	secure: !dev,
	sameSite: 'lax' as const,
	maxAge: SESSION_MAX_AGE_SECONDS
};

/** Signs the browser in by creating a session and storing its id in the session cookie. */
export function startSession(cookies: Cookies): void {
	cookies.set(SESSION_COOKIE_NAME, createSession(), sessionCookieOptions);
}

/** Signs the browser out by deleting its session and clearing the session cookie. */
export function endSession(cookies: Cookies): void {
	deleteSession(cookies.get(SESSION_COOKIE_NAME));
	cookies.delete(SESSION_COOKIE_NAME, { path: sessionCookieOptions.path });
}
