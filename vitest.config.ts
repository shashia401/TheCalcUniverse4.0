import { defineConfig } from 'vitest/config';

// Formula tests only — pure functions, node environment, no DOM.
// UI behaviour is covered by Playwright against the built site (test/e2e).
export default defineConfig({
  test: {
    include: ['test/calculators/**/*.test.ts'],
    environment: 'node',
    coverage: {
      // Only the calculate()-bearing logic files this suite is meant to
      // exercise — Panel .tsx components are covered by Playwright E2E
      // (per the comment above), and registry/*.ts files are pure lazy-load
      // metadata with no logic to test.
      include: ['src/calculators/**/index.ts', 'src/calculators/**/index.tsx'],
      exclude: ['src/calculators/**/*Panel.tsx', 'src/calculators/registry/**'],
    },
  },
});
