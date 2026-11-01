import { readContent } from '$lib/server/content';
import type { PageServerLoad } from './$types';

function truncate(text: string, max: number): string {
	const clean = text.trim();
	if (clean.length <= max) return clean;
	return clean.slice(0, max).trimEnd() + '…';
}

export const load: PageServerLoad = () => {
	const { home, blog, works } = readContent();
	const featuredPosts = home.featuredPosts
		.map((slug) => blog.posts.find((p) => p.slug === slug && !p.draft))
		.filter((p) => !!p)
		.map((p) => ({
			slug: p.slug,
			image: p.image,
			title: truncate(p.title, 100),
			date: p.date,
			preview: truncate(p.preview, 200)
		}));
	const featuredWorks = home.featuredWorks
		.map((id) => works.items.find((w) => w.id === id))
		.filter((w) => !!w)
		.map((w) => ({
			id: w.id,
			image: w.image,
			title: truncate(w.title, 100),
			description: truncate(w.description, 200)
		}));
	return { home, featuredPosts, featuredWorks };
};
