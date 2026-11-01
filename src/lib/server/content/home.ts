import { db } from '../db';
import { parseJsonArray } from './utils';

export type HomeContent = {
	name: string;
	tagline: string;
	photoSrc: string;
	introParagraphs: string[];
	featuredPosts: string[];
	featuredWorks: string[];
};

const getHomeStmt = db.prepare(
	'SELECT name, tagline, photo_src AS photoSrc, intro_paragraphs AS introParagraphs, featured_posts AS featuredPosts, featured_works AS featuredWorks FROM home WHERE id = 1'
);

const upsertHomeStmt = db.prepare(`
	INSERT INTO home (id, name, tagline, photo_src, intro_paragraphs, featured_posts, featured_works)
	VALUES (1, @name, @tagline, @photoSrc, @introParagraphs, @featuredPosts, @featuredWorks)
	ON CONFLICT(id) DO UPDATE SET
		name = excluded.name,
		tagline = excluded.tagline,
		photo_src = excluded.photo_src,
		intro_paragraphs = excluded.intro_paragraphs,
		featured_posts = excluded.featured_posts,
		featured_works = excluded.featured_works
`);

export function getHome(): HomeContent {
	const row = getHomeStmt.get() as
		| {
				name: string;
				tagline: string;
				photoSrc: string;
				introParagraphs: string;
				featuredPosts: string;
				featuredWorks: string;
		  }
		| undefined;
	if (!row) {
		return {
			name: '',
			tagline: '',
			photoSrc: '',
			introParagraphs: [],
			featuredPosts: [],
			featuredWorks: []
		};
	}
	return {
		name: row.name ?? '',
		tagline: row.tagline ?? '',
		photoSrc: row.photoSrc ?? '',
		introParagraphs: parseJsonArray<string>(row.introParagraphs),
		featuredPosts: parseJsonArray<string>(row.featuredPosts),
		featuredWorks: parseJsonArray<string>(row.featuredWorks)
	};
}

export function setHome(value: HomeContent): void {
	upsertHomeStmt.run({
		name: value.name ?? '',
		tagline: value.tagline ?? '',
		photoSrc: value.photoSrc ?? '',
		introParagraphs: JSON.stringify(value.introParagraphs ?? []),
		featuredPosts: JSON.stringify(value.featuredPosts ?? []),
		featuredWorks: JSON.stringify(value.featuredWorks ?? [])
	});
}
