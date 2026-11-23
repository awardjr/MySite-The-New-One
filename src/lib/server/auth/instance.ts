import { base64Url } from '@better-auth/utils/base64';
import { createHash } from '@better-auth/utils/hash';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { getMigrations } from 'better-auth/db/migration';
import { twoFactor, username } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { building, dev } from '$app/env';
import { getRequestEvent } from '$app/server';
import { db } from '../db';
import { sendPasswordResetEmail } from '../email';
import { runMigrations } from '../migrations';
import { siteOrigin } from '../origin';
import { hashSecret, verifySecret } from './passwords';

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const RESET_TOKEN_PREFIX = 'reset-password:';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const RESET_TOKEN_MAX_AGE_SECONDS = 15 * 60;

export async function storedResetIdentifier(token: string): Promise<string> {
	const digest = await createHash('SHA-256').digest(
		new TextEncoder().encode(RESET_TOKEN_PREFIX + token)
	);
	return RESET_TOKEN_PREFIX + base64Url.encode(new Uint8Array(digest), { padding: false });
}

const options = {
	database: db,
	secret: building ? 'build-time-placeholder-secret-never-used-to-sign-anything' : undefined,
	baseURL: process.env.ORIGIN || undefined,
	telemetry: { enabled: false },
	advanced: { cookiePrefix: 'cms', useSecureCookies: !dev },
	session: { expiresIn: SESSION_MAX_AGE_SECONDS },
	verification: {
		storeIdentifier: {
			default: 'hashed',
			overrides: {
				[RESET_TOKEN_PREFIX]: {
					hash: (identifier) => storedResetIdentifier(identifier.slice(RESET_TOKEN_PREFIX.length))
				}
			}
		}
	},
	user: {
		changeEmail: { enabled: true, updateEmailWithoutVerification: true },
		additionalFields: {
			recoveryKeyHash: { type: 'string', required: false, input: false, returned: false }
		}
	},
	emailAndPassword: {
		enabled: true,
		minPasswordLength: MIN_PASSWORD_LENGTH,
		maxPasswordLength: MAX_PASSWORD_LENGTH,
		resetPasswordTokenExpiresIn: RESET_TOKEN_MAX_AGE_SECONDS,
		revokeSessionsOnPasswordReset: true,
		password: {
			hash: hashSecret,
			verify: ({ hash, password }) => verifySecret(password, hash)
		},
		async sendResetPassword({ user, token }) {
			const context = await auth.$context;
			const resetUrl = `${siteOrigin(getRequestEvent().url)}/admin/reset?token=${token}`;
			if (!(await sendPasswordResetEmail(user.email, resetUrl))) {
				await context.internalAdapter.deleteVerificationByIdentifier(RESET_TOKEN_PREFIX + token);
				return;
			}
			await context.adapter.deleteMany({
				model: 'verification',
				where: [
					{ field: 'identifier', operator: 'starts_with', value: RESET_TOKEN_PREFIX },
					{ field: 'identifier', operator: 'ne', value: await storedResetIdentifier(token) }
				]
			});
		}
	},
	plugins: [
		username({
			minUsernameLength: 1,
			maxUsernameLength: 100,
			usernameValidator: (name) => name.trim().length > 0 && !name.includes('@')
		}),
		twoFactor(),
		sveltekitCookies(getRequestEvent)
	]
} satisfies BetterAuthOptions;

await (await getMigrations(options)).runMigrations();

export const auth = betterAuth(options);

await runMigrations(db, [
	{
		name: 'auth-0001-single-admin.sql',
		up: () => {
			db.exec(`
				CREATE TRIGGER IF NOT EXISTS single_admin_user BEFORE INSERT ON "user"
				WHEN EXISTS (SELECT 1 FROM "user")
				BEGIN SELECT RAISE(ABORT, 'Only one admin account is allowed.'); END;
			`);
		}
	}
]);
