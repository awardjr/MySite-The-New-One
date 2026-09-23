import { fail } from '@sveltejs/kit';
import {
	checkPassword,
	createSession,
	generateRecoveryKey,
	getAdminProfile,
	hasRecoveryKey,
	invalidateAllSessions,
	sessionCookieOptions,
	SESSION_COOKIE_NAME,
	setAdminPassword,
	setRecoveryKey,
	updateAdminProfile
} from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const load: PageServerLoad = () => {
	const profile = getAdminProfile();
	return {
		username: profile?.username ?? '',
		email: profile?.email ?? '',
		hasRecoveryKey: hasRecoveryKey()
	};
};

export const actions: Actions = {
	updateProfile: async ({ request }) => {
		const formData = await request.formData();
		const username = String(formData.get('username') ?? '').trim();
		const email = String(formData.get('email') ?? '').trim();

		if (!username) {
			return fail(400, { profileError: 'Username cannot be blank.' });
		}

		if (!email || !EMAIL_REGEX.test(email)) {
			return fail(400, { profileError: 'Please provide a valid email address.' });
		}

		updateAdminProfile(username, email);
		return { profileSuccess: true };
	},

	changePassword: async ({ request, cookies }) => {
		const formData = await request.formData();
		const currentPassword = String(formData.get('currentPassword') ?? '');
		const newPassword = String(formData.get('newPassword') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (!checkPassword(currentPassword)) {
			return fail(401, { passwordError: 'Current password is incorrect.' });
		}
		if (newPassword.length < MIN_PASSWORD_LENGTH) {
			return fail(400, {
				passwordError: `New password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
			});
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { passwordError: 'New passwords do not match.' });
		}

		setAdminPassword(newPassword);

		// Revoke every existing session then issue a fresh one so the admin stays logged in.
		invalidateAllSessions();
		cookies.set(SESSION_COOKIE_NAME, createSession(), sessionCookieOptions);

		return { passwordSuccess: true };
	},

	rotateRecoveryKey: async ({ request }) => {
		const formData = await request.formData();
		const currentPassword = String(formData.get('currentPassword') ?? '');

		if (!checkPassword(currentPassword)) {
			return fail(401, { recoveryError: 'Current password is incorrect.' });
		}

		const newKey = generateRecoveryKey();
		setRecoveryKey(newKey);

		return {
			recoverySuccess: true,
			newRecoveryKey: newKey
		};
	}
};
