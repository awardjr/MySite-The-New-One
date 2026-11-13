import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/server/db', async () => {
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
} from '../src/lib/server/content';

const testDb = getTestDb();

function resetContentTables(): void {
	testDb.exec(`
		DELETE FROM home;
		DELETE FROM links WHERE id IS NOT NULL;
		DELETE FROM works WHERE id IS NOT NULL;
		DELETE FROM press WHERE id IS NOT NULL;
		DELETE FROM pinball_machines WHERE id IS NOT NULL;
		DELETE FROM posts WHERE slug IS NOT NULL;
		DELETE FROM page_headlines WHERE page IS NOT NULL;
	`);
}

beforeEach(() => {
	resetContentTables();
	// The content controller caches the site content in module state; force a
	// fresh read from the (now-empty) tables for every test.
	updateSection('home', {
		name: '',
		tagline: '',
		photoSrc: '',
		introParagraphs: [],
		featuredPosts: [],
		featuredWorks: []
	});
});

describe('readContent', () => {
	it('returns defaults for every section when the database is empty', () => {
		const content = readContent();

		expect(content.home).toEqual({
			name: '',
			tagline: '',
			photoSrc: '',
			introParagraphs: [],
			featuredPosts: [],
			featuredWorks: []
		});
		expect(content.contact).toEqual({ links: [] });
		expect(content.works).toEqual({ items: [] });
		expect(content.press).toEqual({ items: [] });
		expect(content.pinball).toEqual({ machines: [] });
		expect(content.blog).toEqual({ posts: [] });
	});

	it('caches the result across calls until a section is updated', () => {
		const first = readContent();
		const second = readContent();
		expect(first).toBe(second);
	});
});

describe('updateSection', () => {
	it('only writes to the target section table', () => {
		updateSection('home', {
			name: 'Ada',
			tagline: 'Engineer',
			photoSrc: '/photo.jpg',
			introParagraphs: ['Hello'],
			featuredPosts: [],
			featuredWorks: []
		});

		const content = readContent();
		expect(content.home.name).toBe('Ada');
		expect(content.pinball.machines).toEqual([]);
		expect(content.blog.posts).toEqual([]);
	});

	it('round-trips pinball machines including mode scores', () => {
		updateSection('pinball', {
			machines: [
				{
					name: 'Medieval Madness',
					image: '/mm.jpg',
					highScore: '1,000,000',
					modeScores: [{ mode: 'Castle', score: '500' }]
				}
			]
		});

		const content = readContent();
		expect(content.pinball.machines).toEqual([
			{
				name: 'Medieval Madness',
				image: '/mm.jpg',
				highScore: '1,000,000',
				modeScores: [{ mode: 'Castle', score: '500' }]
			}
		]);
	});

	it('preserves insertion order for list sections', () => {
		updateSection('press', {
			items: [
				{ outlet: 'Venue A', title: 'First', summary: 'a', href: '/a', date: '2024-01-01' },
				{ outlet: 'Venue B', title: 'Second', summary: 'b', href: '/b', date: '' }
			]
		});

		const content = readContent();
		expect(content.press.items.map((item) => item.title)).toEqual(['First', 'Second']);
	});

	it('round-trips blog posts and coerces the draft flag to a boolean', () => {
		updateSection('blog', {
			posts: [
				{
					slug: 'hello-world',
					title: 'Hello World',
					date: '2024-01-01',
					image: '',
					preview: 'preview text',
					content: '<p>content</p>',
					draft: true
				}
			]
		});

		const content = readContent();
		expect(content.blog.posts[0]).toEqual({
			slug: 'hello-world',
			title: 'Hello World',
			date: '2024-01-01',
			image: '',
			preview: 'preview text',
			content: '<p>content</p>',
			draft: true
		});
	});

	it('replaces the previous rows for a section rather than appending to them', () => {
		updateSection('press', {
			items: [{ outlet: 'A', title: 'First', summary: 'a', href: '/a', date: '' }]
		});
		updateSection('press', {
			items: [{ outlet: 'B', title: 'Second', summary: 'b', href: '/b', date: '' }]
		});

		const content = readContent();
		expect(content.press.items).toHaveLength(1);
		expect(content.press.items[0].title).toBe('Second');
	});

	it('refreshes the cache so subsequent reads see the update', () => {
		const before = readContent();
		updateSection('press', {
			items: [{ outlet: 'X', title: 'Changed', summary: 'a', href: '/a', date: '' }]
		});
		const after = readContent();

		expect(before).not.toBe(after);
		expect(after.press.items[0].title).toBe('Changed');
	});

	it('keeps work ids stable across saves and assigns new ids to new or duplicate rows', () => {
		const w = (title: string, id = '') => ({
			id,
			title,
			description: '',
			image: '',
			link: '',
			platforms: []
		});
		updateSection('works', { items: [w('A'), w('B')] });
		const [a, b] = readContent().works.items;

		updateSection('works', {
			items: [w('B renamed', b.id), w('A', a.id), w('New'), w('Dup', a.id)]
		});

		const items = readContent().works.items;
		expect(items[0].id).toBe(b.id);
		expect(items[1].id).toBe(a.id);
		expect(new Set(items.map((i) => i.id)).size).toBe(4);
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

	it('is served from the cached content and refreshed on save', () => {
		saveHeadlineForPage('blog', 'Blog', '');
		const cached = readContent();
		getHeadlineForPage('blog');
		expect(readContent()).toBe(cached);

		saveHeadlineForPage('blog', 'Posts', '');
		expect(readContent()).not.toBe(cached);
		expect(getHeadlineForPage('blog').headline).toBe('Posts');
	});
});

describe('blog posts', () => {
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

	it('appends new posts in order and rejects a duplicate slug', () => {
		expect(createPost(post('first'))).toBe(true);
		expect(createPost(post('second'))).toBe(true);
		expect(createPost(post('first', 'Imposter'))).toBe(false);

		expect(slugs()).toEqual(['first', 'second']);
		expect(readContent().blog.posts[0].title).toBe('first');
	});

	it('updates one post in place, keeping its id, position and the other posts', () => {
		createPost(post('first'));
		createPost(post('second'));
		const idBefore = postId('first');

		expect(updatePost('first', { ...fields('Renamed'), draft: true })).toBe(true);

		const [first, second] = readContent().blog.posts;
		expect(first).toMatchObject({ slug: 'first', title: 'Renamed', draft: true });
		expect(second).toMatchObject({ slug: 'second', title: 'second' });
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
