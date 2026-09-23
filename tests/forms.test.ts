import { describe, expect, it } from 'vitest';
import { readJsonRows, text, textList } from '../src/lib/server/forms';

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

describe('textList', () => {
	it('trims and filters out empty entries', () => {
		expect(textList([' a ', '', '  ', 'b'])).toEqual(['a', 'b']);
	});

	it('returns an empty array for non-array input', () => {
		expect(textList('not an array')).toEqual([]);
		expect(textList(undefined)).toEqual([]);
	});
});
