import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// UPLOAD_DIR is read when the module loads, so point it at a throwaway directory first.
const { uploadDir } = await vi.hoisted(async () => {
	const { mkdtempSync } = await import('node:fs');
	const { tmpdir } = await import('node:os');
	const { join } = await import('node:path');
	const dir = mkdtempSync(join(tmpdir(), 'mysite-uploads-test-'));
	process.env.UPLOAD_DIR = dir;
	return { uploadDir: dir };
});

import { outcome } from './route-helpers';
import { resolveUploadPath, saveUploadedImage, UploadError } from '#lib/server/uploads.js';
import { POST as uploadEndpoint } from '../src/routes/admin/upload/+server';
import { GET as serveUpload } from '../src/routes/uploads/[...path]/+server';

const BASE = path.resolve('/srv/uploads');
const MAX_SIZE = 5 * 1024 * 1024;
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 255]);

const image = (name = 'photo.png', type = 'image/png', content: BlobPart = PNG_BYTES) =>
	new File([content], name, { type });
const storedPath = (publicPath: string) => path.join(uploadDir, path.basename(publicPath));

beforeEach(() => {
	fs.rmSync(uploadDir, { recursive: true, force: true });
	fs.mkdirSync(uploadDir, { recursive: true });
});

afterEach(() => {
	vi.restoreAllMocks();
});

afterAll(() => {
	fs.rmSync(uploadDir, { recursive: true, force: true });
});

describe('resolveUploadPath', () => {
	it('resolves an allowlisted image inside the upload dir', () => {
		expect(resolveUploadPath('123-abc.webp', BASE)).toEqual({
			filePath: path.join(BASE, '123-abc.webp'),
			contentType: 'image/webp'
		});
		expect(resolveUploadPath('nested/a.png', BASE)?.filePath).toBe(
			path.join(BASE, 'nested', 'a.png')
		);
	});

	it.each([
		['a.jpg', 'image/jpeg'],
		['a.JPEG', 'image/jpeg'],
		['a.png', 'image/png'],
		['a.gif', 'image/gif'],
		['a.svg', 'image/svg+xml']
	])('maps %s to %s', (file, contentType) => {
		expect(resolveUploadPath(file, BASE)?.contentType).toBe(contentType);
	});

	it.each(['cms.sqlite3', 'page.html', 'noextension', 'a.png.exe', '.png'])(
		'rejects the non-image %s',
		(file) => {
			expect(resolveUploadPath(file, BASE)).toBeNull();
		}
	);

	it.each(['../data/cms.sqlite3', '../secret.png', 'a/../../secret.png', '..', '.', 'a/..'])(
		'rejects %s, which leaves or is the upload dir',
		(file) => {
			expect(resolveUploadPath(file, BASE)).toBeNull();
		}
	);

	it('does not treat a sibling directory with the same prefix as inside', () => {
		expect(resolveUploadPath('../uploads-private/a.png', BASE)).toBeNull();
	});

	it('rejects absolute paths, empty paths and null bytes', () => {
		expect(resolveUploadPath('/etc/passwd.png', BASE)).toBeNull();
		expect(resolveUploadPath('', BASE)).toBeNull();
		expect(resolveUploadPath('a.png\0.txt', BASE)).toBeNull();
	});
});

describe('saveUploadedImage', () => {
	it('stores the bytes under a generated public name', async () => {
		const publicPath = await saveUploadedImage(image());

		expect(publicPath).toMatch(/^\/uploads\/\d+-[0-9a-f]{12}\.png$/);
		expect(new Uint8Array(fs.readFileSync(storedPath(publicPath)))).toEqual(PNG_BYTES);
	});

	it('never overwrites an earlier upload of the same file', async () => {
		expect(await saveUploadedImage(image())).not.toBe(await saveUploadedImage(image()));
	});

	it.each([
		['image/jpeg', 'jpg'],
		['image/png', 'png'],
		['image/gif', 'gif'],
		['image/webp', 'webp']
	])('names %s files by type, ignoring the client file name', async (type, extension) => {
		const publicPath = await saveUploadedImage(image('../../evil.html', type));
		expect(path.extname(publicPath)).toBe(`.${extension}`);
		expect(path.dirname(publicPath)).toBe('/uploads');
	});

	it.each(['text/html', 'application/pdf', 'image/bmp', ''])(
		'rejects the type %j',
		async (type) => {
			await expect(saveUploadedImage(image('a.png', type))).rejects.toBeInstanceOf(UploadError);
			expect(fs.readdirSync(uploadDir)).toEqual([]);
		}
	);

	it('rejects an empty file', async () => {
		await expect(saveUploadedImage(image('a.png', 'image/png', ''))).rejects.toThrow(
			'No file was uploaded.'
		);
	});

	it('accepts exactly 5 MB and rejects one byte more', async () => {
		const atLimit = image('a.png', 'image/png', new Uint8Array(MAX_SIZE));
		const overLimit = image('a.png', 'image/png', new Uint8Array(MAX_SIZE + 1));

		await expect(saveUploadedImage(atLimit)).resolves.toMatch(/\.png$/);
		await expect(saveUploadedImage(overLimit)).rejects.toThrow('too large');
	});

	describe('SVG sanitizing', () => {
		const saveSvg = async (svg: string) =>
			fs.readFileSync(
				storedPath(await saveUploadedImage(image('a.svg', 'image/svg+xml', svg))),
				'utf8'
			);

		it('keeps drawing markup, including case-sensitive names', async () => {
			const svg =
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">' +
				'<defs><clipPath id="c"><rect width="1" height="1"></rect></clipPath>' +
				'<linearGradient id="g" gradientUnits="userSpaceOnUse"></linearGradient></defs>' +
				'<text x="1">Hi</text></svg>';

			expect(await saveSvg(svg)).toBe(svg);
		});

		it.each([
			['script elements', '<svg><script>alert(1)</script></svg>', /script|alert/i],
			['uppercase script elements', '<svg><SCRIPT>alert(1)</SCRIPT></svg>', /<script/i],
			[
				'event handlers',
				'<svg onload="alert(1)"><rect onclick="alert(1)"></rect></svg>',
				/on\w+=/i
			],
			['uppercase event handlers', '<svg ONLOAD="alert(1)"></svg>', /onload/i],
			['links', '<svg><a href="javascript:alert(1)"><text>x</text></a></svg>', /<a|href/i],
			['internal references', '<svg><use href="#shape"></use></svg>', /href/],
			['external references', '<svg><use href="https://x.test/a.svg#b"></use></svg>', /href/],
			['xlink references', '<svg><use xlink:href="https://x.test/a.svg#b"></use></svg>', /href/],
			[
				'embedded HTML',
				'<svg><foreignObject><iframe></iframe></foreignObject></svg>',
				/foreign|iframe/i
			],
			['style elements', '<svg><style>*{fill:url(https://x.test)}</style></svg>', /style|x\.test/i]
		])('removes %s', async (_name, svg, forbidden) => {
			expect(await saveSvg(svg)).not.toMatch(forbidden);
		});
	});
});

describe('POST /admin/upload', () => {
	const post = (fields: Record<string, string | File>) => {
		const body = new FormData();
		for (const [name, value] of Object.entries(fields)) body.set(name, value);
		const request = new Request('https://example.test/admin/upload', { method: 'POST', body });
		return uploadEndpoint({ request } as never) as Promise<Response>;
	};

	it('returns the public path of the saved image', async () => {
		const response = await post({ file: image() });

		expect(response.status).toBe(200);
		const { path: publicPath } = (await response.json()) as { path: string };
		expect(fs.existsSync(storedPath(publicPath))).toBe(true);
	});

	it('rejects a request without a file', async () => {
		const response = await post({ file: 'not a file' });

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'No file was uploaded.' });
	});

	it('explains why an upload was refused', async () => {
		const response = await post({ file: image('a.txt', 'text/plain') });

		expect(response.status).toBe(400);
		expect(((await response.json()) as { error: string }).error).toMatch(/Unsupported file type/);
	});

	it('hides internal failure details', async () => {
		vi.spyOn(fsPromises, 'writeFile').mockRejectedValue(new Error('EACCES: /secret/path'));

		const response = await post({ file: image() });

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ error: 'Upload failed.' });
	});
});

describe('GET /uploads/*', () => {
	const get = (file: string, headers: Record<string, string> = {}) =>
		outcome<Response>(() =>
			serveUpload({
				params: { path: file },
				request: new Request(`https://example.test/uploads/${file}`, { headers })
			} as never)
		);
	const responseFor = async (file: string, headers?: Record<string, string>) =>
		(await get(file, headers)).data;

	beforeEach(() => {
		fs.writeFileSync(path.join(uploadDir, 'a.png'), PNG_BYTES);
		fs.writeFileSync(path.join(uploadDir, 'a.svg'), '<svg></svg>');
	});

	it('streams the file with safe caching headers', async () => {
		const response = await responseFor('a.png');

		expect(response.status).toBe(200);
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(PNG_BYTES);
		expect(response.headers.get('Content-Type')).toBe('image/png');
		expect(response.headers.get('Content-Length')).toBe(String(PNG_BYTES.length));
		expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
		expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
		expect(response.headers.get('Content-Security-Policy')).toBeNull();
	});

	it('sandboxes SVG files so they cannot run in the site origin', async () => {
		const csp = (await responseFor('a.svg')).headers.get('Content-Security-Policy');

		expect(csp).toContain("default-src 'none'");
		expect(csp).toContain('sandbox');
	});

	it.each(['missing.png', '../a.png', 'notes.txt'])('returns 404 for %s', async (file) => {
		fs.writeFileSync(path.join(uploadDir, 'notes.txt'), 'private');
		expect(await get(file)).toMatchObject({ kind: 'error', status: 404 });
	});

	it('returns 404 for a directory, even one named like an image', async () => {
		fs.mkdirSync(path.join(uploadDir, 'folder.png'));
		expect(await get('folder.png')).toMatchObject({ kind: 'error', status: 404 });
	});

	it('answers 304 when the cached copy is current', async () => {
		const etag = (await responseFor('a.png')).headers.get('ETag') as string;

		for (const value of [etag, `W/${etag}`, `"other", ${etag}`]) {
			const response = await responseFor('a.png', { 'If-None-Match': value });
			expect(response.status).toBe(304);
			expect(await response.text()).toBe('');
		}
	});

	it('sends the file again when the cached copy is out of date', async () => {
		const response = await responseFor('a.png', { 'If-None-Match': '"stale"' });
		expect(response.status).toBe(200);
		await response.arrayBuffer();
	});
});
