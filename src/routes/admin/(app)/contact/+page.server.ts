import { fail } from '@sveltejs/kit';
import { readContent, updateSection, getHeadlineForPage, type ContactLink } from '#lib/server/content.js';
import { getPageHeadlines, setPageHeadlines } from '#lib/server/content/pageheadlines.js';
import { readJsonRows, safeUrl, text } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const { links } = readContent().contact;
	const { headline, subtitle } = getHeadlineForPage('contact');
	return { links, headline, subtitle };
};

export const actions: Actions = {
	saveHeadline: async ({ request }) => {
		const formData = await request.formData();
		const headline = text(formData.get('headline'));
		const subtitle = text(formData.get('subtitle'));

		const allHeadlines = getPageHeadlines();
		const updatedHeadlines = { ...allHeadlines };
		const contactIndex = updatedHeadlines.items.findIndex((item) => item.page === 'contact');
		if (contactIndex >= 0) {
			updatedHeadlines.items[contactIndex] = { page: 'contact', headline, subtitle };
		} else {
			updatedHeadlines.items.push({ page: 'contact', headline, subtitle });
		}
		setPageHeadlines(updatedHeadlines);

		return { headlineSuccess: true };
	},
	default: async ({ request }) => {
		const formData = await request.formData();
		const rows = readJsonRows(formData, 'links');
		if (!rows) {
			return fail(400, { error: 'Could not read submitted data.' });
		}

		const links: ContactLink[] = rows
			.map((item) => ({
				label: text(item.label),
				href: safeUrl(item.href),
				icon: text(item.icon ?? 'link')
			}))
			.filter((link) => link.label && link.href);

		updateSection('contact', { links });

		return { success: true };
	}
};
