import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// One-shot structural audit across every calculator page — not a per-page unit
// test, a single sweep that reuses one browser context (343 separate Playwright
// tests would be dominated by per-test setup overhead).
//
// Checks the defect signatures found via manual spot-check + first full sweep
// on 2026-07-23/24:
//   - hidden internal-data results (id starts with "_") leaking as raw JSON
//   - multi-line result values collapsed into a run-on line
// plus common calculator-page failure modes worth catching for free:
//   - horizontal overflow (layout bug)
//   - missing H1 / no results rendered (hydration failure)
//   - console errors during load
//
// Dropped the "undefined"/"NaN" text check after the first run: every hit was
// a false positive (legitimate math prose — "cot is undefined when tan=0",
// FAQ text about NaN handling). All calculators guard their formulas with
// isNaN()/isFinite() before rendering; the literal words are content, not bugs.

const sitemapPath = path.resolve(__dirname, '../../dist/sitemap-0.xml');
const sitemapXml = fs.readFileSync(sitemapPath, 'utf-8');
const allUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const calcRoutes = allUrls
  .filter((u) =>
    /\/(finance|health|math|everyday|automotive|ecommerce|realestate|engineering|industrial|devtools|diy)\/[a-z0-9-]+\/$/.test(
      u
    )
  )
  .map((u) => new URL(u).pathname);

const JSON_LEAK_RE = /\{"[a-zA-Z]+":/;

// Tools whose entire purpose is to display raw JSON/structured data as their
// primary output (a JSON formatter, a JWT decoder). Not a bug on these pages.
const JSON_DISPLAY_ALLOWED = new Set([
  '/devtools/json-formatter/',
  '/devtools/jwt-debugger/',
  '/engineering/crypto-hash-generator/',
]);

test.describe('full-site structural audit', () => {
  test(`sweep ${calcRoutes.length} calculator pages for structural defects`, async ({ page }) => {
    test.setTimeout(30 * 60 * 1000); // 30 min — ~343 pages at a few seconds each

    const findings: string[] = [];
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    for (const route of calcRoutes) {
      consoleErrors.length = 0;
      try {
        await page.goto(route, { waitUntil: 'networkidle', timeout: 15_000 });
      } catch {
        findings.push(`${route}: navigation timed out / failed to load`);
        continue;
      }

      // Let the client:visible island hydrate — wait for a results heading or
      // any input, whichever appears first; don't fail the whole sweep if a
      // page legitimately has no calculator (shouldn't happen for these routes).
      await page.waitForTimeout(1200);

      const h1 = await page.locator('h1').first().textContent().catch(() => null);
      if (!h1 || !h1.trim()) findings.push(`${route}: missing or empty <h1>`);

      const mainText = await page.locator('main').innerText().catch(() => '');

      if (JSON_LEAK_RE.test(mainText) && !JSON_DISPLAY_ALLOWED.has(route)) {
        const snippet = mainText.match(new RegExp(`.{0,40}${JSON_LEAK_RE.source}.{0,60}`));
        findings.push(`${route}: raw JSON leaking into page text — "${snippet?.[0] ?? '(match, snippet unavailable)'}"`);
      }

      const overflow = await page.evaluate(() => {
        const html = document.documentElement;
        return html.scrollWidth - window.innerWidth;
      });
      if (overflow > 20) {
        findings.push(`${route}: horizontal overflow (${overflow}px wider than viewport)`);
      }

      const hasResults = await page.getByText('Results', { exact: false }).first().isVisible().catch(() => false);
      if (!hasResults) {
        findings.push(`${route}: no "Results" section detected (hydration may have failed)`);
      }

      if (consoleErrors.length) {
        findings.push(`${route}: console error(s) — ${consoleErrors.slice(0, 2).join(' | ')}`);
      }
    }

    if (findings.length) {
      console.log(`\n=== FULL-SITE AUDIT: ${findings.length} finding(s) across ${calcRoutes.length} pages ===`);
      for (const f of findings) console.log(' - ' + f);
    }
    expect(findings, findings.join('\n')).toEqual([]);
  });
});
