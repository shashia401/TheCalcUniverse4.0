import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import PensionPanel from './PensionPanel';

interface ProjectionRow {
  year: number;
  age: number;
  startBalance: number;
  contribution: number;
  growth: number;
  endBalance: number;
}

function buildProjection(
  currentAge: number,
  retirementAge: number,
  currentBalance: number,
  monthlyContribution: number,
  annualGrowth: number,
): ProjectionRow[] {
  const rows: ProjectionRow[] = [];
  const years = retirementAge - currentAge;
  let balance = currentBalance;
  const yearlyContrib = monthlyContribution * 12;
  const rate = annualGrowth / 100;

  for (let y = 1; y <= years; y++) {
    const growth = balance * rate;
    balance = balance + growth + yearlyContrib;
    rows.push({
      year: y,
      age: currentAge + y,
      startBalance: y === 1 ? currentBalance : rows[y - 2].endBalance,
      contribution: yearlyContrib,
      growth,
      endBalance: balance,
    });
  }

  return rows;
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtD(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const inflationRate = 0.03; // assumed inflation for inflation-adjusted display

const pensionConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'currentAge',
      label: 'Current Age',
      type: 'number',
      placeholder: '35',
      min: 18,
      max: 80,
      required: true,
      helpText: 'Your current age — used to calculate years until retirement.',
    },
    {
      id: 'retirementAge',
      label: 'Retirement Age',
      type: 'number',
      placeholder: '65',
      min: 18,
      max: 85,
      required: true,
      helpText: 'Must be greater than your current age.',
    },
    {
      id: 'currentBalance',
      label: 'Current Pension Balance',
      type: 'number',
      placeholder: '100,000',
      prefix: '$',
      min: 0,
      required: true,
      helpText: 'Total amount already saved in your pension or retirement account.',
    },
    {
      id: 'monthlyContribution',
      label: 'Monthly Contribution',
      type: 'number',
      placeholder: '500',
      prefix: '$',
      min: 0,
      required: true,
      helpText: 'Fixed amount you contribute to your pension each month.',
    },
    {
      id: 'growthRate',
      label: 'Estimated Annual Growth Rate',
      type: 'number',
      placeholder: '6.0',
      unit: '%',
      min: 0,
      max: 12,
      step: 0.25,
      required: true,
      helpText: 'Expected annual return. Typical range: 4% (conservative) to 8% (moderate). Use 6% for a balanced portfolio.',
    },
    {
      id: 'inflationAdjust',
      label: 'Inflation Adjustment',
      type: 'select',
      required: true,
      options: [
        { label: 'Show nominal values (no inflation adjustment)', value: 'nominal' },
        { label: 'Adjust for inflation (3% assumed)', value: 'adjusted' },
      ],
      helpText: 'Toggle whether future balances are adjusted for 3% annual inflation.',
    },
  ],

  calculate: (values) => {
    const currentAge = parseFloat(values.currentAge);
    const retirementAge = parseFloat(values.retirementAge);
    const currentBalance = parseFloat(values.currentBalance);
    const monthlyContribution = parseFloat(values.monthlyContribution);
    const growthRate = parseFloat(values.growthRate) || 0;
    const inflationAdjust = values.inflationAdjust || 'nominal';

    if (
      isNaN(currentAge) || isNaN(retirementAge) || isNaN(currentBalance) || isNaN(monthlyContribution) ||
      currentAge < 18 || retirementAge <= currentAge || currentBalance < 0 || monthlyContribution < 0
    ) return [];

    const projection = buildProjection(currentAge, retirementAge, currentBalance, monthlyContribution, growthRate);
    if (projection.length === 0) return [];

    const finalBalance = projection[projection.length - 1].endBalance;
    const totalContributions = currentBalance + monthlyContribution * 12 * projection.length;
    const totalGrowth = finalBalance - totalContributions;
    const inflationAdjusted = finalBalance / Math.pow(1 + inflationRate, projection.length);
    const monthlyPayout4pct = finalBalance * 0.04 / 12;
    const monthlyPayoutAdj4pct = inflationAdjusted * 0.04 / 12;

    const results = [
      {
        id: 'hero',
        label: `Age ${currentAge} → ${retirementAge} | Balance: $${fmt(finalBalance)}`,
        value: `$${fmt(finalBalance)}`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'projectedBalance',
        label: `Projected Pension Balance at Age ${retirementAge}`,
        value: `$${fmt(finalBalance)}`,
        color: 'positive' as const,
      },
      {
        id: 'totalContributions',
        label: 'Total Contributions (including starting balance)',
        value: `$${fmt(totalContributions)}`,
        color: 'neutral' as const,
      },
      {
        id: 'totalGrowth',
        label: 'Total Investment Growth',
        value: `$${fmt(totalGrowth)}`,
        color: totalGrowth > 0 ? 'positive' as const : 'neutral' as const,
      },
      {
        id: 'growthPct',
        label: 'Growth as % of Final Balance',
        value: `${((totalGrowth / finalBalance) * 100).toFixed(1)}%`,
        color: 'positive' as const,
      },
      {
        id: 'monthlyPayout4pct',
        label: 'Estimated Monthly Payout (4% Rule)',
        value: `$${fmtD(monthlyPayout4pct)}/mo`,
        color: 'positive' as const,
      },
    ];

    if (inflationAdjust === 'adjusted') {
      results.push({
        id: 'inflationAdjusted',
        label: `Inflation-Adjusted Balance at Age ${retirementAge} (${(inflationRate * 100).toFixed(0)}% assumed)`,
        value: `$${fmt(inflationAdjusted)}`,
        color: 'neutral' as const,
      });
      results.push({
        id: 'monthlyPayoutAdj',
        label: 'Inflation-Adjusted Monthly Payout (4% Rule)',
        value: `$${fmtD(monthlyPayoutAdj4pct)}/mo`,
        color: 'neutral' as const,
      });
    }

    results.push({
      id: 'growthRateUsed',
      label: 'Annual Growth Rate Used',
      value: `${growthRate.toFixed(2)}%`,
      color: 'neutral' as const,
    });

    results.push({
      id: 'projectionSpan',
      label: 'Projection Period',
      value: `${projection.length} years (Age ${currentAge} → ${retirementAge})`,
      color: 'neutral' as const,
    });

    return results;
  },

  extraPanel: (values, _results) => {
    const currentAge = parseFloat(values.currentAge);
    const retirementAge = parseFloat(values.retirementAge);
    const currentBalance = parseFloat(values.currentBalance);
    const monthlyContribution = parseFloat(values.monthlyContribution);
    const growthRate = parseFloat(values.growthRate) || 0;

    if (
      isNaN(currentAge) || isNaN(retirementAge) || isNaN(currentBalance) || isNaN(monthlyContribution) ||
      currentAge < 18 || retirementAge <= currentAge || currentBalance < 0 || monthlyContribution < 0
    ) return null;

    const projection = buildProjection(currentAge, retirementAge, currentBalance, monthlyContribution, growthRate);
    if (projection.length === 0) return null;

    return createElement(PensionPanel, {
      projection,
      growthRate,
      monthlyContribution,
      inflationAdjust: values.inflationAdjust || 'nominal',
      finalBalance: projection[projection.length - 1].endBalance,
    });
  },

  educational: {
    formula: 'Balanceₙ = Balanceₙ₋₁ × (1 + r) + (Monthly Contribution × 12)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">Pension Growth: Time Is Everything</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Compounding turns consistent savings into a retirement nest egg</text><g transform="translate(30,65)"><!-- Growth curve: contributions vs growth --><path d="M 50,180 Q 100,175 150,165 Q 200,145 250,110 Q 280,80 310,50" fill="none" stroke="var(--svg-22c55e)" stroke-width="3" stroke-linecap="round"/><path d="M 50,180 Q 100,178 150,175 Q 200,170 250,162 Q 280,155 310,145" fill="none" stroke="var(--svg-3b82f6)" stroke-width="3" stroke-linecap="round" stroke-dasharray="6,3"/><!-- Labels --><text x="320" y="45" font-size="10" fill="var(--svg-22c55e)" font-weight="bold">Compounding Growth</text><text x="320" y="60" font-size="8" fill="var(--svg-94a3b8)">Your returns earn returns</text><text x="320" y="142" font-size="10" fill="var(--svg-3b82f6)" font-weight="bold">Your Contributions</text><text x="320" y="157" font-size="8" fill="var(--svg-94a3b8)">Steady savings over time</text><!-- Year markers --><text x="50" y="195" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">Age 35</text><text x="150" y="195" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">Age 45</text><text x="250" y="195" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">Age 55</text><text x="310" y="195" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">Age 65</text><!-- Key numbers box --><rect x="40" y="100" width="120" height="55" rx="6" fill="var(--svg-f1f5f9)" opacity="0.9"/><text x="100" y="118" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">$900K</text><text x="100" y="134" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">at age 65</text><text x="100" y="150" text-anchor="middle" font-size="8" fill="var(--svg-22c55e)">$640K from growth</text></g><!-- Growth breakdown bar --><g transform="translate(40,210)"><rect x="10" y="0" width="370" height="60" rx="10" fill="var(--svg-f1f5f9)"/><text x="195" y="16" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">$900K Balance at Age 65: What Makes It Up?</text><rect x="25" y="26" width="120" height="24" rx="4" fill="var(--svg-3b82f6)"/><text x="85" y="42" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">Contributions: $260K</text><rect x="155" y="26" width="200" height="24" rx="4" fill="var(--svg-22c55e)"/><text x="255" y="42" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">Investment Growth: $640K (71% of total)</text><text x="195" y="58" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">Starting 5 years later cuts final balance by ~30% — time is the most powerful factor</text></g><!-- 4% Rule --><g transform="translate(40,283)"><rect x="10" y="0" width="370" height="45" rx="8" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1"/><text x="195" y="18" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e40af)">4% Rule: Monthly Payout = Balance × 0.04 ÷ 12</text><text x="195" y="36" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">$900K → ~$3,000/mo safe withdrawal (30-year retirement, adjusted for inflation)</text></g></svg>',
      alt: 'Pension growth diagram showing the compounding growth curve (green) vs steady contributions curve (blue) over 30 years from age 35 to 65, with $900K balance breakdown into $260K contributions and $640K growth',
      caption: 'Time is the single most powerful factor in retirement savings -- starting just 5 years later can reduce the final balance by roughly 30%',
    },
    formulaDescription:
      'This is a standard defined-contribution growth projection. Each year, your existing balance earns a return at the specified annual growth rate, and your annual contributions (monthly × 12) are added. Unlike a defined-benefit pension (which promises a fixed payout based on salary and years of service), this models a retirement account whose value depends entirely on contributions and investment returns.',
    variables: [
      { symbol: 'r', name: 'Annual Growth Rate', description: 'Expected annual return on your pension investments. A balanced 60/40 portfolio historically returns 6–8% before fees. Use 4–5% for conservative estimates.' },
      { symbol: '4% Rule', name: 'Safe Withdrawal Rate', description: 'The Trinity Study guideline: withdrawing 4% of your portfolio annually (adjusted for inflation) has historically lasted 30+ years. Your estimated monthly payout uses this rule.' },
      { symbol: 'Inflation', name: 'Inflation Adjustment (3%)', description: 'If enabled, projected balances are discounted by 3% annually to show what the future value is worth in today\'s dollars.' },
    ],
    howToUse: [
      'Enter your current age and the age you plan to retire.',
      'Enter your current pension/retirement balance and how much you contribute monthly.',
      'Set your expected annual growth rate — use 6% as a moderate estimate for a balanced portfolio.',
      'Toggle inflation adjustment to see future values in today\'s purchasing power.',
      'Scroll down to view the year-by-year projection table and use the Download PDF Report button for a printable summary.',
    ],
    commonUses: [
      'Project your pension or retirement account balance at retirement age based on current savings, monthly contributions, and expected growth rate.',
      'See how increasing your monthly contributions or adjusting your asset allocation affects your final retirement nest egg.',
      'Compare inflation-adjusted projections against nominal projections to understand your true retirement purchasing power.',
    ],
    explanation:
      'The single most powerful factor in retirement savings is time, not rate of return. A 30-year-old with $50,000 growing at 7% with $500/month contributions will have ~$900,000 at 65 — with $260,000 of that being contributions and $640,000 being growth. Starting just 5 years later cuts the final balance by roughly 30%. This calculator models the exact compounding mechanics: your growth each year is proportional to your current balance, which is why the early years look flat and the later years explode upward. The 4% rule monthly payout is a planning estimate — your actual safe withdrawal rate depends on your asset allocation, retirement duration, and sequence of returns risk.',
    faqs: [
      {
        question: 'What growth rate should I use?',
        answer: 'It depends entirely on your asset allocation. A conservative portfolio (40% stocks / 60% bonds): 4–5%. A balanced portfolio (60% stocks / 40% bonds): 6–7%. An aggressive portfolio (80%+ stocks): 7–9%. Use the lower end of your range to be conservative — overestimating returns by just 2% can cut your actual retirement timeline short by a decade or more. Past performance does not guarantee future results.',
      },
      {
        question: 'How is the monthly payout calculated?',
        answer: 'The calculator uses the 4% Rule from the Trinity Study: multiply your projected balance by 0.04 and divide by 12. This provides a planning estimate of how much you can withdraw monthly without a high risk of depleting your portfolio over a 30-year retirement. For early retirees (retiring before 60), a 3.5% withdrawal rate is more conservative. For traditional retirees, 4% remains the standard planning benchmark.',
      },
      {
        question: 'What is the difference between this and the defined-benefit pension calculator?',
        answer: 'This is a defined-contribution projection — it models a retirement account (like a 401(k), 403(b), IRA, or cash-balance pension) where your balance grows through contributions and investment returns. The final balance depends entirely on how much you contribute and how your investments perform. A defined-benefit pension (the old formula-based pension) promises a fixed monthly payout calculated from your salary and years of service, regardless of investment returns. Both are common in retirement planning, but they work very differently.',
      },
      {
        question: 'How does the inflation adjustment work?',
        answer: 'When enabled, the calculator discounts future projected balances by an assumed 3% annual inflation rate. A projected $1,000,000 at age 65 is worth approximately $412,000 in today\'s purchasing power if you are 35 today (30 years of 3% inflation). This gives you a more realistic sense of what your future balance will actually buy. The assumed 3% rate is close to the long-term historical average US inflation rate.',
      },
    ],
    citations: [
      { source: 'US Securities and Exchange Commission', url: 'https://www.investor.gov' },
      { source: 'Investopedia', url: 'https://www.investopedia.com/terms/p/pensionplan.asp' },
    ],
  },
};

export default pensionConfig;
