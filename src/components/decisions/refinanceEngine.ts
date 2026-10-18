// "Should I refinance?" described for the generic DecisionTool island. Math: src/lib/refinanceDecision.ts.
import type { DecisionEngine, VerdictLevel } from '../../lib/decisionEngine';
import {
  evaluateRefinance,
  fmtMoney,
  fmtMonths,
  inputsFromQuery,
  queryFromInputs,
  REFINANCE_DEFAULTS,
  validateRefinance,
  type RefinanceDecision,
  type RefinanceInputs,
} from '../../lib/refinanceDecision';

const VERDICT: Record<VerdictLevel, { title: string; line: string }> = {
  comfortable: { title: 'Worth refinancing', line: 'Over your stay the new loan costs less, the closing costs are repaid early, and you do not pay more interest by the end.' },
  tight: { title: 'Worth a closer look', line: 'The new loan costs less over your stay, but the margin is thin or you pay more interest in total. Read the reasons below.' },
  over: { title: 'Not worth it at these numbers', line: 'Over your stay, refinancing costs more than keeping the loan you have.' },
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Deep link into the refinance calculator (its inputs are in months and have no cash-out field). */
function calculatorLink(i: RefinanceInputs): string {
  const q = new URLSearchParams({
    currentBalance: String(i.balance),
    currentRate: String(i.currentRate),
    currentTerm: String(clamp(Math.round(i.yearsLeft * 12), 12, 360)),
    newRate: String(i.newRate),
    newTerm: String(clamp(Math.round(i.newYears * 12), 12, 360)),
    closingCosts: String(i.closingCosts),
    plannedStay: String(clamp(Math.round(i.stay * 12), 1, 360)),
  });
  return `/finance/refinance-calculator/?${q.toString()}`;
}

const signed = (n: number) => (n > 0 ? `+${fmtMoney(n)}` : fmtMoney(n));

export const refinanceEngine: DecisionEngine<RefinanceInputs, RefinanceDecision> = {
  idPrefix: 'rf',
  storageKey: 'refinanceDecisionScenarios',
  defaults: REFINANCE_DEFAULTS,
  groups: [
    {
      title: 'Your current loan',
      hint: 'From your latest mortgage statement.',
      fields: [
        { key: 'balance', label: 'Current loan balance', prefix: '$', suffix: 'principal still owed' },
        { key: 'currentRate', label: 'Current rate', suffix: '% a year' },
        { key: 'yearsLeft', label: 'Time left on the loan', suffix: 'years (decimals are fine, 22.5)' },
      ],
    },
    {
      title: 'The new loan',
      hint: 'From the Loan Estimate you were quoted.',
      fields: [
        { key: 'newRate', label: 'New rate', suffix: '% a year' },
        { key: 'newYears', label: 'New loan term', suffix: 'years' },
        { key: 'closingCosts', label: 'Total cost to refinance', prefix: '$', suffix: 'fees, points and prepaid items you pay in cash' },
        { key: 'cashOut', label: 'Cash out', prefix: '$', suffix: 'added to the new loan (0 if none)' },
      ],
    },
    {
      title: 'Your plans',
      hint: 'The horizon the comparison runs over.',
      fields: [{ key: 'stay', label: 'Years you expect to keep the home', suffix: 'years' }],
    },
  ],
  validate: validateRefinance,
  evaluate: evaluateRefinance,
  fromQuery: inputsFromQuery,
  toQuery: queryFromInputs,
  invalidMessage:
    'Enter a number in every field. The balance must be above zero, rates between 0 and 30%, both loan terms between 1 month and 40 years, costs and cash out zero or more, and your stay between 6 months and 50 years.',
  emptyMessage: 'Fill in the numbers to see whether refinancing pays.',
  compareHint: 'the new rate, term or closing costs',

  verdict: (d) => ({
    level: d.verdict,
    title: VERDICT[d.verdict].title,
    line: VERDICT[d.verdict].line,
    lines: [
      { label: 'New monthly payment', value: fmtMoney(d.newPayment), strong: true },
      { label: d.monthlySaving >= 0 ? 'Monthly saving' : 'Payment rises by', value: fmtMoney(Math.abs(d.monthlySaving)) },
      { label: 'Break-even', value: d.breakEvenMonth === null ? 'Never on payment alone' : d.breakEvenMonth === 0 ? 'Immediately' : fmtMonths(d.breakEvenMonth) },
      { label: d.netAdvantage >= 0 ? `Cheaper over ${fmtMonths(d.stayMonths)}` : `Costlier over ${fmtMonths(d.stayMonths)}`, value: fmtMoney(Math.abs(d.netAdvantage)) },
      { label: d.lifetimeDiff > 0 ? 'More interest to payoff' : 'Less interest to payoff', value: fmtMoney(Math.abs(d.lifetimeDiff)) },
    ],
    reasons: d.reasons,
  }),

  steps: (d, i) => {
    const href = calculatorLink(i);
    const linkLabel = i.cashOut > 0 ? 'Open the refinance calculator (it has no cash-out field)' : 'Open the full refinance calculator';
    const stay = fmtMonths(d.stayMonths);
    return [
      {
        title: 'What happens to your monthly payment?',
        answer:
          d.monthlySaving > 0.005
            ? `It falls from ${fmtMoney(d.currentPayment)} to ${fmtMoney(d.newPayment)}, a saving of ${fmtMoney(d.monthlySaving)} a month.`
            : `It rises from ${fmtMoney(d.currentPayment)} to ${fmtMoney(d.newPayment)}, ${fmtMoney(-d.monthlySaving)} more a month.`,
        lines: [
          { label: `Current payment (${fmtMonths(d.monthsLeft)} left)`, value: fmtMoney(d.currentPayment) },
          { label: `New payment (${fmtMonths(d.newMonths)})`, value: fmtMoney(d.newPayment) },
          { label: d.monthlySaving >= 0 ? 'Monthly saving' : 'Monthly increase', value: fmtMoney(Math.abs(d.monthlySaving)), strong: true },
        ],
        note: i.cashOut > 0 ? { text: `The new loan is ${fmtMoney(d.newBalance)}: your balance plus ${fmtMoney(i.cashOut)} cash out.`, tone: 'neutral' } : undefined,
        href,
        linkLabel,
      },
      {
        title: 'When do you break even?',
        answer:
          d.breakEvenMonth === null
            ? 'The payment does not fall, so the closing costs cannot be repaid out of payment savings.'
            : d.breakEvenMonth === 0
              ? 'There are no closing costs to repay, so the saving starts at once.'
              : `${fmtMoney(i.closingCosts)} of closing costs divided by ${fmtMoney(d.monthlySaving)} a month is ${fmtMonths(d.breakEvenMonth)}. You plan to stay ${stay}.`,
        lines: [
          { label: 'Total cost to refinance', value: fmtMoney(i.closingCosts) },
          { label: 'Monthly saving', value: d.monthlySaving > 0.005 ? fmtMoney(d.monthlySaving) : 'None' },
          { label: 'Break-even', value: d.breakEvenMonth === null ? 'Never' : d.breakEvenMonth === 0 ? 'Immediately' : fmtMonths(d.breakEvenMonth), strong: true },
          { label: 'Your stay', value: stay },
        ],
        note:
          d.breakEvenMonth !== null && d.breakEvenMonth > d.stayMonths
            ? { text: 'You would move before the payment saving repays the closing costs.', tone: 'negative' }
            : undefined,
        href,
        linkLabel,
      },
      {
        title: `What does each path cost over your ${stay}?`,
        answer:
          d.netAdvantage > 0.5
            ? `Refinancing costs ${fmtMoney(d.netAdvantage)} less than keeping your loan over the same ${stay}.`
            : `Refinancing costs ${fmtMoney(-d.netAdvantage)} more than keeping your loan over the same ${stay}.`,
        lines: [
          { label: 'Keep: payments made', value: fmtMoney(d.currentPaymentsStay) },
          { label: 'Keep: still owed at the end', value: fmtMoney(d.currentBalanceEnd) },
          { label: 'Keep: net cost', value: fmtMoney(d.netCostStay), strong: true },
          { label: 'Refinance: closing costs', value: fmtMoney(i.closingCosts) },
          { label: 'Refinance: payments made', value: fmtMoney(d.newPaymentsStay) },
          { label: 'Refinance: still owed at the end', value: fmtMoney(d.newBalanceEnd) },
          ...(i.cashOut > 0 ? [{ label: 'Refinance: cash received', value: `-${fmtMoney(i.cashOut)}` }] : []),
          { label: 'Refinance: net cost', value: fmtMoney(d.netCostRefi), strong: true },
          { label: 'Interest paid in that time (keep / refinance)', value: `${fmtMoney(d.currentInterestStay)} / ${fmtMoney(d.newInterestStay)}` },
        ],
        note: { text: 'Net cost = payments made + closing costs + balance still owed at the end - cash out. The home is worth the same either way, so owing less is the equity gained.', tone: 'neutral' },
        href,
        linkLabel,
      },
      {
        title: 'What happens to the interest if you keep both loans to the end?',
        answer:
          d.lifetimeDiff >= 1
            ? `You would pay ${fmtMoney(d.lifetimeDiff)} more interest in total, even if today's payment is lower.`
            : d.lifetimeDiff <= -1
              ? `You would pay ${fmtMoney(-d.lifetimeDiff)} less interest in total.`
              : 'Total interest to payoff is about the same.',
        lines: [
          { label: `Interest left on current loan (${fmtMonths(d.monthsLeft)})`, value: fmtMoney(d.currentLifetimeInterest) },
          { label: `Interest on new loan (${fmtMonths(d.newMonths)})`, value: fmtMoney(d.newLifetimeInterest) },
          { label: 'Difference', value: signed(d.lifetimeDiff), strong: true },
        ],
        note:
          d.lifetimeDiff >= 1
            ? { text: `A new term of ${fmtMonths(d.newMonths)} against ${fmtMonths(d.monthsLeft)} left, or a larger balance, spreads interest over more years.`, tone: 'negative' }
            : { text: 'Lifetime interest is not higher with this refinance.', tone: 'positive' },
        href,
        linkLabel,
      },
    ];
  },

  compareRows: [
    { label: 'Rate', value: (_d, i) => `${i.currentRate}% to ${i.newRate}%` },
    { label: 'New term', value: (d) => fmtMonths(d.newMonths) },
    { label: 'Total cost to refinance', value: (_d, i) => fmtMoney(i.closingCosts) },
    { label: 'New monthly payment', value: (d) => fmtMoney(d.newPayment) },
    { label: 'Monthly saving', value: (d) => fmtMoney(d.monthlySaving) },
    { label: 'Break-even', value: (d) => (d.breakEvenMonth === null ? 'Never' : fmtMonths(d.breakEvenMonth)) },
    { label: 'Net advantage over your stay', value: (d) => signed(d.netAdvantage) },
    { label: 'Lifetime interest change', value: (d) => signed(d.lifetimeDiff) },
    { label: 'Verdict', value: (d) => VERDICT[d.verdict].title },
  ],
};
