import { fail, redirect } from '@sveltejs/kit';
import {
	createSession,
	hasRecoveryKey,
	isAdminConfigured,
	isResetLocked,
	recordFailedReset,
	recordSuccessfulReset,
	requestEmailPasswordReset,
	resetPasswordWithRecoveryKey,
	sessionCookieOptions,
	SESSION_COOKIE_NAME
} from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

const MIN_PASSWORD_LENGTH = 8;

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
			return fail(429, { emailError: 'Too many attempts. Please try again later.' });
		}

		const formData = await request.formData();
		const identifier = String(formData.get('identifier') ?? '').trim();

		if (!identifier) {
			return fail(400, { emailError: 'Please enter your username or email address.' });
		}

		await requestEmailPasswordReset(identifier, url.origin);
		return { emailSent: true };
	},

	resetWithRecoveryKey: async ({ request, cookies, getClientAddress }) => {
		const clientAddress = getClientAddress();
		if (isResetLocked(clientAddress)) {
			return fail(429, { error: 'Too many attempts. Please try again later.' });
		}

		const formData = await request.formData();
		const recoveryKey = String(formData.get('recoveryKey') ?? '');
		const newPassword = String(formData.get('newPassword') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (!recoveryKey.trim()) {
			return fail(400, { error: 'Please enter your emergency recovery code.' });
		}

		if (newPassword.length < MIN_PASSWORD_LENGTH) {
			return fail(400, {
				error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
			});
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		const success = resetPasswordWithRecoveryKey(recoveryKey, newPassword);
		if (!success) {
			recordFailedReset(clientAddress);
			return fail(400, { error: 'Invalid emergency recovery code.' });
		}

		recordSuccessfulReset(clientAddress);
		cookies.set(SESSION_COOKIE_NAME, createSession(), sessionCookieOptions);

		redirect(303, '/admin');
	}
};
