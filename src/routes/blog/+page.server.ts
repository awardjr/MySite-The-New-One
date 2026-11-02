import { readContent } from '$lib/server/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	// Only send what the cards render; the full post HTML stays on the post page.
	const posts = readContent()
		.blog.posts.filter((post) => !post.draft)
		.map(({ slug, title, date, image, preview }) => ({ slug, title, date, image, preview }));
	return { posts };
};
