import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://thecalcuniverse.com',
  // One URL per page, always with trailing slash — canonical must equal the served URL.
  trailingSlash: 'always',
  output: 'static',
  integrations: [
    react(),
    // global.css owns the @tailwind directives; don't inject a second base sheet
    tailwind({ applyBaseStyles: false }),
    sitemap({
      // noindex pages stay out of the sitemap
      filter: (page) => !page.includes('/search/') && !page.includes('/404/'),
    }),
  ],
  build: {
    // /finance/loan-calculator/index.html — matches trailing-slash URLs on any static host
    format: 'directory',
  },
  vite: {
    optimizeDeps: {
      // Calculator logic + panels are dynamically imported (registry loader:
      // () => import('…/index')), so `astro dev` doesn't see them at startup and
      // re-optimizes deps the first time each is visited — which returns a 504
      // ("Outdated Optimize Dep") for whatever module is loading at that moment,
      // showing the calculator's loading skeleton (a "white box") until reload.
      // Pre-scanning these entries bundles every calc dependency once, up front,
      // so browsing calc-to-calc no longer triggers re-optimization. Dev-only —
      // the production (rollup) build is unaffected.
      entries: [
        'src/pages/**/*.{astro,ts}',
        'src/calculators/**/index.{ts,tsx}',
        'src/calculators/**/*Panel.tsx',
        'src/components/**/*.{ts,tsx}',
      ],
    },
  },
});
