import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
const picture = (width: number, height: number) =>
	sharp({ create: { width, height, channels: 3, background: 'red' } });
const PNG_BYTES = new Uint8Array(await picture(4, 4).png().toBuffer());
const NOT_AN_IMAGE = new Uint8Array([1, 2, 3, 4]);

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
	it('stores a still image as WebP under a generated public name', async () => {
		const publicPath = await saveUploadedImage(image());

		expect(publicPath).toMatch(/^\/uploads\/\d+-[0-9a-f]{12}\.webp$/);
		expect((await sharp(storedPath(publicPath)).metadata()).format).toBe('webp');
	});

	it('shrinks large images without enlarging small ones', async () => {
		const stored = async (width: number, height: number) => {
			const content = new Uint8Array(await picture(width, height).jpeg().toBuffer());
			const publicPath = await saveUploadedImage(image('a.jpg', 'image/jpeg', content));
			return sharp(storedPath(publicPath)).metadata();
		};

		expect(await stored(3840, 1000)).toMatchObject({ width: 1920, height: 500 });
		expect(await stored(100, 50)).toMatchObject({ width: 100, height: 50 });
	});

	it('removes photo metadata', async () => {
		const withMetadata = await picture(4, 4)
			.withExif({ IFD0: { Copyright: 'private' } })
			.jpeg()
			.toBuffer();
		const publicPath = await saveUploadedImage(
			image('a.jpg', 'image/jpeg', new Uint8Array(withMetadata))
		);

		expect((await sharp(storedPath(publicPath)).metadata()).exif).toBeUndefined();
	});

	it('keeps an animated image as it is', async () => {
		const frame = (background: string) =>
			sharp({ create: { width: 4, height: 4, channels: 3, background } })
				.png()
				.toBuffer();
		const frames = await Promise.all([frame('red'), frame('blue')]);
		const animated = new Uint8Array(
			await sharp(frames, { join: { animated: true } })
				.gif()
				.toBuffer()
		);

		const publicPath = await saveUploadedImage(image('a.gif', 'image/gif', animated));

		expect(path.extname(publicPath)).toBe('.gif');
		expect(new Uint8Array(fs.readFileSync(storedPath(publicPath)))).toEqual(animated);
	});

	it('rejects a file that is not really an image', async () => {
		await expect(saveUploadedImage(image('a.png', 'image/png', NOT_AN_IMAGE))).rejects.toThrow(
			'could not be read'
		);
		expect(fs.readdirSync(uploadDir)).toEqual([]);
	});

	it('never overwrites an earlier upload of the same file', async () => {
		expect(await saveUploadedImage(image())).not.toBe(await saveUploadedImage(image()));
	});

	it('names files itself, ignoring the client file name', async () => {
		const publicPath = await saveUploadedImage(image('../../evil.html'));
		expect(path.extname(publicPath)).toBe('.webp');
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

		await expect(saveUploadedImage(atLimit)).rejects.toThrow('could not be read');
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
				'<text x="1">Hi\u00a0there</text></svg>';

			expect(await saveSvg(svg)).toBe(
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">' +
					'<defs><clipPath id="c"><rect width="1" height="1"/></clipPath>' +
					'<linearGradient id="g" gradientUnits="userSpaceOnUse"/></defs>' +
					'<text x="1">Hi\u00a0there</text></svg>'
			);
		});

		it('adds the SVG namespace so the file renders on its own', async () => {
			expect(await saveSvg('<svg><rect width="1"></rect></svg>')).toBe(
				'<svg xmlns="http://www.w3.org/2000/svg"><rect width="1"/></svg>'
			);
		});

		it('rejects files that are not SVG images', async () => {
			await expect(
				saveUploadedImage(image('a.svg', 'image/svg+xml', '<p>not a drawing</p>'))
			).rejects.toThrow('could not be read as an SVG image');
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
			['script links', '<svg><a href="javascript:alert(1)"><text>x</text></a></svg>', /href/i],
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
