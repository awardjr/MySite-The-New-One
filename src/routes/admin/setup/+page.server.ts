import { fail, redirect } from '@sveltejs/kit';
import {
	createSession,
	isAdminConfigured,
	sessionCookieOptions,
	SESSION_COOKIE_NAME,
	setAdminPassword
} from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

const MIN_PASSWORD_LENGTH = 8;

export const load: PageServerLoad = () => {
	// Setup is only for a brand-new database with no admin password yet.
	if (isAdminConfigured()) {
		throw redirect(303, '/admin/login');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		if (isAdminConfigured()) {
			throw redirect(303, '/admin/login');
		}

		const formData = await request.formData();
		const password = String(formData.get('password') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (password.length < MIN_PASSWORD_LENGTH) {
			return fail(400, { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` });
		}
		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		setAdminPassword(password);
		cookies.set(SESSION_COOKIE_NAME, createSession(), sessionCookieOptions);

		throw redirect(303, '/admin');
	}
};
