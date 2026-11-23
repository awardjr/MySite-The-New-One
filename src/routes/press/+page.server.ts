import { getPressByDate, getHeadlineForPage } from '#lib/server/content.js';
import { formatDate } from '#lib/server/formatDate.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const items = getPressByDate().map((item) => ({ ...item, date: formatDate(item.date) }));
	return { items, ...getHeadlineForPage('press') };
};
