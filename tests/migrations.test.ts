import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from '#lib/server/migrations.js';

const MIGRATIONS_DIR = fileURLToPath(new URL('../src/lib/server/migrations', import.meta.url));
const migrationFiles = fs
	.readdirSync(MIGRATIONS_DIR)
	.filter((name) => name.endsWith('.sql'))
	.sort();

describe('runMigrations', () => {
	let db: Database.Database;

	const appliedNames = () =>
		(db.prepare('SELECT name FROM migrations ORDER BY name').all() as { name: string }[]).map(
			(row) => row.name
		);
	const tableNames = () =>
		(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[])
			.map((row) => row.name)
			.filter((name) => !name.startsWith('sqlite_'))
			.sort();

	beforeEach(() => {
		db = new Database(':memory:');
	});

	it('builds the current schema and records every migration', async () => {
		await runMigrations(db);

		expect(tableNames()).toEqual([
			'home',
			'links',
			'migrations',
			'page_headlines',
			'pinball_machines',
			'posts',
			'press',
			'works'
		]);
		expect(appliedNames()).toEqual(migrationFiles);
	});

	it('does nothing on later runs, keeping data and applied timestamps', async () => {
		await runMigrations(db);
		db.prepare(
			'INSERT INTO home (id, name, tagline, photo_src, intro_paragraphs) VALUES (1, ?, ?, ?, ?)'
		).run('Ada', 'Engineer', '/photo.jpg', '[]');
		db.exec("UPDATE migrations SET applied_at = 'original'");

		await runMigrations(db);

		expect(db.prepare('SELECT name FROM home').all()).toEqual([{ name: 'Ada' }]);
		expect(
			db.prepare("SELECT COUNT(*) AS n FROM migrations WHERE applied_at != 'original'").get()
		).toEqual({ n: 0 });
	});

	it('skips a migration already recorded as applied', async () => {
		db.exec('CREATE TABLE migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
		const record = db.prepare('INSERT INTO migrations VALUES (?, ?)');
		for (const file of migrationFiles) record.run(file, 'earlier');

		await runMigrations(db);

		expect(tableNames()).toEqual(['migrations']);
	});

	it('rolls back a failing migration completely and can resume afterwards', async () => {
		db.exec('CREATE TABLE page_headlines (blocker INTEGER)');

		await expect(runMigrations(db)).rejects.toThrow();

		expect(appliedNames()).toEqual([]);
		expect(tableNames()).toEqual(['migrations', 'page_headlines']);

		db.exec('DROP TABLE page_headlines');
		await runMigrations(db);

		expect(appliedNames()).toEqual(migrationFiles);
		expect(tableNames()).toContain('posts');
	});
});
