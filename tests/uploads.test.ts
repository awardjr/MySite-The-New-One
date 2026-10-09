import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveUploadPath } from '$lib/server/uploads.ts';

const BASE = path.resolve('/srv/uploads');

describe('resolveUploadPath', () => {
	it('resolves an allowlisted image inside the upload dir', () => {
		expect(resolveUploadPath('123-abc.webp', BASE)).toEqual({
			filePath: path.join(BASE, '123-abc.webp'),
			contentType: 'image/webp'
		});
	});

	it('maps every allowed extension to its MIME type', () => {
		expect(resolveUploadPath('a.jpg', BASE)?.contentType).toBe('image/jpeg');
		expect(resolveUploadPath('a.JPEG', BASE)?.contentType).toBe('image/jpeg');
		expect(resolveUploadPath('a.png', BASE)?.contentType).toBe('image/png');
		expect(resolveUploadPath('a.gif', BASE)?.contentType).toBe('image/gif');
		expect(resolveUploadPath('a.svg', BASE)?.contentType).toBe('image/svg+xml');
	});

	it('rejects non-image extensions', () => {
		expect(resolveUploadPath('cms.sqlite3', BASE)).toBeNull();
		expect(resolveUploadPath('page.html', BASE)).toBeNull();
		expect(resolveUploadPath('noextension', BASE)).toBeNull();
	});

	it('rejects traversal out of the upload dir', () => {
		expect(resolveUploadPath('../data/cms.sqlite3', BASE)).toBeNull();
		expect(resolveUploadPath('../secret.png', BASE)).toBeNull();
		expect(resolveUploadPath('a/../../secret.png', BASE)).toBeNull();
		expect(resolveUploadPath('..', BASE)).toBeNull();
	});

	it('rejects absolute paths, empty paths and null bytes', () => {
		expect(resolveUploadPath('/etc/passwd.png', BASE)).toBeNull();
		expect(resolveUploadPath('', BASE)).toBeNull();
		expect(resolveUploadPath('a.png\0.txt', BASE)).toBeNull();
	});
});
