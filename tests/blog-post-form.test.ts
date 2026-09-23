import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/content', async () => {
	const { sanitizePostHtml } = await import('../src/lib/server/content/utils');
	return { sanitizePostHtml };
});

import { readPostFields } from '../src/routes/admin/(app)/blog/postForm';

function buildFormData(fields: Record<string, string>): FormData {
	const formData = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		formData.set(key, value);
	}
	return formData;
}

describe('readPostFields', () => {
	it('trims text fields and sanitizes the content HTML', () => {
		const formData = buildFormData({
			title: '  Hello World  ',
			date: '2024-01-01',
			image: '/hero.jpg',
			preview: '  A preview  ',
			content: '<p>Hi</p><script>alert(1)</script>'
		});

		const fields = readPostFields(formData);

		expect(fields.title).toBe('Hello World');
		expect(fields.preview).toBe('A preview');
		expect(fields.content).toBe('<p>Hi</p>');
	});

	it('treats a missing draft field as false', () => {
		const formData = buildFormData({ title: 'Post' });
		expect(readPostFields(formData).draft).toBe(false);
	});

	it('treats draft="on" as true', () => {
		const formData = buildFormData({ title: 'Post', draft: 'on' });
		expect(readPostFields(formData).draft).toBe(true);
	});

	it('defaults missing text fields to empty strings', () => {
		const formData = new FormData();
		const fields = readPostFields(formData);

		expect(fields.title).toBe('');
		expect(fields.date).toBe('');
		expect(fields.image).toBe('');
		expect(fields.preview).toBe('');
		expect(fields.content).toBe('');
	});
});
