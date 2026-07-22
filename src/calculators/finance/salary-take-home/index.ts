import { createElement } from 'react';
import { CalculatorConfig, SelectOption } from '../../../types/calculator';
import SalaryTakeHomePanel from './SalaryTakeHomePanel';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PAY_PERIODS: Record<string, number> = {
  monthly: 12,
  'semi-monthly': 24,
  'bi-weekly': 26,
  weekly: 52,
};

const PAY_PERIOD_LABELS: Record<string, string> = {
  monthly: 'per month',
  'semi-monthly': 'per semi-monthly paycheck',
  'bi-weekly': 'per bi-weekly paycheck',
  weekly: 'per week',
};

/** 2025 Federal income tax brackets (taxable income). */
const FEDERAL_BRACKETS: Record<string, Array<{ min: number; max: number; rate: number }>> = {
  single: [
    { min: 0, max: 11925, rate: 0.10 },
    { min: 11925, max: 48475, rate: 0.12 },
    { min: 48475, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250525, rate: 0.32 },
    { min: 250525, max: 626350, rate: 0.35 },
    { min: 626350, max: Infinity, rate: 0.37 },
  ],
  mfj: [
    { min: 0, max: 23850, rate: 0.10 },
    { min: 23850, max: 96950, rate: 0.12 },
    { min: 96950, max: 206700, rate: 0.22 },
    { min: 206700, max: 394600, rate: 0.24 },
    { min: 394600, max: 501050, rate: 0.32 },
    { min: 501050, max: 751600, rate: 0.35 },
    { min: 751600, max: Infinity, rate: 0.37 },
  ],
  hoh: [
    { min: 0, max: 17050, rate: 0.10 },
    { min: 17050, max: 65200, rate: 0.12 },
    { min: 65200, max: 111350, rate: 0.22 },
    { min: 111350, max: 199750, rate: 0.24 },
    { min: 199750, max: 250850, rate: 0.32 },
    { min: 250850, max: 626350, rate: 0.35 },
    { min: 626350, max: Infinity, rate: 0.37 },
  ],
};

/** 2025 standard deductions. */
const STANDARD_DEDUCTION: Record<string, number> = {
  single: 15000,
  mfj: 30000,
  hoh: 22500,
};

const FICA_SS_RATE = 0.062;
const FICA_MEDICARE_RATE = 0.0145;
const SS_WAGE_BASE_2025 = 176100;
const ADDITIONAL_MEDICARE_RATE = 0.009;
const ADDITIONAL_MEDICARE_THRESHOLD_SINGLE = 200000;
const ADDITIONAL_MEDICARE_THRESHOLD_MFJ = 250000;

/** Simplified flat state income tax rates by state code. */
const STATE_TAX: Record<string, number> = {
  CA: 0.093,
  NY: 0.0685,
  IL: 0.0495,
  PA: 0.0307,
  OH: 0.035,
  GA: 0.0549,
  NC: 0.045,
  MI: 0.0425,
  NJ: 0.0637,
  VA: 0.0575,
  AZ: 0.025,
  MA: 0.05,
  IN: 0.0315,
  MO: 0.0495,
  MD: 0.0575,
  WI: 0.053,
  CO: 0.044,
  MN: 0.0785,
  SC: 0.064,
  AL: 0.05,
  KY: 0.04,
  OR: 0.0875,
  OK: 0.0475,
  CT: 0.0699,
  IA: 0.038,
  AR: 0.049,
};

const STATE_OPTIONS: SelectOption[] = [
  { label: 'None (No State Tax)', value: 'none' },
  { label: 'Alabama', value: 'AL' },
  { label: 'Arizona', value: 'AZ' },
  { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' },
  { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' },
  { label: 'Florida', value: 'FL' },
  { label: 'Georgia', value: 'GA' },
  { label: 'Illinois', value: 'IL' },
  { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' },
  { label: 'Kentucky', value: 'KY' },
  { label: 'Louisiana', value: 'LA' },
  { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' },
  { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' },
  { label: 'Missouri', value: 'MO' },
  { label: 'New Jersey', value: 'NJ' },
  { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' },
  { label: 'Ohio', value: 'OH' },
  { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' },
  { label: 'Pennsylvania', value: 'PA' },
  { label: 'South Carolina', value: 'SC' },
  { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' },
  { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' },
  { label: 'Wisconsin', value: 'WI' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function calcFederalTax(
  taxableIncome: number,
  brackets: Array<{ min: number; max: number; rate: number }>,
): number {
  const clamped = Math.max(0, taxableIncome);
  let tax = 0;
  for (const b of brackets) {
    if (clamped > b.min) {
      const incomeInBracket = Math.min(clamped, b.max) - Math.max(b.min, 0);
      if (incomeInBracket > 0) {
        tax += incomeInBracket * b.rate;
      }
    }
  }
  return tax;
}

function calcStateTax(salary: number, stateCode: string): number {
  if (stateCode === 'none') return 0;
  const rate = STATE_TAX[stateCode];
  if (rate === undefined) return 0;
  return salary * rate;
}

function calcFICA(
  wages: number,
  status: string,
): { ss: number; medicare: number; additional: number; total: number } {
  const ss = Math.min(wages, SS_WAGE_BASE_2025) * FICA_SS_RATE;
  const medicare = wages * FICA_MEDICARE_RATE;

  let additional = 0;
  if (status === 'mfj' && wages > ADDITIONAL_MEDICARE_THRESHOLD_MFJ) {
    additional = (wages - ADDITIONAL_MEDICARE_THRESHOLD_MFJ) * ADDITIONAL_MEDICARE_RATE;
  } else if (wages > ADDITIONAL_MEDICARE_THRESHOLD_SINGLE) {
    additional = (wages - ADDITIONAL_MEDICARE_THRESHOLD_SINGLE) * ADDITIONAL_MEDICARE_RATE;
  }

  return { ss, medicare, additional, total: ss + medicare + additional };
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─── Config ────────────────────────────────────────────────────────────────────

const salaryTakeHomeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'annualSalary',
      label: 'Annual Salary',
      type: 'number',
      placeholder: '75,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Your gross annual salary before any taxes or deductions',
    },
    {
      id: 'filingStatus',
      label: 'Filing Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Single', value: 'single' },
        { label: 'Married Filing Jointly', value: 'mfj' },
        { label: 'Head of Household', value: 'hoh' },
      ],
    },
    {
      id: 'state',
      label: 'State',
      type: 'select',
      required: true,
      options: STATE_OPTIONS,
    },
    {
      id: 'payFrequency',
      label: 'Pay Frequency',
      type: 'select',
      required: true,
      options: [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Semi-Monthly', value: 'semi-monthly' },
        { label: 'Bi-Weekly', value: 'bi-weekly' },
        { label: 'Weekly', value: 'weekly' },
      ],
    },
    {
      id: 'preTaxDeductions',
      label: 'Pre-Tax Deductions (401k, etc.)',
      type: 'percentage',
      placeholder: 'e.g., 10',
      min: 0,
      max: 100,
      step: 1,
      helpText: 'Percentage of salary contributed to pre-tax accounts like a traditional 401(k), 403(b), or TSP. This reduces your federal and state taxable income but not FICA.',
    },
  ],

  calculate: (values) => {
    const salary = parseFloat(values.annualSalary);
    if (isNaN(salary) || salary <= 0) return [];

    const status = values.filingStatus || 'single';
    const stateCode = values.state || 'none';
    const payFreq = values.payFrequency || 'monthly';

    const deductionPctRaw = parseFloat(values.preTaxDeductions);
    const deductionPct = isNaN(deductionPctRaw) ? 0 : deductionPctRaw;

    const preTaxAmount = salary * (Math.min(deductionPct, 100) / 100);
    const adjustedIncome = salary - preTaxAmount;

    // ── Federal income tax ──────────────────────────────────────────────────
    const taxableIncome = Math.max(0, adjustedIncome - (STANDARD_DEDUCTION[status] ?? 0));
    const brackets = FEDERAL_BRACKETS[status] ?? FEDERAL_BRACKETS.single;
    const federalTax = calcFederalTax(taxableIncome, brackets);

    // ── FICA ────────────────────────────────────────────────────────────────
    const fica = calcFICA(salary, status);

    // ── State tax ───────────────────────────────────────────────────────────
    const stateTax = calcStateTax(salary, stateCode);

    // ── Totals ──────────────────────────────────────────────────────────────
    const totalTax = federalTax + fica.total + stateTax;
    const netAnnual = Math.max(0, salary - preTaxAmount - totalTax);

    const periods = PAY_PERIODS[payFreq] ?? 12;
    const netPerPaycheck = netAnnual / periods;

    const effectiveTaxRate = (totalTax / salary) * 100;

    return [
      {
        id: 'grossAnnual',
        label: 'Gross Annual Salary',
        value: `$${fmt(salary)}`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'preTaxDeductions',
        label: 'Pre-Tax Deductions',
        value: `$${fmt(preTaxAmount)}`,
        color: 'negative' as const,
      },
      {
        id: 'taxableIncome',
        label: 'Federal Taxable Income',
        value: `$${fmt(taxableIncome)}`,
        color: 'neutral' as const,
      },
      {
        id: 'totalFederalTax',
        label: 'Federal Income Tax',
        value: `$${fmt(federalTax)}`,
        color: 'negative' as const,
      },
      {
        id: 'totalFICA',
        label: 'FICA (Social Security + Medicare)',
        value: `$${fmt(fica.total)}`,
        color: 'negative' as const,
      },
      {
        id: 'totalStateTax',
        label: 'State Income Tax',
        value: stateCode === 'none' ? '$0.00 (No state tax)' : `$${fmt(stateTax)}`,
        color: stateCode === 'none' ? 'positive' as const : 'negative' as const,
      },
      {
        id: 'totalTax',
        label: 'Total Tax Burden',
        value: `$${fmt(totalTax)}`,
        color: 'negative' as const,
      },
      {
        id: 'netAnnual',
        label: 'Take-Home Pay (Annual)',
        value: `$${fmt(netAnnual)}`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'perPaycheck',
        label: `Take-Home Pay (${payFreq === 'monthly' ? 'Monthly' : payFreq === 'semi-monthly' ? 'Semi-Monthly' : payFreq === 'bi-weekly' ? 'Bi-Weekly' : 'Weekly'})`,
        value: `$${fmt(netPerPaycheck)}`,
        unit: PAY_PERIOD_LABELS[payFreq] ?? 'per month',
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'effectiveTaxRate',
        label: 'Effective Tax Rate',
        value: `${effectiveTaxRate.toFixed(1)}%`,
        color: 'neutral' as const,
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(SalaryTakeHomePanel, { values, results });
  },

  educational: {
    formula:
      'Net Pay = Gross Salary - Pre-Tax Deductions - Federal Income Tax - FICA (SS + Medicare) - State Income Tax',
    formulaDescription:
      'The US uses a progressive federal income tax system: income within each bracket is taxed at that bracket\'s rate, so only the portion of income that falls into a higher bracket is taxed at the higher rate. FICA (Social Security + Medicare) is a flat percentage on all wages, with a Social Security wage cap and an additional Medicare surtax for high earners. State income tax rates vary widely from 0% to over 9%. Your effective tax rate (total tax divided by gross salary) is always lower than your marginal bracket rate.',
    variables: [
      {
        symbol: 'Gross Pay',
        name: 'Gross Annual Salary',
        description: 'Total annual compensation before any taxes or deductions are withheld.',
      },
      {
        symbol: 'Pre-Tax Deductions',
        name: 'Pre-Tax Deductions',
        description: 'Contributions to traditional 401(k), 403(b), or similar retirement accounts. These reduce your federal and state taxable income dollar-for-dollar but do not reduce FICA taxes.',
      },
      {
        symbol: 'Taxable Income',
        name: 'Federal Taxable Income',
        description: 'Adjusted gross income minus the standard deduction. Federal income tax brackets are applied to this amount, not to your full salary.',
      },
      {
        symbol: 'Federal Tax',
        name: 'Federal Income Tax',
        description: 'Tax computed using progressive marginal brackets on taxable income. Each bracket rate applies only to income within that bracket range.',
      },
      {
        symbol: 'FICA',
        name: 'FICA (Social Security + Medicare)',
        description: 'Payroll taxes totaling 7.65% (6.2% Social Security up to $176,100 wage base + 1.45% Medicare with no cap). High earners pay an additional 0.9% Medicare surtax above $200K/$250K.',
      },
      {
        symbol: 'State Tax',
        name: 'State Income Tax',
        description: 'State-level income tax using simplified flat rates. Nine US states have no income tax; rates elsewhere range from roughly 2.5% to 9.3%.',
      },
      {
        symbol: 'Net Pay',
        name: 'Take-Home Pay',
        description: 'Your actual net income after all taxes and pre-tax deductions. This is the amount deposited in your bank account (before any post-tax deductions like Roth contributions or garnishments).',
      },
    ],
    howToUse: [
      'Enter your gross annual salary — this is your total compensation before any taxes or deductions.',
      'Select your filing status (Single, Married Filing Jointly, or Head of Household) and your state of residence for accurate tax calculations.',
      'Choose your pay frequency (monthly, semi-monthly, bi-weekly, or weekly) to see your per-paycheck take-home amount.',
      'Optionally enter a pre-tax deduction percentage for retirement contributions like a 401(k). These reduce your taxable income but not your FICA taxes.',
      'Review the full breakdown: gross salary, each tax component, total tax burden, effective tax rate, and your annual and per-paycheck take-home pay.',
    ],
    commonUses: [
      'Calculate your actual take-home pay after federal income tax, FICA, and state income tax for accurate personal budgeting.',
      'Compare how different filing statuses and states of residence affect your net paycheck and total tax burden.',
      'Estimate the tax savings from pre-tax retirement contributions and see how they reduce your taxable income and increase net savings.',
    ],
    explanation:
      'Your take-home pay is far less than your salary because of three layers of mandatory taxes. First, federal income tax uses a progressive system with seven brackets (10% through 37%). Crucially, only the portion of your income that falls into each bracket is taxed at that bracket rate, which is why your effective federal tax rate is always much lower than your top marginal rate. For example, a single filer earning $75,000 in 2025 is in the 22% bracket but pays an effective federal rate of only about 11% of their gross salary. Second, FICA taxes of 7.65% (6.2% for Social Security up to $176,100, plus 1.45% for Medicare with no cap) apply to virtually all wage income, with an extra 0.9% Medicare surtax on high earners. Third, state income tax adds anywhere from 0% in states like Texas and Florida to over 9% in California, Oregon, and Minnesota. Pre-tax retirement contributions (like a traditional 401k) can significantly reduce your federal and state income tax burden while helping you save for retirement. Understanding this breakdown is essential for budgeting, comparing job offers across states, and planning your retirement contribution strategy.',
    faqs: [
      {
        question: 'Why is my effective tax rate lower than my marginal tax bracket?',
        answer: 'The US tax system is progressive — only the income within each bracket is taxed at that bracket\'s rate. For example, a single filer earning $75,000 in 2025 falls in the 22% bracket, but only about $26,500 of their income is actually taxed at 22%. The first $11,925 is taxed at 10%, and the next $36,550 at 12%. This makes their effective federal rate roughly 11% of gross income — far below 22%. Your effective rate tells you the actual percentage of income you pay in taxes.',
      },
      {
        question: 'Do pre-tax 401(k) contributions reduce my FICA taxes?',
        answer: 'No. Traditional 401(k), 403(b), and most pre-tax retirement plan contributions reduce your federal and state income tax, but they do NOT reduce Social Security or Medicare (FICA) taxes. FICA is calculated on your gross wages before pre-tax retirement deductions. However, certain other pre-tax deductions like health insurance premiums and HSA contributions (if made through payroll) DO reduce FICA wages.',
      },
      {
        question: 'What is the difference between FICA and federal income tax?',
        answer: 'Federal income tax is progressive and based on your taxable income after deductions. FICA (Federal Insurance Contributions Act) is a flat 7.65% tax (6.2% Social Security + 1.45% Medicare) on virtually all wage income. Social Security tax is capped at $176,100 for 2025, while Medicare has no cap. High earners also pay an additional 0.9% Medicare surtax above $200,000 (single) or $250,000 (married filing jointly).',
      },
      {
        question: 'Does this calculator use the standard deduction or itemized deductions?',
        answer: 'This calculator uses the 2025 standard deduction ($15,000 for single, $30,000 for married filing jointly, $22,500 for head of household). Most taxpayers take the standard deduction, which was nearly doubled by the Tax Cuts and Jobs Act. If your itemizable deductions (mortgage interest, state and local taxes up to $10,000, charitable gifts, medical expenses) exceed the standard deduction, your actual tax would be slightly lower than shown here.',
      },
      {
        question: 'How accurate are the state tax rates used here?',
        answer: 'This calculator uses simplified flat rates to approximate state income tax. States with progressive brackets (like California and New York) use a single effective rate approximation rather than their full graduated brackets, so actual state tax may differ. States like Texas, Florida, Washington, and Tennessee have no income tax (shown as 0%). For precise state tax calculations, consult your state\'s tax authority.',
      },
    ],
    citations: [
      { source: 'IRS Revenue Procedure 2024-40 (2025 Tax Brackets)', url: 'https://www.irs.gov/pub/irs-drop/rp-24-40.pdf' },
      { source: 'Social Security Administration — 2025 Contribution & Wage Base', url: 'https://www.ssa.gov/oact/cola/cbb.html' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 400 170" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="400" height="170" fill="var(--svg-f8fafc)" rx="6"/><text x="200" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)">How Your Salary Is Split</text><g transform="translate(25,32)"><rect x="0" y="0" width="350" height="28" rx="4" fill="var(--svg-e2e8f0)"/><rect x="0" y="0" width="38" height="28" rx="4" fill="var(--svg-ef4444)"/><text x="19" y="19" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-ffffff)">Fed</text><rect x="38" y="0" width="28" height="28" fill="var(--svg-f59e0b)"/><text x="52" y="19" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-ffffff)">FICA</text><rect x="66" y="0" width="24" height="28" fill="var(--svg-8b5cf6)"/><text x="78" y="19" text-anchor="middle" font-size="7" font-weight="bold" fill="var(--svg-ffffff)">St</text><rect x="90" y="0" width="260" height="28" rx="4" fill="var(--svg-22c55e)"/><text x="220" y="19" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">Take-Home Pay</text><rect x="0" y="40" width="10" height="10" rx="2" fill="var(--svg-ef4444)"/><text x="14" y="49" font-size="8" fill="var(--svg-64748b)">Federal Tax</text><rect x="80" y="40" width="10" height="10" rx="2" fill="var(--svg-f59e0b)"/><text x="94" y="49" font-size="8" fill="var(--svg-64748b)">FICA</text><rect x="140" y="40" width="10" height="10" rx="2" fill="var(--svg-8b5cf6)"/><text x="154" y="49" font-size="8" fill="var(--svg-64748b)">State Tax</text><rect x="210" y="40" width="10" height="10" rx="2" fill="var(--svg-22c55e)"/><text x="224" y="49" font-size="8" fill="var(--svg-64748b)">Take-Home</text></g><text x="200" y="100" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-1e293b)">Progressive tax: only income within each bracket is taxed at that rate</text><text x="200" y="113" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">Your effective rate is always lower than your marginal (top) bracket</text><text x="200" y="126" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">Pre-tax 401(k) reduces income tax but not FICA</text><text x="200" y="139" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">State tax ranges from 0% (TX, FL, WA, TN) to over 9% (CA, OR, MN)</text></svg>',
      alt: 'Horizontal stacked bar chart showing how gross salary is split into federal tax, FICA, state tax, and take-home pay, with legend and key insights about progressive taxation',
      caption: 'Your salary is divided among federal income tax, FICA (Social Security + Medicare), state income tax, and your net take-home pay. The proportions vary based on income level, filing status, and state of residence.',
    },
  },
};

export default salaryTakeHomeConfig;
