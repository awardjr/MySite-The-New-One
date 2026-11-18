import { db } from '../db';

export type PressItem = {
	outlet: string;
	title: string;
	summary: string;
	href: string;
	date: string;
};

const getPressItemsStmt = db.prepare(
	'SELECT outlet, title, summary, href, date FROM press ORDER BY sort_order, id'
);
const deletePressItemsStmt = db.prepare('DELETE FROM press WHERE id IS NOT NULL');
const insertPressItemStmt = db.prepare(
	'INSERT INTO press (outlet, title, summary, href, date, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
);

export function getPress(): PressItem[] {
	return getPressItemsStmt.all() as PressItem[];
}

export function setPress(items: PressItem[]): void {
	deletePressItemsStmt.run();
	items.forEach((item, i) => {
		insertPressItemStmt.run(item.outlet, item.title, item.summary, item.href, item.date, i);
	});
}
