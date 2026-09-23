import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import nodemailer from 'nodemailer';
import {
	getEmailTransporter,
	isSmtpConfigured,
	sendEmail,
	sendPasswordResetEmail
} from '../src/lib/server/email';

describe('email service & SMTP transport', () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.restoreAllMocks();
		delete process.env.SMTP_HOST;
		delete process.env.SMTP_SERVICE;
		delete process.env.SMTP_PORT;
		delete process.env.SMTP_USER;
		delete process.env.SMTP_PASS;
		delete process.env.SMTP_FROM;
		delete process.env.SMTP_SECURE;
		delete process.env.SMTP_REQUIRE_TLS;
		delete process.env.SMTP_IGNORE_TLS;
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it('reports SMTP as not configured when environment variables are unset', () => {
		expect(isSmtpConfigured()).toBe(false);
		expect(getEmailTransporter()).toBeNull();
	});

	it('falls back to console logging when SMTP is not configured', async () => {
		const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

		const result = await sendEmail({
			to: 'user@example.com',
			subject: 'Test Subject',
			text: 'Hello world'
		});

		expect(result).toBe(true);
		expect(consoleInfoSpy).toHaveBeenCalledWith(
			expect.stringContaining('[EMAIL DISPATCH (LOCAL / NO SMTP)]')
		);
	});

	it('initializes SMTP transporter when SMTP_HOST is provided', () => {
		process.env.SMTP_HOST = 'smtp.example.com';
		process.env.SMTP_PORT = '465';
		process.env.SMTP_USER = 'mailer@example.com';
		process.env.SMTP_PASS = 'secret123';
		process.env.SMTP_SECURE = 'true';

		expect(isSmtpConfigured()).toBe(true);

		const createTransportSpy = vi.spyOn(nodemailer, 'createTransport');
		const transporter = getEmailTransporter();

		expect(transporter).not.toBeNull();
		expect(createTransportSpy).toHaveBeenCalledWith({
			host: 'smtp.example.com',
			port: 465,
			secure: true,
			auth: {
				user: 'mailer@example.com',
				pass: 'secret123'
			}
		});
	});

	it('sends email using nodemailer transporter when configured', async () => {
		process.env.SMTP_HOST = 'smtp.example.com';
		process.env.SMTP_USER = 'mailer@example.com';
		process.env.SMTP_PASS = 'secret';
		process.env.SMTP_FROM = 'Site Admin <noreply@example.com>';

		const mockSendMail = vi.fn().mockResolvedValue({ messageId: '123' });
		vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
			sendMail: mockSendMail
		} as unknown as ReturnType<typeof nodemailer.createTransport>);

		const result = await sendEmail({
			to: 'recipient@example.com',
			subject: 'Hello',
			text: 'Plain text',
			html: '<p>HTML text</p>'
		});

		expect(result).toBe(true);
		expect(mockSendMail).toHaveBeenCalledWith({
			from: 'Site Admin <noreply@example.com>',
			to: 'recipient@example.com',
			subject: 'Hello',
			text: 'Plain text',
			html: '<p>HTML text</p>'
		});
	});

	it('handles SMTP transmission errors gracefully', async () => {
		process.env.SMTP_HOST = 'smtp.example.com';

		const mockSendMail = vi.fn().mockRejectedValue(new Error('Connection timed out'));
		vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
			sendMail: mockSendMail
		} as unknown as ReturnType<typeof nodemailer.createTransport>);

		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const result = await sendEmail({
			to: 'recipient@example.com',
			subject: 'Hello',
			text: 'Test message'
		});

		expect(result).toBe(false);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining('[SMTP ERROR] Failed to send email to recipient@example.com:'),
			expect.any(Error)
		);
	});

	it('builds valid password reset email with reset link and sends it', async () => {
		const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

		const result = await sendPasswordResetEmail(
			'admin@example.com',
			'https://example.com/admin/reset?token=test-token-123'
		);

		expect(result).toBe(true);
		expect(consoleInfoSpy).toHaveBeenCalledWith(
			expect.stringContaining('https://example.com/admin/reset?token=test-token-123')
		);
	});
});
