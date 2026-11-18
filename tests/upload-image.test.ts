import { afterEach, describe, expect, it, vi } from 'vitest';
import { uploadImage } from '#lib/uploadImage.js';

const file = new File(['x'], 'a.png', { type: 'image/png' });
const respondWith = (body: string, status = 200) =>
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status })));

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('uploadImage', () => {
	it('posts the file to the admin endpoint and returns its public path', async () => {
		respondWith('{"path":"/uploads/a.png"}');

		expect(await uploadImage(file)).toBe('/uploads/a.png');

		const [url, init] = vi.mocked(fetch).mock.calls[0];
		expect(url).toBe('/admin/upload');
		expect(init?.method).toBe('POST');
		expect((init?.body as FormData).get('file')).toBeInstanceOf(File);
	});

	it('shows the error the server gave', async () => {
		respondWith('{"error":"Image is too large (max 5 MB)."}', 400);
		await expect(uploadImage(file)).rejects.toThrow('Image is too large (max 5 MB).');
	});

	it.each([
		['a non-JSON response', 'gateway error', 502],
		['no usable path or error', '{"error":{"code":1}}', 200],
		['a path on a failed response', '{"path":"/uploads/a.png"}', 500]
	])('falls back to a generic message for %s', async (_name, body, status) => {
		respondWith(body, status);
		await expect(uploadImage(file)).rejects.toThrow(/^Upload failed\.$/);
	});

	it('reports a network failure', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
		await expect(uploadImage(file)).rejects.toThrow(/^Upload failed\.$/);
	});
});
