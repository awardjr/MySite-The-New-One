import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { decryptSecret, encryptSecret, isEncryptionKeyConfigured } from '#lib/server/secretbox.js';

const KEY = 'k'.repeat(32);
const OTHER_KEY = 'o'.repeat(32);

beforeEach(() => {
	vi.stubEnv('TOTP_ENCRYPTION_KEY', KEY);
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('encryption key configuration', () => {
	it.each([
		['', false],
		['k'.repeat(31), false],
		['k'.repeat(32), true],
		// The minimum is measured in bytes: this is 16 characters but 32 bytes.
		['é'.repeat(16), true]
	])('classifies the key %j as usable: %s', (key, usable) => {
		vi.stubEnv('TOTP_ENCRYPTION_KEY', key);

		expect(isEncryptionKeyConfigured()).toBe(usable);
		if (usable) expect(decryptSecret(encryptSecret('secret'))).toBe('secret');
		else expect(() => encryptSecret('secret')).toThrow('TOTP_ENCRYPTION_KEY');
	});
});

describe('encryptSecret and decryptSecret', () => {
	it('round-trips text without exposing it', () => {
		const encrypted = encryptSecret('JBSWY3DPEHPK3PXP-é');

		expect(encrypted).toMatch(/^v1:/);
		expect(encrypted).not.toContain('JBSWY3DPEHPK3PXP');
		expect(decryptSecret(encrypted)).toBe('JBSWY3DPEHPK3PXP-é');
	});

	it('uses a fresh nonce for every encryption', () => {
		expect(encryptSecret('same')).not.toBe(encryptSecret('same'));
	});

	it('follows a changed key instead of caching the old one', () => {
		const encrypted = encryptSecret('secret');

		vi.stubEnv('TOTP_ENCRYPTION_KEY', OTHER_KEY);
		expect(() => decryptSecret(encrypted)).toThrow();
		expect(decryptSecret(encryptSecret('other'))).toBe('other');

		vi.stubEnv('TOTP_ENCRYPTION_KEY', KEY);
		expect(decryptSecret(encrypted)).toBe('secret');
	});

	it.each([1, 2, 3])('detects tampering with part %i', (part) => {
		const parts = encryptSecret('secret').split(':');
		const bytes = Buffer.from(parts[part], 'base64');
		bytes[0] ^= 1;
		parts[part] = bytes.toString('base64');

		expect(() => decryptSecret(parts.join(':'))).toThrow();
	});

	it.each(['plaintext', 'v2:AAAA:AAAA:AAAA', 'v1:AAAA:AAAA', 'v1:AAAA:AAAA:AAAA'])(
		'rejects the malformed value %s',
		(value) => {
			expect(() => decryptSecret(value)).toThrow(/encrypted secret/);
		}
	);
});
