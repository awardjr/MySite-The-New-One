import { db } from '../db';
import { hashToken, newToken } from './secrets';

/**
 * A database table of expiring random tokens. Only a hash of each token is stored; the token
 * itself lives with its owner (a session cookie or an emailed link).
 */
export function createTokenStore(
	table: 'sessions' | 'password_reset_tokens',
	maxAgeSeconds: number
) {
	const insertStmt = db.prepare(
		`INSERT INTO ${table} (token_hash, created_at, expires_at) VALUES (?, ?, ?)`
	);
	const findStmt = db.prepare(`SELECT expires_at FROM ${table} WHERE token_hash = ?`);
	const removeStmt = db.prepare(`DELETE FROM ${table} WHERE token_hash = ?`);
	const removeExpiredStmt = db.prepare(`DELETE FROM ${table} WHERE expires_at <= ?`);
	const removeOthersStmt = db.prepare(`DELETE FROM ${table} WHERE token_hash != ?`);
	const removeAllStmt = db.prepare(`DELETE FROM ${table} WHERE token_hash IS NOT NULL`);

	return {
		issue(): string {
			const token = newToken();
			const now = new Date();
			const expiresAt = new Date(now.getTime() + maxAgeSeconds * 1000);
			insertStmt.run(hashToken(token), now.toISOString(), expiresAt.toISOString());
			return token;
		},
		/** Returns whether the token is live. An expired token is removed. */
		isValid(token: string | undefined | null): boolean {
			if (!token) return false;
			const tokenHash = hashToken(token);
			const row = findStmt.get(tokenHash) as { expires_at: string } | undefined;
			if (!row) return false;
			if (new Date(row.expires_at).getTime() <= Date.now()) {
				removeStmt.run(tokenHash);
				return false;
			}
			return true;
		},
		remove(token: string): void {
			removeStmt.run(hashToken(token));
		},
		removeExpired(): void {
			removeExpiredStmt.run(new Date().toISOString());
		},
		removeAllExcept(token: string): void {
			removeOthersStmt.run(hashToken(token));
		},
		removeAll(): void {
			removeAllStmt.run();
		}
	};
}
