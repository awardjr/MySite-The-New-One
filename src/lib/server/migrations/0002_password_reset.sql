CREATE TABLE IF NOT EXISTS password_reset_tokens (
	token TEXT PRIMARY KEY,
	created_at TEXT NOT NULL,
	expires_at TEXT NOT NULL
);

ALTER TABLE admin_user ADD COLUMN recovery_key_hash TEXT;
