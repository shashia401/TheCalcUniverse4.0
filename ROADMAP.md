# TheCalcUniverse 4.0 — Roadmap: "Extraordinary vs AI"

**Owner:** shashi · **Written:** 2026-07-20 · **Status:** approved, ready to execute
**For:** execution by other agents/sessions. Each task is self-contained — read the
task, its files, and its acceptance criteria; you do not need this conversation.

---

## The decision (read first)

The question this roadmap answers: *in a world where people can just ask AI, how does
a calculator site matter?* Answer, in priority order of defensibility:

1. **Trust** — a tested calculator is never wrong; AI can be. Permanent moat.
2. **Be the engine AI cites and calls** — machine-readable data + (later) an API/MCP
   so assistants use us instead of hallucinating. Turns the threat into distribution.
3. **Durable, shareable, indexable URLs** — a chat is ephemeral and private; a URL is
   linkable, returnable, embeddable, crawlable. Structural advantage AI chat cannot copy.
4. **On-page interactivity (Living Answer)** — sliders/charts/donuts. Real, but the
   weakest moat vs AI (AI is closing that gap), so it is NOT the first priority.

**Sequencing rule:** anything static/client-side (no backend) ships **pre-launch**.
The only thing that adds a server surface — the calculation API/MCP (Workstream B2/B3)
— is **post-launch**, gated behind ADR-002, because it breaks the static-only security
model we chose. Do not build B2/B3 without writing ADR-002 first.

**Four pillars apply to every task** (per project standing rule): each task below notes
its Security / SEO / Maintainability / Documentation impact. Do not mark a task done
until its acceptance criteria AND its pillar notes are satisfied.

---

## Workstream A — Trust as loud, everywhere positioning
*No backend. Highest leverage-to-effort. Pre-launch.*

### A1. Global "verified, not generated" trust strip on every calculator page
- **What:** A compact, consistent trust row near the top of every calculator (not just
  the ones that happen to have `reviewedBy`). Content: "Deterministic · Formula shown ·
  {reviewedBy ? 'Expert-reviewed' : 'Tested against N cases'} · Runs in your browser".
- **Files:** `src/pages/[category]/[calculator]/index.astro` already renders trust chips
  (`entry.reviewedBy`, `entry.lastVerified`). Generalize so every calc shows a trust row
  even without `reviewedBy`; add a "deterministic / no AI guesswork" chip site-wide.
- **Accept:** every calculator page shows ≥3 trust signals; grep any 5 random built pages
  in `dist/` and confirm the trust row is in the static HTML.
- **Pillars:** SEO+ (trust content is crawlable, E-E-A-T signal). Sec/Maint/Docs: neutral.

### A2. "Why trust this over an AI answer?" section
- **What:** One short, honest reusable block (Astro component) explaining: the math is a
  tested program (not a language model guess), the formula and source are shown, and the
  result is reproducible. Render it once per calculator, below the results.
- **Files:** new `src/components/calculator/TrustNote.astro`; include from the calculator
  page. Keep it factual — no AI-bashing, no unverifiable claims.
- **Accept:** renders in static HTML; wording reviewed for honesty (no "100% accurate"
  overclaims — say "deterministic and tested", which is true).
- **Pillars:** SEO+ (GEO-friendly, quotable by AI). Docs: note the component in ARCHITECTURE.md.

### A3. Surface `lastVerified` + `reviewedBy` prominently and honestly
- **What:** Where `entry.lastVerified` exists, show "Formula verified {date}". Where a
  reviewer exists, show their name + credential. Do NOT fabricate either.
- **Files:** registry entries already carry these; the calc page already reads them —
  audit that they render and are not empty-string.
- **Accept:** spot-check 5 calcs with `reviewedBy` set and 5 without; both render correctly.
- **Pillars:** SEO+ (author/reviewer schema). Maint: neutral.

### A4. Homepage + meta lean on determinism
- **What:** Homepage hero and category intros state the trust angle ("tested, verified,
  yours stays private") alongside "see the work". Meta descriptions for money calcs
  mention "verified formula".
- **Files:** `src/pages/index.astro` (hero already exists — tune copy), registry
  `description` fields for the money wedge.
- **Accept:** homepage communicates trust in the first screen; no broken layout.
- **Pillars:** SEO (unique descriptions — keep them unique, don't templatize).

---

## Workstream B — Be the engine AI cites and calls
*B1 is static (pre-launch). B2/B3 add a backend (post-launch, needs ADR-002).*

### B1. Static per-calculator data files (machine-readable, GEO) — PRE-LAUNCH
- **What:** Emit a static JSON per calculator at build time: id, title, description,
  inputs (id/label/type/unit/min/max), formula text, worked example, FAQs, canonical URL.
  v2 had `scripts/generate-calculator-data.mjs` — port the concept to Astro.
- **Why:** makes every calculator machine-readable so AI assistants and search engines
  can cite exact capabilities; pure static files, zero backend, zero security surface.
- **How:** an Astro static endpoint `src/pages/data/[category]/[calculator].json.ts`
  using `getStaticPaths()` over the registry (same pattern as the HTML route). Also add a
  top-level `src/pages/data/index.json.ts` listing all calculators. Reference these in
  `public/llms.txt`.
- **Accept:** `dist/data/finance/loan-calculator.json` exists and validates; `llms.txt`
  links to the index; build stays green.
- **Pillars:** SEO+ (GEO), Sec neutral (static). Docs: add a "Data API (static)" section
  to ARCHITECTURE.md.

### B2. Calculation API endpoint — POST-LAUNCH, requires ADR-002
- **What:** `POST /api/calc/{id}` → runs that calculator's `calculate()` on the given
  inputs, returns results JSON. Deterministic, read-only, no storage, no auth.
- **Why:** lets AI assistants call the real tested math instead of hallucinating. The
  single least-copied differentiator.
- **How:** Cloudflare Pages Functions (`functions/api/calc/[id].ts`). Import the same
  config modules; call `calculate()`. Rate-limit at the Cloudflare edge. CORS open (it is
  public math). **Write `docs/adr/ADR-002-calc-api.md` first** recording the deliberate
  break from static-only, the threat model (input abuse, DoS — mitigated by edge limits,
  no DB, pure functions), and why it is worth it.
- **Accept:** ADR-002 merged; endpoint returns correct results for 5 calcs matching the
  on-page result; edge rate limit configured; `npm audit` still clean; no secret introduced.
- **Pillars:** Sec− (new surface — this is THE tradeoff; document it fully). SEO neutral.
  Maint: keep the handler thin (delegate to `calculate()`). Docs: ADR-002 mandatory.

### B3. MCP endpoint — POST-LAUNCH, after B2
- **What:** Expose the calculators as MCP tools so assistants can discover + call them.
- **How:** builds on B2; publish an MCP manifest describing each calculator as a tool
  (name, description, input schema derived from `config.inputs`). Generate the manifest at
  build time from the registry.
- **Accept:** an MCP client can list and invoke ≥3 calculators and get correct results.
- **Pillars:** Sec (same surface as B2). Docs: extend ADR-002 or add ADR-003.

### B4. GEO hardening
- **What:** audit every calculator emits complete schema (SoftwareApplication, FAQPage,
  HowTo, MathSolver, Breadcrumb); extend `llms.txt`; consider `llms-full.txt` with
  per-calc capability lines.
- **Files:** `src/lib/jsonld.ts`, `public/llms.txt`.
- **Accept:** schema validates for a sample across all 10 categories.
- **Pillars:** SEO+. Others neutral.

---

## Workstream C — Durable, shareable, indexable URLs
*Client-only (C1–C3) = pre-launch. C4 embeds = at/after launch.*

### C1. Encode form state in the URL query string
- **What:** as the user changes inputs, reflect them in `?field=value` (debounced,
  `history.replaceState`). On load, hydrate the form from the query string.
- **Files:** `src/components/calculator/CalculatorForm.tsx` — read query on mount to seed
  `values`; write query on change. Guard against invalid/oversized params.
- **Accept:** load `/finance/loan-calculator/?loanAmount=25000&interestRate=6.5&loanTerm=5`
  → form pre-filled, result shown; changing inputs updates the URL.
- **Pillars:** Sec (sanitize/whitelist param keys to the calc's input ids; never eval).
  SEO: keep canonical WITHOUT query params (already correct). Maint: one shared helper.

### C2. "Copy link to this scenario" button
- **What:** extend the existing "Copy results" control with "Copy link" that copies the
  current URL (now carrying the scenario via C1).
- **Files:** `CalculatorForm.tsx` (Copy results already exists).
- **Accept:** button copies a URL that reproduces the scenario when opened.
- **Pillars:** neutral. This is the share loop — retention + backlinks, free.

### C3. Scenario-aware page title/H1 hint (optional, static-safe)
- **What:** when a scenario is loaded from the URL, optionally show a small "Your scenario"
  chip. Do NOT change the canonical or meta (stays generic for SEO).
- **Accept:** canonical/meta unchanged; chip only client-side.
- **Pillars:** SEO (must not vary canonical). 

### C4. Embeddable calculator widget — AT/AFTER LAUNCH
- **What:** `/embed/{category}/{calculator}/` — a minimal, iframe-able version of the
  calculator (no header/footer), with attribution link back. v2 had embed pages; port.
- **Why:** backlink magnet + distribution; other sites embedding you is reach AI can't match.
- **Files:** new route `src/pages/embed/[category]/[calculator]/index.astro` reusing the
  form island; a stripped layout; set `X-Frame-Options`/CSP `frame-ancestors` in `_headers`
  to ALLOW embedding for `/embed/*` only (tighten elsewhere).
- **Accept:** embeds render in an iframe on a third-party page; attribution link present;
  security headers scoped so only `/embed/*` is frameable.
- **Pillars:** Sec (careful frame-ancestors scoping). SEO (noindex the embed variant to
  avoid duplicate content; canonical → the full page).

---

## Workstream D — Living Answer completion (on-page wow)
*Pre-launch for the money wedge; later for other categories. On-page conversion, not the
primary AI moat — do AFTER A and B1/C1–C2 unless quick.*

**State today (verified):** 7 money calcs have sliders (loan, home-equity-loan,
compound-interest, investment, retirement, savings, personal-loan); 2 have area charts
(loan gated, home-equity); 1 has a donut (loan). Primitives built:
`MiniAreaChart.tsx`, `MiniDonut.tsx`; `slider`, `chart`, `donut` on `CalculatorConfig`.
Reference/how-to: `docs/adding-a-calculator.md` ("Live walkthrough" + this pattern).

### D1. Sliders on the rest of the money wedge (~13 calcs)
- **Targets:** auto-loan, mortgage-payoff, refinance, credit-card-payoff, debt-payoff,
  debt-consolidation, amortization, mortgage-comparison, sip-calculator, and the state
  mortgages (california/texas/new-york/canadian/va) if worth it.
- **How:** add `slider: { min, max, step }` to the primary numeric inputs (see the 7 done
  calcs for the pattern; anchor edits on `id: 'X',\n label: '...'`). Sliders are safe —
  they only drive existing inputs, cannot change the math.
- **Accept:** each target renders sliders; `npx vitest run` (7,173) and `npx astro build`
  stay green; sliders drive results (see the E2E "dragging a slider" test pattern).
- **Pillars:** neutral. Maint: one-line-per-input, documented.

### D2. Donuts on clean-split calcs
- **Targets:** investment (contributed vs returns), savings (principal vs interest),
  compound-interest (principal vs growth), auto-loan / personal-loan (principal vs interest
  vs fees), retirement (contributions vs growth).
- **How:** add `donut: (values) => CalcDonut | null` that **mirrors the calc's own
  `calculate()` math exactly** (same guards/rounding). See `loan-calculator` donut as the
  reference. CAREFUL work — a wrong split is worse than none.
- **Accept:** donut totals equal the on-page result totals for 3 sample inputs each; build
  + tests green; add one E2E per calc following the loan donut test.
- **Pillars:** Maint (mirror math — risk of drift; consider a shared helper if 3+ calcs
  share the amortization split).

### D3. Area charts on time-series calcs
- **Targets:** investment, retirement, savings, compound-interest (contributions vs growth
  over time).
- **How:** `chart: (values) => CalcChart | null` (stacked area). Note the current gate:
  the area chart is suppressed when a calc has an `extraPanel`. Confirm each target's panel
  situation before adding.
- **Accept:** chart renders and redraws; matches the numbers; build + tests green.
- **Pillars:** SEO note — charts are client-only; the static educational content still
  carries the crawlable story. Do not move ranked content into the chart.

### D4. `explainSteps` rollout
- **Status:** a background session is rolling this to the top ~10 calcs. Continue to the
  full money wedge after it finishes. Reference: `loan-calculator` + `docs/adding-a-calculator.md`.
- **Accept:** each target shows "How we got this — with your numbers" with substituted math;
  E2E per the walkthrough test; tests green.

### D5. Extend to health + math wedges — POST-LAUNCH
- Only after money is proven in production. Health (BMI/TDEE/macros) and math (fractions,
  algebra) benefit most from `explainSteps`; charts less so.

---

## Workstream E — Launch (owner-executed; agents prep only)
Ready per `DEPLOYMENT.md`. Blocking items are owner-only (accounts/DNS):

- **E1.** Push repo to GitHub, connect Cloudflare Pages (`astro build` → `dist`). *(owner)*
- **E2.** Custom domain + www→apex redirect rule in Cloudflare. *(owner)*
- **E3.** Submit `sitemap-index.xml` to GSC; monitor indexing 2 weeks. *(owner)*
- **E4.** **Rotate the two exposed DeepSeek keys** from v2 git history — security, open. *(owner)*
- **E5.** When the next Astro major clears the esbuild dev-server advisory, tighten
  `.github/workflows/ci.yml` audit gate back to `--audit-level=high`. *(agent)*

---

## Recommended execution order (for whoever picks this up)

**Pre-launch, in this order:**
1. A1–A4 (trust) — cheap, permanent, highest leverage vs AI.
2. B1 (static data files) + B4 (GEO) — static AI-channel, no backend.
3. C1–C2 (shareable URLs) — the share loop.
4. D1 (finish money-wedge sliders), then D2/D3/D4 (charts/donuts/steps on money).

**At/after launch:**
5. E1–E4 (deploy + key rotation).
6. C4 (embeds).

**Post-launch, deliberate:**
7. ADR-002 → B2 (calc API) → B3 (MCP). The big AI-channel bet, after the core is proven
   and with the security tradeoff explicitly accepted.
8. D5 (Living Answer into health/math).

**Do not:** build B2/B3 before ADR-002; move ranked content into client-only charts;
sweep sliders without running the formula tests; add any secret to the repo.
