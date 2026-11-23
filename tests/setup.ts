import { vi } from 'vitest';

process.env.BETTER_AUTH_SECRET ??= 'test-only-better-auth-secret-that-is-long-enough';
process.env.BETTER_AUTH_URL ??= 'https://example.test';

vi.mock('$app/server', async () => {
	const { getActiveEvent } = await import('./request-event');
	return { getRequestEvent: getActiveEvent };
});
