import {
	readContent,
	updateSection,
	getHeadlineForPage,
	type PinballMachine,
	type ModeScore
} from '#lib/server/content.js';
import { saveHeadlineAction } from '#lib/server/headlineAction.js';
import { saveListAction } from '#lib/server/listAction.js';
import { z } from 'zod';
import { fields } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { machines: readContent().pinball, ...getHeadlineForPage('pinball') };
};

const modeScore = z
	.object({ mode: fields.text, score: fields.text })
	.catch({ mode: '', score: '' }) satisfies z.ZodType<ModeScore>;

export const actions: Actions = {
	saveHeadline: saveHeadlineAction('pinball'),
	save: saveListAction('machines', {
		row: z.object({
			name: fields.text,
			image: fields.text,
			highScore: fields.text,
			modeScores: z
				.array(modeScore)
				.catch([])
				.transform((scores) => scores.filter((score) => score.mode))
		}) satisfies z.ZodType<PinballMachine>,
		keep: (machine) => machine.name,
		skipReason: 'without a name',
		save: (machines) => updateSection('pinball', machines)
	})
};
