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
	VALUES (?, ?, ?)
	ON CONFLICT(page) DO UPDATE SET
		headline = excluded.headline,
		subtitle = excluded.subtitle
`);
const deletePageHeadlinesStmt = db.prepare('DELETE FROM page_headlines');

export function getPageHeadlines(): PageHeadlinesContent {
	const rows = getPageHeadlinesStmt.all() as { page: string; headline: string; subtitle: string }[];
	const items = rows.map((row) => ({
		page: row.page,
		headline: row.headline ?? '',
		subtitle: row.subtitle ?? ''
	}));

	return { items };
}

export function setPageHeadlines(value: PageHeadlinesContent): void {
	deletePageHeadlinesStmt.run();
	for (const item of value.items) {
		upsertPageHeadlineStmt.run(item.page, item.headline, item.subtitle);
	}
}

/** Insert or replace the headline/subtitle for a single page, keeping the other pages. */
export function saveHeadlineForPage(page: string, headline: string, subtitle: string): void {
	const all = getPageHeadlines();
	const entry = { page, headline, subtitle };
	const index = all.items.findIndex((item) => item.page === page);
	if (index >= 0) {
		all.items[index] = entry;
	} else {
		all.items.push(entry);
	}
	setPageHeadlines(all);
}

/** Convenience: get the headline/subtitle for a single page (empty if none saved). */
export function getHeadlineForPage(page: string): { headline: string; subtitle: string } {
	const all = getPageHeadlines();
	const found = all.items.find((item) => item.page === page);
	return { headline: found?.headline ?? '', subtitle: found?.subtitle ?? '' };
}
