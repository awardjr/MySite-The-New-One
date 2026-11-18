import { describe, expect, it, vi } from 'vitest';
import type { ActionResult } from '$app/forms';
import { pendingForm } from '#lib/pendingForm.svelte.js';

const success: ActionResult = { type: 'success', status: 200, location: '/admin' };

/** Starts a submit and returns what finishes it, with the mocks SvelteKit would pass in. */
function startSubmit(form: ReturnType<typeof pendingForm>) {
	const update = vi.fn(async () => undefined);
	const finish = form.submit({} as never) as unknown as (input: unknown) => Promise<void>;
	return { update, finish: () => finish({ result: success, update }) };
}

describe('pendingForm', () => {
	it('is pending from submit until the result has been applied', async () => {
		const form = pendingForm();
		expect(form.pending).toBe(false);

		const { finish } = startSubmit(form);
		expect(form.pending).toBe(true);

		await finish();
		expect(form.pending).toBe(false);
	});

	it('stays pending until every overlapping submission has finished', async () => {
		const form = pendingForm();
		const first = startSubmit(form);
		const second = startSubmit(form);

		await second.finish();
		expect(form.pending).toBe(true);

		await first.finish();
		expect(form.pending).toBe(false);
	});

	it.each([
		[undefined, true],
		[false, false]
	])('with reset %j updates the page using reset %j', async (reset, expected) => {
		const { update, finish } = startSubmit(pendingForm({ reset }));
		await finish();
		expect(update).toHaveBeenCalledWith({ reset: expected, refreshAll: undefined });
	});

	it('asks refreshAll whether the result reloads the page data', async () => {
		const refreshAll = vi.fn(() => false);
		const { update, finish } = startSubmit(pendingForm({ refreshAll }));
		await finish();
		expect(refreshAll).toHaveBeenCalledWith(success);
		expect(update).toHaveBeenCalledWith({ reset: true, refreshAll: false });
	});
});
