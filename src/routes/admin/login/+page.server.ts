import { fail, redirect } from '@sveltejs/kit';
import {
	checkPassword,
	createSession,
	isAdminConfigured,
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
	default: async ({ request, cookies, url }) => {
		if (!isAdminConfigured()) {
			redirect(303, '/admin/setup');
		}

		const formData = await request.formData();
		const password = String(formData.get('password') ?? '');

		if (!checkPassword(password)) {
			return fail(401, { error: 'Incorrect password.' });
		}

		cookies.set(SESSION_COOKIE_NAME, createSession(), sessionCookieOptions);

		redirect(303, url.searchParams.get('redirectTo') || '/admin');
	}
};
