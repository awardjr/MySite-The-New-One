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
	it('needs at least 32 bytes', () => {
		for (const key of ['', 'k'.repeat(31)]) {
			vi.stubEnv('TOTP_ENCRYPTION_KEY', key);
			expect(isEncryptionKeyConfigured(), key).toBe(false);
			expect(() => encryptSecret('secret'), key).toThrow('TOTP_ENCRYPTION_KEY');
		}

		// The minimum is measured in bytes: this is 16 characters but 32 bytes.
		vi.stubEnv('TOTP_ENCRYPTION_KEY', 'é'.repeat(16));
		expect(isEncryptionKeyConfigured()).toBe(true);
		expect(decryptSecret(encryptSecret('secret'))).toBe('secret');
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

	it('detects tampering with any part', () => {
		for (const part of [1, 2, 3]) {
			const parts = encryptSecret('secret').split(':');
			const bytes = Buffer.from(parts[part], 'base64');
			bytes[0] ^= 1;
			parts[part] = bytes.toString('base64');

			expect(() => decryptSecret(parts.join(':')), `part ${part}`).toThrow();
		}
	});

	it('rejects malformed values', () => {
		const otherVersion = encryptSecret('secret').replace(/^v1:/, 'v2:');
		for (const value of ['plaintext', otherVersion, 'v1:AAAA:AAAA', 'v1:AAAA:AAAA:AAAA']) {
			expect(() => decryptSecret(value), value).toThrow(/encrypted secret/);
		}
	});
});
