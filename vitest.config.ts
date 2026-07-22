import { defineConfig } from 'vitest/config';

// Formula tests only — pure functions, node environment, no DOM.
// UI behaviour is covered by Playwright against the built site (test/e2e).
export default defineConfig({
  test: {
    include: ['test/calculators/**/*.test.ts'],
    environment: 'node',
  },
});
