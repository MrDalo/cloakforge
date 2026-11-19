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
    // The default 5s limit is too tight for jsdom form tests (multi-step user interactions)
    // and tests that dynamically import large component trees, especially on a cold transform
    // cache or a loaded CI runner. 30s still fails fast on genuinely hanging tests.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '.worktrees/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
