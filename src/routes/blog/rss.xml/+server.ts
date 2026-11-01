import { readContent } from '$lib/server/content';
import type { RequestHandler } from './$types';

function esc(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export const GET: RequestHandler = ({ url }) => {
	const { blog, home } = readContent();
	const posts = blog.posts.filter((p) => !p.draft);
	const items = posts
		.map((p) => {
			const link = `${url.origin}/blog/${encodeURIComponent(p.slug)}`;
			const time = Date.parse(p.date);
			return `<item>
<title>${esc(p.title)}</title>
<link>${link}</link>
<guid isPermaLink="true">${link}</guid>
${Number.isNaN(time) ? '' : `<pubDate>${new Date(time).toUTCString()}</pubDate>\n`}<description>${esc(p.preview)}</description>
</item>`;
		})
		.join('\n');
	const title = home.name ? `${home.name} – Blog` : 'Blog';
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(title)}</title>
<link>${url.origin}/blog</link>
<description>${esc(title)} blog posts</description>
<atom:link href="${url.origin}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
</channel>
</rss>`;
	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' }
	});
};
