import { fail, redirect } from '@sveltejs/kit';
import {
	createSession,
	generateRecoveryKey,
	isAdminConfigured,
	sessionCookieOptions,
	SESSION_COOKIE_NAME,
	setAdminCredentials
} from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const load: PageServerLoad = ({ locals }) => {
	// Setup is only for a brand-new database with no admin account yet.
	if (isAdminConfigured()) {
		if (locals.isAdmin) {
			redirect(303, '/admin');
		}
		redirect(303, '/admin/login');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		if (isAdminConfigured()) {
			redirect(303, '/admin/login');
		}

		const formData = await request.formData();
		const username = String(formData.get('username') ?? '').trim();
		const email = String(formData.get('email') ?? '').trim();
		const password = String(formData.get('password') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (!username) {
			return fail(400, {
				username,
				email,
				error: 'Username is required.'
			});
		}

		if (!email || !EMAIL_REGEX.test(email)) {
			return fail(400, {
				username,
				email,
				error: 'A valid email address is required.'
			});
		}

		if (password.length < MIN_PASSWORD_LENGTH) {
			return fail(400, {
				username,
				email,
				error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
			});
		}

		if (password !== confirmPassword) {
			return fail(400, {
				username,
				email,
				error: 'Passwords do not match.'
			});
		}

		const recoveryKey = generateRecoveryKey();
		setAdminCredentials(username, email, password, recoveryKey);
		cookies.set(SESSION_COOKIE_NAME, createSession(), sessionCookieOptions);

		return {
			success: true,
			recoveryKey,
			username,
			email
		};
	}
};
