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
	updatePostBySlug,
	type Post,
	type PostFields
} from './content/blog';
import { getPageHeadlines, upsertPageHeadline } from './content/pageheadlines';
import type { PressItem } from './content/press';

export type * from './content/home';
export type * from './content/contact';
export type * from './content/works';
export type * from './content/press';
export type * from './content/pinball';
export type * from './content/blog';
export type * from './content/pageheadlines';
export { sanitizePostHtml } from './content/utils';

function loadContent() {
	return {
		home: getHome(),
		contact: getContact(),
		works: getWorks(),
		press: getPress(),
		pinball: getPinball(),
		blog: getBlog(),
		pageHeadlines: getPageHeadlines()
	};
}

export type SiteContent = ReturnType<typeof loadContent>;

/** Sections saved as a whole. Blog posts and page headlines are saved one at a time. */
type SectionKey = Exclude<keyof SiteContent, 'blog' | 'pageHeadlines'>;

const sectionSetters: { [K in SectionKey]: (value: SiteContent[K]) => void } = {
	home: setHome,
	contact: setContact,
	works: setWorks,
	press: setPress,
	pinball: setPinball
};

// All site content, read once and kept until something is written. Treat it as read-only:
// every request shares the same object.
let cache: SiteContent | null = null;

export function readContent(): SiteContent {
	cache ??= loadContent();
	return cache;
}

/** Runs a write in a transaction, then drops the cache so the next read sees it. */
function write<T>(change: () => T): T {
	const result = db.transaction(change)();
	cache = null;
	return result;
}

/** Writes a single section to its own table. */
export function updateSection<K extends SectionKey>(key: K, value: SiteContent[K]): void {
	write(() => sectionSetters[key](value));
}

/** Newest first; items without a date go last and otherwise keep their order. */
function newestFirst<T extends { date: string }>(items: T[]): T[] {
	return [...items].sort((a, b) => b.date.localeCompare(a.date));
}

/** Posts a visitor can see, newest first. Of posts on the same day, the last one added leads. */
export function getPublishedPosts(): Post[] {
	return newestFirst(
		readContent()
			.blog.filter((post) => !post.draft)
			.reverse()
	);
}

/** Press items for the public page, newest first. */
export function getPressByDate(): PressItem[] {
	return newestFirst(readContent().press);
}

/** Which optional sections have something a visitor can see. Draft posts don't count. */
export function getSectionsWithContent() {
	const { blog, press, works, pinball, contact } = readContent();
	return {
		blog: blog.some((post) => !post.draft),
		press: press.length > 0,
		works: works.length > 0,
		pinball: pinball.length > 0,
		contact: contact.length > 0
	};
}

/** Returns the headline/subtitle for a single page (empty if none saved). */
export function getHeadlineForPage(page: string): { headline: string; subtitle: string } {
	const found = readContent().pageHeadlines.find((item) => item.page === page);
	return { headline: found?.headline ?? '', subtitle: found?.subtitle ?? '' };
}

/** Saves the headline/subtitle for a single page, leaving the other pages alone. */
export function saveHeadlineForPage(page: string, headline: string, subtitle: string): void {
	write(() => upsertPageHeadline({ page, headline, subtitle }));
}

/** Adds a blog post after the existing ones. Returns false if the slug is already taken. */
export function createPost(post: Post): boolean {
	if (readContent().blog.some((existing) => existing.slug === post.slug)) return false;
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
