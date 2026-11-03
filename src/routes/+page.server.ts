import { readContent } from '#lib/server/content.js';
import type { PageServerLoad } from './$types';

function truncate(text: string, max: number): string {
	const clean = text.trim();
	if (clean.length <= max) return clean;
	return clean.slice(0, max).trimEnd() + '…';
}

export const load: PageServerLoad = () => {
	const { home, blog, works } = readContent();
	const { name, tagline, photoSrc, introParagraphs } = home;

	const postsBySlug = new Map(blog.posts.filter((p) => !p.draft).map((p) => [p.slug, p]));
	const worksById = new Map(works.items.map((w) => [w.id, w]));

	const featuredPosts = home.featuredPosts
		.map((slug) => postsBySlug.get(slug))
		.filter((p) => !!p)
		.map((p) => ({
			slug: p.slug,
			image: p.image,
			title: truncate(p.title, 100),
			date: p.date,
			preview: truncate(p.preview, 200)
		}));
	const featuredWorks = home.featuredWorks
		.map((id) => worksById.get(id))
		.filter((w) => !!w)
		.map((w) => ({
			id: w.id,
			image: w.image,
			title: truncate(w.title, 100),
			description: truncate(w.description, 200)
		}));

	return { home: { name, tagline, photoSrc, introParagraphs }, featuredPosts, featuredWorks };
};
