import { fail, redirect } from '@sveltejs/kit';
import {
	createSession,
	isResetLocked,
	recordFailedReset,
	recordSuccessfulReset,
	resetPasswordWithToken,
	sessionCookieOptions,
	SESSION_COOKIE_NAME,
	verifyResetToken
} from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

const MIN_PASSWORD_LENGTH = 8;

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
	default: async ({ request, cookies, getClientAddress }) => {
		const clientAddress = getClientAddress();
		if (isResetLocked(clientAddress)) {
			return fail(429, { error: 'Too many attempts. Please try again later.' });
		}

		const formData = await request.formData();
		const token = String(formData.get('token') ?? '');
		const newPassword = String(formData.get('newPassword') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (!verifyResetToken(token)) {
			recordFailedReset(clientAddress);
			return fail(400, {
				error: 'This password reset link is invalid or has expired. Please request a new one.'
			});
		}

		if (newPassword.length < MIN_PASSWORD_LENGTH) {
			return fail(400, {
				error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
			});
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		const success = resetPasswordWithToken(token, newPassword);
		if (!success) {
			recordFailedReset(clientAddress);
			return fail(400, {
				error: 'This password reset link is invalid or has expired. Please request a new one.'
			});
		}

		recordSuccessfulReset(clientAddress);
		cookies.set(SESSION_COOKIE_NAME, createSession(), sessionCookieOptions);

		redirect(303, '/admin');
	}
};
