import { db } from '../db';
import { parseJsonArray } from './utils';

export type HomeContent = {
	name: string;
	tagline: string;
	photoSrc: string;
	introParagraphs: string[];
};

const getHomeStmt = db.prepare(
	'SELECT name, tagline, photo_src AS photoSrc, intro_paragraphs AS introParagraphs FROM home WHERE id = 1'
);

const upsertHomeStmt = db.prepare(`
	INSERT INTO home (id, name, tagline, photo_src, intro_paragraphs)
	VALUES (1, @name, @tagline, @photoSrc, @introParagraphs)
	ON CONFLICT(id) DO UPDATE SET
		name = excluded.name,
		tagline = excluded.tagline,
		photo_src = excluded.photo_src,
		intro_paragraphs = excluded.intro_paragraphs
`);

export function getHome(): HomeContent {
	const row = getHomeStmt.get() as
		{ name: string; tagline: string; photoSrc: string; introParagraphs: string } | undefined;
	if (!row) {
		return { name: '', tagline: '', photoSrc: '', introParagraphs: [] };
	}
	return {
		name: row.name ?? '',
		tagline: row.tagline ?? '',
		photoSrc: row.photoSrc ?? '',
		introParagraphs: parseJsonArray<string>(row.introParagraphs)
	};
}

export function setHome(value: HomeContent): void {
	upsertHomeStmt.run({
		name: value.name ?? '',
		tagline: value.tagline ?? '',
		photoSrc: value.photoSrc ?? '',
		introParagraphs: JSON.stringify(value.introParagraphs ?? [])
	});
}
