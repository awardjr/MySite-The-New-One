import { z } from 'zod';
import { sanitizePostHtml, type PostFields } from '#lib/server/content.js';
import { fields } from '#lib/server/forms.js';

const postForm = z.object({
	title: fields.text,
	date: fields.text,
	image: fields.text,
	preview: fields.text,
	content: fields.text.transform(sanitizePostHtml),
	draft: z.unknown().transform((value) => value === 'on')
}) satisfies z.ZodType<PostFields>;

export function readPostFields(formData: FormData): PostFields {
	return postForm.parse({
		title: formData.get('title'),
		date: formData.get('date'),
		image: formData.get('image'),
		preview: formData.get('preview'),
		content: formData.get('content'),
		draft: formData.get('draft')
	});
}
