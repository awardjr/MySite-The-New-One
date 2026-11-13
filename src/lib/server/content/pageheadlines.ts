import { db } from '../db';

export type PageHeadline = {
	page: string;
	headline: string;
	subtitle: string;
};

export type PageHeadlinesContent = {
	items: PageHeadline[];
};

const getPageHeadlinesStmt = db.prepare(
	'SELECT page, headline, subtitle FROM page_headlines ORDER BY page'
);
const upsertPageHeadlineStmt = db.prepare(`
	INSERT INTO page_headlines (page, headline, subtitle)
	VALUES (@page, @headline, @subtitle)
	ON CONFLICT(page) DO UPDATE SET
		headline = excluded.headline,
		subtitle = excluded.subtitle
`);
const deletePageHeadlinesStmt = db.prepare('DELETE FROM page_headlines');

export function getPageHeadlines(): PageHeadlinesContent {
	return { items: getPageHeadlinesStmt.all() as PageHeadline[] };
}

export function setPageHeadlines(value: PageHeadlinesContent): void {
	deletePageHeadlinesStmt.run();
	for (const item of value.items) {
		upsertPageHeadlineStmt.run(item);
	}
}

/** Inserts or replaces the headline/subtitle for a single page, leaving the other pages alone. */
export function upsertPageHeadline(item: PageHeadline): void {
	upsertPageHeadlineStmt.run(item);
}
