// Filesystem-backed image uploads for the /admin CMS area.
//
// Uploaded files are written directly into `static/uploads/` so they're
// served by SvelteKit like any other static asset, at `/uploads/<filename>`.
// This means uploads live on disk next to the app (no external storage/CDN),
// which matches the site's existing "filesystem storage is fine" approach
// used for the SQLite content database.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_DIR = path.join(process.cwd(), 'static', 'uploads');
const PUBLIC_PREFIX = '/uploads/';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TO_EXTENSION: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/gif': 'gif',
	'image/webp': 'webp',
	'image/svg+xml': 'svg'
};

export class UploadError extends Error {}

/** Saves an uploaded image file to disk and returns its public path (e.g. `/uploads/xyz.png`). */
export async function saveUploadedImage(file: File): Promise<string> {
	if (!(file instanceof File) || file.size === 0) {
		throw new UploadError('No file was uploaded.');
	}
	if (file.size > MAX_FILE_SIZE_BYTES) {
		throw new UploadError('Image is too large (max 5 MB).');
	}

	const extension = ALLOWED_MIME_TO_EXTENSION[file.type];
	if (!extension) {
		throw new UploadError(
			'Unsupported file type. Please upload a JPEG, PNG, GIF, WebP, or SVG image.'
		);
	}

	await fs.mkdir(UPLOAD_DIR, { recursive: true });

	const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${extension}`;
	const filePath = path.join(UPLOAD_DIR, filename);

	const buffer = Buffer.from(await file.arrayBuffer());
	await fs.writeFile(filePath, buffer);

	return `${PUBLIC_PREFIX}${filename}`;
}
