/* eslint-disable import/no-anonymous-default-export */
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import js from '@eslint/js'

export default [
  // Global ignores
  {
    ignores: [
      '**/.next',
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

  // Base ESLint recommended
  js.configs.recommended,

  // Main configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],

    plugins: {
      '@typescript-eslint': typescriptEslint,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      prettier: prettierPlugin,
    },

    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
      },
      parser: tsParser,
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
      // Prettier integration
      'prettier/prettier': 'warn',

      // React rules
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

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',

      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
        },
      ],
      // Disabled: Too strict for useCallback where TypeScript infers return types
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-restricted-types': 'warn',

      // General rules
      'arrow-body-style': ['warn', 'as-needed'],
      'no-console': 'warn',
      'no-unused-vars': 'off',
      'linebreak-style': ['warn', 'unix'],
      'no-empty': 'warn',
      'no-duplicate-imports': 'warn',
      'object-shorthand': 'warn',
    },
  },

  // Test files: vitest globals and pragmatic typing allowances
  {
    files: [
      '**/__tests__/**/*.{js,jsx,ts,tsx}',
      '**/*.{test,spec}.{js,jsx,ts,tsx}',
    ],

    languageOptions: {
      globals: {
        ...globals.node,
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },

    rules: {},
  },

  // Prettier config to disable conflicting rules (must be last)
  prettierConfig,
]
