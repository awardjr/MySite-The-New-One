import { readContent } from '#lib/server/content.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { works: readContent().works.items };
};
