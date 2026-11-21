import type Database from 'better-sqlite3';

const migrationModules = import.meta.glob('./migrations/*.sql', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

/** Applies, in file name order, each migration in ./migrations that hasn't been applied yet. */
export function runMigrations(db: Database.Database): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS migrations (
			name TEXT PRIMARY KEY,
			applied_at TEXT NOT NULL
		);
	`);

	const applied = new Set(db.prepare('SELECT name FROM migrations').pluck().all());
	const markApplied = db.prepare('INSERT INTO migrations (name, applied_at) VALUES (?, ?)');
	const migrations = Object.entries(migrationModules)
		.map(([filePath, sql]) => ({ name: filePath.split('/').pop() ?? filePath, sql }))
		.sort((a, b) => a.name.localeCompare(b.name));

	for (const { name, sql } of migrations) {
		if (applied.has(name)) continue;
		db.transaction(() => {
			db.exec(sql);
			markApplied.run(name, new Date().toISOString());
		})();
	}
}
