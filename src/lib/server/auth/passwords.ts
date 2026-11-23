import { hash, verify } from '@node-rs/argon2';

export function hashSecret(secret: string): Promise<string> {
	return hash(secret);
}

export async function verifySecret(secret: string, stored: string | null | undefined) {
	if (!secret || !stored) return false;
	return verify(stored, secret).catch(() => false);
}
