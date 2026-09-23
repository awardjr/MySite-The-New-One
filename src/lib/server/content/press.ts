import { db } from '../db';

export type PressItem = {
	title: string;
	summary: string;
	href: string;
};

export type PressContent = {
	items: PressItem[];
};

const getPressItemsStmt = db.prepare(
	'SELECT title, summary, href FROM press_items ORDER BY sort_order, id'
);
const deletePressItemsStmt = db.prepare('DELETE FROM press_items WHERE id IS NOT NULL');
const insertPressItemStmt = db.prepare(
	'INSERT INTO press_items (title, summary, href, sort_order) VALUES (?, ?, ?, ?)'
);

export function getPress(): PressContent {
	const rows = getPressItemsStmt.all() as { title: string; summary: string; href: string }[];
	return {
		items: rows.map((row) => ({
			title: row.title ?? '',
			summary: row.summary ?? '',
			href: row.href ?? ''
		}))
	};
}

export function setPress(value: PressContent): void {
	deletePressItemsStmt.run();
	const items = value.items ?? [];
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		insertPressItemStmt.run(item.title, item.summary, item.href, i);
	}
}
