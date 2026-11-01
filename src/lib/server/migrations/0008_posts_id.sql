CREATE TABLE posts_new (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	slug TEXT NOT NULL UNIQUE,
	title TEXT NOT NULL,
	date TEXT NOT NULL,
	image TEXT NOT NULL DEFAULT '',
	preview TEXT NOT NULL DEFAULT '',
	content TEXT NOT NULL DEFAULT '',
	draft INTEGER NOT NULL DEFAULT 0,
	sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO posts_new (slug, title, date, image, preview, content, draft, sort_order)
SELECT slug, title, date, image, preview, content, draft, sort_order
FROM posts
ORDER BY sort_order, rowid;

DROP TABLE posts;
ALTER TABLE posts_new RENAME TO posts;
