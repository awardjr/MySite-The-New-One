import { getTestDb } from './test-db';
import { createAdmin, guardLogin, normalizeRecoveryKey, verifySecret } from '#lib/server/auth.js';

const DEFAULT_RECOVERY_KEY = 'FFFF-EEEE-DDDD-CCCC';

/** Replaces the admin account. Test files using this must mock the `db` module. */
export async function seedAdmin(
	username: string,
	email: string,
	password: string,
	recoveryKey = DEFAULT_RECOVERY_KEY
): Promise<void> {
	getTestDb().exec('DELETE FROM admin_user');
	await createAdmin(username, email, password, recoveryKey);
}

/** Checks a recovery key against the stored hash without using it up. */
export async function recoveryKeyMatches(candidate: unknown): Promise<boolean> {
	if (typeof candidate !== 'string') return false;
	const row = getTestDb().prepare('SELECT recovery_key_hash FROM admin_user').get() as
		{ recovery_key_hash: string } | undefined;
	if (!row) return false;
	return verifySecret(normalizeRecoveryKey(candidate), row.recovery_key_hash);
}

/** Uses up an address's login attempts. */
export async function lockLogin(address: string): Promise<void> {
	for (let i = 0; i < 5; i++) await guardLogin(address, async () => false);
}
