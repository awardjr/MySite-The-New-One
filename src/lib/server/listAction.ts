import { fail, type RequestEvent } from '@sveltejs/kit';
import type { z } from 'zod';
import { readJsonRows, text } from './forms';

interface ListActionOptions<T> {
	row: z.ZodType<T>;
	keep: (item: T) => unknown;
	skipReason: string;
	linkField?: keyof T & string;
	save: (items: T[]) => void;
}

const count = (total: number, noun: string) => `${total} ${noun}${total === 1 ? '' : 's'}`;

export function saveListAction<T>(
	field: string,
	{ row, keep, skipReason, linkField, save }: ListActionOptions<T>
) {
	return async ({ request }: RequestEvent) => {
		const rows = readJsonRows(await request.formData(), field);
		if (!rows) {
			return fail(400, { error: 'Could not read submitted data.' });
		}

		const items = rows.map((submitted) => row.parse(submitted));
		const kept = items.filter(keep);
		save(kept);

		const skipped = rows.length - kept.length;
		const removedLinks = linkField
			? items.filter((item, i) => keep(item) && !item[linkField] && text(rows[i][linkField])).length
			: 0;
		const details = [
			skipped > 0 && `Skipped ${count(skipped, 'row')} ${skipReason}.`,
			removedLinks > 0 && `Removed ${count(removedLinks, 'unsafe link')}.`
		].filter(Boolean);

		return { success: true, notice: details.length ? `Saved. ${details.join(' ')}` : undefined };
	};
}
