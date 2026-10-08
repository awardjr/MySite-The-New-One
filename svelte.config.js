import adapter from '@sveltejs/adapter-node';

try {
	process.loadEnvFile?.();
} catch {
	// Ignore missing .env file
}

const envTrustedOrigins = (process.env.TRUSTED_ORIGINS || '')
	.split(',')
	.map((s) => s.trim())
	.filter(Boolean);

const trustedOrigins = Array.from(
	new Set([process.env.ORIGIN, ...envTrustedOrigins].filter(Boolean))
);

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:', 'https:'],
				'font-src': ['self', 'data:'],
				'connect-src': ['self'],
				'frame-ancestors': ['none'],
				'base-uri': ['self'],
				'form-action': ['self']
			}
		},
		...(trustedOrigins.length > 0
			? {
					csrf: {
						trustedOrigins
					}
				}
			: {})
	}
};

export default config;
