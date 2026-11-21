import { fail } from '@sveltejs/kit';
import QRCode from 'qrcode';
import {
	cancelTotpSetup,
	checkPassword,
	confirmTotpSetup,
	disableTotp,
	getAdminProfile,
	getPendingTotpSecret,
	loginAttempts,
	invalidateAllResetTokens,
	invalidateAllSessions,
	isTotpEnabled,
	LOCKED_MESSAGE,
	rotateRecoveryKey,
	setAdminPassword,
	startSession,
	startTotpSetup,
	updateAdminProfile,
	validateNewPassword,
	validateProfile,
	verifySecondFactor
} from '#lib/server/auth.js';
import { readContent } from '#lib/server/content.js';
import { raw, text } from '#lib/server/forms.js';
import { isEncryptionKeyConfigured } from '#lib/server/secretbox.js';
import { totpUri } from '#lib/server/totp.js';
import type { Actions, PageServerLoad } from './$types';

type IdentityCheck = { ok: true; newRecoveryKey?: string } | { ok: false; error: string };

/**
 * Confirms the current password and, when asked, a 2FA or recovery code. Both checks share the
 * login lockout so a stolen session can't brute-force them; a locked-out address is reported the
 * same way as a wrong answer.
 */
async function confirmIdentity(
	formData: FormData,
	clientAddress: string,
	{ secondFactor }: { secondFactor: boolean }
): Promise<IdentityCheck> {
	const password = raw(formData, 'currentPassword');
	if ((await loginAttempts.guard(clientAddress, () => checkPassword(password))) !== true) {
		return { ok: false, error: 'Current password is incorrect.' };
	}
	if (!secondFactor) return { ok: true };

	const factor = await loginAttempts.guard(clientAddress, () =>
		verifySecondFactor(raw(formData, 'code'))
	);
	if (!factor || factor === 'locked') {
		return { ok: false, error: 'Authentication code is incorrect.' };
	}
	return {
		ok: true,
		newRecoveryKey: factor.method === 'recovery' ? factor.newRecoveryKey : undefined
	};
}

function missingEncryptionKey(step: string) {
	return fail(503, {
		twoFactorError: `Set TOTP_ENCRYPTION_KEY in the server environment before ${step} two-factor authentication.`
	});
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

		const profileError = validateProfile(username, email);
		if (profileError) {
			return fail(400, { profileError });
		}

		// The email address receives password reset links, so changing it needs the same proof of
		// identity as changing the password: a hijacked session alone must not be enough.
		const identity = await confirmIdentity(formData, getClientAddress(), {
			secondFactor: isTotpEnabled()
		});
		if (!identity.ok) {
			return fail(401, { profileError: identity.error });
		}

		const emailChanged = getAdminProfile()?.email !== email.toLowerCase();
		updateAdminProfile(username, email);
		// Reset links already sent went to the old address, which may no longer be trusted.
		if (emailChanged) invalidateAllResetTokens();

		return { profileSuccess: true, ...recoveryKeyReplaced(identity.newRecoveryKey) };
	},

	changePassword: async ({ request, cookies, getClientAddress }) => {
		const formData = await request.formData();
		const newPassword = raw(formData, 'newPassword');

		const identity = await confirmIdentity(formData, getClientAddress(), { secondFactor: false });
		if (!identity.ok) {
			return fail(401, { passwordError: identity.error });
		}
		const passwordError = validateNewPassword(newPassword, raw(formData, 'confirmPassword'));
		if (passwordError) {
			return fail(400, { passwordError });
		}

		await setAdminPassword(newPassword);
		invalidateAllResetTokens();

		// Revoke every existing session then issue a fresh one so the admin stays logged in.
		invalidateAllSessions();
		startSession(cookies);

		return { passwordSuccess: true };
	},

	rotateRecoveryKey: async ({ request, getClientAddress }) => {
		const identity = await confirmIdentity(await request.formData(), getClientAddress(), {
			secondFactor: isTotpEnabled()
		});
		if (!identity.ok) {
			return fail(401, { recoveryError: identity.error });
		}

		return recoveryKeyReplaced(await rotateRecoveryKey());
	},

	startTwoFactor: async ({ request, getClientAddress }) => {
		const formData = await request.formData();

		if (isTotpEnabled()) {
			return fail(400, { twoFactorError: 'Two-factor authentication is already on.' });
		}
		if (!isEncryptionKeyConfigured()) {
			return missingEncryptionKey('setting up');
		}
		const identity = await confirmIdentity(formData, getClientAddress(), { secondFactor: false });
		if (!identity.ok) {
			return fail(401, { twoFactorError: identity.error });
		}

		startTotpSetup();
		return {};
	},

	confirmTwoFactor: async ({ request, cookies, getClientAddress }) => {
		const formData = await request.formData();

		if (!isEncryptionKeyConfigured()) {
			return missingEncryptionKey('confirming');
		}
		const confirmed = await loginAttempts.guard(getClientAddress(), () =>
			confirmTotpSetup(raw(formData, 'code'))
		);
		if (confirmed === 'locked') {
			return fail(429, { twoFactorError: LOCKED_MESSAGE });
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
		const identity = await confirmIdentity(await request.formData(), getClientAddress(), {
			secondFactor: true
		});
		if (!identity.ok) {
			return fail(401, { twoFactorError: identity.error });
		}

		disableTotp();
		return {
			twoFactorSuccess: 'Two-factor authentication is now off.',
			...recoveryKeyReplaced(identity.newRecoveryKey)
		};
	}
};
