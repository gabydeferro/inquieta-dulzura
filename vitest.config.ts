import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [react()],
        test: {
          name: 'client',
          root: './client',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./src/__tests__/setup.ts'],
          include: ['src/__tests__/**/*.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'server',
          root: './server',
          environment: 'node',
          globals: true,
          include: ['src/__tests__/**/*.test.ts'],
        },
      },
    ],
  },
});
