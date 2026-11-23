import { describe, expect, it } from 'vitest';
import { srcset } from '#lib/responsiveImage.js';

describe('srcset', () => {
	it('lists the smaller copies of an uploaded image, then the image itself', () => {
		expect(srcset('/uploads/1795219054666-6507aae6eb7e-1920.webp')).toBe(
			[320, 640, 960, 1280, 1920]
				.map((width) => `/uploads/1795219054666-6507aae6eb7e-${width}.webp ${width}w`)
				.join(', ')
		);
		expect(srcset('/uploads/1-0123456789ab-700.webp')).toBe(
			'/uploads/1-0123456789ab-320.webp 320w, /uploads/1-0123456789ab-640.webp 640w, /uploads/1-0123456789ab-700.webp 700w'
		);
	});

	it('leaves images without smaller copies alone', () => {
		for (const src of [
			'',
			'/uploads/1-0123456789ab-300.webp',
			'/uploads/1-0123456789ab.webp',
			'/uploads/1-0123456789ab.gif',
			'/uploads/1-0123456789ab.svg',
			'https://example.com/uploads/1-0123456789ab-1920.webp',
			'/uploads/1-0123456789ab-1920.webp?x'
		]) {
			expect(srcset(src), src).toBeUndefined();
		}
	});
});
