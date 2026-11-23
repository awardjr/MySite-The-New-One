import { isValid, parseISO } from 'date-fns';
import { Feed } from 'feed';
import { getPublishedPosts, readContent } from '#lib/server/content.js';
import { siteOrigin } from '#lib/server/origin.js';
import type { RequestHandler } from './$types';

type FeedItem = Parameters<Feed['addItem']>[0];

function cdataSafe(text: string): string {
	return text.replaceAll(']]>', ']] >');
}

export const GET: RequestHandler = ({ url }) => {
	const origin = siteOrigin(url);
	const { home } = readContent();
	const title = home.name ? `${home.name} – Blog` : 'Blog';
	const feed = new Feed({
		title,
		id: `${origin}/blog`,
		link: `${origin}/blog`,
		description: `${title} blog posts`,
		feedLinks: { rss: `${origin}/blog/rss.xml` },
		generator: false
	});
	for (const post of getPublishedPosts()) {
		const date = parseISO(`${post.date}T00:00:00Z`);
		const item: Omit<FeedItem, 'date'> & { date?: Date } = {
			title: cdataSafe(post.title),
			link: `${origin}/blog/${encodeURIComponent(post.slug)}`,
			description: cdataSafe(post.preview),
			date: isValid(date) ? date : undefined
		};
		feed.addItem(item as FeedItem);
	}
	return new Response(feed.rss2(), {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' }
	});
};
