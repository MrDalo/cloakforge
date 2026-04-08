import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // Default environment for pure TypeScript/Solana unit tests.
    // Component test files that need browser APIs carry the file-level
    // pragma `// @vitest-environment jsdom` to opt into jsdom per file.
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
