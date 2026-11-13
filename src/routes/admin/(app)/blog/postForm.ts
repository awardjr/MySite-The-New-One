import { sanitizePostHtml, type PostFields } from '#lib/server/content.js';
import { text } from '#lib/server/forms.js';

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
