import Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from '../src/lib/server/migrations';

describe('runMigrations', () => {
	let db: Database.Database;

	beforeEach(() => {
		db = new Database(':memory:');
	});

	it('creates the migrations tracking table and content tables', () => {
		runMigrations(db);

		const tables = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
			.all()
			.map((row) => (row as { name: string }).name);

		expect(tables).toEqual(
			expect.arrayContaining([
				'migrations',
				'admin_user',
				'sessions',
				'home',
				'contact_links',
				'skill_categories',
				'work_items',
				'press_items',
				'pinball_machines',
				'blog_posts'
			])
		);
	});

	it('records the applied migration by name', () => {
		runMigrations(db);

		const applied = db
			.prepare('SELECT name FROM migrations')
			.all()
			.map((row) => (row as { name: string }).name);

		expect(applied).toContain('0001_init.sql');
	});

	it('is idempotent when run multiple times', () => {
		runMigrations(db);
		runMigrations(db);
		runMigrations(db);

		const applied = db.prepare('SELECT name FROM migrations').all();
		expect(applied).toHaveLength(1);
	});

	it('does not fail or duplicate data on repeated runs', () => {
		runMigrations(db);
		db.prepare(
			'INSERT INTO home (id, name, tagline, photo_src, intro_paragraphs) VALUES (1, ?, ?, ?, ?)'
		).run('Ada', 'Engineer', '/photo.jpg', '[]');

		runMigrations(db);

		const row = db.prepare('SELECT name FROM home WHERE id = 1').get() as { name: string };
		expect(row.name).toBe('Ada');
	});
});
