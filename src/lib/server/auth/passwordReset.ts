import { sendPasswordResetEmail } from '../email';
import { getAdmin, redeemRecoveryKey, setAdminPassword } from './admin';
import { invalidateAllSessions } from './sessions';
import { createTokenStore } from './tokenStore';

const RESET_TOKEN_MAX_AGE_SECONDS = 15 * 60; // 15 minutes

const resetTokens = createTokenStore('password_reset_tokens', RESET_TOKEN_MAX_AGE_SECONDS);

/** Creates a new single-use password reset token (valid for 15 minutes), replacing any earlier one. */
export function createPasswordResetToken(): string {
	const token = resetTokens.issue();
	resetTokens.removeAllExcept(token);
	return token;
}

/** Verifies a password reset token from the reset URL. */
export function verifyResetToken(token: string | undefined | null): boolean {
	return resetTokens.isValid(token);
}

/** Consumes (deletes) a valid password reset token. */
export function consumePasswordResetToken(token: string): boolean {
	if (!resetTokens.isValid(token)) return false;
	resetTokens.remove(token);
	resetTokens.removeExpired();
	return true;
}

/** Deletes all pending reset tokens. */
export function invalidateAllResetTokens(): void {
	resetTokens.removeAll();
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
	if (!row) return false;

	const normId = identifierOrEmail.trim().toLowerCase();
	if (normId !== row.email.toLowerCase() && normId !== row.username.toLowerCase()) {
		return false;
	}

	// The new link only replaces earlier ones once it has been sent, so a failed send doesn't cost
	// the admin a link they already have.
	const token = resetTokens.issue();
	const sent = await sendPasswordResetEmail(row.email, `${origin}/admin/reset?token=${token}`);
	if (sent) resetTokens.removeAllExcept(token);
	else resetTokens.remove(token);
	return sent;
}

/**
 * Resets the admin password using a valid reset token. This does not sign anyone in: the admin
 * goes through the normal login afterwards, so two-factor authentication still applies.
 */
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
	// Consume the token before the slow hash, so the same link can't be redeemed twice at once.
	if (!consumePasswordResetToken(token)) return false;
	// A newer link may be on its way while an earlier one is used; neither should work afterwards.
	invalidateAllResetTokens();
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
