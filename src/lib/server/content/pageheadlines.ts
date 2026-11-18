import { db } from '../db';

export type PageHeadline = {
	page: string;
	headline: string;
	subtitle: string;
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

export function getPageHeadlines(): PageHeadline[] {
	return getPageHeadlinesStmt.all() as PageHeadline[];
}

/** Inserts or replaces the headline/subtitle for a single page, leaving the other pages alone. */
export function upsertPageHeadline(item: PageHeadline): void {
	upsertPageHeadlineStmt.run(item);
}
