import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';
import { UPLOAD_IMAGE_TYPES } from '../imageTypes';

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'static', 'uploads');
const PUBLIC_PREFIX = '/uploads/';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1920;

const EXTENSION_TO_MIME: Record<string, string> = {
	...Object.fromEntries(
		Object.entries(UPLOAD_IMAGE_TYPES).map(([mime, extension]) => [extension, mime])
	),
	jpeg: 'image/jpeg'
};

export class UploadError extends Error {}

export function resolveUploadPath(
	requestedPath: string,
	baseDir: string = UPLOAD_DIR
): { filePath: string; contentType: string } | null {
	if (!requestedPath || requestedPath.includes('\0') || path.isAbsolute(requestedPath)) {
		return null;
	}

	const root = path.resolve(baseDir);
	const filePath = path.resolve(root, requestedPath);
	const relative = path.relative(root, filePath);
	if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
		return null;
	}

	const extension = path.extname(filePath).slice(1).toLowerCase();
	const contentType = EXTENSION_TO_MIME[extension];
	if (!contentType) {
		return null;
	}

	return { filePath, contentType };
}

const { window } = new JSDOM('');
const purify = createDOMPurify(window);
const xmlSerializer = new window.XMLSerializer();

function sanitizeSvg(input: Buffer): Buffer {
	const fragment = purify.sanitize(input.toString('utf-8'), {
		USE_PROFILES: { svg: true, svgFilters: true },
		FORBID_TAGS: ['style'],
		FORBID_ATTR: ['style'],
		RETURN_DOM_FRAGMENT: true
	});
	const svg = fragment.firstElementChild;
	if (svg?.localName !== 'svg') {
		throw new UploadError('That file could not be read as an SVG image.');
	}
	return Buffer.from(xmlSerializer.serializeToString(svg));
}

const RASTER_EXTENSIONS: Record<string, string> = {
	jpeg: 'jpg',
	png: 'png',
	webp: 'webp',
	gif: 'gif'
};

async function optimizeRasterImage(input: Buffer): Promise<{ data: Buffer; extension: string }> {
	const metadata = await sharp(input)
		.metadata()
		.catch(() => null);
	const originalExtension = metadata && RASTER_EXTENSIONS[metadata.format];
	if (!originalExtension) {
		throw new UploadError('That file could not be read as an image.');
	}
	if ((metadata.pages ?? 1) > 1) {
		return { data: input, extension: originalExtension };
	}

	try {
		const data = await sharp(input)
			.rotate()
			.resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
			.webp(metadata.format === 'png' ? { nearLossless: true } : { quality: 82 })
			.toBuffer();
		return { data, extension: 'webp' };
	} catch {
		throw new UploadError('That file could not be read as an image.');
	}
}

export async function saveUploadedImage(file: File): Promise<string> {
	if (!(file instanceof File) || file.size === 0) {
		throw new UploadError('No file was uploaded.');
	}
	if (file.size > MAX_FILE_SIZE_BYTES) {
		throw new UploadError('Image is too large (max 5 MB).');
	}

	const extension = UPLOAD_IMAGE_TYPES[file.type];
	if (!extension) {
		throw new UploadError(
			'Unsupported file type. Please upload a JPEG, PNG, GIF, WebP, or SVG image.'
		);
	}

	await fs.mkdir(UPLOAD_DIR, { recursive: true });

	const buffer = Buffer.from(await file.arrayBuffer());
	const prepared =
		file.type === 'image/svg+xml'
			? { data: sanitizeSvg(buffer), extension }
			: await optimizeRasterImage(buffer);

	const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${prepared.extension}`;
	await fs.writeFile(path.join(UPLOAD_DIR, filename), prepared.data);

	return `${PUBLIC_PREFIX}${filename}`;
}
