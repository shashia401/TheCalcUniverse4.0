// The decision tools (one form, linked answers, a verdict), in one place. Drives the /decisions/ index, the
// homepage band, the header and footer links, and the "part of a decision" banner on the related calculators.
// To add a tool: create its page under src/pages/decisions/<slug>/, then add one entry here.

export interface DecisionToolInfo {
  /** page lives at /decisions/<slug>/ */
  slug: string;
  /** the question, as the page's H1 */
  title: string;
  /** one sentence: what you get */
  blurb: string;
  /** registry ids of the calculators that are steps of this decision; they link to the tool */
  calculatorIds: string[];
  /** short call to action for the button */
  cta: string;
}

export const decisionTools: DecisionToolInfo[] = [
  {
    slug: 'can-i-afford-a-house',
    title: 'Can I afford this house?',
    blurb: 'Your monthly payment, debt-to-income, the cash to close, and whether buying beats renting, in one flow.',
    calculatorIds: [
      'house-affordability-calculator',
      'mortgage-calculator',
      'home-affordability-calculator',
      'dti-ratio-calculator',
      'closing-costs-calculator',
      'home-rent-vs-buy-calculator',
      'rent-vs-buy-calculator',
    ],
    cta: 'Check a house',
  },
  {
    slug: 'can-i-afford-a-car',
    title: 'Can I afford this car?',
    blurb: 'The real monthly cost, the 20/4/10 guideline, your debt-to-income and the cash you need at signing.',
    calculatorIds: [
      'auto-loan-calculator',
      'auto-lease-calculator',
      'lease-vs-buy-calculator',
      'cash-back-vs-low-interest-calculator',
      'vehicle-depreciation-calculator',
    ],
    cta: 'Check a car',
  },
  {
    slug: 'should-i-refinance',
    title: 'Should I refinance my mortgage?',
    blurb: 'Monthly saving, break-even, the cost over your stay and lifetime interest, compared like for like.',
    calculatorIds: ['refinance-calculator', 'mortgage-payoff-calculator'],
    cta: 'Check a refinance',
  },
  {
    slug: 'am-i-saving-enough-to-retire',
    title: 'Am I saving enough to retire?',
    blurb: 'What you will have, what you need, the gap and the monthly fix, in today’s dollars.',
    calculatorIds: [
      'retirement-calculator',
      '401k-calculator',
      'social-security-calculator',
      'annuity-payout-calculator',
      'fire-calculator',
      'pension-calculator',
    ],
    cta: 'Check my retirement',
  },
];

export const decisionToolFor = (calculatorId: string): DecisionToolInfo | undefined =>
  decisionTools.find((t) => t.calculatorIds.includes(calculatorId));
