import fs from 'node:fs';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

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
	test: {
		environment: 'node',
		include: ['tests/**/*.{test,spec}.ts'],
		setupFiles: ['tests/setup.ts']
	}
});
