// "Can I afford this house?" described for the generic DecisionTool island. Math: src/lib/houseDecision.ts.
import type { DecisionEngine, VerdictLevel } from '../../lib/decisionEngine';
import {
  evaluateHouse,
  fmtMoney,
  HOUSE_ASSUMPTIONS,
  HOUSE_DEFAULTS,
  inputsFromQuery,
  queryFromInputs,
  validateHouse,
  type HouseDecision,
  type HouseInputs,
} from '../../lib/houseDecision';

const VERDICT: Record<VerdictLevel, { title: string; line: string }> = {
  comfortable: { title: 'Within your budget', line: 'The payment, your total debt and your cash all sit inside the standard lending guidelines.' },
  tight: { title: 'Possible, but tight', line: 'You may qualify, but at least one guideline is stretched. Read the reasons below before you commit.' },
  over: { title: 'Over budget', line: 'At these numbers the purchase is beyond what standard lending guidelines support.' },
};

/** Deep links into the full calculators, carrying the numbers already entered. */
function links(i: HouseInputs) {
  const q = (o: Record<string, string | number>) => '?' + new URLSearchParams(Object.entries(o).map(([k, v]) => [k, String(v)])).toString();
  const down = Math.round((i.price * i.downPct) / 100);
  return {
    afford: '/finance/house-affordability-calculator/' + q({ annualIncome: i.income, monthlyDebts: i.debts, downPayment: down, interestRate: i.rate, loanTerm: i.years, propertyTax: i.taxPct, homeInsurance: i.insurance }),
    dti: '/finance/dti-ratio-calculator/',
    closing: '/finance/closing-costs-calculator/' + q({ homePrice: i.price, downPaymentPct: i.downPct, loanTerm: i.years, interestRate: i.rate }),
    rentBuy: '/finance/home-rent-vs-buy-calculator/' + q({ homePrice: i.price, downPaymentPct: i.downPct, interestRate: i.rate, monthlyRent: i.rent, years: i.stay }),
  };
}

const yrs = (n: number) => `${n} ${n === 1 ? 'year' : 'years'}`;

export const houseEngine: DecisionEngine<HouseInputs, HouseDecision> = {
  idPrefix: 'hd',
  storageKey: 'houseDecisionScenarios',
  defaults: HOUSE_DEFAULTS,
  groups: [
    {
      title: 'Your money',
      hint: 'What a lender looks at first.',
      fields: [
        { key: 'income', label: 'Household income', prefix: '$', suffix: 'per year, before tax' },
        { key: 'debts', label: 'Other monthly debt payments', prefix: '$', suffix: 'car, student loans, cards', help: 'Do not include rent or the new mortgage.' },
        { key: 'savings', label: 'Cash you can use', prefix: '$', suffix: 'savings for down payment, closing and reserves' },
      ],
    },
    {
      title: 'The house',
      hint: 'The one you are thinking about.',
      fields: [
        { key: 'price', label: 'Price', prefix: '$' },
        { key: 'downPct', label: 'Down payment', suffix: '% of price' },
        { key: 'rate', label: 'Mortgage rate', suffix: '% a year' },
        { key: 'years', label: 'Loan term', suffix: 'years' },
        { key: 'taxPct', label: 'Property tax', suffix: '% of price a year' },
        { key: 'insurance', label: 'Homeowner’s insurance', prefix: '$', suffix: 'per year' },
        { key: 'hoa', label: 'HOA dues', prefix: '$', suffix: 'per month (0 if none)' },
      ],
    },
    {
      title: 'Renting instead',
      hint: 'For the rent-versus-buy comparison.',
      fields: [
        { key: 'rent', label: 'Rent you would pay', prefix: '$', suffix: 'per month' },
        { key: 'stay', label: 'Years you expect to stay', suffix: 'years' },
      ],
    },
  ],
  validate: validateHouse,
  evaluate: evaluateHouse,
  fromQuery: inputsFromQuery,
  toQuery: queryFromInputs,
  invalidMessage:
    'Enter a number in every field. The price, income and rent must be above zero, the down payment under 100%, and the loan term between 5 and 40 years.',
  emptyMessage: 'Fill in the numbers to see whether this house fits.',
  compareHint: 'the price, down payment or rate',

  verdict: (d) => ({
    level: d.verdict,
    title: VERDICT[d.verdict].title,
    line: VERDICT[d.verdict].line,
    lines: [
      { label: 'Monthly housing payment', value: fmtMoney(d.housing), strong: true },
      { label: 'Most you can afford', value: d.maxPrice === null ? 'No room' : fmtMoney(d.maxPrice) },
      { label: 'Debt-to-income', value: `${d.backEnd.toFixed(1)}%` },
      { label: d.cashLeft >= 0 ? 'Cash left after closing' : 'Cash short by', value: fmtMoney(Math.abs(d.cashLeft)) },
    ],
    reasons: d.reasons,
  }),

  steps: (d, i) => {
    const l = links(i);
    const A = HOUSE_ASSUMPTIONS;
    return [
      {
        title: 'Is the price within budget?',
        answer:
          d.maxPrice === null
            ? 'Your debts and insurance leave no room for a housing payment.'
            : `The 28/36 limits allow up to ${fmtMoney(d.maxPrice)} with this down payment. This house is ${fmtMoney(i.price)}.`,
        lines: [
          { label: 'Principal and interest', value: fmtMoney(d.principalAndInterest) },
          { label: 'Property tax', value: fmtMoney(d.propertyTax) },
          { label: 'Insurance', value: fmtMoney(d.insurance) },
          ...(d.hoa > 0 ? [{ label: 'HOA', value: fmtMoney(d.hoa) }] : []),
          ...(d.pmi > 0 ? [{ label: 'Mortgage insurance (under 20% down)', value: fmtMoney(d.pmi) }] : []),
          { label: 'Total per month', value: fmtMoney(d.housing), strong: true },
        ],
        href: l.afford,
        linkLabel: 'Open the full affordability calculator',
      },
      {
        title: 'What will lenders see in your debt?',
        answer: `Housing takes ${d.frontEnd.toFixed(1)}% of your gross income and all debt takes ${d.backEnd.toFixed(1)}%.`,
        lines: [
          { label: 'Housing only (front-end)', value: `${d.frontEnd.toFixed(1)}% · ${d.frontBand.label}` },
          { label: 'All debt (back-end)', value: `${d.backEnd.toFixed(1)}% · ${d.backBand.label}` },
        ],
        note: { text: d.backBand.note, tone: d.backBand.tone },
        href: l.dti,
        linkLabel: 'Open the debt-to-income calculator',
      },
      {
        title: 'Do you have the cash to close?',
        answer: d.cashLeft >= 0 ? `Yes: you would keep ${fmtMoney(d.cashLeft)} after closing.` : `Not yet: you are ${fmtMoney(-d.cashLeft)} short once reserves are counted.`,
        lines: [
          { label: 'Down payment', value: fmtMoney(d.downPayment) },
          { label: 'Estimated closing costs', value: fmtMoney(d.closing) },
          { label: `${A.reserveMonths} months of payments in reserve`, value: fmtMoney(d.reserves) },
          { label: 'Total cash needed', value: fmtMoney(d.cashNeeded), strong: true },
        ],
        href: l.closing,
        linkLabel: 'See every closing cost line',
      },
      {
        title: 'Is buying better than renting?',
        answer:
          d.breakEvenYear === null
            ? `Not within 30 years at these numbers: renting costs less over ${yrs(d.stayYears)}.`
            : d.rentVsBuy === 'buy'
              ? `Buying comes out ahead after year ${d.breakEvenYear}, and you plan to stay ${yrs(d.stayYears)}.`
              : `Buying only wins after year ${d.breakEvenYear}; at ${yrs(d.stayYears)} renting costs less.`,
        lines: [
          { label: `Net cost to buy (${d.stayYears} yr)`, value: fmtMoney(d.netBuyCost) },
          { label: `Net cost to rent (${d.stayYears} yr)`, value: fmtMoney(d.netRentCost) },
          { label: 'Break-even year', value: d.breakEvenYear === null ? 'Beyond 30 years' : `Year ${d.breakEvenYear}`, strong: true },
        ],
        href: l.rentBuy,
        linkLabel: 'Open the rent-versus-buy calculator',
      },
    ];
  },

  compareRows: [
    { label: 'Price', value: (_d, i) => fmtMoney(i.price) },
    { label: 'Down payment', value: (d, i) => `${i.downPct}% · ${fmtMoney(d.downPayment)}` },
    { label: 'Rate', value: (_d, i) => `${i.rate}%` },
    { label: 'Monthly payment', value: (d) => fmtMoney(d.housing) },
    { label: 'Debt-to-income', value: (d) => `${d.backEnd.toFixed(1)}%` },
    { label: 'Cash left after closing', value: (d) => fmtMoney(d.cashLeft) },
    { label: 'Break-even vs renting', value: (d) => (d.breakEvenYear === null ? 'Beyond 30 years' : `Year ${d.breakEvenYear}`) },
    { label: 'Verdict', value: (d) => VERDICT[d.verdict].title },
  ],
};
