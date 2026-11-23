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

type PinballMachineRow = Omit<PinballMachine, 'modeScores'> & { modeScores: string };

const getPinballMachinesStmt = db.prepare(
	'SELECT name, image, high_score AS highScore, mode_scores AS modeScores FROM pinball_machines ORDER BY sort_order, id'
);
const deletePinballMachinesStmt = db.prepare('DELETE FROM pinball_machines WHERE id IS NOT NULL');
const insertPinballMachineStmt = db.prepare(
	'INSERT INTO pinball_machines (name, image, high_score, mode_scores, sort_order) VALUES (?, ?, ?, ?, ?)'
);

export function getPinball(): PinballMachine[] {
	const rows = getPinballMachinesStmt.all() as PinballMachineRow[];
	return rows.map((row) => ({
		...row,
		modeScores: parseJsonArray<ModeScore>(row.modeScores)
	}));
}

export function setPinball(machines: PinballMachine[]): void {
	deletePinballMachinesStmt.run();
	machines.forEach((machine, i) => {
		insertPinballMachineStmt.run(
			machine.name,
			machine.image,
			machine.highScore,
			JSON.stringify(machine.modeScores),
			i
		);
	});
}
