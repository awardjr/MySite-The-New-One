import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/server/db', async () => {
	const { getTestDb } = await import('./test-db');
	return { db: getTestDb() };
});

import { getTestDb } from './test-db';
import {
	checkCredentials,
	checkPassword,
	createPasswordResetToken,
	createSession,
	deleteSession,
	generateRecoveryKey,
	getAdminProfile,
	hasRecoveryKey,
	invalidateAllResetTokens,
	invalidateAllSessions,
	isAdminConfigured,
	isLoginLocked,
	isResetLocked,
	normalizeRecoveryKey,
	recordFailedLogin,
	recordFailedReset,
	recordSuccessfulLogin,
	recordSuccessfulReset,
	requestEmailPasswordReset,
	resetPasswordWithRecoveryKey,
	resetPasswordWithToken,
	setAdminCredentials,
	setRecoveryKey,
	updateAdminProfile,
	verifyRecoveryKey,
	verifyResetToken,
	verifySessionToken,
	cancelTotpSetup,
	completeTwoFactorChallenge,
	confirmTotpSetup,
	createTwoFactorChallenge,
	disableTotp,
	getPendingTotpSecret,
	hasTwoFactorChallenge,
	isTotpEnabled,
	startTotpSetup,
	verifySecondFactor,
	verifyTotpCode
} from '../src/lib/server/auth';
import { totpCode, totpStep } from '../src/lib/server/totp';

const testDb = getTestDb();
const TEST_TOTP_ENCRYPTION_KEY = 'test-only-totp-encryption-key-with-more-than-32-bytes';

beforeEach(() => {
	process.env.TOTP_ENCRYPTION_KEY = TEST_TOTP_ENCRYPTION_KEY;
	testDb.exec('DELETE FROM admin_user');
	testDb.exec('DELETE FROM sessions');
	testDb.exec('DELETE FROM password_reset_tokens');
});

describe('admin credentials and profile', () => {
	it('is not configured until credentials are set', () => {
		expect(isAdminConfigured()).toBe(false);
		expect(getAdminProfile()).toBeNull();
	});

	it('configures username, email, password, and recovery key', () => {
		setAdminCredentials('adminuser', 'admin@example.com', 'supersecret123', 'A1B2-C3D4-E5F6-G7H8');
		expect(isAdminConfigured()).toBe(true);

		const profile = getAdminProfile();
		expect(profile).toEqual({
			username: 'adminuser',
			email: 'admin@example.com'
		});
		expect(hasRecoveryKey()).toBe(true);
		expect(checkPassword('supersecret123')).toBe(true);
	});

	it('verifies login credentials by username or email case-insensitively', () => {
		setAdminCredentials('MyUsername', 'Admin@Example.COM', 'correct-password');

		expect(checkCredentials('MyUsername', 'correct-password')).toBe(true);
		expect(checkCredentials('myusername', 'correct-password')).toBe(true);
		expect(checkCredentials('admin@example.com', 'correct-password')).toBe(true);
		expect(checkCredentials('ADMIN@EXAMPLE.COM', 'correct-password')).toBe(true);

		expect(checkCredentials('wronguser', 'correct-password')).toBe(false);
		expect(checkCredentials('', 'correct-password')).toBe(false);
		expect(checkCredentials('   ', 'correct-password')).toBe(false);
		expect(checkCredentials('myusername', '')).toBe(false);
		expect(checkCredentials('myusername', 'wrong-password')).toBe(false);
		expect(checkCredentials('admin@example.com', 'wrong-password')).toBe(false);
	});

	it('updates admin profile username and email', () => {
		setAdminCredentials('olduser', 'old@example.com', 'password123');
		updateAdminProfile('newuser', 'new@example.com');

		const profile = getAdminProfile();
		expect(profile).toEqual({
			username: 'newuser',
			email: 'new@example.com'
		});
		expect(checkCredentials('newuser', 'password123')).toBe(true);
	});
});

describe('emergency recovery key', () => {
	it('generates formatted recovery keys and normalizes them', () => {
		const key = generateRecoveryKey();
		expect(key).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
		expect(normalizeRecoveryKey(' a1b2-c3d4-e5f6-g7h8 ')).toBe('A1B2C3D4E5F6G7H8');
	});

	it('verifies a valid recovery key ignoring hyphens and case', () => {
		setAdminCredentials('admin', 'admin@example.com', 'pass12345', '1234-ABCD-5678-EF90');

		expect(verifyRecoveryKey('1234-ABCD-5678-EF90')).toBe(true);
		expect(verifyRecoveryKey('1234abcd5678ef90')).toBe(true);
		expect(verifyRecoveryKey(' 1234-abcd-5678-ef90 ')).toBe(true);
		expect(verifyRecoveryKey('wrong-recovery-key-1')).toBe(false);
	});

	it('rotates the recovery key when setRecoveryKey is called', () => {
		setAdminCredentials('admin', 'admin@example.com', 'pass12345', 'AAAA-AAAA-AAAA-AAAA');
		expect(verifyRecoveryKey('AAAA-AAAA-AAAA-AAAA')).toBe(true);

		setRecoveryKey('BBBB-BBBB-BBBB-BBBB');
		expect(verifyRecoveryKey('AAAA-AAAA-AAAA-AAAA')).toBe(false);
		expect(verifyRecoveryKey('BBBB-BBBB-BBBB-BBBB')).toBe(true);
	});

	it('resets password using emergency recovery code and revokes active sessions', () => {
		setAdminCredentials('admin', 'admin@example.com', 'old-password', 'RECO-VERY-CODE-1234');
		const sessionToken = createSession();
		expect(verifySessionToken(sessionToken)).toBe(true);

		const success = resetPasswordWithRecoveryKey('reco-very-code-1234', 'brand-new-password');
		expect(success).toBe(true);

		expect(checkPassword('brand-new-password')).toBe(true);
		expect(checkPassword('old-password')).toBe(false);
		expect(verifySessionToken(sessionToken)).toBe(false);
	});
});

describe('email reset link and password reset tokens', () => {
	it('creates and verifies a valid single-use reset token', () => {
		const token = createPasswordResetToken();
		expect(verifyResetToken(token)).toBe(true);
	});

	it('rejects an unknown or expired reset token', () => {
		expect(verifyResetToken('fake-token')).toBe(false);
		expect(verifyResetToken(null)).toBe(false);

		const token = createPasswordResetToken();
		testDb
			.prepare('UPDATE password_reset_tokens SET expires_at = ? WHERE token = ?')
			.run(new Date(Date.now() - 1000).toISOString(), token);

		expect(verifyResetToken(token)).toBe(false);
	});

	it('invalidates all reset tokens', () => {
		const token = createPasswordResetToken();
		invalidateAllResetTokens();
		expect(verifyResetToken(token)).toBe(false);
	});

	it('dispatches email reset request when username or email matches', async () => {
		setAdminCredentials('siteadmin', 'contact@example.com', 'secretpass');

		const matchedEmail = await requestEmailPasswordReset(
			'contact@example.com',
			'http://localhost:5173'
		);
		expect(matchedEmail).toBe(true);

		const matchedUser = await requestEmailPasswordReset('siteadmin', 'http://localhost:5173');
		expect(matchedUser).toBe(true);

		const notMatched = await requestEmailPasswordReset(
			'unknown@example.com',
			'http://localhost:5173'
		);
		expect(notMatched).toBe(false);
	});

	it('resets password with token, consumes token, and revokes sessions', () => {
		setAdminCredentials('admin', 'admin@example.com', 'initial-pass');
		const sessionToken = createSession();
		const resetToken = createPasswordResetToken();

		expect(verifyResetToken(resetToken)).toBe(true);

		const result = resetPasswordWithToken(resetToken, 'fresh-password-123');
		expect(result).toBe(true);

		expect(checkPassword('fresh-password-123')).toBe(true);
		expect(checkPassword('initial-pass')).toBe(false);
		expect(verifyResetToken(resetToken)).toBe(false);
		expect(verifySessionToken(sessionToken)).toBe(false);
	});
});

describe('sessions', () => {
	it('creates a session that verifies as valid', () => {
		const token = createSession();
		expect(verifySessionToken(token)).toBe(true);
	});

	it('rejects a missing token', () => {
		expect(verifySessionToken(undefined)).toBe(false);
		expect(verifySessionToken(null)).toBe(false);
	});

	it('rejects an unknown token', () => {
		expect(verifySessionToken('not-a-real-token')).toBe(false);
	});

	it('rejects a token after it has been deleted', () => {
		const token = createSession();
		deleteSession(token);
		expect(verifySessionToken(token)).toBe(false);
	});

	it('rejects and removes an expired session', () => {
		const token = createSession();
		testDb
			.prepare('UPDATE sessions SET expires_at = ? WHERE id = ?')
			.run(new Date(Date.now() - 1000).toISOString(), token);

		expect(verifySessionToken(token)).toBe(false);

		const row = testDb.prepare('SELECT id FROM sessions WHERE id = ?').get(token);
		expect(row).toBeUndefined();
	});

	it('invalidates every session at once', () => {
		const tokenA = createSession();
		const tokenB = createSession();

		invalidateAllSessions();

		expect(verifySessionToken(tokenA)).toBe(false);
		expect(verifySessionToken(tokenB)).toBe(false);
	});
});

describe('brute force attempt lockouts', () => {
	it('locks out login attempts after threshold and clears on success', () => {
		expect(isLoginLocked('1.1.1.1')).toBe(false);

		for (let i = 0; i < 5; i++) {
			recordFailedLogin('1.1.1.1');
		}
		expect(isLoginLocked('1.1.1.1')).toBe(true);

		recordSuccessfulLogin('1.1.1.1');
		expect(isLoginLocked('1.1.1.1')).toBe(false);
	});

	it('locks out reset attempts after threshold and clears on success', () => {
		expect(isResetLocked('2.2.2.2')).toBe(false);

		for (let i = 0; i < 5; i++) {
			recordFailedReset('2.2.2.2');
		}
		expect(isResetLocked('2.2.2.2')).toBe(true);

		recordSuccessfulReset('2.2.2.2');
		expect(isResetLocked('2.2.2.2')).toBe(false);
	});

	it('forgets old failures and lifts the lockout after 15 minutes', () => {
		vi.useFakeTimers();
		try {
			for (let i = 0; i < 4; i++) recordFailedLogin('3.3.3.3');
			vi.advanceTimersByTime(15 * 60 * 1000);
			recordFailedLogin('3.3.3.3');
			expect(isLoginLocked('3.3.3.3')).toBe(false);

			for (let i = 0; i < 4; i++) recordFailedLogin('3.3.3.3');
			expect(isLoginLocked('3.3.3.3')).toBe(true);
			vi.advanceTimersByTime(15 * 60 * 1000);
			expect(isLoginLocked('3.3.3.3')).toBe(false);
		} finally {
			vi.useRealTimers();
		}
	});
});

describe('two-factor authentication', () => {
	const currentCode = (secret: string, offset = 0) => totpCode(secret, totpStep() + offset);

	beforeEach(() => {
		setAdminCredentials('admin', 'admin@example.com', 'supersecret123', 'A1B2-C3D4-E5F6-G7H8');
	});

	it('only turns on after the pending secret is confirmed with a valid code', () => {
		expect(isTotpEnabled()).toBe(false);
		const secret = startTotpSetup();
		expect(getPendingTotpSecret()).toBe(secret);
		expect(isTotpEnabled()).toBe(false);

		// A code from 5 steps (2.5 minutes) ahead is outside the drift window.
		expect(confirmTotpSetup(currentCode(secret, 5))).toBe(false);
		expect(isTotpEnabled()).toBe(false);

		expect(confirmTotpSetup(currentCode(secret))).toBe(true);
		expect(isTotpEnabled()).toBe(true);
		expect(getPendingTotpSecret()).toBeNull();
	});

	it('stores pending and enabled secrets as ciphertext', () => {
		const secret = startTotpSetup();
		const pending = testDb
			.prepare('SELECT totp_pending_secret FROM admin_user WHERE id = 1')
			.get() as { totp_pending_secret: string };
		expect(pending.totp_pending_secret).toMatch(/^v1:/);
		expect(pending.totp_pending_secret).not.toContain(secret);
		expect(getPendingTotpSecret()).toBe(secret);

		expect(confirmTotpSetup(currentCode(secret))).toBe(true);
		const active = testDb.prepare('SELECT totp_secret FROM admin_user WHERE id = 1').get() as {
			totp_secret: string;
		};
		expect(active.totp_secret).toMatch(/^v1:/);
		expect(active.totp_secret).not.toContain(secret);
	});

	it('upgrades legacy plaintext TOTP secrets on read', () => {
		const secret = startTotpSetup();
		testDb.prepare('UPDATE admin_user SET totp_pending_secret = ? WHERE id = 1').run(secret);
		expect(getPendingTotpSecret()).toBe(secret);
		const pending = testDb
			.prepare('SELECT totp_pending_secret FROM admin_user WHERE id = 1')
			.get() as { totp_pending_secret: string };
		expect(pending.totp_pending_secret).toMatch(/^v1:/);

		expect(confirmTotpSetup(currentCode(secret))).toBe(true);
		testDb.prepare('UPDATE admin_user SET totp_secret = ? WHERE id = 1').run(secret);
		expect(verifyTotpCode(currentCode(secret, 1))).toBe(true);
		const active = testDb.prepare('SELECT totp_secret FROM admin_user WHERE id = 1').get() as {
			totp_secret: string;
		};
		expect(active.totp_secret).toMatch(/^v1:/);
	});

	it('fails closed on an incorrect encryption key but keeps recovery available', () => {
		const secret = startTotpSetup();
		expect(confirmTotpSetup(currentCode(secret, -1))).toBe(true);

		process.env.TOTP_ENCRYPTION_KEY = 'wrong-key-that-is-also-longer-than-32-bytes';
		try {
			expect(isTotpEnabled()).toBe(true);
			expect(verifyTotpCode(currentCode(secret))).toBe(false);
			expect(verifySecondFactor('A1B2-C3D4-E5F6-G7H8')).toBe(true);
		} finally {
			process.env.TOTP_ENCRYPTION_KEY = TEST_TOTP_ENCRYPTION_KEY;
		}
	});

	it('refuses to start setup without a sufficiently long encryption key', () => {
		process.env.TOTP_ENCRYPTION_KEY = 'short';
		expect(() => startTotpSetup()).toThrow('TOTP_ENCRYPTION_KEY');
	});

	it('can cancel a pending setup without turning 2FA on', () => {
		startTotpSetup();
		cancelTotpSetup();
		expect(getPendingTotpSecret()).toBeNull();
		expect(isTotpEnabled()).toBe(false);
	});

	it('accepts each code only once and rejects older ones', () => {
		const secret = startTotpSetup();
		confirmTotpSetup(currentCode(secret, -1));

		// The confirming code (and anything older) can't be reused.
		expect(verifyTotpCode(currentCode(secret, -1))).toBe(false);
		expect(verifyTotpCode(currentCode(secret))).toBe(true);
		expect(verifyTotpCode(currentCode(secret))).toBe(false);
	});

	it('accepts the recovery code as a second factor', () => {
		const secret = startTotpSetup();
		confirmTotpSetup(currentCode(secret));
		expect(verifySecondFactor('a1b2-c3d4-e5f6-g7h8')).toBe(true);
		expect(verifySecondFactor('WRONG-CODE')).toBe(false);
		expect(verifySecondFactor(currentCode(secret, 5))).toBe(false);
		expect(verifySecondFactor(currentCode(secret, 1))).toBe(true);
	});

	it('completes a login challenge with a valid code and discards it after use', () => {
		const secret = startTotpSetup();
		confirmTotpSetup(currentCode(secret, -1));

		const token = createTwoFactorChallenge();
		expect(hasTwoFactorChallenge(token)).toBe(true);
		expect(completeTwoFactorChallenge(token, currentCode(secret))).toBe(true);
		expect(hasTwoFactorChallenge(token)).toBe(false);
		expect(completeTwoFactorChallenge('not-a-token', currentCode(secret, 1))).toBe(false);
	});

	it('discards a login challenge after too many wrong codes or when sessions are revoked', () => {
		const secret = startTotpSetup();
		confirmTotpSetup(currentCode(secret));

		const token = createTwoFactorChallenge();
		for (let i = 0; i < 5; i++) completeTwoFactorChallenge(token, 'WRONG-CODE');
		expect(hasTwoFactorChallenge(token)).toBe(false);
		expect(completeTwoFactorChallenge(token, 'A1B2-C3D4-E5F6-G7H8')).toBe(false);

		const other = createTwoFactorChallenge();
		invalidateAllSessions();
		expect(hasTwoFactorChallenge(other)).toBe(false);
	});

	it('expires a login challenge after 5 minutes', () => {
		vi.useFakeTimers();
		try {
			const token = createTwoFactorChallenge();
			vi.advanceTimersByTime(5 * 60 * 1000);
			expect(hasTwoFactorChallenge(token)).toBe(false);
		} finally {
			vi.useRealTimers();
		}
	});

	it('turns off and forgets the secret', () => {
		const secret = startTotpSetup();
		confirmTotpSetup(currentCode(secret));
		disableTotp();
		expect(isTotpEnabled()).toBe(false);
		expect(verifyTotpCode(currentCode(secret, 1))).toBe(false);
	});
});
