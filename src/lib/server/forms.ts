import { z } from 'zod';

const URL_SCHEME = /^([a-z][a-z0-9+.-]*):/i;
const SAFE_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);

const rawField = z
	.unknown()
	.optional()
	.transform((value) => String(value ?? ''));
const textField = rawField.transform((value) => value.trim());
const safeUrlField = textField.transform((url) => {
	// eslint-disable-next-line no-control-regex
	const scheme = URL_SCHEME.exec(url.replace(/[\u0000- ]/g, ''))?.[1].toLowerCase();
	return scheme === undefined || SAFE_SCHEMES.has(scheme) ? url : '';
});
const textListField = z
	.array(textField)
	.catch([])
	.transform((items) => items.filter(Boolean));

const jsonRows = z
	.string()
	.transform((value, ctx) => {
		try {
			return JSON.parse(value) as unknown;
		} catch {
			ctx.addIssue({ code: 'custom', message: 'Invalid JSON.' });
			return z.NEVER;
		}
	})
	.pipe(z.array(z.record(z.string(), z.unknown())));

export const fields = {
	raw: rawField,
	text: textField,
	safeUrl: safeUrlField,
	textList: textListField
};

export function raw(formData: FormData, field: string): string {
	return rawField.parse(formData.get(field));
}

export function text(value: unknown): string {
	return textField.parse(value);
}

export function safeUrl(value: unknown): string {
	return safeUrlField.parse(value);
}

export function textList(value: unknown): string[] {
	return textListField.parse(value);
}

export function readJsonRows(formData: FormData, field: string): Record<string, unknown>[] | null {
	const rows = jsonRows.safeParse(String(formData.get(field) ?? '[]'));
	return rows.success ? rows.data : null;
}

export function firstIssue(error: z.ZodError): string {
	return error.issues[0]?.message ?? 'Invalid input.';
}
