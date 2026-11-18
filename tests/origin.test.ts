import { afterEach, describe, expect, it, vi } from 'vitest';
import { siteOrigin } from '#lib/server/origin.js';

const requestUrl = new URL('https://request.test/admin/forgot-password');

afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

describe('siteOrigin', () => {
	it('prefers ORIGIN over the request, keeping only its origin', () => {
		vi.stubEnv('ORIGIN', 'https://configured.test/some/path?x=1');
		expect(siteOrigin(requestUrl)).toBe('https://configured.test');
	});

	it('uses the request origin when ORIGIN is unset', () => {
		vi.stubEnv('ORIGIN', '');
		expect(siteOrigin(requestUrl)).toBe('https://request.test');
	});

	it('logs an invalid ORIGIN and falls back to the request', () => {
		vi.stubEnv('ORIGIN', 'not a url');
		const logged = vi.spyOn(console, 'error').mockImplementation(() => {});

		expect(siteOrigin(requestUrl)).toBe('https://request.test');
		expect(logged).toHaveBeenCalledOnce();
	});
});
