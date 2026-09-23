import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '$env/dynamic/private';

export interface SendEmailOptions {
	to: string;
	subject: string;
	text: string;
	html?: string;
}

/**
 * Returns an environment variable from SvelteKit dynamic private env or process.env.
 */
function getEnv(key: string): string | undefined {
	return env[key] || process.env[key];
}

/**
 * Returns true if SMTP transport credentials / host are configured in the environment.
 */
export function isSmtpConfigured(): boolean {
	return Boolean(getEnv('SMTP_HOST') || getEnv('SMTP_SERVICE'));
}

/**
 * Creates and returns a Nodemailer transporter instance if SMTP is configured.
 */
export function getEmailTransporter(): Transporter | null {
	const host = getEnv('SMTP_HOST');
	const service = getEnv('SMTP_SERVICE');
	const user = getEnv('SMTP_USER');
	const pass = getEnv('SMTP_PASS');
	const portRaw = getEnv('SMTP_PORT');
	const secureRaw = getEnv('SMTP_SECURE');

	if (!host && !service) {
		return null;
	}

	const port = portRaw ? Number.parseInt(portRaw, 10) : 587;
	const secure = secureRaw !== undefined ? secureRaw === 'true' || secureRaw === '1' : port === 465;

	const config: Record<string, unknown> = {};

	if (service) {
		config.service = service;
	} else if (host) {
		config.host = host;
		config.port = Number.isNaN(port) ? 587 : port;
		config.secure = secure;
	}

	if (user || pass) {
		config.auth = {
			user: user ?? '',
			pass: pass ?? ''
		};
	}

	const requireTlsRaw = getEnv('SMTP_REQUIRE_TLS');
	if (requireTlsRaw !== undefined) {
		config.requireTLS = requireTlsRaw === 'true' || requireTlsRaw === '1';
	}

	const ignoreTlsRaw = getEnv('SMTP_IGNORE_TLS');
	if (ignoreTlsRaw !== undefined) {
		config.ignoreTLS = ignoreTlsRaw === 'true' || ignoreTlsRaw === '1';
	}

	return nodemailer.createTransport(config);
}

/**
 * Sends an email using SMTP transport when configured, or logs to console when no SMTP server is configured.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
	const transporter = getEmailTransporter();

	if (!transporter) {
		// Standardized email delivery notification in server logs for local dev/testing
		console.info(
			`\n============================================================\n` +
				`[EMAIL DISPATCH (LOCAL / NO SMTP)]\n` +
				`To: ${options.to}\n` +
				`Subject: ${options.subject}\n` +
				`------------------------------------------------------------\n` +
				`${options.text}\n` +
				`============================================================\n`
		);
		return true;
	}

	const from = getEnv('SMTP_FROM') || getEnv('SMTP_USER') || 'noreply@localhost';

	try {
		await transporter.sendMail({
			from,
			to: options.to,
			subject: options.subject,
			text: options.text,
			html: options.html
		});
		return true;
	} catch (error) {
		console.error(`[SMTP ERROR] Failed to send email to ${options.to}:`, error);
		return false;
	}
}

/**
 * Sends a password reset link to the specified admin email address.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
	const subject = 'Password Reset Request';
	const text =
		`Hello,\n\n` +
		`A request was received to reset your admin password.\n\n` +
		`You can reset your password using the following link:\n` +
		`${resetUrl}\n\n` +
		`This link will expire in 15 minutes and can only be used once.\n` +
		`If you did not request a password reset, you can safely ignore this message.\n`;

	const html =
		`<p>Hello,</p>` +
		`<p>A request was received to reset your admin password.</p>` +
		`<p><a href="${resetUrl}">Click here to reset your password</a></p>` +
		`<p>Or copy and paste this URL into your browser:</p>` +
		`<p><code>${resetUrl}</code></p>` +
		`<p>This link will expire in 15 minutes and can only be used once.</p>` +
		`<p>If you did not request a password reset, you can safely ignore this message.</p>`;

	return sendEmail({ to, subject, text, html });
}
