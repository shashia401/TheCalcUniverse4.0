// "Can I afford this car?" described for the generic DecisionTool island. Math: src/lib/carDecision.ts.
import type { DecisionEngine, VerdictLevel } from '../../lib/decisionEngine';
import {
  CAR_ASSUMPTIONS,
  CAR_DEFAULTS,
  evaluateCar,
  fmtMoney,
  inputsFromQuery,
  queryFromInputs,
  validateCar,
  type CarDecision,
  type CarInputs,
} from '../../lib/carDecision';

const VERDICT: Record<VerdictLevel, { title: string; line: string }> = {
  comfortable: { title: 'Within your budget', line: 'The down payment, loan term, total cost, debt and cash all sit inside the guidelines used here.' },
  tight: { title: 'Possible, but tight', line: 'You can likely get the loan, but at least one 20/4/10 guideline is stretched. Read the reasons below before you sign.' },
  over: { title: 'Over budget', line: 'At these numbers the car costs more than the guidelines used here support, or you do not have the cash.' },
};

const A = CAR_ASSUMPTIONS;

/**
 * Deep links into the existing calculators, carrying the numbers already entered. Query keys are the target
 * calculators' own input ids (the calculator form seeds from them). The auto-loan calculator taxes the full price
 * when tradeInTaxCredit is 'no' and takes tax and fees as cash down, so its amount financed matches this tool's.
 */
function links(d: CarDecision, i: CarInputs) {
  const q = (o: Record<string, string | number>) => '?' + new URLSearchParams(Object.entries(o).map(([k, v]) => [k, String(v)])).toString();
  const loan = (months: number) =>
    '/automotive/auto-loan-calculator/' +
    q({
      vehiclePrice: i.price,
      loanTerm: months,
      interestRate: i.rate,
      downPayment: Math.round(d.cashNeeded),
      tradeInValue: i.tradeIn,
      salesTaxPct: i.salesTaxPct,
      tradeInTaxCredit: 'no',
    });
  return {
    loan: loan(i.months),
    loan48: loan(A.termMaxMonths),
    dti: '/finance/dti-ratio-calculator/' + q({ grossMonthlySalary: Math.round(i.income / 12), carPayment: Math.round(d.payment), otherDebt: Math.round(i.debts) }),
    depreciation: '/automotive/vehicle-depreciation-calculator/' + q({ purchasePrice: i.price, yearsOwned: Math.max(1, Math.round(i.months / 12)) }),
  };
}

const pct = (n: number) => `${n.toFixed(1)}%`;
const pass = (ok: boolean) => (ok ? 'Pass' : 'Fails');

export const carEngine: DecisionEngine<CarInputs, CarDecision> = {
  idPrefix: 'cd',
  storageKey: 'carDecisionScenarios',
  defaults: CAR_DEFAULTS,
  groups: [
    {
      title: 'Your money',
      hint: 'What a lender and the 20/4/10 rule look at first.',
      fields: [
        { key: 'income', label: 'Gross income', prefix: '$', suffix: 'per year, before tax' },
        { key: 'debts', label: 'Monthly debt payments', prefix: '$', suffix: 'rent or mortgage, cards, student loans', help: 'Do not include the car you are pricing.' },
        { key: 'savings', label: 'Cash you can use', prefix: '$', suffix: 'savings for the down payment, tax and fees' },
      ],
    },
    {
      title: 'The car and the loan',
      hint: 'The deal you are considering.',
      fields: [
        { key: 'price', label: 'Vehicle price', prefix: '$' },
        { key: 'salesTaxPct', label: 'Sales tax and fees', suffix: '% of price, paid in cash at signing' },
        { key: 'tradeIn', label: 'Trade-in value', prefix: '$', suffix: '0 if none; counts toward the 20% down' },
        { key: 'downPct', label: 'Cash down payment', suffix: '% of price, on top of any trade-in' },
        { key: 'rate', label: 'Loan APR', suffix: '% a year' },
        { key: 'months', label: 'Loan term', suffix: 'months, 12 to 96' },
      ],
    },
    {
      title: 'Running the car',
      hint: 'Monthly costs besides the payment.',
      fields: [
        { key: 'insurance', label: 'Insurance', prefix: '$', suffix: 'per month' },
        { key: 'running', label: 'Fuel and maintenance', prefix: '$', suffix: 'per month' },
      ],
    },
  ],
  validate: validateCar,
  evaluate: evaluateCar,
  fromQuery: inputsFromQuery,
  toQuery: queryFromInputs,
  invalidMessage:
    'Enter a number in every field. The price and income must be above zero, the cash down payment between 0 and 100%, and the loan term a whole number of months from 12 to 96.',
  emptyMessage: 'Fill in the numbers to see whether this car fits.',
  compareHint: 'the price, down payment or loan term',

  verdict: (d) => ({
    level: d.verdict,
    title: VERDICT[d.verdict].title,
    line: VERDICT[d.verdict].line,
    lines: [
      { label: 'All-in monthly cost', value: fmtMoney(d.monthlyCost), strong: true },
      { label: 'Loan payment', value: fmtMoney(d.payment) },
      { label: 'Share of gross income', value: pct(d.costSharePct) },
      { label: d.cashLeft >= 0 ? 'Cash left after signing' : 'Cash short by', value: fmtMoney(Math.abs(d.cashLeft)) },
    ],
    reasons: d.reasons,
  }),

  steps: (d, i) => {
    const l = links(d, i);
    return [
      {
        title: 'What will the loan cost?',
        answer:
          d.financed > 0
            ? `You would borrow ${fmtMoney(d.financed)} and pay ${fmtMoney(d.payment)} a month for ${i.months} months, ${fmtMoney(d.totalInterest)} of it interest.`
            : 'The cash down payment and trade-in cover the price, so there is no loan.',
        lines: [
          { label: 'Amount financed', value: fmtMoney(d.financed) },
          { label: 'Monthly payment', value: fmtMoney(d.payment), strong: true },
          { label: 'Total interest', value: fmtMoney(d.totalInterest) },
        ],
        href: l.loan,
        linkLabel: 'Open the auto loan calculator',
      },
      {
        title: 'Does it pass the 20/4/10 check?',
        answer: `${[d.failedDown, d.failedTerm, d.failedCost].filter((x) => !x).length} of 3 guideline tests pass. This is a rule of thumb, not a lender rule.`,
        lines: [
          { label: `Down payment plus trade-in (at least ${A.downMinPct}%)`, value: `${pct(d.downSharePct)} · ${pass(!d.failedDown)}` },
          { label: `Loan term (at most ${A.termMaxMonths} months)`, value: `${i.months} months · ${pass(!d.failedTerm)}` },
          { label: `All-in cost (under ${A.costGuidePct}% of income)`, value: `${pct(d.costSharePct)} · ${pass(!d.failedCost)}` },
        ],
        note: {
          text:
            d.paymentRoom > 0
              ? `A payment of ${fmtMoney(d.paymentRoom)} a month or less keeps all-in cost at ${A.costGuidePct}% of income with the insurance and running costs you entered.`
              : `Insurance and running costs alone already use ${A.costGuidePct}% of income, so no loan payment fits the guideline.`,
          tone: d.failedCost ? 'neutral' : 'positive',
        },
        href: l.loan48,
        linkLabel: `See the same car on a ${A.termMaxMonths}-month loan`,
      },
      {
        title: 'What will lenders see in your debt?',
        answer: `With the car payment, debt takes ${pct(d.backEnd)} of gross income. The ceiling used here is ${A.dtiCeilingPct}%.`,
        lines: [
          { label: 'Other monthly debts', value: fmtMoney(i.debts) },
          { label: 'Car payment', value: fmtMoney(d.payment) },
          { label: 'Debt-to-income with the car', value: `${pct(d.backEnd)} · ${pass(!d.overDti)}`, strong: true },
        ],
        href: l.dti,
        linkLabel: 'Open the debt-to-income calculator',
      },
      {
        title: 'Do you have the cash, and what is the total cost?',
        answer: d.cashLeft >= 0 ? `Yes: you would keep ${fmtMoney(d.cashLeft)} after signing.` : `Not yet: you are ${fmtMoney(-d.cashLeft)} short at signing.`,
        lines: [
          { label: 'Cash down payment', value: fmtMoney(d.cashDown) },
          { label: 'Sales tax and fees', value: fmtMoney(d.taxFees) },
          { label: 'Cash needed at signing', value: fmtMoney(d.cashNeeded), strong: true },
          { label: `Total paid over ${i.months} months`, value: fmtMoney(d.totalCost) },
        ],
        note: { text: 'Total paid adds the down payment, tax and fees, every loan payment, insurance, fuel and maintenance. It leaves out the value of your trade-in and what the car is worth at the end.', tone: 'neutral' },
        href: l.depreciation,
        linkLabel: 'See how much the car may lose in value',
      },
    ];
  },

  compareRows: [
    { label: 'Price', value: (_d, i) => fmtMoney(i.price) },
    { label: 'Down payment', value: (d, i) => `${i.downPct}% · ${fmtMoney(d.cashDown)}` },
    { label: 'Loan term', value: (_d, i) => `${i.months} months` },
    { label: 'Monthly payment', value: (d) => fmtMoney(d.payment) },
    { label: 'All-in monthly cost', value: (d) => fmtMoney(d.monthlyCost) },
    { label: 'Share of gross income', value: (d) => pct(d.costSharePct) },
    { label: 'Debt-to-income', value: (d) => pct(d.backEnd) },
    { label: 'Cash left after signing', value: (d) => fmtMoney(d.cashLeft) },
    { label: 'Verdict', value: (d) => VERDICT[d.verdict].title },
  ],
};
