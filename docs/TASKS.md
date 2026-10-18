# TheCalcUniverse 4.0 — working task list

Updated as each item completes. `[x]` = done and verified, `[ ]` = open, `[owner]` = the site owner's action.
Last checked: 2026-10-18. Order: indexing first (traffic), then the page, then decision tools.

Verified state: 10,904 unit tests pass, `tsc` clean, all 343 calculators pinned by audit tests, full Playwright
suite (incl. the 343-page sweep) green on the current build (commit `4bab3e7`).

## A. Indexing and SEO

Evidence: Search Console "Crawled - currently not indexed" export (1,000 of 1,074 URLs, Oct 2026):
534 are `/en/` legacy URLs, 119 lack the trailing slash, 81 carry query strings, 6 are dead `/data/` paths
(740 total, all expected and self-resolving). 260 are real current calculators, and 182 of those were last
crawled in August under the old client-rendered site, so the verdict predates the current build.

- [x] A1 Redirect patch (`public/.htaccess` + `public/_redirects`). `/en/methodology/<cat>/<id>/` (~257 old indexed URLs) used to 404 on Apache; now one hop. Also moved calculators, `/calculators/`, author page, `/compare/...`; 410 for `/report/`, `/bookmarks/` and dead `/<cat>/<id>/data/` pages. Simulated: of the 1,000 exported URLs 0 are 404 and none takes more than one hop; of the old 793-URL sitemap 790 reach a 200 page in one hop, 2 are 410, 1 is the homepage. **Simulated only: verify on the live host after deploy**
- [x] A2 `/en/` redirects collapsed to one hop (retired blog slugs, trailing slash, methodology, compare)
- [x] A3 Calculator form and its default answer are in the static HTML (same change as B1)
- [ ] A4 After deploy: request indexing for the top ~20 calculators and the new /decisions/ page, then monitor 2-3 weeks
- [owner] A5 Click "Validate Fix" only after the fixes are deployed and every URL in the bucket is a 200 page
- [ ] A6 (low) Find what appends `?ND`, `?MA`, `?SA` to URLs; harmless while canonicals hold
- [owner] A7 Cutover checklist in `DEPLOYMENT.md` (submit `sitemap-index.xml`, check `robots.txt`, `llms.txt`)
- [ ] A8 After deploy: re-run the redirect checks against the live host (`/math/love-calculator/`, `/en/methodology/finance/loan-calculator/`, `/report/` should be 301, 301, 410) and compare indexed-page counts weekly

## B. Page and UI

- [x] B1 Form rendered into the page HTML (`src/lib/initialForm.ts` snapshot). 42 sampled pages, 0 hydration errors on the production build. Pages with a custom input (debt-consolidation, gpa) keep the placeholder
- [x] B2 Desktop: result panel beside the inputs with one headline answer and a clean list; gauge/donut legible; light, dark and mobile checked
- [x] B3 One brand blue `#1967D2` across CSS tokens and the Tailwind `brand` scale; 4 dead colour schemes removed; trust chips enlarged to 14px. (Legacy token names `--accent-rust`, `--accent-deep-teal`, `--teal-light` still exist but now follow the brand; rename if they cause confusion)
- [x] B4 Trust figures generated from audits (`src/data/verification.json`, via `node scripts/verification-stats.mjs --tests <n>`): homepage, /about/, /methodology/, per-calculator chip. Re-run after every audit
- [x] B5 Public corrections log at /corrections/ (56 entries, each traceable to a commit). Add new ones to `src/data/corrections.ts`
- [x] B7 New homepage hero: light graph paper, "Calculators that show their work" with the single amber highlighter, and a live worked loan solution with a circled answer (`HeroWorksheet.tsx`). Dark/mobile checked. Pushed (`d959d7f`); full 343-page sweep clean.
- [ ] B6 Calculator page structure and value over competitors:
  - [x] B6a Answer placement: desktop panel beside inputs; phones get an answer strip above the first input
  - [x] B6b First pass: collapsible explanations (formula card, examples, FAQs, sources open), 44px inputs, 14px chips. **Open:** related-tools tile grid, spacing and type-scale pass
  - [ ] B6c Formula, variables and the step-by-step logic with the visitor's own numbers on EVERY calculator (today only the 12 with `explainSteps` show live steps)
  - [ ] B6d Differentiation competitors lack: `explainSteps` for the top ~40 calculators by search demand (one category per agent; 12 of 350 have it), worked examples (204 of 350 have them), reference tables, edge-case comparisons. Each must meet the audit standard
- [ ] B8 Decide what to do with `compact` mode in `CalculatorForm` (no longer used by the hero; remove if nothing else needs it)
- [ ] B9 Mobile: confirm the answer strip, 44px inputs and collapsed sections on a real phone after deploy

## C. Decision tools (the traffic strategy)

- [x] C1 "Can I afford this house?" at /decisions/can-i-afford-a-house/: one form, four linked answers and a verdict; engine `src/lib/houseDecision.ts` reuses the audited pieces (12 unit tests vs independent Python values, 6 e2e tests); deep links carry the inputs into the full calculators; the home-buying calculators and the homepage link back
- [x] C2 Up to four saved scenarios side by side (kept in the browser), and a link that carries every input
- [ ] C3 More decision tools in the same pattern: "Can I afford this car?", "Should I refinance?", "Am I saving enough to retire?". Also add decision tools to the header/footer navigation
- [ ] C4 API/MCP (post-launch, per ROADMAP.md)

## D. Quality

- [x] D1 All 343 calculators pinned by audit tests against independent oracles (was 285); ~45 defects fixed, all public in /corrections/
- [ ] D3 Audit follow-ups: flagged but unverified or needing a product decision (none changed automatically)
  - business-loan: the "SBA 7(a) minimum DSCR 1.15" claim may be out of date (SBA lists 1.10 for small loans; reported 1.25 for acquisitions from Oct 2026)
  - asset-depreciation: Section 179 cites Rev. Proc. 2025-32 for the 2025 limit, but that procedure covers 2026 ($2.5M is right for 2025); fix the citation
  - new-york-mortgage: local recording-tax components (NYC 1.00% / 1.125%, upstate 1.00%) unconfirmed against Form MT-15
  - canadian-mortgage: Toronto high-value land-transfer rates come from a Dec 2025 council motion; confirm they were adopted before Apr 2026
  - california-mortgage: the diagram's Texas/Florida tax rates and medians have no source
  - annuity-payout (annual mode): the final partial payment is treated as a fractional period, so the total can be off by about $90 on $300k
  - net-worth: shows 100% debt-to-asset when assets are 0 (the ratio is undefined)
  - paycheck: annualised standard-deduction method, not Pub 15-T per-period withholding; Pennsylvania taxes 401(k) deferrals but the calculator subtracts them; state schedules in `src/utils/stateTax.ts` unverified; a deferral equal to the whole salary gives negative net pay
  - refinance: says "Yes, refinance now" even when resetting to a 30-year term raises lifetime interest (200k at 7%/20y to 6.5%/30y is +$82,945)
  - fat-intake: requires body weight but never uses it
  - body-type: asks for the narrowest waist; WHO waist-hip thresholds assume the midpoint between lowest rib and iliac crest
  - macro-point: coefficients look like the published WW SmartPoints formula while the page says "similar in structure"; owner decision on wording
  - wind-chill: the metric path applies the imperial formula after conversion (differs 0.02-0.05 °C); the Environment Canada validity range (T <= 0 °C, V > 5 km/h) is not what the page uses
  - golf-handicap: table rows 4, 5, 7-8 and 20 of WHS Rule 5.2a rest on secondary sources (usga.org blocked automated fetches)
  - health source notes still unverified: frame-size cut-offs, endurance protein 1.4-1.8, carbohydrate goal ranges, fat-intake goal percentages, water add-ons, Morton 2018 upper interval
- [ ] D4 Before each deploy: re-run `node scripts/verification-stats.mjs --tests <n>` and the full Playwright sweep

## Done (earlier)

- [x] Math audit batches 1-5; health, industrial, finance, ecommerce, engineering, devtools audits
- [x] The original 5 Playwright failures (4 stale expectations, 1 real 353px overflow on the cookie banner page)
- [x] Brand colour chosen by research: blue `#1967D2` (white text 5.37:1; `#1A73E8` is 4.51:1 on white and fails on the `#f0f5fa` page background), hover `#1558B0`, active `#0F4A94`, link ink `#1558B0` (6.87:1), tint `#E8F0FE`, dark-mode link ink `#8AB4F8`. Evidence is modest (one ~200-person study favouring blue for finance sites; nothing separates teal from blue), so contrast drove the choice. Amber stays a single highlight per view
