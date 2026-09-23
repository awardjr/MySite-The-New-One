import type Database from 'better-sqlite3';

const migrationModules = import.meta.glob('./migrations/*.sql', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

interface Migration {
	name: string;
	sql: string;
}

function loadMigrations(): Migration[] {
	return Object.entries(migrationModules)
		.map(([filePath, sql]) => ({ name: filePath.split('/').pop() ?? filePath, sql }))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export function runMigrations(db: Database.Database): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS migrations (
			name TEXT PRIMARY KEY,
			applied_at TEXT NOT NULL
		);
	`);

	const applied = new Set(
		db
			.prepare('SELECT name FROM migrations')
			.all()
			.map((row) => (row as { name: string }).name)
	);

	const markApplied = db.prepare('INSERT INTO migrations (name, applied_at) VALUES (?, ?)');

	for (const migration of loadMigrations()) {
		if (applied.has(migration.name)) continue;

		const applyMigration = db.transaction(() => {
			db.exec(migration.sql);
			markApplied.run(migration.name, new Date().toISOString());
		});
		applyMigration();
	}
}
