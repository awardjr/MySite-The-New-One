import { redirect } from '@sveltejs/kit';
import { endSession } from '#lib/server/auth.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ cookies }) => {
	endSession(cookies);
	redirect(303, '/admin/login');
};
