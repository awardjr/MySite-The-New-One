import { fail } from '@sveltejs/kit';
import { readContent, updateSection, type WorkItem } from '$lib/server/content';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { items: readContent().works.items };
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

		const items: WorkItem[] = (parsed as Record<string, unknown>[])
			.map((item) => ({
				title: String(item?.title ?? '').trim(),
				description: String(item?.description ?? '').trim(),
				image: String(item?.image ?? '').trim(),
				platforms: Array.isArray(item?.platforms)
					? (item.platforms as unknown[])
							.map((platform) => String(platform ?? '').trim())
							.filter(Boolean)
					: []
			}))
			.filter((item) => item.title);

		updateSection('works', { items });

		return { success: true };
	}
};
