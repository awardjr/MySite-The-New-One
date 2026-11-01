import { db } from '../db';
import { parseJsonArray } from './utils';

export type WorkItem = {
	id: string;
	title: string;
	description: string;
	image: string;
	link: string;
	platforms: string[];
};

export type WorksContent = {
	items: WorkItem[];
};

const getWorkItemsStmt = db.prepare(
	'SELECT CAST(id AS TEXT) AS id, title, description, image, link, platforms FROM works ORDER BY sort_order, id'
);
const deleteWorkItemsStmt = db.prepare('DELETE FROM works WHERE id IS NOT NULL');
const insertWorkItemStmt = db.prepare(
	'INSERT INTO works (id, title, description, image, link, platforms, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

export function getWorks(): WorksContent {
	const rows = getWorkItemsStmt.all() as {
		id: string;
		title: string;
		description: string;
		image: string;
		link: string;
		platforms: string;
	}[];
	return {
		items: rows.map((row) => ({
			id: row.id,
			title: row.title ?? '',
			description: row.description ?? '',
			image: row.image ?? '',
			link: row.link ?? '',
			platforms: parseJsonArray<string>(row.platforms)
		}))
	};
}

/** Saves works, re-using each submitted row id so it stays the same across saves; new or duplicate ids get a fresh one. */
export function setWorks(value: WorksContent): void {
	deleteWorkItemsStmt.run();
	const items = value.items ?? [];
	const used = new Set<number>();
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		const submitted = Number(item.id);
		const id =
			Number.isInteger(submitted) && submitted > 0 && !used.has(submitted) ? submitted : null;
		if (id !== null) used.add(id);
		insertWorkItemStmt.run(
			id,
			item.title,
			item.description,
			item.image ?? '',
			item.link ?? '',
			JSON.stringify(item.platforms ?? []),
			i
		);
	}
}
