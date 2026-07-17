import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		root: './',
		include: ['src/**/*.spec.ts'],
		// Loads DATABASE_URL etc. for the integration specs.
		setupFiles: ['dotenv/config'],
	},
	// SWC transforms decorators + emits metadata so Nest DI works under Vitest.
	plugins: [swc.vite()],
})
