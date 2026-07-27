import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Separate from vitest.config.ts on purpose: these tests make real network
 * calls (testnet Horizon, a local Anchor Platform stack) and are opt-in via
 * `pnpm test:anchor`, not part of the default `pnpm test` run.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    globals: false,
    passWithNoTests: true,
    testTimeout: 60_000,
    env: {
      STELLAR_NETWORK: 'testnet',
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
