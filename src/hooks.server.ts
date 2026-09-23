import { redirect, type Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { SESSION_COOKIE_NAME, isAdminConfigured, verifySessionToken } from '$lib/server/auth';

// Blog posts are admin-authored HTML rendered with {@html}; it's sanitized on
// save, but a strict CSP adds defense-in-depth against XSS and clickjacking.
const CONTENT_SECURITY_POLICY = [
	"default-src 'self'",
	`script-src 'self'${dev ? " 'unsafe-inline' 'unsafe-eval'" : ''}`,
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: https:",
	"font-src 'self' data:",
	`connect-src 'self'${dev ? ' ws:' : ''}`,
	"frame-ancestors 'none'",
	"base-uri 'self'",
	"form-action 'self'"
].join('; ');

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.isAdmin = verifySessionToken(event.cookies.get(SESSION_COOKIE_NAME));

	const isAdminRoute = event.url.pathname === '/admin' || event.url.pathname.startsWith('/admin/');
	const isLoginRoute = event.url.pathname === '/admin/login';
	const isSetupRoute = event.url.pathname === '/admin/setup';
	const isForgotPasswordRoute = event.url.pathname === '/admin/forgot-password';
	const isResetRoute = event.url.pathname === '/admin/reset';
	const isPublicAdminRoute = isLoginRoute || isSetupRoute || isForgotPasswordRoute || isResetRoute;

	// No admin password has been created in the database yet: send user to the one time setup page
	if (isAdminRoute && !isSetupRoute && !isAdminConfigured()) {
		redirect(303, '/admin/setup');
	}

	if (isAdminRoute && !isPublicAdminRoute && !event.locals.isAdmin) {
		const redirectTo = event.url.pathname + event.url.search;
		redirect(303, `/admin/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	const response = await resolve(event);

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);

	return response;
};
