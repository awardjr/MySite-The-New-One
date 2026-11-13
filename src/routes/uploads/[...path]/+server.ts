import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import { Readable } from 'node:stream';
import { error } from '@sveltejs/kit';
import { resolveUploadPath } from '#lib/server/uploads.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, request }) => {
	const resolved = resolveUploadPath(params.path);
	const stats = resolved ? await fs.stat(resolved.filePath).catch(() => null) : null;
	if (!resolved || !stats?.isFile()) {
		error(404, 'Not found');
	}

	// Upload names are unique and never rewritten, so size and modification time identify the file.
	const etag = `"${stats.size.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}"`;
	const headers: Record<string, string> = {
		'Content-Type': resolved.contentType,
		'Cache-Control': 'public, max-age=31536000, immutable',
		ETag: etag,
		'Last-Modified': stats.mtime.toUTCString(),
		'X-Content-Type-Options': 'nosniff'
	};
	if (resolved.contentType === 'image/svg+xml') {
		headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
	}

	const cachedEtags = request.headers.get('if-none-match')?.split(',') ?? [];
	if (cachedEtags.some((cached) => cached.trim().replace(/^W\//, '') === etag)) {
		return new Response(null, { status: 304, headers });
	}

	// Stream the file instead of buffering it, so a large image never sits fully in memory.
	const body = Readable.toWeb(createReadStream(resolved.filePath)) as ReadableStream<Uint8Array>;
	return new Response(body, {
		headers: { ...headers, 'Content-Length': String(stats.size) }
	});
};
