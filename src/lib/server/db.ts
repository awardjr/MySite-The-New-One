// Shared SQLite connection for the site's CMS.
//
// A single database file on disk (data/cms.sqlite3, created on first run)
// backs both the editable page content and the admin login (password +
// sessions). See `content.ts` and `auth.ts` for the tables this module sets up.
//
// This module can only be imported from server-side code (anything under
// `$lib/server`), which SvelteKit enforces automatically.
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cms.sqlite3');

if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
	CREATE TABLE IF NOT EXISTS content_sections (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS admin_user (
		id INTEGER PRIMARY KEY CHECK (id = 1),
		password_hash TEXT NOT NULL,
		updated_at TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS sessions (
		id TEXT PRIMARY KEY,
		created_at TEXT NOT NULL,
		expires_at TEXT NOT NULL
	);
`);
