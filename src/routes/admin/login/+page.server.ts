import { fail, redirect, type Cookies, type RequestEvent } from '@sveltejs/kit';
import {
	cancelTwoFactorChallenge,
	checkCredentials,
	completeTwoFactorChallenge,
	createTwoFactorChallenge,
	loginAttempts,
	hasTwoFactorChallenge,
	isAdminConfigured,
	isTotpEnabled,
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

/** What the login page shows next. One shared type keeps every field visible to the page. */
type LoginStep = { twoFactor: boolean; newRecoveryKey?: string; continueTo?: string };

function forgetChallengeCookie(cookies: Cookies): void {
	cookies.delete(TWO_FACTOR_COOKIE_NAME, twoFactorCookieOptions);
}

function signIn({ cookies, getClientAddress }: RequestEvent): void {
	loginAttempts.clear(getClientAddress());
	startSession(cookies);
}

/** "Back" from the code step: forgets the pending login and shows the password form again. */
function cancelCodeStep({ cookies }: RequestEvent): LoginStep {
	cancelTwoFactorChallenge(cookies.get(TWO_FACTOR_COOKIE_NAME));
	forgetChallengeCookie(cookies);
	return { twoFactor: false };
}

/** The second step: the password was already accepted, so this checks the 2FA code. */
async function submitCode(event: RequestEvent, code: string) {
	const { cookies, url, getClientAddress } = event;
	const challenge = cookies.get(TWO_FACTOR_COOKIE_NAME);
	const factor = await loginAttempts.guard(
		getClientAddress(),
		async (): Promise<SecondFactor | 'expired' | null> =>
			hasTwoFactorChallenge(challenge) ? completeTwoFactorChallenge(challenge, code) : 'expired'
	);

	if (factor === 'locked') {
		return fail(429, { twoFactor: true, error: LOCKED_MESSAGE });
	}
	if (factor === 'expired') {
		forgetChallengeCookie(cookies);
		return fail(400, {
			twoFactor: false,
			error: 'Your sign-in expired. Please enter your password again.'
		});
	}
	if (!factor) {
		const stillPending = hasTwoFactorChallenge(challenge);
		if (!stillPending) forgetChallengeCookie(cookies);
		return fail(401, {
			twoFactor: stillPending,
			error: stillPending
				? 'Incorrect code. Please try again.'
				: 'Too many incorrect codes. Please enter your password again.'
		});
	}

	forgetChallengeCookie(cookies);
	signIn(event);

	// A recovery code only works once. Show its replacement before moving on.
	if (factor.method === 'recovery') {
		const showReplacement: LoginStep = {
			twoFactor: false,
			newRecoveryKey: factor.newRecoveryKey,
			continueTo: safeRedirectTarget(url)
		};
		return showReplacement;
	}
	redirect(303, safeRedirectTarget(url));
}

/** The first step: checks the username and password. */
async function submitPassword(event: RequestEvent, username: string, password: string) {
	const { cookies, url, getClientAddress } = event;
	const credentialsOk = await loginAttempts.guard(getClientAddress(), () =>
		checkCredentials(username, password)
	);

	if (credentialsOk === 'locked') {
		return fail(429, { username, error: LOCKED_MESSAGE });
	}
	if (!credentialsOk) {
		return fail(401, { username, error: 'Incorrect username/email or password.' });
	}

	// With 2FA on, the password alone doesn't create a session; ask for the code next.
	if (isTotpEnabled()) {
		cancelTwoFactorChallenge(cookies.get(TWO_FACTOR_COOKIE_NAME));
		cookies.set(TWO_FACTOR_COOKIE_NAME, createTwoFactorChallenge(), twoFactorCookieOptions);
		const askForCode: LoginStep = { twoFactor: true };
		return askForCode;
	}

	signIn(event);
	redirect(303, safeRedirectTarget(url));
}

export const actions: Actions = {
	// One action, not several named ones: a named action's `?/name` URL would drop `redirectTo`.
	default: async (event) => {
		if (!isAdminConfigured()) {
			redirect(303, '/admin/setup');
		}

		const formData = await event.request.formData();
		if (formData.has('cancel')) return cancelCodeStep(event);
		if (formData.has('code')) return submitCode(event, raw(formData, 'code'));
		return submitPassword(event, raw(formData, 'username'), raw(formData, 'password'));
	}
};
