# ADR-001: Astro 5 + React islands on Cloudflare Pages

**Status:** Accepted · **Date:** 2026-07-20 · **Decider:** shashi (owner), with Claude analysis

## Context

v2 (React 18 SPA + Vite + Puppeteer prerender on Apache) produced serious GSC damage:
850 pages "crawled, not indexed" because ranked content sat behind an
IntersectionObserver that never fired in headless prerender; 842 redirect entries and
169 alternate-canonical entries from the dual `/x` + `/en/x/` URL scheme. The site is
345+ calculator pages that are ~95% static educational content with one small
interactive form each. SEO is the #1 business driver.

## Options considered

1. **Next.js 15, static export.** Real HTML at build time, single React dialect.
   A Phase 0 scaffold was actually built. Rejected because: full-page hydration ships
   ~100 KB+ React runtime on every page; the Server/Client Component boundary is a
   permanent bug source (the Phase 0 scaffold itself hit it — config objects with
   functions can't cross the boundary); no SEO advantage over Astro to pay for that.
2. **Astro 5 + React islands.** Chosen — see decision.
3. **Qwik / SolidStart / SvelteKit.** Rejected: their advantages target app-heavy
   sites, and each would force rewriting all 345 React calculator modules. Months of
   risk, zero SEO gain over static HTML.
4. **Stay on v2 and keep patching.** Rejected: the prerender pipeline and dual-URL
   scheme are structural; patches (already applied) mitigate but cannot fix them.

## Decision

**Astro 5** with the React integration. Pages are static HTML; educational content is
server-rendered React (no client JS); the calculator form is the only hydrated island
(`client:visible`), which loads its own config chunk by id. All v2 calculator logic,
types, and registry carry over verbatim.

**Hosting: Cloudflare Pages** (free tier, global CDN, `_redirects`/`_headers` files,
deploy on git push) replaces Apache + hand-maintained `.htaccess`.

## Consequences

- (+) Near-zero JS on content pages → best Core Web Vitals of any option → strongest
  ranking signal; content is greppable in `dist/`.
- (+) No server runtime: security surface shrinks to repo + supply chain.
- (+) One URL scheme kills the two largest GSC error classes structurally.
- (−) Second template dialect (`.astro`) alongside TSX; contributors must learn the
  "static by default, hydrate explicitly" model.
- (−) Island props must be JSON-serializable — documented in ARCHITECTURE.md.
- (−) Ecosystem smaller than Next.js, accepted given the site is content-shaped.

## Revisit triggers

Reconsider only if the site gains genuinely app-like features (accounts, saved
sessions, server APIs) that static + islands cannot express cleanly.
