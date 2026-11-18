const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
// Above this many tracked addresses, expired records are swept to limit memory use.
const MAX_TRACKED_ADDRESSES = 1000;

interface AttemptState {
	failures: number;
	/** When this record stops counting: end of the lockout, or end of the failure window. */
	expiresAt: number;
}

// Secret checks hash off the event loop, so several could otherwise be in flight at once and all
// pass the lockout check before any of them records its failure. Running them one at a time keeps
// the limit exact.
let checkQueue: Promise<unknown> = Promise.resolve();

function runInTurn<T>(task: () => Promise<T>): Promise<T> {
	const run = checkQueue.then(task);
	checkQueue = run.catch(() => undefined);
	return run;
}

/** In-memory brute-force guard keyed by client address. Failures older than LOCKOUT_MS are forgotten. */
function createAttemptLimiter() {
	const attempts = new Map<string, AttemptState>();

	function current(address: string, now: number): AttemptState | undefined {
		const state = attempts.get(address);
		if (state && state.expiresAt <= now) {
			attempts.delete(address);
			return undefined;
		}
		return state;
	}

	function isLocked(address: string): boolean {
		return (current(address, Date.now())?.failures ?? 0) >= MAX_ATTEMPTS;
	}

	function recordFailure(address: string): void {
		const now = Date.now();
		if (attempts.size >= MAX_TRACKED_ADDRESSES) {
			for (const [key, state] of attempts) {
				if (state.expiresAt <= now) attempts.delete(key);
			}
		}
		const state = current(address, now) ?? { failures: 0, expiresAt: now + LOCKOUT_MS };
		state.failures += 1;
		// The lockout runs for its full length from the failure that started it.
		if (state.failures === MAX_ATTEMPTS) state.expiresAt = now + LOCKOUT_MS;
		attempts.set(address, state);
	}

	return {
		isLocked,
		recordFailure,
		clear(address: string): void {
			attempts.delete(address);
		},
		/**
		 * Runs a secret check for an address. Resolves to `'locked'` without running it while the
		 * address is locked out; any falsy result counts as a failed attempt.
		 */
		guard<T>(address: string, check: () => T | Promise<T>): Promise<T | 'locked'> {
			return runInTurn(async () => {
				if (isLocked(address)) return 'locked' as const;
				const result = await check();
				if (!result) recordFailure(address);
				return result;
			});
		}
	};
}

/** Password and second-factor checks, at login and when confirming sensitive changes. */
export const loginAttempts = createAttemptLimiter();

/** Password reset requests and attempts. */
export const resetAttempts = createAttemptLimiter();
