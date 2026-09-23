import { fail } from '@sveltejs/kit';
import { readContent, updateSection, type WorkItem } from '$lib/server/content';
import { readJsonRows, text, textList } from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { items: readContent().works.items };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const rows = readJsonRows(await request.formData(), 'items');
		if (!rows) {
			return fail(400, { error: 'Could not read submitted data.' });
		}

		const items: WorkItem[] = rows
			.map((item) => ({
				title: text(item.title),
				description: text(item.description),
				image: text(item.image),
				platforms: textList(item.platforms)
			}))
			.filter((item) => item.title);

		updateSection('works', { items });

		return { success: true };
	}
};
