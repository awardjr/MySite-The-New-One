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
});
