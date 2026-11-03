import { db } from '../db';

export type PageHeadline = {
	page: string;
	headline: string;
	subtitle: string;
};

export type PageHeadlinesContent = {
	items: PageHeadline[];
};

const PAGE_DEFAULTS: PageHeadline[] = [
	{ page: 'home', headline: "Hi, I'm", subtitle: '' },
	{ page: 'blog', headline: 'Blog', subtitle: 'Musings perhaps' },
	{ page: 'works', headline: 'Works', subtitle: 'Some fun things I worked on.' },
	{
		page: 'pinball',
		headline: 'Pinball',
		subtitle: "Pinball is something I really enjoy. Here's some of my best scores so far"
	},
	{ page: 'press', headline: 'Press', subtitle: 'A collection of press mentions and appearances' },
	{
		page: 'contact',
		headline: 'Contact',
		subtitle: "Find me in these places. Check out what I've done as well"
	}
];

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

	// Fill in defaults for pages that have no stored headline yet
	const storedPages = new Set(items.map((item) => item.page));
	for (const def of PAGE_DEFAULTS) {
		if (!storedPages.has(def.page)) {
			items.push({ ...def });
		}
	}

	return { items };
}

export function setPageHeadlines(value: PageHeadlinesContent): void {
	deletePageHeadlinesStmt.run();
	for (const item of value.items) {
		upsertPageHeadlineStmt.run(item.page, item.headline, item.subtitle);
	}
}

/** Convenience: get the headline/subtitle for a single page, falling back to defaults. */
export function getHeadlineForPage(page: string): { headline: string; subtitle: string } {
	const all = getPageHeadlines();
	const found = all.items.find((item) => item.page === page);
	if (found && (found.headline || found.subtitle)) {
		return { headline: found.headline, subtitle: found.subtitle };
	}
	const def = PAGE_DEFAULTS.find((d) => d.page === page);
	return {
		headline: def ? def.headline : page.charAt(0).toUpperCase() + page.slice(1),
		subtitle: def ? def.subtitle : ''
	};
}
