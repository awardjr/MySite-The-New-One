import { fail } from '@sveltejs/kit';
import { readContent, updateSection, getHeadlineForPage } from '#lib/server/content.js';
import { getPageHeadlines, setPageHeadlines } from '#lib/server/content/pageheadlines.js';
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
	saveHeadline: async ({ request }) => {
		const formData = await request.formData();
		const headline = text(formData.get('headline'));
		const subtitle = text(formData.get('subtitle'));

		const allHeadlines = getPageHeadlines();
		const updatedHeadlines = { ...allHeadlines };
		const blogIndex = updatedHeadlines.items.findIndex((item) => item.page === 'blog');
		if (blogIndex >= 0) {
			updatedHeadlines.items[blogIndex] = { page: 'blog', headline, subtitle };
		} else {
			updatedHeadlines.items.push({ page: 'blog', headline, subtitle });
		}
		setPageHeadlines(updatedHeadlines);

		return { headlineSuccess: true };
	}
};
