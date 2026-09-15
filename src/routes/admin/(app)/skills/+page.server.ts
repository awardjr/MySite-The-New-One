import { fail } from '@sveltejs/kit';
import { readContent, updateSection, type SkillCategory } from '$lib/server/content';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { categories: readContent().skills.categories };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const raw = String(formData.get('categories') ?? '[]');

		let parsed: unknown;
		try {
			parsed = JSON.parse(raw);
		} catch {
			return fail(400, { error: 'Could not read submitted data.' });
		}

		if (!Array.isArray(parsed)) {
			return fail(400, { error: 'Could not read submitted data.' });
		}

		const categories: SkillCategory[] = (parsed as Record<string, unknown>[])
			.map((item) => ({
				category: String(item?.category ?? '').trim(),
				skills: Array.isArray(item?.skills)
					? (item.skills as unknown[]).map((skill) => String(skill ?? '').trim()).filter(Boolean)
					: []
			}))
			.filter((category) => category.category);

		updateSection('skills', { categories });

		return { success: true };
	}
};
