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

export type PostFields = Omit<Post, 'slug'>;

type PostRow = Omit<Post, 'draft'> & { draft: number };

const getBlogPostsStmt = db.prepare(
	'SELECT slug, title, date, image, preview, content, draft FROM posts ORDER BY sort_order, rowid'
);
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

export function getBlog(): Post[] {
	const rows = getBlogPostsStmt.all() as PostRow[];
	return rows.map((row) => ({ ...row, draft: Boolean(row.draft) }));
}

export function insertPost(post: Post): void {
	appendBlogPostStmt.run({ ...post, draft: post.draft ? 1 : 0 });
}

export function updatePostBySlug(slug: string, fields: PostFields): boolean {
	return updateBlogPostStmt.run({ ...fields, slug, draft: fields.draft ? 1 : 0 }).changes > 0;
}

export function deletePostBySlug(slug: string): boolean {
	return deleteBlogPostStmt.run(slug).changes > 0;
}
