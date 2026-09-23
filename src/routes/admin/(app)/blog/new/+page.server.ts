import { fail, redirect } from '@sveltejs/kit';
import { readContent, updateSection, type Post } from '$lib/server/content';
import { text } from '$lib/server/forms';
import { readPostFields } from '../postForm';
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
		const fields = readPostFields(formData);
		const slugInput = text(formData.get('slug'));
		const invalid = (message: string) => fail(400, { error: message, slug: slugInput, ...fields });

		if (!fields.title) {
			return invalid('Title is required.');
		}

		const slug = slugify(slugInput || fields.title);

		if (!slug) {
			return invalid('Slug is required.');
		}

		const posts = readContent().blog.posts;

		if (posts.some((post) => post.slug === slug)) {
			return invalid('A post with this slug already exists.');
		}

		const newPost: Post = { slug, ...fields };
		updateSection('blog', { posts: [...posts, newPost] });

		redirect(303, '/admin/blog');
	}
};
