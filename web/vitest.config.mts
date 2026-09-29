// web/vitest.config.mts
import path from 'node:path'
import react from '@vitejs/plugin-react'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'tests/e2e/**'],
    // lib/env.ts throws without these; tests never talk to Sanity.
    env: {NEXT_PUBLIC_SANITY_PROJECT_ID: 'iq6do512', NEXT_PUBLIC_SANITY_DATASET: 'production'},
  },
  resolve: {alias: {'@': path.resolve(import.meta.dirname)}},
})
