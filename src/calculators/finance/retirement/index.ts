import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import RetirementPanel from './RetirementPanel';

const retirementConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'currentAge',
      slider: { min: 18, max: 70, step: 1 },
      label: 'Current Age',
      type: 'number',
      defaultValue: '30',
      placeholder: '30',
      unit: 'years',
      inputMode: 'decimal',
      min: 10,
      max: 100,
      step: 1,
      required: true,
    },
    {
      id: 'retirementAge',
      slider: { min: 40, max: 80, step: 1 },
      label: 'Target Retirement Age',
      type: 'number',
      defaultValue: '65',
      placeholder: '65',
      unit: 'years',
      inputMode: 'decimal',
      min: 20,
      max: 100,
      step: 1,
      required: true,
    },
    {
      id: 'currentSavings',
      slider: { min: 0, max: 1000000, step: 5000 },
      label: 'Current Retirement Savings',
      type: 'number',
      defaultValue: '50000',
      placeholder: '50,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Total across all retirement accounts (401k, IRA, etc.)',
    },
    {
      id: 'monthlyContribution',
      slider: { min: 0, max: 5000, step: 50 },
      label: 'Monthly Contribution',
      type: 'number',
      defaultValue: '500',
      placeholder: '500',
      prefix: '$',
      inputMode: 'decimal',
      min: 0,
      step: 50,
      required: true,
      helpText: 'How much you add to retirement savings each month',
    },
    {
      id: 'annualReturn',
      slider: { min: 0, max: 12, step: 0.1 },
      label: 'Expected Annual Return',
      type: 'number',
      defaultValue: '7',
      placeholder: '7',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 30,
      step: 0.1,
      required: true,
      helpText: 'Historical stock market average is ~7% inflation-adjusted',
    },
    {
      id: 'inflationRate',
      label: 'Expected Inflation Rate',
      type: 'number',
      placeholder: '3',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 20,
      step: 0.1,
      helpText: 'Used to show real (inflation-adjusted) purchasing power. US avg ~3%',
    },
    {
      id: 'desiredIncome',
      label: 'Desired Annual Retirement Income',
      type: 'number',
      placeholder: '60,000',
      prefix: '$',
      min: 0,
      step: 1000,
      helpText: 'How much you want to spend per year in retirement (in today\'s dollars)',
    },
  ],
  calculate: (values) => {
    const currentAge = parseFloat(values.currentAge);
    const retirementAge = parseFloat(values.retirementAge);
    const currentSavings = parseFloat(values.currentSavings) || 0;
    const monthlyContribution = parseFloat(values.monthlyContribution) || 0;
    const annualReturn = parseFloat(values.annualReturn) / 100;
    const inflationInput = parseFloat(values.inflationRate);
    const inflationRate = isNaN(inflationInput) ? 0.03 : inflationInput / 100;
    const desiredIncome = parseFloat(values.desiredIncome) || 0;

    if ([currentAge, retirementAge, annualReturn].some(isNaN)) return [];
    if (retirementAge <= currentAge) return [];

    const years = retirementAge - currentAge;
    const monthlyRate = annualReturn / 12;
    const months = years * 12;

    let futureValue: number;
    if (monthlyRate === 0) {
      futureValue = currentSavings + monthlyContribution * months;
    } else {
      futureValue =
        currentSavings * Math.pow(1 + monthlyRate, months) +
        monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    }

    const totalContributed = currentSavings + monthlyContribution * months;
    const totalGrowth = futureValue - totalContributed;
    const realReturn = annualReturn - inflationRate;
    if (realReturn < 0) {
      console.warn('Retirement: Real return is negative — purchasing power is eroding over time.');
    }
    const inflationAdjustedValue = futureValue / Math.pow(1 + inflationRate, years);

    const fmt = (n: number) =>
      n >= 1_000_000
        ? `$${(n / 1_000_000).toFixed(2)}M`
        : `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    const fmtFull = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const results: CalculatorResult[] = [
      {
        id: 'futureValue',
        label: `Estimated Total at Retirement (Age ${retirementAge})`,
        value: fmt(futureValue),
        highlight: true,
        color: 'positive' as const,
        interpretation: `Of the ${fmt(futureValue)}, ${fmt(totalContributed)} is what you contribute and ${fmt(totalGrowth)} is investment growth. This is in future dollars — at ${(inflationRate * 100).toFixed(1)}% inflation, plan against the today's-dollars figure below, not this headline.`,
      },
      {
        id: 'inflationAdjusted',
        label: `In Today's Dollars (Inflation-Adjusted at ${(inflationRate * 100).toFixed(1)}%)`,
        value: fmt(inflationAdjustedValue),
        color: 'neutral' as const,
      },
      {
        id: 'totalContributed',
        label: 'Total Amount Contributed (You)',
        value: `$${fmtFull(totalContributed)}`,
        color: 'neutral' as const,
      },
      {
        id: 'totalGrowth',
        label: 'Total Investment Growth (Market)',
        value: fmt(totalGrowth),
        color: 'positive' as const,
      },
      {
        id: 'growthMultiple',
        label: 'Your Money Multiplied',
        value: `${(futureValue / Math.max(totalContributed, 1)).toFixed(1)}×`,
        color: 'positive' as const,
      },
    ];

    if (desiredIncome > 0) {
      const futureDesiredIncome = desiredIncome * Math.pow(1 + inflationRate, years);
      const requiredNestEgg = futureDesiredIncome / 0.04;
      const isOnTrack = futureValue >= requiredNestEgg;
      const gap = Math.abs(futureValue - requiredNestEgg);

      results.push({
        id: 'goalStatus',
        label: isOnTrack
          ? `You are on track — ${desiredIncome.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} in today's dollars (4% rule)`
          : `Shortfall — ${desiredIncome.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} income in today's dollars (4% rule)`,
        value: isOnTrack ? `Surplus: ${fmt(gap)}` : `Gap: ${fmt(gap)}`,
        color: isOnTrack ? 'positive' as const : 'negative' as const,
      });

      const requiredMonthly = monthlyRate === 0
        ? (requiredNestEgg - currentSavings * 1) / months
        : (requiredNestEgg - currentSavings * Math.pow(1 + monthlyRate, months)) /
          ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

      if (!isOnTrack && requiredMonthly > 0) {
        results.push({
          id: 'requiredContribution',
          label: 'Monthly Contribution Needed to Hit Goal',
          value: `$${fmtFull(Math.ceil(requiredMonthly))}/month`,
          color: 'negative' as const,
        });
      }
    }

    return results;
  },
  extraPanel: (values, results) => {
    const currentAge = parseFloat(values.currentAge);
    const retirementAge = parseFloat(values.retirementAge);
    const currentSavings = parseFloat(values.currentSavings) || 0;
    const monthlyContribution = parseFloat(values.monthlyContribution) || 0;
    const annualReturn = parseFloat(values.annualReturn) / 100;
    const inflationRate = parseFloat(values.inflationRate) / 100 || 0.03;

    if (!results.length || isNaN(currentAge) || isNaN(retirementAge) || retirementAge <= currentAge) return null;

    return createElement(RetirementPanel, {
      currentAge,
      retirementAge,
      currentSavings,
      monthlyContribution,
      annualReturn,
      inflationRate,
    });
  },
  educational: {
    formula: 'FV = PV×(1+r)^n + PMT×[(1+r)^n − 1]/r',
    formulaDescription:
      'Future Value combines the compounded growth of your existing savings (the PV term) with the future value of your ongoing monthly contributions (the PMT term), with everything compounding monthly over the years until retirement.',
    diagram: {
      svg: '<svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<line x1="30" y1="190" x2="400" y2="190" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/>' +
        '<text x="400" y="208" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="end">Age</text>' +
        '<line x1="30" y1="190" x2="30" y2="20" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/>' +
        '<text x="30" y="16" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-64748b)" text-anchor="middle">Nest Egg</text>' +
        '<!-- Growth phase: age 25-65 (bars going up) -->' +
        '<rect x="40" y="170" width="20" height="20" rx="2" fill="var(--svg-3b82f6)"/><text x="50" y="165" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">25</text>' +
        '<rect x="70" y="155" width="20" height="35" rx="2" fill="var(--svg-3b82f6)"/>' +
        '<rect x="100" y="135" width="20" height="55" rx="2" fill="var(--svg-3b82f6)"/>' +
        '<rect x="130" y="110" width="20" height="80" rx="2" fill="var(--svg-3b82f6)"/>' +
        '<rect x="160" y="75" width="20" height="115" rx="2" fill="var(--svg-3b82f6)"/>' +
        '<rect x="190" y="30" width="20" height="160" rx="2" fill="var(--svg-3b82f6)"/><text x="200" y="25" font-family="system-ui,sans-serif" font-size="8" fill="var(--svg-64748b)" text-anchor="middle">65</text>' +
        '<!-- Retirement phase: spending down -->' +
        '<rect x="220" y="40" width="16" height="150" rx="2" fill="var(--svg-22c55e)"/>' +
        '<rect x="246" y="55" width="16" height="135" rx="2" fill="var(--svg-22c55e)"/>' +
        '<rect x="272" y="70" width="16" height="120" rx="2" fill="var(--svg-22c55e)"/>' +
        '<rect x="298" y="90" width="16" height="100" rx="2" fill="var(--svg-22c55e)"/>' +
        '<rect x="324" y="110" width="16" height="80" rx="2" fill="var(--svg-22c55e)"/>' +
        '<rect x="350" y="135" width="16" height="55" rx="2" fill="var(--svg-22c55e)"/>' +
        '<text x="210" y="220" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">Saving Phase</text>' +
        '<text x="285" y="220" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">Spending Phase</text>' +
        '</svg>',
      alt: 'Bar chart showing savings accumulation during working years and decumulation during retirement',
      caption: 'Retirement planning has two phases: accumulate during your career, then draw down in retirement',
    },
    variables: [
      { symbol: 'FV', name: 'Future Value', description: 'The total projected retirement savings balance at your target retirement age, including all contributions and compounded investment growth.' },
      { symbol: 'PV', name: 'Present Value', description: 'Your current total retirement savings today across all accounts — 401k, IRA, pension accounts, and any other dedicated retirement vehicles.' },
      { symbol: 'PMT', name: 'Monthly Contribution', description: 'The amount you add to your retirement savings each month, including your own contributions plus any employer matching funds.' },
      { symbol: 'r', name: 'Monthly Return', description: 'Your expected annual return divided by 12. The historical S&P 500 inflation-adjusted return of approximately 7% annual is a commonly used benchmark.' },
      { symbol: 'n', name: 'Months', description: 'The number of months until retirement, calculated as years until retirement multiplied by 12.' },
    ],
    howToUse: [
      'Enter your current age and your target retirement age to establish your investment time horizon.',
      'Enter your current total retirement savings across all accounts (401k, IRA, pension, etc.).',
      'Enter how much you contribute to retirement savings each month.',
      'Set your expected annual return. The historical inflation-adjusted stock market average is approximately 7%, but use a conservative estimate for safer planning.',
      'Optionally enter an inflation rate and desired annual retirement income to see whether you are on track or need to increase contributions.',
    ],
    commonUses: [
      'Calculate the total retirement savings needed to generate your desired annual income using the 4 percent rule withdrawal strategy.',
      'Project whether you are on track to retire by your target age given your current savings rate and expected investment returns.',
      'See how increasing monthly contributions or adjusting your retirement age significantly changes your projected nest egg balance.',
    ],
    explanation:
      'The 4% Rule is the cornerstone of retirement planning: to determine how large a nest egg you need, divide your desired annual retirement income by 4%. If you want $60,000 per year in retirement, you need approximately $1.5 million ($60,000 divided by 0.04). This rule, derived from the landmark Trinity Study, found that a balanced portfolio sustaining a 4% annual withdrawal rate (adjusted for inflation each year) historically lasted for 30 years or more without running out of money. Time is your most powerful asset when building retirement savings. Starting just 10 years earlier can more than double your final balance due to the exponential nature of compound growth. The earlier you start, the less you need to contribute each month to reach the same goal.',
    faqs: [
      {
        question: 'What is the 4% rule?',
        answer: 'The 4% rule states that you can withdraw 4% of your retirement portfolio balance in year one of retirement, then adjust that dollar amount for inflation each subsequent year. Historical market data shows this withdrawal rate has a 95%+ probability of lasting for a 30-year retirement. To calculate your target nest egg, simply divide your desired annual retirement income by 0.04.',
      },
      {
        question: 'What annual return should I use for projections?',
        answer: 'The US stock market as measured by the S&P 500 has averaged approximately 10% nominal returns and approximately 7% inflation-adjusted returns over long historical periods. A diversified portfolio with a 70/30 stock/bond allocation might reasonably use 6-7% for projections. A conservative all-bond portfolio might use 3-4%. When in doubt, use lower estimates for more conservative planning — overestimating returns can lead to a significant retirement shortfall.',
      },
      {
        question: 'Should I use nominal or real (inflation-adjusted) returns?',
        answer: 'Both are shown in this calculator for a reason. The nominal value shows the projected raw dollar amount at retirement age. The inflation-adjusted value is arguably more useful — it shows what those future dollars will actually be able to buy in today\'s purchasing power. A $1 million nest egg in 30 years will likely have the purchasing power of only about $400,000 today at 3% annual inflation.',
      },
      {
        question: 'What counts as retirement savings?',
        answer: 'Retirement savings includes all accounts that are specifically designated for retirement: 401(k), 403(b), Traditional IRA, Roth IRA, SEP IRA, SIMPLE IRA, and pension plan values. Do not include your emergency fund, regular taxable brokerage accounts, savings accounts, or home equity unless you have a specific plan to use those assets for retirement income.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
  
    workedExamples: [
      {
        scenario: 'Anna is 30 years old, has $50,000 in her 401(k) and IRA combined, contributes $500/month, and plans to retire at 65. She assumes a 7% annual return (historical S&P 500 inflation-adjusted average) and 3% inflation. Her desired retirement income is $60,000/year in today\'s dollars.',
        inputs: {
          'Current Age': '30',
          'Target Retirement Age': '65',
          'Current Retirement Savings': '$50,000',
          'Monthly Contribution': '$500',
          'Expected Annual Return': '7',
          'Expected Inflation Rate': '3',
          'Desired Annual Retirement Income': '60,000',
        },
        result: 'Estimated total at retirement (age 65): approximately $1,476,000. Inflation-adjusted (today\'s dollars): approximately $524,000. Total contributed: $260,000. Total growth: approximately $1,216,000. Money multiplied: 5.7×. With the 4% rule inflation-adjusted targets, the calculator shows a gap relative to the inflation-adjusted goal — Anna\'s $60K desired income inflates to about $169K/year in future dollars, requiring about $4.2M at retirement.',
        insight: 'Anna\'s contributions of $260,000 grow to about $1,476,000 — a 5.7× multiplier, with over $1.2 million coming from compound growth alone. The key insight from the 4% rule check is that inflation-adjusted targets are ambitious: $60,000 in today\'s dollars becomes roughly $169,000 in 35 years at 3% inflation, requiring a nest egg of about $4.2 million. While her projected $1.48 million portfolio would generate about $59,000/year using the simple 4% rule (close to her current $60K goal), the inflation-adjusted target requires a significantly larger nest egg. If she started just 5 years later at 35, her final balance would drop to roughly $990,000 — a nearly $490,000 difference that shows why starting early is the single most powerful retirement decision.',
      },
      {
        scenario: 'Robert is 45, has $120,000 saved, contributes $800/month, and wants to retire at 67. He uses a conservative 5% return assumption (closer to a 60/40 bond/stock portfolio) and 3% inflation. He wants $70,000/year in retirement.',
        inputs: {
          'Current Age': '45',
          'Target Retirement Age': '67',
          'Current Retirement Savings': '$120,000',
          'Monthly Contribution': '$800',
          'Expected Annual Return': '5',
          'Expected Inflation Rate': '3',
          'Desired Annual Retirement Income': '70,000',
        },
        result: 'Estimated total at retirement (age 67): approximately $743,000. Inflation-adjusted (today\'s dollars): approximately $388,000. Total contributed: $331,200. Total growth: approximately $412,000. Money multiplied: 2.2×. The calculator projects a significant gap when inflation-adjusting the 4% rule target: Robert\'s $70K desired income inflates to about $134K/year, requiring roughly $3.4M at retirement — far more than his projected $743K portfolio.',
        insight: 'Robert faces a serious retirement gap. His projected $743,000 nest egg, when using the inflation-adjusted 4% rule framework, falls well short of the roughly $3.4 million target needed to generate $70,000/year in today\'s purchasing power. Even at a 7% return (instead of his conservative 5%), his projected balance would only reach about $1,057,000. This is the reality check many mid-career savers need — catching up requires significantly increasing contributions, delaying retirement, or adjusting lifestyle expectations. The calculator\'s required-contribution feature computes the exact monthly amount needed to close the gap given his current assumptions.',
      },
    ],

    proTips: [
      'Start early. A 25-year-old contributing $400/month at 7% will have about $960K at 65. Waiting until 35 requires nearly double the monthly contribution ($775/month) to reach the same goal — that is the cost of 10 lost years of compounding.',
      'Always include your employer match in your monthly contribution. If your employer matches 50% of your 401(k) contribution up to 6% of salary, a $500/month contribution is actually $750/month with the match — a 50% instant return that dramatically improves your projection.',
      'The 4% rule works for 30-year retirements. For early retirement at 55, use a 3.0-3.5% withdrawal rate to account for the longer horizon. For traditional retirement at 65-67, 4% remains a reasonable baseline established by the Trinity Study.',
      'Run projections at multiple return assumptions: 5% (conservative), 7% (historical average), and 9% (optimistic). If your plan works at 5%, you are in excellent shape. If it only works at 9%, you need to increase contributions or adjust expectations.',
    ],

    quickReference: [
      { label: '4% Rule', value: 'Desired income ÷ 0.04 = target nest egg' },
      { label: 'Historical S&P 500 Return', value: '~7% inflation-adjusted (long-term)' },
      { label: 'Conservative Return', value: '5% (balanced 60/40 portfolio)' },
      { label: '$500/mo from age 25', value: '~$1.2M at 65 (7% return)' },
      { label: '$500/mo from age 35', value: '~$567K at 65 (7% return)' },
      { label: '10-year delay cost', value: 'Roughly HALVES your final balance' },
      { label: 'Inflation target', value: 'Fed target 2%, long-term avg ~3%' },
    ],

    limitations: [
      'Assumes constant annual returns. Real markets are volatile and sequence-of-returns risk matters enormously — a market crash in the 2-3 years just before or after retirement (sequence risk) can devastate a portfolio that looked fine in a straight-line projection.',
      'Does not account for Social Security, pensions, or other guaranteed income sources. Social Security alone can replace 30-40% of pre-retirement income for average earners, significantly reducing the nest egg needed under the 4% rule.',
      'Does not model taxes. 401(k) and traditional IRA withdrawals are taxed as ordinary income. A $1.5M pre-tax nest egg may only be worth $1.1-1.2M after federal and state taxes, depending on your retirement tax bracket.',
      'The 4% rule was derived from US historical data (1926-1995 Trinity Study). It assumes a balanced portfolio (50-75% stocks) and a 30-year retirement horizon. It is not guaranteed — future returns may differ from history, and international markets have supported lower safe withdrawal rates.',
    ],
citations: [
    { source: 'IRS Publication 590-B', url: 'https://www.irs.gov/publications/p590b' },
    { source: 'US Securities and Exchange Commission', url: 'https://www.investor.gov' },
  ],
  },
};

export default retirementConfig;
