import { fail } from '@sveltejs/kit';
import { readContent, updateSection, getHeadlineForPage, type WorkItem } from '#lib/server/content.js';
import { saveHeadlineAction } from '#lib/server/headlineAction.js';
import { readJsonRows, safeUrl, text, textList } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const { items } = readContent().works;
	const { headline, subtitle } = getHeadlineForPage('works');
	return { items, headline, subtitle };
};

export const actions: Actions = {
	saveHeadline: saveHeadlineAction('works'),
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
