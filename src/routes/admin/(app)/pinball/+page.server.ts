import { fail } from '@sveltejs/kit';
import {
	readContent,
	updateSection,
	getHeadlineForPage,
	type PinballMachine,
	type ModeScore
} from '#lib/server/content.js';
import { saveHeadlineAction } from '#lib/server/headlineAction.js';
import { readJsonRows, text } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const { machines } = readContent().pinball;
	const { headline, subtitle } = getHeadlineForPage('pinball');
	return { machines, headline, subtitle };
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
	saveHeadline: saveHeadlineAction('pinball'),
	default: async ({ request }) => {
		const formData = await request.formData();
		const rows = readJsonRows(formData, 'machines');
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
