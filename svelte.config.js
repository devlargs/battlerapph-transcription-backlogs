import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({ fallback: '200.html' }),
		paths: {
			// Empty on Vercel (serves at the domain root). Set BASE_PATH=/<sub-path>
			// only when serving the app from a sub-directory.
			base: process.env.BASE_PATH ?? ''
		}
	}
};

export default config;
