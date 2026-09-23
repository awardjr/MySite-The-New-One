import { error, fail, redirect } from '@sveltejs/kit';
import { readContent, updateSection } from '$lib/server/content';
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

		const posts = readContent().blog.posts;
		const index = posts.findIndex((p) => p.slug === params.slug);

		if (index === -1) {
			error(404, 'Post not found');
		}

		const updated = [...posts];
		updated[index] = { ...updated[index], ...fields };
		updateSection('blog', { posts: updated });

		redirect(303, '/admin/blog');
	},

	delete: async ({ params }) => {
		const posts = readContent().blog.posts.filter((p) => p.slug !== params.slug);
		updateSection('blog', { posts });

		redirect(303, '/admin/blog');
	}
};
