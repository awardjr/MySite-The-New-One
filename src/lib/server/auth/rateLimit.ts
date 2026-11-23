import { RateLimiterRes, RateLimiterSQLite } from 'rate-limiter-flexible';
import { db } from '../db';

export const LOCKED_MESSAGE = 'Too many attempts. Please try again later.';
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60;

function sqliteLimiter(tableName: string): Promise<RateLimiterSQLite> {
	return new Promise((resolve, reject) => {
		const limiter: RateLimiterSQLite = new RateLimiterSQLite(
			{
				storeClient: db,
				storeType: 'better-sqlite3',
				tableName,
				points: MAX_ATTEMPTS,
				duration: LOCKOUT_SECONDS,
				blockDuration: LOCKOUT_SECONDS,
				clearExpiredByTimeout: true
			},
			(error?: Error) => queueMicrotask(() => (error ? reject(error) : resolve(limiter)))
		);
	});
}

async function take(limiter: RateLimiterSQLite, address: string): Promise<boolean> {
	try {
		await limiter.consume(address);
		return true;
	} catch (error) {
		if (error instanceof RateLimiterRes) return false;
		throw error;
	}
}

function attemptLimiter(limiter: RateLimiterSQLite) {
	return {
		take: (address: string) => take(limiter, address),
		async clear(address: string): Promise<void> {
			await limiter.delete(address);
		},
		async guard<T>(
			address: string,
			check: () => T | Promise<T>,
			succeeded: (result: T) => boolean = Boolean
		): Promise<T | 'locked'> {
			if (!(await take(limiter, address))) return 'locked';
			let result: T;
			try {
				result = await check();
			} catch (error) {
				await limiter.reward(address, 1);
				throw error;
			}
			if (succeeded(result)) await limiter.reward(address, 1);
			return result;
		}
	};
}

export const loginAttempts = attemptLimiter(await sqliteLimiter('login_attempts'));

export const resetAttempts = attemptLimiter(await sqliteLimiter('reset_attempts'));
