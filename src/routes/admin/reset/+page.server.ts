import { fail, redirect } from '@sveltejs/kit';
import {
	isResetLocked,
	recordFailedReset,
	recordSuccessfulReset,
	resetPasswordWithToken,
	validateNewPassword,
	verifyResetToken
} from '#lib/server/auth.js';
import { raw } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

const INVALID_LINK_MESSAGE =
	'This password reset link is invalid or has expired. Please request a new one.';

export const load: PageServerLoad = ({ url, locals }) => {
	if (locals.isAdmin) {
		redirect(303, '/admin');
	}

	const token = url.searchParams.get('token') ?? '';
	const valid = verifyResetToken(token);

	return {
		token,
		valid
	};
};

export const actions: Actions = {
	default: async ({ request, getClientAddress }) => {
		const clientAddress = getClientAddress();
		if (isResetLocked(clientAddress)) {
			return fail(429, { error: 'Too many attempts. Please try again later.' });
		}

		const formData = await request.formData();
		const token = raw(formData, 'token');
		const newPassword = raw(formData, 'newPassword');

		if (!verifyResetToken(token)) {
			recordFailedReset(clientAddress);
			return fail(400, { error: INVALID_LINK_MESSAGE });
		}

		const passwordError = validateNewPassword(newPassword, raw(formData, 'confirmPassword'));
		if (passwordError) {
			return fail(400, { error: passwordError });
		}

		if (!(await resetPasswordWithToken(token, newPassword))) {
			recordFailedReset(clientAddress);
			return fail(400, { error: INVALID_LINK_MESSAGE });
		}

		recordSuccessfulReset(clientAddress);

		// The reset link proves access to the admin mailbox, not the second factor, so it doesn't
		// sign anyone in. Logging in normally keeps two-factor authentication in force.
		redirect(303, '/admin/login?reset');
	}
};
