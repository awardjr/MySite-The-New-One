import { describe, expect, it } from 'vitest';
import {
	base32Decode,
	base32Encode,
	generateTotpSecret,
	normalizeTotpCode,
	totpCode,
	totpStep,
	totpUri,
	verifyTotp
} from '#lib/server/totp.js';

// The RFC 6238 SHA-1 test secret, the ASCII string "12345678901234567890".
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890'));

describe('base32', () => {
	it('matches the known encoding and ignores case, spaces and dashes when decoding', () => {
		expect(RFC_SECRET).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
		expect(base32Decode(RFC_SECRET).toString()).toBe('12345678901234567890');
		expect(base32Decode('gezd gnbv-gy3t')).toEqual(base32Decode('GEZDGNBVGY3T'));
	});

	it('round-trips bytes', () => {
		// 20 bytes is a real secret; 21 leaves bits over at the end.
		for (const length of [20, 21]) {
			const bytes = Buffer.from(Array.from({ length }, (_, i) => (i * 37 + 200) % 256));
			expect(base32Decode(base32Encode(bytes))).toEqual(bytes);
		}
	});

	it('rejects characters outside the alphabet', () => {
		expect(() => base32Decode('ABC1')).toThrow('Invalid base32 character');
	});

	it('generates distinct 160-bit secrets', () => {
		const secret = generateTotpSecret();
		expect(secret).toMatch(/^[A-Z2-7]{32}$/);
		expect(base32Decode(secret)).toHaveLength(20);
		expect(generateTotpSecret()).not.toBe(secret);
	});
});

describe('totpCode', () => {
	it('matches the RFC 6238 test vectors (last 6 digits)', () => {
		expect(totpCode(RFC_SECRET, totpStep(59 * 1000))).toBe('287082');
		expect(totpCode(RFC_SECRET, totpStep(1111111109 * 1000))).toBe('081804');
		expect(totpCode(RFC_SECRET, totpStep(1234567890 * 1000))).toBe('005924');
		expect(totpCode(RFC_SECRET, totpStep(2000000000 * 1000))).toBe('279037');
	});

	it('changes on 30-second boundaries', () => {
		expect(totpStep(29_999)).toBe(0);
		expect(totpStep(30_000)).toBe(1);
	});
});

describe('normalizeTotpCode', () => {
	it('strips spaces and accepts only six digits', () => {
		expect(normalizeTotpCode(' 123 456 ')).toBe('123456');
		for (const invalid of ['12345', '1234567', '12345a', '']) {
			expect(normalizeTotpCode(invalid), invalid).toBe('');
		}
	});
});

describe('verifyTotp', () => {
	const now = 1111111109 * 1000;
	const step = totpStep(now);
	const codeAt = (offset: number) => totpCode(RFC_SECRET, step + offset);

	it('accepts the current code and one step of drift either way', () => {
		expect(verifyTotp(RFC_SECRET, codeAt(0), null, now)).toBe(step);
		expect(verifyTotp(RFC_SECRET, codeAt(-1), null, now)).toBe(step - 1);
		expect(verifyTotp(RFC_SECRET, codeAt(1), null, now)).toBe(step + 1);
		expect(verifyTotp(RFC_SECRET, '081 804', null, now)).toBe(step);
	});

	it('rejects codes outside the drift window and malformed input', () => {
		expect(verifyTotp(RFC_SECRET, codeAt(-2), null, now)).toBeNull();
		expect(verifyTotp(RFC_SECRET, codeAt(2), null, now)).toBeNull();
		expect(verifyTotp(RFC_SECRET, '12345', null, now)).toBeNull();
		expect(verifyTotp(RFC_SECRET, 'abcdef', null, now)).toBeNull();
		expect(verifyTotp(RFC_SECRET, '', null, now)).toBeNull();
	});

	it('accepts only steps after the last used one', () => {
		expect(verifyTotp(RFC_SECRET, codeAt(0), step, now)).toBeNull();
		expect(verifyTotp(RFC_SECRET, codeAt(-1), step, now)).toBeNull();
		expect(verifyTotp(RFC_SECRET, codeAt(0), step + 1, now)).toBeNull();
		expect(verifyTotp(RFC_SECRET, codeAt(0), step - 1, now)).toBe(step);
		expect(verifyTotp(RFC_SECRET, codeAt(1), step, now)).toBe(step + 1);
	});
});

describe('totpUri', () => {
	it('builds the otpauth URI authenticator apps expect', () => {
		const uri = totpUri('ABCD', 'me', 'My Site');

		expect(uri.startsWith('otpauth://totp/My%20Site:me?')).toBe(true);
		expect(Object.fromEntries(new URL(uri).searchParams)).toEqual({
			secret: 'ABCD',
			issuer: 'My Site',
			algorithm: 'SHA1',
			digits: '6',
			period: '30'
		});
		expect(totpUri('ABCD', 'a/b?c', 'x:y')).toContain('/x%3Ay:a%2Fb%3Fc?');
	});
});
