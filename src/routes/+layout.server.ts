import { readContent } from '$lib/server/content';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => {
	return {
		siteName: readContent().home.name
	};
};
