import { fail, redirect } from '@sveltejs/kit';
import {
	guardReset,
	hasRecoveryKey,
	isAdminConfigured,
	isResetLocked,
	recordFailedReset,
	recordSuccessfulReset,
	requestEmailPasswordReset,
	resetPasswordWithRecoveryKey,
	validateNewPassword
} from '#lib/server/auth.js';
import { raw, text } from '#lib/server/forms.js';
import { siteOrigin } from '#lib/server/origin.js';
import type { Actions, PageServerLoad } from './$types';

const LOCKED_MESSAGE = 'Too many attempts. Please try again later.';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.isAdmin) {
		redirect(303, '/admin');
	}
	if (!isAdminConfigured()) {
		redirect(303, '/admin/setup');
	}
	return {
		hasRecoveryKey: hasRecoveryKey()
	};
};

export const actions: Actions = {
	requestEmailLink: async ({ request, url, getClientAddress }) => {
		const clientAddress = getClientAddress();
		if (isResetLocked(clientAddress)) {
			return fail(429, { emailError: LOCKED_MESSAGE });
		}

		const formData = await request.formData();
		const identifier = text(formData.get('identifier'));

		if (!identifier) {
			return fail(400, { emailError: 'Please enter your username or email address.' });
		}

		// Every request counts toward the limit, so this form can't be used to flood the admin inbox.
		recordFailedReset(clientAddress);
		// Not awaited: sending takes noticeably longer than not sending, and waiting for it would
		// let response time reveal whether the identifier matched the admin account.
		requestEmailPasswordReset(identifier, siteOrigin(url)).catch((error) => {
			console.error('[PASSWORD RESET] Failed to send reset email:', error);
		});
		return { emailSent: true };
	},

	resetWithRecoveryKey: async ({ request, getClientAddress }) => {
		const clientAddress = getClientAddress();
		const formData = await request.formData();
		const recoveryKey = raw(formData, 'recoveryKey');
		const newPassword = raw(formData, 'newPassword');

		if (!recoveryKey.trim()) {
			return fail(400, { error: 'Please enter your emergency recovery code.' });
		}

		const passwordError = validateNewPassword(newPassword, raw(formData, 'confirmPassword'));
		if (passwordError) {
			return fail(400, { error: passwordError });
		}

		const newRecoveryKey = await guardReset(clientAddress, () =>
			resetPasswordWithRecoveryKey(recoveryKey, newPassword)
		);
		if (newRecoveryKey === 'locked') {
			return fail(429, { error: LOCKED_MESSAGE });
		}
		if (!newRecoveryKey) {
			return fail(400, { error: 'Invalid emergency recovery code.' });
		}

		recordSuccessfulReset(clientAddress);

		// No session is created here: signing in afterwards keeps two-factor authentication in
		// force. The recovery code was used up, so its replacement is shown once.
		return { passwordReset: true, newRecoveryKey };
	}
};
