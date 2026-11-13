import { fail, redirect } from '@sveltejs/kit';
import { createPost } from '#lib/server/content.js';
import { text } from '#lib/server/forms.js';
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

		if (!createPost({ slug, ...fields })) {
			return invalid('A post with this slug already exists.');
		}

		redirect(303, '/admin/blog');
	}
};
