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
- [ ] A4 (owner requested 15 of the 20 on 2026-10-22; 5 left: see the list in chat, pages 16-20) After deploy: request indexing for the top ~20 calculators and the new /decisions/ page, then monitor 2-3 weeks
- [x] A5 (owner clicked "Validate Fix" 2026-10-19) Click "Validate Fix" only after the fixes are deployed and every URL in the bucket is a 200 page
- [x] A6 `?ND ?NA ?MA ?MD ?SA ?SD` are the host's directory-listing sort links (57 of the exported URLs) and `?expression={...}` is an unfilled template from an older build (22; the current build emits none). `.htaccess` now has `Options -Indexes` and 301s both shapes to the clean URL (79 of the 81 query URLs; real `?loanAmount=...` links untouched). Verify on the live host after deploy
- [x] A7 (owner confirmed done 2026-10-22; live host verified: .htaccess active, redirects, 410, 404 page, sitemap) Cutover checklist in `DEPLOYMENT.md` (submit `sitemap-index.xml`, check `robots.txt`, `llms.txt`)
- [x] A8 (2026-10-19: all redirects, 410, 404, sitemap 529, robots, canonical verified live; weekly indexed-count comparison continues) Re-run redirect checks against the live host (`/math/love-calculator/`, `/en/methodology/finance/loan-calculator/`, `/report/` should be 301, 301, 410) and compare indexed-page counts weekly

## B. Page and UI

- [x] B1 Form rendered into the page HTML (`src/lib/initialForm.ts` snapshot). 42 sampled pages, 0 hydration errors on the production build. Pages with a custom input (debt-consolidation, gpa) keep the placeholder
- [x] B2 Desktop: result panel beside the inputs with one headline answer and a clean list; gauge/donut legible; light, dark and mobile checked
- [x] B3 One brand blue `#1967D2` across CSS tokens and the Tailwind `brand` scale; 4 dead colour schemes removed; trust chips enlarged to 14px. (Legacy token names `--accent-rust`, `--accent-deep-teal`, `--teal-light` still exist but now follow the brand; rename if they cause confusion)
- [x] B4 Trust figures generated from audits (`src/data/verification.json`, via `node scripts/verification-stats.mjs --tests <n>`): homepage, /about/, /methodology/, per-calculator chip. Re-run after every audit
- [x] B5 Public corrections log at /corrections/ (56 entries, each traceable to a commit). Add new ones to `src/data/corrections.ts`
- [x] B7 New homepage hero: light graph paper, "Calculators that show their work" with the single amber highlighter, and a live worked loan solution with a circled answer (`HeroWorksheet.tsx`). Dark/mobile checked. Pushed (`d959d7f`); full 343-page sweep clean.
- [x] B6 (2026-10-21: all sub-items done) Calculator page structure and value over competitors:
  - [x] B6a Answer placement: desktop panel beside inputs; phones get an answer strip above the first input
  - [x] B6b First pass: collapsible explanations (formula card, examples, FAQs, sources open), 44px inputs, 14px chips. Related-tools tiles now show category, title, 2-line description and an "Open calculator" link with hover/active states. Spacing and type-scale pass done (2026-10-19): reading text on the calculator page is at least 14px, section headings 20px, section gaps 48px
  - [x] B6c Formula, variables and the step-by-step logic with the visitor's own numbers on every formula-driven calculator (325 of 343; see B6d for the 18 left on purpose)
  - [x] B6d Live step-by-step solutions (`explainSteps`): **325 of 343 calculators have them (2026-10-21; was 12)**. Every block reads the calculator's own helpers or result rows, returns [] on bad input, and is pinned to independent Python values (~2,000 tests). The 18 left are deliberate: not formula-driven (base64, url-encode, dice-roller, password-generator, random-number, love-calculator, bra-size, character-token, ip-subnet, cookie-consent, crypto-hash, the 14 devtools tools), volatile data (currency, eth-gas-fee, robux-converter, ai-token-pricing, time-zone), date-of-today dependent (countdown-calculator), lookup charts (shoe-size, clothing-size-converter), safety-sensitive (bac), free-form evaluator (scientific), ambiguous case (law-of-sines), duplicate folder (math/mulch). Note: `grep` must include `index.tsx`, several calculators keep `explainSteps` there
  - [x] B6e (2026-10-19: BMI healthy weight by height, TDEE by activity level for the default person, loan 3/5/7/10-year comparison, compound growth at 5/7/9%, study-hours by pace and difficulty, LCM common pairs; eDPI already had a table. Asian BMI cut-offs left out: only the 23 threshold is sourced) Reference tables and edge-case comparisons on the highest-traffic calculators (e.g. BMI categories, loan terms side by side)
- [x] B8 Removed the unused `compact` / `visibleInputIds` mode from `CalculatorForm` (dead since the new hero); typecheck and the e2e suites pass
- [x] B9 (owner checked on a real phone 2026-10-22) Mobile: confirm the answer strip, 44px inputs and collapsed sections on a real phone after deploy

## C. Decision tools (the traffic strategy)

- [x] C1 "Can I afford this house?" at /decisions/can-i-afford-a-house/: one form, four linked answers and a verdict; engine `src/lib/houseDecision.ts` reuses the audited pieces (12 unit tests vs independent Python values, 6 e2e tests); deep links carry the inputs into the full calculators; the home-buying calculators and the homepage link back
- [x] C2 Up to four saved scenarios side by side (kept in the browser), and a link that carries every input
- [x] C3a Generic engine (`src/lib/decisionEngine.ts`, `DecisionTool.tsx`) + shared list (`src/data/decisionTools.ts`) drive /decisions/, the homepage band, header and footer links and the banner on related calculators; tools: house, car (25 unit tests), refinance (18), each with e2e (23 decision e2e pass)
- [x] C3b "Am I saving enough to retire?" (32 unit tests vs a month-by-month Python oracle, 8 e2e); four decision tools now, 31 decision e2e pass
- [ ] C4 API/MCP (post-launch, per ROADMAP.md)

## D. Quality

- [x] D1 All 343 calculators pinned by audit tests against independent oracles (was 285); ~45 defects fixed, all public in /corrections/
- [x] D3 Audit follow-ups resolved (15 corrections + California + quadratic, all public in /corrections/): SBA DSCR floors, Section 179 by tax year, Toronto LTT, California unsourced figures and the 0.77% default, annuity final payment, net-worth ratio, paycheck PA/clamp/method, refinance wording, fat-intake, body-type (WHO protocol), wind chill (metric formula and range), golf table (confirmed in two copies), health source notes (softened to what is verified). NY recording tax was verified and needed no change.
- [ ] D3b Residual items that need your decision or a source I could not reach:
  - macro-point: its coefficients look like the published WW SmartPoints formula while the page says "similar in structure"; wording is your call
  - paycheck: state income-tax schedules in `src/utils/stateTax.ts` are not verified (only Pennsylvania was); HSA treatment in PA unconfirmed; the method is an annualised estimate (stated on the page)
  - wind-chill: Environment Canada's page prints no formula; the metric formula is the standard joint 2001 one from secondary sources
  - refinance: the calculator's own "Wait" recommendation can disagree with the decision tool in the cash-out case (the tool shows net advantage; both state their basis)
  - retirement: the decision tool works in today's dollars and the retirement calculator in nominal dollars, so their inflation-adjusted figures differ slightly (the page says so)
  - skipped on purpose: bac (safety-sensitive estimate), mortgage-payoff steps (depends on today's date)
- [ ] D4 Before each deploy: re-run `node scripts/verification-stats.mjs --tests <n>` and the full Playwright sweep

## Done (earlier)

- [x] Math audit batches 1-5; health, industrial, finance, ecommerce, engineering, devtools audits
- [x] The original 5 Playwright failures (4 stale expectations, 1 real 353px overflow on the cookie banner page)
- [x] Brand colour chosen by research: blue `#1967D2` (white text 5.37:1; `#1A73E8` is 4.51:1 on white and fails on the `#f0f5fa` page background), hover `#1558B0`, active `#0F4A94`, link ink `#1558B0` (6.87:1), tint `#E8F0FE`, dark-mode link ink `#8AB4F8`. Evidence is modest (one ~200-person study favouring blue for finance sites; nothing separates teal from blue), so contrast drove the choice. Amber stays a single highlight per view

## E. From the live Search Console performance data (28 days to 2026-10-19: 122 clicks, 44,079 impressions, CTR 0.28%, avg position 13.6)

- [x] E1 (2026-10-19: lcm, rounding, study-time titles now lead with the searched phrase; fraction left as is because it ranks at 14.6, which is not a title problem; re-check CTR in 3 weeks) Title and description rewrite for pages that rank on page 1 but get almost no clicks: `/math/lcm-calculator/` (9.3k impressions, position 9, 2 clicks; the ranking URL was the old `/en/` one, now 301), `/math/fraction-calculator/` (7.0k, pos 14.6), `/everyday/study-time-calculator/` (4.3k, pos 6.8), `/math/rounding-calculator/` (3.0k, pos 6.4), `/everyday/edpi-calculator/` (2.7k). Titles lead with jargon ("GCD Method", "Number Line"); lead with the searched phrase and the promise (steps, examples). Re-check CTR 3 weeks later
- [ ] E2 Watch the `/en/` to root consolidation: 3 of the top 30 pages by impressions were still `/en/` URLs (lcm, dice-roller, height-calculator `?expression={math_expression}`). Position fell from ~11 to ~24 on 16-18 Oct, before the deploy; compare weekly
- [ ] E3 Homepage ranks for "calculator" at position 32.8 (1,113 impressions, 2 clicks). Decide whether to target a broader head term
- [ ] E4 The traffic is not from finance: the converting pages are math/everyday niche tools (big-number 4.6% CTR, edpi, mars-time). Finance and the decision tools have almost no impressions yet; this is the evidence for A4 (request indexing) mattering most for them
- [x] E5 Many long "queries" (`+nist gold density 19.32 g/cm3`, `+mdn bigint ...`, `+mifflin st jeor ... source`) are AI research agents citing us at positions 2-9, not people. Not an error; it confirms the AI-channel strategy (sources and facts on the page are being read)
- [ ] E6 No Google Analytics data was available; only Search Console is connected. Add GA4 (or Cloudflare analytics) if you want on-site behaviour (bounce, tool use)

## F. Quirks found while writing the steps (left as they are; decide if any should change)

- tvm-calculator: the PV helpText says "Enter negative for loans" but the engine returns a negative payment for a positive PV (a loan is a positive PV); the steps stay neutral about signs
- retirement: the retirement-age slider starts at 40 while the input's `min` is 20; `requiredMonthly` is computed even with no income goal (unused)
- bond-calculator: the yield search stops within $0.0001 of the price, so the yield is reliable to about 4 decimals (steps show 4)
- discount-calculator: no guard for discounts over 100% (steps return nothing for them)
- 401k: a fractional age gap counts the part year as a whole contribution year (steps say so)
- fire-calculator: spending above income still reaches the target through investment growth alone (about 77 years in one case); shown as is
- pregnancy-calculator: a fractional cycle length passes the check but does not shift the due date by the half day; an out-of-range cycle length (19, 46) is silently treated as 28
- pension: 3% inflation and 4% payout rule are the calculator's own assumptions; income-tax applies one flat effective state rate to graduated-tax states (the step says "estimate")
- macro-point: the file header comment still says the formula "aligns with common macronutrient scoring approaches" (same open wording question as D3b)
- Fixed in this round and logged on /corrections/: resistor min/max half-up rounding, dog-cat-age float noise, oven gas mark halves, Schengen "1 days"

