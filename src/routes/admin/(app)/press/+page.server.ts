import { fail } from '@sveltejs/kit';
import { readContent, updateSection, type PressItem } from '#lib/server/content.js';
import { readJsonRows, safeUrl, text } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { items: readContent().press.items };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const rows = readJsonRows(await request.formData(), 'items');
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
