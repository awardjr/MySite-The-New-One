import { db } from '../db';
import { generateRecoveryKey, hashSecret, normalizeRecoveryKey, verifySecret } from './secrets';

/** The single admin account (row id 1) and the secrets that unlock it. */
export interface AdminUserRow {
	username: string | null;
	email: string | null;
	password_hash: string;
	recovery_key_hash: string | null;
	totp_secret: string | null;
	totp_pending_secret: string | null;
	totp_last_step: number | null;
}

const getAdminStmt = db.prepare(
	'SELECT username, email, password_hash, recovery_key_hash, totp_secret, totp_pending_secret, ' +
		'totp_last_step FROM admin_user WHERE id = 1'
);

const insertAdminStmt = db.prepare(
	'INSERT INTO admin_user (id, username, email, password_hash, recovery_key_hash, updated_at) ' +
		'VALUES (1, @username, @email, @passwordHash, @recoveryKeyHash, @updatedAt)'
);

const upsertAdminCredentialsStmt = db.prepare(
	'INSERT INTO admin_user (id, username, email, password_hash, recovery_key_hash, updated_at) ' +
		'VALUES (1, @username, @email, @passwordHash, @recoveryKeyHash, @updatedAt) ' +
		'ON CONFLICT(id) DO UPDATE SET ' +
		'username = excluded.username, ' +
		'email = excluded.email, ' +
		'password_hash = excluded.password_hash, ' +
		'recovery_key_hash = excluded.recovery_key_hash, ' +
		'updated_at = excluded.updated_at'
);

const updateAdminProfileStmt = db.prepare(
	'UPDATE admin_user SET username = @username, email = @email, updated_at = @updatedAt WHERE id = 1'
);

const updateAdminPasswordStmt = db.prepare(
	'UPDATE admin_user SET password_hash = @passwordHash, updated_at = @updatedAt WHERE id = 1'
);

const updateRecoveryKeyStmt = db.prepare(
	'UPDATE admin_user SET recovery_key_hash = @recoveryKeyHash, updated_at = @updatedAt WHERE id = 1'
);

export function getAdmin(): AdminUserRow | undefined {
	return getAdminStmt.get() as AdminUserRow | undefined;
}

/** Returns true once an admin user has been configured in the database. */
export function isAdminConfigured(): boolean {
	return getAdmin() !== undefined;
}

/** Returns the stored admin username and email. */
export function getAdminProfile(): { username: string; email: string } | null {
	const row = getAdmin();
	if (!row) return null;
	return {
		username: row.username ?? '',
		email: row.email ?? ''
	};
}

async function credentialParams(
	username: string,
	email: string,
	password: string,
	recoveryKey?: string
) {
	const normalizedRecovery = recoveryKey ? normalizeRecoveryKey(recoveryKey) : null;
	return {
		username: username.trim(),
		email: email.trim().toLowerCase(),
		passwordHash: await hashSecret(password),
		recoveryKeyHash: normalizedRecovery ? await hashSecret(normalizedRecovery) : null,
		updatedAt: new Date().toISOString()
	};
}

/**
 * Creates the admin account during first-time setup. Returns false, changing nothing, if an
 * account already exists, so two racing setup requests can't overwrite each other.
 */
export async function createAdmin(
	username: string,
	email: string,
	password: string,
	recoveryKey: string
): Promise<boolean> {
	const params = await credentialParams(username, email, password, recoveryKey);
	// Checked after hashing, in the same synchronous step as the insert.
	if (isAdminConfigured()) return false;
	insertAdminStmt.run(params);
	return true;
}

/** Sets or replaces the admin account credentials including username, email, password, and optional recovery key. */
export async function setAdminCredentials(
	username: string,
	email: string,
	password: string,
	recoveryKey?: string
): Promise<void> {
	upsertAdminCredentialsStmt.run(await credentialParams(username, email, password, recoveryKey));
}

/** Updates the admin username and email address. */
export function updateAdminProfile(username: string, email: string): void {
	updateAdminProfileStmt.run({
		username: username.trim(),
		email: email.trim().toLowerCase(),
		updatedAt: new Date().toISOString()
	});
}

/** Sets (or replaces) the single admin password. */
export async function setAdminPassword(password: string): Promise<void> {
	updateAdminPasswordStmt.run({
		passwordHash: await hashSecret(password),
		updatedAt: new Date().toISOString()
	});
}

/** Checks a submitted password against the stored admin password. */
export async function checkPassword(candidate: string): Promise<boolean> {
	if (!candidate) return false;
	const row = getAdmin();
	if (!row) return false;
	return verifySecret(candidate, row.password_hash);
}

/** Checks submitted login credentials (username/email and password). Both are required. */
export async function checkCredentials(
	identifier: string,
	candidatePassword: string
): Promise<boolean> {
	const normId = identifier.trim().toLowerCase();
	if (!normId || !candidatePassword) return false;
	const row = getAdmin();
	if (!row) return false;

	const idMatches =
		normId === (row.username ?? '').toLowerCase() || normId === (row.email ?? '').toLowerCase();
	// Always hash the password, so response time doesn't reveal whether the identifier matched.
	const passwordMatches = await verifySecret(candidatePassword, row.password_hash);
	return idMatches && passwordMatches;
}

/** Returns true if a recovery key is configured in the database. */
export function hasRecoveryKey(): boolean {
	return Boolean(getAdmin()?.recovery_key_hash);
}

/** Verifies a candidate recovery key against the stored recovery key hash, without using it up. */
export async function verifyRecoveryKey(candidate: string): Promise<boolean> {
	const normalized = normalizeRecoveryKey(candidate);
	if (!normalized) return false;
	const row = getAdmin();
	if (!row?.recovery_key_hash) return false;
	return verifySecret(normalized, row.recovery_key_hash);
}

/** Sets (or updates) the stored recovery key for the admin user. */
export async function setRecoveryKey(key: string): Promise<void> {
	updateRecoveryKeyStmt.run({
		recoveryKeyHash: await hashSecret(normalizeRecoveryKey(key)),
		updatedAt: new Date().toISOString()
	});
}

/** Replaces the recovery key with a freshly generated one and returns it, to be shown once. */
export async function rotateRecoveryKey(): Promise<string> {
	const key = generateRecoveryKey();
	await setRecoveryKey(key);
	return key;
}

/**
 * Uses up a recovery key. A key only works once: on a match it is replaced, and the new key is
 * returned so it can be shown to the admin. Returns null if the candidate doesn't match.
 */
export async function redeemRecoveryKey(candidate: string): Promise<string | null> {
	const normalized = normalizeRecoveryKey(candidate);
	if (!normalized) return null;
	const stored = getAdmin()?.recovery_key_hash;
	if (!stored || !(await verifySecret(normalized, stored))) return null;

	const newKey = generateRecoveryKey();
	const newHash = await hashSecret(normalizeRecoveryKey(newKey));
	// Another request may have redeemed the same key while this one was hashing; only one wins.
	if (getAdmin()?.recovery_key_hash !== stored) return null;
	updateRecoveryKeyStmt.run({ recoveryKeyHash: newHash, updatedAt: new Date().toISOString() });
	return newKey;
}
