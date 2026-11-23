import { z } from 'zod';
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from './instance';

const profileSchema = z.object({
	username: z
		.string()
		.min(1, 'Username is required.')
		.refine((name) => !name.includes('@'), 'Username can’t contain “@”.'),
	email: z.email('Please enter a valid email address.')
});

const newPasswordSchema = z
	.object({
		password: z
			.string()
			.min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`)
			.max(MAX_PASSWORD_LENGTH, `Password must be at most ${MAX_PASSWORD_LENGTH} characters long.`),
		confirmation: z.string()
	})
	.refine(({ password, confirmation }) => password === confirmation, 'Passwords do not match.');

function firstIssue(result: z.ZodSafeParseResult<unknown>): string | null {
	return result.success ? null : (result.error.issues[0]?.message ?? 'Invalid input.');
}

export function validateProfile(username: string, email: string): string | null {
	return firstIssue(profileSchema.safeParse({ username, email }));
}

export function validateNewPassword(password: string, confirmation: string): string | null {
	return firstIssue(newPasswordSchema.safeParse({ password, confirmation }));
}
