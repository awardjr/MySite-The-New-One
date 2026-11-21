import {
	readContent,
	updateSection,
	getHeadlineForPage,
	type WorkItem
} from '#lib/server/content.js';
import { saveHeadlineAction } from '#lib/server/headlineAction.js';
import { saveListAction } from '#lib/server/listAction.js';
import { safeUrl, text, textList } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { items: readContent().works, ...getHeadlineForPage('works') };
};

export const actions: Actions = {
	saveHeadline: saveHeadlineAction('works'),
	save: saveListAction('items', {
		toItem: (item): WorkItem => ({
			id: text(item.id),
			title: text(item.title),
			description: text(item.description),
			image: text(item.image),
			link: safeUrl(item.link),
			platforms: textList(item.platforms)
		}),
		keep: (item) => item.title,
		skipReason: 'without a title',
		linkField: 'link',
		save: (items) => updateSection('works', items)
	})
};
