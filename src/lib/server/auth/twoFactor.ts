import { createOTP } from '@better-auth/utils/otp';
import { symmetricDecrypt } from 'better-auth/crypto';
import type { AdminUser } from './admin';
import { authErrorCode, unlessRejected } from './errors';
import { auth } from './instance';

const context = await auth.$context;

export const twoFactorCookie = context.createAuthCookie('two_factor');

export type SecondFactorResult = 'ok' | 'invalid' | 'expired' | 'too-many' | 'locked';

export async function submitSecondFactor(
	headers: Headers,
	input: string
): Promise<SecondFactorResult> {
	const digits = input.replace(/\s/g, '');
	try {
		if (/^\d{6}$/.test(digits)) await auth.api.verifyTOTP({ body: { code: digits }, headers });
		else await auth.api.verifyBackupCode({ body: { code: input.trim() }, headers });
		return 'ok';
	} catch (error) {
		switch (authErrorCode(error)) {
			case 'INVALID_CODE':
			case 'INVALID_BACKUP_CODE':
				return 'invalid';
			case 'INVALID_TWO_FACTOR_COOKIE':
				return 'expired';
			case 'TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE':
				return 'too-many';
			case 'ACCOUNT_TEMPORARILY_LOCKED':
				return 'locked';
			default:
				throw error;
		}
	}
}

export async function startTotpSetup(headers: Headers, password: string, issuer: string) {
	if (!password) return false;
	const started = await unlessRejected(
		() => auth.api.enableTwoFactor({ body: { password, issuer }, headers }),
		['INVALID_PASSWORD']
	);
	return started !== null;
}

export async function pendingTotpUri(admin: AdminUser, issuer: string): Promise<string | null> {
	const pending = await context.adapter.findOne<{ secret: string; verified: boolean }>({
		model: 'twoFactor',
		where: [{ field: 'userId', value: admin.id }]
	});
	if (!pending || pending.verified) return null;
	const secret = await symmetricDecrypt({ key: context.secretConfig, data: pending.secret });
	return createOTP(secret).url(issuer, admin.email);
}

export async function cancelTotpSetup(userId: string): Promise<void> {
	await context.adapter.deleteMany({
		model: 'twoFactor',
		where: [
			{ field: 'userId', value: userId },
			{ field: 'verified', value: false }
		]
	});
}

export async function confirmTotpSetup(
	headers: Headers,
	userId: string,
	code: string
): Promise<string[] | null> {
	const earlierSessions = await context.internalAdapter.listSessions(userId);
	const confirmed = await unlessRejected(
		() => auth.api.verifyTOTP({ body: { code: code.replace(/\s/g, '') }, headers }),
		['INVALID_CODE', 'TOTP_NOT_ENABLED']
	);
	if (!confirmed) return null;
	await context.internalAdapter.deleteSessions(earlierSessions.map((session) => session.token));
	return backupCodes(userId);
}

export async function disableTotp(headers: Headers, password: string): Promise<boolean> {
	const disabled = await unlessRejected(
		() => auth.api.disableTwoFactor({ body: { password }, headers }),
		['INVALID_PASSWORD']
	);
	return disabled !== null;
}

export async function regenerateBackupCodes(headers: Headers, password: string) {
	const generated = await unlessRejected(
		() => auth.api.generateBackupCodes({ body: { password }, headers }),
		['INVALID_PASSWORD']
	);
	return generated?.backupCodes ?? null;
}

export async function backupCodes(userId: string): Promise<string[]> {
	return (await auth.api.viewBackupCodes({ body: { userId } })).backupCodes;
}
