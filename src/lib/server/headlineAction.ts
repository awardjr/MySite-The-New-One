import type { RequestEvent } from '@sveltejs/kit';
import { saveHeadlineForPage } from './content/pageheadlines';
import { text } from './forms';

/**
 * Builds the `saveHeadline` form action for an admin page.
 * Pass `{ subtitle: false }` for pages that only have a headline.
 */
export function saveHeadlineAction(page: string, options: { subtitle?: boolean } = {}) {
	const { subtitle: hasSubtitle = true } = options;
	return async ({ request }: RequestEvent) => {
		const formData = await request.formData();
		const headline = text(formData.get('headline'));
		const subtitle = hasSubtitle ? text(formData.get('subtitle')) : '';

		saveHeadlineForPage(page, headline, subtitle);

		return { headlineSuccess: true };
	};
}
