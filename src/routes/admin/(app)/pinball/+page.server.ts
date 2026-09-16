import { fail } from '@sveltejs/kit';
import {
	readContent,
	updateSection,
	type PinballMachine,
	type ModeScore
} from '$lib/server/content';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { machines: readContent().pinball.machines };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const raw = String(formData.get('machines') ?? '[]');

		let parsed: unknown;
		try {
			parsed = JSON.parse(raw);
		} catch {
			return fail(400, { error: 'Could not read submitted data.' });
		}

		if (!Array.isArray(parsed)) {
			return fail(400, { error: 'Could not read submitted data.' });
		}

		const machines: PinballMachine[] = (parsed as Record<string, unknown>[])
			.map((item) => ({
				name: String(item?.name ?? '').trim(),
				image: String(item?.image ?? '').trim(),
				highScore: String(item?.highScore ?? '').trim(),
				modeScores: Array.isArray(item?.modeScores)
					? (item.modeScores as Record<string, unknown>[])
							.map((modeScore): ModeScore => ({
								mode: String(modeScore?.mode ?? '').trim(),
								score: String(modeScore?.score ?? '').trim()
							}))
							.filter((modeScore) => modeScore.mode)
					: []
			}))
			.filter((machine) => machine.name);

		updateSection('pinball', { machines });

		return { success: true };
	}
};
