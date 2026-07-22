# Competitive research → features to build

**Written:** 2026-07-21 · **For:** execution by agents. Each item has *what it is*,
*who does it best*, *how to build it in our Astro stack*, and *priority/effort*.

Studied live (7): **calculator.net** (SEO giant), **Omni Calculator** (polished UX),
**Bankrate** (finance, smart defaults), **CalculatorSoup** (math, shows steps),
**Inch Calculator** (best-designed, DIY/visual), **NerdWallet** (modern finance),
+ Omni homepage. Round 2 (Inch/NerdWallet) added: output-unit switchers, tabbed
result views, cite button, optional-cost fields, practical tips.

---

## THE GOLD-STANDARD CALCULATOR PAGE (synthesis of all 7)

Build BMI / Loan / Percentage against this checklist, then templatize to the rest.
A best-in-class calculator page has, in order:

1. **Instant, visible form** — no scroll to the inputs. (✓ we have)
2. **Shape/type tabs** where relevant (Inch: Slab/Footing/Column; we have `shapeTabs`).
3. **Unit switchers on inputs** (ft/in/cm; lb/kg) — Inch/Omni/calculator.net. (build — Tier-2 #8)
4. **Sliders on key numeric inputs** for live iteration. (✓ 7 calcs)
5. **Collapsible "advanced options"** to keep the core clean (NerdWallet/Bankrate). (build — #11)
6. **Live results that update as you type**, with:
   - **A visual of the result's meaning** — gauge/band (calculator.net) or donut (✓ loan). (build — #1)
   - **Multiple actionable outputs** (Inch: volume + bags + cost; calc.net: BMI + range + prime). (✓ supported)
   - **Personalized interpretation** ("for your height, healthy weight is X–Y"). (build — #2)
   - **Output unit switchers** (Inch: cu yds ↔ cu m; 50/60/80-lb bags). (build — NEW #16)
   - **Tabbed result views** where deep (NerdWallet: Summary ↔ Amortization). (build — NEW #17)
   - **Color-coded status** (good/warn/bad). (✓ `result.color`)
7. **Step-by-step "with your numbers"** (CalculatorSoup + our `explainSteps`). (rollout — #3)
8. **Share + copy-link + cite + embed** (Inch has all four). (partial — copy ✓; cite NEW #18; embed C4)
9. **"On this page" TOC** (Bankrate/Omni/Inch). (build — #5)
10. **Formula + variables + worked examples + FAQs** (✓ we have).
11. **Authoritative reference tables** (WHO/CDC/IRS) with citations (calculator.net/Inch). (build — #4)
12. **Practical tips beyond the math** (Inch: "Tips for a ready-mix pour"). (✓ `proTips`)
13. **Named author + reviewer + verified date** (Omni/Inch — strong E-E-A-T). (surface — #6)
14. **"Was this helpful?"** feedback (Omni/CalculatorSoup). (build — #7)
15. **Fast, clean, no ad wall** (our advantage — protect it).

**Guiding principle:** first impression wins. A visitor decides in ~2 seconds whether
this is "a real, trustworthy tool" or "another thin calc page." Every Tier-1 item below
buys first-impression trust or instant clarity.

---

## What we already match or beat (keep, don't lose)
- **Step-by-step "with your numbers"** (`explainSteps`) — CalculatorSoup's signature; we
  have it and it's mid-rollout. Their success proves it ranks.
- **Live interactivity** (sliders, donut, area chart) — beats calculator.net; matches Bankrate.
- **Near-zero-JS speed + privacy** (static, inputs never leave browser) — nobody in the set has this.
- **Formula shown + worked examples + FAQs + expert reviewer** — parity with Omni/calculator.net.
- **Planned AI-channel (cite + call)** — none of them do this.

---

## TIER 1 — biggest first-impression + differentiation (build first)

### 1. Visual result gauge / "where you fall" band  ★ top pick — ✅ BUILT (BMI reference)
`MiniGauge.tsx` + `gauge?(values)` config field. Reference: `health/bmi`. Roll to
body-fat, DTI, LTV, heart-rate zones, credit-utilization next.
- **What:** a horizontal band with the ranges marked and a marker showing exactly where
  the user's result lands (calculator.net's BMI band: 16·18.5·25·30·40 with "you are here").
  Answers "am I okay?" with zero reading.
- **Source:** calculator.net (BMI, body-fat). Generalizes to BMI, body-fat, DTI, credit
  utilization, savings rate, LTV, heart-rate zones — dozens of calcs.
- **How (our stack):** new client component `MiniGauge.tsx` (hand-rolled SVG, like
  `MiniDonut`); add `gauge?: (values) => CalcGauge | null` to `CalculatorConfig`
  (`{ min, max, value, bands: [{to, label, color}], valueLabel }`). Render in the results
  block of `CalculatorForm.tsx`, next to the donut logic. Mirror the calc's own thresholds.
- **Priority:** HIGHEST. **Effort:** M (primitive once, then per-calc config). Start on BMI
  (it's on the homepage — instant visible win).

### 2. Personalized, actionable interpretation — ✅ STARTED (BMI reference)
`CalculatorResult.interpretation` populated from the user's numbers (see `health/bmi`
`bmiScore`). Roll across the money + health wedge next.
- **What:** not just "BMI 23" but *"For your height, a healthy weight is 128.9–174.2 lbs."*
  Tells the user the target, not just the number.
- **Source:** calculator.net (every health calc). Highest value-to-effort item here.
- **How:** the `CalculatorResult` type already has an unused `interpretation` field. Populate
  it in each calc's `calculate()` from the actual inputs (never generic boilerplate — it
  must reference their numbers). `CalculatorForm` already renders `interpretation`.
- **Priority:** HIGH. **Effort:** S per calc (no new components). Do across the money + health wedge.

### 3. Finish `explainSteps` rollout
- **What:** the step-by-step solution with the user's numbers.
- **Source:** CalculatorSoup (their whole ranking strategy — "Solution with Steps").
- **How:** pattern exists (`loan-calculator` + `docs/adding-a-calculator.md`); a background
  session is doing the top ~10. Continue to the full money + math wedge.
- **Priority:** HIGH. **Effort:** M per calc (mirror the math). Already underway.

### 4. Authoritative reference tables, inline
- **What:** WHO BMI table, CDC child percentiles, tax brackets, etc. — dense, citable,
  trustworthy, and exactly what AI Overviews quote.
- **Source:** calculator.net (reference tables on every health/finance calc).
- **How:** the `educational.quickReference` field exists — surface it better in
  `EducationalSection.tsx` (already renders a table). Author real tables per calc; cite the
  source (WHO/CDC/IRS) via the `citations` field.
- **Priority:** HIGH (trust + GEO). **Effort:** S–M per calc (content authoring).

### 5. Auto table-of-contents on calculator pages
- **What:** an "On this page" jump list (How it works · Examples · FAQs · Sources) at the
  top of the educational section.
- **Source:** Bankrate + Omni (both lead with a TOC).
- **How:** in `EducationalSection.tsx`, collect the `<h2>` headings it renders and emit a
  small anchor-linked list above them (add `id`s to each section — some exist, e.g. `#faqs`).
  Static, no JS.
- **Priority:** MEDIUM-HIGH. **Effort:** S (one component change, applies to all calcs).

---

## TIER 2 — trust, authority, engagement

### 6. Named author + reviewer + "verified" date, surfaced
- **What:** "Written by … · Reviewed by [Name], MD · Verified 2026-01-15" on the calc page.
- **Source:** Omni (creators + reviewers shown prominently — strong E-E-A-T).
- **How:** `reviewedBy` and `lastVerified` exist in the registry and render in the trust
  strip; add an optional `author` field; surface all three with `Person`/`reviewedBy` schema
  (jsonld.ts already emits `reviewedBy`). Never fabricate a reviewer.
- **Priority:** MEDIUM (SEO/E-E-A-T). **Effort:** S (surface existing data + add author field).

### 7. "Was this helpful?" thumbs + (later) helpful count
- **What:** Yes/No feedback; Omni shows "819 people find this helpful" (social proof).
- **Source:** Omni + CalculatorSoup.
- **How:** client-only thumbs now (a tiny island; store the click in `localStorage` so it
  doesn't re-ask). Do NOT fake a count. A real aggregate count needs storage — defer to the
  post-launch backend (ties to Workstream B in ROADMAP.md).
- **Priority:** MEDIUM. **Effort:** S now (thumbs), M later (real count).

### 8. Unit switchers per field
- **What:** toggle ft/in ↔ cm ↔ m, lb ↔ kg ↔ stones inline, converting the value.
- **Source:** Omni + calculator.net (US/Metric/Other tabs).
- **How:** extend `InputField` with an optional `units: { label, factor }[]` and a small
  unit-select next to the field in `CalculatorForm.tsx` that converts on change. Apply
  selectively — health, cooking, conversions, international finance — not everywhere.
- **Priority:** MEDIUM (big for non-US traffic). **Effort:** M (form change + per-calc config).

### 9. Smart, current default values
- **What:** Bankrate pre-fills "current national average rate: 6.63%" so the calc is useful
  before you type.
- **How:** sensible `defaultValue`s in config now; for live-ish figures (avg mortgage/APY
  rates, tax brackets), keep a **static snapshot** JSON updated periodically at build time —
  no backend. Show "as of {date}".
- **Priority:** MEDIUM. **Effort:** S (defaults), M (snapshot pipeline).

### 10. Print stylesheet
- **What:** clean printable result (calculator.net has "Print").
- **How:** a `@media print` block in `global.css` hiding header/footer/nav/ads, showing
  inputs + results + formula. `print:hidden` already exists on header/footer.
- **Priority:** LOW-MEDIUM. **Effort:** S.

### 11. Collapsible "advanced / more options"
- **What:** Bankrate tucks PMI/tax/insurance/HOA behind an expander so the core stays simple.
- **How:** we have `showWhen`; add a lightweight "Show advanced options" toggle in
  `CalculatorForm` that reveals inputs flagged `advanced: true`.
- **Priority:** MEDIUM (keeps first impression clean on complex calcs). **Effort:** S–M.

### 16. Output-unit switchers (NEW — round 2)
- **What:** let the user pick the unit of the *result*, not just inputs — Inch shows concrete
  as cu yds ↔ cu m, and bags as 50 / 60 / 80-lb. The answer arrives in the unit they want.
- **Source:** Inch Calculator.
- **How:** allow a result to declare alternate units; a small select on the result card
  re-expresses the value (client-side convert). Add optional `units` to `CalculatorResult`.
- **Priority:** MEDIUM (big for DIY/conversions/cooking). **Effort:** M.

### 17. Tabbed result views (NEW — round 2)
- **What:** toggle a compact "Summary" vs a detailed view (NerdWallet: Loan Estimate ↔
  Amortization Schedule) so depth is available without cluttering the first look.
- **Source:** NerdWallet.
- **How:** a small tab strip in `CalculatorForm` results area; the calc supplies an optional
  `detailPanel` (we already have `extraPanel` — split it into a tab).
- **Priority:** MEDIUM. **Effort:** M. Loan/mortgage first (amortization already exists).

### 18. Cite button (NEW — round 2)
- **What:** a one-click formatted citation of the calculator (Inch has "Cite"). Academic
  trust + it makes the page quotable by AI/researchers.
- **How:** a small "Cite" control that reveals a pre-formatted citation (title, URL, date,
  publisher) with copy. Static, no backend.
- **Priority:** LOW-MEDIUM (E-E-A-T / GEO). **Effort:** S.

---

## TIER 3 — distribution & growth (mostly in ROADMAP.md already)

### 12. Embeddable widget — "Get this calculator for your site"
- **What:** an iframe embed + copy-paste snippet; CalculatorSoup and Omni both push this.
- **Why:** every embed is a backlink and reach AI chat can't match.
- **How:** ROADMAP.md Workstream C4 — `/embed/{category}/{calculator}/` minimal route + a
  "copy embed code" box on each calc. Scope `frame-ancestors` in `_headers` to `/embed/*`.
- **Priority:** HIGH post-launch. **Effort:** M.

### 13. Shareable scenario URLs
- **What:** the current inputs encoded in the URL; send/return/index a specific scenario.
- **How:** ROADMAP.md Workstream C1–C2 (query-string encode + "copy link"). Client-only.
- **Priority:** HIGH. **Effort:** M.

### 14. Result chaining
- **What:** "use this result in another calculator" (CalculatorSoup "Input this result").
- **Priority:** LOW (niche). **Effort:** M. Revisit after core.

### 15. "Suggest a calculator" / feedback link
- **What:** CalculatorSoup's "How could this be better? / Suggest a new calculator."
- **How:** a simple `mailto:` or a static form; cheap trust/engagement signal.
- **Priority:** LOW. **Effort:** S.

---

## First-impression checklist (the 2-second test)
A calculator page and the homepage should, above the fold, show:
- [ ] The answer is reachable *immediately* (search on home ✓; form visible on calc pages ✓).
- [ ] A **visual** of the result's meaning (Tier-1 #1 gauge / existing donut) — biggest gap.
- [ ] A trust signal (tested/verified/reviewer — trust strip ✓, surface reviewer #6).
- [ ] The formula / "we show our work" promise visible (✓ formula strip).
- [ ] Fast load, no clutter, no ad wall (✓ our advantage — protect it).

## Recommended build order
1. Tier-1 #1 gauge on BMI (homepage-visible), then #2 interpretation across the wedge.
2. Tier-1 #4 reference tables + #5 TOC (trust + GEO, cheap).
3. Continue #3 explainSteps rollout.
4. Tier-2 #6 reviewer surfacing, #7 helpful thumbs, #10 print, #11 advanced-toggle.
5. Tier-2 #8 unit switchers where they matter.
6. Tier-3 (#13 share URLs, #12 embeds) per ROADMAP.md.

## Do not copy
- calculator.net's ad density / dated look. Omni's occasional wall-of-text. Fake social-proof
  counts. Bankrate's lead-gen interruptions. We keep the clean, fast, honest experience —
  that restraint is itself a differentiator.
