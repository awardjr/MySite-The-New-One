import { getPublishedPosts, getSectionsWithContent } from '#lib/server/content.js';
import { siteOrigin } from '#lib/server/origin.js';
import type { RequestHandler } from './$types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const GET: RequestHandler = ({ url }) => {
	const origin = siteOrigin(url);
	const sections = Object.entries(getSectionsWithContent())
		.filter(([, hasContent]) => hasContent)
		.map(([section]) => `<url><loc>${origin}/${section}</loc></url>`);
	const posts = getPublishedPosts().map(({ slug, date }) => {
		const lastModified = ISO_DATE.test(date) ? `<lastmod>${date}</lastmod>` : '';
		return `<url><loc>${origin}/blog/${encodeURIComponent(slug)}</loc>${lastModified}</url>`;
	});

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${origin}/</loc></url>
${[...sections, ...posts].join('\n')}
<url><loc>${origin}/privacy</loc></url>
</urlset>`;
	return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
