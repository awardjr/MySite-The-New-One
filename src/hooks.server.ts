import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { dev } from '$app/env';
import { SETUP_ROUTE, signInRoutes } from '#lib/adminSections.js';
import { isAdminConfigured, isSignedIn } from '#lib/server/auth.js';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

function looksLikeAdminPath(pathname: string): boolean {
	let decoded: string;
	try {
		decoded = decodeURIComponent(pathname);
	} catch {
		decoded = pathname;
	}
	return /^\/admin(\/|$)/i.test(decoded);
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.isAdmin = await isSignedIn(event.request.headers);

	const routeId = event.route.id?.replace(/\/\([^/]+\)/g, '') ?? null;
	const isAdminRoute = routeId
		? routeId === '/admin' || routeId.startsWith('/admin/')
		: looksLikeAdminPath(event.url.pathname);
	const isSetupRoute = routeId === SETUP_ROUTE;
	const isPublicAdminRoute = routeId !== null && signInRoutes.has(routeId);

	if (isAdminRoute && !isSetupRoute && !(await isAdminConfigured())) {
		redirect(303, SETUP_ROUTE);
	}

	if (isAdminRoute && !isPublicAdminRoute && !event.locals.isAdmin) {
		const redirectTo = event.url.pathname + event.url.search;
		redirect(303, `/admin/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	const response = await resolve(event);

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	if (!dev && !LOCAL_HOSTNAMES.has(event.url.hostname)) {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000');
	}

	return response;
};
