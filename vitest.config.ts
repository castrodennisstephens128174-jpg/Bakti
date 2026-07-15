import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests/e2e/**'],
    globals: false,
    passWithNoTests: true,
    testTimeout: 15_000,
    env: {
      DRIZZLE_DATABASE_URL: 'postgres://test:test@localhost:5432/test',
      SESSION_SECRET: 'test-session-secret-at-least-32-characters-long',
      STELLAR_NETWORK: 'testnet',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/server/service/**', 'src/server/lib/**'],
      exclude: ['src/server/db/**', 'src/server/stellar/**', '**/*.d.ts'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@/server': path.resolve(__dirname, './src/server'),
      '@/ui': path.resolve(__dirname, './src/ui'),
      '@/i18n': path.resolve(__dirname, './src/i18n'),
      '@': path.resolve(__dirname, './'),
    },
  },
});
