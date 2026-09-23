import { fail } from '@sveltejs/kit';
import {
	readContent,
	updateSection,
	type PinballMachine,
	type ModeScore
} from '$lib/server/content';
import { readJsonRows, text } from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { machines: readContent().pinball.machines };
};

function toModeScores(value: unknown): ModeScore[] {
	if (!Array.isArray(value)) return [];
	return value
		.map((modeScore): ModeScore => {
			const row = modeScore as Record<string, unknown>;
			return { mode: text(row?.mode), score: text(row?.score) };
		})
		.filter((modeScore) => modeScore.mode);
}

export const actions: Actions = {
	default: async ({ request }) => {
		const rows = readJsonRows(await request.formData(), 'machines');
		if (!rows) {
			return fail(400, { error: 'Could not read submitted data.' });
		}

		const machines: PinballMachine[] = rows
			.map((item) => ({
				name: text(item.name),
				image: text(item.image),
				highScore: text(item.highScore),
				modeScores: toModeScores(item.modeScores)
			}))
			.filter((machine) => machine.name);

		updateSection('pinball', { machines });

		return { success: true };
	}
};
