import { db } from './db';
import { getHome, setHome } from './content/home';
import { getContact, setContact } from './content/contact';
import { getSkills, setSkills } from './content/skills';
import { getWorks, setWorks } from './content/works';
import { getPress, setPress } from './content/press';
import { getPinball, setPinball } from './content/pinball';
import { getBlog, setBlog } from './content/blog';
import type { SiteContent } from './content/types';

export type * from './content/types';
export { sanitizePostHtml } from './content/utils';

type SectionKey = keyof SiteContent;

const sectionSetters: { [K in SectionKey]: (value: SiteContent[K]) => void } = {
	home: setHome,
	contact: setContact,
	skills: setSkills,
	works: setWorks,
	press: setPress,
	pinball: setPinball,
	blog: setBlog
};

let cache: SiteContent | null = null;

export function readContent(): SiteContent {
	if (cache) return cache;

	cache = {
		home: getHome(),
		contact: getContact(),
		skills: getSkills(),
		works: getWorks(),
		press: getPress(),
		pinball: getPinball(),
		blog: getBlog()
	};

	return cache;
}

/** Writes a single section to its own table and refreshes the cached site content. */
export function updateSection<K extends SectionKey>(key: K, value: SiteContent[K]): SiteContent {
	const updated = { ...readContent(), [key]: value };
	db.transaction(() => sectionSetters[key](value))();
	cache = updated;
	return updated;
}
