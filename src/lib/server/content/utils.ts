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
	// Everything else the editor can produce (headings, u, s, figure, tables, ...) is
	// already part of the sanitize-html defaults. `oembed` is the editor's placeholder for
	// embedded media, which `renderPostHtml` turns into the player.
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
	// `style` is allowed above only so the handful of declarations the editor's formatting
	// tools emit survive; every other declaration is dropped.
	allowedStyles: {
		'*': {
			// Alignment and block indent.
			'text-align': [CSS_TEXT_ALIGN],
			'margin-left': [CSS_LENGTH],
			'margin-right': [CSS_LENGTH],
			// Resized images and table columns.
			width: [CSS_LENGTH],
			height: [CSS_LENGTH],
			'aspect-ratio': [/^\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?$/],
			// Numbered/bulleted list styles.
			'list-style-type': [/^[a-z-]+$/]
		}
	},
	allowedSchemes: ['http', 'https', 'mailto'],
	allowedSchemesByTag: {
		img: ['http', 'https', 'data']
	},
	transformTags: {
		// Prevent reverse-tabnabbing: any admin-authored link that opens in a new
		// tab must not be able to access `window.opener`.
		a: (tagName, attribs) => {
			// Browsers match target keywords case-insensitively.
			if (attribs.target?.toLowerCase() === '_blank') {
				attribs.rel = 'noopener noreferrer';
			}
			return { tagName, attribs };
		},
		// Post images sit below the header image, so they can load as the reader scrolls.
		img: (tagName, attribs) => ({
			tagName,
			attribs: { ...attribs, loading: 'lazy', decoding: 'async' }
		})
	}
};

export function sanitizePostHtml(dirty: string): string {
	return sanitizeHtml(dirty, postSanitizeOptions);
}

// `sanitizePostHtml` writes every `<oembed>` in exactly this form.
const OEMBED = /<oembed url="([^"]*)"><\/oembed>/g;

/**
 * Saved post HTML as the public page shows it: each `<oembed>` becomes its provider's player.
 * `hostname` is the site's own, which some players (Twitch) need to agree to load.
 */
export function renderPostHtml(html: string, hostname: string): string {
	return html.replace(OEMBED, (_tag, url: string) => {
		const player = mediaPlayer(url.replaceAll('&amp;', '&'), hostname);
		return player ? playerHtml(player) : '';
	});
}
