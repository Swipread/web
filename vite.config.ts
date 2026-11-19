import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    restoreMocks: true,
    env: { VITE_API_BASE_URL: 'http://api.test' },
    // Headroom for slower machines such as CI runners (default 5 s).
    testTimeout: 15_000,
  },
})
