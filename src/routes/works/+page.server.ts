import { readContent, getHeadlineForPage } from '#lib/server/content.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const content = readContent();
	return { works: content.works.items, ...getHeadlineForPage('works') };
};
