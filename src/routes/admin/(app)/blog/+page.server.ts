import { fail } from '@sveltejs/kit';
import { deletePost, readContent, getHeadlineForPage } from '#lib/server/content.js';
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

		deletePost(slug);

		return { success: true };
	},
	saveHeadline: saveHeadlineAction('blog')
};
