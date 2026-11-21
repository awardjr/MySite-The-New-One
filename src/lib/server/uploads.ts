import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sanitizeHtml from 'sanitize-html';
import sharp from 'sharp';
import { UPLOAD_IMAGE_TYPES } from '../imageTypes';

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'static', 'uploads');
const PUBLIC_PREFIX = '/uploads/';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_IMAGE_WIDTH = 1920;

const EXTENSION_TO_MIME: Record<string, string> = {
	...Object.fromEntries(
		Object.entries(UPLOAD_IMAGE_TYPES).map(([mime, extension]) => [extension, mime])
	),
	jpeg: 'image/jpeg'
};

export class UploadError extends Error {}

// Maps a requested /uploads/<path> to a file inside the upload dir. Returns null
// for anything that escapes the directory or isn't an allowlisted image type.
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

// SVG is XML and can carry <script> tags or on* event handlers, so any
// uploaded SVG is run through a strict allowlist before it's written to
// static/uploads/, which is served from the same origin.
const svgSanitizeOptions: sanitizeHtml.IOptions = {
	allowedTags: (
		'svg g path circle ellipse line polyline polygon rect text tspan defs clipPath ' +
		'linearGradient radialGradient stop title desc use symbol mask pattern'
	).split(' '),
	allowedAttributes: {
		'*': (
			'id class viewBox width height fill fill-rule fill-opacity stroke stroke-width ' +
			'stroke-linecap stroke-linejoin stroke-opacity clip-rule opacity transform d cx cy r ' +
			'rx ry x y x1 x2 y1 y2 points offset stop-color stop-opacity gradientUnits ' +
			'gradientTransform preserveAspectRatio xmlns'
		).split(' ')
	},
	// No href/xlink:href support at all, which also removes any javascript: URI vector.
	allowedSchemes: [],
	allowVulnerableTags: false,
	// SVG names are case-sensitive; the default HTML parsing lowercases them, which would
	// strip camelCase entries like viewBox or clipPath from the allowlist above.
	parser: { lowerCaseTags: false, lowerCaseAttributeNames: false }
};

/** The image formats sharp can report for an upload, with the extension each is stored under. */
const RASTER_EXTENSIONS: Record<string, string> = {
	jpeg: 'jpg',
	png: 'png',
	webp: 'webp',
	gif: 'gif'
};

/**
 * Prepares a photo or graphic for the web: checks it really is an image, then stores a still
 * image as a resized WebP without its metadata (which can include where a photo was taken).
 * Animated images are kept as they are, because converting them would lose quality or motion.
 */
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
			// PNGs are often logos or screenshots, where lossy compression blurs edges and text.
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
			? { data: Buffer.from(sanitizeHtml(buffer.toString('utf-8'), svgSanitizeOptions)), extension }
			: await optimizeRasterImage(buffer);

	const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${prepared.extension}`;
	await fs.writeFile(path.join(UPLOAD_DIR, filename), prepared.data);

	return `${PUBLIC_PREFIX}${filename}`;
}
