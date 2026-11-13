import { db } from '../db';
import { sendPasswordResetEmail } from '../email';
import { getAdmin, redeemRecoveryKey, setAdminPassword } from './admin';
import { hashToken, newToken } from './secrets';
import { invalidateAllSessions } from './sessions';

const RESET_TOKEN_MAX_AGE_SECONDS = 15 * 60; // 15 minutes

// Only a hash of each reset token is stored; the token itself only exists in the emailed link.
const insertResetTokenStmt = db.prepare(
	'INSERT INTO password_reset_tokens (token_hash, created_at, expires_at) VALUES (?, ?, ?)'
);
const getResetTokenStmt = db.prepare(
	'SELECT expires_at FROM password_reset_tokens WHERE token_hash = ?'
);
const deleteResetTokenStmt = db.prepare('DELETE FROM password_reset_tokens WHERE token_hash = ?');
const deleteExpiredResetTokensStmt = db.prepare(
	'DELETE FROM password_reset_tokens WHERE expires_at <= ?'
);
const deleteAllResetTokensStmt = db.prepare(
	'DELETE FROM password_reset_tokens WHERE token_hash IS NOT NULL'
);

/** Creates a new single-use password reset token (valid for 15 minutes), replacing any earlier one. */
export function createPasswordResetToken(): string {
	deleteAllResetTokensStmt.run();
	const token = newToken();
	const now = new Date();
	const expiresAt = new Date(now.getTime() + RESET_TOKEN_MAX_AGE_SECONDS * 1000);
	insertResetTokenStmt.run(hashToken(token), now.toISOString(), expiresAt.toISOString());
	return token;
}

/** Verifies a password reset token from the reset URL. */
export function verifyResetToken(token: string | undefined | null): boolean {
	if (!token) return false;
	const tokenHash = hashToken(token);
	const row = getResetTokenStmt.get(tokenHash) as { expires_at: string } | undefined;
	if (!row) return false;
	if (new Date(row.expires_at).getTime() <= Date.now()) {
		deleteResetTokenStmt.run(tokenHash);
		return false;
	}
	return true;
}

/** Consumes (deletes) a valid password reset token. */
export function consumePasswordResetToken(token: string): boolean {
	if (!verifyResetToken(token)) return false;
	deleteResetTokenStmt.run(hashToken(token));
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
 * `origin` must come from configuration, never from request headers.
 */
export async function requestEmailPasswordReset(
	identifierOrEmail: string,
	origin: string
): Promise<boolean> {
	const row = getAdmin();
	if (!row || !row.email) return false;

	const normId = identifierOrEmail.trim().toLowerCase();
	if (normId !== row.email.toLowerCase() && normId !== (row.username ?? '').toLowerCase()) {
		return false;
	}

	const token = createPasswordResetToken();
	await sendPasswordResetEmail(row.email, `${origin}/admin/reset?token=${token}`);
	return true;
}

/**
 * Resets the admin password using a valid reset token. This does not sign anyone in: the admin
 * goes through the normal login afterwards, so two-factor authentication still applies.
 */
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
	// Consume the token before the slow hash, so the same link can't be redeemed twice at once.
	if (!consumePasswordResetToken(token)) return false;
	await setAdminPassword(newPassword);
	invalidateAllSessions();
	return true;
}

/**
 * Resets the admin password using the emergency recovery code. The code is used up; the
 * replacement is returned so it can be shown once. Returns null if the code doesn't match.
 */
export async function resetPasswordWithRecoveryKey(
	recoveryKey: string,
	newPassword: string
): Promise<string | null> {
	const newRecoveryKey = await redeemRecoveryKey(recoveryKey);
	if (!newRecoveryKey) return null;
	await setAdminPassword(newPassword);
	invalidateAllResetTokens();
	invalidateAllSessions();
	return newRecoveryKey;
}
