import { db } from '../db';
import { parseJsonArray } from './utils';

export type WorkItem = {
	title: string;
	description: string;
	image: string;
	platforms: string[];
};

export type WorksContent = {
	items: WorkItem[];
};

const getWorkItemsStmt = db.prepare(
	'SELECT title, description, image, platforms FROM work_items ORDER BY sort_order, id'
);
const deleteWorkItemsStmt = db.prepare('DELETE FROM work_items WHERE id IS NOT NULL');
const insertWorkItemStmt = db.prepare(
	'INSERT INTO work_items (title, description, image, platforms, sort_order) VALUES (?, ?, ?, ?, ?)'
);

export function getWorks(): WorksContent {
	const rows = getWorkItemsStmt.all() as {
		title: string;
		description: string;
		image: string;
		platforms: string;
	}[];
	return {
		items: rows.map((row) => ({
			title: row.title ?? '',
			description: row.description ?? '',
			image: row.image ?? '',
			platforms: parseJsonArray<string>(row.platforms)
		}))
	};
}

export function setWorks(value: WorksContent): void {
	deleteWorkItemsStmt.run();
	const items = value.items ?? [];
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		insertWorkItemStmt.run(
			item.title,
			item.description,
			item.image ?? '',
			JSON.stringify(item.platforms ?? []),
			i
		);
	}
}
