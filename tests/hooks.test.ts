import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/server/db.js', async () => {
	const { migratedTestDb } = await import('./test-db');
	return { db: await migratedTestDb() };
});

vi.mock('$app/env', () => ({ dev: false, browser: false, building: false }));

import { clearAuth, seedAdmin, signIn } from './auth-helpers';
import { setActiveEvent } from './request-event';
import { cookieHeader, fakeCookies } from './route-helpers';
import { handle } from '../src/hooks.server';

const PASSWORD = 'supersecret123';

async function run(
	pathname: string,
	routeId: string | null,
	cookies = fakeCookies(),
	origin = 'https://example.test'
) {
	const url = new URL(`${origin}${pathname}`);
	const event = {
		url,
		request: new Request(url, { headers: { cookie: cookieHeader(cookies) } }),
		route: { id: routeId },
		cookies,
		locals: {} as App.Locals
	};
	setActiveEvent(event);
	const resolve = vi.fn(async () => new Response('ok'));
	try {
		const response = await handle({ event, resolve } as unknown as Parameters<typeof handle>[0]);
		return {
			resolved: resolve.mock.calls.length > 0,
			response,
			redirect: null,
			locals: event.locals
		};
	} catch (thrown) {
		const { status, location } = thrown as { status: number; location: string };
		return {
			resolved: false,
			response: null,
			redirect: { status, location },
			locals: event.locals
		};
	}
}

beforeEach(async () => {
	await seedAdmin('admin', 'admin@example.com', PASSWORD);
});

afterEach(() => {
	vi.useRealTimers();
});

describe('admin route guard', () => {
	it('sends signed-out visitors to the login page', async () => {
		const result = await run('/admin/settings', '/admin/(app)/settings');
		expect(result.resolved).toBe(false);
		expect(result.redirect).toEqual({
			status: 303,
			location: '/admin/login?redirectTo=%2Fadmin%2Fsettings'
		});
	});

	it('remembers the query string for after login', async () => {
		const result = await run('/admin/blog?page=2', '/admin/(app)/blog');
		expect(result.redirect?.location).toBe('/admin/login?redirectTo=%2Fadmin%2Fblog%3Fpage%3D2');
	});

	it('guards every matched admin route, however its path is written', async () => {
		for (const [pathname, route] of [
			['/admin', '/admin/(app)'],
			['/%61dmin/settings', '/admin/(app)/settings'],
			['/admin%2Fsettings', '/admin/(app)/settings'],
			['/%61dmin/upload', '/admin/upload'],
			['/admin/logout', '/admin/logout']
		]) {
			const result = await run(pathname, route);
			expect(result.resolved, pathname).toBe(false);
			expect(result.redirect?.location, pathname).toMatch(/^\/admin\/login\?redirectTo=/);
		}
	});

	it('guards admin-looking paths that match no route', async () => {
		for (const pathname of ['/admin/nope', '/%61dmin/nope', '/ADMIN/nope']) {
			expect((await run(pathname, null)).redirect?.status, pathname).toBe(303);
		}
	});

	it('does not crash on a malformed escape in an unmatched path', async () => {
		expect((await run('/%E0%A4%A', null)).resolved).toBe(true);
		expect((await run('/admin/%E0%A4%A', null)).redirect?.status).toBe(303);
	});

	it('lets a signed-in admin through and marks the request', async () => {
		const result = await run('/admin/settings', '/admin/(app)/settings', await signIn(PASSWORD));
		expect(result.resolved).toBe(true);
		expect(result.locals.isAdmin).toBe(true);
	});

	it('rejects a forged or expired session', async () => {
		const cookies = await signIn(PASSWORD);
		const forged = fakeCookies(
			Object.fromEntries([...cookies.values].map(([name, value]) => [name, `${value}x`]))
		);
		vi.useFakeTimers({ toFake: ['Date'], now: Date.now() + 8 * 24 * 60 * 60 * 1000 });

		for (const jar of [forged, cookies]) {
			const result = await run('/admin/settings', '/admin/(app)/settings', jar);
			expect(result.redirect?.status).toBe(303);
			expect(result.locals.isAdmin).toBe(false);
		}
	});

	it('keeps the sign-in pages reachable without a session', async () => {
		for (const route of [
			'/admin/login',
			'/admin/forgot-password',
			'/admin/reset',
			'/admin/setup'
		]) {
			expect((await run(route, route)).resolved, route).toBe(true);
		}
		expect((await run('/admin/login', '/admin/(auth)/login')).resolved).toBe(true);
	});

	it('leaves public pages alone and marks visitors as not admin', async () => {
		expect((await run('/', '/')).locals.isAdmin).toBe(false);
		expect((await run('/', '/')).resolved).toBe(true);
		expect((await run('/blog/admin', '/blog/[slug]')).resolved).toBe(true);
		expect((await run('/administrator', null)).resolved).toBe(true);
	});

	it('sends every admin route to setup until an account exists', async () => {
		clearAuth();

		expect((await run('/%61dmin/settings', '/admin/(app)/settings')).redirect?.location).toBe(
			'/admin/setup'
		);
		expect((await run('/admin/login', '/admin/login')).redirect?.location).toBe('/admin/setup');
		expect((await run('/admin/nope', null)).redirect?.location).toBe('/admin/setup');
		expect((await run('/admin/setup', '/admin/setup')).resolved).toBe(true);
		expect((await run('/', '/')).resolved).toBe(true);
	});
});

describe('security headers', () => {
	it('adds the standard headers to every response', async () => {
		const { response } = await run('/', '/');
		expect(response?.headers.get('X-Content-Type-Options')).toBe('nosniff');
		expect(response?.headers.get('X-Frame-Options')).toBe('DENY');
		expect(response?.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
		expect(response?.headers.get('Strict-Transport-Security')).toBe('max-age=31536000');
	});

	it('does not pin https on localhost, where it would affect every other local project', async () => {
		for (const origin of [
			'https://localhost:3000',
			'https://127.0.0.1:3000',
			'https://[::1]:3000'
		]) {
			const { response } = await run('/', '/', fakeCookies(), origin);
			expect(response?.headers.has('Strict-Transport-Security'), origin).toBe(false);
		}
	});
});
