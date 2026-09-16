import { fail } from '@sveltejs/kit';
import { readContent, updateSection, type ContactLink } from '$lib/server/content';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { links: readContent().contact.links };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const raw = String(formData.get('links') ?? '[]');

		let parsed: unknown;
		try {
			parsed = JSON.parse(raw);
		} catch {
			return fail(400, { error: 'Could not read submitted data.' });
		}

		if (!Array.isArray(parsed)) {
			return fail(400, { error: 'Could not read submitted data.' });
		}

		const links: ContactLink[] = (parsed as Record<string, unknown>[])
			.map((item) => ({
				label: String(item?.label ?? '').trim(),
				href: String(item?.href ?? '').trim(),
				icon: String(item?.icon ?? 'link').trim()
			}))
			.filter((link) => link.label && link.href);

		updateSection('contact', { links });

		return { success: true };
	}
};
