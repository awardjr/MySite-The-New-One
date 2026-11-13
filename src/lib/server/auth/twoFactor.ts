import { dev } from '$app/env';
import { db } from '../db';
import {
	decryptSecret,
	encryptSecret,
	isEncryptedSecret,
	isEncryptionKeyConfigured
} from '../secretbox';
import { generateTotpSecret, verifyTotp } from '../totp';
import { getAdmin, redeemRecoveryKey, type AdminUserRow } from './admin';
import { newToken } from './secrets';

const MAX_CHALLENGE_FAILURES = 5;
const TWO_FACTOR_CHALLENGE_MS = 5 * 60 * 1000; // 5 minutes to enter the code after the password

const updateTotpStmt = db.prepare(
	'UPDATE admin_user SET totp_secret = @secret, totp_pending_secret = @pendingSecret, ' +
		'totp_last_step = @lastStep, updated_at = @updatedAt WHERE id = 1'
);
const updateTotpSecretStmt = db.prepare('UPDATE admin_user SET totp_secret = ? WHERE id = 1');
const updateTotpPendingSecretStmt = db.prepare(
	'UPDATE admin_user SET totp_pending_secret = ?, updated_at = ? WHERE id = 1'
);
const updateTotpLastStepStmt = db.prepare('UPDATE admin_user SET totp_last_step = ? WHERE id = 1');

/** Reads the admin row, encrypting any TOTP secret an older version stored as plaintext. */
function getAdminWithEncryptedSecrets(): AdminUserRow | undefined {
	const row = getAdmin();
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

function readTotpSecret(value: string | null | undefined): string | null {
	if (!value) return null;
	if (!isEncryptedSecret(value)) return value;
	try {
		return decryptSecret(value);
	} catch {
		return null;
	}
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
	return readTotpSecret(getAdminWithEncryptedSecrets()?.totp_pending_secret);
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
	const pending = getPendingTotpSecret();
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
	const row = getAdminWithEncryptedSecrets();
	const secret = readTotpSecret(row?.totp_secret);
	if (!secret || !row) return false;
	const step = verifyTotp(secret, code, row.totp_last_step);
	if (step === null) return false;
	updateTotpLastStepStmt.run(step);
	return true;
}

/** How a second factor was satisfied. A recovery code is used up and replaced by `newRecoveryKey`. */
export type SecondFactor = { method: 'totp' } | { method: 'recovery'; newRecoveryKey: string };

/**
 * Checks the second login factor: a 6-digit authenticator code, or the emergency recovery code
 * as a fallback for a lost authenticator. Returns null if the input matches neither.
 */
export async function verifySecondFactor(input: string): Promise<SecondFactor | null> {
	if (/^\s*\d{3}\s*\d{3}\s*$/.test(input)) {
		return verifyTotpCode(input) ? { method: 'totp' } : null;
	}
	const newRecoveryKey = await redeemRecoveryKey(input);
	return newRecoveryKey ? { method: 'recovery', newRecoveryKey } : null;
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
	const token = newToken();
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
 * Completes a pending login with a second-factor code. On success the challenge is consumed and
 * the way the factor was satisfied is returned. After too many wrong codes the challenge is
 * discarded and the password is needed again.
 */
export async function completeTwoFactorChallenge(
	token: string | undefined | null,
	input: string
): Promise<SecondFactor | null> {
	if (!token || !hasTwoFactorChallenge(token)) return null;
	const factor = await verifySecondFactor(input);
	// The challenge may have been cancelled or used while the code was being checked.
	const challenge = twoFactorChallenges.get(token);
	if (!challenge) return null;
	if (factor) {
		twoFactorChallenges.delete(token);
		return factor;
	}
	if (++challenge.failures >= MAX_CHALLENGE_FAILURES) twoFactorChallenges.delete(token);
	return null;
}

/** Discards a pending 2FA login (e.g. when the user goes back to the password step). */
export function cancelTwoFactorChallenge(token: string | undefined | null): void {
	if (token) twoFactorChallenges.delete(token);
}

/** Discards every pending 2FA login. Used whenever all sessions are revoked. */
export function clearTwoFactorChallenges(): void {
	twoFactorChallenges.clear();
}

export const TWO_FACTOR_COOKIE_NAME = 'cms_2fa';

export const twoFactorCookieOptions = {
	path: '/admin/login',
	httpOnly: true,
	secure: !dev,
	sameSite: 'strict' as const,
	maxAge: TWO_FACTOR_CHALLENGE_MS / 1000
};
