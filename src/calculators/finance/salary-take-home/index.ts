import { createElement } from 'react';
import { CalculatorConfig, ExplainStep, SelectOption } from '../../../types/calculator';
import { finiteSteps } from '../../../utils/explainGuard';
import { resultValue } from '../../../utils/explainResults';
import { bracketSlices } from '../../../utils/bracketSteps';
import { STATE_INCOME_TAX, STATE_INCOME_TAX_YEAR, stateTaxBasis, verifiedStateNames } from '../../../utils/stateTax';
import { FEDERAL_BRACKETS, FICA, STANDARD_DEDUCTION, TAX_YEAR } from '../../../utils/taxData';
import { RETIREMENT_LIMITS_2025 } from '../income-tax/taxData';
import SalaryTakeHomePanel from './SalaryTakeHomePanel';
import { computeTakeHome, PAY_PERIODS } from './takeHomeMath';

const PAY_PERIOD_LABELS: Record<string, string> = {
  monthly: 'per month',
  'semi-monthly': 'per semi-monthly paycheck',
  'bi-weekly': 'per bi-weekly paycheck',
  weekly: 'per week',
};

const STATE_OPTIONS: SelectOption[] = [
  { label: 'None (No State Tax)', value: 'none' },
  ...Object.entries(STATE_INCOME_TAX)
    .sort((x, y) => x[1].name.localeCompare(y[1].name))
    .map(([code, r]) => ({ label: r.name, value: code })),
];

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
      helpText: `State tax uses each state's ${STATE_INCOME_TAX_YEAR} rate schedule and standard deduction (no local taxes, credits or personal exemptions). Nine states do not tax wages.`,
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
    const t = computeTakeHome(values);
    if (!t) return [];
    const { calc: c, preTaxAmount, noState } = t;
    const salary = c.grossAnnual;
    const payFreq = values.payFrequency in PAY_PERIODS ? values.payFrequency : 'monthly';
    const netPerPaycheck = c.netAnnual / PAY_PERIODS[payFreq];
    const effectiveTaxRate = (c.totalTax / salary) * 100;
    const keepPct = (c.netAnnual / salary) * 100;
    const overLimit = preTaxAmount > RETIREMENT_LIMITS_2025.traditional401k;

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
        value: `$${fmt(c.taxableIncome)}`,
        color: 'neutral' as const,
      },
      {
        id: 'totalFederalTax',
        label: 'Federal Income Tax',
        value: `$${fmt(c.fed.totalTax)}`,
        color: 'negative' as const,
      },
      {
        id: 'totalFICA',
        label: 'FICA (Social Security + Medicare)',
        value: `$${fmt(c.fica)}`,
        color: 'negative' as const,
      },
      {
        id: 'totalStateTax',
        label: noState ? 'State Income Tax' : `${c.stateName} Income Tax`,
        value: noState ? '$0.00 (No state tax)' : `$${fmt(c.stateTax)}`,
        color: noState ? 'positive' as const : 'negative' as const,
        interpretation: noState ? undefined : `State figure: ${stateTaxBasis(c.stateCode)}.`,
      },
      {
        id: 'totalTax',
        label: 'Total Tax Burden',
        value: `$${fmt(c.totalTax)}`,
        color: 'negative' as const,
      },
      {
        id: 'netAnnual',
        label: 'Take-Home Pay (Annual)',
        value: `$${fmt(c.netAnnual)}`,
        highlight: true,
        color: 'positive' as const,
        warning: overLimit
          ? `Your pre-tax deduction of $${fmt(preTaxAmount)} is more than the ${TAX_YEAR} 401(k) employee deferral limit of $${RETIREMENT_LIMITS_2025.traditional401k.toLocaleString()} (higher with catch-up contributions); treat the excess as other pre-tax benefits.`
          : undefined,
        interpretation: `You keep about ${keepPct.toFixed(0)}% of gross; $${fmt(c.totalTax)} goes to taxes${preTaxAmount > 0 ? ` and $${fmt(preTaxAmount)} to your pre-tax savings` : ''}. This uses the standard deduction and ${TAX_YEAR} brackets and doesn't include credits (child, education) or itemized deductions, which can raise your real take-home — so treat it as a baseline.`,
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

  explainSteps: (values) => {
    const t = computeTakeHome(values);
    if (!t) return [];
    const rows = salaryTakeHomeConfig.calculate(values);
    if (!rows.length) return [];
    const { calc: c, preTaxAmount, noState } = t;
    const m = (n: number) => `$${fmt(n)}`;
    const pc = (x: number) => `${+(x * 100).toFixed(2)}%`;
    const val = (id: string) => resultValue(rows, id) ?? '';
    const payFreq = values.payFrequency in PAY_PERIODS ? values.payFrequency : 'monthly';
    const wages = c.ficaWages - preTaxAmount;
    const slices = bracketSlices(c.taxableIncome, FEDERAL_BRACKETS[c.status], m);
    const fedThreshold = c.status === 'mfj' ? FICA.additionalMedicareThreshold.mfj : FICA.additionalMedicareThreshold.single;
    const stateWages = c.stateCode === 'PA' ? c.ficaWages : wages;

    const steps: ExplainStep[] = [
      {
        label: 'Take your pre-tax savings off the wages that are taxed',
        expr: preTaxAmount > 0
          ? `${m(c.grossAnnual)} salary × ${+(preTaxAmount / c.grossAnnual * 100).toFixed(4)}% pre-tax = ${m(preTaxAmount)} · Income-tax wages = ${m(c.grossAnnual)} − ${m(preTaxAmount)} = ${m(wages)}`
          : `No pre-tax deductions, so income-tax wages = ${m(c.grossAnnual)}`,
        note: 'A traditional 401(k)-style deferral lowers income-tax wages but not Social Security or Medicare wages.',
      },
      {
        label: `Subtract the ${TAX_YEAR} standard deduction (${c.status === 'mfj' ? 'married filing jointly' : c.status === 'hoh' ? 'head of household' : 'single'})`,
        expr: `max(0, ${m(wages)} − ${m(STANDARD_DEDUCTION[c.status])}) = ${val('taxableIncome')} federal taxable income`,
      },
      {
        label: `Tax each ${TAX_YEAR} federal bracket slice`,
        expr: slices ? `${slices} = ${val('totalFederalTax')} (top bracket ${pc(c.fed.marginalRate)})` : `No taxable income, federal tax = ${val('totalFederalTax')}`,
        note: 'Each rate applies only to the part of your taxable income inside that bracket.',
      },
      {
        label: 'Add up Social Security and Medicare (FICA)',
        expr: `Social Security: min(${m(c.ficaWages)}, ${m(FICA.socialSecurityWageBase)}) × ${pc(FICA.socialSecurityRate)} = ${m(c.ss)} · Medicare: ${m(c.ficaWages)} × ${pc(FICA.medicareRate)} = ${m(c.medicare)} · Additional Medicare: max(0, ${m(c.ficaWages)} − ${m(fedThreshold)}) × ${pc(FICA.additionalMedicareRate)} = ${m(c.additionalMedicare)} → ${val('totalFICA')}`,
      },
      {
        label: noState ? 'State income tax' : `${c.stateName} income tax`,
        expr: noState
          ? `No state wage tax applied → ${val('totalStateTax')}`
          : `${c.stateName}'s ${STATE_INCOME_TAX_YEAR} rate schedule and standard deduction applied to ${m(stateWages)} of wages = ${val('totalStateTax')}`,
        note: noState
          ? undefined
          : `State figure: ${stateTaxBasis(c.stateCode)}. The calculator applies the state schedule to your wages without local taxes, credits or exemptions.`,
      },
      {
        label: 'Subtract everything from your salary',
        expr: `${m(c.grossAnnual)} − ${val('totalFederalTax')} federal − ${val('totalFICA')} FICA − ${noState ? '$0.00' : val('totalStateTax')} state − ${val('preTaxDeductions')} pre-tax savings = ${val('netAnnual')} a year`,
        note: `Total tax is ${val('totalTax')}, an effective rate of ${val('effectiveTaxRate')} of salary.`,
      },
      {
        label: 'Divide by your pay periods',
        expr: `${val('netAnnual')} ÷ ${PAY_PERIODS[payFreq]} = ${val('perPaycheck')}`,
      },
    ];
    return finiteSteps(steps);
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(SalaryTakeHomePanel, { values, results });
  },

  educational: {
    formula:
      'Net Pay = Gross Salary - Pre-Tax Deductions - Federal Income Tax - FICA (SS + Medicare) - State Income Tax',
    formulaDescription:
      'The US uses a progressive federal income tax system: income within each bracket is taxed at that bracket\'s rate, so only the portion of income that falls into a higher bracket is taxed at the higher rate. FICA (Social Security + Medicare) is a flat percentage on all wages, with a Social Security wage cap and an additional Medicare surtax for high earners. State income tax varies from none at all to graduated top rates above 10% in a few states. Your effective tax rate (total tax divided by gross salary) is always lower than your marginal bracket rate.',
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
        description: 'Payroll taxes totaling 7.65% (6.2% Social Security up to $184,500 wage base + 1.45% Medicare with no cap). High earners pay an additional 0.9% Medicare surtax above $200K/$250K.',
      },
      {
        symbol: 'State Tax',
        name: 'State Income Tax',
        description: `State-level income tax on wages after pre-tax deductions, using each state's ${STATE_INCOME_TAX_YEAR} brackets and standard deduction (Tax Foundation compilation). Nine states do not tax wages; flat rates start near 2.5% and the highest top bracket is 13.3% (California).`,
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
      'Your take-home pay is far less than your salary because of three layers of mandatory taxes. First, federal income tax uses a progressive system with seven brackets (10% through 37%). Crucially, only the portion of your income that falls into each bracket is taxed at that bracket rate, which is why your effective federal tax rate is always much lower than your top marginal rate. For example, a single filer earning $75,000 in 2026 is in the 22% bracket but pays an effective federal rate of only about 10% of their gross salary. Second, FICA taxes of 7.65% (6.2% for Social Security up to $184,500, plus 1.45% for Medicare with no cap) apply to virtually all wage income, with an extra 0.9% Medicare surtax on high earners. Third, state income tax adds nothing in states like Texas and Florida, a flat rate in states like Illinois (4.95%), and graduated rates with top brackets above 9% in places like California, Oregon, and Minnesota. Pre-tax retirement contributions (like a traditional 401k) can significantly reduce your federal and state income tax burden while helping you save for retirement. Understanding this breakdown is essential for budgeting, comparing job offers across states, and planning your retirement contribution strategy.',
    faqs: [
      {
        question: 'Why is my effective tax rate lower than my marginal tax bracket?',
        answer: 'The US tax system is progressive — only the income within each bracket is taxed at that bracket\'s rate. For example, a single filer earning $75,000 in 2026 falls in the 22% bracket, but only about $8,500 of their income is actually taxed at 22%. The first $12,400 is taxed at 10%, and the next $38,000 at 12%. This makes their effective federal rate roughly 10% of gross income — far below 22%. Your effective rate tells you the actual percentage of income you pay in taxes.',
      },
      {
        question: 'Do pre-tax 401(k) contributions reduce my FICA taxes?',
        answer: 'No. Traditional 401(k), 403(b), and most pre-tax retirement plan contributions reduce your federal and state income tax, but they do NOT reduce Social Security or Medicare (FICA) taxes. FICA is calculated on your gross wages before pre-tax retirement deductions. However, certain other pre-tax deductions like health insurance premiums and HSA contributions (if made through payroll) DO reduce FICA wages.',
      },
      {
        question: 'What is the difference between FICA and federal income tax?',
        answer: 'Federal income tax is progressive and based on your taxable income after deductions. FICA (Federal Insurance Contributions Act) is a flat 7.65% tax (6.2% Social Security + 1.45% Medicare) on virtually all wage income. Social Security tax is capped at $184,500 for 2026, while Medicare has no cap. High earners also pay an additional 0.9% Medicare surtax above $200,000 (single) or $250,000 (married filing jointly).',
      },
      {
        question: 'Does this calculator use the standard deduction or itemized deductions?',
        answer: 'This calculator uses the 2026 standard deduction ($16,100 for single, $32,200 for married filing jointly, $24,150 for head of household). Most taxpayers take the standard deduction, which was nearly doubled by the Tax Cuts and Jobs Act. If your itemizable deductions (mortgage interest, state and local taxes up to the $40,400 cap for 2026, charitable gifts, medical expenses) exceed the standard deduction, your actual tax would be slightly lower than shown here.',
      },
      {
        question: 'How accurate are the state tax rates used here?',
        answer: 'State tax is computed from each state\'s 2026 rate schedule and standard deduction, applied to your wages after pre-tax deductions (Tax Foundation compilation; a few states had not published 2026 inflation adjustments, so some thresholds are the 2025 amounts). It leaves out personal exemptions and credits, local income taxes (for example New York City or Maryland counties) and state payroll taxes such as California SDI, so your actual withholding can differ. States like Texas, Florida, Washington, and Tennessee do not tax wages.' +
          ` Schedules for ${verifiedStateNames().join(', ')} were checked against each state's own revenue department or legislature (the page names the source and date next to the state figure); every other state is an estimate.`,
      },
    ],
    citations: [
      { source: 'IRS Revenue Procedure 2025-32 (2026 Tax Brackets)', url: 'https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill' },
      { source: 'Social Security Administration — 2026 Contribution & Wage Base', url: 'https://www.ssa.gov/oact/cola/cbb.html' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 400 170" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="400" height="170" fill="var(--svg-f8fafc)" rx="6"/><text x="200" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)">How Your Salary Is Split</text><g transform="translate(25,32)"><rect x="0" y="0" width="350" height="28" rx="4" fill="var(--svg-e2e8f0)"/><rect x="0" y="0" width="38" height="28" rx="4" fill="var(--svg-ef4444)"/><text x="19" y="19" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-ffffff)">Fed</text><rect x="38" y="0" width="28" height="28" fill="var(--svg-f59e0b)"/><text x="52" y="19" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-ffffff)">FICA</text><rect x="66" y="0" width="24" height="28" fill="var(--svg-8b5cf6)"/><text x="78" y="19" text-anchor="middle" font-size="7" font-weight="bold" fill="var(--svg-ffffff)">St</text><rect x="90" y="0" width="260" height="28" rx="4" fill="var(--svg-22c55e)"/><text x="220" y="19" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">Take-Home Pay</text><rect x="0" y="40" width="10" height="10" rx="2" fill="var(--svg-ef4444)"/><text x="14" y="49" font-size="8" fill="var(--svg-64748b)">Federal Tax</text><rect x="80" y="40" width="10" height="10" rx="2" fill="var(--svg-f59e0b)"/><text x="94" y="49" font-size="8" fill="var(--svg-64748b)">FICA</text><rect x="140" y="40" width="10" height="10" rx="2" fill="var(--svg-8b5cf6)"/><text x="154" y="49" font-size="8" fill="var(--svg-64748b)">State Tax</text><rect x="210" y="40" width="10" height="10" rx="2" fill="var(--svg-22c55e)"/><text x="224" y="49" font-size="8" fill="var(--svg-64748b)">Take-Home</text></g><text x="200" y="100" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-1e293b)">Progressive tax: only income within each bracket is taxed at that rate</text><text x="200" y="113" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">Your effective rate is always lower than your marginal (top) bracket</text><text x="200" y="126" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">Pre-tax 401(k) reduces income tax but not FICA</text><text x="200" y="139" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">State tax: none in TX, FL, WA, TN; top rates above 9% in CA, OR, MN</text></svg>',
      alt: 'Horizontal stacked bar chart showing how gross salary is split into federal tax, FICA, state tax, and take-home pay, with legend and key insights about progressive taxation',
      caption: 'Your salary is divided among federal income tax, FICA (Social Security + Medicare), state income tax, and your net take-home pay. The proportions vary based on income level, filing status, and state of residence.',
    },
  },
};

export default salaryTakeHomeConfig;
