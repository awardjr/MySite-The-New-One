import { fail } from '@sveltejs/kit';
import { checkPassword, setAdminPassword } from '$lib/server/auth';
import type { Actions } from './$types';

const MIN_PASSWORD_LENGTH = 8;

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const currentPassword = String(formData.get('currentPassword') ?? '');
		const newPassword = String(formData.get('newPassword') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (!checkPassword(currentPassword)) {
			return fail(401, { error: 'Current password is incorrect.' });
		}
		if (newPassword.length < MIN_PASSWORD_LENGTH) {
			return fail(400, { error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters long.` });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'New passwords do not match.' });
		}

		setAdminPassword(newPassword);

		return { success: true };
	}
};
