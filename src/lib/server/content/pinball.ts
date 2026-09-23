import { db } from '../db';
import { parseJsonArray } from './utils';

export type ModeScore = {
	mode: string;
	score: string;
};

export type PinballMachine = {
	name: string;
	image: string;
	highScore: string;
	modeScores: ModeScore[];
};

export type PinballContent = {
	machines: PinballMachine[];
};

const getPinballMachinesStmt = db.prepare(
	'SELECT name, image, high_score AS highScore, mode_scores AS modeScores FROM pinball_machines ORDER BY sort_order, id'
);
const deletePinballMachinesStmt = db.prepare('DELETE FROM pinball_machines WHERE id IS NOT NULL');
const insertPinballMachineStmt = db.prepare(
	'INSERT INTO pinball_machines (name, image, high_score, mode_scores, sort_order) VALUES (?, ?, ?, ?, ?)'
);

export function getPinball(): PinballContent {
	const rows = getPinballMachinesStmt.all() as {
		name: string;
		image: string;
		highScore: string;
		modeScores: string;
	}[];
	return {
		machines: rows.map((row) => ({
			name: row.name ?? '',
			image: row.image ?? '',
			highScore: row.highScore ?? '',
			modeScores: parseJsonArray<ModeScore>(row.modeScores)
		}))
	};
}

export function setPinball(value: PinballContent): void {
	deletePinballMachinesStmt.run();
	const machines = value.machines ?? [];
	for (let i = 0; i < machines.length; i++) {
		const machine = machines[i];
		insertPinballMachineStmt.run(
			machine.name,
			machine.image ?? '',
			machine.highScore ?? '',
			JSON.stringify(machine.modeScores ?? []),
			i
		);
	}
}
