import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sanitizeHtml from 'sanitize-html';

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'static', 'uploads');
const PUBLIC_PREFIX = '/uploads/';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TO_EXTENSION: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/gif': 'gif',
	'image/webp': 'webp',
	'image/svg+xml': 'svg'
};

export const EXTENSION_TO_MIME: Record<string, string> = {
	...Object.fromEntries(
		Object.entries(ALLOWED_MIME_TO_EXTENSION).map(([mime, extension]) => [extension, mime])
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
	allowedTags: [
		'svg',
		'g',
		'path',
		'circle',
		'ellipse',
		'line',
		'polyline',
		'polygon',
		'rect',
		'text',
		'tspan',
		'defs',
		'clipPath',
		'linearGradient',
		'radialGradient',
		'stop',
		'title',
		'desc',
		'use',
		'symbol',
		'mask',
		'pattern'
	],
	allowedAttributes: {
		'*': [
			'id',
			'class',
			'viewBox',
			'width',
			'height',
			'fill',
			'fill-rule',
			'fill-opacity',
			'stroke',
			'stroke-width',
			'stroke-linecap',
			'stroke-linejoin',
			'stroke-opacity',
			'clip-rule',
			'opacity',
			'transform',
			'd',
			'cx',
			'cy',
			'r',
			'rx',
			'ry',
			'x',
			'y',
			'x1',
			'x2',
			'y1',
			'y2',
			'points',
			'offset',
			'stop-color',
			'stop-opacity',
			'gradientUnits',
			'gradientTransform',
			'preserveAspectRatio',
			'xmlns'
		]
	},
	// No href/xlink:href support at all, which also removes any javascript: URI vector.
	allowedSchemes: [],
	allowVulnerableTags: false
};

function sanitizeSvg(raw: string): string {
	return sanitizeHtml(raw, svgSanitizeOptions);
}

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
	const finalBuffer =
		file.type === 'image/svg+xml' ? Buffer.from(sanitizeSvg(buffer.toString('utf-8'))) : buffer;
	await fs.writeFile(filePath, finalBuffer);

	return `${PUBLIC_PREFIX}${filename}`;
}
