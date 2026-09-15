// Blog posts data. Add a new post by appending an object to this array.
// `slug` is used for the post's own SEO-friendly URL at /blog/<slug>.
// `image` is optional — leave it as an empty string to omit the image.
export type Post = {
	slug: string;
	title: string;
	date: string;
	image: string;
	preview: string;
	content: string;
};

export const posts: Post[] = [
	{
		slug: 'sample-post',
		title: 'Sample Post',
		date: '2026-01-01',
		image: '',
		preview: 'This is a short preview of the sample post. Replace this with a teaser of your real content.',
		content:
			'This is the full body of the sample post. Replace this with your real writeup — it can be as long as you like, and will be shown in full both when a post is expanded on the blog listing page and on its own dedicated page.'
	}
];

export function getPostBySlug(slug: string): Post | undefined {
	return posts.find((post) => post.slug === slug);
}
