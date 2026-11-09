import { db } from '../db';

export type PressItem = {
	outlet: string;
	title: string;
	summary: string;
	href: string;
	date: string;
};

export type PressContent = {
	items: PressItem[];
};

const getPressItemsStmt = db.prepare(
	'SELECT outlet, title, summary, href, date FROM press ORDER BY sort_order, id'
);
const deletePressItemsStmt = db.prepare('DELETE FROM press WHERE id IS NOT NULL');
const insertPressItemStmt = db.prepare(
	'INSERT INTO press (outlet, title, summary, href, date, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
);

export function getPress(): PressContent {
	const rows = getPressItemsStmt.all() as { outlet: string; title: string; summary: string; href: string; date: string }[];
	return {
		items: rows.map((row) => ({
			outlet: row.outlet ?? '',
			title: row.title ?? '',
			summary: row.summary ?? '',
			href: row.href ?? '',
			date: row.date ?? ''
		}))
	};
}

export function setPress(value: PressContent): void {
	deletePressItemsStmt.run();
	const items = value.items ?? [];
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		insertPressItemStmt.run(item.outlet, item.title, item.summary, item.href, item.date, i);
	}
}
