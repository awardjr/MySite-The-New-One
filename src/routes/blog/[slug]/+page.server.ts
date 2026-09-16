import { error } from '@sveltejs/kit';
import { readContent } from '$lib/server/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, locals }) => {
	const post = readContent().blog.posts.find((p) => p.slug === params.slug);

	// Draft posts are only visible to the logged-in admin, so they can be previewed
	// before publishing without being reachable by the public.
	if (!post || (post.draft && !locals.isAdmin)) {
		error(404, 'Post not found');
	}

	return { post };
};
