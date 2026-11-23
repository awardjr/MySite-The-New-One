import { getPublishedPosts, getHeadlineForPage } from '#lib/server/content.js';
import { formatDate } from '#lib/server/formatDate.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const posts = getPublishedPosts().map(({ slug, title, date, image, preview }) => ({
		slug,
		title,
		date: formatDate(date),
		image,
		preview
	}));
	return { posts, ...getHeadlineForPage('blog') };
};
