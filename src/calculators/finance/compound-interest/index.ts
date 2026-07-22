import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import CompoundInterestPanel from './CompoundInterestPanel';

const compoundInterestSvg = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto">
  <rect width="320" height="200" fill="var(--svg-f8fafc)" rx="6"/>
  <text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)" font-family="system-ui,sans-serif">Compound vs Simple Interest</text>
  <line x1="35" y1="165" x2="285" y2="165" stroke="var(--svg-cbd5e1)" stroke-width="1"/>
  <line x1="35" y1="165" x2="35" y2="30" stroke="var(--svg-cbd5e1)" stroke-width="1"/>
  <path d="M 35,165 Q 80,160 130,150 Q 180,130 230,85 Q 260,58 285,35" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 35,165 Q 80,160 130,150 Q 180,130 230,85 Q 260,58 285,35 L 285,165 Z" fill="var(--svg-3b82f6)" opacity="0.08"/>
  <line x1="35" y1="165" x2="285" y2="130" stroke="var(--svg-ef4444)" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="245" y="55" font-size="9" fill="var(--svg-3b82f6)" font-weight="bold" font-family="system-ui,sans-serif">Compound</text>
  <text x="255" y="126" font-size="9" fill="var(--svg-ef4444)" font-family="system-ui,sans-serif">Simple</text>
  <text x="160" y="185" text-anchor="middle" font-size="8" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">Time (years) →</text>
  <text x="160" y="196" text-anchor="middle" font-size="8" fill="var(--svg-ef4444)" font-family="system-ui,sans-serif">Compound earns "interest on interest" — exponential</text>
</svg>`;

const compoundInterestConfig: CalculatorConfig = {
  shapeTabs: [
    { label: 'Standard', value: 'standard', slug: 'standard' },
    { label: 'With Contributions', value: 'with-contributions', slug: 'with-contributions' },
  ],
  inputs: [
    {
      id: 'principal',
      slider: { min: 0, max: 100000, step: 1000 },
      label: 'Principal amount',
      type: 'number',
      defaultValue: '10000',
      placeholder: '10,000',
      prefix: '$',
      min: 0,
      step: 0.01,
      required: true,
      helpText: 'Starting balance',
    },
    {
      id: 'monthlyContribution',
      slider: { min: 0, max: 5000, step: 50 },
      label: 'Monthly contribution',
      type: 'number',
      placeholder: '500',
      prefix: '$',
      min: 0,
      step: 50,
      helpText: 'Amount added to the investment every month',
      showWhen: (v) => v.shape === 'with-contributions',
    },
    {
      id: 'rate',
      slider: { min: 0, max: 15, step: 0.1 },
      label: 'Annual interest rate',
      type: 'number',
      defaultValue: '7',
      placeholder: '7',
      unit: '%',
      min: 0,
      max: 100,
      step: 0.1,
      required: true,
      helpText: 'e.g. 7 for 7%',
    },
    {
      id: 'years',
      slider: { min: 1, max: 40, step: 1 },
      label: 'Time period',
      type: 'number',
      defaultValue: '20',
      placeholder: '10',
      unit: 'yrs',
      min: 1,
      max: 100,
      step: 1,
      required: true,
      helpText: 'How many years the money will be invested',
    },
    {
      id: 'compoundFrequency',
      label: 'Compounds',
      type: 'select',
      required: true,
      defaultValue: '12',
      helpText: 'How often interest compounds',
      options: [
        { label: 'Annually', value: '1' },
        { label: 'Quarterly', value: '4' },
        { label: 'Monthly', value: '12' },
        { label: 'Daily', value: '365' },
      ],
    },
  ],
  explainSteps: (values) => {
    const P = parseFloat(values.principal) || 0;
    const monthly = parseFloat(values.monthlyContribution) || 0;
    const r = parseFloat(values.rate) / 100;
    const t = parseFloat(values.years);
    const n = parseFloat(values.compoundFrequency || '12');

    if (isNaN(r) || isNaN(t) || t <= 0) return [];

    const fmt = (val: number) =>
      val >= 1_000_000
        ? `$${(val / 1_000_000).toFixed(2)}M`
        : `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const nt = n * t;
    const perPeriod = r / n;
    const futureP = P * Math.pow(1 + perPeriod, nt);
    const mr = r / 12;
    const months = t * 12;
    const futurePMT = mr === 0 ? monthly * months : monthly * ((Math.pow(1 + mr, months) - 1) / mr);
    const fv = futureP + futurePMT;
    const totalContributed = P + monthly * 12 * t;
    const interest = fv - totalContributed;

    const freqLabel: Record<string, string> = { '1': 'yearly', '4': 'quarterly', '12': 'monthly', '365': 'daily' };
    const label = freqLabel[values.compoundFrequency || '12'] || `${n} times per year`;

    const steps: { label: string; expr: string; note?: string }[] = [
      {
        label: 'Set the periodic rate and number of periods',
        expr: `${(r * 100).toFixed(2)}% ÷ ${n} = ${(perPeriod * 100).toFixed(4)}% per period · ${n} × ${t} = ${nt} periods`,
        note: `Interest compounds ${label}.`,
      },
      {
        label: 'Grow the starting principal',
        expr: `${fmt(P)} × (1 + ${perPeriod.toFixed(6)})^${nt} = ${fmt(futureP)}`,
        note: 'Each period earns interest on the previous total — interest on interest.',
      },
    ];

    if (monthly > 0) {
      steps.push({
        label: 'Add the future value of monthly contributions',
        expr: mr === 0
          ? `${fmt(monthly)}/mo × ${months} months = ${fmt(futurePMT)}`
          : `${fmt(monthly)}/mo × [((1 + ${mr.toFixed(6)})^${months} − 1) ÷ ${mr.toFixed(6)}] = ${fmt(futurePMT)}`,
      });
      steps.push({
        label: 'Total future value',
        expr: `${fmt(futureP)} + ${fmt(futurePMT)} = ${fmt(fv)}`,
        note: `Of this, ${fmt(totalContributed)} is money you put in and ${fmt(interest)} is growth.`,
      });
    } else {
      steps.push({
        label: 'Interest earned',
        expr: `${fmt(fv)} − ${fmt(P)} contributed = ${fmt(interest)}`,
        note: 'The future value minus what you started with.',
      });
    }

    return steps;
  },
  calculate: (values) => {
    const P = parseFloat(values.principal) || 0;
    const monthly = parseFloat(values.monthlyContribution) || 0;
    const r = parseFloat(values.rate) / 100;
    const t = parseFloat(values.years);
    const n = parseFloat(values.compoundFrequency || '12');

    if (isNaN(r) || isNaN(t) || t <= 0) return [];

    const calcFV = (rate: number) => {
      const mr = rate / 12;
      const months = t * 12;
      const futureP = P * Math.pow(1 + rate / n, n * t);
      const futurePMT = mr === 0
        ? monthly * months
        : monthly * ((Math.pow(1 + mr, months) - 1) / mr);
      return futureP + futurePMT;
    };

    const fv = calcFV(r);

    const totalContributed = P + monthly * 12 * t;
    const interest = fv - totalContributed;
    const totalGrowthPct = totalContributed > 0 ? ((fv - totalContributed) / totalContributed) * 100 : 0;

    // NOTE: `$` prefix is intentional — CurrencyContext (in CalculatorLayout) does a
    // string replacement of `$` → user's chosen currency symbol (e.g., EUR, GBP, INR).
    // Do NOT remove the `$` or use a neutral prefix — it is the replacement anchor.
    const fmt = (val: number) =>
      val >= 1_000_000
        ? `$${(val / 1_000_000).toFixed(2)}M`
        : `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const results: CalculatorResult[] = [
      {
        id: 'futureValue',
        label: `Total Future Value (${(r * 100).toFixed(2)}% return)`,
        value: fmt(fv),
        highlight: true,
        color: 'positive' as const,
        interpretation: totalContributed > 0
          ? `Your money grows ${(fv / totalContributed).toFixed(1)}× over ${t} year${t === 1 ? '' : 's'}: of the ${fmt(fv)} total, ${fmt(totalContributed)} is what you put in and ${fmt(interest)} (${totalGrowthPct.toFixed(0)}%) comes from compounding. ${interest > totalContributed ? 'Compounding earns more than you contribute — time in the market is doing most of the work.' : `At ${(r * 100).toFixed(1)}% it takes roughly ${Math.ceil(72 / (r * 100))} years for money to double (Rule of 72).`}`
          : undefined,
      },
      {
        id: 'totalPrincipal',
        label: 'Total Principal Contributed (You)',
        value: fmt(totalContributed),
        color: 'neutral' as const,
      },
      {
        id: 'totalInterest',
        label: 'Total Interest Accrued (Market)',
        value: fmt(interest),
        color: 'positive' as const,
      },
      {
        id: 'totalGrowth',
        label: 'Total Growth on Contributions',
        value: `+${totalGrowthPct.toFixed(2)}%`,
        color: 'positive' as const,
      },
    ];

    return results;
  },
  extraPanel: (values, results) => {
    const P = parseFloat(values.principal) || 0;
    const monthly = parseFloat(values.monthlyContribution) || 0;
    const r = parseFloat(values.rate) / 100;
    const variance = parseFloat(values.rateVariance) / 100 || 0;
    const t = parseFloat(values.years);
    const n = parseFloat(values.compoundFrequency || '12');

    if (!results.length || isNaN(r) || isNaN(t) || t <= 0) return null;

    return createElement(CompoundInterestPanel, { principal: P, monthlyContribution: monthly, rate: r, variance, years: t, compoundFrequency: n });
  },
  educational: {
    formula: 'FV = P×(1 + r/n)^(n×t) + PMT×[(1 + r/12)^(12t) − 1]/(r/12)',
    formulaDescription:
      'The first term compounds the initial lump sum at the chosen frequency. The second term calculates the future value of regular monthly contributions compounded monthly. Together they show the full power of compounding over time, capturing both the growth of a starting nest egg and the impact of consistent saving habits.',
    diagram: {
      svg: compoundInterestSvg,
      alt: 'Line chart showing compound interest growing exponentially (curved blue line) vs simple interest growing linearly (straight red dashed line)',
      caption: 'Compound interest earns "interest on interest" — the gap between compound and simple widens dramatically over time',
    },
    variables: [
      { symbol: 'FV', name: 'Future Value', description: 'The total value of the investment after the specified period, including all compounded interest. This is the number that represents your entire portfolio balance at the end of the investment horizon.' },
      { symbol: 'P', name: 'Principal', description: 'The initial amount of money invested before any contributions or interest. Even a small starting balance can grow substantially given enough time and a reasonable rate of return.' },
      { symbol: 'PMT', name: 'Monthly Contribution', description: 'The regular monthly amount added to the investment. Consistency with contributions often matters more than the dollar amount itself, as it builds the habit of regular saving.' },
      { symbol: 'r', name: 'Annual Interest Rate', description: 'The annual interest rate expressed as a decimal (e.g., 7% = 0.07). This represents the expected annualized return on your investments before inflation.' },
      { symbol: 'n', name: 'Compounding Frequency', description: 'How many times per year interest is compounded. Common choices include monthly (12), quarterly (4), semi-annually (2), and annually (1). The more frequent the compounding, the faster your money grows.' },
      { symbol: 't', name: 'Time', description: 'The total number of years the money is invested. Time is the single most powerful variable in compound interest — the longer your money grows, the more dramatic the exponential effect becomes.' },
    ],
    howToUse: [
      'Enter your initial investment amount — this is your starting principal.',
      'Add a monthly contribution to model regular investing (e.g., $500/month into a 401k or IRA).',
      'Enter your expected annual return — historical S&P 500 average is ~7% inflation-adjusted.',
      'Select the compounding frequency — more frequent compounding slightly increases returns over long periods.',
      'The stacked chart below shows how your principal (linear growth) and interest (exponential growth) accumulate over time, making the power of compounding visually clear.',
    ],
    commonUses: [
      'Project how your retirement savings will grow over time with regular monthly contributions and compounded investment returns.',
      'Compare the long-term impact of different compounding frequencies and annual return rates on your investment portfolio.',
      'Visualize how compound interest accelerates growth over time and the impact of different rates and time horizons.',
    ],
    explanation:
      'Compound interest is often called the eighth wonder of the world, and for good reason. Unlike simple interest, which only earns returns on the original principal, compound interest earns on both the principal and the accumulated interest — meaning your money grows exponentially rather than linearly. This exponential growth is what enables a 25-year-old investing $500/month to retire as a millionaire even though they contributed less than half that amount out of pocket. The stacked area chart in this calculator is the key insight: in the early years, most of your balance comes from your own contributions. But over time, the interest portion grows to dwarf what you actually put in. For a 30-year investment at 7%, your contributions might account for only 30% of the final balance while the market\'s compounding contributes the remaining 70%. This is why starting early is so critical — the first ten years of compounding set the foundation for the explosive growth that follows.',
    faqs: [
      {
        question: 'What is the difference between compound and simple interest?',
        answer: 'Simple interest is calculated only on the original principal amount, so it grows linearly over time. Compound interest is calculated on the principal plus all previously accumulated interest, creating exponential growth. Over a 20-year period, a $10,000 investment at 7% simple interest grows to $24,000, while the same investment with annual compounding grows to approximately $38,700 — a difference of nearly $15,000.',
      },
      {
        question: 'Does more frequent compounding always earn more money?',
        answer: 'Yes, but the difference diminishes as frequency increases. The jump from annual to monthly compounding is significant; the jump from daily to continuous compounding is negligible. For most savings accounts and investment products, monthly compounding is the standard, and the difference between monthly and daily compounding is typically less than 0.1% annually. Focus more on the rate of return and time horizon than on compounding frequency.',
      },
      {
        question: 'What is the Rule of 72?',
        answer: 'Divide 72 by the annual interest rate to estimate how many years it takes to double your money. At 7%, your money doubles in approximately 10.3 years (72 ÷ 7 ≈ 10.3). At 10%, it doubles in just 7.2 years. This rule works best for rates between 6% and 10% and is a useful mental shortcut for comparing the long-term impact of different return rates.',
      },
      {
        question: 'How does a monthly contribution change the result?',
        answer: 'Regular contributions dramatically amplify growth beyond what compounding alone provides. $500/month for 30 years at 7% grows to about $606,000 — from only $180,000 contributed out of pocket. The other $426,000 comes entirely from compounding working on both the principal and the accumulated contributions. This is why consistent investing, even in small amounts, is the most reliable path to building long-term wealth.',
      },
      {
        question: 'What is a realistic rate of return to use for planning?',
        answer: 'The S&P 500 has historically returned approximately 10% nominal and 7% inflation-adjusted annually over long periods. For conservative planning, use 5-6%. For a balanced portfolio of stocks and bonds, 6-8% is reasonable. The variance feature lets you model a range, which is important because actual returns fluctuate significantly year to year.',
      },
    ],
  citations: [
    { source: 'US Securities and Exchange Commission', url: 'https://www.investor.gov' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/c/compoundinterest.asp' },
  ],
  },
};

export default compoundInterestConfig;
