import Database from 'better-sqlite3';
import { runMigrations } from '../src/lib/server/migrations';

let instance: Database.Database | null = null;

/**
 * Returns a shared, disposable in-memory SQLite database with all migrations
 * applied. Used to mock the `db` module in server-module tests so nothing
 * ever touches the real `data/cms.sqlite3` file.
 */
export function getTestDb(): Database.Database {
	if (!instance) {
		instance = new Database(':memory:');
		instance.pragma('foreign_keys = ON');
		runMigrations(instance);
	}
	return instance;
}
