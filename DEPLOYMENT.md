# TheCalcUniverse 4.0 — Deployment Runbook

Target: **Cloudflare Pages**, deploy-on-push from a GitHub repository.
Everything below the "One-time setup" section is repeatable; setup steps are done once
by the site owner (they need dashboard/DNS access).

## Pre-flight (already enforced by CI, verify once manually)

```bash
npm ci
npm run build          # 531 pages, ~30 s
npm test               # 7,173 formula tests
npm run test:e2e       # 8 E2E smoke tests against dist/
```

Spot-check the artifact:

```bash
grep "Frequently Asked Questions" dist/finance/loan-calculator/index.html
ls dist/_redirects dist/_headers dist/robots.txt dist/llms.txt dist/sitemap-index.xml
```

## One-time setup (owner)

1. **Create the GitHub repo** and push this project (`git init`, add remote, push).
   The repo has no secrets — `.gitignore` blocks every secret carrier; keep it that way.
2. **Cloudflare Pages**: Dashboard → Workers & Pages → Create → Pages →
   Connect to Git → select the repo.
   - Build command: `npm run build`
   - Output directory: `dist`
   - No environment variables needed.
3. First deploy produces `<project>.pages.dev`. **Test it thoroughly** — especially
   `/en/finance/loan-calculator/` (must 301 to `/finance/loan-calculator/`) and
   `/en/methodology/finance/loan-calculator/` (must 301 to the calculator).
4. **Custom domain**: Pages project → Custom domains → add `thecalcuniverse.com`.
   Cloudflare adjusts DNS automatically if the zone is on Cloudflare; otherwise
   point the apex (CNAME flattening / A records per the dashboard instructions).
5. **www redirect**: `_redirects` cannot match hostnames. In the Cloudflare zone add a
   Bulk Redirect (or a Redirect Rule): `www.thecalcuniverse.com/*` →
   `https://thecalcuniverse.com/$1`, 301, preserve path.

## Cutover checklist

- [ ] `.pages.dev` preview fully verified (calculators compute, dark mode, redirects)
- [ ] Custom domain live, HTTPS green
- [ ] Old Apache hosting left running until DNS TTL has fully rolled over, then retired
- [ ] **GSC**: submit `https://thecalcuniverse.com/sitemap-index.xml` in Search Console
- [ ] **GSC**: remove the old `sitemap.xml` reference (it now 301s to sitemap-index.xml — fine)
- [ ] Verify AdSense still serves (ads.txt is deployed at the root)
- [ ] Check `https://thecalcuniverse.com/robots.txt` and `/llms.txt` respond

## Post-launch monitoring (first 2 weeks)

Daily, in GSC:
- **Coverage → Page indexing**: "Crawled – currently not indexed" should start falling
  as Google refetches pages and finds real content. Expect movement in 1–3 weeks, not days.
- **Redirects class**: /en/ URLs will move from "indexed" to "Page with redirect" — that is
  correct and expected; they hand their equity to the clean URLs.
- **Soft 404s**: should drop to ~0 (the broken internal blog links that caused them are fixed).

Weekly:
- Run Lighthouse on 2–3 calculator pages (target: Performance ≥ 95, SEO ≥ 95 — the pages
  ship almost no JS, so anything lower means a regression).
- `npm audit` locally; watch for the Astro major that clears the esbuild dev-server advisory
  (then tighten CI's audit gate back to `--audit-level=high`).

## Rollback

Cloudflare Pages keeps every deployment. Dashboard → the project → Deployments →
"..." on any previous green deployment → **Rollback**. Instant, no rebuild.

## Standing security items

- Rotate the two DeepSeek API keys exposed in v2's git history (`sk-99e4…6695`,
  `sk-8987…6809`) in the DeepSeek dashboard. Unrelated to this deploy, still open.
- Never add secrets to this repo. If a future feature needs one, use Cloudflare
  Pages environment variables and read it only at build time.
