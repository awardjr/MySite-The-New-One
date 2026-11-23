import Database from 'better-sqlite3';
import { runMigrations } from '#lib/server/migrations.js';

let instance: Database.Database | null = null;
let migrated: Promise<Database.Database> | null = null;

export function getTestDb(): Database.Database {
	if (!instance) {
		instance = new Database(':memory:');
		instance.pragma('foreign_keys = ON');
	}
	return instance;
}

export function migratedTestDb(): Promise<Database.Database> {
	migrated ??= runMigrations(getTestDb()).then(getTestDb);
	return migrated;
}
