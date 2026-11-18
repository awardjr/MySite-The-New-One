import {
	readContent,
	updateSection,
	getHeadlineForPage,
	type PinballMachine,
	type ModeScore
} from '#lib/server/content.js';
import { saveHeadlineAction } from '#lib/server/headlineAction.js';
import { saveListAction } from '#lib/server/listAction.js';
import { text } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const machines = readContent().pinball;
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
	save: saveListAction('machines', {
		toItem: (item): PinballMachine => ({
			name: text(item.name),
			image: text(item.image),
			highScore: text(item.highScore),
			modeScores: toModeScores(item.modeScores)
		}),
		keep: (machine) => machine.name,
		save: (machines) => updateSection('pinball', machines)
	})
};
