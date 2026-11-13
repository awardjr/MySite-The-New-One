import { fail, redirect } from '@sveltejs/kit';
import {
	cancelTwoFactorChallenge,
	checkCredentials,
	completeTwoFactorChallenge,
	createTwoFactorChallenge,
	guardLogin,
	hasTwoFactorChallenge,
	isAdminConfigured,
	isTotpEnabled,
	recordSuccessfulLogin,
	startSession,
	twoFactorCookieOptions,
	TWO_FACTOR_COOKIE_NAME,
	type SecondFactor
} from '#lib/server/auth.js';
import { raw } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

const LOCKED_MESSAGE = 'Too many failed attempts. Please try again later.';

/** Only allow redirects to admin paths on this site, so `redirectTo` can't send users off-site. */
function safeRedirectTarget(url: URL): string {
	const target = url.searchParams.get('redirectTo') ?? '';
	const isAdminPath =
		target === '/admin' || target.startsWith('/admin/') || target.startsWith('/admin?');
	return isAdminPath && !target.includes('\\') ? target : '/admin';
}

export const load: PageServerLoad = ({ locals, url, cookies }) => {
	if (locals.isAdmin) {
		redirect(303, safeRedirectTarget(url));
	}
	// hooks.server.ts already redirects to /admin/setup when no admin exists,
	// but guard here too in case this load ever runs on its own.
	if (!isAdminConfigured()) {
		redirect(303, '/admin/setup');
	}
	return {
		// Keep showing the code step on reload while the password step is still valid.
		twoFactor: hasTwoFactorChallenge(cookies.get(TWO_FACTOR_COOKIE_NAME)),
		passwordReset: url.searchParams.has('reset')
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		if (!isAdminConfigured()) {
			redirect(303, '/admin/setup');
		}

		const formData = await request.formData();
		const clientAddress = getClientAddress();
		const challenge = cookies.get(TWO_FACTOR_COOKIE_NAME);

		// "Back" from the code step: forget the pending login and show the password form again.
		if (formData.has('cancel')) {
			cancelTwoFactorChallenge(challenge);
			cookies.delete(TWO_FACTOR_COOKIE_NAME, twoFactorCookieOptions);
			return { twoFactor: false };
		}

		// Second step: the password was already accepted, now check the 2FA code.
		if (formData.has('code')) {
			const factor = await guardLogin(
				clientAddress,
				async (): Promise<SecondFactor | 'expired' | null> =>
					hasTwoFactorChallenge(challenge)
						? completeTwoFactorChallenge(challenge, raw(formData, 'code'))
						: 'expired'
			);

			if (factor === 'locked') {
				return fail(429, { twoFactor: true, error: LOCKED_MESSAGE });
			}
			if (factor === 'expired') {
				cookies.delete(TWO_FACTOR_COOKIE_NAME, twoFactorCookieOptions);
				return fail(400, {
					twoFactor: false,
					error: 'Your sign-in expired. Please enter your password again.'
				});
			}
			if (!factor) {
				const stillPending = hasTwoFactorChallenge(challenge);
				if (!stillPending) cookies.delete(TWO_FACTOR_COOKIE_NAME, twoFactorCookieOptions);
				return fail(401, {
					twoFactor: stillPending,
					error: stillPending
						? 'Incorrect code. Please try again.'
						: 'Too many incorrect codes. Please enter your password again.'
				});
			}

			cookies.delete(TWO_FACTOR_COOKIE_NAME, twoFactorCookieOptions);
			recordSuccessfulLogin(clientAddress);
			startSession(cookies);

			// A recovery code only works once. Show its replacement before moving on.
			if (factor.method === 'recovery') {
				return {
					twoFactor: false,
					newRecoveryKey: factor.newRecoveryKey,
					continueTo: safeRedirectTarget(url)
				};
			}
			redirect(303, safeRedirectTarget(url));
		}

		const username = raw(formData, 'username');
		const credentialsOk = await guardLogin(clientAddress, () =>
			checkCredentials(username, raw(formData, 'password'))
		);

		if (credentialsOk === 'locked') {
			return fail(429, { username, error: LOCKED_MESSAGE });
		}
		if (!credentialsOk) {
			return fail(401, { username, error: 'Incorrect username/email or password.' });
		}

		// With 2FA on, the password alone doesn't create a session; ask for the code next.
		if (isTotpEnabled()) {
			cancelTwoFactorChallenge(challenge);
			cookies.set(TWO_FACTOR_COOKIE_NAME, createTwoFactorChallenge(), twoFactorCookieOptions);
			return { twoFactor: true };
		}

		recordSuccessfulLogin(clientAddress);
		startSession(cookies);

		redirect(303, safeRedirectTarget(url));
	}
};
