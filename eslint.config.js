// @ts-check
/* eslint-disable @typescript-eslint/no-require-imports — CJS config file */
const tseslint = require('typescript-eslint');
const reactHooks = require('eslint-plugin-react-hooks');
const reactRefresh = require('eslint-plugin-react-refresh').default;

module.exports = tseslint.config(
  { ignores: ['build/', 'node_modules/', '**/*.js', '**/*.cjs', '**/*.mjs'] },

  // Shared base: recommended rules for all TypeScript files
  ...tseslint.configs.recommended,

  // Server override: type-aware rules
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['server/src/**/*.ts'],
  })),
  {
    files: ['server/src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Express route handlers return Promises — intentional and safe
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      // Allow catch(error: any) pattern common in Express services
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['server/src/**/*.test.ts', 'server/src/__tests__/**/*.ts'],
    rules: {
      // Vitest mock methods (.mockResolvedValue, etc.) are not unbound methods
      '@typescript-eslint/unbound-method': 'off',
      // Test files commonly use any for mock setup
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
    },
  },

  // Client override: React Hooks
  {
    files: ['client/src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Data-fetching in useEffect calls setState asynchronously (microtask) — standard pattern
      'react-hooks/set-state-in-effect': 'warn',
    },
  },

  // Client override: React Refresh
  {
    files: ['client/src/**/*.{ts,tsx}'],
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
);
