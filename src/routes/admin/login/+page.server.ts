import { fail, redirect } from '@sveltejs/kit';
import {
	checkCredentials,
	createSession,
	isAdminConfigured,
	isLoginLocked,
	recordFailedLogin,
	recordSuccessfulLogin,
	sessionCookieOptions,
	SESSION_COOKIE_NAME
} from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.isAdmin) {
		redirect(303, url.searchParams.get('redirectTo') || '/admin');
	}
	// hooks.server.ts already redirects to /admin/setup when no admin exists,
	// but guard here too in case this load ever runs on its own.
	if (!isAdminConfigured()) {
		redirect(303, '/admin/setup');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		if (!isAdminConfigured()) {
			redirect(303, '/admin/setup');
		}

		const formData = await request.formData();
		const username = String(formData.get('username') ?? '');
		const password = String(formData.get('password') ?? '');

		const clientAddress = getClientAddress();
		if (isLoginLocked(clientAddress)) {
			return fail(429, {
				username,
				error: 'Too many failed attempts. Please try again later.'
			});
		}

		if (!checkCredentials(username, password)) {
			recordFailedLogin(clientAddress);
			return fail(401, {
				username,
				error: 'Incorrect username/email or password.'
			});
		}

		recordSuccessfulLogin(clientAddress);
		cookies.set(SESSION_COOKIE_NAME, createSession(), sessionCookieOptions);

		redirect(303, url.searchParams.get('redirectTo') || '/admin');
	}
};
