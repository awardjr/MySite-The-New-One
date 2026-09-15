import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// The built-in CMS reads/writes JSON files on disk and needs a persistent filesystem,
		// so this site is meant to run as a long-lived Node process (e.g. on a VPS), not on a
		// serverless/edge platform. See https://svelte.dev/docs/kit/adapters for alternatives.
		adapter: adapter()
	}
};

export default config;
