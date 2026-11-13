import { error, fail, redirect } from '@sveltejs/kit';
import { deletePost, readContent, updatePost } from '#lib/server/content.js';
import { readPostFields } from '../postForm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const post = readContent().blog.posts.find((p) => p.slug === params.slug);

	if (!post) {
		error(404, 'Post not found');
	}

	return { post };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const fields = readPostFields(await request.formData());

		if (!fields.title) {
			return fail(400, { error: 'Title is required.', ...fields });
		}

		if (!updatePost(params.slug, fields)) {
			error(404, 'Post not found');
		}

		redirect(303, '/admin/blog');
	},

	delete: async ({ params }) => {
		deletePost(params.slug);

		redirect(303, '/admin/blog');
	}
};
