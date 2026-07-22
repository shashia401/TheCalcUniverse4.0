# Adding a calculator

Two files. No routing, no page component, no metadata wiring — the build derives all
of that from the registry.

## 1. Create the config module

`src/calculators/{category}/{calculator-id}/index.ts`

```ts
import type { CalculatorConfig } from '../../../types/calculator';

const config: CalculatorConfig = {
  inputs: [
    { id: 'amount', label: 'Amount', type: 'number', defaultValue: '1000', unit: '$' },
    // types: number | text | textarea | select | percentage | date | custom
  ],
  calculate: (values) => {
    const amount = parseFloat(values.amount) || 0;
    return [
      { id: 'result', label: 'Result', value: amount.toFixed(2), highlight: true },
    ];
  },
  educational: {
    formula: 'result = amount × …',
    howToUse: ['Enter the amount', 'Read the result'],
    faqs: [{ question: '…?', answer: '…' }],
    workedExamples: [{ scenario: '…', inputs: { amount: '1000' }, result: '…', insight: '…' }],
  },
};

export default config;
```

Rules:
- **`calculate` must be pure** — inputs in, results out, no side effects. It runs in
  the browser inside the form island.
- **Money math uses `decimal.js`**, never native floats.
- **`educational` is not optional in practice.** It becomes the static HTML Google
  ranks. A calculator without formula + FAQs + examples will not index well.
- Slug (`calculator-id`) is lowercase, hyphenated, keyword-rich.

## 2. Register it

Add one entry to `src/calculators/registry/{category}.ts`:

```ts
{
  id: 'calculator-id',
  title: 'Full SEO Title Calculator',
  shortTitle: 'Short Name',
  description: 'Unique 150–160 char meta description. Never duplicate another page's.',
  category: 'Finance',
  categorySlug: 'finance',
  seoKeywords: ['keyword one', 'keyword two'],
  schema: 'both',
  loader: () => import('../finance/calculator-id/index'),
},
```

The registry entry drives: the route (`/{categorySlug}/{id}/`), `<title>`, meta
description, OG tags, canonical, JSON-LD, sitemap entry, and category listing card.

## 3. Verify

```
npm run build
```

Then confirm the page exists and its content is real HTML:

```
grep "your FAQ question text" dist/{categorySlug}/{calculator-id}/index.html
```

If the grep fails, the content is not indexable — fix before shipping.

## 4. Test the formula

Add a Vitest spec next to the config (`index.test.ts`) covering normal cases, zero,
and boundary values. Every formula ships with tests — CI enforces this.

## Live walkthrough (`explainSteps`) — strongly encouraged

The optional `explainSteps(values)` turns the calculator into a teacher: it returns
the solution **step by step with the user's actual numbers substituted**, rendered
under the results ("How we got this — with your numbers"). A student should be able
to follow it like whiteboard work:

```ts
explainSteps: (values) => {
  const p = parseFloat(values.amount);
  if (isNaN(p) || p <= 0) return [];   // incomplete input → no steps
  return [
    { label: 'Convert the rate', expr: `r = 6.50% ÷ 12 = 0.5417%`, note: 'Why, in one line.' },
    { label: 'Apply the formula', expr: `M = $25,000 × … = $489.15` },
  ];
},
```

Rules: mirror `calculate()`'s math exactly (same rounding, same edge cases), keep
notes to one plain-English line, and return `[]` rather than steps full of NaN.
See `finance/loan-calculator` for the reference implementation.

## Diagrams (`educational.diagram`)

Most calculators ship an SVG diagram (`{ svg, alt, caption }`) rendered as static
HTML. SVGs must be pure vector markup — no scripts, event handlers, external
references, or foreignObject. CI enforces this via `scripts/check-svg-safety.mjs`;
run `node scripts/check-svg-safety.mjs` locally before committing a new diagram.

## Custom result panels (rare)

If a calculator needs UI beyond the standard inputs/results grid (e.g. an
amortization table), export it via `extraPanel` in the config using
`createElement` (see `finance/loan-calculator` for the pattern). Panels render
inside the client island — keep them light; heavy libraries (charts, 3D) must be
lazy-imported inside the panel itself.
