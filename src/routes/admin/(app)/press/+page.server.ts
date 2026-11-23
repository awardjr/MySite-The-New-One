import {
	readContent,
	updateSection,
	getHeadlineForPage,
	type PressItem
} from '#lib/server/content.js';
import { saveHeadlineAction } from '#lib/server/headlineAction.js';
import { saveListAction } from '#lib/server/listAction.js';
import { z } from 'zod';
import { fields } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { items: readContent().press, ...getHeadlineForPage('press') };
};

export const actions: Actions = {
	saveHeadline: saveHeadlineAction('press'),
	save: saveListAction('items', {
		row: z.object({
			outlet: fields.text,
			title: fields.text,
			summary: fields.text,
			href: fields.safeUrl,
			date: fields.text
		}) satisfies z.ZodType<PressItem>,
		keep: (item) => item.title,
		skipReason: 'without a title',
		linkField: 'href',
		save: (items) => updateSection('press', items)
	})
};
