const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

interface AttemptState {
	failures: number;
	/** When this record stops counting: end of the lockout, or end of the failure window. */
	expiresAt: number;
	locked: boolean;
}

// Above this many tracked addresses, expired records are swept so memory stays bounded.
const MAX_TRACKED_ADDRESSES = 1000;

/** In-memory brute-force guard keyed by client address. Failures older than LOCKOUT_MS are forgotten. */
function createAttemptLimiter() {
	const attempts = new Map<string, AttemptState>();

	function current(identifier: string, now: number): AttemptState | undefined {
		const state = attempts.get(identifier);
		if (state && state.expiresAt <= now) {
			attempts.delete(identifier);
			return undefined;
		}
		return state;
	}

	return {
		isLocked(identifier: string): boolean {
			return current(identifier, Date.now())?.locked ?? false;
		},
		recordFailure(identifier: string): void {
			const now = Date.now();
			if (attempts.size >= MAX_TRACKED_ADDRESSES) {
				for (const [key, state] of attempts) {
					if (state.expiresAt <= now) attempts.delete(key);
				}
			}
			const state = current(identifier, now) ?? {
				failures: 0,
				expiresAt: now + LOCKOUT_MS,
				locked: false
			};
			state.failures += 1;
			if (state.failures >= MAX_ATTEMPTS && !state.locked) {
				state.locked = true;
				state.expiresAt = now + LOCKOUT_MS;
			}
			attempts.set(identifier, state);
		},
		clear(identifier: string): void {
			attempts.delete(identifier);
		}
	};
}

type AttemptLimiter = ReturnType<typeof createAttemptLimiter>;

// Secret checks hash off the event loop, so several could otherwise be in flight at once and all
// pass the lockout check before any of them records its failure. Running them one at a time keeps
// the limit exact.
let checkQueue: Promise<unknown> = Promise.resolve();

function runInTurn<T>(task: () => Promise<T>): Promise<T> {
	const run = checkQueue.then(task);
	checkQueue = run.catch(() => undefined);
	return run;
}

/**
 * Builds a guard that runs a secret check under a limiter: it refuses with `'locked'` while the
 * address is locked out, and counts a falsy result as a failed attempt.
 */
function createGuard(limiter: AttemptLimiter) {
	return function guard<T>(identifier: string, check: () => T | Promise<T>): Promise<T | 'locked'> {
		return runInTurn(async () => {
			if (limiter.isLocked(identifier)) return 'locked' as const;
			const result = await check();
			if (!result) limiter.recordFailure(identifier);
			return result;
		});
	};
}

const loginAttempts = createAttemptLimiter();
const resetAttempts = createAttemptLimiter();

/**
 * Runs a password or second-factor check for the given client address, sharing the login lockout.
 * Resolves to `'locked'` without running the check when the address is locked out; any falsy
 * result counts toward the lockout.
 */
export const guardLogin = createGuard(loginAttempts);

/** Like `guardLogin`, for password-reset attempts. */
export const guardReset = createGuard(resetAttempts);

/** Returns true if the given identifier (e.g. client IP) is currently locked out from logging in. */
export function isLoginLocked(identifier: string): boolean {
	return loginAttempts.isLocked(identifier);
}

/** Records a failed login attempt, locking out the identifier after too many failures. */
export function recordFailedLogin(identifier: string): void {
	loginAttempts.recordFailure(identifier);
}

/** Clears any recorded failures for the identifier after a successful login. */
export function recordSuccessfulLogin(identifier: string): void {
	loginAttempts.clear(identifier);
}

/** Returns true if the given identifier is currently locked out from requesting/performing resets. */
export function isResetLocked(identifier: string): boolean {
	return resetAttempts.isLocked(identifier);
}

/** Records a failed (or rate-limited) reset attempt, locking out the identifier after too many. */
export function recordFailedReset(identifier: string): void {
	resetAttempts.recordFailure(identifier);
}

/** Clears any recorded reset failures for the identifier after a successful reset. */
export function recordSuccessfulReset(identifier: string): void {
	resetAttempts.clear(identifier);
}
