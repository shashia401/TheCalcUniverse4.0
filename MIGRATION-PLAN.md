# TheCalcUniverse 4.0 — Migration Plan

**Decision date:** 2026-07-20
**Stack:** Astro 5 + React islands · TypeScript strict · Tailwind 3 · Cloudflare Pages
**Replaces:** React 18 SPA + Vite + Puppeteer prerender (v2, `TheCalcUnivers2.0.0`) on Apache

## Why we are migrating

v2's architecture made Google's job hard and ours fragile:

1. **Prerender fragility.** Content only existed in HTML if a headless Chromium run captured it. IntersectionObserver never fired in that run, so educational content (the part Google ranks) was invisible → 850 "crawled, not indexed" pages in GSC.
2. **URL duplication.** Every page existed at `/x` and `/en/x/`, generating 842 redirect entries and 169 alternate-canonical entries in GSC.
3. **Trust erosion.** Coverage thresholds were gamed, secrets leaked into git history, `.htaccess` rules were hand-maintained.

4.0 fixes these **structurally**, not with patches: content is static HTML at build time, there is exactly one URL per page, and quality gates run in CI where they cannot be quietly lowered.

## The four pillars (every phase is reviewed against these)

| Pillar | How 4.0 satisfies it |
|---|---|
| **Security** | Static files only — no server runtime to patch. Secrets are impossible in output. `.gitignore` hardened from day one. Security headers in `public/_headers`. `npm audit` in CI. |
| **SEO** | Educational content rendered to HTML at build time (no JS needed to see it). One canonical URL scheme with trailing slashes. Full JSON-LD. 301 map for every indexed v2 URL. Near-zero JS shipped on content — only the calculator form hydrates. |
| **Maintainability** | Static-by-default: no server/client component boundary to get wrong. Adding a calculator remains "one config module + one registry line." Calculator logic is framework-agnostic TypeScript, untouched from v2. |
| **Documentation** | `ARCHITECTURE.md`, ADRs in `docs/adr/`, `docs/adding-a-calculator.md` — written before the code they describe. |

## Phases

> **Status (2026-07-20):** Phases 0–4 complete and verified (531 pages, 7,173 formula
> tests + 8 E2E tests green, zero broken internal links). Phase 5 runbook is in
> DEPLOYMENT.md — the remaining steps (GitHub repo, Cloudflare Pages, DNS) need owner access.

### Phase 0 — Foundation & documentation (current)
- This plan, `ARCHITECTURE.md`, `ADR-001-stack-choice.md`, `docs/adding-a-calculator.md`.
- Astro 5 scaffold (React + Tailwind integrations, TS strict, `@/*` alias).
- v2 source carried over verbatim: `src/calculators/` (registry + all configs), `src/types/`, `src/config/`, `src/blog/`.
- Core components: `EducationalSection` (server-rendered React → static HTML), `CalculatorForm` (the only hydrated island), JSON-LD builder.
- Smoke routes: homepage, `[category]/`, `[category]/[calculator]/` via `getStaticPaths()`.
- Security baseline: `_headers`, `_redirects`, hardened `.gitignore`.
- **Exit criteria:** `astro build` succeeds; all calculator routes emit static HTML containing educational content; zero secrets in repo.

### Phase 1 — Routing & static generation (2–3 days)
- Blog routes (`/blog/[slug]/`), comparison pages, search page (client island), 404.
- Canonical/trailing-slash discipline verified with a link checker over `dist/`.

### Phase 2 — SEO & redirects (2 days)
- Per-page metadata from registry; JSON-LD: SoftwareApplication, FAQPage, HowTo, MathSolver, BreadcrumbList.
- `@astrojs/sitemap`, `robots.txt`, `llms.txt`.
- **Redirect map:** every indexed v2 URL (all `/en/` variants included) 301 → its 4.0 URL via `_redirects`. This preserves existing rankings through cutover.

### Phase 3 — UI parity + design pass (1–2 weeks)
- Full calculator layout, header/footer, dark mode, related calculators/posts, blog rendering.
- Deliberate design pass (typography, palette, signature elements) — not a template port.

### Phase 4 — Quality gates & CI (3–4 days)
- Port v2 Vitest formula tests (pure functions — no changes needed).
- Playwright E2E against built `dist/`.
- Lighthouse CI budgets that **fail the build**: Performance ≥ 95, SEO ≥ 95.
- GitHub Actions: build + test + audit + preview deploy per PR. Thresholds live in CI config where lowering them is a visible diff.

### Phase 5 — Launch (2–3 days)
- Cloudflare Pages production project, DNS cutover, redirects live.
- Sitemap submitted to GSC; indexing monitored for 2 weeks post-launch.

**Total estimate:** 3–4 weeks. v2 stays live and earning throughout; its fixed build (deployed separately) starts healing GSC in parallel.

## Out of scope for 4.0
- Rewriting calculator logic (it ports verbatim — it is the crown jewels).
- Backend/user accounts (static-only is a security and cost feature).
- i18n (one language, one URL scheme; revisit only with real demand).

## Standing security actions (independent of this migration)
- Rotate both DeepSeek API keys exposed via v2's `code.bat` (`sk-99e4…6695`, `sk-8987…6809`) in the DeepSeek dashboard. The file is gitignored now, but the keys live in git history and must be considered burned.
