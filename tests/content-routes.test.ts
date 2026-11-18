import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/server/db.js', async () => {
	const { getTestDb } = await import('./test-db');
	return { db: getTestDb() };
});

import { loadPage, outcome, submit } from './route-helpers';
import { getTestDb } from './test-db';
import {
	createPost,
	getHeadlineForPage,
	readContent,
	saveHeadlineForPage,
	updateSection,
	type Post
} from '#lib/server/content.js';
import * as rootLayout from '../src/routes/+layout.server';
import * as homePage from '../src/routes/+page.server';
import * as blogPage from '../src/routes/blog/+page.server';
import * as pressPage from '../src/routes/press/+page.server';
import * as postPage from '../src/routes/blog/[slug]/+page.server';
import { GET as rss } from '../src/routes/blog/rss.xml/+server';
import * as adminHome from '../src/routes/admin/(app)/home/+page.server';
import * as adminWorks from '../src/routes/admin/(app)/works/+page.server';
import * as adminPress from '../src/routes/admin/(app)/press/+page.server';
import * as adminContact from '../src/routes/admin/(app)/contact/+page.server';
import * as adminPinball from '../src/routes/admin/(app)/pinball/+page.server';
import * as adminBlog from '../src/routes/admin/(app)/blog/+page.server';
import * as adminNewPost from '../src/routes/admin/(app)/blog/new/+page.server';
import * as adminEditPost from '../src/routes/admin/(app)/blog/[slug]/+page.server';

const testDb = getTestDb();

type HomeData = {
	featuredPosts: { slug: string; title: string; preview: string }[];
	featuredWorks: { title: string }[];
};
type PostData = { post: Post };

const post = (slug: string, overrides: Partial<Parameters<typeof createPost>[0]> = {}) => ({
	slug,
	title: `Title ${slug}`,
	date: '2024-01-02',
	image: `/${slug}.png`,
	preview: `Preview ${slug}`,
	content: `<p>Body ${slug}</p>`,
	draft: false,
	...overrides
});
const emptyHome = {
	name: '',
	tagline: '',
	photoSrc: '',
	introParagraphs: [],
	featuredPosts: [],
	featuredWorks: []
};
const json = (value: unknown) => JSON.stringify(value);

beforeEach(() => {
	vi.stubEnv('ORIGIN', '');
	testDb.exec(`
		DELETE FROM links;
		DELETE FROM works;
		DELETE FROM press;
		DELETE FROM pinball_machines;
		DELETE FROM posts;
		DELETE FROM page_headlines;
	`);
	updateSection('home', emptyHome);
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('main menu sections', () => {
	const sections = () =>
		(rootLayout.load as () => { sections: Record<string, boolean> })().sections;

	it('reports every section as empty when there is no content', () => {
		expect(sections()).toEqual({
			blog: false,
			press: false,
			works: false,
			pinball: false,
			contact: false
		});
	});

	it('reports a section once it has content', () => {
		updateSection('press', [{ outlet: 'Outlet', title: 'Title', summary: '', href: '', date: '' }]);

		expect(sections()).toMatchObject({ press: true, works: false });
	});

	it('does not count draft posts as blog content', () => {
		createPost(post('hidden', { draft: true }));
		expect(sections().blog).toBe(false);

		createPost(post('visible'));
		expect(sections().blog).toBe(true);
	});
});

describe('home page', () => {
	const work = (title: string, description = '') => ({
		id: '',
		title,
		description,
		image: '',
		link: '',
		platforms: []
	});

	it('shows featured items in the chosen order, skipping drafts and deleted items', async () => {
		createPost(post('one'));
		createPost(post('two'));
		createPost(post('secret', { draft: true }));
		updateSection('works', [work('First'), work('Second')]);
		const [first, second] = readContent().works;
		updateSection('home', {
			...emptyHome,
			featuredPosts: ['two', 'secret', 'deleted', 'one'],
			featuredWorks: [second.id, '99999', first.id]
		});

		const { data } = await loadPage<HomeData>(homePage.load);

		expect(data.featuredPosts.map((p) => p.slug)).toEqual(['two', 'one']);
		expect(data.featuredWorks.map((w) => w.title)).toEqual(['Second', 'First']);
	});

	it('shortens long card text only past its limit', async () => {
		createPost(post('exact', { title: 'a'.repeat(100), preview: 'b'.repeat(200) }));
		createPost(post('long', { title: 'a'.repeat(101), preview: `${'b'.repeat(199)} cc` }));
		updateSection('home', { ...emptyHome, featuredPosts: ['exact', 'long'] });

		const [exact, long] = (await loadPage<HomeData>(homePage.load)).data.featuredPosts;

		expect(exact.title).toBe('a'.repeat(100));
		expect(exact.preview).toBe('b'.repeat(200));
		expect(long.title).toBe(`${'a'.repeat(100)}…`);
		expect(long.preview).toBe(`${'b'.repeat(199)}…`);
	});

	it('does not send full post bodies to the page', async () => {
		createPost(post('one'));
		updateSection('home', { ...emptyHome, featuredPosts: ['one'] });

		expect((await loadPage<HomeData>(homePage.load)).data.featuredPosts[0]).not.toHaveProperty(
			'content'
		);
	});
});

describe('public blog', () => {
	beforeEach(() => {
		createPost(post('published'));
		createPost(post('secret', { draft: true }));
	});

	it('lists only published posts, without their bodies', async () => {
		saveHeadlineForPage('blog', 'Writing', 'Notes');

		const { data } = await loadPage(blogPage.load);

		expect(data.headline).toBe('Writing');
		expect(data.subtitle).toBe('Notes');
		expect(data.posts).toEqual([
			{
				slug: 'published',
				title: 'Title published',
				date: '2024-01-02',
				image: '/published.png',
				preview: 'Preview published'
			}
		]);
	});

	it('serves a published post to everyone', async () => {
		const result = await loadPage<PostData>(postPage.load, {
			params: { slug: 'published' },
			locals: {}
		});
		expect(result.data.post.title).toBe('Title published');
	});

	it('hides drafts from the public but lets the admin preview them', async () => {
		const params = { slug: 'secret' };

		expect(
			await loadPage<PostData>(postPage.load, { params, locals: { isAdmin: false } })
		).toMatchObject({
			kind: 'error',
			status: 404
		});
		const preview = await loadPage<PostData>(postPage.load, { params, locals: { isAdmin: true } });
		expect(preview.data.post.slug).toBe('secret');
	});

	it('lists posts newest first, then by most recently added', async () => {
		createPost(post('older', { date: '2023-12-31' }));
		createPost(post('newest', { date: '2024-03-01' }));
		createPost(post('same-day', { date: '2024-01-02' }));

		const { data } = await loadPage<{ posts: { slug: string }[] }>(blogPage.load);

		expect(data.posts.map((p) => p.slug)).toEqual(['newest', 'same-day', 'published', 'older']);
	});

	it('returns 404 for an unknown post, even to the admin', async () => {
		const result = await loadPage<PostData>(postPage.load, {
			params: { slug: 'missing' },
			locals: { isAdmin: true }
		});
		expect(result).toMatchObject({ kind: 'error', status: 404 });
	});
});

describe('press page', () => {
	it('lists items newest first, with undated items last', async () => {
		const item = (title: string, date: string) => ({
			outlet: '',
			title,
			summary: '',
			href: '',
			date
		});
		updateSection('press', [
			item('Undated', ''),
			item('Older', '2023-12-31'),
			item('Newest', '2024-03-01')
		]);

		const { data } = await loadPage<{ items: { title: string }[] }>(pressPage.load);

		expect(data.items.map((i) => i.title)).toEqual(['Newest', 'Older', 'Undated']);
		expect(readContent().press[0].title).toBe('Undated');
	});
});

describe('RSS feed', () => {
	const feed = async (url = 'https://request.test/blog/rss.xml') => {
		const response = rss({ url: new URL(url) } as never) as Response;
		return { response, xml: await response.text() };
	};

	it('publishes only non-draft posts as XML', async () => {
		createPost(post('published'));
		createPost(post('secret', { draft: true }));

		const { response, xml } = await feed();

		expect(response.headers.get('Content-Type')).toBe('application/xml; charset=utf-8');
		expect(xml).toContain('<link>https://request.test/blog/published</link>');
		expect(xml).not.toContain('secret');
	});

	it('lists the newest post first', async () => {
		createPost(post('older', { date: '2023-12-31' }));
		createPost(post('newer', { date: '2024-03-01' }));

		const { xml } = await feed();

		expect(xml.indexOf('/blog/newer<')).toBeLessThan(xml.indexOf('/blog/older<'));
	});

	it('escapes markup in titles, previews and the site name', async () => {
		updateSection('home', { ...emptyHome, name: 'A&B' });
		createPost(post('p', { title: '<b>T</b> & "q"', preview: '</description><evil>' }));

		const { xml } = await feed();

		expect(xml).toContain('<title>&lt;b&gt;T&lt;/b&gt; &amp; &quot;q&quot;</title>');
		expect(xml).toContain('<description>&lt;/description&gt;&lt;evil&gt;</description>');
		expect(xml).toContain('<title>A&amp;B – Blog</title>');
		expect(xml).not.toContain('<evil>');
	});

	it('builds links from ORIGIN instead of the request host', async () => {
		vi.stubEnv('ORIGIN', 'https://configured.test/ignored');
		createPost(post('p'));

		const { xml } = await feed('https://attacker.test/blog/rss.xml');

		expect(xml).toContain('<link>https://configured.test/blog/p</link>');
		expect(xml).not.toContain('attacker.test');
	});

	it('includes a pubDate only for parseable dates', async () => {
		createPost(post('dated', { date: '2024-01-02' }));
		createPost(post('undated', { date: 'someday' }));

		const { xml } = await feed();

		expect(xml.match(/<pubDate>/g)).toHaveLength(1);
		expect(xml).toContain('<pubDate>Tue, 02 Jan 2024 00:00:00 GMT</pubDate>');
		expect(xml).not.toContain('Invalid Date');
	});
});

describe('admin list editors', () => {
	const editors = [
		{ name: 'works', action: adminWorks.actions.save, field: 'items' },
		{ name: 'press', action: adminPress.actions.save, field: 'items' },
		{ name: 'contact', action: adminContact.actions.save, field: 'links' },
		{ name: 'pinball', action: adminPinball.actions.save, field: 'machines' }
	];

	// Which payloads count as malformed is covered by the `readJsonRows` tests.
	it('rejects a malformed payload, leaving stored rows alone', async () => {
		updateSection('press', [{ outlet: 'O', title: 'Kept', summary: '', href: '', date: '' }]);

		for (const { name, action, field } of editors) {
			const result = await submit(action, { fields: { [field]: 'not json' } });
			expect(result, name).toMatchObject({ kind: 'failure', status: 400 });
		}

		expect(readContent().press[0].title).toBe('Kept');
	});

	it('treats a missing payload as an empty list', async () => {
		for (const { name, action } of editors) {
			expect((await submit(action)).data, name).toEqual({ success: true });
		}
	});

	it('cleans works, dropping untitled rows and unsafe links', async () => {
		await submit(adminWorks.actions.save, {
			fields: {
				items: json([
					{
						id: '',
						title: ' Game ',
						description: ' D ',
						image: ' /i.png ',
						link: 'javascript:alert(1)',
						platforms: [' PC ', '', 'Mac']
					},
					{ title: '   ' }
				])
			}
		});

		const items = readContent().works;
		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({
			title: 'Game',
			description: 'D',
			image: '/i.png',
			link: '',
			platforms: ['PC', 'Mac']
		});

		// Saving keeps a row's id, because featured works on the home page point at it.
		const { id } = items[0];
		await submit(adminWorks.actions.save, { fields: { items: json([{ id, title: 'Game' }]) } });
		expect(readContent().works[0].id).toBe(id);
	});

	it('cleans press items, dropping untitled rows and unsafe links', async () => {
		await submit(adminPress.actions.save, {
			fields: {
				items: json([
					{ outlet: ' O ', title: ' T ', summary: ' S ', href: 'data:text/html,x', date: ' D ' },
					{ outlet: 'No title' }
				])
			}
		});

		expect(readContent().press).toEqual([
			{ outlet: 'O', title: 'T', summary: 'S', href: '', date: 'D' }
		]);
	});

	it('keeps only contact links with a label and a safe address', async () => {
		await submit(adminContact.actions.save, {
			fields: {
				links: json([
					{ label: ' Mail ', href: ' mailto:me@example.com ', description: ' Hi ' },
					{ label: 'Unsafe', href: 'javascript:alert(1)' },
					{ label: '', href: 'https://example.com' }
				])
			}
		});

		expect(readContent().contact).toEqual([
			{ label: 'Mail', href: 'mailto:me@example.com', icon: 'link', description: 'Hi' }
		]);
	});

	it('cleans pinball machines and their mode scores', async () => {
		await submit(adminPinball.actions.save, {
			fields: {
				machines: json([
					{
						name: ' Machine ',
						image: ' /m.png ',
						highScore: ' 100 ',
						modeScores: [{ mode: ' Multiball ', score: ' 5 ' }, { mode: ' ', score: '1' }, null]
					},
					{ name: 'No modes', modeScores: 'not a list' },
					{ name: '  ' }
				])
			}
		});

		expect(readContent().pinball).toEqual([
			{
				name: 'Machine',
				image: '/m.png',
				highScore: '100',
				modeScores: [{ mode: 'Multiball', score: '5' }]
			},
			{ name: 'No modes', image: '', highScore: '', modeScores: [] }
		]);
	});
});

describe('admin home editor', () => {
	it('requires a name and leaves the saved content alone', async () => {
		updateSection('home', { ...emptyHome, name: 'Saved' });

		expect(await submit(adminHome.actions.save, { fields: { name: '  ' } })).toMatchObject({
			kind: 'failure',
			status: 400
		});
		expect(readContent().home.name).toBe('Saved');
	});

	it('splits paragraphs on blank lines and saves the featured selections', async () => {
		await submit(adminHome.actions.save, {
			fields: {
				name: ' Ada ',
				tagline: ' Engineer ',
				photoSrc: ' /me.png ',
				introParagraphs: ' First\nstill first \n\n  \n\nSecond\n\n',
				featuredPosts: ['a', 'b'],
				featuredWorks: ['7']
			}
		});

		expect(readContent().home).toEqual({
			name: 'Ada',
			tagline: 'Engineer',
			photoSrc: '/me.png',
			// Form encoding may turn the single line break into CRLF.
			introParagraphs: [expect.stringMatching(/^First\r?\nstill first$/), 'Second'],
			featuredPosts: ['a', 'b'],
			featuredWorks: ['7']
		});
	});
});

describe('page headline forms', () => {
	it('saves a trimmed headline and subtitle for its own page', async () => {
		const result = await submit(adminWorks.actions.saveHeadline, {
			fields: { headline: ' Works ', subtitle: ' Made things ' }
		});

		expect(result.data).toEqual({ headlineSuccess: true });
		expect(getHeadlineForPage('works')).toEqual({ headline: 'Works', subtitle: 'Made things' });
		expect(getHeadlineForPage('press')).toEqual({ headline: '', subtitle: '' });
	});

	it('ignores a subtitle on the headline-only home page', async () => {
		await submit(adminHome.actions.saveHeadline, {
			fields: { headline: 'Hello', subtitle: 'Ignored' }
		});

		expect(getHeadlineForPage('home')).toEqual({ headline: 'Hello', subtitle: '' });
	});
});

describe('admin blog editor', () => {
	const slugs = () => readContent().blog.map((p) => p.slug);
	const create = (fields: Record<string, string>) =>
		submit(adminNewPost.actions.default, { fields });

	it('derives the slug from the slug field or the title', async () => {
		for (const [title, slug, expected] of [
			['Hello, World!', '', 'hello-world'],
			['  --Spaced  Out--  ', '', 'spaced-out'],
			['Ignored title', ' My Custom/Slug ', 'my-custom-slug'],
			['Café Ünï', '', 'caf-n'],
			['New features', '', 'new-features']
		]) {
			expect(await create({ title, slug })).toMatchObject({
				kind: 'redirect',
				location: '/admin/blog'
			});
			expect(slugs().at(-1)).toBe(expected);
		}
	});

	it('stores sanitized content and the draft flag, defaulting missing fields', async () => {
		await create({ title: 'Post', content: '<p>Hi</p><script>alert(1)</script>', draft: 'on' });
		await create({ title: 'Plain' });

		const [first, second] = readContent().blog;
		expect(first).toMatchObject({ content: '<p>Hi</p>', draft: true });
		expect(second).toMatchObject({ date: '', image: '', preview: '', content: '', draft: false });
	});

	it('refuses unusable, taken and reserved slugs, keeping what was typed', async () => {
		createPost(post('taken'));

		const attempts: Record<string, string>[] = [
			{ title: '  ', slug: 'valid' },
			{ title: '!!!' },
			{ title: 'Valid', slug: '***' },
			{ title: 'Other', slug: 'TAKEN' },
			{ title: 'New!' },
			{ title: 'Other', slug: ' NEW ' }
		];

		for (const fields of attempts) {
			const result = await create({ ...fields, preview: 'typed preview' });

			expect(result, JSON.stringify(fields)).toMatchObject({ kind: 'failure', status: 400 });
			expect(result.data.preview).toBe('typed preview');
		}

		expect(slugs()).toEqual(['taken']);
		expect(readContent().blog[0].title).toBe('Title taken');
	});

	it('loads a post for editing, or 404s', async () => {
		createPost(post('one'));
		const load = (slug: string) => loadPage<PostData>(adminEditPost.load, { params: { slug } });

		expect((await load('one')).data.post.slug).toBe('one');
		expect(await load('missing')).toMatchObject({ kind: 'error', status: 404 });
	});

	it('updates a post, including an unpublished draft', async () => {
		createPost(post('one'));

		const result = await submit(adminEditPost.actions.update, {
			params: { slug: 'one' },
			fields: { title: ' New title ', content: '<img src=x onerror=alert(1)>', draft: 'on' }
		});

		expect(result.location).toBe('/admin/blog');
		const [saved] = readContent().blog;
		expect(saved).toMatchObject({ slug: 'one', title: 'New title', draft: true });
		expect(saved.content).not.toContain('onerror');
	});

	it('refuses an update without a title or for a missing post', async () => {
		createPost(post('one'));
		const update = (slug: string, title: string) =>
			submit(adminEditPost.actions.update, { params: { slug }, fields: { title } });

		expect(await update('one', ' ')).toMatchObject({ kind: 'failure', status: 400 });
		expect(readContent().blog[0].title).toBe('Title one');

		expect(await update('gone', 'Title')).toMatchObject({ kind: 'error', status: 404 });
		expect(slugs()).toEqual(['one']);
	});

	it('deletes from the edit page and from the list, which requires a slug', async () => {
		createPost(post('one'));
		createPost(post('two'));

		await outcome(() => adminEditPost.actions.delete({ params: { slug: 'one' } } as never));
		expect(slugs()).toEqual(['two']);

		expect((await submit(adminBlog.actions.delete)).status).toBe(400);
		expect(slugs()).toEqual(['two']);

		await submit(adminBlog.actions.delete, { fields: { slug: ' two ' } });
		expect(slugs()).toEqual([]);
	});
});
