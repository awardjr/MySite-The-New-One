import {
	readContent,
	updateSection,
	getHeadlineForPage,
	type WorkItem
} from '#lib/server/content.js';
import { saveHeadlineAction } from '#lib/server/headlineAction.js';
import { saveListAction } from '#lib/server/listAction.js';
import { z } from 'zod';
import { fields } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { items: readContent().works, ...getHeadlineForPage('works') };
};

export const actions: Actions = {
	saveHeadline: saveHeadlineAction('works'),
	save: saveListAction('items', {
		row: z.object({
			id: fields.text,
			title: fields.text,
			description: fields.text,
			image: fields.text,
			link: fields.safeUrl,
			platforms: fields.textList
		}) satisfies z.ZodType<WorkItem>,
		keep: (item) => item.title,
		skipReason: 'without a title',
		linkField: 'link',
		save: (items) => updateSection('works', items)
	})
};
