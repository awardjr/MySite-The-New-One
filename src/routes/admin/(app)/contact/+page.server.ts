import { fail } from '@sveltejs/kit';
import {
	readContent,
	updateSection,
	getHeadlineForPage,
	type ContactLink
} from '#lib/server/content.js';
import { saveHeadlineAction } from '#lib/server/headlineAction.js';
import { readJsonRows, safeUrl, text } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const { links } = readContent().contact;
	const { headline, subtitle } = getHeadlineForPage('contact');
	return { links, headline, subtitle };
};

export const actions: Actions = {
	saveHeadline: saveHeadlineAction('contact'),
	save: async ({ request }) => {
		const formData = await request.formData();
		const rows = readJsonRows(formData, 'links');
		if (!rows) {
			return fail(400, { error: 'Could not read submitted data.' });
		}

		const links: ContactLink[] = rows
			.map((item) => ({
				label: text(item.label),
				href: safeUrl(item.href),
				icon: text(item.icon ?? 'link'),
				description: text(item.description ?? '')
			}))
			.filter((link) => link.label && link.href);

		updateSection('contact', { links });

		return { success: true };
	}
};
