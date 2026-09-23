import { fail } from '@sveltejs/kit';
import { readContent, updateSection, type ContactLink } from '$lib/server/content';
import { readJsonRows, text } from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { links: readContent().contact.links };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const rows = readJsonRows(await request.formData(), 'links');
		if (!rows) {
			return fail(400, { error: 'Could not read submitted data.' });
		}

		const links: ContactLink[] = rows
			.map((item) => ({
				label: text(item.label),
				href: text(item.href),
				icon: text(item.icon ?? 'link')
			}))
			.filter((link) => link.label && link.href);

		updateSection('contact', { links });

		return { success: true };
	}
};
