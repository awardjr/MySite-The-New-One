import { fail } from '@sveltejs/kit';
import QRCode from 'qrcode';
import {
	cancelTotpSetup,
	checkPassword,
	confirmTotpSetup,
	disableTotp,
	getAdminProfile,
	getPendingTotpSecret,
	guardLogin,
	hasRecoveryKey,
	invalidateAllSessions,
	isTotpEnabled,
	isValidEmail,
	rotateRecoveryKey,
	setAdminPassword,
	startSession,
	startTotpSetup,
	updateAdminProfile,
	validateNewPassword,
	verifySecondFactor
} from '#lib/server/auth.js';
import { readContent } from '#lib/server/content.js';
import { raw, text } from '#lib/server/forms.js';
import { isEncryptionKeyConfigured } from '#lib/server/secretbox.js';
import { totpUri } from '#lib/server/totp.js';
import type { Actions, PageServerLoad } from './$types';

/**
 * Checks the current password, sharing the login lockout so a stolen session can't brute-force
 * it. A locked-out address is reported the same way as a wrong password.
 */
async function verifyCurrentPassword(password: string, clientAddress: string): Promise<boolean> {
	return (await guardLogin(clientAddress, () => checkPassword(password))) === true;
}

/**
 * Checks a 2FA code (or recovery code), sharing the login lockout like the password checks.
 * Returns how the factor was satisfied, or null if it wasn't.
 */
async function verifyCurrentSecondFactor(code: string, clientAddress: string) {
	const factor = await guardLogin(clientAddress, () => verifySecondFactor(code));
	return factor === 'locked' ? null : factor;
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

/**
 * Form fields that make the page show a replacement recovery code. A recovery code only works
 * once, so whenever one is used (or regenerated) its successor has to be shown.
 */
function recoveryKeyReplaced(newRecoveryKey: string | undefined) {
	return newRecoveryKey ? { recoverySuccess: true, newRecoveryKey } : {};
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
	updateProfile: async ({ request, getClientAddress }) => {
		const formData = await request.formData();
		const username = text(formData.get('username'));
		const email = text(formData.get('email'));
		const clientAddress = getClientAddress();

		if (!username) {
			return fail(400, { profileError: 'Username cannot be blank.' });
		}

		if (!email || !isValidEmail(email)) {
			return fail(400, { profileError: 'Please provide a valid email address.' });
		}

		// The email address receives password reset links, so changing it needs the same proof of
		// identity as changing the password: a hijacked session alone must not be enough.
		if (!(await verifyCurrentPassword(raw(formData, 'currentPassword'), clientAddress))) {
			return fail(401, { profileError: 'Current password is incorrect.' });
		}
		let newRecoveryKey: string | undefined;
		if (isTotpEnabled()) {
			const factor = await verifyCurrentSecondFactor(raw(formData, 'code'), clientAddress);
			if (!factor) {
				return fail(401, { profileError: 'Authentication code is incorrect.' });
			}
			if (factor.method === 'recovery') newRecoveryKey = factor.newRecoveryKey;
		}

		updateAdminProfile(username, email);
		return { profileSuccess: true, ...recoveryKeyReplaced(newRecoveryKey) };
	},

	changePassword: async ({ request, cookies, getClientAddress }) => {
		const formData = await request.formData();
		const newPassword = raw(formData, 'newPassword');

		if (!(await verifyCurrentPassword(raw(formData, 'currentPassword'), getClientAddress()))) {
			return fail(401, { passwordError: 'Current password is incorrect.' });
		}
		const passwordError = validateNewPassword(newPassword, raw(formData, 'confirmPassword'));
		if (passwordError) {
			return fail(400, { passwordError });
		}

		await setAdminPassword(newPassword);

		// Revoke every existing session then issue a fresh one so the admin stays logged in.
		invalidateAllSessions();
		startSession(cookies);

		return { passwordSuccess: true };
	},

	rotateRecoveryKey: async ({ request, getClientAddress }) => {
		const formData = await request.formData();
		const clientAddress = getClientAddress();

		if (!(await verifyCurrentPassword(raw(formData, 'currentPassword'), clientAddress))) {
			return fail(401, { recoveryError: 'Current password is incorrect.' });
		}
		if (
			isTotpEnabled() &&
			!(await verifyCurrentSecondFactor(raw(formData, 'code'), clientAddress))
		) {
			return fail(401, { recoveryError: 'Authentication code is incorrect.' });
		}

		return recoveryKeyReplaced(await rotateRecoveryKey());
	},

	startTwoFactor: async ({ request, getClientAddress }) => {
		const formData = await request.formData();

		if (isTotpEnabled()) {
			return fail(400, { twoFactorError: 'Two-factor authentication is already on.' });
		}
		if (!isEncryptionKeyConfigured()) {
			return fail(503, {
				twoFactorError:
					'Set TOTP_ENCRYPTION_KEY in the server environment before setting up two-factor authentication.'
			});
		}
		if (!(await verifyCurrentPassword(raw(formData, 'currentPassword'), getClientAddress()))) {
			return fail(401, { twoFactorError: 'Current password is incorrect.' });
		}

		startTotpSetup();
		return {};
	},

	confirmTwoFactor: async ({ request, cookies, getClientAddress }) => {
		const formData = await request.formData();

		if (!isEncryptionKeyConfigured()) {
			return fail(503, {
				twoFactorError:
					'Set TOTP_ENCRYPTION_KEY in the server environment before confirming two-factor authentication.'
			});
		}
		const confirmed = await guardLogin(getClientAddress(), () =>
			confirmTotpSetup(raw(formData, 'code'))
		);
		if (confirmed === 'locked') {
			return fail(429, { twoFactorError: 'Too many failed attempts. Please try again later.' });
		}
		if (!confirmed) {
			return fail(400, {
				twoFactorError: 'That code didn’t match. Check your authenticator app and try again.'
			});
		}

		// Sign out every other session, so 2FA applies to all of them from now on.
		invalidateAllSessions();
		startSession(cookies);

		return {
			twoFactorSuccess: 'Two-factor authentication is now on.',
			// Issue a fresh recovery code so it can be shown (once) right after setup.
			twoFactorRecoveryKey: await rotateRecoveryKey()
		};
	},

	cancelTwoFactor: async () => {
		cancelTotpSetup();
		return {};
	},

	disableTwoFactor: async ({ request, getClientAddress }) => {
		const formData = await request.formData();
		const clientAddress = getClientAddress();

		if (!(await verifyCurrentPassword(raw(formData, 'currentPassword'), clientAddress))) {
			return fail(401, { twoFactorError: 'Current password is incorrect.' });
		}
		const factor = await verifyCurrentSecondFactor(raw(formData, 'code'), clientAddress);
		if (!factor) {
			return fail(401, { twoFactorError: 'Authentication code is incorrect.' });
		}

		disableTotp();
		return {
			twoFactorSuccess: 'Two-factor authentication is now off.',
			...recoveryKeyReplaced(factor.method === 'recovery' ? factor.newRecoveryKey : undefined)
		};
	}
};
