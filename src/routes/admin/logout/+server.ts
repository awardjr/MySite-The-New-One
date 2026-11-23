import { redirect } from '@sveltejs/kit';
import { signOut } from '#lib/server/auth.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	await signOut(request.headers);
	redirect(303, '/admin/login');
};
