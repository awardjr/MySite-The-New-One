export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
	return EMAIL_REGEX.test(email);
}

/** Returns the reason a new password can't be used, or null if it is acceptable. */
export function validateNewPassword(password: string, confirmation: string): string | null {
	if (password.length < MIN_PASSWORD_LENGTH) {
		return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
	}
	if (password !== confirmation) {
		return 'Passwords do not match.';
	}
	return null;
}
