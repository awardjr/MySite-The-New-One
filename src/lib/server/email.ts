import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/** An environment variable, with a blank value treated as unset. */
function env(key: string): string | undefined {
	return process.env[key] || undefined;
}

/** A true/false environment variable ("true" or "1" is true), or undefined when unset. */
function envFlag(key: string): boolean | undefined {
	const value = env(key);
	return value === undefined ? undefined : value === 'true' || value === '1';
}

/** A mail transport built from the SMTP_* environment variables, or null if SMTP isn't set up. */
export function getEmailTransporter(): Transporter | null {
	const service = env('SMTP_SERVICE');
	const host = env('SMTP_HOST');
	if (!service && !host) return null;

	const port = Number.parseInt(env('SMTP_PORT') ?? '', 10) || 587;
	const user = env('SMTP_USER');
	const pass = env('SMTP_PASS');
	return nodemailer.createTransport({
		// A named service (such as "gmail") brings its own host, port and TLS settings.
		...(service ? { service } : { host, port, secure: envFlag('SMTP_SECURE') ?? port === 465 }),
		...(user || pass ? { auth: { user: user ?? '', pass: pass ?? '' } } : {}),
		requireTLS: envFlag('SMTP_REQUIRE_TLS'),
		ignoreTLS: envFlag('SMTP_IGNORE_TLS')
	});
}

/** Sends an email over SMTP, or prints it to the server log when SMTP isn't set up. */
export async function sendEmail(options: {
	to: string;
	subject: string;
	text: string;
	html?: string;
}): Promise<boolean> {
	const transporter = getEmailTransporter();

	if (!transporter) {
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

	try {
		await transporter.sendMail({
			from: env('SMTP_FROM') || env('SMTP_USER') || 'noreply@localhost',
			...options
		});
		return true;
	} catch (error) {
		console.error(`[SMTP ERROR] Failed to send email to ${options.to}:`, error);
		return false;
	}
}

/** Sends a password reset link to the admin's email address. */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
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

	return sendEmail({ to, subject: 'Password Reset Request', text, html });
}
