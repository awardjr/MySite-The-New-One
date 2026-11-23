import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import {
	isAdminConfigured,
	LOCKED_MESSAGE,
	loginAttempts,
	signInWithPassword,
	submitSecondFactor,
	twoFactorCookie
} from '#lib/server/auth.js';
import { raw } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

function safeRedirectTarget(url: URL): string {
	const target = url.searchParams.get('redirectTo') ?? '';
	const isAdminPath =
		target === '/admin' || target.startsWith('/admin/') || target.startsWith('/admin?');
	return isAdminPath && !target.includes('\\') ? target : '/admin';
}

export const load: PageServerLoad = async ({ locals, url, cookies }) => {
	if (locals.isAdmin) {
		redirect(303, safeRedirectTarget(url));
	}
	if (!(await isAdminConfigured())) {
		redirect(303, '/admin/setup');
	}
	return {
		twoFactor: cookies.get(twoFactorCookie.name) !== undefined,
		passwordReset: url.searchParams.has('reset')
	};
};

function forgetChallenge({ cookies }: RequestEvent): void {
	cookies.delete(twoFactorCookie.name, { path: '/' });
}

async function signedIn({ url, getClientAddress }: RequestEvent): Promise<never> {
	await loginAttempts.clear(getClientAddress());
	redirect(303, safeRedirectTarget(url));
}

async function submitCode(event: RequestEvent, code: string) {
	if (event.cookies.get(twoFactorCookie.name) === undefined) {
		return fail(400, {
			twoFactor: false,
			error: 'Your sign-in expired. Please enter your password again.'
		});
	}

	const result = await loginAttempts.guard(
		event.getClientAddress(),
		() => submitSecondFactor(event.request.headers, code),
		(outcome) => outcome === 'ok'
	);

	switch (result) {
		case 'ok':
			return signedIn(event);
		case 'locked':
			return fail(429, { twoFactor: true, error: LOCKED_MESSAGE });
		case 'invalid':
			return fail(401, { twoFactor: true, error: 'Incorrect code. Please try again.' });
		case 'too-many':
			forgetChallenge(event);
			return fail(401, {
				twoFactor: false,
				error: 'Too many incorrect codes. Please enter your password again.'
			});
		case 'expired':
			forgetChallenge(event);
			return fail(400, {
				twoFactor: false,
				error: 'Your sign-in expired. Please enter your password again.'
			});
	}
}

async function submitPassword(event: RequestEvent, username: string, password: string) {
	const result = await loginAttempts.guard(event.getClientAddress(), () =>
		signInWithPassword(event.request.headers, username, password)
	);

	if (result === 'locked') {
		return fail(429, { username, error: LOCKED_MESSAGE });
	}
	if (!result) {
		return fail(401, { username, error: 'Incorrect username/email or password.' });
	}
	if (result.twoFactor) {
		return { twoFactor: true };
	}
	return signedIn(event);
}

export const actions: Actions = {
	default: async (event) => {
		if (!(await isAdminConfigured())) {
			redirect(303, '/admin/setup');
		}

		const formData = await event.request.formData();
		if (formData.has('cancel')) {
			forgetChallenge(event);
			return { twoFactor: false };
		}
		if (formData.has('code')) return submitCode(event, raw(formData, 'code'));
		return submitPassword(event, raw(formData, 'username'), raw(formData, 'password'));
	}
};
