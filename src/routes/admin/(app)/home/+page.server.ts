import { fail } from '@sveltejs/kit';
import { readContent, updateSection } from '$lib/server/content';
import { text } from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { home: readContent().home };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const name = text(formData.get('name'));
		const tagline = text(formData.get('tagline'));
		const photoSrc = text(formData.get('photoSrc'));
		const introParagraphs = String(formData.get('introParagraphs') ?? '')
			.split(/\n\s*\n/)
			.map((paragraph) => paragraph.trim())
			.filter(Boolean);

		if (!name) {
			return fail(400, { error: 'Name is required.' });
		}

		updateSection('home', { name, tagline, photoSrc, introParagraphs });

		return { success: true };
	}
};
