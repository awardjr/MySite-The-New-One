import { fail } from '@sveltejs/kit';
import { readContent, updateSection, getHeadlineForPage, type WorkItem } from '#lib/server/content.js';
import { getPageHeadlines, setPageHeadlines } from '#lib/server/content/pageheadlines.js';
import { readJsonRows, safeUrl, text, textList } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const { items } = readContent().works;
	const { headline, subtitle } = getHeadlineForPage('works');
	return { items, headline, subtitle };
};

export const actions: Actions = {
	saveHeadline: async ({ request }) => {
		const formData = await request.formData();
		const headline = text(formData.get('headline'));
		const subtitle = text(formData.get('subtitle'));

		const allHeadlines = getPageHeadlines();
		const updatedHeadlines = { ...allHeadlines };
		const worksIndex = updatedHeadlines.items.findIndex((item) => item.page === 'works');
		if (worksIndex >= 0) {
			updatedHeadlines.items[worksIndex] = { page: 'works', headline, subtitle };
		} else {
			updatedHeadlines.items.push({ page: 'works', headline, subtitle });
		}
		setPageHeadlines(updatedHeadlines);

		return { headlineSuccess: true };
	},
	default: async ({ request }) => {
		const formData = await request.formData();
		const rows = readJsonRows(formData, 'items');
		if (!rows) {
			return fail(400, { error: 'Could not read submitted data.' });
		}

		const items: WorkItem[] = rows
			.map((item) => ({
				id: text(item.id),
				title: text(item.title),
				description: text(item.description),
				image: text(item.image),
				link: safeUrl(item.link),
				platforms: textList(item.platforms)
			}))
			.filter((item) => item.title);

		updateSection('works', { items });

		return { success: true };
	}
};
