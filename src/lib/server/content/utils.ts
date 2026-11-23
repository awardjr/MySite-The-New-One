import sanitizeHtml from 'sanitize-html';
import { mediaPlayer, playerHtml } from '#lib/mediaEmbed.js';

export function parseJsonArray<T>(raw: string): T[] {
	try {
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed) ? (parsed as T[]) : [];
	} catch {
		return [];
	}
}

const CSS_LENGTH = /^\d+(\.\d+)?(px|em|rem|%)$/;
const CSS_TEXT_ALIGN = /^(left|right|center|justify)$/;

const postSanitizeOptions: sanitizeHtml.IOptions = {
	allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'oembed'],
	allowedAttributes: {
		...sanitizeHtml.defaults.allowedAttributes,
		oembed: ['url'],
		img: ['src', 'alt', 'title', 'class', 'width', 'height', 'loading', 'decoding', 'style'],
		a: ['href', 'name', 'target', 'rel', 'class'],
		ol: ['class', 'start', 'reversed', 'style'],
		td: ['class', 'colspan', 'rowspan', 'style'],
		th: ['class', 'colspan', 'rowspan', 'scope', 'style'],
		'*': ['class', 'style']
	},
	allowedStyles: {
		'*': {
			'text-align': [CSS_TEXT_ALIGN],
			'margin-left': [CSS_LENGTH],
			'margin-right': [CSS_LENGTH],
			width: [CSS_LENGTH],
			height: [CSS_LENGTH],
			'aspect-ratio': [/^\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?$/],
			'list-style-type': [/^[a-z-]+$/]
		}
	},
	allowedSchemes: ['http', 'https', 'mailto'],
	allowedSchemesByTag: {
		img: ['http', 'https', 'data']
	},
	transformTags: {
		a: (tagName, attribs) => {
			if (attribs.target?.toLowerCase() === '_blank') {
				attribs.rel = 'noopener noreferrer';
			}
			return { tagName, attribs };
		},
		img: (tagName, attribs) => ({
			tagName,
			attribs: { ...attribs, loading: 'lazy', decoding: 'async' }
		})
	}
};

export function sanitizePostHtml(dirty: string): string {
	return sanitizeHtml(dirty, postSanitizeOptions);
}

const OEMBED = /<oembed url="([^"]*)"><\/oembed>/g;

export function renderPostHtml(html: string, hostname: string): string {
	return html.replace(OEMBED, (_tag, url: string) => {
		const player = mediaPlayer(url.replaceAll('&amp;', '&'), hostname);
		return player ? playerHtml(player) : '';
	});
}
