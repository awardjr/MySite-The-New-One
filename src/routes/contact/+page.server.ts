import { readContent, getHeadlineForPage } from '#lib/server/content.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { links: readContent().contact, ...getHeadlineForPage('contact') };
};
