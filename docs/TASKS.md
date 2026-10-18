# TheCalcUniverse 4.0 — working task list

Updated as each item completes. `[x]` = done and verified, `[ ]` = open, `[owner]` = the site owner's action.
Order: indexing first (traffic), then the page, then decision tools.

## A. Indexing and SEO

Evidence: Search Console "Crawled - currently not indexed" export (1,000 of 1,074 URLs, Oct 2026):
534 are `/en/` legacy URLs, 119 lack the trailing slash, 81 carry query strings, 6 are dead `/data/` paths
(740 total, all expected and self-resolving). 260 are real current calculators, and 182 of those were last
crawled in August under the old client-rendered site, so the verdict predates the current build.

- [x] A1 Redirect patch (`public/.htaccess` + `public/_redirects`). Found on the live site: `/en/methodology/<cat>/<id>/` (~257 old indexed URLs) landed on a 404 on Apache. Now mapped to `/<cat>/<id>/`; also added moved calculators (love, dice, percentage, concrete-slab), `/calculators/`, author page, `/compare/...`; 410 for `/report/`, `/bookmarks/` and the dead `/<cat>/<id>/data/` pages. Simulated: of the 1,000 exported URLs, 0 are 404 and none takes more than one hop; of the old 793-URL sitemap, 790 reach a 200 page in one hop, 2 are 410, 1 is the homepage. Verify on the live host after deploy
- [x] A2 `/en/` redirects collapsed to one hop (retired blog slugs, trailing slash, methodology, compare)
- [ ] A3 Server-render the calculator form and a worked example in the static HTML (same change as B1)
- [ ] A4 After deploy: request indexing for the top ~20 calculators, then monitor 2-3 weeks
- [owner] A5 Click "Validate Fix" only after the fixes are deployed and every URL in the bucket is a 200 page
- [ ] A6 (low) Find what appends `?ND`, `?MA`, `?SA` to URLs; harmless while canonicals hold
- [owner] A7 Cutover checklist in `DEPLOYMENT.md` (submit `sitemap-index.xml`, check `robots.txt`, `llms.txt`)

## B. Page and UI

- [ ] B1 Render the form in the page HTML so the calculator is never a blank grey box
- [ ] B2 Result first, formula as a proof element using the visitor's own numbers
- [ ] B3 One brand palette applied everywhere (hero, results, links, chips); enlarge the trust chips. Colour chosen by research, see notes below
- [ ] B4 Update trust numbers and per-calculator "verified" dates from the audit
- [ ] B5 Public corrections log
- [ ] B6 Rework the calculator page structure: explanation, result placement, tile layout, more value than competitors
- [ ] B7 Replace the generic graph-paper hero with a distinctive one

## C. Decision tools (the traffic strategy)

- [ ] C1 "Can I afford this house?" flow: affordability, DTI, closing costs, rent vs buy, numbers carried between steps
- [ ] C2 Saved and comparable scenarios, one shareable link for the whole flow
- [ ] C3 Repeat the pattern for other high-intent questions (car, loan, retirement)
- [ ] C4 API/MCP (post-launch, per ROADMAP.md)

## D. Quality

- [ ] D1 Independently audit the ~100 calculators not yet verified (everyday, automotive, diy, realestate, part of finance), then re-score correctness

## Done

- [x] Math audit batches 1-5; health, industrial and finance affordability/budget audits (commit `8691b2e`)
- [x] Playwright 27/27 (incl. 343-page sweep), vitest 10,560/10,560
- [x] Cookie-consent banner page overflow (shared `FormulaCard.astro`)

## Notes

- Brand colour (research done): **blue, tuned for contrast**. Primary `#1967D2` (white text 5.37:1; the CLAUDE.md `#1A73E8` is only 4.51:1 on white and fails on the `#f0f5fa` page background), hover `#1558B0`, active `#0F4A94`, link ink `#1558B0` (6.87:1), tint `#E8F0FE`, dark-mode link ink `#8AB4F8`. Amber stays as a single highlight per view, never for links, buttons or results. Evidence is modest: one ~200-person study rated blue most trustworthy for finance/medical sites but with a small effect; no study separates teal from blue; most competitors (Bankrate etc.) are blue, NerdWallet and Wise green. Teal is not a penalty, just no advantage. Rename or remap the misnamed tokens (`--accent-rust` is teal, `--amber-light` is blue) and decide the fate of the 6 alternate colour schemes in `global.css` when B3 starts.
