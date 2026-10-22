import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult, ExplainStep } from '../../../types/calculator';
import { finiteSteps } from '../../../utils/explainGuard';
import RothIRAPanel from './RothIRAPanel';
import { IRA_LIMITS, ROTH_IRA_INCOME_LIMITS, TAX_YEAR } from '../../../utils/taxData';
import { parseRothInputs, rothProjection } from './rothMath';

const ROTH_LIMIT_2026 = IRA_LIMITS.base;
const ROTH_CATCHUP_2026 = IRA_LIMITS.catchup;
const $ = (n: number) => `$${n.toLocaleString()}`;
const SINGLE = ROTH_IRA_INCOME_LIMITS.single;
const MFJ = ROTH_IRA_INCOME_LIMITS.mfj;

/** The calculator's own money format: whole dollars, or $x.xxM from a million up. */
const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const rothIRAConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'currentAge',
      label: 'Current Age',
      type: 'number',
      placeholder: '30',
      unit: 'years',
      min: 18,
      max: 73,
      step: 1,
      required: true,
    },
    {
      id: 'retirementAge',
      label: 'Target Retirement Age',
      type: 'number',
      placeholder: '65',
      unit: 'years',
      min: 30,
      max: 80,
      step: 1,
      required: true,
    },
    {
      id: 'currentBalance',
      label: 'Current Roth IRA Balance',
      type: 'number',
      placeholder: '15,000',
      prefix: '$',
      min: 0,
      step: 500,
      helpText: 'Enter 0 if starting fresh',
    },
    {
      id: 'annualContribution',
      label: `Annual Contribution (${TAX_YEAR} Limit: $${ROTH_LIMIT_2026.toLocaleString()}, +$${ROTH_CATCHUP_2026.toLocaleString()} if 50+)`,
      type: 'number',
      placeholder: '7,500',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: `${TAX_YEAR} IRS limits: Under 50 = $${ROTH_LIMIT_2026.toLocaleString()}/yr. Age 50+ = $${(ROTH_LIMIT_2026 + ROTH_CATCHUP_2026).toLocaleString()}/yr (includes $${ROTH_CATCHUP_2026.toLocaleString()} catch-up contribution).`,
    },
    {
      id: 'annualReturn',
      label: 'Expected Annual Return',
      type: 'number',
      placeholder: '7.00',
      unit: '%',
      min: 0,
      max: 20,
      step: 0.1,
      required: true,
      helpText: 'Historical S&P 500 average: ~10% nominal, ~7% after inflation. Conservative: 6%. Aggressive: 9%.',
    },
    {
      id: 'marginalTaxRate',
      label: 'Current Marginal Tax Rate',
      type: 'select',
      required: true,
      options: [
        { label: '10% — Single < $12,400 / MFJ < $24,800', value: '10' },
        { label: '12% — Single $12,400–$50,400 / MFJ up to $100,800', value: '12' },
        { label: '22% — Single $50,400–$105,700 / MFJ up to $211,400', value: '22' },
        { label: '24% — Single $105,700–$201,775 / MFJ up to $403,550', value: '24' },
        { label: '32% — Single $201,775–$256,225 / MFJ up to $512,450', value: '32' },
        { label: '35% — Single $256,225–$640,600 / MFJ up to $768,700', value: '35' },
        { label: '37% — Single > $640,600 / MFJ > $768,700', value: '37' },
      ],
      helpText: 'Used to calculate how much in taxes a traditional/taxable account would owe on the same growth',
    },
    {
      id: 'expectedRetirementTaxRate',
      label: 'Expected Tax Rate in Retirement',
      type: 'select',
      options: [
        { label: '10% — Low retirement income', value: '10' },
        { label: '12% — Moderate retirement income', value: '12' },
        { label: '22% — Higher retirement income', value: '22' },
        { label: '24% — High retirement income', value: '24' },
        { label: '32% — Very high retirement income', value: '32' },
      ],
      helpText: 'Used to show the tax savings vs. a traditional IRA withdrawal. Roth withdrawals are 100% tax-free.',
    },
  ],

  calculate: (values) => {
    const inp = parseRothInputs(values);
    const { currentAge, retirementAge, currentBalance, annualContribution, annualReturn, retirementRate: retirementTaxRate } = inp;

    if (isNaN(currentAge) || isNaN(retirementAge) || isNaN(annualReturn) || retirementAge <= currentAge) return [];

    const isCatchup = currentAge >= 50;
    const p = rothProjection(inp);
    const { years, maxContrib, contribution, overLimit, balance: taxFreeTotal, contributed, earnings: totalEarnings } = p;
    const taxSavingsVsTraditional = p.taxOnGrowthAvoided;
    const totalContributions = contributed - currentBalance;


    const hasCompare = Number.isFinite(p.traditionalAfterTax);
    const advantage = taxFreeTotal - p.traditionalAfterTax;
    const compareText = hasCompare
      ? advantage > 0.5
        ? ` Against a Traditional IRA funded with the same after-tax dollars (deducted at ${(inp.marginalRate * 100).toFixed(0)}% now, taxed at ${(retirementTaxRate * 100).toFixed(0)}% later) the Roth comes out ${fmt(advantage)} ahead.`
        : advantage < -0.5
          ? ` Against a Traditional IRA funded with the same after-tax dollars (deducted at ${(inp.marginalRate * 100).toFixed(0)}% now, taxed at ${(retirementTaxRate * 100).toFixed(0)}% later) the Traditional comes out ${fmt(-advantage)} ahead, because your retirement rate is lower than today's.`
          : ` At equal current and retirement rates, Roth and Traditional end up with the same after-tax money.`
      : '';

    const results: CalculatorResult[] = [
      {
        id: 'taxFreeTotal',
        label: `Tax-Free Balance at Age ${retirementAge}`,
        value: fmt(taxFreeTotal),
        highlight: true,
        color: 'positive' as const,
        interpretation: `Every dollar of this — including ${fmt(totalEarnings)} in growth — comes out with zero tax owed, since you already paid tax on contributions going in. Growth of that size would owe an estimated ${fmt(taxSavingsVsTraditional)} at your assumed ${(retirementTaxRate * 100).toFixed(0)}% rate in a taxable account.${compareText} Roth wins when your retirement tax rate is higher than your rate today.`,
      },
    ];

    if (overLimit) {
      results.push({
        id: 'limitWarning',
        label: `${TAX_YEAR} IRS Contribution Limit Warning`,
        value: `Your ${$(annualContribution)} exceeds the ${isCatchup ? 'age 50+ ' : ''}limit of ${$(maxContrib)}. Calculation uses ${$(maxContrib)}.`,
        color: 'negative' as const,
      });
    }

    results.push({
      id: 'totalContributions',
      label: 'Your Total Contributions',
      value: fmt(contributed),
      color: 'neutral' as const,
    });
    results.push({
      id: 'totalEarnings',
      label: 'Tax-Free Investment Growth',
      value: fmt(totalEarnings),
      color: 'positive' as const,
    });
    results.push({
      id: 'growthRatio',
      label: 'Earnings as % of Final Balance',
      value: `${((totalEarnings / taxFreeTotal) * 100).toFixed(1)}% — The power of compounding`,
      color: 'positive' as const,
    });
    results.push({
      id: 'taxSavingsVsTraditional',
      label: `Tax on Growth Avoided (${(retirementTaxRate * 100).toFixed(0)}% rate)`,
      value: fmt(taxSavingsVsTraditional),
      color: 'positive' as const,
    });
    if (hasCompare) {
      results.push({
        id: 'rothVsTraditional',
        label: advantage >= 0 ? 'Roth Advantage vs. Equal-Cost Traditional IRA' : 'Traditional IRA Advantage vs. Roth',
        value: fmt(Math.abs(advantage)),
        color: advantage >= 0 ? 'positive' : 'negative',
      });
    }
    results.push({
      id: 'annualContribResult',
      label: `Annual Contribution (${TAX_YEAR} IRS Max: ${$(maxContrib)})`,
      value: `${$(contribution)}/yr for ${years} years`,
      color: 'neutral' as const,
    });
    results.push({
      id: 'years',
      label: 'Investment Period',
      value: `${years} years`,
      color: 'neutral' as const,
    });

    return results;
  },

  explainSteps: (values) => {
    const inp = parseRothInputs(values);
    if (isNaN(inp.currentAge) || isNaN(inp.retirementAge) || isNaN(inp.annualReturn) || inp.retirementAge <= inp.currentAge) return [];
    const p = rothProjection(inp);
    const d2 = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const pct = (x: number) => `${+(x * 100).toFixed(4)}%`;
    const growth = Math.pow(1 + inp.annualReturn, p.years);
    const lump = inp.currentBalance * growth;
    const annuity = Math.abs(inp.annualReturn) < 1e-10 ? p.contribution * p.years : p.contribution * ((growth - 1) / inp.annualReturn);
    const steps: ExplainStep[] = [
      {
        label: 'Years of saving and the yearly contribution you can make',
        expr: `${inp.retirementAge} − ${inp.currentAge} = ${p.years} years · Limit at age ${inp.currentAge}: ${$(p.maxContrib)} (${TAX_YEAR}) · Contribution = min(${$(inp.annualContribution)}, ${$(p.maxContrib)}) = ${$(p.contribution)} a year`,
        note: 'The limit for your current age is applied to every year, which is conservative because limits rise over time.',
      },
      {
        label: 'Growth factor over the whole period',
        expr: `(1 + ${pct(inp.annualReturn)})^${p.years} = ${growth.toFixed(4)}`,
        note: 'Annual compounding, with each contribution made at the end of the year.',
      },
      {
        label: 'What your current balance grows to',
        expr: `${d2(inp.currentBalance)} × ${growth.toFixed(4)} = ${d2(lump)}`,
      },
      {
        label: 'What the yearly contributions grow to',
        expr: Math.abs(inp.annualReturn) < 1e-10
          ? `${d2(p.contribution)} × ${p.years} years = ${d2(annuity)}`
          : `${d2(p.contribution)} × (${growth.toFixed(4)} − 1) ÷ ${pct(inp.annualReturn)} = ${d2(annuity)}`,
      },
      {
        label: 'Tax-free balance at retirement',
        expr: `${d2(lump)} + ${d2(annuity)} = ${d2(p.balance)} (shown as ${fmt(p.balance)})`,
        note: 'Qualified Roth withdrawals are tax-free, so all of this is yours to spend.',
      },
      {
        label: 'How much is your money and how much is growth',
        expr: `Contributed = ${d2(inp.currentBalance)} + ${d2(p.contribution)} × ${p.years} = ${d2(p.contributed)} · Growth = ${d2(p.balance)} − ${d2(p.contributed)} = ${d2(p.earnings)}`,
      },
      {
        label: 'Tax on that growth you avoid',
        expr: `${d2(p.earnings)} × ${pct(inp.retirementRate)} expected retirement tax rate = ${fmt(p.taxOnGrowthAvoided)}`,
        note: 'This is what the same growth would owe if it came out of a taxable or Traditional account taxed at that rate.',
      },
    ];
    if (Number.isFinite(p.traditionalAfterTax)) {
      const adv = p.balance - p.traditionalAfterTax;
      steps.push({
        label: 'Against a Traditional IRA with the same after-tax cost',
        expr: `${d2(p.balance)} × (1 − ${pct(inp.retirementRate)}) ÷ (1 − ${pct(inp.marginalRate)}) = ${d2(p.traditionalAfterTax)} after tax · Roth minus Traditional = ${adv >= 0 ? '+' : '−'}${d2(Math.abs(adv))}`,
        note: 'The Traditional account gets a deduction now at your current marginal rate, so the same out-of-pocket cost buys a larger pre-tax contribution that is taxed on the way out.',
      });
    }
    return finiteSteps(steps);
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(RothIRAPanel, { values, results });
  },

  educational: {
    formula: `FV = CurrentBalance × (1+r)^n + Contribution × [(1+r)^n − 1] / r`,
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="28" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">Roth IRA: Tax-Free vs Taxable Growth</text><text x="220" y="46" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Same contributions, vastly different outcomes</text><g transform="translate(30,70)"><!-- Roth bar --><rect x="60" y="40" width="130" height="190" rx="5" fill="var(--svg-3b82f6)"/><rect x="60" y="160" width="130" height="70" rx="2" fill="var(--svg-1d4ed8)" opacity="0.6"/><text x="125" y="34" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-1e293b)">Roth IRA</text><text x="125" y="155" text-anchor="end" font-size="10" fill="var(--svg-ffffff)">Growth (tax-free)</text><text x="125" y="196" text-anchor="end" font-size="10" fill="var(--svg-93c5fd)">Contributions</text><text x="125" y="248" text-anchor="middle" font-size="18" font-weight="bold" fill="var(--svg-22c55e)">$0 Tax</text><!-- Taxable bar --><rect x="230" y="80" width="130" height="150" rx="5" fill="var(--svg-ef4444)"/><rect x="230" y="160" width="130" height="70" rx="2" fill="var(--svg-dc2626)" opacity="0.6"/><text x="295" y="34" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-1e293b)">Taxable</text><text x="295" y="75" text-anchor="middle" font-size="10" fill="var(--svg-fca5a5)">Tax on growth</text><text x="295" y="155" text-anchor="end" font-size="10" fill="var(--svg-ffffff)">Growth (taxed)</text><text x="295" y="196" text-anchor="end" font-size="10" fill="var(--svg-fca5a5)">Contributions</text><text x="295" y="248" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-ef4444)">Pay taxes</text></g><!-- Bottom note --><text x="220" y="310" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Tax-free compounding is the Roth IRA\'s superpower — every dollar of growth is yours to keep</text></svg>',
      alt: 'Side-by-side bar chart comparing Roth IRA tax-free growth to taxable account growth showing the tax savings',
      caption: 'Roth IRA growth is entirely tax-free, while taxable accounts lose a portion to capital gains taxes',
    },
    formulaDescription: `Future Value formula with annual contributions, where r = annual return rate and n = years to retirement. The result is 100% tax-free at withdrawal — unlike traditional IRAs or taxable accounts. For ${TAX_YEAR}: contribution limit = $${ROTH_LIMIT_2026.toLocaleString()} (under 50), $${(ROTH_LIMIT_2026 + ROTH_CATCHUP_2026).toLocaleString()} (age 50+).`,
    variables: [
      { symbol: 'Contribution Limits', name: `${TAX_YEAR} Roth IRA Max Contributions`, description: `Under 50: $${ROTH_LIMIT_2026.toLocaleString()}/year. Age 50+: $${(ROTH_LIMIT_2026 + ROTH_CATCHUP_2026).toLocaleString()}/year (includes $${ROTH_CATCHUP_2026.toLocaleString()} catch-up). Limits apply to combined contributions across all IRA accounts (Roth + Traditional).` },
      { symbol: 'Tax-Free', name: 'The Core Advantage', description: 'Roth IRA contributions are made with after-tax dollars. All growth and withdrawals in retirement are completely tax-free (assuming age 59½+ and 5-year rule met). On a $1M Roth balance, a 22% withdrawal tax rate would cost $220,000 in a traditional IRA. With a Roth: $0.' },
      { symbol: 'Income Limit', name: 'Phase-Out Range', description: `For ${TAX_YEAR} (IRS Notice 2025-67): Single filers with MAGI of ${$(SINGLE.start)}–${$(SINGLE.end)} face a reduced contribution limit. At ${$(SINGLE.end)} or more, direct Roth IRA contributions are not allowed. Married filing jointly: ${$(MFJ.start)}–${$(MFJ.end)} phase-out. Alternative: the "Backdoor Roth IRA" strategy (contribute to traditional IRA, then convert).` },
    ],
    howToUse: [
      'Enter your current and target retirement age to set the investment window.',
      'Enter your current Roth IRA balance (0 if starting fresh) and planned annual contribution.',
      `The calculator automatically flags contributions exceeding ${TAX_YEAR} IRS limits ($${ROTH_LIMIT_2026.toLocaleString()} under 50, $${(ROTH_LIMIT_2026 + ROTH_CATCHUP_2026).toLocaleString()} age 50+).`,
      'Select your marginal tax rate to see the tax savings vs. a taxable account or traditional IRA.',
      'The pie chart shows the split between your contributions and tax-free growth.',
    ],
    commonUses: [
      'Project the tax-free growth of a Roth IRA over time to see how contributions and compound returns build a retirement nest egg.',
      'Compare Roth IRA versus traditional IRA or taxable account growth to determine which account type maximizes your after-tax retirement income.',
      'Plan your annual contribution strategy to maximize the Roth IRA limit and understand the long-term value of tax-free withdrawals in retirement.',
    ],
    explanation:
      `The Roth IRA is the most tax-efficient retirement account available to most Americans. You pay taxes now (on contributions) and never again — not on growth, not on withdrawals. The tax-free compounding advantage grows exponentially: on a $${ROTH_LIMIT_2026.toLocaleString()}/year contribution at 7% for 35 years, your contributions total roughly $${(ROTH_LIMIT_2026 * 35 / 1000).toFixed(0)}K while your tax-free balance reaches over $1M. Roughly 75% of that final balance represents earnings — all untaxed at withdrawal — which is the Roth IRA's irreplaceable value proposition.`,
    faqs: [
      {
        question: `What are the ${TAX_YEAR} Roth IRA contribution limits?`,
        answer: `For ${TAX_YEAR}: The base contribution limit is $${ROTH_LIMIT_2026.toLocaleString()} per year for individuals under age 50. Those 50 and older may contribute an additional $${ROTH_CATCHUP_2026.toLocaleString()} (the catch-up contribution), for a total of $${(ROTH_LIMIT_2026 + ROTH_CATCHUP_2026).toLocaleString()}/year. This limit applies to combined contributions across all IRA accounts (Roth + Traditional combined cannot exceed these limits).`,
      },
      {
        question: 'What are the income limits for Roth IRA contributions?',
        answer: `For ${TAX_YEAR}: Single filers with MAGI of ${$(SINGLE.end)} or more cannot contribute directly to a Roth IRA. The phase-out begins at ${$(SINGLE.start)}. For married filing jointly, the phase-out is ${$(MFJ.start)}–${$(MFJ.end)}. If you exceed these limits, consider the "Backdoor Roth IRA" strategy: contribute to a non-deductible traditional IRA, then convert it to Roth.`,
      },
      {
        question: 'Roth IRA vs. Traditional IRA: which is better?',
        answer: 'If you expect to be in a higher tax bracket in retirement than you are now — choose Roth (pay low taxes now, avoid high taxes later). If you expect to be in a lower bracket in retirement — Traditional may be better (deduct contributions now at high rate, pay lower rate later). If you are unsure, contributing to both (up to the combined limit) provides flexibility.',
      },
      {
        question: 'Can I withdraw Roth IRA contributions early?',
        answer: 'Yes — Roth IRA contributions (not earnings) can be withdrawn at any time, at any age, without tax or penalty. This makes the Roth IRA a flexible emergency backup as well as a retirement account. However, withdrawing earnings before age 59½ (or before the 5-year rule is met) typically triggers taxes and a 10% penalty.',
      },
      {
        question: 'What is a Backdoor Roth IRA?',
        answer: 'A Backdoor Roth IRA lets high earners who exceed the income limits contribute indirectly: make a non-deductible Traditional IRA contribution, then convert it to Roth. If you have no existing pre-tax Traditional IRA balance, the conversion is nearly tax-free. The SECURE Act 2.0 also introduced Roth SEP and Roth SIMPLE IRA options for self-employed individuals.',
      },
    ],
  citations: [
    { source: 'IRS Publication 590-A', url: 'https://www.irs.gov/publications/p590a' },
    { source: 'US Securities and Exchange Commission', url: 'https://www.investor.gov' },
  ],
  },
};

export default rothIRAConfig;
