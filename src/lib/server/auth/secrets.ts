import crypto from 'node:crypto';

const SCRYPT_KEY_LENGTH = 64;

function scrypt(secret: string, salt: string): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		crypto.scrypt(secret, salt, SCRYPT_KEY_LENGTH, (error, derived) =>
			error ? reject(error) : resolve(derived)
		);
	});
}

/** Hashes a password or recovery key for storage as `salt:hash`. Runs off the event loop. */
export async function hashSecret(secret: string): Promise<string> {
	const salt = crypto.randomBytes(16).toString('hex');
	const derived = await scrypt(secret, salt);
	return `${salt}:${derived.toString('hex')}`;
}

/** Checks a password or recovery key against a value produced by `hashSecret`. */
export async function verifySecret(secret: string, stored: string): Promise<boolean> {
	const [salt, derivedHex] = stored.split(':');
	if (!salt || !derivedHex) return false;
	const derived = await scrypt(secret, salt);
	const expected = Buffer.from(derivedHex, 'hex');
	if (derived.length !== expected.length) return false;
	return crypto.timingSafeEqual(derived, expected);
}

/** Generates a random 256-bit token for a session, reset link or login challenge. */
export function newToken(): string {
	return crypto.randomBytes(32).toString('hex');
}

/**
 * Hashes a random token for storage, so a leaked database or backup doesn't contain usable
 * session ids or reset links. Tokens are already high-entropy, so a fast hash is enough.
 */
export function hashToken(token: string): string {
	return crypto.createHash('sha256').update(token).digest('hex');
}

/** Compares two strings without leaking where they differ through timing. */
export function safeEqual(a: string, b: string): boolean {
	return crypto.timingSafeEqual(
		crypto.createHash('sha256').update(a).digest(),
		crypto.createHash('sha256').update(b).digest()
	);
}

/** Generates a human-friendly uppercase recovery key in groups of 4 (e.g. 4A8F-9C12-E7B0-3D5F). */
export function generateRecoveryKey(): string {
	const raw = crypto.randomBytes(8).toString('hex').toUpperCase();
	return raw.match(/.{1,4}/g)?.join('-') ?? raw;
}

/** Normalizes a recovery key candidate by removing whitespace, hyphens, and converting to uppercase. */
export function normalizeRecoveryKey(key: string): string {
	return key
		.trim()
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, '');
}
