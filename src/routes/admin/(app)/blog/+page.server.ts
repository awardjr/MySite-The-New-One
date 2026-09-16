import { fail } from '@sveltejs/kit';
import { readContent, updateSection } from '$lib/server/content';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { posts: readContent().blog.posts };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const formData = await request.formData();
		const slug = String(formData.get('slug') ?? '').trim();

		if (!slug) {
			return fail(400, { error: 'Missing post slug.' });
		}

		const posts = readContent().blog.posts.filter((post) => post.slug !== slug);
		updateSection('blog', { posts });

		return { success: true };
	}
};
