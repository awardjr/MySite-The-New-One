import { getPressByDate, getHeadlineForPage } from '#lib/server/content.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { items: getPressByDate(), ...getHeadlineForPage('press') };
};
