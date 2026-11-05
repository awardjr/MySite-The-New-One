import { fail } from '@sveltejs/kit';
import { readContent, updateSection, getHeadlineForPage } from '#lib/server/content.js';
import { saveHeadlineAction } from '#lib/server/headlineAction.js';
import { text } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const { home, blog, works } = readContent();
	const { headline } = getHeadlineForPage('home');
	return {
		home,
		headline,
		posts: blog.posts.map((p) => ({
			slug: p.slug,
			title: p.title,
			draft: p.draft,
			image: p.image
		})),
		works: works.items.map((w) => ({ id: w.id, title: w.title, image: w.image }))
	};
};

export const actions: Actions = {
	saveHeadline: saveHeadlineAction('home', { subtitle: false }),
	default: async ({ request }) => {
		const formData = await request.formData();

		const name = text(formData.get('name'));
		const tagline = text(formData.get('tagline'));
		const photoSrc = text(formData.get('photoSrc'));
		const introParagraphs = String(formData.get('introParagraphs') ?? '')
			.split(/\n\s*\n/)
			.map((paragraph) => paragraph.trim())
			.filter(Boolean);

  	const featuredPosts = formData.getAll('featuredPosts').map(String);
  	const featuredWorks = formData.getAll('featuredWorks').map(String);

  	if (!name) {
  		return fail(400, { error: 'Name is required.' });
  	}

  	updateSection('home', {
  		name,
  		tagline,
  		photoSrc,
  		introParagraphs,
  		featuredPosts,
  		featuredWorks
  	});

  	return { success: true };
	}
};
