import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/server/db.js', async () => {
	const { getTestDb } = await import('./test-db');
	return { db: getTestDb() };
});

import { getTestDb } from './test-db';
import {
	createPost,
	deletePost,
	getHeadlineForPage,
	readContent,
	saveHeadlineForPage,
	updatePost,
	updateSection
} from '#lib/server/content.js';

const testDb = getTestDb();

const emptyHome = {
	name: '',
	tagline: '',
	photoSrc: '',
	introParagraphs: [],
	featuredPosts: [],
	featuredWorks: []
};
const press = (title: string) => ({ outlet: 'O', title, summary: 's', href: '/h', date: '' });
const work = (title: string, id = '') => ({
	id,
	title,
	description: '',
	image: '',
	link: '',
	platforms: []
});
const fields = (title: string) => ({
	title,
	date: '2024-01-01',
	image: '',
	preview: '',
	content: `<p>${title}</p>`,
	draft: false
});
const post = (slug: string, title = slug) => ({ slug, ...fields(title) });
const slugs = () => readContent().blog.posts.map((p) => p.slug);
const postId = (slug: string) =>
	(testDb.prepare('SELECT id FROM posts WHERE slug = ?').get(slug) as { id: number }).id;

beforeEach(() => {
	testDb.exec(`
		DELETE FROM home;
		DELETE FROM links WHERE id IS NOT NULL;
		DELETE FROM works WHERE id IS NOT NULL;
		DELETE FROM press WHERE id IS NOT NULL;
		DELETE FROM pinball_machines WHERE id IS NOT NULL;
		DELETE FROM posts WHERE slug IS NOT NULL;
		DELETE FROM page_headlines WHERE page IS NOT NULL;
	`);
	// The content controller caches the site content in module state; a write forces a fresh
	// read from the (now-empty) tables for every test.
	updateSection('contact', { links: [] });
});

describe('readContent', () => {
	it('returns defaults for every section when the database is empty', () => {
		expect(readContent()).toEqual({
			home: emptyHome,
			contact: { links: [] },
			works: { items: [] },
			press: { items: [] },
			pinball: { machines: [] },
			blog: { posts: [] },
			pageHeadlines: { items: [] }
		});
	});

	it('falls back to empty lists when stored JSON is corrupt', () => {
		updateSection('home', { ...emptyHome, introParagraphs: ['Hello'] });
		updateSection('works', { items: [work('W')] });
		updateSection('pinball', {
			machines: [{ name: 'M', image: '', highScore: '', modeScores: [] }]
		});
		testDb.exec(`
			UPDATE home SET intro_paragraphs = 'corrupt', featured_posts = '{}';
			UPDATE works SET platforms = 'corrupt';
			UPDATE pinball_machines SET mode_scores = '"text"';
		`);
		saveHeadlineForPage('any', '', '');

		const content = readContent();
		expect(content.home.introParagraphs).toEqual([]);
		expect(content.home.featuredPosts).toEqual([]);
		expect(content.works.items[0].platforms).toEqual([]);
		expect(content.pinball.machines[0].modeScores).toEqual([]);
	});
});

describe('content cache', () => {
	const insertBehindTheCache = () =>
		testDb.prepare("INSERT INTO press (title, summary, href) VALUES ('Direct', '', '')").run();

	it('keeps serving the cached content until something is written', () => {
		readContent();
		insertBehindTheCache();
		expect(readContent().press.items).toEqual([]);
	});

	it.each([
		['updateSection', () => updateSection('contact', { links: [] })],
		['saveHeadlineForPage', () => saveHeadlineForPage('blog', 'Blog', '')],
		['createPost', () => createPost(post('new'))],
		['updatePost', () => updatePost('existing', fields('Changed'))],
		['deletePost', () => deletePost('existing')]
	])('is refreshed by %s', (_name, write) => {
		createPost(post('existing'));
		readContent();
		insertBehindTheCache();

		write();

		expect(readContent().press.items).toHaveLength(1);
	});
});

describe('updateSection', () => {
	it('round-trips every field of every section', () => {
		const home = {
			name: 'Ada',
			tagline: 'Engineer',
			photoSrc: '/photo.jpg',
			introParagraphs: ['Hello', 'World'],
			featuredPosts: ['a'],
			featuredWorks: ['1', '2']
		};
		const links = [{ label: 'Mail', href: 'mailto:a@b.c', icon: 'at', description: 'Write' }];
		const items = [{ outlet: 'V', title: 'T', summary: 'S', href: '/a', date: '2024-01-01' }];
		const machines = [
			{
				name: 'Machine',
				image: '/m.jpg',
				highScore: '1,000,000',
				modeScores: [{ mode: 'Castle', score: '500' }]
			}
		];
		const posts = [
			{ ...post('draft-post'), image: '/i.png', preview: 'p', draft: true },
			{ ...post('live-post'), draft: false }
		];
		const workItem = {
			title: 'W',
			description: 'D',
			image: '/w.png',
			link: '/x',
			platforms: ['PC', 'Mac']
		};

		updateSection('home', home);
		updateSection('contact', { links });
		updateSection('press', { items });
		updateSection('pinball', { machines });
		for (const blogPost of posts) createPost(blogPost);
		updateSection('works', { items: [{ id: '', ...workItem }] });

		const content = readContent();
		expect(content.home).toEqual(home);
		expect(content.contact.links).toEqual(links);
		expect(content.press.items).toEqual(items);
		expect(content.pinball.machines).toEqual(machines);
		expect(content.blog.posts).toEqual(posts);
		expect(content.works.items[0]).toMatchObject(workItem);
	});

	it('only changes the target section', () => {
		updateSection('press', { items: [press('Kept')] });
		createPost(post('kept'));
		saveHeadlineForPage('blog', 'Kept', '');

		updateSection('home', { ...emptyHome, name: 'Ada' });

		const content = readContent();
		expect(content.home.name).toBe('Ada');
		expect(content.press.items.map((item) => item.title)).toEqual(['Kept']);
		expect(slugs()).toEqual(['kept']);
		expect(getHeadlineForPage('blog').headline).toBe('Kept');
	});

	it('replaces a section with the submitted rows, in the submitted order', () => {
		updateSection('press', { items: [press('Old'), press('Older')] });
		updateSection('press', { items: [press('B'), press('A')] });

		expect(readContent().press.items.map((item) => item.title)).toEqual(['B', 'A']);
	});

	it('can empty a section', () => {
		updateSection('press', { items: [press('Old')] });
		updateSection('press', { items: [] });
		expect(readContent().press.items).toEqual([]);
	});

	it('keeps the previous rows when saving fails partway through', () => {
		updateSection('press', { items: [press('Kept')] });
		const invalid = { ...press('Bad'), title: null } as unknown as ReturnType<typeof press>;

		expect(() => updateSection('press', { items: [press('New'), invalid] })).toThrow();

		// Another write drops the cache, so this reads what the failed save left in the table.
		saveHeadlineForPage('any', '', '');
		expect(readContent().press.items.map((item) => item.title)).toEqual(['Kept']);
	});

	it('keeps work ids stable across saves and assigns new ids to new or duplicate rows', () => {
		updateSection('works', { items: [work('A'), work('B')] });
		const [a, b] = readContent().works.items;

		updateSection('works', {
			items: [work('B renamed', b.id), work('A', a.id), work('New'), work('Dup', a.id)]
		});

		const items = readContent().works.items;
		expect(items.map((item) => item.title)).toEqual(['B renamed', 'A', 'New', 'Dup']);
		expect(items[0].id).toBe(b.id);
		expect(items[1].id).toBe(a.id);
		expect(new Set(items.map((item) => item.id)).size).toBe(4);
	});

	it('does not let a new work take the id of an existing one listed after it', () => {
		updateSection('works', { items: [work('A')] });
		const [a] = readContent().works.items;

		updateSection('works', { items: [work('New'), work('A', a.id)] });

		const [created, kept] = readContent().works.items;
		expect(kept.id).toBe(a.id);
		expect(created.id).not.toBe(a.id);
	});

	it.each(['abc', '0', '-3', '1.5', 'Infinity'])('ignores the invalid work id %j', (id) => {
		updateSection('works', { items: [work('W', id)] });

		const saved = Number(readContent().works.items[0].id);
		expect(Number.isInteger(saved)).toBe(true);
		expect(saved).toBeGreaterThan(0);
	});
});

describe('page headlines', () => {
	it('returns empty strings for a page with no saved headline', () => {
		expect(getHeadlineForPage('works')).toEqual({ headline: '', subtitle: '' });
	});

	it('saves one page without touching the others', () => {
		saveHeadlineForPage('works', 'My Works', 'Things I made');
		saveHeadlineForPage('press', 'Press', 'In the news');
		saveHeadlineForPage('works', 'Works', '');

		expect(getHeadlineForPage('works')).toEqual({ headline: 'Works', subtitle: '' });
		expect(getHeadlineForPage('press')).toEqual({ headline: 'Press', subtitle: 'In the news' });
		expect(testDb.prepare('SELECT COUNT(*) AS n FROM page_headlines').get()).toEqual({ n: 2 });
	});
});

describe('blog posts', () => {
	it('appends new posts in order and rejects a duplicate slug', () => {
		expect(createPost(post('first'))).toBe(true);
		expect(createPost(post('second'))).toBe(true);
		expect(createPost(post('first', 'Imposter'))).toBe(false);

		expect(slugs()).toEqual(['first', 'second']);
		expect(readContent().blog.posts[0].title).toBe('first');
	});

	it('keeps the draft flag of a new post', () => {
		createPost({ ...post('hidden'), draft: true });
		expect(readContent().blog.posts[0].draft).toBe(true);
	});

	it('updates one post in place, keeping its id, position and the other posts', () => {
		createPost(post('first'));
		createPost(post('second'));
		const idBefore = postId('first');

		expect(updatePost('first', { ...fields('Renamed'), draft: true })).toBe(true);

		const [first, second] = readContent().blog.posts;
		expect(first).toMatchObject({ slug: 'first', title: 'Renamed', draft: true });
		expect(second).toMatchObject({ slug: 'second', title: 'second', draft: false });
		expect(postId('first')).toBe(idBefore);
	});

	it('reports a missing post instead of creating one', () => {
		expect(updatePost('ghost', fields('ghost'))).toBe(false);
		expect(deletePost('ghost')).toBe(false);
		expect(slugs()).toEqual([]);
	});

	it('deletes only the requested post', () => {
		createPost(post('first'));
		createPost(post('second'));

		expect(deletePost('first')).toBe(true);
		expect(slugs()).toEqual(['second']);
	});
});
