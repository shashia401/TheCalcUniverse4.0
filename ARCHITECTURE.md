# TheCalcUniverse 4.0 — Architecture

Astro 5 static site. Every page is plain HTML generated at build time; the only JavaScript shipped to visitors is the calculator form island on calculator pages.

## The one rule that matters

**Content Google ranks must exist in the HTML file on disk after `astro build`.**
No observers, no hydration, no runtime fetches for content. If you can't `grep` the FAQ text in `dist/`, it's a bug.

## Directory layout

```
src/
  pages/                     — file-based routes (Astro)
    index.astro              — homepage
    [category]/index.astro   — category listing (getStaticPaths from registry)
    [category]/[calculator]/index.astro — calculator page (getStaticPaths from registry)
  layouts/
    BaseLayout.astro         — <head> (meta, canonical, OG, JSON-LD slot), global CSS
  components/
    calculator/
      CalculatorForm.tsx     — THE island. Hydrated with client:visible. Loads its
                               config client-side by calculator id.
      EducationalSection.tsx — React, server-rendered only (NO client directive).
                               Formula, FAQs, examples → static HTML.
      AmortizationPanel.tsx  — extra panel used by 3 loan calculators (island-side).
  lib/
    registry.ts              — server-side helpers over the calculator registry
    jsonld.ts                — builds schema.org objects (SoftwareApplication,
                               FAQPage, HowTo, MathSolver, BreadcrumbList)
  calculators/               — UNCHANGED from v2. Framework-agnostic TypeScript.
    registry/                — per-category metadata (id, title, description, SEO)
    {category}/{id}/index.ts — CalculatorConfig: inputs, calculate(), educational
  types/                     — shared TS types (CalculatorConfig, CalculatorEntry…)
  config/constants.ts        — BASE_URL, SITE_NAME
  blog/                      — post content + registry
  styles/global.css          — design tokens (CSS variables), Tailwind directives
public/
  _headers                   — security headers (Cloudflare Pages)
  _redirects                 — 301 map: v2 URLs → 4.0 URLs (Cloudflare Pages)
docs/
  adr/                       — architecture decision records
  adding-a-calculator.md     — contributor guide
```

## How a calculator page renders

Build time (server, in `[calculator]/index.astro` frontmatter):
1. `getStaticPaths()` reads the registry → one route per calculator (~345).
2. `await entry.loader()` imports the config.
3. Educational content, breadcrumb, metadata, JSON-LD are rendered to **static HTML**.
4. `<CalculatorForm client:visible calculatorId={entry.id} />` emits a placeholder
   that hydrates only when scrolled into view.

Runtime (browser):
1. The island looks up its entry in the registry and calls `entry.loader()` —
   Vite code-splits each config into its own chunk, so a page downloads only its
   own calculator logic (same lazy pattern v2 proved in production).
2. Form renders, `calculate()` runs on every input change. Pure client state;
   nothing else on the page hydrates.

**Why the island loads its own config:** Astro serializes island props to JSON.
`CalculatorConfig` contains functions (`calculate`, `showWhen`, `extraPanel`) which
cannot cross the server→client boundary as props. Passing the `calculatorId` string
and loading client-side is the correct pattern — do not "fix" this by passing config.

## URL scheme

- One URL per page: `/{category}/{calculator-id}/` — lowercase, hyphenated, trailing slash (`trailingSlash: 'always'`).
- No `/en/` prefix anywhere. v2's `/en/` URLs 301 to the new scheme via `_redirects`.
- Canonical = the served URL, exactly. Never a URL that itself redirects.

## Styling

Tailwind 3 + the v2 design-token system (CSS variables in `styles/global.css`,
dark mode via `class`). Guardrails from CLAUDE.md apply: no default Tailwind
palette, animate only transform/opacity, every interactive element has
hover/focus-visible/active states.

## Deployment

Cloudflare Pages, deploy on push. Build command `astro build`, output `dist/`.
`_headers` and `_redirects` are copied from `public/` automatically.
No server, no cron, no `.htaccess`.

## Security model

- No runtime = no server attack surface. The threat model is supply chain + repo hygiene:
  - `npm audit` in CI; dependencies pinned by lockfile.
  - No secrets exist in this project at all. If a future feature needs one, it goes
    in Cloudflare Pages env vars, never in the repo. `.gitignore` blocks `.env*`,
    `*.bat`, `*.key`, `*.pem` preemptively.
  - Security headers (CSP, X-Frame-Options, etc.) in `public/_headers`.
