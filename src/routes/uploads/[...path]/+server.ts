import fs from 'node:fs/promises';
import { error } from '@sveltejs/kit';
import { resolveUploadPath } from '$lib/server/uploads';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const resolved = resolveUploadPath(params.path);
	// readFile also fails for directories (EISDIR), so no separate stat is needed.
	const body = resolved ? await fs.readFile(resolved.filePath).catch(() => null) : null;
	if (!resolved || !body) {
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
