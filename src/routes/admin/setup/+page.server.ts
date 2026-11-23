import { fail, redirect } from '@sveltejs/kit';
import { constantTimeEqual } from 'better-auth/crypto';
import {
	createAdmin,
	isAdminConfigured,
	validateNewPassword,
	validateProfile
} from '#lib/server/auth.js';
import { raw, text } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

function requiredSetupToken(): string | null {
	return process.env.SETUP_TOKEN || null;
}

export const load: PageServerLoad = async ({ locals, request }) => {
	if ((await isAdminConfigured()) && request.method !== 'POST') {
		redirect(303, locals.isAdmin ? '/admin' : '/admin/login');
	}
	return { setupTokenRequired: requiredSetupToken() !== null };
};

export const actions: Actions = {
	default: async ({ request }) => {
		if (await isAdminConfigured()) {
			redirect(303, '/admin/login');
		}

		const formData = await request.formData();
		const username = text(formData.get('username'));
		const email = text(formData.get('email'));
		const password = raw(formData, 'password');
		const invalid = (error: string) => fail(400, { username, email, error });

		const setupToken = requiredSetupToken();
		if (setupToken !== null && !constantTimeEqual(raw(formData, 'setupToken').trim(), setupToken)) {
			return invalid('The setup token is incorrect.');
		}

		const inputError =
			validateProfile(username, email) ??
			validateNewPassword(password, raw(formData, 'confirmPassword'));
		if (inputError) {
			return invalid(inputError);
		}

		const recoveryKey = await createAdmin(username, email, password);
		if (!recoveryKey) {
			redirect(303, '/admin/login');
		}

		return { success: true, recoveryKey, username, email };
	}
};
