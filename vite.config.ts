import fs from 'node:fs';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

// `npm run dev` creates these with scripts/dev-cert.sh; when present, dev and preview use https.
const DEV_KEY = '.certs/localhost-key.pem';
const DEV_CERT = '.certs/localhost.pem';
const https =
	fs.existsSync(DEV_KEY) && fs.existsSync(DEV_CERT)
		? { key: fs.readFileSync(DEV_KEY), cert: fs.readFileSync(DEV_CERT) }
		: undefined;

export default defineConfig({
	server: { https },
	preview: { https },
	build: {
		rolldownOptions: { output: { comments: { legal: true } } }
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			adapter: adapter(),
			paths: {
				relative: false,
				// SvelteKit fixes the site origin at build time. When `ORIGIN` is set for the build
				// it is baked in (and the request's Host header is ignored); otherwise the origin
				// is derived from each request, and src/lib/server/origin.ts reads `ORIGIN` at
				// runtime for links that leave the site.
				origin: process.env.ORIGIN || undefined
			},
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self', 'data:', 'https:'],
					'font-src': ['self', 'data:'],
					'connect-src': ['self', 'https://public.api.bsky.app'],
					'frame-src': [
						'https://www.youtube.com',
						'https://player.vimeo.com',
						'https://www.dailymotion.com',
						'https://geo.dailymotion.com',
						'https://open.spotify.com',
						'https://player.twitch.tv',
						'https://clips.twitch.tv',
						'https://embed.bsky.app'
					],
					'frame-ancestors': ['none'],
					'base-uri': ['self'],
					'form-action': ['self']
				}
			}
		})
	],
	test: { environment: 'node', include: ['tests/**/*.{test,spec}.ts'] }
});
