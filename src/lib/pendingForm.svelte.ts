import type { ActionResult, SubmitFunction } from '$app/forms';
import { markSaved } from '#lib/unsavedChanges.js';

interface PendingFormOptions {
	/** Clear the fields after a successful submit. Pass false to keep what was typed. */
	reset?: boolean;
	/** Whether a result reloads the page's data. By default only a success does. */
	refreshAll?: (result: ActionResult) => boolean;
}

/**
 * Tracks whether a form is being submitted. Pass `submit` to `use:enhance`, and read `pending` to
 * disable the submit button in the meantime.
 */
export function pendingForm({ reset = true, refreshAll }: PendingFormOptions = {}) {
	// A count, because one instance can serve forms whose submissions overlap.
	let inFlight = $state(0);

	const submit: SubmitFunction = () => {
		inFlight += 1;
		return async ({ formData, formElement, result, update }) => {
			if (result.type === 'success' || result.type === 'redirect') {
				markSaved(formElement, formData);
			}
			await update({ reset, refreshAll: refreshAll?.(result) });
			inFlight -= 1;
		};
	};

	return {
		submit,
		get pending() {
			return inFlight > 0;
		}
	};
}
