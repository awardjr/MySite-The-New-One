import { isAPIError } from 'better-auth/api';
import { generateRandomString } from 'better-auth/crypto';
import { unlessRejected } from './errors';
import { auth, RESET_TOKEN_PREFIX } from './instance';
import { hashSecret, verifySecret } from './passwords';

export interface AdminUser {
	id: string;
	email: string;
	username: string;
	displayUsername: string;
	twoFactorEnabled: boolean;
	recoveryKeyHash: string | null;
}

const context = await auth.$context;

export async function getAdmin(): Promise<AdminUser | null> {
	const [admin] = await context.internalAdapter.listUsers(1);
	return (admin as unknown as AdminUser | undefined) ?? null;
}

export async function isAdminConfigured(): Promise<boolean> {
	return (await context.internalAdapter.countTotalUsers()) > 0;
}

export async function getAdminProfile(): Promise<{ username: string; email: string } | null> {
	const admin = await getAdmin();
	return admin && { username: admin.displayUsername || admin.username, email: admin.email };
}

export async function isSignedIn(headers: Headers): Promise<boolean> {
	return (await auth.api.getSession({ headers })) !== null;
}

export function generateRecoveryKey(): string {
	return generateRandomString(16, 'A-Z', '0-9').replace(/(.{4})(?=.)/g, '$1-');
}

export function normalizeRecoveryKey(key: string): string {
	return key
		.trim()
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, '');
}

export async function rotateRecoveryKey(userId: string): Promise<string> {
	const key = generateRecoveryKey();
	await context.internalAdapter.updateUser(userId, {
		recoveryKeyHash: await hashSecret(normalizeRecoveryKey(key))
	});
	return key;
}

export async function createAdmin(
	username: string,
	email: string,
	password: string
): Promise<string | null> {
	try {
		const { user } = await auth.api.signUpEmail({
			body: { name: username, username, displayUsername: username, email, password }
		});
		return await rotateRecoveryKey(user.id);
	} catch (error) {
		if (await isAdminConfigured()) return null;
		throw error;
	}
}

export async function signInWithPassword(
	headers: Headers,
	identifier: string,
	password: string
): Promise<{ twoFactor: boolean } | null> {
	const id = identifier.trim();
	if (!id || !password) return null;
	try {
		const result = id.includes('@')
			? await auth.api.signInEmail({ body: { email: id, password }, headers })
			: await auth.api.signInUsername({ body: { username: id, password }, headers });
		return { twoFactor: 'twoFactorRedirect' in result && result.twoFactorRedirect === true };
	} catch (error) {
		if (isAPIError(error) && error.statusCode < 500) return null;
		throw error;
	}
}

export async function signOut(headers: Headers): Promise<void> {
	await auth.api.signOut({ headers });
}

export async function checkPassword(headers: Headers, password: string): Promise<boolean> {
	if (!password) return false;
	const verified = await unlessRejected(
		() => auth.api.verifyPassword({ body: { password }, headers }),
		['INVALID_PASSWORD']
	);
	return verified !== null;
}

export async function changePassword(
	headers: Headers,
	currentPassword: string,
	newPassword: string
): Promise<boolean> {
	const changed = await unlessRejected(
		() =>
			auth.api.changePassword({
				body: { currentPassword, newPassword, revokeOtherSessions: true },
				headers
			}),
		['INVALID_PASSWORD']
	);
	if (changed) await deleteResetTokens();
	return changed !== null;
}

export async function updateAdminProfile(
	headers: Headers,
	username: string,
	email: string
): Promise<void> {
	await auth.api.updateUser({
		body: { name: username, username, displayUsername: username },
		headers
	});
	const admin = await getAdmin();
	if (admin && admin.email !== email.toLowerCase()) {
		await auth.api.changeEmail({ body: { newEmail: email }, headers });
		await deleteResetTokens();
	}
}

async function deleteResetTokens(): Promise<void> {
	await context.adapter.deleteMany({
		model: 'verification',
		where: [{ field: 'identifier', operator: 'starts_with', value: RESET_TOKEN_PREFIX }]
	});
}

export async function requestEmailPasswordReset(identifier: string): Promise<void> {
	const admin = await getAdmin();
	const id = identifier.trim().toLowerCase();
	if (!admin || (id !== admin.email.toLowerCase() && id !== admin.username.toLowerCase())) return;
	await auth.api.requestPasswordReset({ body: { email: admin.email } });
}

export async function isValidResetToken(token: string | null | undefined): Promise<boolean> {
	if (!token) return false;
	const verification = await context.internalAdapter.findVerificationValue(
		RESET_TOKEN_PREFIX + token
	);
	return verification !== null && verification.expiresAt > new Date();
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
	const reset = await unlessRejected(
		() => auth.api.resetPassword({ body: { token, newPassword } }),
		['INVALID_TOKEN']
	);
	if (reset) await deleteResetTokens();
	return reset !== null;
}

export async function resetPasswordWithRecoveryKey(
	recoveryKey: string,
	newPassword: string
): Promise<string | null> {
	const normalized = normalizeRecoveryKey(recoveryKey);
	const admin = await getAdmin();
	if (!normalized || !admin || !(await verifySecret(normalized, admin.recoveryKeyHash))) {
		return null;
	}

	const newRecoveryKey = generateRecoveryKey();
	const redeemed = await context.adapter.updateMany({
		model: 'user',
		where: [
			{ field: 'id', value: admin.id },
			{ field: 'recoveryKeyHash', value: admin.recoveryKeyHash }
		],
		update: { recoveryKeyHash: await hashSecret(normalizeRecoveryKey(newRecoveryKey)) }
	});
	if (redeemed !== 1) return null;

	await context.internalAdapter.updatePassword(admin.id, await context.password.hash(newPassword));
	await context.internalAdapter.deleteUserSessions(admin.id);
	await deleteResetTokens();
	return newRecoveryKey;
}
