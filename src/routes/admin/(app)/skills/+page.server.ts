import { fail } from '@sveltejs/kit';
import { readContent, updateSection, type SkillCategory } from '$lib/server/content';
import { readJsonRows, text, textList } from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { categories: readContent().skills.categories };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const rows = readJsonRows(await request.formData(), 'categories');
		if (!rows) {
			return fail(400, { error: 'Could not read submitted data.' });
		}

		const categories: SkillCategory[] = rows
			.map((item) => ({
				category: text(item.category),
				skills: textList(item.skills)
			}))
			.filter((category) => category.category);

		updateSection('skills', { categories });

		return { success: true };
	}
};
