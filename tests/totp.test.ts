import { describe, expect, it } from 'vitest';
import {
	base32Decode,
	base32Encode,
	generateTotpSecret,
	totpCode,
	totpStep,
	totpUri,
	verifyTotp
} from '../src/lib/server/totp';

// The RFC 6238 SHA-1 test secret, the ASCII string "12345678901234567890".
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890'));

describe('base32', () => {
	it('round-trips bytes and matches the known encoding', () => {
		expect(RFC_SECRET).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
		expect(base32Decode(RFC_SECRET).toString()).toBe('12345678901234567890');
		expect(base32Decode('gezd gnbv-gy3t')).toEqual(base32Decode('GEZDGNBVGY3T'));
	});

	it('generates 32-character secrets', () => {
		expect(generateTotpSecret()).toMatch(/^[A-Z2-7]{32}$/);
	});
});

describe('totpCode', () => {
	it('matches the RFC 6238 test vectors (last 6 digits)', () => {
		expect(totpCode(RFC_SECRET, totpStep(59 * 1000))).toBe('287082');
		expect(totpCode(RFC_SECRET, totpStep(1111111109 * 1000))).toBe('081804');
		expect(totpCode(RFC_SECRET, totpStep(1234567890 * 1000))).toBe('005924');
		expect(totpCode(RFC_SECRET, totpStep(2000000000 * 1000))).toBe('279037');
	});
});

describe('verifyTotp', () => {
	const now = 1111111109 * 1000;
	const step = totpStep(now);

	it('accepts the current code and one step of drift either way', () => {
		expect(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step), null, now)).toBe(step);
		expect(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step - 1), null, now)).toBe(step - 1);
		expect(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step + 1), null, now)).toBe(step + 1);
		expect(verifyTotp(RFC_SECRET, '081 804', null, now)).toBe(step);
	});

	it('rejects old, malformed and replayed codes', () => {
		expect(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step - 2), null, now)).toBeNull();
		expect(verifyTotp(RFC_SECRET, '12345', null, now)).toBeNull();
		expect(verifyTotp(RFC_SECRET, 'abcdef', null, now)).toBeNull();
		expect(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step), step, now)).toBeNull();
	});
});

describe('totpUri', () => {
	it('builds an otpauth URI with issuer and account', () => {
		const uri = totpUri('ABCD', 'me', 'My Site');
		expect(uri.startsWith('otpauth://totp/My%20Site:me?')).toBe(true);
		const params = new URL(uri).searchParams;
		expect(params.get('secret')).toBe('ABCD');
		expect(params.get('issuer')).toBe('My Site');
		expect(params.get('digits')).toBe('6');
	});
});
