import { describe, expect, it } from 'vitest';
import { raw, readJsonRows, safeUrl, text, textList } from '#lib/server/forms.js';
import { formData } from './route-helpers';

describe('readJsonRows', () => {
	it('parses a JSON array field', () => {
		const data = formData({ rows: '[{"a":1},{"b":2}]' });
		expect(readJsonRows(data, 'rows')).toEqual([{ a: 1 }, { b: 2 }]);
	});

	it('defaults to an empty array when the field is missing', () => {
		expect(readJsonRows(formData(), 'rows')).toEqual([]);
	});

	it.each([
		'not json',
		'',
		'{"a":1}',
		'null',
		'"text"',
		'[null]',
		'[1]',
		'["a"]',
		'[[]]',
		'[{"a":1},null]'
	])('returns null for %j', (value) => {
		expect(readJsonRows(formData({ rows: value }), 'rows')).toBeNull();
	});
});

describe('raw', () => {
	it('returns a field exactly as submitted, so passwords are not altered', () => {
		expect(raw(formData({ password: '  spaced  ' }), 'password')).toBe('  spaced  ');
	});

	it('returns an empty string for a missing field', () => {
		expect(raw(formData(), 'password')).toBe('');
	});
});

describe('text', () => {
	it('trims a string value', () => {
		expect(text('  hello \n')).toBe('hello');
	});

	it('coerces nullish values to an empty string', () => {
		expect(text(null)).toBe('');
		expect(text(undefined)).toBe('');
	});

	it('coerces non-string values to a string', () => {
		expect(text(42)).toBe('42');
		expect(text(0)).toBe('0');
	});
});

describe('safeUrl', () => {
	it.each([
		[' https://example.com ', 'https://example.com'],
		['HTTPS://example.com', 'HTTPS://example.com'],
		['http://example.com', 'http://example.com'],
		['mailto:me@example.com', 'mailto:me@example.com'],
		['tel:+15551234', 'tel:+15551234'],
		['/works#work-1', '/works#work-1'],
		['#section', '#section'],
		['example.com/page', 'example.com/page'],
		['/path?next=javascript:alert(1)', '/path?next=javascript:alert(1)'],
		['', '']
	])('keeps %j', (input, expected) => {
		expect(safeUrl(input)).toBe(expected);
	});

	it.each([
		'javascript:alert(1)',
		'JavaScript:alert(1)',
		' javascript:alert(1)',
		'java\tscript:alert(1)',
		'java\nscript:alert(1)',
		'java script:alert(1)',
		'\u0001javascript:alert(1)',
		'data:text/html,<script>alert(1)</script>',
		'vbscript:msgbox(1)',
		'file:///etc/passwd',
		'blob:https://example.com/id'
	])('drops %j', (input) => {
		expect(safeUrl(input)).toBe('');
	});
});

describe('textList', () => {
	it('trims and filters out empty entries', () => {
		expect(textList([' a ', '', '  ', 'b', null])).toEqual(['a', 'b']);
	});

	it('returns an empty array for non-array input', () => {
		expect(textList('not an array')).toEqual([]);
		expect(textList(undefined)).toEqual([]);
	});
});
