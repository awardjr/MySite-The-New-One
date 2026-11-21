import { describe, expect, it } from 'vitest';
import { linkDestination, linkHost } from '#lib/linkHost.js';

describe('linkHost', () => {
	it('returns the hostname of a web link without www', () => {
		expect(linkHost('https://www.example.com/a/b?c=1')).toBe('example.com');
		expect(linkHost('http://technical.ly/brooklyn')).toBe('technical.ly');
	});

	it('returns null for links that are not web links', () => {
		expect(linkHost('/blog/post')).toBeNull();
		expect(linkHost('mailto:me@example.com')).toBeNull();
		expect(linkHost('https://')).toBeNull();
	});
});

describe('linkDestination', () => {
	it('shows a web link as host and path', () => {
		expect(linkDestination('https://www.linkedin.com/in/someone/')).toBe('linkedin.com/in/someone');
		expect(linkDestination('https://example.com')).toBe('example.com');
	});

	it('shows the address of mailto and tel links', () => {
		expect(linkDestination('mailto:me@example.com?subject=Hi')).toBe('me@example.com');
		expect(linkDestination('tel:+15551234567')).toBe('+15551234567');
	});

	it('is empty for links within the site', () => {
		expect(linkDestination('/resume.pdf')).toBe('');
	});
});
