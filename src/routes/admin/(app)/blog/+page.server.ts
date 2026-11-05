import { fail } from '@sveltejs/kit';
import { readContent, updateSection, getHeadlineForPage } from '#lib/server/content.js';
import { saveHeadlineAction } from '#lib/server/headlineAction.js';
import { text } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const posts = readContent().blog.posts;
	const { headline, subtitle } = getHeadlineForPage('blog');
	return { posts, headline, subtitle };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const slug = text((await request.formData()).get('slug'));

		if (!slug) {
			return fail(400, { error: 'Missing post slug.' });
		}

		const posts = readContent().blog.posts.filter((post) => post.slug !== slug);
		updateSection('blog', { posts });

		return { success: true };
	},
	saveHeadline: saveHeadlineAction('blog')
};
