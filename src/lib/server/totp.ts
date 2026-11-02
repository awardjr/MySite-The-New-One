import crypto from 'node:crypto';

// RFC 6238 time-based one-time passwords, compatible with standard authenticator apps.
const STEP_SECONDS = 30;
const DIGITS = 6;
// Accept the previous and next code too, to tolerate clock drift between server and phone.
const DRIFT_STEPS = 1;
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buffer: Buffer): string {
	let bits = 0;
	let value = 0;
	let output = '';
	for (const byte of buffer) {
		value = (value << 8) | byte;
		bits += 8;
		while (bits >= 5) {
			output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}
	if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
	return output;
}

export function base32Decode(input: string): Buffer {
	const clean = input.toUpperCase().replace(/[\s=-]/g, '');
	let bits = 0;
	let value = 0;
	const bytes: number[] = [];
	for (const char of clean) {
		const index = BASE32_ALPHABET.indexOf(char);
		if (index === -1) throw new Error('Invalid base32 character.');
		value = (value << 5) | index;
		bits += 5;
		if (bits >= 8) {
			bytes.push((value >>> (bits - 8)) & 255);
			bits -= 8;
		}
	}
	return Buffer.from(bytes);
}

/** Generates a new random 160-bit secret, base32-encoded as authenticator apps expect. */
export function generateTotpSecret(): string {
	return base32Encode(crypto.randomBytes(20));
}

/** Returns the time step (30-second window number) for a timestamp in milliseconds. */
export function totpStep(now: number = Date.now()): number {
	return Math.floor(now / 1000 / STEP_SECONDS);
}

/** Computes the code for a secret at a given time step. */
export function totpCode(secret: string, step: number): string {
	const counter = Buffer.alloc(8);
	counter.writeBigUInt64BE(BigInt(step));
	const hmac = crypto.createHmac('sha1', base32Decode(secret)).update(counter).digest();
	const offset = hmac[hmac.length - 1] & 0xf;
	const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
	return String(binary % 10 ** DIGITS).padStart(DIGITS, '0');
}

/** Normalizes user input to a bare code, or '' if it isn't a 6-digit code. */
export function normalizeTotpCode(input: string): string {
	const code = input.replace(/\s/g, '');
	return /^\d{6}$/.test(code) ? code : '';
}

/**
 * Checks a code against the secret, allowing one step of clock drift either way.
 * Steps at or before `lastUsedStep` are rejected so a code can't be replayed.
 * Returns the matching step, or null if the code is invalid.
 */
export function verifyTotp(
	secret: string,
	input: string,
	lastUsedStep: number | null = null,
	now: number = Date.now()
): number | null {
	const code = normalizeTotpCode(input);
	if (!code) return null;
	const current = totpStep(now);
	let matched: number | null = null;
	// Check every window without exiting early, so timing doesn't reveal which one matched.
	for (let step = current - DRIFT_STEPS; step <= current + DRIFT_STEPS; step++) {
		const expected = Buffer.from(totpCode(secret, step));
		if (crypto.timingSafeEqual(expected, Buffer.from(code)) && matched === null) {
			matched = step;
		}
	}
	if (matched === null || (lastUsedStep !== null && matched <= lastUsedStep)) return null;
	return matched;
}

/** Builds the otpauth:// URI that authenticator apps read from the setup QR code. */
export function totpUri(secret: string, accountName: string, issuer: string): string {
	const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}`;
	const params = new URLSearchParams({
		secret,
		issuer,
		algorithm: 'SHA1',
		digits: String(DIGITS),
		period: String(STEP_SECONDS)
	});
	return `otpauth://totp/${label}?${params}`;
}
