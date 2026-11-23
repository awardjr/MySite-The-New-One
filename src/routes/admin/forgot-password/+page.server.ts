import { fail, redirect } from '@sveltejs/kit';
import {
	isAdminConfigured,
	LOCKED_MESSAGE,
	requestEmailPasswordReset,
	resetAttempts,
	resetPasswordWithRecoveryKey,
	validateNewPassword
} from '#lib/server/auth.js';
import { raw, text } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.isAdmin) {
		redirect(303, '/admin');
	}
	if (!(await isAdminConfigured())) {
		redirect(303, '/admin/setup');
	}
};

export const actions: Actions = {
	requestEmailLink: async ({ request, getClientAddress }) => {
		const formData = await request.formData();
		const identifier = text(formData.get('identifier'));

		if (!identifier) {
			return fail(400, { emailError: 'Please enter your username or email address.' });
		}
		if (!(await resetAttempts.take(getClientAddress()))) {
			return fail(429, { emailError: LOCKED_MESSAGE });
		}

		requestEmailPasswordReset(identifier).catch((error) => {
			console.error('[PASSWORD RESET] Failed to send reset email:', error);
		});
		return { emailSent: true };
	},

	resetWithRecoveryKey: async ({ request, getClientAddress }) => {
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

		const newRecoveryKey = await resetAttempts.guard(getClientAddress(), () =>
			resetPasswordWithRecoveryKey(recoveryKey, newPassword)
		);
		if (newRecoveryKey === 'locked') {
			return fail(429, { error: LOCKED_MESSAGE });
		}
		if (!newRecoveryKey) {
			return fail(400, { error: 'Invalid emergency recovery code.' });
		}

		await resetAttempts.clear(getClientAddress());
		return { passwordReset: true, newRecoveryKey };
	}
};
