import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import { fixupConfigRules } from '@eslint/compat'
import reactCompilerPlugin from 'eslint-plugin-react-compiler'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import nextConfig from 'eslint-config-next'
import globals from 'globals'

export default defineConfig([
  // ── Global ignores ────────────────────────────────────────────────────
  {
    ignores: [
      '**/.next',
      '**/.worktrees/**',
      '**/.cache',
      '**/package-lock.json',
      '**/public',
      '**/node_modules',
      '**/next-env.d.ts',
      '**/next.config.ts',
      '**/pnpm-lock.yaml',
      '**/.gitignore',
      '**/html',
      '**/cypress',
      '**/coverage',
      '**/*.mjs',
    ],
  },

  // ── Base recommended configs ──────────────────────────────────────────
  js.configs.recommended,

  // ── Next.js recommended rules ─────────────────────────────────────────
  ...fixupConfigRules(nextConfig),

  // ── Main configuration ────────────────────────────────────────────────
  {
    files: ['**/*.{js,jsx,ts,tsx}'],

    plugins: {
      'react-compiler': reactCompilerPlugin,
      prettier: prettierPlugin,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      // ── Prettier integration ──────────────────────────────────────────
      'prettier/prettier': 'warn',

      // ── React Compiler (essential — compiler is enabled) ──────────────
      'react-compiler/react-compiler': 'warn',

      // ── React rules ───────────────────────────────────────────────────
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-fragments': 'warn',
      'react/self-closing-comp': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react/prop-types': 'off',
      'react/no-children-prop': 'warn',
      'react/button-has-type': 'off',
      'react/display-name': 'warn',
      'react/no-typos': 'warn',
      'react/function-component-definition': [
        'warn',
        {
          namedComponents: 'arrow-function',
        },
      ],
      'react/jsx-pascal-case': 'warn',
      'react/jsx-max-depth': [
        'warn',
        {
          max: 5,
        },
      ],
      'react/jsx-curly-brace-presence': 'warn',
      'react/jsx-sort-props': 'warn',
      'react/no-unstable-nested-components': 'warn',

      // ── React Hooks rules ─────────────────────────────────────────────
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Downgraded from error (eslint-config-next) → warn while codebase is migrated
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/error-boundaries': 'warn',
      'react-hooks/refs': 'warn',

      // ── TypeScript rules ──────────────────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-restricted-types': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',

      // ── General rules ─────────────────────────────────────────────────
      'no-unused-vars': 'off', // Disabled — handled by @typescript-eslint/no-unused-vars
      'arrow-body-style': ['warn', 'as-needed'],
      'no-console': 'warn',
      'linebreak-style': ['warn', 'unix'],
      'no-empty': 'warn',
      'no-duplicate-imports': 'off', // Disabled — handled by @typescript-eslint/consistent-type-imports
      'object-shorthand': 'warn',
      eqeqeq: ['warn', 'always', { null: 'ignore' }],
      'prefer-const': 'warn',
      'no-var': 'warn',
      curly: ['warn', 'multi-line', 'consistent'],

      // ── Import restrictions (enforce barrel imports) ──────────────────
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: '@/lib/solana/utils',
              message: 'Import from @/lib/solana barrel instead.',
            },
          ],
        },
      ],
    },
  },

  // ── Test-specific overrides ───────────────────────────────────────────
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Prettier config to disable conflicting rules (must be last)
  prettierConfig,
])
