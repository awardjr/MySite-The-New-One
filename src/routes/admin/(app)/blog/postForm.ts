import { sanitizePostHtml } from '$lib/server/content';
import { text } from '$lib/server/forms';

export type PostFields = {
	title: string;
	date: string;
	image: string;
	preview: string;
	content: string;
	draft: boolean;
};

/** Reads the post fields shared by the "new post" and "edit post" editors. */
export function readPostFields(formData: FormData): PostFields {
	return {
		title: text(formData.get('title')),
		date: text(formData.get('date')),
		image: text(formData.get('image')),
		preview: text(formData.get('preview')),
		content: sanitizePostHtml(text(formData.get('content'))),
		draft: formData.get('draft') === 'on'
	};
}
