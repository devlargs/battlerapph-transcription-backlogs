import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({ fallback: '200.html' }),
		paths: {
			// Set BASE_PATH=/<repo-name> when deploying to GitHub Pages project sites.
			base: process.env.BASE_PATH ?? ''
		}
	}
};

export default config;
