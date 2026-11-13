import { db } from './db';
import { getHome, setHome } from './content/home';
import { getContact, setContact } from './content/contact';
import { getWorks, setWorks } from './content/works';
import { getPress, setPress } from './content/press';
import { getPinball, setPinball } from './content/pinball';
import {
	deletePostBySlug,
	getBlog,
	insertPost,
	setBlog,
	updatePostBySlug,
	type Post,
	type PostFields
} from './content/blog';
import { getPageHeadlines, setPageHeadlines, upsertPageHeadline } from './content/pageheadlines';
import type { SiteContent } from './content/types';

export type * from './content/types';
export { sanitizePostHtml } from './content/utils';

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

// All site content, read once and kept until something is written. Treat it as read-only:
// every request shares the same object.
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

/** Runs a write in a transaction, then drops the cache so the next read sees it. */
function write<T>(change: () => T): T {
	const result = db.transaction(change)();
	cache = null;
	return result;
}

/** Writes a single section to its own table and refreshes the cached site content. */
export function updateSection<K extends SectionKey>(key: K, value: SiteContent[K]): SiteContent {
	write(() => sectionSetters[key](value));
	// Re-read so generated values (e.g. new item ids) are reflected in the cache.
	return readContent();
}

/** Returns the headline/subtitle for a single page (empty if none saved). */
export function getHeadlineForPage(page: string): { headline: string; subtitle: string } {
	const found = readContent().pageHeadlines.items.find((item) => item.page === page);
	return { headline: found?.headline ?? '', subtitle: found?.subtitle ?? '' };
}

/** Saves the headline/subtitle for a single page, leaving the other pages alone. */
export function saveHeadlineForPage(page: string, headline: string, subtitle: string): void {
	write(() => upsertPageHeadline({ page, headline, subtitle }));
}

/** Adds a blog post after the existing ones. Returns false if the slug is already taken. */
export function createPost(post: Post): boolean {
	if (readContent().blog.posts.some((existing) => existing.slug === post.slug)) return false;
	write(() => insertPost(post));
	return true;
}

/** Updates a single blog post without rewriting the others. Returns false if it doesn't exist. */
export function updatePost(slug: string, fields: PostFields): boolean {
	return write(() => updatePostBySlug(slug, fields));
}

/** Deletes a single blog post. Returns false if it doesn't exist. */
export function deletePost(slug: string): boolean {
	return write(() => deletePostBySlug(slug));
}
