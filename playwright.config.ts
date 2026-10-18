import { defineConfig } from '@playwright/test';

// E2E runs against the BUILT site (dist/ via astro preview) — the artifact that
// ships, not the dev server.
export default defineConfig({
  testDir: 'test/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    // 127.0.0.1, not "localhost": astro preview binds to whichever of ::1 / 127.0.0.1 "localhost" resolves to on the
    // machine, and the readiness check then waited the full timeout on the other one (WebServer timed out).
    baseURL: 'http://127.0.0.1:4321',
  },
  webServer: {
    command: 'npx astro preview --host 127.0.0.1 --port 4321',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
