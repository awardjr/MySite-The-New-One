import { readContent, getHeadlineForPage } from '#lib/server/content.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { items: readContent().works, ...getHeadlineForPage('works') };
};
