import sanitizeHtml from 'sanitize-html';

export function parseJsonArray<T>(raw: string): T[] {
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? (parsed as T[]) : [];
	} catch {
		return [];
	}
}

const postSanitizeOptions: sanitizeHtml.IOptions = {
	// Everything else the editor can produce (headings, u, s, figure, ...) is
	// already part of the sanitize-html defaults.
	allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'strike'],
	allowedAttributes: {
		...sanitizeHtml.defaults.allowedAttributes,
		img: ['src', 'alt', 'title', 'class', 'width', 'height', 'loading'],
		a: ['href', 'name', 'target', 'rel', 'class'],
		'*': ['class']
	},
	allowedSchemes: ['http', 'https', 'mailto'],
	allowedSchemesByTag: {
		img: ['http', 'https', 'data']
	}
};

export function sanitizePostHtml(dirty: string): string {
	return sanitizeHtml(dirty, postSanitizeOptions);
}
