import { fail, type RequestEvent } from '@sveltejs/kit';
import { readJsonRows, text } from './forms';

interface ListActionOptions<T> {
	/** Cleans one submitted row. */
	toItem: (row: Record<string, unknown>) => T;
	/** Rows this returns a falsy value for are dropped, such as those without a title. */
	keep: (item: T) => unknown;
	/** Completes "Skipped 1 row ...", to tell the admin why rows were dropped. */
	skipReason: string;
	/** A link field that is blanked when unsafe; the admin is told when that happens. */
	linkField?: keyof T & string;
	save: (items: T[]) => void;
}

const count = (total: number, noun: string) => `${total} ${noun}${total === 1 ? '' : 's'}`;

/** Builds the `save` form action for an admin list editor, which posts its rows in `field`. */
export function saveListAction<T>(
	field: string,
	{ toItem, keep, skipReason, linkField, save }: ListActionOptions<T>
) {
	return async ({ request }: RequestEvent) => {
		const rows = readJsonRows(await request.formData(), field);
		if (!rows) {
			return fail(400, { error: 'Could not read submitted data.' });
		}

		const items = rows.map(toItem);
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
