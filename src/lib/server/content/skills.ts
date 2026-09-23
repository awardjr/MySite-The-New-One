import { db } from '../db';
import { parseJsonArray } from './utils';

export type SkillCategory = {
	category: string;
	skills: string[];
};

export type SkillsContent = {
	categories: SkillCategory[];
};

const getSkillCategoriesStmt = db.prepare(
	'SELECT category, skills FROM skill_categories ORDER BY sort_order, id'
);
const deleteSkillCategoriesStmt = db.prepare('DELETE FROM skill_categories WHERE id IS NOT NULL');
const insertSkillCategoryStmt = db.prepare(
	'INSERT INTO skill_categories (category, skills, sort_order) VALUES (?, ?, ?)'
);

export function getSkills(): SkillsContent {
	const rows = getSkillCategoriesStmt.all() as { category: string; skills: string }[];
	return {
		categories: rows.map((row) => ({
			category: row.category ?? '',
			skills: parseJsonArray<string>(row.skills)
		}))
	};
}

export function setSkills(value: SkillsContent): void {
	deleteSkillCategoriesStmt.run();
	const categories = value.categories ?? [];
	for (let i = 0; i < categories.length; i++) {
		const cat = categories[i];
		insertSkillCategoryStmt.run(cat.category, JSON.stringify(cat.skills ?? []), i);
	}
}
