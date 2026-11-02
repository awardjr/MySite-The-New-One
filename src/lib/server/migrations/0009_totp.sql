ALTER TABLE admin_user ADD COLUMN totp_secret TEXT;
ALTER TABLE admin_user ADD COLUMN totp_pending_secret TEXT;
ALTER TABLE admin_user ADD COLUMN totp_last_step INTEGER;
