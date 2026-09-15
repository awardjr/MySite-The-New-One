import { error } from '@sveltejs/kit';
import { readContent } from '$lib/server/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const post = readContent().blog.posts.find((p) => p.slug === params.slug);

	if (!post) {
		error(404, 'Post not found');
	}

	return { post };
};
