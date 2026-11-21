import {
	readContent,
	updateSection,
	getHeadlineForPage,
	type PressItem
} from '#lib/server/content.js';
import { saveHeadlineAction } from '#lib/server/headlineAction.js';
import { saveListAction } from '#lib/server/listAction.js';
import { safeUrl, text } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { items: readContent().press, ...getHeadlineForPage('press') };
};

export const actions: Actions = {
	saveHeadline: saveHeadlineAction('press'),
	save: saveListAction('items', {
		toItem: (item): PressItem => ({
			outlet: text(item.outlet),
			title: text(item.title),
			summary: text(item.summary),
			href: safeUrl(item.href),
			date: text(item.date)
		}),
		keep: (item) => item.title,
		skipReason: 'without a title',
		linkField: 'href',
		save: (items) => updateSection('press', items)
	})
};
