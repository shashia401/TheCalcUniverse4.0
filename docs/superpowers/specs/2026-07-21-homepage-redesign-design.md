# Homepage Redesign — Design Spec

**Date:** 2026-07-21
**Scope:** `src/pages/index.astro` (homepage only). Calculator-page template redesign is a **separate, follow-up pass** (see "Out of scope").
**Goals (business):** high organic traffic, easy to rank, trust/accuracy.
**Direction (agreed):** Premium & calm base, with a few bold purposeful moments. Keep the warm amber/rust brand and Figtree. Dark mode preserved.

---

## Why a homepage redesign serves the business goals

The homepage is **not** the primary ranking surface — the 343 individual calculator pages are. So the homepage's jobs are:

1. **Trust / brand** — convince a first-time visitor the numbers are credible (accuracy signal).
2. **Conversion** — get them into a calculator immediately (search + a live tool above the fold).
3. **Crawl & authority flow** — strong internal links to top calculators, categories, and guides so link authority and crawl budget reach the money pages.
4. **Core Web Vitals** — stay fast (few/no new client islands), because CWV is a ranking input and a bounce factor.

This redesign does not chase homepage keyword rankings; it strengthens the four levers above.

---

## Current state (baseline)

`src/pages/index.astro` today: dark graph-paper hero (search bar + quick-pick chips + trust stats) → separate embedded live BMI calculator section → "Most used" grid → category grid (per-category accent colors already added) → "Numbers you can actually trust" trust band (already added) → Latest guides → FAQ (with FAQPage schema).

Two increments already landed (keep them): per-category accent colors + hover lift on category cards; the trust band. This spec builds the surrounding structure up to match.

---

## Section-by-section design

### 1. Hero — split, above the fold (the primary change)

Two-column layout on desktop; stacks on mobile (search first, calculator second).

**Left column:**
- One confident headline (kept): *"Don't just get the answer. See the work."* — larger, tighter tracking than today.
- A one-line subhead reinforcing the differentiator (tested/deterministic, not an AI guess).
- **Large search bar** as the unmistakable primary action (amber/rust accent). Existing `SearchBox` island (`client:idle`), styled bigger.
- Category quick-pick chips beneath search (existing, restyled).
- Tight **trust stat row**: `343 calculators · tested formulas · no sign-up`.

**Right column:**
- The **live calculator presented as a real product** — an elevated card (shadow, border, clear header), not the current flat embed.
- Default calculator: **BMI** (2 inputs → instant result + gauge; fastest "this actually computes" proof; universally understood). Uses the existing `CalculatorForm` island (`client:visible`) + the existing build-time `ExampleResult` SEO fallback so a result is in static HTML for crawlers.
- A small "Full calculator →" link to the dedicated BMI page (internal link + escape hatch).

**Background:** keep the graph-paper motif but calmer — softer contrast / less busy — so it reads premium, not noisy.

### 2. Typography & rhythm (the trust signal)

- Increase the type scale: hero headline larger and tighter; a clear step-down to section H2s.
- More line-height and larger inter-section spacing so the page breathes. Keep Figtree (headings + body).

### 3. Color — brand earns its place

- **Amber/rust** reserved for: the hero accent word, the search/primary action, and key result numbers. Not used decoratively.
- **Per-category accent colors** on the category cards stay (already implemented, full static Tailwind classes so JIT detects them).
- Result states (gauge/donut) keep their semantic colors.

### 4. Section order below the hero (calm narrative)

1. **Most-used** calculators (quick wins; internal links to high-value pages).
2. **Browse by category** (accented cards; refined hover + spacing).
3. **"Numbers you can actually trust"** band (keep; make it feel intentional, not bolted on — align spacing/typography with the new scale).
4. **Latest guides** (blog; internal links + freshness signal).
5. **FAQ** (kept, with existing FAQPage schema — note: FAQ rich results are restricted, but the schema still aids AI/LLM citation and the content aids trust).

### 5. Motion & accessibility

- Animate **only** `transform` / `opacity`, 150–250ms, all wrapped in `motion-reduce:*` guards.
- Subtle only: cards lift on hover; hero elements fade/rise once on load. No decorative or looping motion.
- Contrast ≥ 4.5:1 in light and dark; visible `focus-visible` rings on every interactive element; real `<label>`s; touch targets ≥ 44px.

### 6. Guardrails (held)

- **Static-first**: calculator results remain crawlable via the existing `ExampleResult`/`.seo-fallback` mechanism. No change to the crawlability model.
- **No new heavy JS**: reuse existing islands (`SearchBox`, `CalculatorForm`); Lucide icons stay SSR-only (zero runtime JS). No new dependencies.
- **No default Tailwind palette** (no `indigo-500`, `blue-600`, etc.) — brand + `accent-*` tokens only.
- **CSS budget**: keep global CSS lean; prefer utilities over new `@apply` bloat.
- **Schema preserved**: existing homepage JSON-LD (WebSite/Organization + FAQPage) stays valid.

---

## Components touched

- `src/pages/index.astro` — layout restructure (hero → split; section spacing/type scale; keep existing sections).
- Possibly small style-only tweaks to how `CalculatorForm` is framed on the homepage (wrapper/card), without changing its logic.
- No calculator logic, registry, or data changes.

## Out of scope (explicit — follow-up passes)

- **Calculator-page template redesign** (`src/pages/[category]/[calculator]/index.astro`) — the SXO "tool below the fold" fix. This is the bigger traffic/ranking lever and gets its own spec + plan next.
- Converter default-value gap and the BMI `reviewedBy` credential mismatch (separate, cheap fixes; tracked, not part of this pass).
- Header/Footer redesign (they're shared and already clean; leave as-is this pass).

## Success criteria

- `astro build` clean; homepage renders in light + dark; before/after screenshots reviewed and approved.
- Hero shows search **and** a working calculator in the first viewport on desktop; stacks sensibly on mobile (375px).
- No new client islands beyond those already present; no new runtime JS on content the page didn't already ship.
- Accent classes + all sections present in static `dist/index.html`; SEO fallback result still in static HTML.
- SVG safety gate passes; no default-palette Tailwind colors introduced; contrast/focus/reduced-motion verified.

## Verification plan

1. `astro build` → grep `dist/index.html` for hero markers, accent classes, trust band, and the static SEO-fallback result.
2. Playwright screenshots at desktop (1280) + mobile (375), light + dark → visual review.
3. `node scripts/check-svg-safety.mjs` → 0 violations.
4. `astro check` diff → no new errors attributable to `index.astro`.
