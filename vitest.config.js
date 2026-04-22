import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['server/core/__tests__/**/*.test.js'],
    environment: 'node',
    globals: true,
  },
})
