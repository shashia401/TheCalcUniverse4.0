// Curated calculator bundles — an editorial/discovery + SEO layer over the
// 343 calcs. Hand-picked ids; unknown ids are dropped at render (no broken
// links). ponytail: plain data + reuse the card grid; no per-collection pages
// component until this needs more than a title + a grid.
export interface Collection {
  slug: string;
  title: string;
  blurb: string;
  calcIds: string[];
}

export const collections: Collection[] = [
  {
    slug: 'buying-a-home',
    title: 'Buying a home',
    blurb: 'From "can I afford it?" to the full mortgage — the calculators you actually need before you sign.',
    calcIds: [
      'home-affordability-calculator',
      'down-payment-calculator',
      'dti-ratio-calculator',
      'mortgage-amortization-calculator',
      'mortgage-payoff-calculator',
      'mortgage-comparison-calculator',
    ],
  },
  {
    slug: 'starting-a-business',
    title: 'Starting a business',
    blurb: 'Price it, fund it, and know when it pays for itself.',
    calcIds: [
      'break-even-calculator',
      'profit-margin-calculator',
      'margin-calculator',
      'business-loan-calculator',
      'roas-calculator',
      'amazon-fba-calculator',
    ],
  },
  {
    slug: 'planning-retirement',
    title: 'Planning for retirement',
    blurb: 'See where you land, and what an extra dollar today is worth in 30 years.',
    calcIds: [
      'retirement-calculator',
      '401k-calculator',
      'roth-ira-calculator',
      'compound-interest-calculator',
      'investment-calculator',
      'savings-calculator',
    ],
  },
  {
    slug: 'expecting-a-baby',
    title: 'Expecting a baby',
    blurb: 'Dates, milestones, and the money side of a new arrival.',
    calcIds: [
      'due-date-calculator',
      'pregnancy-calculator',
      'pregnancy-weight-gain-calculator',
      'period-ovulation-calculator',
      'budget-calculator',
    ],
  },
  {
    slug: 'buying-a-car',
    title: 'Buying a car',
    blurb: 'Loan vs. lease, true running cost, and what it will be worth later.',
    calcIds: [
      'auto-loan-calculator',
      'auto-lease-calculator',
      'lease-vs-buy-calculator',
      'vehicle-depreciation-calculator',
      'mpg-calculator',
      'fuel-cost-calculator',
    ],
  },
];
