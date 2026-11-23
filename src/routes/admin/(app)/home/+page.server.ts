import { fail } from '@sveltejs/kit';
import { readContent, updateSection, getHeadlineForPage } from '#lib/server/content.js';
import { saveHeadlineAction } from '#lib/server/headlineAction.js';
import { z } from 'zod';
import { fields, firstIssue } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

const homeForm = z.object({
	name: fields.text.pipe(z.string().min(1, 'Name is required.')),
	tagline: fields.text,
	photoSrc: fields.text,
	introParagraphs: fields.raw.transform((value) =>
		value
			.split(/\n\s*\n/)
			.map((paragraph) => paragraph.trim())
			.filter(Boolean)
	),
	featuredPosts: z.array(fields.raw),
	featuredWorks: z.array(fields.raw)
});

export const load: PageServerLoad = () => {
	const { home, blog, works } = readContent();
	const { headline } = getHeadlineForPage('home');
	return {
		home,
		headline,
		posts: blog.map((p) => ({
			slug: p.slug,
			title: p.title,
			draft: p.draft,
			image: p.image
		})),
		works: works.map((w) => ({ id: w.id, title: w.title, image: w.image }))
	};
};

export const actions: Actions = {
	saveHeadline: saveHeadlineAction('home', { subtitle: false }),
	save: async ({ request }) => {
		const formData = await request.formData();
		const submitted = homeForm.safeParse({
			name: formData.get('name'),
			tagline: formData.get('tagline'),
			photoSrc: formData.get('photoSrc'),
			introParagraphs: formData.get('introParagraphs'),
			featuredPosts: formData.getAll('featuredPosts'),
			featuredWorks: formData.getAll('featuredWorks')
		});

		if (!submitted.success) {
			return fail(400, { error: firstIssue(submitted.error) });
		}

		updateSection('home', submitted.data);
		return { success: true };
	}
};
