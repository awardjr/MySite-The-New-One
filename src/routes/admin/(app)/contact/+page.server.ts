import {
	readContent,
	updateSection,
	getHeadlineForPage,
	type ContactLink
} from '#lib/server/content.js';
import { saveHeadlineAction } from '#lib/server/headlineAction.js';
import { saveListAction } from '#lib/server/listAction.js';
import { z } from 'zod';
import { fields, text } from '#lib/server/forms.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { links: readContent().contact, ...getHeadlineForPage('contact') };
};

export const actions: Actions = {
	saveHeadline: saveHeadlineAction('contact'),
	save: saveListAction('links', {
		row: z.object({
			label: fields.text,
			href: fields.safeUrl,
			icon: z
				.unknown()
				.optional()
				.transform((icon) => text(icon ?? 'link')),
			description: fields.text
		}) satisfies z.ZodType<ContactLink>,
		keep: (link) => link.label && link.href,
		skipReason: 'without a label and a safe link',
		save: (links) => updateSection('contact', links)
	})
};
