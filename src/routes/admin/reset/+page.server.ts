import { fail, redirect } from '@sveltejs/kit';
import {
	isValidResetToken,
	LOCKED_MESSAGE,
	resetAttempts,
	resetPasswordWithToken,
	validateNewPassword
} from '#lib/server/auth.js';
import { raw } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

const INVALID_LINK_MESSAGE =
	'This password reset link is invalid or has expired. Please request a new one.';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (locals.isAdmin) {
		redirect(303, '/admin');
	}

	const token = url.searchParams.get('token') ?? '';
	return { token, valid: await isValidResetToken(token) };
};

export const actions: Actions = {
	default: async ({ request, getClientAddress }) => {
		const clientAddress = getClientAddress();
		const formData = await request.formData();
		const token = raw(formData, 'token');
		const newPassword = raw(formData, 'newPassword');

		const tokenValid = await resetAttempts.guard(clientAddress, () => isValidResetToken(token));
		if (tokenValid === 'locked') {
			return fail(429, { error: LOCKED_MESSAGE });
		}
		if (!tokenValid) {
			return fail(400, { error: INVALID_LINK_MESSAGE });
		}

		const passwordError = validateNewPassword(newPassword, raw(formData, 'confirmPassword'));
		if (passwordError) {
			return fail(400, { error: passwordError });
		}

		if (!(await resetPasswordWithToken(token, newPassword))) {
			return fail(400, { error: INVALID_LINK_MESSAGE });
		}

		await resetAttempts.clear(clientAddress);
		redirect(303, '/admin/login?reset');
	}
};
