const dateFormat = new Intl.DateTimeFormat('en-US', {
	dateStyle: 'long',
	// Stored dates have no time, so UTC keeps them on the same day for every visitor.
	timeZone: 'UTC'
});

/** Turns a stored `2026-01-03` into `January 3, 2026`. Anything else is returned unchanged. */
export function formatDate(date: string): string {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
	const parsed = new Date(`${date}T00:00:00Z`);
	return Number.isNaN(parsed.getTime()) ? date : dateFormat.format(parsed);
}
