import { getSectionsWithContent, readContent } from '#lib/server/content.js';
import { siteOrigin } from '#lib/server/origin.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ url }) => {
	const { home } = readContent();
	return {
		siteName: home.name,
		origin: siteOrigin(url),
		shareImage: home.photoSrc,
		sections: getSectionsWithContent()
	};
};
