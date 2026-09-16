import { fail } from '@sveltejs/kit';
import { readContent, updateSection, type PressItem } from '$lib/server/content';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { items: readContent().press.items };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const raw = String(formData.get('items') ?? '[]');

		let parsed: unknown;
		try {
			parsed = JSON.parse(raw);
		} catch {
			return fail(400, { error: 'Could not read submitted data.' });
		}

		if (!Array.isArray(parsed)) {
			return fail(400, { error: 'Could not read submitted data.' });
		}

		const items: PressItem[] = (parsed as Record<string, unknown>[])
			.map((item) => ({
				title: String(item?.title ?? '').trim(),
				summary: String(item?.summary ?? '').trim(),
				href: String(item?.href ?? '').trim()
			}))
			.filter((item) => item.title);

		updateSection('press', { items });

		return { success: true };
	}
};
