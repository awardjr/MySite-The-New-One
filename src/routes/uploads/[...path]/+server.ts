import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import { Readable } from 'node:stream';
import { error } from '@sveltejs/kit';
import etag from 'etag';
import fresh from 'fresh';
import { resolveUploadPath } from '#lib/server/uploads.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, request }) => {
	const resolved = resolveUploadPath(params.path);
	const stats = resolved ? await fs.stat(resolved.filePath).catch(() => null) : null;
	if (!resolved || !stats?.isFile()) {
		error(404, 'Not found');
	}

	const headers: Record<string, string> = {
		'Content-Type': resolved.contentType,
		'Cache-Control': 'public, max-age=31536000, immutable',
		ETag: etag(stats, { weak: false }),
		'Last-Modified': stats.mtime.toUTCString(),
		'X-Content-Type-Options': 'nosniff'
	};
	if (resolved.contentType === 'image/svg+xml') {
		headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
	}

	if (
		fresh(Object.fromEntries(request.headers), {
			etag: headers.ETag,
			'last-modified': headers['Last-Modified']
		})
	) {
		return new Response(null, { status: 304, headers });
	}

	const body = Readable.toWeb(createReadStream(resolved.filePath)) as ReadableStream<Uint8Array>;
	return new Response(body, {
		headers: { ...headers, 'Content-Length': String(stats.size) }
	});
};
