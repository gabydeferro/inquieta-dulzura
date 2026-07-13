// @ts-check
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
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
        tsconfigRootDir: import.meta.dirname,
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
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/await-thenable': 'warn',
    },
  },
  {
    files: [
      'client/src/**/*.test.ts',
      'client/src/**/*.test.tsx',
      'client/src/__tests__/**/*.ts',
      'client/src/__tests__/**/*.tsx',
    ],
    rules: {
      // Client tests (jsdom environment) — no typed linting available
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/require-await': 'off',
      // React testing library patterns
      'react-hooks/set-state-in-effect': 'off',
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
