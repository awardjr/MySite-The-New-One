import { fail } from '@sveltejs/kit';
import { readContent, updateSection } from '$lib/server/content';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { home: readContent().home };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const name = String(formData.get('name') ?? '').trim();
		const tagline = String(formData.get('tagline') ?? '').trim();
		const photoSrc = String(formData.get('photoSrc') ?? '').trim();
		const introRaw = String(formData.get('introParagraphs') ?? '');
		const introParagraphs = introRaw
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
