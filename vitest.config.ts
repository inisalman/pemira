import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
    // Integration tests (tests/integration) need DATABASE_URL; see tests/README.
    hookTimeout: 30_000,
  },
})
