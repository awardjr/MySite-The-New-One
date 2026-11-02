import crypto from 'node:crypto';
import { env } from '$env/dynamic/private';

const ENCRYPTION_KEY_ENV = 'TOTP_ENCRYPTION_KEY';
const KEY_DERIVATION_SALT = 'mysite-totp-encryption-v1';
const ENCRYPTION_PREFIX = 'v1:';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

let cachedPassphrase: string | undefined;
let cachedKey: Buffer | undefined;

function getEncryptionPassphrase(): string | undefined {
	return process.env[ENCRYPTION_KEY_ENV] || env[ENCRYPTION_KEY_ENV] || undefined;
}

function getEncryptionKey(): Buffer {
	const passphrase = getEncryptionPassphrase();
	if (!passphrase || Buffer.byteLength(passphrase) < KEY_LENGTH) {
		throw new Error(`${ENCRYPTION_KEY_ENV} must be set to at least 32 bytes.`);
	}

	if (passphrase !== cachedPassphrase || !cachedKey) {
		cachedPassphrase = passphrase;
		cachedKey = crypto.scryptSync(passphrase, KEY_DERIVATION_SALT, KEY_LENGTH);
	}
	return cachedKey;
}

/** Returns whether a sufficiently long encryption passphrase is available. */
export function isEncryptionKeyConfigured(): boolean {
	const passphrase = getEncryptionPassphrase();
	return Boolean(passphrase && Buffer.byteLength(passphrase) >= KEY_LENGTH);
}

/** Returns true for secrets written in this module's authenticated ciphertext format. */
export function isEncryptedSecret(value: string): boolean {
	return value.startsWith(ENCRYPTION_PREFIX);
}

/** Encrypts a secret using AES-256-GCM with a fresh random nonce. */
export function encryptSecret(plaintext: string): string {
	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
	const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
	const tag = cipher.getAuthTag();
	return `${ENCRYPTION_PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

/** Decrypts an AES-256-GCM secret, throwing if the key or ciphertext is invalid. */
export function decryptSecret(value: string): string {
	const parts = value.split(':');
	if (parts.length !== 4 || parts[0] !== 'v1') {
		throw new Error('Unsupported encrypted secret format.');
	}

	const iv = Buffer.from(parts[1], 'base64');
	const tag = Buffer.from(parts[2], 'base64');
	const ciphertext = Buffer.from(parts[3], 'base64');
	if (iv.length !== IV_LENGTH || tag.length !== AUTH_TAG_LENGTH) {
		throw new Error('Invalid encrypted secret.');
	}

	const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
