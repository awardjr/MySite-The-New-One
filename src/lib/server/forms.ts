/**
 * Helpers shared by the admin form actions. The list editors post their rows as
 * a JSON string in a hidden field, so every action needs the same parsing and
 * value coercion before it can validate its own fields.
 */

/** Reads a hidden JSON array field. Returns null when the value is missing or not an array. */
export function readJsonRows(formData: FormData, field: string): Record<string, unknown>[] | null {
	try {
		const parsed: unknown = JSON.parse(String(formData.get(field) ?? '[]'));
		return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : null;
	} catch {
		return null;
	}
}

/** Coerces a submitted value to a trimmed string. */
export function text(value: unknown): string {
	return String(value ?? '').trim();
}

const URL_SCHEME = /^([a-z][a-z0-9+.-]*):/i;
const SAFE_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);

/**
 * Coerces a submitted link to a trimmed string, or '' if it uses a scheme other than
 * http, https, mailto or tel (e.g. `javascript:`). Relative and scheme-less links pass through.
 */
export function safeUrl(value: unknown): string {
	const url = text(value);
	// Browsers skip control characters and tabs/newlines in URLs, so "\x01java\tscript:" must be caught too.
	// eslint-disable-next-line no-control-regex
	const scheme = URL_SCHEME.exec(url.replace(/[\u0000-\u0020]/g, ''))?.[1].toLowerCase();
	return scheme === undefined || SAFE_SCHEMES.has(scheme) ? url : '';
}

/** Coerces a submitted value to a list of non-empty trimmed strings. */
export function textList(value: unknown): string[] {
	return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}
