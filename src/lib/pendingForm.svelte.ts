import type { ActionResult, SubmitFunction } from '$app/forms';
import { markSaved } from '#lib/unsavedChanges.js';

interface PendingFormOptions {
	reset?: boolean;
	refreshAll?: (result: ActionResult) => boolean;
}

export function pendingForm({ reset = true, refreshAll }: PendingFormOptions = {}) {
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
