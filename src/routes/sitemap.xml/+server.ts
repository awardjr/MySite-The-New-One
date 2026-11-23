import { Readable } from 'node:stream';
import { isValid, parseISO } from 'date-fns';
import { SitemapStream, streamToPromise } from 'sitemap';
import { getPublishedPosts, getSectionsWithContent } from '#lib/server/content.js';
import { siteOrigin } from '#lib/server/origin.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const sections = Object.entries(getSectionsWithContent())
		.filter(([, hasContent]) => hasContent)
		.map(([section]) => ({ url: `/${section}` }));
	const posts = getPublishedPosts().map(({ slug, date }) => ({
		url: `/blog/${encodeURIComponent(slug)}`,
		...(isValid(parseISO(`${date}T00:00:00Z`)) && { lastmod: date })
	}));
	const sitemap = new SitemapStream({
		hostname: siteOrigin(url),
		lastmodDateOnly: true,
		xmlns: { news: false, xhtml: false, image: false, video: false }
	});
	const links = [{ url: '/' }, ...sections, ...posts, { url: '/privacy' }];
	const xml = await streamToPromise(Readable.from(links).pipe(sitemap));
	return new Response(xml.toString(), {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' }
	});
};
