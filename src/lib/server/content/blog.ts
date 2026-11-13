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

/** The editable fields of a post; the slug is fixed once the post exists. */
export type PostFields = Omit<Post, 'slug'>;

export type BlogContent = {
	posts: Post[];
};

/** A post as stored: the draft flag is 0 or 1. */
type PostRow = Omit<Post, 'draft'> & { draft: number };

const getBlogPostsStmt = db.prepare(
	'SELECT slug, title, date, image, preview, content, draft FROM posts ORDER BY sort_order, rowid'
);
const getBlogIdsStmt = db.prepare('SELECT slug, id FROM posts');
const deleteBlogPostsStmt = db.prepare('DELETE FROM posts WHERE slug IS NOT NULL');
const insertBlogPostStmt = db.prepare(
	'INSERT INTO posts (id, slug, title, date, image, preview, content, draft, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
// A new post goes after every existing one.
const appendBlogPostStmt = db.prepare(`
	INSERT INTO posts (slug, title, date, image, preview, content, draft, sort_order)
	VALUES (@slug, @title, @date, @image, @preview, @content, @draft,
		(SELECT COALESCE(MAX(sort_order), -1) + 1 FROM posts))
`);
const updateBlogPostStmt = db.prepare(`
	UPDATE posts
	SET title = @title, date = @date, image = @image, preview = @preview, content = @content,
		draft = @draft
	WHERE slug = @slug
`);
const deleteBlogPostStmt = db.prepare('DELETE FROM posts WHERE slug = ?');

export function getBlog(): BlogContent {
	const rows = getBlogPostsStmt.all() as PostRow[];
	return { posts: rows.map((row) => ({ ...row, draft: Boolean(row.draft) })) };
}

/** Replaces every post. Editing a single post should use the targeted functions below instead. */
export function setBlog(value: BlogContent): void {
	// Keep each post's id stable across saves (matched by slug).
	const ids = new Map(
		(getBlogIdsStmt.all() as { slug: string; id: number }[]).map((r) => [r.slug, r.id])
	);
	deleteBlogPostsStmt.run();
	value.posts.forEach((post, i) => {
		insertBlogPostStmt.run(
			ids.get(post.slug) ?? null,
			post.slug,
			post.title,
			post.date,
			post.image,
			post.preview,
			post.content,
			post.draft ? 1 : 0,
			i
		);
	});
}

/** Adds a post after the existing ones. The slug must not be in use. */
export function insertPost(post: Post): void {
	appendBlogPostStmt.run({ ...post, draft: post.draft ? 1 : 0 });
}

/** Updates one post in place. Returns false if no post has that slug. */
export function updatePostBySlug(slug: string, fields: PostFields): boolean {
	return updateBlogPostStmt.run({ ...fields, slug, draft: fields.draft ? 1 : 0 }).changes > 0;
}

/** Deletes one post. Returns false if no post has that slug. */
export function deletePostBySlug(slug: string): boolean {
	return deleteBlogPostStmt.run(slug).changes > 0;
}
