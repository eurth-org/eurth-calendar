import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // The engine's tests count through millions of days; a slow CI runner needs more than the default five seconds.
    testTimeout: 120_000,
  },
});
