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

/** Coerces a submitted value to a list of non-empty trimmed strings. */
export function textList(value: unknown): string[] {
	return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}
