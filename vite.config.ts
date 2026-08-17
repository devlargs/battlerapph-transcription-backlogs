import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			// data/json is imported by src/lib/data.ts but lives outside src/, which
			// SvelteKit's default allow list does not cover. Dev-only: the chunks are
			// bundled at build time, never fetched by path in production.
			allow: ['data']
		}
	}
});
