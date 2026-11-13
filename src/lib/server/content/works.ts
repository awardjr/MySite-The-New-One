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

/** A work as stored: the platforms are a JSON string. */
type WorkItemRow = Omit<WorkItem, 'platforms'> & { platforms: string };

const getWorkItemsStmt = db.prepare(
	'SELECT CAST(id AS TEXT) AS id, title, description, image, link, platforms FROM works ORDER BY sort_order, id'
);
const deleteWorkItemsStmt = db.prepare('DELETE FROM works WHERE id IS NOT NULL');
const insertWorkItemStmt = db.prepare(
	'INSERT INTO works (id, title, description, image, link, platforms, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

export function getWorks(): WorksContent {
	const rows = getWorkItemsStmt.all() as WorkItemRow[];
	return {
		items: rows.map((row) => ({ ...row, platforms: parseJsonArray<string>(row.platforms) }))
	};
}

/** Saves works, re-using each submitted row id so it stays the same across saves; new or duplicate ids get a fresh one. */
export function setWorks(value: WorksContent): void {
	deleteWorkItemsStmt.run();
	const used = new Set<number>();
	value.items.forEach((item, i) => {
		const submitted = Number(item.id);
		const id =
			Number.isInteger(submitted) && submitted > 0 && !used.has(submitted) ? submitted : null;
		if (id !== null) used.add(id);
		insertWorkItemStmt.run(
			id,
			item.title,
			item.description,
			item.image,
			item.link,
			JSON.stringify(item.platforms),
			i
		);
	});
}
