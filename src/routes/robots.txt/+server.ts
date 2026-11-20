import { siteOrigin } from '#lib/server/origin.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const body = `User-agent: *
Disallow: /admin

Sitemap: ${siteOrigin(url)}/sitemap.xml
`;
	return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
