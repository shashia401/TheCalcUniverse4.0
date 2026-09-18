import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import { fvLumpSum, fvWithContributions } from '../../../utils/financial';
import FutureValuePanel from './FutureValuePanel';

const futureValueConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'presentValue',
      label: 'Present Value (Principal)',
      type: 'number',
      placeholder: '10,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: 'The starting amount you are investing today.',
    },
    {
      id: 'annualRate',
      label: 'Annual Interest Rate',
      type: 'number',
      placeholder: '7',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 50,
      step: 0.1,
      required: true,
      helpText: 'Expected annual rate of return (S&P 500 historical avg ~10% before inflation, ~7% after).',
    },
    {
      id: 'years',
      label: 'Number of Years',
      type: 'number',
      placeholder: '10',
      unit: 'years',
      inputMode: 'decimal',
      min: 1,
      max: 60,
      step: 1,
      required: true,
      helpText: 'How long the money will grow.',
    },
    {
      id: 'compounding',
      label: 'Compounding Frequency',
      type: 'select',
      required: true,
      helpText: 'How often interest is compounded. More frequent compounding = slightly higher returns.',
      options: [
        { label: 'Annually (1/yr)', value: '1' },
        { label: 'Semi-Annually (2/yr)', value: '2' },
        { label: 'Quarterly (4/yr)', value: '4' },
        { label: 'Monthly (12/yr)', value: '12' },
        { label: 'Daily (365/yr)', value: '365' },
      ],
    },
    {
      id: 'monthlyContribution',
      label: 'Monthly Contribution (Optional)',
      type: 'number',
      placeholder: '500',
      prefix: '$',
      inputMode: 'decimal',
      min: 0,
      step: 10,
      required: false,
      helpText: 'Additional amount contributed each month. Contributions compound alongside the principal.',
    },
  ],
  calculate: (values) => {
    const presentValue = parseFloat(values.presentValue);
    const annualRate = parseFloat(values.annualRate) / 100;
    const years = parseFloat(values.years);
    const compoundingPerYear = parseInt(values.compounding || '12');
    const monthlyContribution = parseFloat(values.monthlyContribution) || 0;

    if (isNaN(presentValue) || isNaN(annualRate) || isNaN(years) || presentValue <= 0 || years <= 0) return [];

    const ratePerPeriod = annualRate / compoundingPerYear;
    const totalPeriods = years * compoundingPerYear;

    // Future value with compounding frequency
    const fvLump = fvLumpSum(presentValue, ratePerPeriod, totalPeriods);

    // Future value with contributions (contributions compound at same frequency)
    let fvWithContrib = fvLump;
    if (monthlyContribution > 0) {
      // Monthly contributions need to be converted to the compounding period
      const contribPerPeriod = monthlyContribution * (12 / compoundingPerYear);
      fvWithContrib = fvWithContributions(presentValue, contribPerPeriod, ratePerPeriod, totalPeriods);
    }

    const totalPrincipal = presentValue;
    const totalContributions = monthlyContribution * 12 * years;
    const totalInterest = fvWithContrib - totalPrincipal - totalContributions;
    const effectiveAnnualRate = Math.pow(1 + ratePerPeriod, compoundingPerYear) - 1;

    const fmtInt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    return [
      {
        id: 'futureValue',
        label: 'Future Value',
        value: `$${fmtInt(fvWithContrib)}`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'totalPrincipal',
        label: 'Total Principal',
        value: `$${fmtInt(totalPrincipal)}`,
        color: 'neutral',
      },
      {
        id: 'totalContributions',
        label: 'Total Contributions',
        value: monthlyContribution > 0 ? `$${fmtInt(totalContributions)}` : '$0',
        color: 'neutral',
      },
      {
        id: 'totalInterest',
        label: 'Total Interest Earned',
        value: `$${fmtInt(Math.max(0, totalInterest))}`,
        color: totalInterest > 0 ? 'positive' : 'neutral',
      },
      {
        id: 'effectiveAnnualRate',
        label: 'Effective Annual Rate (EAR)',
        value: `${(effectiveAnnualRate * 100).toFixed(3)}%`,
        color: 'neutral',
      },
      {
        id: 'yearsResult',
        label: 'Investment Period',
        value: `${years} years`,
        color: 'neutral',
      },
      {
        id: 'compoundingLabel',
        label: 'Compounding',
        value: compoundingPerYear === 1 ? 'Annual' : compoundingPerYear === 2 ? 'Semi-Annual' : compoundingPerYear === 4 ? 'Quarterly' : compoundingPerYear === 12 ? 'Monthly' : 'Daily',
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(FutureValuePanel, { values, results });
  },
  educational: {
    formula: 'FV = PV × (1 + r/m)^(n×m) + PMT × [((1 + r/m)^(n×m) − 1) / (r/m)]',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="#f8fafc" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="#1e293b">Time Value of Money</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="#64748b">A dollar today grows into more dollars tomorrow through compounding</text><g transform="translate(40,70)"><!-- Present value box --><rect x="10" y="0" width="140" height="80" rx="10" fill="#dbeafe" stroke="#3b82f6" stroke-width="2"/><text x="80" y="30" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">Present Value</text><text x="80" y="50" text-anchor="middle" font-size="24" font-weight="bold" fill="#2563eb">$PV</text><text x="80" y="68" text-anchor="middle" font-size="10" fill="#64748b">Today</text><!-- Arrow: growth over time --><line x1="155" y1="40" x2="275" y2="40" stroke="#22c55e" stroke-width="3" stroke-linecap="round"/><polygon points="275,34 288,40 275,46" fill="#22c55e"/><text x="215" y="28" text-anchor="middle" font-size="10" fill="#22c55e" font-weight="bold">× (1+r)^n</text><text x="215" y="55" text-anchor="middle" font-size="9" fill="#94a3b8">Time &amp; Compounding</text><!-- Future value box --><rect x="290" y="0" width="140" height="80" rx="10" fill="#dcfce7" stroke="#22c55e" stroke-width="2"/><text x="360" y="30" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">Future Value</text><text x="360" y="50" text-anchor="middle" font-size="24" font-weight="bold" fill="#16a34a">$FV</text><text x="360" y="68" text-anchor="middle" font-size="10" fill="#64748b">Later</text><!-- Monthly contributions pathway --><rect x="10" y="110" width="140" height="50" rx="8" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.5"/><text x="80" y="130" text-anchor="middle" font-size="11" font-weight="bold" fill="#b45309">+ Monthly PMT</text><text x="80" y="148" text-anchor="middle" font-size="10" fill="#64748b">Regular contributions</text><line x1="80" y1="160" x2="80" y2="175" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/><polygon points="74,175 80,185 86,175" fill="#f59e0b"/><line x1="80" y1="185" x2="360" y2="185" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5,3"/><polygon points="360,179 370,185 360,191" fill="#f59e0b"/><!-- Result boxes at bottom --><rect x="40" y="210" width="170" height="55" rx="8" fill="#f0fdf4" stroke="#22c55e" stroke-width="1.5"/><text x="125" y="232" text-anchor="middle" font-size="11" font-weight="bold" fill="#16a34a">Total Contributions</text><text x="125" y="252" text-anchor="middle" font-size="10" fill="#64748b">PV + (PMT × n × m)</text><rect x="230" y="210" width="170" height="55" rx="8" fill="#fef2f2" stroke="#ef4444" stroke-width="1.5"/><text x="315" y="232" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626">Compounding Returns</text><text x="315" y="252" text-anchor="middle" font-size="10" fill="#64748b">FV − Total Contributions</text></g><g transform="translate(40,300)"><text x="180" y="10" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e293b">FV = PV × (1+r/m)^(n×m) + PMT × [((1+r/m)^(n×m)−1) / (r/m)]</text></g></svg>',
      alt: 'Diagram showing present value box connected by an arrow labeled (1+r)^n to a future value box, with monthly contributions feeding in and results splitting into contributions versus returns',
      caption: 'Future value combines the growth of your initial principal with the compounding effect of regular contributions over time',
    },
    formulaDescription:
      'The future value formula calculates how much a present investment will grow to at a given interest rate over time, including regular contributions. The compounding frequency (m) has a significant effect — more frequent compounding accelerates growth.',
    variables: [
      { symbol: 'FV', name: 'Future Value', description: 'The total value of the investment at the end of the term, including all growth and contributions.' },
      { symbol: 'PV', name: 'Present Value', description: 'The initial lump sum invested today.' },
      { symbol: 'r', name: 'Annual Rate', description: 'The annual interest rate expressed as a decimal (e.g., 7% = 0.07).' },
      { symbol: 'm', name: 'Compounding Periods/Year', description: 'How many times per year interest compounds — 1 (annual), 2 (semi-annual), 4 (quarterly), 12 (monthly), or 365 (daily).' },
      { symbol: 'n', name: 'Number of Years', description: 'The total time the money is invested.' },
      { symbol: 'EAR', name: 'Effective Annual Rate', description: 'The true annual rate accounting for compounding: (1 + r/m)^m − 1. Higher compounding frequencies produce a higher EAR.' },
    ],
    howToUse: [
      'Enter the present value — the lump sum you are investing today.',
      'Enter the annual interest rate you expect to earn.',
      'Select the compounding frequency (monthly is standard for savings accounts; annual is simpler for long-term projections).',
      'Optionally add a monthly contribution to see the effect of regular investing (dollar-cost averaging).',
      'Review the formula panel below the results to see exactly how the math works with your numbers plugged in.',
    ],
    commonUses: [
      'Project the future value of a lump sum investment to see how compound interest grows your money over a chosen time period.',
      'Model the effect of adding regular monthly contributions alongside your initial investment using dollar-cost averaging.',
      'Compare how different compounding frequencies and return rates affect the final value of your investment portfolio.',
    ],
    explanation:
      'The Future Value calculator shows how money grows over time with compound interest. Small changes in the rate, time period, or compounding frequency produce dramatically different outcomes. The formula panel below the results renders the mathematical formula with your actual numbers plugged in and walks through each step. This calculator is essential for understanding the time value of money — the core concept that a dollar today is worth more than a dollar tomorrow because it can be invested and earn returns. Monthly contributions (systematic investing) compound alongside the principal, demonstrating the power of dollar-cost averaging.',
    
    
    
    
    limitations: [
      'This calculator assumes a constant annual rate of return, which real markets never deliver. Actual returns fluctuate year to year — a -30% year early in your investment timeline (when your balance is small) hurts less than a -30% year right before retirement (when sequence-of-returns risk peaks).',
      'Returns and contributions are not adjusted for inflation. A 7% nominal return with 3% inflation means your real purchasing power growth is only 4%. Use after-inflation return estimates (e.g., 5-6%) for retirement planning projections calibrated to today\'s dollars.',
      'The calculator does not account for taxes on investment gains in taxable accounts. Dividends, interest, and realized capital gains are all taxable events that reduce effective compound growth. Tax-advantaged accounts (IRA, 401k) avoid this drag but have their own withdrawal rules.',
      'It does not model sequence-of-returns risk, required minimum distributions (RMDs), early withdrawal penalties, or the effect of investment fees. A 1% annual management fee on a 7% nominal return consumes nearly 30% of your long-term gains over 30 years, reducing the effective growth rate to about 6%.',
    ],
quickReference: [
      { label: 'FV (Lump Sum)', value: 'PV × (1 + r/m)^(n×m) — compound growth of a single deposit' },
      { label: 'FV (With Contributions)', value: 'Add PMT × [((1+r/m)^(n×m) − 1) / (r/m)] for regular deposits' },
      { label: 'Rule of 72', value: '72 ÷ Rate ≈ years to double (e.g., 7% → ~10.3 years per doubling)' },
      { label: 'S&P 500 Historical (1926-2024)', value: '~10% nominal annualized, ~7% after 3% inflation' },
      { label: 'Monthly Compounding EAR at 7%', value: '7.229% effective annual rate (vs 7% nominal)' },
      { label: 'Daily Compounding EAR at 7%', value: '7.250% effective annual rate' },
      { label: 'Starting Early vs Delay (10yr)', value: 'A 10-year delay can cut final balance by 50%+ due to lost compounding years' },
    ],
proTips: [
      'The biggest lever in the future value equation is time, not rate of return. Starting 10 years earlier at a 6% return beats starting later at a 10% return for the same contribution schedule. Use this calculator to model different starting ages to see the "cost of waiting."',
      'Monthly contributions compound alongside your principal — every dollar you contribute starts earning returns from the month it is invested. A $500/month habit at 7% for 30 years produces over $567,000, and only $180,000 of that came from your own deposits.',
      'Use a conservative return estimate (5-6% after inflation) for retirement planning. Optimism bias is the most common and most expensive financial planning mistake. Better to oversave and finish early than to undersave and run out of money.',
      'The difference between annual and monthly compounding shrinks over short periods but compounds over decades. At 7% over 30 years, $100,000 grows to $761,226 with annual compounding vs. $811,650 with monthly — a $50,424 difference from simply compounding more frequently. Most savings accounts and brokerages default to monthly or daily compounding.',
    ],
workedExamples: [
      {
        scenario: 'Sarah, a 32-year-old nurse in Nashville, TN, invests a $15,000 inheritance as a lump sum in a total stock market index fund. She expects a 7% annual return compounded monthly over 25 years. She does not plan to make regular contributions — she wants to see the pure power of compound growth on a single sum.',
        inputs: { presentValue: '15000', annualRate: '7', years: '25', compounding: '12', monthlyContribution: '0' },
        result: 'Future value: $85,881. Total interest earned: $70,881. Her $15,000 grew by 472.5% — nearly 6× the original investment. Effective Annual Rate (EAR): 7.229% (slightly higher than the 7.0% nominal rate due to monthly compounding).',
        insight: 'Sarah\'s $15,000 inheritance, left untouched for 25 years, grows to nearly $86,000 without her adding a single dollar. The 472.5% total return far exceeds simple multiplication (25 years × 7% = 175%) because of compounding — each year\'s interest earns its own interest in subsequent years. If Sarah had waited just 10 years (investing at 42 instead of 32 for a 15-year horizon), her $15,000 would grow to only ~$42,700. The 10-year delay costs her over $43,000 — more than her original investment — purely from lost compounding time.',
      },
      {
        scenario: 'Marcus in Atlanta, GA starts with $5,000 in his brokerage account and commits to investing $400 every month. He uses a 6% annual return estimate (after inflation) with monthly compounding over a 30-year horizon — his planned working career until age 62.',
        inputs: { presentValue: '5000', annualRate: '6', years: '30', compounding: '12', monthlyContribution: '400' },
        result: 'Future value: approximately $431,900. Total contributions: $149,000 ($5,000 initial + $144,000 in monthly deposits over 360 months). Total interest earned: approximately $282,900. Effective Annual Rate: 6.17%.',
        insight: 'Marcus contributes $149,000 of his own money over 30 years and ends up with over $431,900 — the additional $282,900 is pure compound growth. His $400/month habit (roughly $13/day) produces a nest egg almost 3× larger than the sum of his contributions. This scenario demonstrates the dual power of consistent monthly investing and compound interest working together. If Marcus waited just 5 years to start (25-year horizon instead of 30), his final balance would be approximately $299,500 — a penalty of over $132,400 for the delay. The message is clear: the first five years of compounding are the most valuable years of your investing life.',
      },
    ],
faqs: [
      {
        question: 'What is the difference between APR and EAR?',
        answer: 'APR (Annual Percentage Rate) is the nominal rate before compounding. EAR (Effective Annual Rate) accounts for compounding frequency. If you invest $10,000 at 7% APR compounded monthly, the EAR is 7.229% — meaning your actual annual growth is higher than the nominal rate.',
      },
      {
        question: 'How much does compounding frequency matter?',
        answer: 'For short periods (under 5 years) and moderate rates, the difference is small. Over 30 years at 7%, $10,000 grows to $76,123 with annual compounding vs. $81,678 with daily compounding — a $5,555 difference. Monthly compounding captures most of this benefit and is the standard for most calculators.',
      },
      {
        question: 'What is a realistic rate of return to use?',
        answer: 'For stock market investments, use 7–10% before inflation (S&P 500 historical average ~10%, ~7% after 3% inflation). For savings accounts or CDs, use 3–5% (2026 rates). For bonds, use 4–6%. Always use a conservative estimate for planning — optimism bias is the most common retirement planning mistake.',
      },
      {
        question: 'How do monthly contributions compound?',
        answer: 'Each monthly contribution starts earning interest from the month it is added. Over time, these contributions are a significant portion of the final balance. For example, $500/month at 7% for 30 years grows to $567,691 — and only $180,000 ($500 × 360 months) came from your contributions. The rest is compound growth on those contributions.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
  },
};

export default futureValueConfig;
