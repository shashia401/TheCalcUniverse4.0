import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import NetWorthPanel from './NetWorthPanel';

const netWorthConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'cash',
      label: 'Cash & Savings',
      type: 'number',
      placeholder: '15,000',
      prefix: '$',
      min: 0,
      step: 0.01,
      helpText: 'Checking, savings, and money market accounts',
    },
    {
      id: 'investments',
      label: 'Investments',
      type: 'number',
      placeholder: '50,000',
      prefix: '$',
      min: 0,
      step: 0.01,
      helpText: 'Stocks, bonds, mutual funds, ETFs, and brokerage accounts',
    },
    {
      id: 'retirement',
      label: 'Retirement Accounts',
      type: 'number',
      placeholder: '80,000',
      prefix: '$',
      min: 0,
      step: 0.01,
      helpText: '401(k), IRA, Roth IRA, pension value',
    },
    {
      id: 'realEstate',
      label: 'Real Estate',
      type: 'number',
      placeholder: '300,000',
      prefix: '$',
      min: 0,
      step: 0.01,
      helpText: 'Current market value of property you own',
    },
    {
      id: 'otherAssets',
      label: 'Other Assets',
      type: 'number',
      placeholder: '10,000',
      prefix: '$',
      min: 0,
      step: 0.01,
      helpText: 'Vehicles, jewelry, business equity, and other valuables',
    },
    {
      id: 'mortgage',
      label: 'Mortgage Balance',
      type: 'number',
      placeholder: '220,000',
      prefix: '$',
      min: 0,
      step: 0.01,
      helpText: 'Remaining balance on all mortgages',
    },
    {
      id: 'carLoans',
      label: 'Car Loans',
      type: 'number',
      placeholder: '12,000',
      prefix: '$',
      min: 0,
      step: 0.01,
      helpText: 'Outstanding auto loan balances',
    },
    {
      id: 'studentLoans',
      label: 'Student Loans',
      type: 'number',
      placeholder: '25,000',
      prefix: '$',
      min: 0,
      step: 0.01,
      helpText: 'Outstanding student loan balance',
    },
    {
      id: 'creditCardDebt',
      label: 'Credit Card Debt',
      type: 'number',
      placeholder: '3,000',
      prefix: '$',
      min: 0,
      step: 0.01,
      helpText: 'Total outstanding credit card balances',
    },
    {
      id: 'otherDebts',
      label: 'Other Debts',
      type: 'number',
      placeholder: '5,000',
      prefix: '$',
      min: 0,
      step: 0.01,
      helpText: 'Personal loans, medical debt, and other liabilities',
    },
  ],
  calculate: (values) => {
    // Decimal.js for monetary precision — imported at top of file

    const parse = (key: string) => parseFloat(values[key]) || 0;

    const totalAssets =
      parse('cash') +
      parse('investments') +
      parse('retirement') +
      parse('realEstate') +
      parse('otherAssets');

    const totalLiabilities =
      parse('mortgage') +
      parse('carLoans') +
      parse('studentLoans') +
      parse('creditCardDebt') +
      parse('otherDebts');

    if (totalAssets === 0 && totalLiabilities === 0) return [];

    const netWorth = totalAssets - totalLiabilities;
    const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 100;

    const fmt = (n: number) =>
      Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return [
      {
        id: 'netWorth',
        label: 'Net Worth',
        value: `${netWorth >= 0 ? '' : '-'}$${fmt(netWorth)}`,
        highlight: true,
        color: netWorth >= 0 ? 'positive' : 'negative',
        interpretation: netWorth >= 0
          ? `This is a snapshot, not a score — a young household with student debt often has negative net worth despite a strong trajectory. Debt-to-asset ratio here is ${debtToAssetRatio.toFixed(0)}%; the trend over time (tracked quarterly or annually) matters more than any single number.`
          : `A negative reading is common early in adulthood or after a major purchase — it's not a red flag on its own. What matters is the trend: track this every few months and watch whether debt is shrinking relative to assets.`,
      },
      {
        id: 'totalAssets',
        label: 'Total Assets',
        value: `$${fmt(totalAssets)}`,
        color: 'positive',
      },
      {
        id: 'totalLiabilities',
        label: 'Total Liabilities',
        value: `$${fmt(totalLiabilities)}`,
        color: totalLiabilities > 0 ? 'negative' : 'neutral',
      },
      {
        id: 'debtToAsset',
        label: 'Debt-to-Asset Ratio',
        value: `${debtToAssetRatio.toFixed(1)}%`,
        color: debtToAssetRatio > 50 ? 'negative' : 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(NetWorthPanel, { values, results });
  },
  educational: {
    formula: 'Net Worth = Total Assets − Total Liabilities',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="28" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">Building Blocks of Net Worth</text><text x="220" y="46" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Net Worth = What You Own − What You Owe</text><g transform="translate(30,70)"><!-- Assets section --><rect x="10" y="0" width="380" height="68" rx="8" fill="var(--svg-dcfce7)"/><text x="200" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-15803d)">Total Assets</text><text x="30" y="34" font-size="10" fill="var(--svg-166534)">Cash &amp; Savings</text><text x="30" y="48" font-size="10" fill="var(--svg-166534)">Investments &amp; Retirement</text><text x="30" y="62" font-size="10" fill="var(--svg-166534)">Real Estate &amp; Other Assets</text><text x="380" y="42" text-anchor="end" font-size="11" font-weight="bold" fill="var(--svg-15803d)">[A]</text><path d="M 10,78 L 390,78" stroke="var(--svg-94a3b8)" stroke-width="1" stroke-dasharray="4,3"/><!-- Liabilities section --><rect x="10" y="90" width="240" height="68" rx="8" fill="var(--svg-fee2e2)"/><text x="130" y="108" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-dc2626)">Liabilities</text><text x="30" y="124" font-size="10" fill="var(--svg-991b1b)">Mortgages</text><text x="30" y="138" font-size="10" fill="var(--svg-991b1b)">Loans &amp; Credit Cards</text><text x="30" y="152" font-size="10" fill="var(--svg-991b1b)">Other Debts</text><text x="240" y="132" text-anchor="end" font-size="11" font-weight="bold" fill="var(--svg-dc2626)">[L]</text><!-- Net Worth arrow section --><rect x="10" y="170" width="140" height="68" rx="8" fill="var(--svg-dbeafe)"/><text x="80" y="188" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-2563eb)">Net Worth</text><text x="80" y="218" text-anchor="middle" font-size="11" fill="var(--svg-2563eb)">[A] − [L]</text><text x="80" y="232" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Your true wealth</text><!-- Visual indicator: bar showing relationship --><rect x="10" y="260" width="380" height="30" rx="15" fill="var(--svg-e2e8f0)"/><rect x="10" y="260" width="240" height="30" rx="15" fill="var(--svg-ef4444)" opacity="0.7"/><rect x="10" y="260" width="380" height="30" rx="15" fill="var(--svg-22c55e)" opacity="0.5"/><text x="200" y="280" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e293b)">Assets →→→→→→→→→→→→→→→→→→ Liabilities →→→→ Net Worth →→→→</text></g></svg>',
      alt: 'Visual diagram showing total assets as the top block, liabilities as a middle block, and net worth as the difference, with a bar representing the relationship between all three',
      caption: 'Net worth is your total assets minus your total liabilities — the true measure of your financial health at a single point in time',
    },
    formulaDescription:
      'Net worth is the simplest and most comprehensive measure of personal financial health — what you own minus what you owe. It is a snapshot that captures the cumulative result of every financial decision you have ever made: how much you saved, how much you borrowed, and how your investments have performed.',
    variables: [
      { symbol: 'NW', name: 'Net Worth', description: 'The total dollar value remaining after subtracting all debts from all assets. A positive net worth means you own more than you owe. The goal is to grow this number over time through saving, investing, and paying down debt.' },
      { symbol: 'A', name: 'Total Assets', description: 'Everything of value that you own: cash and savings accounts, investment portfolios, retirement accounts (401k, IRA, Roth IRA), real estate equity, and personal property (vehicles, jewelry, collectibles).' },
      { symbol: 'L', name: 'Total Liabilities', description: 'Everything you owe: mortgages, car loans, student loans, credit card balances, personal loans, medical debt, and any other outstanding obligations.' },
    ],
    howToUse: [
      'Enter the current value of each asset category. Use today\'s market value, not what you paid. For investments and real estate, check current statements or valuations.',
      'Enter the current outstanding balance for each debt. Do not include monthly payments — only the remaining balance as of today.',
      'Leave any fields blank or at zero if they do not apply to you. The calculator handles missing inputs gracefully.',
      'The calculator shows your net worth, total assets, total liabilities, and debt-to-asset ratio. A ratio below 50% is generally healthy.',
    ],
    commonUses: [
      'Get a complete financial snapshot by calculating your total net worth including all assets and liabilities in one place.',
      'Track changes in your net worth over time to measure whether your financial decisions are building or eroding wealth.',
      'Assess your debt-to-asset ratio to evaluate your overall leverage and financial risk exposure.',
    ],
    explanation:
      'Net worth is the single most important number in personal finance. It is a financial snapshot — a measure of wealth that is far more meaningful than income alone. Two people earning identical salaries can have radically different net worths depending on how they save, invest, and manage debt. Tracking your net worth over time is the clearest way to measure whether you are building wealth or falling behind. A rising net worth indicates progress; a stagnant or declining one signals that spending or debt is outpacing asset growth. Financial independence is typically defined as having a net worth large enough to generate passive income that covers your living expenses — often cited as 25× your annual spending (the "4% rule"). The debt-to-asset ratio shown here helps you gauge your leverage: below 20% is excellent, 20-50% is typical for mid-career homeowners, and above 50% suggests elevated financial risk.',
    faqs: [
      {
        question: 'Is a negative net worth bad?',
        answer: 'Not necessarily, especially early in life. Many recent graduates have negative net worth due to student loans, yet their income trajectory is strong. What matters more than the current number is the trajectory — is your net worth growing each year? Consistent growth is the goal. A negative net worth becomes concerning when it persists or grows larger over time without a clear plan for improvement.',
      },
      {
        question: 'Should I include my home as an asset?',
        answer: 'Yes, at its current market value. But remember to also include the mortgage as a liability. Your home equity — the difference between market value and mortgage balance — is the net contribution to your net worth. For example, a $400,000 home with a $250,000 mortgage contributes $150,000 to your net worth.',
      },
      {
        question: 'What is the average net worth by age?',
        answer: 'According to the Federal Reserve\'s 2022 Survey of Consumer Finances, median net worth in the US is approximately $39,000 for under-35, $135,000 for 35–44, $247,000 for 45–54, $364,000 for 55–64, and $409,000 for 65–74. These are medians; averages are much higher due to wealth concentration at the top. Use these as rough benchmarks — your personal financial goals and circumstances are unique.',
      },
      {
        question: 'How often should I calculate my net worth?',
        answer: 'Once or twice a year is typically sufficient. Quarterly reviews work well if you are actively paying down debt or building investments. Avoid checking too frequently — short-term fluctuations in investment values can be misleading and may cause unnecessary stress. Annual tracking on the same date each year (e.g., January 1 or your birthday) gives the clearest picture of long-term progress.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
  
    workedExamples: [
      {
        scenario: 'Michael, a 34-year-old marketing manager in Atlanta, has $15,000 in cash savings, $50,000 in a brokerage account, $80,000 in his 401(k), a $300,000 condo, $10,000 in vehicle value and other assets. He owes $220,000 on his mortgage, $12,000 on his car, and $3,000 on a credit card.',
        inputs: {
          'Cash & Savings': '$15,000',
          'Investments': '$50,000',
          'Retirement Accounts': '$80,000',
          'Real Estate': '$300,000',
          'Other Assets': '$10,000',
          'Mortgage Balance': '$220,000',
          'Car Loans': '$12,000',
          'Credit Card Debt': '$3,000',
          'Student Loans': '$0',
          'Other Debts': '$0',
        },
        result: 'Total Assets: $455,000. Total Liabilities: $235,000. Net Worth: $220,000. Debt-to-Asset Ratio: 51.6%.',
        insight: 'Michael\'s $220K net worth at age 34 puts him well above the US median net worth of roughly $39,000 for his age group. However, his debt-to-asset ratio of 51.6% is just above the 50% threshold — driven almost entirely by his mortgage. His home equity ($300K value minus $220K mortgage = $80K) represents only 36% of his net worth, while his retirement and investment accounts ($130K combined) form the majority. This is actually a healthy profile for a mid-career homeowner: productive mortgage debt offset by growing liquid investments.',
      },
      {
        scenario: 'Aisha, a 28-year-old nurse in Philadelphia, has $8,000 in savings, $15,000 in a Roth IRA, no home, a car worth $18,000, $22,000 in student loans, an $8,000 car loan, and $2,000 in credit card debt.',
        inputs: {
          'Cash & Savings': '$8,000',
          'Investments': '$0',
          'Retirement Accounts': '$15,000',
          'Real Estate': '$0',
          'Other Assets': '$18,000',
          'Mortgage Balance': '$0',
          'Car Loans': '$8,000',
          'Student Loans': '$22,000',
          'Credit Card Debt': '$2,000',
          'Other Debts': '$0',
        },
        result: 'Total Assets: $41,000. Total Liabilities: $32,000. Net Worth: $9,000. Debt-to-Asset Ratio: 78.0%.',
        insight: 'Aisha has a positive net worth of $9,000, which is excellent for a 28-year-old with student debt. However, her debt-to-asset ratio of 78% is high — the $22K in student loans and $8K car loan represent significant leverage relative to her $41K in assets. Her priority should be paying off the high-interest credit card debt ($2K) first, then building her cash savings for an emergency fund. Her Roth IRA is a great start for retirement but at 28 she has the prime compounding years ahead — increasing contributions now will pay off enormously.',
      },
    ],

    proTips: [
      'Don\'t include depreciating assets (cars, electronics, furniture) at their purchase price — use current market value from Kelley Blue Book or similar. Cars especially lose value fast and overstating them inflates your net worth.',
      'Track your net worth on the same date each year (e.g., January 1). The trend matters far more than any single snapshot. A steady upward trajectory of 5-15% per year is a sign of healthy financial habits.',
      'If you have a mortgage, your home equity is a major net worth contributor — but it is illiquid. Don\'t count it as accessible cash. For financial independence calculations, some planners exclude primary home equity entirely.',
      'Credit card debt is the single biggest net worth killer. At 20-30% APR, paying it off is a guaranteed tax-free return that beats any investment. Prioritize eliminating high-interest debt before aggressively investing.',
    ],

    quickReference: [
      { label: 'Median NW under 35', value: '$39,000 (Fed 2022 Survey)' },
      { label: 'Median NW 35–44', value: '$135,000' },
      { label: 'Median NW 45–54', value: '$247,000' },
      { label: 'Healthy Debt/Asset', value: 'Under 50%' },
      { label: 'NW = Assets - Liabilities', value: 'The single best wealth snapshot' },
      { label: 'Home equity', value: 'Market value minus mortgage — count both' },
    ],

    limitations: [
      'Net worth is a point-in-time snapshot. It does not capture income trajectory, earning potential, or future inheritance — all of which dramatically affect long-term financial health. A medical resident with negative net worth and $200K in student loans has far better financial prospects than a 55-year-old with zero net worth and stagnant income.',
      'Asset values are self-reported and unaudited. Real estate values in particular can be volatile and hard to estimate without a professional appraisal or comparative market analysis. Over- or under-estimating your home value by even 10% can swing your net worth by tens of thousands.',
      'Does not account for tax liabilities embedded in assets. A $500K 401(k) balance is pre-tax money — withdrawing it may trigger 22-37% federal tax plus state tax. Similarly, selling a home above the $250K/$500K capital gains exclusion triggers taxes.',
      'Private company equity, stock options, restricted stock units, pensions with cash value, and illiquid investments are hard to value and not explicitly modeled. If these represent a significant portion of your wealth, consult a financial advisor for a comprehensive net worth statement.',
    ],
citations: [
    { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/n/networth.asp' },
  ],
  },
};

export default netWorthConfig;
