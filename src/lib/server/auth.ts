import crypto from 'node:crypto';
import { dev } from '$app/environment';
import { db } from './db';
import { sendPasswordResetEmail } from './email';
import { generateTotpSecret, verifyTotp } from './totp';
import {
	decryptSecret,
	encryptSecret,
	isEncryptedSecret,
	isEncryptionKeyConfigured
} from './secretbox';

export const SESSION_COOKIE_NAME = 'cms_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const RESET_TOKEN_MAX_AGE_SECONDS = 15 * 60; // 15 minutes
const SCRYPT_KEY_LENGTH = 64;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const TWO_FACTOR_CHALLENGE_MS = 5 * 60 * 1000; // 5 minutes to enter the code after the password

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

interface AdminUserRow {
	username: string | null;
	email: string | null;
	password_hash: string;
	recovery_key_hash: string | null;
	totp_secret: string | null;
	totp_pending_secret: string | null;
	totp_last_step: number | null;
	updated_at: string;
}

const getAdminStmt = db.prepare(
	'SELECT username, email, password_hash, recovery_key_hash, totp_secret, totp_pending_secret, ' +
		'totp_last_step, updated_at FROM admin_user WHERE id = 1'
);

const upsertAdminCredentialsStmt = db.prepare(
	'INSERT INTO admin_user (id, username, email, password_hash, recovery_key_hash, updated_at) ' +
		'VALUES (1, @username, @email, @passwordHash, @recoveryKeyHash, @updatedAt) ' +
		'ON CONFLICT(id) DO UPDATE SET ' +
		'username = excluded.username, ' +
		'email = excluded.email, ' +
		'password_hash = excluded.password_hash, ' +
		'recovery_key_hash = excluded.recovery_key_hash, ' +
		'updated_at = excluded.updated_at'
);

const updateAdminProfileStmt = db.prepare(
	'UPDATE admin_user SET username = @username, email = @email, updated_at = @updatedAt WHERE id = 1'
);

const updateAdminPasswordStmt = db.prepare(
	'UPDATE admin_user SET password_hash = @passwordHash, updated_at = @updatedAt WHERE id = 1'
);

const updateRecoveryKeyStmt = db.prepare(
	'UPDATE admin_user SET recovery_key_hash = @recoveryKeyHash, updated_at = @updatedAt WHERE id = 1'
);

const updateTotpStmt = db.prepare(
	'UPDATE admin_user SET totp_secret = @secret, totp_pending_secret = @pendingSecret, ' +
		'totp_last_step = @lastStep, updated_at = @updatedAt WHERE id = 1'
);

const updateTotpSecretStmt = db.prepare('UPDATE admin_user SET totp_secret = ? WHERE id = 1');
const updateTotpPendingSecretStmt = db.prepare(
	'UPDATE admin_user SET totp_pending_secret = ?, updated_at = ? WHERE id = 1'
);
const updateTotpLastStepStmt = db.prepare('UPDATE admin_user SET totp_last_step = ? WHERE id = 1');

function getAdmin(): AdminUserRow | undefined {
	const row = getAdminStmt.get() as AdminUserRow | undefined;
	if (!row || !isEncryptionKeyConfigured()) return row;

	if (row.totp_secret && !isEncryptedSecret(row.totp_secret)) {
		row.totp_secret = encryptSecret(row.totp_secret);
		updateTotpSecretStmt.run(row.totp_secret);
	}
	if (row.totp_pending_secret && !isEncryptedSecret(row.totp_pending_secret)) {
		row.totp_pending_secret = encryptSecret(row.totp_pending_secret);
		updateTotpPendingSecretStmt.run(row.totp_pending_secret, new Date().toISOString());
	}
	return row;
}

function readTotpSecret(value: string | null): string | null {
	if (!value) return null;
	if (!isEncryptedSecret(value)) return value;
	try {
		return decryptSecret(value);
	} catch {
		return null;
	}
}

/** Returns true once an admin user has been configured in the database. */
export function isAdminConfigured(): boolean {
	return getAdmin() !== undefined;
}

/** Returns the stored admin username and email. */
export function getAdminProfile(): { username: string; email: string } | null {
	const row = getAdmin();
	if (!row) return null;
	return {
		username: row.username ?? '',
		email: row.email ?? ''
	};
}

/** Sets or replaces the admin account credentials including username, email, password, and optional recovery key. */
export function setAdminCredentials(
	username: string,
	email: string,
	password: string,
	recoveryKey?: string
): void {
	const normalizedRecovery = recoveryKey ? normalizeRecoveryKey(recoveryKey) : null;
	upsertAdminCredentialsStmt.run({
		username: username.trim(),
		email: email.trim().toLowerCase(),
		passwordHash: hashPassword(password),
		recoveryKeyHash: normalizedRecovery ? hashPassword(normalizedRecovery) : null,
		updatedAt: new Date().toISOString()
	});
}

/** Updates the admin username and email address. */
export function updateAdminProfile(username: string, email: string): void {
	updateAdminProfileStmt.run({
		username: username.trim(),
		email: email.trim().toLowerCase(),
		updatedAt: new Date().toISOString()
	});
}

/** Sets (or replaces) the single admin password. */
export function setAdminPassword(password: string): void {
	updateAdminPasswordStmt.run({
		passwordHash: hashPassword(password),
		updatedAt: new Date().toISOString()
	});
}

/** Generates a human-friendly uppercase recovery key in groups of 4 (e.g. 4A8F-9C12-E7B0-3D5F). */
export function generateRecoveryKey(): string {
	const raw = crypto.randomBytes(8).toString('hex').toUpperCase();
	return raw.match(/.{1,4}/g)?.join('-') ?? raw;
}

/** Normalizes a recovery key candidate by removing whitespace, hyphens, and converting to uppercase. */
export function normalizeRecoveryKey(key: string): string {
	return key
		.trim()
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, '');
}

/** Returns true if a recovery key is configured in the database. */
export function hasRecoveryKey(): boolean {
	return Boolean(getAdmin()?.recovery_key_hash);
}

/** Verifies a candidate recovery key against the stored recovery key hash. */
export function verifyRecoveryKey(candidate: string): boolean {
	const normalized = normalizeRecoveryKey(candidate);
	if (!normalized) return false;
	const row = getAdmin();
	if (!row?.recovery_key_hash) return false;
	return verifyPassword(normalized, row.recovery_key_hash);
}

/** Sets (or updates) the stored recovery key for the admin user. */
export function setRecoveryKey(key: string): void {
	const normalized = normalizeRecoveryKey(key);
	updateRecoveryKeyStmt.run({
		recoveryKeyHash: hashPassword(normalized),
		updatedAt: new Date().toISOString()
	});
}

/** Checks a submitted login password against the stored admin password. */
export function checkPassword(candidate: string): boolean {
	if (!candidate) return false;
	const row = getAdmin();
	if (!row) return false;
	return verifyPassword(candidate, row.password_hash);
}

/** Checks submitted login credentials (username/email and password). Both are required. */
export function checkCredentials(identifier: string, candidatePassword: string): boolean {
	const normId = identifier.trim().toLowerCase();
	if (!normId || !candidatePassword) return false;
	const row = getAdmin();
	if (!row) return false;

	const idMatches =
		normId === (row.username ?? '').toLowerCase() || normId === (row.email ?? '').toLowerCase();
	// Always hash the password, so response time doesn't reveal whether the identifier matched.
	const passwordMatches = verifyPassword(candidatePassword, row.password_hash);
	return idMatches && passwordMatches;
}

function saveTotp(secret: string | null, pendingSecret: string | null, lastStep: number | null) {
	updateTotpStmt.run({
		secret: secret === null ? null : encryptSecret(secret),
		pendingSecret: pendingSecret === null ? null : encryptSecret(pendingSecret),
		lastStep,
		updatedAt: new Date().toISOString()
	});
}

/** Returns true if two-factor authentication is turned on for the admin account. */
export function isTotpEnabled(): boolean {
	return Boolean(getAdmin()?.totp_secret);
}

/** Returns the secret of a 2FA setup that was started but not yet confirmed, if any. */
export function getPendingTotpSecret(): string | null {
	return readTotpSecret(getAdmin()?.totp_pending_secret ?? null);
}

/** Starts 2FA setup by generating a new secret. It only takes effect once confirmed with a code. */
export function startTotpSetup(): string {
	if (!isEncryptionKeyConfigured()) {
		throw new Error(
			'TOTP_ENCRYPTION_KEY must be configured before setting up two-factor authentication.'
		);
	}
	const secret = generateTotpSecret();
	updateTotpPendingSecretStmt.run(encryptSecret(secret), new Date().toISOString());
	return secret;
}

/** Abandons a pending 2FA setup. */
export function cancelTotpSetup(): void {
	updateTotpPendingSecretStmt.run(null, new Date().toISOString());
}

/** Turns 2FA on if the code matches the pending secret, proving the authenticator app is set up. */
export function confirmTotpSetup(code: string): boolean {
	const pending = readTotpSecret(getAdmin()?.totp_pending_secret ?? null);
	if (!pending) return false;
	const step = verifyTotp(pending, code);
	if (step === null) return false;
	saveTotp(pending, null, step);
	return true;
}

/** Turns 2FA off and discards its secret. */
export function disableTotp(): void {
	saveTotp(null, null, null);
}

/** Checks a code from the authenticator app. Each code is accepted only once. */
export function verifyTotpCode(code: string): boolean {
	const row = getAdmin();
	const secret = readTotpSecret(row?.totp_secret ?? null);
	if (!secret || !row) return false;
	const step = verifyTotp(secret, code, row.totp_last_step);
	if (step === null) return false;
	updateTotpLastStepStmt.run(step);
	return true;
}

/**
 * Checks the second login factor: a 6-digit authenticator code, or the emergency recovery code
 * as a fallback for a lost authenticator.
 */
export function verifySecondFactor(input: string): boolean {
	return /^\s*\d{3}\s*\d{3}\s*$/.test(input) ? verifyTotpCode(input) : verifyRecoveryKey(input);
}

// Logins that passed the password check and are waiting for a 2FA code, keyed by a random token.
const twoFactorChallenges = new Map<string, { expiresAt: number; failures: number }>();

function sweepTwoFactorChallenges(now: number): void {
	for (const [token, challenge] of twoFactorChallenges) {
		if (challenge.expiresAt <= now) twoFactorChallenges.delete(token);
	}
}

/** Records that the password step succeeded and returns a token for the code step. */
export function createTwoFactorChallenge(): string {
	const now = Date.now();
	sweepTwoFactorChallenges(now);
	const token = crypto.randomBytes(32).toString('hex');
	twoFactorChallenges.set(token, { expiresAt: now + TWO_FACTOR_CHALLENGE_MS, failures: 0 });
	return token;
}

/** Returns true if the token belongs to a login that is still waiting for its 2FA code. */
export function hasTwoFactorChallenge(token: string | undefined | null): boolean {
	if (!token) return false;
	const challenge = twoFactorChallenges.get(token);
	if (!challenge) return false;
	if (challenge.expiresAt <= Date.now()) {
		twoFactorChallenges.delete(token);
		return false;
	}
	return true;
}

/**
 * Completes a pending login with a second-factor code. Returns true on success and consumes the
 * challenge. After MAX_ATTEMPTS wrong codes the challenge is discarded and the password is needed again.
 */
export function completeTwoFactorChallenge(
	token: string | undefined | null,
	input: string
): boolean {
	if (!token || !hasTwoFactorChallenge(token)) return false;
	if (verifySecondFactor(input)) {
		twoFactorChallenges.delete(token);
		return true;
	}
	const challenge = twoFactorChallenges.get(token);
	if (challenge && ++challenge.failures >= MAX_ATTEMPTS) twoFactorChallenges.delete(token);
	return false;
}

/** Discards a pending 2FA login (e.g. when the user goes back to the password step). */
export function cancelTwoFactorChallenge(token: string | undefined | null): void {
	if (token) twoFactorChallenges.delete(token);
}

export const TWO_FACTOR_COOKIE_NAME = 'cms_2fa';

export const twoFactorCookieOptions = {
	path: '/admin/login',
	httpOnly: true,
	secure: !dev,
	sameSite: 'strict' as const,
	maxAge: TWO_FACTOR_CHALLENGE_MS / 1000
};

const insertSessionStmt = db.prepare(
	'INSERT INTO sessions (id, created_at, expires_at) VALUES (?, ?, ?)'
);
const getSessionStmt = db.prepare('SELECT expires_at FROM sessions WHERE id = ?');
const deleteSessionStmt = db.prepare('DELETE FROM sessions WHERE id = ?');
const deleteExpiredSessionsStmt = db.prepare('DELETE FROM sessions WHERE expires_at <= ?');
const deleteAllSessionsStmt = db.prepare('DELETE FROM sessions WHERE id IS NOT NULL');

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

/** Deletes every active session. Used when the admin password changes, so any stolen session is revoked. */
export function invalidateAllSessions(): void {
	deleteAllSessionsStmt.run();
	twoFactorChallenges.clear();
}

export const sessionCookieOptions = {
	path: '/',
	httpOnly: true,
	secure: !dev,
	sameSite: 'lax' as const,
	maxAge: SESSION_MAX_AGE_SECONDS
};

const insertResetTokenStmt = db.prepare(
	'INSERT INTO password_reset_tokens (token, created_at, expires_at) VALUES (?, ?, ?)'
);
const getResetTokenStmt = db.prepare(
	'SELECT expires_at FROM password_reset_tokens WHERE token = ?'
);
const deleteResetTokenStmt = db.prepare('DELETE FROM password_reset_tokens WHERE token = ?');
const deleteExpiredResetTokensStmt = db.prepare(
	'DELETE FROM password_reset_tokens WHERE expires_at <= ?'
);
const deleteAllResetTokensStmt = db.prepare(
	'DELETE FROM password_reset_tokens WHERE token IS NOT NULL'
);

/** Creates a new single-use password reset token (valid for 15 minutes). */
export function createPasswordResetToken(): string {
	deleteAllResetTokensStmt.run();
	const token = crypto.randomBytes(32).toString('hex');
	const now = new Date();
	const expiresAt = new Date(now.getTime() + RESET_TOKEN_MAX_AGE_SECONDS * 1000);
	insertResetTokenStmt.run(token, now.toISOString(), expiresAt.toISOString());
	return token;
}

/** Verifies a password reset token from the reset URL. */
export function verifyResetToken(token: string | undefined | null): boolean {
	if (!token) return false;
	const row = getResetTokenStmt.get(token) as { expires_at: string } | undefined;
	if (!row) return false;
	if (new Date(row.expires_at).getTime() <= Date.now()) {
		deleteResetTokenStmt.run(token);
		return false;
	}
	return true;
}

/** Consumes (deletes) a valid password reset token. */
export function consumePasswordResetToken(token: string): boolean {
	if (!verifyResetToken(token)) return false;
	deleteResetTokenStmt.run(token);
	deleteExpiredResetTokensStmt.run(new Date().toISOString());
	return true;
}

/** Deletes all pending reset tokens. */
export function invalidateAllResetTokens(): void {
	deleteAllResetTokensStmt.run();
}

/**
 * Requests a password reset link to be sent via email to the admin account.
 * Returns true if the provided identifier matches the admin account and an email was sent.
 */
export async function requestEmailPasswordReset(
	identifierOrEmail: string,
	origin?: string
): Promise<boolean> {
	const row = getAdmin();
	if (!row || !row.email) return false;

	const normId = identifierOrEmail.trim().toLowerCase();
	if (normId !== row.email.toLowerCase() && normId !== (row.username ?? '').toLowerCase()) {
		return false;
	}

	const token = createPasswordResetToken();
	const resetUrl = origin ? `${origin}/admin/reset?token=${token}` : `/admin/reset?token=${token}`;
	await sendPasswordResetEmail(row.email, resetUrl);
	return true;
}

/** Resets the admin password using a valid reset token. */
export function resetPasswordWithToken(token: string, newPassword: string): boolean {
	if (!verifyResetToken(token)) return false;
	setAdminPassword(newPassword);
	consumePasswordResetToken(token);
	invalidateAllSessions();
	return true;
}

/** Resets the admin password using a valid emergency recovery code. */
export function resetPasswordWithRecoveryKey(recoveryKey: string, newPassword: string): boolean {
	if (!verifyRecoveryKey(recoveryKey)) return false;
	setAdminPassword(newPassword);
	invalidateAllResetTokens();
	invalidateAllSessions();
	return true;
}

interface AttemptState {
	failures: number;
	/** When this record stops counting: end of the lockout, or end of the failure window. */
	expiresAt: number;
	locked: boolean;
}

// Above this many tracked addresses, expired records are swept so memory stays bounded.
const MAX_TRACKED_ADDRESSES = 1000;

/** In-memory brute-force guard keyed by client address. Failures older than LOCKOUT_MS are forgotten. */
function createAttemptLimiter() {
	const attempts = new Map<string, AttemptState>();

	function current(identifier: string, now: number): AttemptState | undefined {
		const state = attempts.get(identifier);
		if (state && state.expiresAt <= now) {
			attempts.delete(identifier);
			return undefined;
		}
		return state;
	}

	return {
		isLocked(identifier: string): boolean {
			return current(identifier, Date.now())?.locked ?? false;
		},
		recordFailure(identifier: string): void {
			const now = Date.now();
			if (attempts.size >= MAX_TRACKED_ADDRESSES) {
				for (const [key, state] of attempts) {
					if (state.expiresAt <= now) attempts.delete(key);
				}
			}
			const state = current(identifier, now) ?? {
				failures: 0,
				expiresAt: now + LOCKOUT_MS,
				locked: false
			};
			state.failures += 1;
			if (state.failures >= MAX_ATTEMPTS && !state.locked) {
				state.locked = true;
				state.expiresAt = now + LOCKOUT_MS;
			}
			attempts.set(identifier, state);
		},
		clear(identifier: string): void {
			attempts.delete(identifier);
		}
	};
}

const loginAttempts = createAttemptLimiter();
const resetAttempts = createAttemptLimiter();

/** Returns true if the given identifier (e.g. client IP) is currently locked out from logging in. */
export function isLoginLocked(identifier: string): boolean {
	return loginAttempts.isLocked(identifier);
}

/** Records a failed login attempt, locking out the identifier after too many failures. */
export function recordFailedLogin(identifier: string): void {
	loginAttempts.recordFailure(identifier);
}

/** Clears any recorded failures for the identifier after a successful login. */
export function recordSuccessfulLogin(identifier: string): void {
	loginAttempts.clear(identifier);
}

/** Returns true if the given identifier is currently locked out from requesting/performing resets. */
export function isResetLocked(identifier: string): boolean {
	return resetAttempts.isLocked(identifier);
}

/** Records a failed (or rate-limited) reset attempt, locking out the identifier after too many. */
export function recordFailedReset(identifier: string): void {
	resetAttempts.recordFailure(identifier);
}

/** Clears any recorded reset failures for the identifier after a successful reset. */
export function recordSuccessfulReset(identifier: string): void {
	resetAttempts.clear(identifier);
}
