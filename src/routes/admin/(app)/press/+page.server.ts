import { fail } from '@sveltejs/kit';
import { readContent, updateSection, getHeadlineForPage, type PressItem } from '#lib/server/content.js';
import { saveHeadlineAction } from '#lib/server/headlineAction.js';
import { readJsonRows, safeUrl, text } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const { items } = readContent().press;
	const { headline, subtitle } = getHeadlineForPage('press');
	return { items, headline, subtitle };
};

export const actions: Actions = {
	saveHeadline: saveHeadlineAction('press'),
	save: async ({ request }) => {
		const formData = await request.formData();
		const rows = readJsonRows(formData, 'items');
		if (!rows) {
			return fail(400, { error: 'Could not read submitted data.' });
		}

		const items: PressItem[] = rows
			.map((item) => ({
				title: text(item.title),
				summary: text(item.summary),
				href: safeUrl(item.href)
			}))
			.filter((item) => item.title);

		updateSection('press', { items });

		return { success: true };
	}
};
