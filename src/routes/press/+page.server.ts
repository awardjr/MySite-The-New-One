import { readContent, getHeadlineForPage } from '#lib/server/content.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const content = readContent();
	return { pressItems: content.press.items, ...getHeadlineForPage('press') };
};
