import { redirect, type Handle } from '@sveltejs/kit';
import { SESSION_COOKIE_NAME, isAdminConfigured, verifySessionToken } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.isAdmin = verifySessionToken(event.cookies.get(SESSION_COOKIE_NAME));

	const isAdminRoute = event.url.pathname === '/admin' || event.url.pathname.startsWith('/admin/');
	const isLoginRoute = event.url.pathname === '/admin/login';
	const isSetupRoute = event.url.pathname === '/admin/setup';

	// No admin password has been created in the database yet: send visitors to
	// the one-time setup page instead of a login form that can never succeed.
	if (isAdminRoute && !isSetupRoute && !isAdminConfigured()) {
		redirect(303, '/admin/setup');
	}

	if (isAdminRoute && !isLoginRoute && !isSetupRoute && !event.locals.isAdmin) {
		const redirectTo = event.url.pathname + event.url.search;
		redirect(303, `/admin/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	return resolve(event);
};
