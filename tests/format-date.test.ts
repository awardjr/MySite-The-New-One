import { describe, expect, it } from 'vitest';
import { formatDate } from '#lib/formatDate.js';

describe('formatDate', () => {
	it('spells out a stored date without shifting the day', () => {
		expect(formatDate('2026-01-03')).toBe('January 3, 2026');
		expect(formatDate('2024-12-31')).toBe('December 31, 2024');
	});

	it('leaves anything else unchanged', () => {
		for (const value of ['', 'Spring 2026', '2026-13-45']) {
			expect(formatDate(value), value).toBe(value);
		}
	});
});
