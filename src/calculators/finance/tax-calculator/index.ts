import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import TaxCalculatorPanel from './TaxCalculatorPanel';

// 2025 Federal Tax Brackets
const BRACKETS: Record<string, [number, number][]> = {
  Single: [
    [11925, 0.10],
    [48475, 0.12],
    [103350, 0.22],
    [197300, 0.24],
    [250525, 0.32],
    [626350, 0.35],
    [Infinity, 0.37],
  ],
  'Married Filing Jointly': [
    [23850, 0.10],
    [96950, 0.12],
    [206700, 0.22],
    [394600, 0.24],
    [501050, 0.32],
    [751600, 0.35],
    [Infinity, 0.37],
  ],
  'Head of Household': [
    [16275, 0.10],
    [64450, 0.12],
    [103350, 0.22],
    [197300, 0.24],
    [250525, 0.32],
    [626350, 0.35],
    [Infinity, 0.37],
  ],
  'Married Filing Separately': [
    [11925, 0.10],
    [48475, 0.12],
    [103350, 0.22],
    [197300, 0.24],
    [250525, 0.32],
    [375800, 0.35],
    [Infinity, 0.37],
  ],
};

// 2025 Standard Deductions
const STD_DEDUCTION: Record<string, number> = {
  Single: 15000,
  'Married Filing Jointly': 30000,
  'Head of Household': 22500,
  'Married Filing Separately': 15000,
};

function calcTax(
  taxableIncome: number,
  brackets: [number, number][],
): { totalTax: number; marginalRate: number } {
  if (taxableIncome <= 0) return { totalTax: 0, marginalRate: 0 };

  let tax = 0;
  let prevLimit = 0;
  let marginalRate = 0;

  for (const [limit, rate] of brackets) {
    if (taxableIncome > limit) {
      tax += (limit - prevLimit) * rate;
      prevLimit = limit;
      marginalRate = rate;
    } else {
      tax += (taxableIncome - prevLimit) * rate;
      marginalRate = rate;
      return { totalTax: tax, marginalRate };
    }
  }

  return { totalTax: tax, marginalRate };
}

const fmtMoney = (n: number): string =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtPct = (n: number): string => `${n.toFixed(2)}%`;

const taxCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'annualIncome',
      label: 'Annual Income',
      type: 'number',
      prefix: '$',
      min: 0,
      placeholder: '75000',
      required: true,
      helpText: 'Your total gross income from all sources before any deductions.',
    },
    {
      id: 'filingStatus',
      label: 'Filing Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Single', value: 'Single' },
        { label: 'Married Filing Jointly', value: 'Married Filing Jointly' },
        { label: 'Head of Household', value: 'Head of Household' },
        { label: 'Married Filing Separately', value: 'Married Filing Separately' },
      ],
      helpText: 'Your tax filing status determines which tax brackets and standard deduction apply.',
    },
    {
      id: 'preTaxDeductions',
      label: 'Pre-tax Deductions',
      type: 'number',
      prefix: '$',
      placeholder: '0',
      min: 0,
      helpText: '401k, HSA, IRA contributions',
    },
    {
      id: 'withholding',
      label: 'Withholding / Tax Paid',
      type: 'number',
      prefix: '$',
      placeholder: '0',
      min: 0,
      helpText: 'Amount already withheld from paychecks',
    },
  ],

  calculate: (values) => {
    // Decimal.js for monetary precision — imported at top of file

    const income = parseFloat(values.annualIncome);
    const status = values.filingStatus || 'Single';

    if (isNaN(income) || income < 0) return [];

    const preTaxStr = values.preTaxDeductions;
    const preTaxVal = parseFloat(preTaxStr);
    const preTax = isNaN(preTaxVal) ? 0 : preTaxVal;

    const withholdingStr = values.withholding;
    const withholdingVal = parseFloat(withholdingStr);
    const withholding = isNaN(withholdingVal) ? 0 : withholdingVal;

    const stdDed = STD_DEDUCTION[status] ?? STD_DEDUCTION.Single;
    const taxableIncome = Math.max(0, income - stdDed - preTax);

    const brackets = BRACKETS[status] ?? BRACKETS.Single;
    const { totalTax, marginalRate } = calcTax(taxableIncome, brackets);

    // Convert marginal rate from decimal (0.22) to percentage (22) for display
    const marginalRatePct = marginalRate * 100;
    const effectiveRate = income > 0 ? (totalTax / income) * 100 : 0;
    const netAfterWithholding = totalTax - withholding;
    const isRefund = netAfterWithholding < 0;

    return [
      {
        id: 'taxableIncome',
        label: 'Taxable Income (after standard deduction & pre-tax deductions)',
        value: fmtMoney(taxableIncome),
        color: 'neutral',
      },
      {
        id: 'totalTax',
        label: 'Total Federal Income Tax',
        value: fmtMoney(totalTax),
        highlight: true,
        color: 'negative',
      },
      {
        id: 'effectiveRate',
        label: 'Effective Tax Rate',
        value: fmtPct(effectiveRate),
        color: 'neutral',
      },
      {
        id: 'marginalRate',
        label: 'Marginal Tax Rate',
        value: fmtPct(marginalRatePct),
        color: 'neutral',
      },
      {
        id: 'taxAfterWithholding',
        label: isRefund ? 'Refund (you overpaid)' : 'Balance Due (additional tax owed)',
        value: isRefund ? fmtMoney(Math.abs(netAfterWithholding)) : fmtMoney(netAfterWithholding),
        color: isRefund ? 'positive' : 'negative',
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TaxCalculatorPanel, { values, results });
  },
  educational: {
    formula:
      'Total Tax = Σ(bracket_rate × taxable_income_in_bracket) for each progressive bracket | Effective Rate = Total Tax ÷ Gross Income × 100% | Taxable Income = Gross Income − Standard Deduction − Pre-tax Deductions',
    formulaDescription:
      'The U.S. federal income tax uses a progressive tax bracket system where different portions of your income are taxed at increasing rates. Your total tax is the sum of the tax from each bracket tier. The marginal tax rate is the rate on your last dollar of income, while the effective tax rate is your total tax divided by your total income, giving your true overall tax burden.',
    variables: [
      {
        symbol: 'Gross Income',
        name: 'Total Annual Income',
        description:
          'Your total annual income from all sources before any deductions or taxes are applied.',
      },
      {
        symbol: 'Standard Deduction',
        name: 'Standard Deduction Amount',
        description:
          'A fixed dollar amount that reduces your taxable income. For 2025: $15,000 (Single/MFS), $30,000 (MFJ), $22,500 (HOH).',
      },
      {
        symbol: 'Taxable Income',
        name: 'Income Subject to Tax',
        description:
          'Your gross income minus the standard deduction and any pre-tax deductions. This is the amount actually subject to federal income tax.',
      },
      {
        symbol: 'Marginal Rate',
        name: 'Highest Bracket Rate',
        description:
          'The tax rate applied to your last dollar of income. In a progressive system, only the portion of income above each bracket threshold is taxed at the higher rate.',
      },
      {
        symbol: 'Effective Rate',
        name: 'Overall Tax Percentage',
        description:
          'Your total tax divided by your gross income, expressed as a percentage. Unlike the marginal rate, this reflects your true average tax burden across all income.',
      },
    ],
    howToUse: [
      'Enter your total annual income and select your filing status (Single, Married Joint, Head of Household, or Married Separate).',
      'Add any pre-tax deductions (401k, HSA, IRA) that reduce your taxable income, and enter any tax already withheld from paychecks.',
      'Review your results: taxable income, total tax, marginal vs. effective tax rate, and whether you will owe additional tax or receive a refund.',
    ],
    explanation:
      'The United States federal income tax system is progressive, meaning that higher portions of your income are taxed at higher rates. However, a common misconception is that moving into a higher tax bracket means all of your income is taxed at that rate — this is not how progressive taxation works. Instead, your income is divided into chunks, and each chunk is taxed at its corresponding rate. For example, a single filer with $100,000 of taxable income in 2025 does not pay 22% on all $100,000. The first $11,925 is taxed at 10% ($1,192.50), the next $36,550 (from $11,926 to $48,475) is taxed at 12% ($4,386.00), and the remaining $51,525 (from $48,476 to $100,000) is taxed at 22% ($11,335.50). The total tax bill would be $16,914, which is an effective rate of 16.9% — far below the 22% marginal rate the same filer might worry about. This is why both your marginal tax rate and effective tax rate matter: the marginal rate tells you how much you save from a deduction or pay on extra income, while the effective rate tells you your true average burden. The standard deduction further reduces your taxable income: for 2025, single filers automatically deduct $15,000 — you simply do not pay tax on the first $15,000 you earn. Married couples filing jointly deduct $30,000, and heads of household deduct $22,500. Pre-tax retirement contributions (401k, traditional IRA, HSA) also reduce your taxable income dollar-for-dollar, meaning every dollar contributed saves you tax at your marginal rate. Understanding how progressive brackets work helps you make informed decisions about retirement savings, Roth vs. traditional accounts, and tax-efficient investing strategies.',
    faqs: [
      {
        question:
          'If I get a raise that pushes me into a higher tax bracket, will I take home less money?',
        answer:
          'No, never. Only the income above the bracket threshold is taxed at the higher rate. If you are a single filer earning $103,350 (top of the 22% bracket) and get a $1 raise to $103,351, only that $1 is taxed at 24%. The rest of your income is still taxed at 10%, 12%, and 22%. A raise always increases your take-home pay — it never leaves you with less after taxes.',
      },
      {
        question: 'What is the difference between marginal tax rate and effective tax rate?',
        answer:
          'Your marginal tax rate is the rate on your last dollar of income — it tells you how much tax you would save from an additional deduction or pay on additional income. Your effective tax rate is your total tax divided by your total income — it reflects your true average rate. Most people are surprised to learn their effective rate is much lower than their marginal rate.',
      },
      {
        question:
          'How do pre-tax deductions like 401k contributions affect my tax bill?',
        answer:
          'Pre-tax deductions reduce your taxable income dollar-for-dollar. If you are in the 22% bracket and contribute $5,000 to your 401k, you save $1,100 in federal income tax ($5,000 x 22%). These contributions also reduce your state taxable income in most states. However, you will pay income tax on the money when you withdraw it in retirement.',
      },
      {
        question:
          'Does this calculator account for tax credits, AMT, or other special situations?',
        answer:
          'No. This calculator estimates federal income tax using standard brackets and deductions only. It does not account for tax credits (Child Tax Credit, EITC, education credits), the Alternative Minimum Tax (AMT), itemized deductions, self-employment tax, investment income surtaxes, or state and local taxes. For a complete tax picture, consult a qualified tax professional.',
      },
      {
        question: 'How is the standard deduction determined for each filing status?',
        answer:
          'For 2025, the standard deduction amounts are: $15,000 for Single and Married Filing Separately, $30,000 for Married Filing Jointly, and $22,500 for Head of Household. These amounts are adjusted annually for inflation. Taxpayers may choose to itemize deductions instead if their total eligible expenses (mortgage interest, charitable contributions, state and local taxes) exceed the standard deduction for their filing status.',
      },
    ],
    
    workedExamples: [
      {
        scenario: 'David, a single software engineer in Austin, TX, earns $75,000/year with no pre-tax deductions and no withholding. He wants to understand his federal income tax obligation under the 2025 tax brackets.',
        inputs: {
          'Annual Income': '$75,000',
          'Filing Status': 'Single',
          'Pre-tax Deductions': '$0',
          'Withholding / Tax Paid': '$0',
        },
        result: 'Taxable income: $60,000 (after $15,000 standard deduction). Total federal income tax: $8,114.00. Effective rate: 10.82%. Marginal rate: 22.00%. Balance due: $8,114.00.',
        insight: 'Even though David is in the 22% marginal tax bracket, his effective tax rate is only 10.82% — less than half his marginal rate. This is because only the income from $48,476 to $60,000 (about $11,524) is actually taxed at 22%. The first $11,925 is taxed at just 10%, and the next $36,550 at 12%. Understanding this gap between marginal and effective rates is essential for making smart retirement contribution and tax-planning decisions.',
      },
      {
        scenario: 'Priya and Raj, a married couple in Chicago filing jointly, earn a combined $180,000. Raj contributes $10,000 to his 401(k). They have already had $28,000 withheld from their paychecks during the year.',
        inputs: {
          'Annual Income': '$180,000',
          'Filing Status': 'Married Filing Jointly',
          'Pre-tax Deductions': '$10,000',
          'Withholding / Tax Paid': '$28,000',
        },
        result: 'Taxable income: $140,000 (after $30,000 standard deduction + $10,000 pre-tax). Total federal income tax: $20,628.00. Effective rate: 11.46%. Marginal rate: 22.00%. Balance due: they overpaid by $7,372.00 — a refund.',
        insight: 'Priya and Raj overpaid by more than $7,300 because their withholding was based on gross income without accounting for the standard deduction and 401(k) contributions. Their effective rate of 11.5% on $180,000 of gross income illustrates how progressive brackets plus deductions dramatically reduce the actual tax burden for married couples. The $10,000 401(k) contribution alone saved them $2,200 in federal tax (contribution multiplied by their 22% marginal rate).',
      },
    ],

    proTips: [
      'Your marginal bracket (the rate on your last dollar) is the number that matters for decision-making: every extra dollar you contribute to a pre-tax 401(k) or traditional IRA saves you tax at exactly your marginal rate, not your effective rate.',
      'The standard deduction is free money — $15,000 for single filers, $30,000 for married joint — that you never pay tax on. If your itemized deductions (mortgage interest, charitable giving, state/local taxes) exceed these amounts, itemize instead.',
      'If your withholding results in a large refund every year, adjust your W-4 to keep more money in each paycheck — you are giving the IRS an interest-free loan.',
      'Use the "Married Filing Jointly" and "Married Filing Separately" options side-by-side to check for a marriage penalty or bonus — the brackets are not simply double the single brackets at higher income levels.',
    ],

    limitations: [
      'This calculator uses 2025 federal tax brackets only. 2026 brackets and standard deductions differ slightly due to inflation adjustments (e.g., single standard deduction rises to $15,750 in 2026). Always use the correct tax year for your filing.',
      'It does not model tax credits (Child Tax Credit, Earned Income Tax Credit, education credits) which directly reduce your tax bill dollar-for-dollar and can significantly change your net liability.',
      'State income tax is not included. If you live in a state with income tax (e.g., California, New York), your total tax burden will be higher than the federal-only estimate shown here.',
      'It does not account for the Alternative Minimum Tax (AMT), Net Investment Income Tax (3.8% surtax above $200K/$250K), self-employment tax, or the 0.9% Additional Medicare Tax on wages above $200,000.',
    ],
citations: [
      {
        source: 'IRS Revenue Procedure 2024-40 (2025 Tax Brackets)',
        url: 'https://www.irs.gov/pub/irs-drop/rp-24-40.pdf',
      },
      {
        source: 'IRS Publication 501 (Standard Deduction)',
        url: 'https://www.irs.gov/publications/p501',
      },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-1e293b)">2025 Federal Tax Brackets — Single Filer</text><text x="220" y="44" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Income is taxed in progressive layers — each bracket only applies to income in that range</text><rect x="20" y="60" width="25" height="240" rx="3" fill="var(--svg-22c55e)" opacity="0.85"/><rect x="46" y="60" width="25" height="240" rx="3" fill="var(--svg-22c55e)" opacity="0.7"/><rect x="72" y="60" width="25" height="240" rx="3" fill="var(--svg-22c55e)" opacity="0.55"/><rect x="20" y="60" width="77" height="240" rx="4" stroke="var(--svg-22c55e)" stroke-width="1.5" fill="none"/><text x="58" y="315" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-16a34a)">10%</text><text x="58" y="326" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">$0-$11,925</text><rect x="100" y="100" width="35" height="200" rx="3" fill="var(--svg-84cc16)" opacity="0.85"/><rect x="136" y="100" width="35" height="200" rx="3" fill="var(--svg-84cc16)" opacity="0.7"/><rect x="172" y="100" width="35" height="200" rx="3" fill="var(--svg-84cc16)" opacity="0.55"/><rect x="100" y="100" width="107" height="200" rx="4" stroke="var(--svg-65a30d)" stroke-width="1.5" fill="none"/><text x="153" y="315" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-4d7c0f)">12%</text><text x="153" y="326" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">$11,926-$48,475</text><rect x="210" y="140" width="35" height="160" rx="3" fill="var(--svg-f59e0b)" opacity="0.85"/><rect x="246" y="140" width="35" height="160" rx="3" fill="var(--svg-f59e0b)" opacity="0.7"/><rect x="282" y="140" width="35" height="160" rx="3" fill="var(--svg-f59e0b)" opacity="0.55"/><rect x="210" y="140" width="107" height="160" rx="4" stroke="var(--svg-d97706)" stroke-width="1.5" fill="none"/><text x="263" y="315" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-b45309)">22%</text><text x="263" y="326" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">$48,476-$103,350</text><rect x="320" y="172" width="35" height="128" rx="3" fill="var(--svg-f97316)" opacity="0.85"/><rect x="356" y="172" width="35" height="128" rx="3" fill="var(--svg-f97316)" opacity="0.7"/><rect x="392" y="172" width="35" height="128" rx="3" fill="var(--svg-f97316)" opacity="0.55"/><rect x="320" y="172" width="107" height="128" rx="4" stroke="var(--svg-ea580c)" stroke-width="1.5" fill="none"/><text x="373" y="315" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-c2410c)">24%+</text><text x="373" y="326" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">$103,351+</text><text x="58" y="55" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">$11,925</text><text x="153" y="55" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">$48,475</text><text x="263" y="55" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">$103,350</text><text x="373" y="55" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">$197,300+</text><line x1="20" y1="60" x2="20" y2="300" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="14" y="180" text-anchor="middle" font-size="8" fill="var(--svg-94a3b8)" transform="rotate(-90,14,180)">TAX RATE</text></svg>',
      alt: 'Stacked bar chart showing progressive federal income tax brackets for single filers in 2025: 10% bracket up to $11,925, 12% bracket from $11,926 to $48,475, 22% bracket from $48,476 to $103,350, and 24%+ bracket starting at $103,351. Each bracket is represented by progressively taller bars showing increasing tax rates.',
      caption:
        'Federal income tax is progressive: each bracket applies only to income within that range. Moving to a higher bracket does not affect income taxed in lower brackets.',
    },
    quickReference: [
      { label: '10% Bracket', value: '$0 - $11,925' },
      { label: '12% Bracket', value: '$11,926 - $48,475' },
      { label: '22% Bracket', value: '$48,476 - $103,350' },
      { label: '24% Bracket', value: '$103,351 - $197,300' },
      { label: '32% Bracket', value: '$197,301 - $250,525' },
      { label: '35% Bracket', value: '$250,526 - $626,350' },
      { label: '37% Bracket', value: '$626,351+' },
    ],
    commonUses: [
      'Estimate your annual federal income tax obligation and effective tax rate for financial planning and budgeting.',
      'Compare how different filing statuses (Single, Married Joint, Head of Household) affect your total tax burden.',
      'Evaluate the tax impact of pre-tax retirement contributions (401k, HSA, IRA) on your taxable income and take-home pay.',
    ],
  },
};

export default taxCalculatorConfig;
