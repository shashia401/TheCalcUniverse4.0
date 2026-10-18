// "Am I saving enough to retire?" described for the generic DecisionTool island. Math: src/lib/retirementDecision.ts.
import type { DecisionEngine, VerdictLevel } from '../../lib/decisionEngine';
import {
  RETIREMENT_ASSUMPTIONS,
  RETIREMENT_DEFAULTS,
  evaluateRetirement,
  fmtMoney,
  inputsFromQuery,
  queryFromInputs,
  validateRetirement,
  type RetirementDecision,
  type RetirementInputs,
} from '../../lib/retirementDecision';

const A = RETIREMENT_ASSUMPTIONS;

const VERDICT: Record<VerdictLevel, { title: string; line: string }> = {
  comfortable: { title: 'On track', line: `Your projected savings cover the spending you plan: ${A.comfortablePct}% or more of the nest egg the plan needs.` },
  tight: { title: 'Close, but short', line: `Your projected savings cover ${A.tightPct}% to just under ${A.comfortablePct}% of what the plan needs. A small change to saving, retirement age or spending could close the gap.` },
  over: { title: 'Not on track', line: `Your projected savings cover less than ${A.tightPct}% of what the plan needs. Read the gap and the fix below before changing anything.` },
};

/**
 * Deep links into the existing calculators, carrying numbers already entered. Query keys are the target
 * calculators' own input ids (the calculator form seeds from them). Values outside a target's allowed range are
 * left out, because that calculator shows no result for an out-of-range seed.
 */
function links(d: RetirementDecision, i: RetirementInputs) {
  const q = (o: Record<string, string | number | null>) => {
    const entries = Object.entries(o).filter((e): e is [string, string | number] => e[1] !== null).map(([k, v]) => [k, String(v)]);
    return entries.length ? '?' + new URLSearchParams(entries).toString() : '';
  };
  const within = (v: number, lo: number, hi: number) => (v >= lo && v <= hi ? v : null);
  const round2 = (n: number) => Math.round(n * 100) / 100;
  return {
    // retirement calculator: it applies the 4% rule to the net yearly need, so the carried need is spend minus benefit
    retirement:
      '/finance/retirement-calculator/' +
      q({
        currentAge: i.age,
        retirementAge: i.retireAge,
        currentSavings: Math.round(i.savings),
        monthlyContribution: Math.round(i.monthly),
        annualReturn: Math.max(0, i.returnPct),
        inflationRate: i.inflationPct,
        desiredIncome: Math.round(d.netNeed),
      }),
    socialSecurity: '/finance/social-security-calculator/' + q({ retirementAge: within(i.retireAge, 62, 70) }),
    k401:
      '/finance/401k-calculator/' +
      q({
        currentAge: within(i.age, 16, 80),
        retirementAge: within(i.retireAge, 40, 90),
        currentBalance: Math.round(i.savings),
        rateOfReturn: within(i.returnPct, 0, 30),
      }),
    // annuity payout: monthly rate = annual / 12, so 12 x our real monthly rate reproduces this tool's retirement-phase growth
    annuity:
      '/finance/annuity-payout-calculator/' +
      q({
        solveFor: 'duration',
        principal: Math.round(d.projected),
        annualReturn: within(round2(Math.max(0, 1200 * (Math.pow((1 + i.retireReturnPct / 100) / (1 + i.inflationPct / 100), 1 / 12) - 1))), 0, 20),
        payoutFrequency: 'monthly',
        payoutAmount: Math.round(d.netNeed / 12),
        inflationAdjust: 'nominal',
      }),
  };
}

const pct = (n: number) => (Number.isFinite(n) ? `${n.toFixed(1)}%` : 'Fully covered');
const age = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export const retirementEngine: DecisionEngine<RetirementInputs, RetirementDecision> = {
  idPrefix: 'rd',
  storageKey: 'retirementDecisionScenarios',
  defaults: RETIREMENT_DEFAULTS,
  groups: [
    {
      title: 'You and your timeline',
      hint: 'Ages in whole years. The plan runs from today to the age you plan to.',
      fields: [
        { key: 'age', label: 'Your age today' },
        { key: 'retireAge', label: 'Retirement age', suffix: 'the age you stop working' },
        { key: 'lifeAge', label: 'Plan to age', suffix: 'a long life is the safer assumption' },
      ],
    },
    {
      title: 'What you are saving',
      hint: 'All retirement accounts together. Figures are in today’s dollars.',
      fields: [
        { key: 'savings', label: 'Retirement savings now', prefix: '$', suffix: '401(k), IRA and other retirement accounts' },
        { key: 'monthly', label: 'Monthly saving', prefix: '$', suffix: 'per month, kept level in today’s dollars', help: 'Include any employer match.' },
      ],
    },
    {
      title: 'Return and inflation assumptions',
      hint: 'These are example inputs you choose, not forecasts. Nobody knows the future return.',
      fields: [
        { key: 'returnPct', label: 'Return while saving', suffix: '% a year, before inflation' },
        { key: 'retireReturnPct', label: 'Return in retirement', suffix: '% a year, before inflation', help: 'Usually lower: a retiree holds safer investments.' },
        { key: 'inflationPct', label: 'Inflation', suffix: '% a year' },
      ],
    },
    {
      title: 'Your retirement spending',
      hint: 'In today’s dollars, before tax.',
      fields: [
        { key: 'spend', label: 'Spending in retirement', prefix: '$', suffix: 'per year, before tax' },
        { key: 'benefit', label: 'Social Security or pension', prefix: '$', suffix: 'per year, starting at retirement; 0 if none' },
      ],
    },
  ],
  validate: validateRetirement,
  evaluate: evaluateRetirement,
  fromQuery: inputsFromQuery,
  toQuery: queryFromInputs,
  invalidMessage:
    'Enter a number in every field. Use whole-year ages with your age below the retirement age and the retirement age below the plan-to age, returns from -5% to 15%, inflation from 0% to 15%, spending above zero, and no negative money.',
  emptyMessage: 'Fill in the numbers to see whether your saving is enough.',
  compareHint: 'the retirement age, monthly saving or spending',

  verdict: (d) => ({
    level: d.verdict,
    title: VERDICT[d.verdict].title,
    line: VERDICT[d.verdict].line,
    lines: [
      { label: 'Projected at retirement', value: fmtMoney(d.projected), strong: true },
      { label: 'Nest egg needed', value: fmtMoney(d.needed) },
      { label: 'Funded', value: pct(d.fundedPct) },
      d.shortfall > 0
        ? { label: 'Extra saving to close the gap', value: `${fmtMoney(d.extraMonthly)} a month` }
        : { label: 'Surplus over the plan', value: fmtMoney(d.surplus) },
    ],
    reasons: d.reasons,
  }),

  steps: (d, i) => {
    const l = links(d, i);
    const growth = d.projected - d.contributed;
    return [
      {
        title: 'What will you have at retirement?',
        answer: `About ${fmtMoney(d.projected)} in today’s dollars at age ${i.retireAge}, after ${d.yearsToRetire} years of saving.`,
        lines: [
          { label: 'Savings now plus every deposit', value: fmtMoney(d.contributed) },
          { label: 'Growth after inflation', value: fmtMoney(growth) },
          { label: `Balance at ${i.retireAge}, today’s dollars`, value: fmtMoney(d.projected), strong: true },
          { label: 'Real return while saving', value: `${d.realSaveReturnPct.toFixed(2)}% a year` },
        ],
        note: {
          text: 'The retirement calculator keeps deposits level in dollars of the day rather than today’s dollars, so its inflation-adjusted figure comes out a little lower than this one.',
          tone: 'neutral',
        },
        href: l.retirement,
        linkLabel: 'Open the retirement calculator',
      },
      {
        title: 'What do you need to fund your spending?',
        answer:
          d.netNeed > 0
            ? `To pay ${fmtMoney(d.netNeed)} a year from savings for ${d.yearsInRetirement} years, you need about ${fmtMoney(d.needed)} at age ${i.retireAge}.`
            : 'Your Social Security or pension covers the spending you plan, so no nest egg is needed to fund it.',
        lines: [
          { label: 'Planned spending a year', value: fmtMoney(i.spend) },
          { label: 'Social Security or pension a year', value: fmtMoney(i.benefit) },
          { label: 'Paid from savings a year', value: fmtMoney(d.netNeed) },
          { label: `Nest egg needed for ${d.yearsInRetirement} years`, value: fmtMoney(d.needed), strong: true },
          { label: `${A.ruleOfThumbPct}% rule of thumb`, value: fmtMoney(d.ruleOfThumb) },
        ],
        note: {
          text: `The ${A.ruleOfThumbPct}% rule is only a rule of thumb, built around about 30 years of withdrawals. The nest egg figure above is the exact present value of your ${d.yearsInRetirement}-year plan at a ${d.realRetireReturnPct.toFixed(2)}% real return.`,
          tone: 'neutral',
        },
        href: l.socialSecurity,
        linkLabel: 'Estimate your Social Security benefit',
      },
      {
        title: 'How big is the gap, and what closes it?',
        answer:
          d.shortfall > 0
            ? `You are ${fmtMoney(d.shortfall)} short. Saving ${fmtMoney(d.extraMonthly)} more each month, starting now, closes it.`
            : d.surplus > 0
              ? `You are ${fmtMoney(d.surplus)} ahead of what the plan needs. No extra saving is required.`
              : 'Nothing is needed from savings, so there is no gap.',
        lines: [
          { label: 'Funded', value: pct(d.fundedPct), strong: true },
          { label: d.shortfall > 0 ? 'Shortfall at retirement' : 'Surplus at retirement', value: fmtMoney(d.shortfall > 0 ? d.shortfall : d.surplus) },
          { label: 'Extra monthly saving needed', value: fmtMoney(d.extraMonthly), strong: true },
          { label: 'Total monthly saving then', value: fmtMoney(i.monthly + d.extraMonthly) },
        ],
        note: {
          text: 'Extra saving is level in today’s dollars and earns the same real return as your current saving. Retiring later or spending less also closes the gap.',
          tone: d.shortfall > 0 ? 'neutral' : 'positive',
        },
        href: l.k401,
        linkLabel: 'See what an employer match could add',
      },
      {
        title: 'How long will the money last?',
        answer:
          d.runOutAge === null
            ? `At ${fmtMoney(i.spend)} a year the savings last through age ${i.lifeAge}.`
            : `At ${fmtMoney(i.spend)} a year the savings run out around age ${age(d.runOutAge)}, ${age(i.lifeAge - d.runOutAge)} years before ${i.lifeAge}.`,
        lines: [
          { label: 'Money lasts until', value: d.runOutAge === null ? `age ${i.lifeAge} or later` : `about age ${age(d.runOutAge)}`, strong: true },
          { label: 'Planned spending a year', value: fmtMoney(i.spend) },
          { label: `Spending the balance supports to ${i.lifeAge}`, value: `${fmtMoney(d.sustainableSpend)} a year` },
        ],
        note: {
          text: 'This assumes steady returns. Real markets are uneven, and bad years early in retirement hurt more than the same years later. It also leaves out taxes and healthcare costs.',
          tone: 'neutral',
        },
        href: l.annuity,
        linkLabel: 'Check it in the annuity payout calculator',
      },
    ];
  },

  compareRows: [
    { label: 'Retire at', value: (_d, i) => `age ${i.retireAge}` },
    { label: 'Monthly saving', value: (_d, i) => fmtMoney(i.monthly) },
    { label: 'Spending a year', value: (_d, i) => fmtMoney(i.spend) },
    { label: 'Projected at retirement', value: (d) => fmtMoney(d.projected) },
    { label: 'Nest egg needed', value: (d) => fmtMoney(d.needed) },
    { label: 'Funded', value: (d) => pct(d.fundedPct) },
    { label: 'Extra monthly saving needed', value: (d) => fmtMoney(d.extraMonthly) },
    { label: 'Money lasts until', value: (d, i) => (d.runOutAge === null ? `age ${i.lifeAge}+` : `age ${age(d.runOutAge)}`) },
    { label: 'Verdict', value: (d) => VERDICT[d.verdict].title },
  ],
};
