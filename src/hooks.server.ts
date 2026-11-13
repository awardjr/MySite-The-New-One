import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { dev } from '$app/env';
import { SESSION_COOKIE_NAME, isAdminConfigured, verifySessionToken } from '#lib/server/auth.js';

const SETUP_ROUTE = '/admin/setup';
/** Admin routes that are reachable without a session. */
const PUBLIC_ADMIN_ROUTES = new Set([
	'/admin/login',
	SETUP_ROUTE,
	'/admin/forgot-password',
	'/admin/reset'
]);

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

function looksLikeAdminPath(pathname: string): boolean {
	let decoded = pathname;
	try {
		decoded = decodeURIComponent(pathname);
	} catch {
		// Malformed escapes never match a route, so the raw pathname is enough.
	}
	return /^\/admin(\/|$)/i.test(decoded);
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.isAdmin = verifySessionToken(event.cookies.get(SESSION_COOKIE_NAME));

	// Decide by the route SvelteKit actually matched, not by the raw pathname: routes are matched
	// against the *decoded* path, so `/%61dmin/settings` reaches the admin routes while a check on
	// `url.pathname` would let it through. Route groups such as `(app)` are part of the id.
	const routeId = event.route.id?.replace(/\/\([^/]+\)/g, '') ?? null;
	const isAdminRoute = routeId
		? routeId === '/admin' || routeId.startsWith('/admin/')
		: // No route matched (a 404): still treat admin-looking paths as private.
			looksLikeAdminPath(event.url.pathname);
	const isSetupRoute = routeId === SETUP_ROUTE;
	const isPublicAdminRoute = routeId !== null && PUBLIC_ADMIN_ROUTES.has(routeId);

	// No admin password has been created in the database yet: send user to the one time setup page
	if (isAdminRoute && !isSetupRoute && !isAdminConfigured()) {
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
	// Not for localhost: browsers apply HSTS to a hostname on every port, so sending it from a
	// local https run would force https onto every other project served from localhost.
	if (!dev && !LOCAL_HOSTNAMES.has(event.url.hostname)) {
		// Browsers ignore this header over plain HTTP, so it is safe to send unconditionally.
		response.headers.set('Strict-Transport-Security', 'max-age=31536000');
	}
	// Pages get their Content-Security-Policy (with script nonces) from the `csp` option in vite.config.ts.

	return response;
};
