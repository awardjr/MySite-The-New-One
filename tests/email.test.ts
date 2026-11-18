import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import nodemailer from 'nodemailer';
import { getEmailTransporter, sendEmail, sendPasswordResetEmail } from '#lib/server/email.js';

const SMTP_VARIABLES = [
	'SMTP_HOST',
	'SMTP_SERVICE',
	'SMTP_PORT',
	'SMTP_USER',
	'SMTP_PASS',
	'SMTP_FROM',
	'SMTP_SECURE',
	'SMTP_REQUIRE_TLS',
	'SMTP_IGNORE_TLS'
];
const message = { to: 'recipient@example.com', subject: 'Hello', text: 'Plain text' };

type SentMail = { from: string; to: string; subject: string; text: string; html?: string };
type SendMail = (mail: SentMail) => Promise<unknown>;

function fakeTransport(sendMail = vi.fn<SendMail>().mockResolvedValue({ messageId: '123' })) {
	const createTransport = vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
		sendMail
	} as unknown as ReturnType<typeof nodemailer.createTransport>);
	return { createTransport, sendMail };
}

/** The options the transport is created with under the current environment. */
function transportConfig(): unknown {
	const { createTransport } = fakeTransport();
	getEmailTransporter();
	return createTransport.mock.calls[0][0];
}

beforeEach(() => {
	for (const name of SMTP_VARIABLES) vi.stubEnv(name, '');
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

describe('SMTP configuration', () => {
	it('is off without a host or service, and blank values count as unset', () => {
		vi.stubEnv('SMTP_USER', 'mailer@example.com');
		expect(getEmailTransporter()).toBeNull();
	});

	it('uses all the settings given for a host', () => {
		vi.stubEnv('SMTP_HOST', 'smtp.example.com');
		vi.stubEnv('SMTP_PORT', '2525');
		vi.stubEnv('SMTP_USER', 'mailer@example.com');
		vi.stubEnv('SMTP_PASS', 'secret123');
		vi.stubEnv('SMTP_SECURE', 'true');

		expect(transportConfig()).toEqual({
			host: 'smtp.example.com',
			port: 2525,
			secure: true,
			auth: { user: 'mailer@example.com', pass: 'secret123' }
		});
	});

	it('defaults to port 587 with STARTTLS and no credentials', () => {
		vi.stubEnv('SMTP_HOST', 'smtp.example.com');
		expect(transportConfig()).toEqual({ host: 'smtp.example.com', port: 587, secure: false });
	});

	it('uses implicit TLS on port 465 unless told otherwise', () => {
		vi.stubEnv('SMTP_HOST', 'smtp.example.com');
		vi.stubEnv('SMTP_PORT', '465');
		expect(transportConfig()).toMatchObject({ port: 465, secure: true });

		vi.restoreAllMocks();
		vi.stubEnv('SMTP_SECURE', 'false');
		expect(transportConfig()).toMatchObject({ port: 465, secure: false });
	});

	it('falls back to port 587 for an unparseable port', () => {
		vi.stubEnv('SMTP_HOST', 'smtp.example.com');
		vi.stubEnv('SMTP_PORT', 'not-a-port');
		expect(transportConfig()).toMatchObject({ port: 587, secure: false });
	});

	it('prefers a named service over a host', () => {
		vi.stubEnv('SMTP_SERVICE', 'gmail');
		vi.stubEnv('SMTP_HOST', 'smtp.example.com');

		expect(transportConfig()).toEqual({ service: 'gmail' });
	});

	it.each([
		['true', true],
		['1', true],
		['false', false],
		['yes', false]
	])('reads the TLS flags from %j', (value, expected) => {
		vi.stubEnv('SMTP_HOST', 'smtp.example.com');
		vi.stubEnv('SMTP_REQUIRE_TLS', value);
		vi.stubEnv('SMTP_IGNORE_TLS', value);

		expect(transportConfig()).toMatchObject({ requireTLS: expected, ignoreTLS: expected });
	});
});

describe('sendEmail', () => {
	it('logs the message instead of sending when SMTP is not configured', async () => {
		const log = vi.spyOn(console, 'info').mockImplementation(() => {});
		const { createTransport } = fakeTransport();

		expect(await sendEmail(message)).toBe(true);

		expect(createTransport).not.toHaveBeenCalled();
		const output = log.mock.calls[0][0] as string;
		expect(output).toContain('[EMAIL DISPATCH (LOCAL / NO SMTP)]');
		expect(output).toContain('To: recipient@example.com');
		expect(output).toContain('Plain text');
	});

	it('sends through the transport when configured', async () => {
		vi.stubEnv('SMTP_HOST', 'smtp.example.com');
		vi.stubEnv('SMTP_USER', 'mailer@example.com');
		vi.stubEnv('SMTP_FROM', 'Site Admin <noreply@example.com>');
		const { sendMail } = fakeTransport();

		expect(await sendEmail({ ...message, html: '<p>HTML text</p>' })).toBe(true);

		expect(sendMail).toHaveBeenCalledWith({
			from: 'Site Admin <noreply@example.com>',
			...message,
			html: '<p>HTML text</p>'
		});
	});

	it('sends from SMTP_USER, then a placeholder, when SMTP_FROM is unset', async () => {
		vi.stubEnv('SMTP_HOST', 'smtp.example.com');
		const { sendMail } = fakeTransport();

		await sendEmail(message);
		expect(sendMail.mock.calls[0][0].from).toBe('noreply@localhost');

		vi.stubEnv('SMTP_USER', 'mailer@example.com');
		await sendEmail(message);
		expect(sendMail.mock.calls[1][0].from).toBe('mailer@example.com');
	});

	it('reports a delivery failure without throwing', async () => {
		vi.stubEnv('SMTP_HOST', 'smtp.example.com');
		fakeTransport(vi.fn<SendMail>().mockRejectedValue(new Error('Connection timed out')));
		const logged = vi.spyOn(console, 'error').mockImplementation(() => {});

		expect(await sendEmail(message)).toBe(false);

		expect(logged).toHaveBeenCalledWith(
			expect.stringContaining('Failed to send email to recipient@example.com'),
			expect.any(Error)
		);
	});
});

describe('sendPasswordResetEmail', () => {
	it('puts the reset link in both the text and HTML bodies', async () => {
		vi.stubEnv('SMTP_HOST', 'smtp.example.com');
		const { sendMail } = fakeTransport();
		const link = 'https://example.com/admin/reset?token=test-token-123';

		expect(await sendPasswordResetEmail('admin@example.com', link)).toBe(true);

		const sent = sendMail.mock.calls[0][0];
		expect(sent.to).toBe('admin@example.com');
		expect(sent.subject).toBe('Password Reset Request');
		expect(sent.text).toContain(link);
		expect(sent.html).toContain(`href="${link}"`);
	});
});
