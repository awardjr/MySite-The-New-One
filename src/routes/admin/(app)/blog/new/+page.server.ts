import { fail, redirect } from '@sveltejs/kit';
import { readContent, updateSection, type Post } from '$lib/server/content';
import type { Actions } from './$types';

function slugify(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const title = String(formData.get('title') ?? '').trim();
		const slugInput = String(formData.get('slug') ?? '').trim();
		const date = String(formData.get('date') ?? '').trim();
		const image = String(formData.get('image') ?? '').trim();
		const preview = String(formData.get('preview') ?? '').trim();
		const content = String(formData.get('content') ?? '').trim();

		if (!title) {
			return fail(400, { error: 'Title is required.', title, slug: slugInput, date, image, preview, content });
		}

		const slug = slugify(slugInput || title);

		if (!slug) {
			return fail(400, { error: 'Slug is required.', title, slug: slugInput, date, image, preview, content });
		}

		const posts = readContent().blog.posts;

		if (posts.some((post) => post.slug === slug)) {
			return fail(400, {
				error: 'A post with this slug already exists.',
				title,
				slug: slugInput,
				date,
				image,
				preview,
				content
			});
		}

		const newPost: Post = { slug, title, date, image, preview, content };
		updateSection('blog', { posts: [...posts, newPost] });

		redirect(303, '/admin/blog');
	}
};
