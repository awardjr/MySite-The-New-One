import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/server/db', async () => {
	const { getTestDb } = await import('./test-db');
	return { db: getTestDb() };
});

// Run the hook as it runs in production; the dev server skips the HSTS header.
vi.mock('$app/env', () => ({ dev: false, browser: false }));

import { getTestDb } from './test-db';
import { createSession, setAdminCredentials } from '../src/lib/server/auth';
import { handle } from '../src/hooks.server';

const testDb = getTestDb();

/** Runs the hook for a request and reports what happened: a redirect, or the resolved response. */
async function run(pathname: string, routeId: string | null, sessionToken?: string) {
	const event = {
		url: new URL(`https://example.test${pathname}`),
		route: { id: routeId },
		cookies: { get: () => sessionToken },
		locals: {} as App.Locals
	};
	const resolve = vi.fn(async () => new Response('ok'));
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await handle({ event, resolve } as any);
		return { resolved: resolve.mock.calls.length > 0, response, redirect: null };
	} catch (thrown) {
		const { status, location } = thrown as { status: number; location: string };
		return { resolved: false, response: null, redirect: { status, location } };
	}
}

beforeEach(async () => {
	testDb.exec('DELETE FROM admin_user');
	testDb.exec('DELETE FROM sessions');
	await setAdminCredentials('admin', 'admin@example.com', 'supersecret123');
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

	// SvelteKit matches routes against the decoded path, so the raw pathname can differ from
	// the route that will actually run. The guard has to follow the matched route.
	it.each(['/%61dmin/settings', '/%41dmin/settings', '/admin%2Fsettings'])(
		'guards an admin route reached through the encoded path %s',
		async (pathname) => {
			const result = await run(pathname, '/admin/(app)/settings');
			expect(result.resolved).toBe(false);
			expect(result.redirect?.location).toMatch(/^\/admin\/login\?redirectTo=/);
		}
	);

	it('guards admin endpoints outside the (app) group', async () => {
		expect((await run('/%61dmin/upload', '/admin/upload')).resolved).toBe(false);
		expect((await run('/admin/logout', '/admin/logout')).resolved).toBe(false);
	});

	it('guards admin-looking paths that match no route', async () => {
		expect((await run('/admin/nope', null)).redirect?.status).toBe(303);
		expect((await run('/%61dmin/nope', null)).redirect?.status).toBe(303);
	});

	it('lets a signed-in admin through', async () => {
		const result = await run('/admin/settings', '/admin/(app)/settings', createSession());
		expect(result.resolved).toBe(true);
	});

	it('keeps the sign-in pages reachable without a session', async () => {
		for (const route of ['/admin/login', '/admin/forgot-password', '/admin/reset']) {
			expect((await run(route, route)).resolved).toBe(true);
		}
	});

	it('leaves public pages alone', async () => {
		expect((await run('/', '/')).resolved).toBe(true);
		expect((await run('/blog/hello', '/blog/[slug]')).resolved).toBe(true);
		expect((await run('/administrator', null)).resolved).toBe(true);
	});

	it('sends every admin route to setup until an account exists', async () => {
		testDb.exec('DELETE FROM admin_user');

		expect((await run('/%61dmin/settings', '/admin/(app)/settings')).redirect?.location).toBe(
			'/admin/setup'
		);
		expect((await run('/admin/login', '/admin/login')).redirect?.location).toBe('/admin/setup');
		expect((await run('/admin/setup', '/admin/setup')).resolved).toBe(true);
	});
});

describe('security headers', () => {
	it('adds the standard headers to every response', async () => {
		const { response } = await run('/', '/');
		expect(response?.headers.get('X-Content-Type-Options')).toBe('nosniff');
		expect(response?.headers.get('X-Frame-Options')).toBe('DENY');
	});

	it('does not pin https for localhost, where it would affect every other local project', async () => {
		expect((await run('/', '/')).response?.headers.has('Strict-Transport-Security')).toBe(true);

		const event = {
			url: new URL('https://localhost:3000/'),
			route: { id: '/' },
			cookies: { get: () => undefined },
			locals: {} as App.Locals
		};
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await handle({ event, resolve: async () => new Response('ok') } as any);
		expect(response.headers.has('Strict-Transport-Security')).toBe(false);
	});
});
