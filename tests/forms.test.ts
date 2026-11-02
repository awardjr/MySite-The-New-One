import { describe, expect, it } from 'vitest';
import { readJsonRows, safeUrl, text, textList } from '../src/lib/server/forms';

function formDataWith(field: string, value: string): FormData {
	const formData = new FormData();
	formData.set(field, value);
	return formData;
}

describe('readJsonRows', () => {
	it('parses a JSON array field', () => {
		const formData = formDataWith('rows', '[{"a":1},{"b":2}]');
		expect(readJsonRows(formData, 'rows')).toEqual([{ a: 1 }, { b: 2 }]);
	});

	it('defaults to an empty array when the field is missing', () => {
		const formData = new FormData();
		expect(readJsonRows(formData, 'rows')).toEqual([]);
	});

	it('returns null for invalid JSON', () => {
		const formData = formDataWith('rows', 'not json');
		expect(readJsonRows(formData, 'rows')).toBeNull();
	});

	it('returns null when the parsed value is not an array', () => {
		const formData = formDataWith('rows', '{"a":1}');
		expect(readJsonRows(formData, 'rows')).toBeNull();
	});
});

describe('text', () => {
	it('trims a string value', () => {
		expect(text('  hello  ')).toBe('hello');
	});

	it('coerces nullish values to an empty string', () => {
		expect(text(null)).toBe('');
		expect(text(undefined)).toBe('');
	});

	it('coerces non-string values to a string', () => {
		expect(text(42)).toBe('42');
	});
});

describe('safeUrl', () => {
	it('keeps http, https, mailto, tel, relative and scheme-less links', () => {
		expect(safeUrl(' https://example.com ')).toBe('https://example.com');
		expect(safeUrl('http://example.com')).toBe('http://example.com');
		expect(safeUrl('mailto:me@example.com')).toBe('mailto:me@example.com');
		expect(safeUrl('tel:+15551234')).toBe('tel:+15551234');
		expect(safeUrl('/works#work-1')).toBe('/works#work-1');
		expect(safeUrl('example.com/page')).toBe('example.com/page');
	});

	it('drops script and other unsafe schemes, including obfuscated ones', () => {
		expect(safeUrl('javascript:alert(1)')).toBe('');
		expect(safeUrl('JavaScript:alert(1)')).toBe('');
		expect(safeUrl('java\tscript:alert(1)')).toBe('');
		expect(safeUrl('\u0001javascript:alert(1)')).toBe('');
		expect(safeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
		expect(safeUrl('vbscript:msgbox(1)')).toBe('');
	});
});

describe('textList', () => {
	it('trims and filters out empty entries', () => {
		expect(textList([' a ', '', '  ', 'b'])).toEqual(['a', 'b']);
	});

	it('returns an empty array for non-array input', () => {
		expect(textList('not an array')).toEqual([]);
		expect(textList(undefined)).toEqual([]);
	});
});
