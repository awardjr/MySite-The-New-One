import { isAPIError } from 'better-auth/api';

export function authErrorCode(error: unknown): string | undefined {
	return isAPIError(error) ? error.body?.code : undefined;
}

export async function unlessRejected<T>(run: () => Promise<T>, codes: string[]): Promise<T | null> {
	try {
		return await run();
	} catch (error) {
		const code = authErrorCode(error);
		if (code && codes.includes(code)) return null;
		throw error;
	}
}
