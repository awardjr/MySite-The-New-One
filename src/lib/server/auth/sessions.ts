import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/env';
import { createTokenStore } from './tokenStore';
import { clearTwoFactorChallenges } from './twoFactor';

export const SESSION_COOKIE_NAME = 'cms_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const sessions = createTokenStore('sessions', SESSION_MAX_AGE_SECONDS);

/** Creates a new session row and returns its id, to be stored in the session cookie. */
export function createSession(): string {
	return sessions.issue();
}

/** Verifies a session id from a cookie against the sessions table. */
export function verifySessionToken(token: string | undefined | null): boolean {
	return sessions.isValid(token);
}

/** Deletes a session (used on logout). Opportunistically sweeps other expired sessions too. */
export function deleteSession(token: string | undefined | null): void {
	if (token) sessions.remove(token);
	sessions.removeExpired();
}

/** Deletes every active session. Used when the admin password changes, so any stolen session is revoked. */
export function invalidateAllSessions(): void {
	sessions.removeAll();
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
