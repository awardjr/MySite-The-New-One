import { db } from '../db';

export type Post = {
	slug: string;
	title: string;
	date: string;
	image: string;
	preview: string;
	content: string;
	draft: boolean;
};

export type BlogContent = {
	posts: Post[];
};

const getBlogPostsStmt = db.prepare(
	'SELECT slug, title, date, image, preview, content, draft FROM blog_posts ORDER BY sort_order, rowid'
);
const deleteBlogPostsStmt = db.prepare('DELETE FROM blog_posts WHERE slug IS NOT NULL');
const insertBlogPostStmt = db.prepare(
	'INSERT INTO blog_posts (slug, title, date, image, preview, content, draft, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);

export function getBlog(): BlogContent {
	const rows = getBlogPostsStmt.all() as {
		slug: string;
		title: string;
		date: string;
		image: string;
		preview: string;
		content: string;
		draft: number;
	}[];
	return {
		posts: rows.map((row) => ({
			slug: row.slug,
			title: row.title ?? '',
			date: row.date ?? '',
			image: row.image ?? '',
			preview: row.preview ?? '',
			content: row.content ?? '',
			draft: Boolean(row.draft)
		}))
	};
}

export function setBlog(value: BlogContent): void {
	deleteBlogPostsStmt.run();
	const posts = value.posts ?? [];
	for (let i = 0; i < posts.length; i++) {
		const post = posts[i];
		insertBlogPostStmt.run(
			post.slug,
			post.title,
			post.date,
			post.image ?? '',
			post.preview ?? '',
			post.content ?? '',
			post.draft ? 1 : 0,
			i
		);
	}
}
