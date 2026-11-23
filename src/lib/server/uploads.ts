import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';
import { UPLOAD_IMAGE_TYPES } from '../imageTypes';
import { IMAGE_WIDTHS, MAX_IMAGE_WIDTH, uploadedImageName } from '../responsiveImage';

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'static', 'uploads');
const PUBLIC_PREFIX = '/uploads/';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

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

const RASTER_FORMATS = new Set(['jpeg', 'png', 'webp', 'gif']);

type ImageSize = { width: number; data: Buffer };

async function webpSizes(input: Buffer): Promise<ImageSize[]> {
	const metadata = await sharp(input)
		.metadata()
		.catch(() => null);
	if (!metadata || !RASTER_FORMATS.has(metadata.format)) {
		throw new UploadError('That file could not be read as an image.');
	}

	const animated = (metadata.pages ?? 1) > 1;
	const source = sharp(input, { animated });
	if (!animated) source.rotate();
	const options = metadata.format === 'png' ? { nearLossless: true } : { quality: 82 };
	const encode = async (width: number): Promise<ImageSize> => {
		const { data, info } = await source
			.clone()
			.resize({ width, withoutEnlargement: true })
			.webp(options)
			.toBuffer({ resolveWithObject: true });
		return { width: info.width, data };
	};

	try {
		const full = await encode(MAX_IMAGE_WIDTH);
		const smaller = IMAGE_WIDTHS.filter((width) => width < full.width);
		return [full, ...(await Promise.all(smaller.map(encode)))];
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
	const id = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;

	if (file.type === 'image/svg+xml') {
		const filename = `${id}.${extension}`;
		await fs.writeFile(path.join(UPLOAD_DIR, filename), sanitizeSvg(buffer));
		return `${PUBLIC_PREFIX}${filename}`;
	}

	const sizes = await webpSizes(buffer);
	await Promise.all(
		sizes.map(({ width, data }) =>
			fs.writeFile(path.join(UPLOAD_DIR, uploadedImageName(id, width)), data)
		)
	);
	return `${PUBLIC_PREFIX}${uploadedImageName(id, sizes[0].width)}`;
}
