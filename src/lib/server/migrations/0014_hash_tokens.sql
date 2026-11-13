-- Session ids and password reset tokens are now stored as SHA-256 hashes, so a leaked database
-- or backup no longer contains usable credentials. Existing rows hold plaintext values and are
-- dropped: anyone signed in has to sign in again, and pending reset links stop working.
DELETE FROM sessions;
DELETE FROM password_reset_tokens;

ALTER TABLE sessions RENAME COLUMN id TO token_hash;
ALTER TABLE password_reset_tokens RENAME COLUMN token TO token_hash;
