import { describe, expect, it } from 'vitest';
import { parseJsonArray, renderPostHtml, sanitizePostHtml } from '#lib/server/content/utils.js';

describe('parseJsonArray', () => {
	it('parses a valid JSON array', () => {
		expect(parseJsonArray<string>('["a","b"]')).toEqual(['a', 'b']);
	});

	it.each(['', 'not json', '{"a":1}', '"text"', 'null', '1'])(
		'returns an empty array for %j',
		(raw) => {
			expect(parseJsonArray(raw)).toEqual([]);
		}
	);
});

describe('sanitizePostHtml', () => {
	it('keeps allowed formatting tags', () => {
		const html = '<h2>Title</h2><p>Hello <strong>world</strong> <s>old</s></p>';
		expect(sanitizePostHtml(html)).toBe(html);
	});

	it.each([
		['script', '<p>Hi</p><script>alert(1)</script>'],
		['style', '<p>Hi</p><style>p{display:none}</style>'],
		['iframe', '<p>Hi</p><iframe src="https://evil.test"></iframe>'],
		['object', '<p>Hi</p><object data="https://evil.test"></object>'],
		['form', '<form action="https://evil.test"><p>Hi</p></form>']
	])('removes %s elements', (_name, dirty) => {
		expect(sanitizePostHtml(dirty)).toBe('<p>Hi</p>');
	});

	it('removes event handlers from any element', () => {
		expect(sanitizePostHtml('<p onclick="alert(1)">Hi</p>')).toBe('<p>Hi</p>');
		const image = sanitizePostHtml('<img src="/uploads/a.png" alt="a" onerror="alert(1)">');
		expect(image).toContain('src="/uploads/a.png"');
		expect(image).toContain('alt="a"');
		expect(image).not.toContain('onerror');
	});

	it.each([
		'javascript:alert(1)',
		'JaVaScRiPt:alert(1)',
		'java\tscript:alert(1)',
		' javascript:alert(1)',
		'data:text/html,<script>alert(1)</script>',
		'vbscript:msgbox(1)'
	])('removes the unsafe link %j', (href) => {
		const clean = sanitizePostHtml(`<a href="${href}">click</a>`);
		expect(clean).toBe('<a>click</a>');
	});

	it.each(['https://example.com', 'http://example.com', 'mailto:me@example.com', '/blog/post'])(
		'keeps the link %s',
		(href) => {
			expect(sanitizePostHtml(`<a href="${href}">click</a>`)).toBe(`<a href="${href}">click</a>`);
		}
	);

	it('allows images from the web and data URIs, but not script URLs', () => {
		const data = 'data:image/png;base64,AAAA';
		expect(sanitizePostHtml(`<img src="${data}">`)).toContain(`src="${data}"`);
		expect(sanitizePostHtml('<img src="https://example.com/a.png">')).toContain(
			'src="https://example.com/a.png"'
		);
		expect(sanitizePostHtml('<img src="javascript:alert(1)">')).not.toContain('src=');
	});

	it('forces rel="noopener noreferrer" on links that open in a new tab', () => {
		const clean = sanitizePostHtml(
			'<a href="https://example.com" target="_blank" rel="opener">x</a>'
		);
		expect(clean).toContain('rel="noopener noreferrer"');
		expect(clean).not.toContain('rel="opener"');
	});

	it('protects new-tab links whatever the case of the target', () => {
		const clean = sanitizePostHtml('<a href="https://example.com" target="_BLANK">x</a>');
		expect(clean).toContain('rel="noopener noreferrer"');
	});

	it('leaves rel untouched on links that do not open in a new tab', () => {
		expect(sanitizePostHtml('<a href="https://example.com">click</a>')).not.toContain('rel=');
	});

	it('marks post images to load lazily, overriding the submitted values', () => {
		const clean = sanitizePostHtml('<img src="/a.png" loading="eager" decoding="sync">');
		expect(clean).toContain('loading="lazy"');
		expect(clean).toContain('decoding="async"');
		expect(clean).not.toContain('eager');
	});

	it('keeps the layout styles the editor emits', () => {
		for (const html of [
			'<p style="text-align:center">Hi</p>',
			'<p style="margin-left:40px">Hi</p>',
			'<figure class="image image_resized" style="width:50%"></figure>',
			'<ol style="list-style-type:lower-alpha"><li>a</li></ol>'
		]) {
			expect(sanitizePostHtml(html)).toBe(html);
		}
		expect(sanitizePostHtml('<img src="/a.png" style="aspect-ratio:16/9">')).toContain(
			'aspect-ratio:16/9'
		);
	});

	it('drops every other style declaration', () => {
		expect(
			sanitizePostHtml(
				'<p style="text-align:center;position:fixed;background:url(https://evil.test/x)">Hi</p>'
			)
		).toBe('<p style="text-align:center">Hi</p>');
	});

	it.each([
		'width:expression(alert(1))',
		'width:calc(100vw)',
		'margin-left:-100px',
		'text-align:url(x)',
		'list-style-type:url(x)'
	])('drops the unsafe value in %s', (style) => {
		expect(sanitizePostHtml(`<p style="${style}">Hi</p>`)).toBe('<p>Hi</p>');
	});

	it('strips editor features the public page cannot render', () => {
		expect(sanitizePostHtml('<label><input type="checkbox">Task</label>')).toBe('Task');
	});

	it('keeps media embeds for the post page to render', () => {
		const html = '<figure class="media"><oembed url="https://youtu.be/abc"></oembed></figure>';
		expect(sanitizePostHtml(html)).toBe(html);
		expect(sanitizePostHtml('<oembed url="https://youtu.be/abc" onload="alert(1)"></oembed>')).toBe(
			'<oembed url="https://youtu.be/abc"></oembed>'
		);
	});
});

describe('renderPostHtml', () => {
	const render = (url: string) =>
		renderPostHtml(sanitizePostHtml(`<oembed url="${url}"></oembed>`), 'example.com');

	it.each([
		[
			'https://www.youtube.com/watch?v=abc_-1&t=42',
			'https://www.youtube.com/embed/abc_-1?start=42'
		],
		['https://youtu.be/abc', 'https://www.youtube.com/embed/abc'],
		['https://www.youtube.com/shorts/abc', 'https://www.youtube.com/embed/abc'],
		['https://vimeo.com/123456', 'https://player.vimeo.com/video/123456'],
		['https://www.dailymotion.com/video/x8abc', 'https://www.dailymotion.com/embed/video/x8abc'],
		['https://open.spotify.com/track/abc', 'https://open.spotify.com/embed/track/abc'],
		[
			'https://www.twitch.tv/some_channel',
			'https://player.twitch.tv/?channel=some_channel&amp;parent=example.com&amp;autoplay=false'
		],
		[
			'https://www.twitch.tv/videos/123456',
			'https://player.twitch.tv/?video=123456&amp;parent=example.com&amp;autoplay=false'
		],
		[
			'https://www.twitch.tv/some_channel/clip/Funny-Clip_1',
			'https://clips.twitch.tv/embed?clip=Funny-Clip_1&amp;parent=example.com&amp;autoplay=false'
		],
		[
			'https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/post/3n2ozugncr22j',
			'https://embed.bsky.app/embed/did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3n2ozugncr22j?colorMode=system'
		],
		[
			'https://clips.twitch.tv/Funny-Clip_1',
			'https://clips.twitch.tv/embed?clip=Funny-Clip_1&amp;parent=example.com&amp;autoplay=false'
		]
	])('turns %s into its player', (url, src) => {
		const html = render(url);
		expect(html).toMatch(/^<iframe [^>]*><\/iframe>$/);
		expect(html).toContain(`src="${src}"`);
		expect(html).toContain('allowfullscreen=""');
	});

	it.each([
		'https://evil.test/video',
		'javascript:alert(1)',
		'https://www.youtube.com.evil.test/watch?v=a',
		'https://www.twitch.tv/directory/category/chess',
		'https://bsky.app/profile/bsky.app/post/3n2ozugncr22j'
	])('removes the unsupported embed %s', (url) => {
		expect(render(url)).toBe('');
	});

	it('leaves the rest of the post untouched', () => {
		const html =
			'<p>a &amp; b</p><figure class="media"><oembed url="https://vimeo.com/1"></oembed></figure>';
		expect(renderPostHtml(html, 'example.com')).toMatch(
			/^<p>a &amp; b<\/p><figure class="media"><iframe [^>]*><\/iframe><\/figure>$/
		);
	});
});
