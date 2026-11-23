import type Database from 'better-sqlite3';
import { Umzug, type UmzugStorage } from 'umzug';

type Db = Database.Database;

export interface Migration {
	name: string;
	up: () => void | Promise<void>;
}

const sqlFiles = import.meta.glob('./migrations/*.sql', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

function migrationLog(db: Db) {
	db.exec(
		'CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)'
	);
	const insert = db.prepare('INSERT OR IGNORE INTO migrations (name, applied_at) VALUES (?, ?)');
	const remove = db.prepare('DELETE FROM migrations WHERE name = ?');
	const names = db.prepare('SELECT name FROM migrations ORDER BY name').pluck();
	return {
		record: (name: string) => insert.run(name, new Date().toISOString()),
		storage: {
			executed: async () => names.all() as string[],
			logMigration: async ({ name }) => void insert.run(name, new Date().toISOString()),
			unlogMigration: async ({ name }) => void remove.run(name)
		} satisfies UmzugStorage
	};
}

export function contentMigrations(db: Db): Migration[] {
	const log = migrationLog(db);
	return Object.entries(sqlFiles)
		.map(([filePath, sql]) => ({ name: filePath.split('/').pop() ?? filePath, sql }))
		.sort((a, b) => a.name.localeCompare(b.name))
		.map(({ name, sql }) => ({
			name,
			up: () =>
				db.transaction(() => {
					db.exec(sql);
					log.record(name);
				})()
		}));
}

export async function runMigrations(
	db: Db,
	migrations: Migration[] = contentMigrations(db)
): Promise<void> {
	await new Umzug({
		migrations: migrations.map(({ name, up }) => ({ name, up: async () => up() })),
		storage: migrationLog(db).storage,
		logger: undefined
	}).up();
}
