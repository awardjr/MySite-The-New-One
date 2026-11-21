const dateFormat = new Intl.DateTimeFormat('en-US', {
	dateStyle: 'long',
	timeZone: 'UTC'
});

export function formatDate(date: string): string {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
	const parsed = new Date(`${date}T00:00:00Z`);
	return Number.isNaN(parsed.getTime()) ? date : dateFormat.format(parsed);
}
