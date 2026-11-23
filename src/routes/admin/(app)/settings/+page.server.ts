import { error, fail, type RequestEvent } from '@sveltejs/kit';
import QRCode from 'qrcode';
import {
	backupCodes,
	cancelTotpSetup,
	changePassword,
	checkPassword,
	confirmTotpSetup,
	disableTotp,
	getAdmin,
	LOCKED_MESSAGE,
	loginAttempts,
	pendingTotpUri,
	regenerateBackupCodes,
	rotateRecoveryKey,
	startTotpSetup,
	submitSecondFactor,
	updateAdminProfile,
	validateNewPassword,
	validateProfile,
	type AdminUser
} from '#lib/server/auth.js';
import { readContent } from '#lib/server/content.js';
import { raw, text } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

const WRONG_PASSWORD = 'Current password is incorrect.';
const WRONG_CODE = 'Authentication code is incorrect.';

async function currentAdmin(): Promise<AdminUser> {
	const admin = await getAdmin();
	if (!admin) error(401, 'Not signed in.');
	return admin;
}

function totpIssuer(url: URL): string {
	return readContent().home.name.trim() || url.host;
}

async function confirmIdentity(
	{ request, getClientAddress }: RequestEvent,
	formData: FormData,
	{ secondFactor }: { secondFactor: boolean }
): Promise<string | null> {
	const passwordOk = await loginAttempts.guard(getClientAddress(), () =>
		checkPassword(request.headers, raw(formData, 'currentPassword'))
	);
	if (passwordOk !== true) return WRONG_PASSWORD;
	if (!secondFactor) return null;

	const code = await loginAttempts.guard(
		getClientAddress(),
		() => submitSecondFactor(request.headers, raw(formData, 'code')),
		(outcome) => outcome === 'ok'
	);
	return code === 'ok' ? null : WRONG_CODE;
}

async function twoFactorSetup(uri: string) {
	const secret = new URL(uri).searchParams.get('secret') ?? '';
	return {
		secret: secret.match(/.{1,4}/g)?.join(' ') ?? secret,
		qrCode: await QRCode.toDataURL(uri, { margin: 1, width: 200 })
	};
}

export const load: PageServerLoad = async ({ url }) => {
	const admin = await currentAdmin();
	const pendingUri = admin.twoFactorEnabled ? null : await pendingTotpUri(admin, totpIssuer(url));
	return {
		username: admin.displayUsername || admin.username,
		email: admin.email,
		twoFactorEnabled: admin.twoFactorEnabled,
		backupCodesLeft: admin.twoFactorEnabled ? (await backupCodes(admin.id)).length : null,
		twoFactorSetup: pendingUri ? await twoFactorSetup(pendingUri) : null
	};
};

export const actions: Actions = {
	updateProfile: async (event) => {
		const admin = await currentAdmin();
		const formData = await event.request.formData();
		const username = text(formData.get('username'));
		const email = text(formData.get('email'));

		const profileError = validateProfile(username, email);
		if (profileError) {
			return fail(400, { profileError });
		}

		const identityError = await confirmIdentity(event, formData, {
			secondFactor: admin.twoFactorEnabled
		});
		if (identityError) {
			return fail(401, { profileError: identityError });
		}

		await updateAdminProfile(event.request.headers, username, email);
		return { profileSuccess: true };
	},

	changePassword: async (event) => {
		const formData = await event.request.formData();
		const currentPassword = raw(formData, 'currentPassword');
		const newPassword = raw(formData, 'newPassword');

		const identityError = await confirmIdentity(event, formData, { secondFactor: false });
		if (identityError) {
			return fail(401, { passwordError: identityError });
		}
		const passwordError = validateNewPassword(newPassword, raw(formData, 'confirmPassword'));
		if (passwordError) {
			return fail(400, { passwordError });
		}

		if (!(await changePassword(event.request.headers, currentPassword, newPassword))) {
			return fail(401, { passwordError: WRONG_PASSWORD });
		}
		return { passwordSuccess: true };
	},

	rotateRecoveryKey: async (event) => {
		const admin = await currentAdmin();
		const identityError = await confirmIdentity(event, await event.request.formData(), {
			secondFactor: admin.twoFactorEnabled
		});
		if (identityError) {
			return fail(401, { recoveryError: identityError });
		}

		return { recoverySuccess: true, newRecoveryKey: await rotateRecoveryKey(admin.id) };
	},

	startTwoFactor: async (event) => {
		const admin = await currentAdmin();
		if (admin.twoFactorEnabled) {
			return fail(400, { twoFactorError: 'Two-factor authentication is already on.' });
		}

		const formData = await event.request.formData();
		const started = await loginAttempts.guard(event.getClientAddress(), () =>
			startTotpSetup(event.request.headers, raw(formData, 'currentPassword'), totpIssuer(event.url))
		);
		if (started === 'locked') {
			return fail(429, { twoFactorError: LOCKED_MESSAGE });
		}
		if (!started) {
			return fail(401, { twoFactorError: WRONG_PASSWORD });
		}
		return {};
	},

	confirmTwoFactor: async (event) => {
		const admin = await currentAdmin();
		const formData = await event.request.formData();
		const codes = await loginAttempts.guard(event.getClientAddress(), () =>
			confirmTotpSetup(event.request.headers, admin.id, raw(formData, 'code'))
		);
		if (codes === 'locked') {
			return fail(429, { twoFactorError: LOCKED_MESSAGE });
		}
		if (!codes) {
			return fail(400, {
				twoFactorError: 'That code didn’t match. Check your authenticator app and try again.'
			});
		}

		return { twoFactorSuccess: 'Two-factor authentication is now on.', backupCodes: codes };
	},

	cancelTwoFactor: async () => {
		await cancelTotpSetup((await currentAdmin()).id);
		return {};
	},

	disableTwoFactor: async (event) => {
		const formData = await event.request.formData();
		const identityError = await confirmIdentity(event, formData, { secondFactor: true });
		if (identityError) {
			return fail(401, { twoFactorError: identityError });
		}

		if (!(await disableTotp(event.request.headers, raw(formData, 'currentPassword')))) {
			return fail(401, { twoFactorError: WRONG_PASSWORD });
		}
		return { twoFactorSuccess: 'Two-factor authentication is now off.' };
	},

	regenerateBackupCodes: async (event) => {
		const formData = await event.request.formData();
		const identityError = await confirmIdentity(event, formData, { secondFactor: true });
		if (identityError) {
			return fail(401, { backupCodesError: identityError });
		}

		const codes = await regenerateBackupCodes(
			event.request.headers,
			raw(formData, 'currentPassword')
		);
		if (!codes) {
			return fail(401, { backupCodesError: WRONG_PASSWORD });
		}
		return { regeneratedBackupCodes: codes };
	}
};
