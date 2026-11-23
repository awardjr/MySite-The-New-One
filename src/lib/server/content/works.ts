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

type WorkItemRow = Omit<WorkItem, 'platforms'> & { platforms: string };

const getWorkItemsStmt = db.prepare(
	'SELECT CAST(id AS TEXT) AS id, title, description, image, link, platforms FROM works ORDER BY sort_order, id'
);
const deleteWorkItemsStmt = db.prepare('DELETE FROM works WHERE id IS NOT NULL');
const insertWorkItemStmt = db.prepare(
	'INSERT INTO works (id, title, description, image, link, platforms, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

export function getWorks(): WorkItem[] {
	const rows = getWorkItemsStmt.all() as WorkItemRow[];
	return rows.map((row) => ({ ...row, platforms: parseJsonArray<string>(row.platforms) }));
}

export function setWorks(items: WorkItem[]): void {
	deleteWorkItemsStmt.run();
	const used = new Set<number>();
	items.forEach((item, i) => {
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
