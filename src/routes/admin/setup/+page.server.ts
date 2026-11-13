import { fail, redirect } from '@sveltejs/kit';
import {
	createAdmin,
	generateRecoveryKey,
	isAdminConfigured,
	isValidEmail,
	safeEqual,
	startSession,
	validateNewPassword
} from '#lib/server/auth.js';
import { raw, text } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

/**
 * Optional `SETUP_TOKEN` environment variable. When set, the setup form also asks for it, so
 * whoever reaches a freshly deployed site first can't claim the admin account.
 */
function requiredSetupToken(): string | null {
	return process.env.SETUP_TOKEN || null;
}

export const load: PageServerLoad = ({ locals, request }) => {
	// Setup is only for a brand-new database with no admin account yet. The exception is the
	// form post that has just created the account: its response must render this page once more
	// to show the recovery code, so only page views are redirected.
	if (isAdminConfigured() && request.method !== 'POST') {
		if (locals.isAdmin) {
			redirect(303, '/admin');
		}
		redirect(303, '/admin/login');
	}
	return { setupTokenRequired: requiredSetupToken() !== null };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		if (isAdminConfigured()) {
			redirect(303, '/admin/login');
		}

		const formData = await request.formData();
		const username = text(formData.get('username'));
		const email = text(formData.get('email'));
		const password = raw(formData, 'password');
		const invalid = (error: string) => fail(400, { username, email, error });

		const setupToken = requiredSetupToken();
		if (setupToken !== null && !safeEqual(raw(formData, 'setupToken').trim(), setupToken)) {
			return invalid('The setup token is incorrect.');
		}

		if (!username) {
			return invalid('Username is required.');
		}

		if (!email || !isValidEmail(email)) {
			return invalid('A valid email address is required.');
		}

		const passwordError = validateNewPassword(password, raw(formData, 'confirmPassword'));
		if (passwordError) {
			return invalid(passwordError);
		}

		const recoveryKey = generateRecoveryKey();
		if (!(await createAdmin(username, email, password, recoveryKey))) {
			// Another request finished setup first.
			redirect(303, '/admin/login');
		}
		startSession(cookies);

		return {
			success: true,
			recoveryKey,
			username,
			email
		};
	}
};
