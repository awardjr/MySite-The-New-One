import fs from 'node:fs/promises';
import { error } from '@sveltejs/kit';
import { resolveUploadPath } from '$lib/server/uploads';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const resolved = resolveUploadPath(params.path);
	if (!resolved) {
		error(404, 'Not found');
	}

	let body: Buffer;
	try {
		const stat = await fs.stat(resolved.filePath);
		if (!stat.isFile()) {
			error(404, 'Not found');
		}
		body = await fs.readFile(resolved.filePath);
	} catch {
		error(404, 'Not found');
	}

	const headers: Record<string, string> = {
		'Content-Type': resolved.contentType,
		'Content-Length': String(body.length),
		'Cache-Control': 'public, max-age=31536000, immutable',
		'X-Content-Type-Options': 'nosniff'
	};
	if (resolved.contentType === 'image/svg+xml') {
		headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
	}

	return new Response(new Uint8Array(body), { headers });
};
