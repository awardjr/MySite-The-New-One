import {
	readContent,
	updateSection,
	getHeadlineForPage,
	type ContactLink
} from '#lib/server/content.js';
import { saveHeadlineAction } from '#lib/server/headlineAction.js';
import { saveListAction } from '#lib/server/listAction.js';
import { safeUrl, text } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const links = readContent().contact;
	const { headline, subtitle } = getHeadlineForPage('contact');
	return { links, headline, subtitle };
};

export const actions: Actions = {
	saveHeadline: saveHeadlineAction('contact'),
	save: saveListAction('links', {
		toItem: (item): ContactLink => ({
			label: text(item.label),
			href: safeUrl(item.href),
			icon: text(item.icon ?? 'link'),
			description: text(item.description ?? '')
		}),
		keep: (link) => link.label && link.href,
		skipReason: 'without a label and a safe link',
		save: (links) => updateSection('contact', links)
	})
};
