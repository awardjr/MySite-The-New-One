import { fail, type RequestEvent } from '@sveltejs/kit';
import { readJsonRows } from './forms';

interface ListActionOptions<T> {
	/** Cleans one submitted row. */
	toItem: (row: Record<string, unknown>) => T;
	/** Rows this returns a falsy value for are dropped, such as those without a title. */
	keep: (item: T) => unknown;
	save: (items: T[]) => void;
}

/** Builds the `save` form action for an admin list editor, which posts its rows in `field`. */
export function saveListAction<T>(field: string, { toItem, keep, save }: ListActionOptions<T>) {
	return async ({ request }: RequestEvent) => {
		const rows = readJsonRows(await request.formData(), field);
		if (!rows) {
			return fail(400, { error: 'Could not read submitted data.' });
		}

		save(rows.map(toItem).filter(keep));

		return { success: true };
	};
}
