import { db } from './db';
import { getHome, setHome } from './content/home';
import { getContact, setContact } from './content/contact';
import { getWorks, setWorks } from './content/works';
import { getPress, setPress } from './content/press';
import { getPinball, setPinball } from './content/pinball';
import { getBlog, setBlog } from './content/blog';
import { getPageHeadlines, setPageHeadlines } from './content/pageheadlines';
import type { SiteContent } from './content/types';

export type * from './content/types';
export { sanitizePostHtml } from './content/utils';
export { getHeadlineForPage } from './content/pageheadlines';

type SectionKey = keyof SiteContent;

const sectionSetters: { [K in SectionKey]: (value: SiteContent[K]) => void } = {
	home: setHome,
	contact: setContact,
	works: setWorks,
	press: setPress,
	pinball: setPinball,
	blog: setBlog,
	pageHeadlines: setPageHeadlines
};

let cache: SiteContent | null = null;

export function readContent(): SiteContent {
	if (cache) return cache;

	cache = {
		home: getHome(),
		contact: getContact(),
		works: getWorks(),
		press: getPress(),
		pinball: getPinball(),
		blog: getBlog(),
		pageHeadlines: getPageHeadlines()
	};

	return cache;
}

/** Writes a single section to its own table and refreshes the cached site content. */
export function updateSection<K extends SectionKey>(key: K, value: SiteContent[K]): SiteContent {
	db.transaction(() => sectionSetters[key](value))();
	// Re-read so generated values (e.g. new item ids) are reflected in the cache.
	cache = null;
	return readContent();
}
