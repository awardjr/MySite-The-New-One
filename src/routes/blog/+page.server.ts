import { getPublishedPosts, getHeadlineForPage } from '#lib/server/content.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const posts = getPublishedPosts().map(({ slug, title, date, image, preview }) => ({
		slug,
		title,
		date,
		image,
		preview
	}));
	return { posts, ...getHeadlineForPage('blog') };
};
