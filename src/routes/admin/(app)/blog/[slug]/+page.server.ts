import { error, fail, redirect } from '@sveltejs/kit';
import { readContent, updateSection } from '$lib/server/content';
import sanitizeHtml from 'sanitize-html';
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
		const formData = await request.formData();

		const title = String(formData.get('title') ?? '').trim();
		const date = String(formData.get('date') ?? '').trim();
		const image = String(formData.get('image') ?? '').trim();
		const preview = String(formData.get('preview') ?? '').trim();
		const content = sanitizeHtml(String(formData.get('content') ?? '').trim());
		const draft = formData.get('draft') === 'on';

		if (!title) {
			return fail(400, {
				error: 'Title is required.',
				title,
				date,
				image,
				preview,
				content,
				draft
			});
		}

		const posts = readContent().blog.posts;
		const index = posts.findIndex((p) => p.slug === params.slug);

		if (index === -1) {
			error(404, 'Post not found');
		}

		const updated = [...posts];
		updated[index] = { ...updated[index], title, date, image, preview, content, draft };
		updateSection('blog', { posts: updated });

		redirect(303, '/admin/blog');
	},

	delete: async ({ params }) => {
		const posts = readContent().blog.posts.filter((p) => p.slug !== params.slug);
		updateSection('blog', { posts });

		redirect(303, '/admin/blog');
	}
};
