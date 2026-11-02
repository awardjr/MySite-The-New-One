import { fail } from '@sveltejs/kit';
import QRCode from 'qrcode';
import {
	cancelTotpSetup,
	checkPassword,
	confirmTotpSetup,
	createSession,
	disableTotp,
	generateRecoveryKey,
	getAdminProfile,
	getPendingTotpSecret,
	hasRecoveryKey,
	invalidateAllSessions,
	isLoginLocked,
	isTotpEnabled,
	recordFailedLogin,
	sessionCookieOptions,
	SESSION_COOKIE_NAME,
	setAdminPassword,
	setRecoveryKey,
	startTotpSetup,
	updateAdminProfile,
	verifySecondFactor
} from '$lib/server/auth';
import { readContent } from '$lib/server/content';
import { isEncryptionKeyConfigured } from '$lib/server/secretbox';
import { totpUri } from '$lib/server/totp';
import type { Actions, PageServerLoad } from './$types';

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Checks the current password, sharing the login lockout so a stolen session can't brute-force it. */
function verifyCurrentPassword(password: string, clientAddress: string): boolean {
	if (isLoginLocked(clientAddress)) return false;
	if (checkPassword(password)) return true;
	recordFailedLogin(clientAddress);
	return false;
}

/** Checks a 2FA code (or recovery code), sharing the login lockout like the password checks. */
function verifyCurrentSecondFactor(code: string, clientAddress: string): boolean {
	if (isLoginLocked(clientAddress)) return false;
	if (verifySecondFactor(code)) return true;
	recordFailedLogin(clientAddress);
	return false;
}

/** Builds what the setup step shows: a QR code for the app, and the secret for manual entry. */
async function twoFactorSetup(secret: string, accountName: string, host: string) {
	const issuer = readContent().home.name.trim() || host;
	return {
		secret: secret.match(/.{1,4}/g)?.join(' ') ?? secret,
		qrCode: await QRCode.toDataURL(totpUri(secret, accountName || 'admin', issuer), {
			margin: 1,
			width: 200
		})
	};
}

export const load: PageServerLoad = async ({ url }) => {
	const profile = getAdminProfile();
	const pendingSecret = getPendingTotpSecret();
	return {
		username: profile?.username ?? '',
		email: profile?.email ?? '',
		hasRecoveryKey: hasRecoveryKey(),
		twoFactorEnabled: isTotpEnabled(),
		twoFactorKeyConfigured: isEncryptionKeyConfigured(),
		twoFactorSetup: pendingSecret
			? await twoFactorSetup(pendingSecret, profile?.username ?? '', url.host)
			: null
	};
};

export const actions: Actions = {
	updateProfile: async ({ request }) => {
		const formData = await request.formData();
		const username = String(formData.get('username') ?? '').trim();
		const email = String(formData.get('email') ?? '').trim();

		if (!username) {
			return fail(400, { profileError: 'Username cannot be blank.' });
		}

		if (!email || !EMAIL_REGEX.test(email)) {
			return fail(400, { profileError: 'Please provide a valid email address.' });
		}

		updateAdminProfile(username, email);
		return { profileSuccess: true };
	},

	changePassword: async ({ request, cookies, getClientAddress }) => {
		const formData = await request.formData();
		const currentPassword = String(formData.get('currentPassword') ?? '');
		const newPassword = String(formData.get('newPassword') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (!verifyCurrentPassword(currentPassword, getClientAddress())) {
			return fail(401, { passwordError: 'Current password is incorrect.' });
		}
		if (newPassword.length < MIN_PASSWORD_LENGTH) {
			return fail(400, {
				passwordError: `New password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
			});
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { passwordError: 'New passwords do not match.' });
		}

		setAdminPassword(newPassword);

		// Revoke every existing session then issue a fresh one so the admin stays logged in.
		invalidateAllSessions();
		cookies.set(SESSION_COOKIE_NAME, createSession(), sessionCookieOptions);

		return { passwordSuccess: true };
	},

	rotateRecoveryKey: async ({ request, getClientAddress }) => {
		const formData = await request.formData();
		const currentPassword = String(formData.get('currentPassword') ?? '');
		const code = String(formData.get('code') ?? '');
		const clientAddress = getClientAddress();

		if (!verifyCurrentPassword(currentPassword, clientAddress)) {
			return fail(401, { recoveryError: 'Current password is incorrect.' });
		}
		if (isTotpEnabled() && !verifyCurrentSecondFactor(code, clientAddress)) {
			return fail(401, { recoveryError: 'Authentication code is incorrect.' });
		}

		const newKey = generateRecoveryKey();
		setRecoveryKey(newKey);

		return {
			recoverySuccess: true,
			newRecoveryKey: newKey
		};
	},

	startTwoFactor: async ({ request, getClientAddress }) => {
		const formData = await request.formData();
		const currentPassword = String(formData.get('currentPassword') ?? '');

		if (isTotpEnabled()) {
			return fail(400, { twoFactorError: 'Two-factor authentication is already on.' });
		}
		if (!isEncryptionKeyConfigured()) {
			return fail(503, {
				twoFactorError:
					'Set TOTP_ENCRYPTION_KEY in the server environment before setting up two-factor authentication.'
			});
		}
		if (!verifyCurrentPassword(currentPassword, getClientAddress())) {
			return fail(401, { twoFactorError: 'Current password is incorrect.' });
		}

		startTotpSetup();
		return {};
	},

	confirmTwoFactor: async ({ request, cookies, getClientAddress }) => {
		const formData = await request.formData();
		const code = String(formData.get('code') ?? '');
		const clientAddress = getClientAddress();

		if (!isEncryptionKeyConfigured()) {
			return fail(503, {
				twoFactorError:
					'Set TOTP_ENCRYPTION_KEY in the server environment before confirming two-factor authentication.'
			});
		}
		if (isLoginLocked(clientAddress)) {
			return fail(429, { twoFactorError: 'Too many failed attempts. Please try again later.' });
		}
		if (!confirmTotpSetup(code)) {
			recordFailedLogin(clientAddress);
			return fail(400, {
				twoFactorError: 'That code didn’t match. Check your authenticator app and try again.'
			});
		}

		// Sign out every other session, so 2FA applies to all of them from now on.
		invalidateAllSessions();
		cookies.set(SESSION_COOKIE_NAME, createSession(), sessionCookieOptions);

		// Issue a fresh recovery code so it can be shown (once) right after setup.
		const recoveryKey = generateRecoveryKey();
		setRecoveryKey(recoveryKey);

		return {
			twoFactorSuccess: 'Two-factor authentication is now on.',
			twoFactorRecoveryKey: recoveryKey
		};
	},

	cancelTwoFactor: async () => {
		cancelTotpSetup();
		return {};
	},

	disableTwoFactor: async ({ request, getClientAddress }) => {
		const formData = await request.formData();
		const currentPassword = String(formData.get('currentPassword') ?? '');
		const code = String(formData.get('code') ?? '');
		const clientAddress = getClientAddress();

		if (!verifyCurrentPassword(currentPassword, clientAddress)) {
			return fail(401, { twoFactorError: 'Current password is incorrect.' });
		}
		if (!verifyCurrentSecondFactor(code, clientAddress)) {
			return fail(401, { twoFactorError: 'Authentication code is incorrect.' });
		}

		disableTotp();
		return { twoFactorSuccess: 'Two-factor authentication is now off.' };
	}
};
