import { describe, expect, it } from 'vitest';
import { parseJsonArray, sanitizePostHtml } from '../src/lib/server/content/utils';

describe('parseJsonArray', () => {
	it('parses a valid JSON array', () => {
		expect(parseJsonArray<string>('["a","b"]')).toEqual(['a', 'b']);
	});

	it('returns an empty array for invalid JSON', () => {
		expect(parseJsonArray('not json')).toEqual([]);
	});

	it('returns an empty array when the parsed value is not an array', () => {
		expect(parseJsonArray('{"a":1}')).toEqual([]);
	});

	it('returns an empty array for an empty string', () => {
		expect(parseJsonArray('')).toEqual([]);
	});
});

describe('sanitizePostHtml', () => {
	it('keeps allowed formatting tags', () => {
		const dirty = '<p>Hello <strong>world</strong></p>';
		expect(sanitizePostHtml(dirty)).toBe('<p>Hello <strong>world</strong></p>');
	});

	it('strips script tags', () => {
		const dirty = '<p>Hi</p><script>alert(1)</script>';
		expect(sanitizePostHtml(dirty)).toBe('<p>Hi</p>');
	});

	it('allows img tags with permitted attributes', () => {
		const dirty = '<img src="/uploads/a.png" alt="a" width="10" onerror="alert(1)">';
		const clean = sanitizePostHtml(dirty);
		expect(clean).toContain('src="/uploads/a.png"');
		expect(clean).toContain('alt="a"');
		expect(clean).not.toContain('onerror');
	});

	it('strips disallowed schemes from links', () => {
		const dirty = '<a href="javascript:alert(1)">click</a>';
		const clean = sanitizePostHtml(dirty);
		expect(clean).not.toContain('javascript:');
	});

	it('forces rel="noopener noreferrer" on links that open in a new tab', () => {
		const dirty = '<a href="https://example.com" target="_blank">click</a>';
		const clean = sanitizePostHtml(dirty);
		expect(clean).toContain('rel="noopener noreferrer"');
	});

	it('leaves rel untouched on links that do not open in a new tab', () => {
		const dirty = '<a href="https://example.com">click</a>';
		const clean = sanitizePostHtml(dirty);
		expect(clean).not.toContain('rel=');
	});

	it('marks post images to load lazily', () => {
		const clean = sanitizePostHtml('<img src="/uploads/a.png" alt="a">');
		expect(clean).toContain('loading="lazy"');
		expect(clean).toContain('decoding="async"');
	});

	it('keeps the layout styles the editor emits', () => {
		expect(sanitizePostHtml('<p style="text-align:center">Hi</p>')).toBe(
			'<p style="text-align:center">Hi</p>'
		);
		expect(
			sanitizePostHtml('<figure class="image image_resized" style="width:50%"></figure>')
		).toBe('<figure class="image image_resized" style="width:50%"></figure>');
		expect(sanitizePostHtml('<ol style="list-style-type:lower-alpha"><li>a</li></ol>')).toContain(
			'list-style-type:lower-alpha'
		);
	});

	it('drops every other style declaration', () => {
		const clean = sanitizePostHtml(
			'<p style="text-align:center;position:fixed;background:url(https://evil.test/x)">Hi</p>'
		);
		expect(clean).toBe('<p style="text-align:center">Hi</p>');
		expect(sanitizePostHtml('<p style="width:expression(alert(1))">Hi</p>')).toBe('<p>Hi</p>');
	});

	it('strips editor features the public page cannot render', () => {
		expect(
			sanitizePostHtml('<figure class="media"><oembed url="https://x.test"></oembed></figure>')
		).toBe('<figure class="media"></figure>');
		expect(sanitizePostHtml('<label><input type="checkbox">Task</label>')).toBe('Task');
	});
});
