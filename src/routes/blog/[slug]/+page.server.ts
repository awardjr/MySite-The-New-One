import { error } from '@sveltejs/kit';
import { readContent, renderPostHtml } from '#lib/server/content.js';
import { formatDate } from '#lib/server/formatDate.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, locals, url }) => {
	const post = readContent().blog.find((p) => p.slug === params.slug);

	if (!post || (post.draft && !locals.isAdmin)) {
		error(404, 'Post not found');
	}

	return {
		post: {
			...post,
			displayDate: formatDate(post.date),
			content: renderPostHtml(post.content, url.hostname)
		}
	};
};
