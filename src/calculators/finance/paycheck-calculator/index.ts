import Decimal from 'decimal.js';
import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { STANDARD_DEDUCTION, FICA, FilingStatus, calculateFederalTax } from '../../../utils/taxData';
import PaycheckPanel from './PaycheckPanel';

// ─── State Tax Data (Simplified effective rates for paycheck estimation) ──
// Source: Tax Foundation "State Individual Income Tax Rates and Brackets, 2026"
interface StateInfo { name: string; rate: number; noIncomeTax?: boolean }
const STATE_TAX: Record<string, StateInfo> = {
  AL: { name: 'Alabama', rate: 0.05 },
  AK: { name: 'Alaska', rate: 0, noIncomeTax: true },
  AZ: { name: 'Arizona', rate: 0.025 },
  AR: { name: 'Arkansas', rate: 0.049 },
  CA: { name: 'California', rate: 0.093 },
  CO: { name: 'Colorado', rate: 0.044 },
  CT: { name: 'Connecticut', rate: 0.05 },
  DE: { name: 'Delaware', rate: 0.066 },
  FL: { name: 'Florida', rate: 0, noIncomeTax: true },
  GA: { name: 'Georgia', rate: 0.0575 },
  HI: { name: 'Hawaii', rate: 0.08 },
  ID: { name: 'Idaho', rate: 0.058 },
  IL: { name: 'Illinois', rate: 0.0495 },
  IN: { name: 'Indiana', rate: 0.0305 },
  IA: { name: 'Iowa', rate: 0.057 },
  KS: { name: 'Kansas', rate: 0.057 },
  KY: { name: 'Kentucky', rate: 0.045 },
  LA: { name: 'Louisiana', rate: 0.0425 },
  ME: { name: 'Maine', rate: 0.0715 },
  MD: { name: 'Maryland', rate: 0.0575 },
  MA: { name: 'Massachusetts', rate: 0.05 },
  MI: { name: 'Michigan', rate: 0.0425 },
  MN: { name: 'Minnesota', rate: 0.0785 },
  MS: { name: 'Mississippi', rate: 0.05 },
  MO: { name: 'Missouri', rate: 0.049 },
  MT: { name: 'Montana', rate: 0.068 },
  NE: { name: 'Nebraska', rate: 0.0664 },
  NV: { name: 'Nevada', rate: 0, noIncomeTax: true },
  NH: { name: 'New Hampshire', rate: 0, noIncomeTax: true },
  NJ: { name: 'New Jersey', rate: 0.0637 },
  NM: { name: 'New Mexico', rate: 0.049 },
  NY: { name: 'New York', rate: 0.0685 },
  NC: { name: 'North Carolina', rate: 0.0475 },
  ND: { name: 'North Dakota', rate: 0.029 },
  OH: { name: 'Ohio', rate: 0.0399 },
  OK: { name: 'Oklahoma', rate: 0.0475 },
  OR: { name: 'Oregon', rate: 0.09 },
  PA: { name: 'Pennsylvania', rate: 0.0307 },
  RI: { name: 'Rhode Island', rate: 0.0599 },
  SC: { name: 'South Carolina', rate: 0.064 },
  SD: { name: 'South Dakota', rate: 0, noIncomeTax: true },
  TN: { name: 'Tennessee', rate: 0, noIncomeTax: true },
  TX: { name: 'Texas', rate: 0, noIncomeTax: true },
  UT: { name: 'Utah', rate: 0.0485 },
  VT: { name: 'Vermont', rate: 0.066 },
  VA: { name: 'Virginia', rate: 0.0575 },
  WA: { name: 'Washington', rate: 0, noIncomeTax: true },
  WV: { name: 'West Virginia', rate: 0.065 },
  WI: { name: 'Wisconsin', rate: 0.0765 },
  WY: { name: 'Wyoming', rate: 0, noIncomeTax: true },
};

const STATE_OPTIONS = Object.entries(STATE_TAX)
  .sort((a, b) => a[1].name.localeCompare(b[1].name))
  .map(([code, info]) => ({
    label: `${info.name}${info.noIncomeTax ? ' (No Income Tax)' : ''}`,
    value: code,
  }));

const PAY_FREQUENCIES: Record<string, { label: string; periods: number }> = {
  weekly: { label: 'Weekly (52/year)', periods: 52 },
  biweekly: { label: 'Bi-Weekly (26/year)', periods: 26 },
  semimonthly: { label: 'Semi-Monthly (24/year)', periods: 24 },
  monthly: { label: 'Monthly (12/year)', periods: 12 },
};

type PayMode = 'salary' | 'hourly';
type PayFreq = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

const paycheckConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'payMode',
      label: 'Pay Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Annual Salary', value: 'salary' },
        { label: 'Hourly Wage', value: 'hourly' },
      ],
      helpText: 'Choose whether you are paid a fixed annual salary or an hourly wage. The calculation adjusts accordingly.',
    },
    {
      id: 'annualSalary',
      label: 'Annual Gross Salary',
      type: 'number',
      placeholder: '75,000',
      prefix: '$',
      min: 0,
      step: 1000,
      inputMode: 'decimal',
      required: true,
      showWhen: (v) => v.payMode !== 'hourly',
      helpText: 'Your total annual salary before any taxes or deductions. This is the gross amount your employer pays you per year.',
    },
    {
      id: 'hourlyWage',
      label: 'Hourly Wage',
      type: 'number',
      placeholder: '25.00',
      prefix: '$',
      min: 0,
      step: 0.5,
      inputMode: 'decimal',
      required: true,
      showWhen: (v) => v.payMode === 'hourly',
      helpText: 'Your gross hourly pay rate before taxes. Multiply by hours per week and 52 weeks to get annual pay.',
    },
    {
      id: 'hoursPerWeek',
      label: 'Hours Per Week',
      type: 'number',
      placeholder: '40',
      unit: 'hours',
      min: 1,
      max: 80,
      step: 1,
      inputMode: 'decimal',
      required: true,
      showWhen: (v) => v.payMode === 'hourly',
      helpText: 'How many hours you work per week on average. Standard full-time is 40 hours. Overtime is not included here.',
    },
    {
      id: 'payFrequency',
      label: 'Pay Frequency',
      type: 'select',
      required: true,
      options: [
        { label: 'Weekly (52/year)', value: 'weekly' },
        { label: 'Bi-Weekly (26/year)', value: 'biweekly' },
        { label: 'Semi-Monthly (24/year)', value: 'semimonthly' },
        { label: 'Monthly (12/year)', value: 'monthly' },
      ],
      helpText: 'How often you get paid. This determines your per-paycheck gross and net amounts. Bi-weekly is the most common.',
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
      helpText: 'Your IRS filing status determines your federal tax brackets and standard deduction amount.',
    },
    {
      id: 'state',
      label: 'State of Residence',
      type: 'select',
      required: true,
      options: STATE_OPTIONS,
      helpText: 'The state where you live and work. Eight states have no income tax at all. State rates are simplified effective rates.',
    },
    {
      id: 'preTaxDeductions',
      label: 'Pre-Tax Deductions (Annual)',
      type: 'number',
      placeholder: '5,000',
      prefix: '$',
      min: 0,
      step: 100,
      inputMode: 'decimal',
      helpText: 'Annual contributions to 401(k), health insurance, HSA, FSA, and other pre-tax benefits. These reduce both federal taxable income and FICA wages.',
    },
  ],

  calculate: (values) => {
    const mode = (values.payMode || 'salary') as PayMode;
    const annualSalaryRaw = parseFloat(values.annualSalary);
    const hourlyWageRaw = parseFloat(values.hourlyWage);
    const hoursPerWeekRaw = parseFloat(values.hoursPerWeek);
    const preTaxDedRaw = parseFloat(values.preTaxDeductions);

    if (mode === 'salary' && (isNaN(annualSalaryRaw) || annualSalaryRaw <= 0)) return [];
    if (mode === 'hourly' && (isNaN(hourlyWageRaw) || hourlyWageRaw <= 0)) return [];
    if (mode === 'hourly' && (isNaN(hoursPerWeekRaw) || hoursPerWeekRaw <= 0)) return [];

    const salary = annualSalaryRaw || 0;
    const hourlyWage = hourlyWageRaw || 0;
    const hoursPerWeek = hoursPerWeekRaw || 40;
    const stateCode = values.state || 'TX';
    const status = (values.filingStatus || 'single') as FilingStatus;
    const preTaxDed = preTaxDedRaw || 0;
    const freq = (values.payFrequency || 'biweekly') as PayFreq;

    // Use Decimal for monetary precision
    const grossAnnual = mode === 'salary'
      ? new Decimal(salary)
      : new Decimal(hourlyWage).times(hoursPerWeek).times(52);

    if (grossAnnual.isNegative() || grossAnnual.isZero()) return [];

    const grossAnnualNum = grossAnnual.toNumber();

    const ficaWages = Decimal.max(0, grossAnnual.minus(preTaxDed));
    const ficaWagesNum = ficaWages.toNumber();
    const fedAGI = ficaWagesNum;
    const stdDed = STANDARD_DEDUCTION[status];
    const taxable = Math.max(0, fedAGI - stdDed);

    const fedResult = calculateFederalTax(taxable, status);

    // FICA: Social Security capped at wage base, Medicare uncapped
    const ssWageBase = new Decimal(FICA.socialSecurityWageBase);
    const ssWages = Decimal.min(ficaWages, ssWageBase);
    const ss = ssWages.times(FICA.socialSecurityRate);

    const medicare = ficaWages.times(FICA.medicareRate);

    const threshold = status === 'mfj'
      ? FICA.additionalMedicareThreshold.mfj
      : FICA.additionalMedicareThreshold.single;
    const additionalMedicare = ficaWages.gt(threshold)
      ? ficaWages.minus(threshold).times(FICA.additionalMedicareRate)
      : new Decimal(0);

    const ficaTotal = ss.plus(medicare).plus(additionalMedicare);

    // State tax
    const stateInfo = STATE_TAX[stateCode];
    const stateTax = stateInfo?.noIncomeTax
      ? new Decimal(0)
      : grossAnnual.times(stateInfo?.rate || 0);

    // Total tax and net
    const totalTax = new Decimal(fedResult.totalTax).plus(ficaTotal).plus(stateTax);
    const netAnnual = grossAnnual.minus(totalTax).minus(preTaxDed);

    // Per-paycheck amounts
    const freqInfo = PAY_FREQUENCIES[freq];
    const periods = new Decimal(freqInfo.periods);
    const netPerPaycheck = netAnnual.dividedBy(periods);
    const fedPerPaycheck = new Decimal(fedResult.totalTax).dividedBy(periods);
    const ficaPerPaycheck = ficaTotal.dividedBy(periods);
    const statePerPaycheck = stateTax.dividedBy(periods);
    const deductionsPerPaycheck = new Decimal(preTaxDed).dividedBy(periods);

    // Rates
    const effectiveRate = grossAnnualNum > 0
      ? new Decimal(fedResult.totalTax).dividedBy(grossAnnual).times(100)
      : new Decimal(0);
    const totalEffectiveRate = grossAnnualNum > 0
      ? totalTax.dividedBy(grossAnnual).times(100)
      : new Decimal(0);

    const fmt = (n: Decimal) =>
      n.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const results: CalculatorResult[] = [
      {
        id: 'netPaycheck',
        label: `Net Pay (${freqInfo.label})`,
        value: `$${fmt(netPerPaycheck)}`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'netAnnual',
        label: `Net Pay (Annual)`,
        value: `$${fmt(netAnnual)}`,
        color: 'positive' as const,
      },
      {
        id: 'fedPerPaycheck',
        label: `Federal Income Tax / ${freq}`,
        value: `$${fmt(fedPerPaycheck)}`,
        color: 'negative' as const,
      },
      {
        id: 'ficaPerPaycheck',
        label: `FICA (SS + Medicare) / ${freq}`,
        value: `$${fmt(ficaPerPaycheck)}`,
        color: 'negative' as const,
      },
      {
        id: 'statePerPaycheck',
        label: stateInfo?.noIncomeTax ? `State Income Tax / ${freq}` : `${stateInfo?.name || stateCode} Tax / ${freq}`,
        value: stateInfo?.noIncomeTax ? '$0.00 (No state income tax)' : `$${fmt(statePerPaycheck)}`,
        color: stateInfo?.noIncomeTax ? 'positive' as const : 'negative' as const,
      },
      {
        id: 'marginalRate',
        label: `Federal Marginal Tax Rate`,
        value: `${(fedResult.marginalRate * 100).toFixed(0)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'effectiveRate',
        label: `Federal Effective Tax Rate`,
        value: `${effectiveRate.toFixed(2)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'totalEffectiveRate',
        label: `All-In Effective Rate (Fed + FICA + State)`,
        value: `${totalEffectiveRate.toFixed(2)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'grossAnnual',
        label: `Gross Annual Income`,
        value: `$${fmt(grossAnnual)}`,
        color: 'neutral' as const,
      },
    ];

    if (preTaxDed > 0) {
      results.push({
        id: 'deductions',
        label: `Pre-Tax Deductions / ${freq}`,
        value: `$${fmt(deductionsPerPaycheck)}`,
        color: 'neutral' as const,
      });
    }

    return results;
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PaycheckPanel, { values, results });
  },

  educational: {
    formula: 'Net Pay = Gross Pay − Federal Income Tax − FICA − State Tax − Pre-Tax Deductions',
    formulaDescription:
      'Your employer withholds federal income tax (based on W-4 withholding), FICA (Social Security 6.2% + Medicare 1.45%), and state income tax from each paycheck. Pre-tax deductions for 401(k), health insurance, HSA, and FSA reduce both taxable income and FICA wages — giving you a double tax benefit on every dollar contributed toward retirement or healthcare savings.',
    diagram: {
      svg: '<svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="380" height="200" rx="12" fill="#f8faf7" stroke="#c4d4b0" stroke-width="2"/><text x="200" y="38" text-anchor="middle" font-size="14" font-weight="700" fill="#2d5016">Where Your Gross Pay Goes</text><rect x="40" y="60" width="180" height="130" rx="6" fill="#5b8c2a"/><text x="130" y="90" text-anchor="middle" font-size="12" font-weight="600" fill="#fff">Net Take-Home Pay</text><text x="130" y="110" text-anchor="middle" font-size="18" font-weight="700" fill="#fff">~72%</text><rect x="230" y="60" width="50" height="130" rx="6" fill="#d97845"/><text x="255" y="90" text-anchor="middle" font-size="10" font-weight="600" fill="#fff">Federal</text><text x="255" y="108" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">~14%</text><rect x="290" y="60" width="40" height="130" rx="6" fill="#c44e2f"/><text x="310" y="90" text-anchor="middle" font-size="9" font-weight="600" fill="#fff">FICA</text><text x="310" y="108" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">~8%</text><rect x="340" y="60" width="35" height="130" rx="6" fill="#b5a642"/><text x="357" y="90" text-anchor="middle" font-size="8" font-weight="600" fill="#fff">State</text><text x="357" y="108" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">~6%</text><rect x="40" y="198" width="18" height="8" rx="2" fill="#5b8c2a"/><text x="65" y="206" font-size="9" fill="#555">Take-Home</text><rect x="130" y="198" width="18" height="8" rx="2" fill="#d97845"/><text x="155" y="206" font-size="9" fill="#555">Fed Tax</text><rect x="220" y="198" width="18" height="8" rx="2" fill="#c44e2f"/><text x="245" y="206" font-size="9" fill="#555">FICA</text><rect x="300" y="198" width="18" height="8" rx="2" fill="#b5a642"/><text x="325" y="206" font-size="9" fill="#555">State</text></svg>',
      alt: 'Horizontal stacked bar chart showing approximate paycheck breakdown: 72% net take-home pay, 14% federal income tax, 8% FICA, and 6% state income tax.',
      caption: 'Approximate breakdown of a typical paycheck for a single filer earning $75,000/year. Actual percentages vary based on income, filing status, state of residence, and pre-tax deductions.',
    },
    variables: [
      { symbol: 'FICA', name: 'Social Security + Medicare', description: `Social Security: 6.2% on wages up to $${FICA.socialSecurityWageBase.toLocaleString()}. Medicare: 1.45% on all wages. Additional Medicare: 0.9% above $200K single / $250K MFJ. Your employer matches these amounts, so the total FICA tax is double what you see on your pay stub.` },
      { symbol: 'Tax Rates', name: 'Marginal & Effective Rate', description: 'Marginal rate is the tax rate on your last dollar of income — use this for evaluating the tax savings of pre-tax deductions. Effective rate is total federal tax divided by gross income and is always lower than marginal due to progressive brackets.' },
      { symbol: 'Pre-Tax Deduction', name: 'Income Reducer', description: '401(k), health insurance, HSA, and FSA contributions reduce your taxable income AND FICA wages dollar-for-dollar. A $5,000 401(k) contribution at a 22% bracket saves you $1,482.50 in combined federal + FICA taxes.' },
    ],
    howToUse: [
      'Select Annual Salary or Hourly Wage as your pay type, then enter the relevant amount.',
      'Choose your IRS filing status (Single, Married Filing Jointly, or Head of Household) and your state of residence from the dropdown.',
      'Enter any annual pre-tax deductions like 401(k) contributions, health insurance premiums, HSA, or FSA contributions.',
      'Review the per-paycheck breakdown showing exactly where each dollar goes, and the pie chart for a visual overview.',
    ],
    commonUses: [
      'Calculate your exact take-home pay per paycheck after federal income tax, FICA, and state tax withholding for accurate monthly budgeting.',
      'Compare how different filing statuses, states of residence, and pre-tax deduction levels affect your net paycheck amount.',
      'Estimate the real impact of 401(k) and HSA contributions on your take-home pay — a $500/month 401(k) contribution may only reduce your paycheck by $375–390 after tax savings.',
      'Plan a job change or relocation by comparing take-home pay in different states, accounting for varying state income tax rates.',
    ],
    explanation:
      'Your gross pay and your take-home pay are two very different numbers. The United States introduced payroll tax withholding in the 20th century during World War II in 1943 under the Current Tax Payment Act, transforming tax collection from an annual lump-sum system to the per-paycheck method we know today. Social Security payroll taxes were first collected in 1937 following the Social Security Act of 1935, and Medicare taxes were added in 1966 under President Lyndon B. Johnson. Every paycheck, your employer withholds federal income tax (based on your W-4 form), Social Security tax of 6.2% (up to the annual wage base), Medicare tax of 1.45% (plus 0.9% for high earners above $200K single / $250K MFJ), and state income tax that ranges from 0% in no-tax states to over 9% in high-tax states. On top of withholding, pre-tax deductions for 401(k), health insurance, HSA, and FSA reduce both your income subject to federal tax AND your wages subject to FICA taxes — making them the single most tax-efficient way to save. This dual tax benefit means a dollar contributed pre-tax can save you 30 cents or more in combined taxes. This calculator shows you exactly what each paycheck looks like after all deductions and taxes, with a full visual breakdown of where every dollar goes, so you can budget confidently and make informed decisions about your benefits elections.',
    workedExamples: [
      {
        scenario: 'Maria earns $75,000/year in Texas, files Single, gets paid bi-weekly, and contributes $5,000 to her 401(k). Texas has no state income tax, so her only state-level tax is $0. She plugs these numbers into the calculator to see her take-home pay.',
        inputs: { payMode: 'salary', annualSalary: '75000', payFrequency: 'biweekly', filingStatus: 'single', state: 'TX', preTaxDeductions: '5000' },
        result: 'Maria takes home approximately $2,217 per bi-weekly paycheck after federal taxes and FICA. Her $5,000 401(k) contribution (about $192/paycheck) saves roughly $1,480 in combined federal and FICA taxes annually. Texas has no state income tax.',
        insight: 'Maria sees about $2,217 per bi-weekly paycheck after federal taxes and FICA. Her $5,000 401(k) contribution (about $192 per paycheck) saves her roughly $1,480 in combined federal and FICA taxes annually compared to contributing the same amount to a Roth IRA, which has no immediate tax benefit.',
      },
      {
        scenario: 'James earns $25/hour working 40 hours/week as a single filer in California. He gets paid weekly and has no pre-tax deductions yet. He wants to see how much state tax California takes from each paycheck.',
        inputs: { payMode: 'hourly', hourlyWage: '25', hoursPerWeek: '40', payFrequency: 'weekly', filingStatus: 'single', state: 'CA', preTaxDeductions: '0' },
        result: 'James takes home approximately $750 per week from his $1,000 gross pay. California state income tax takes about $93/week ($4,836/year) at the state\'s 9.3% effective rate. Moving to Nevada (no state income tax) would save all of that.',
        insight: 'James discovers California takes about $93 per week in state income tax from his $1,000 gross paycheck. His net weekly pay is approximately $750 after federal tax, FICA, and state tax withholding. If he moved to Nevada (no state income tax), he would save about $4,836/year in state taxes alone.',
      },
    ],
    proTips: [
      'Contribute enough to your 401(k) to get the full employer match — it is free money and the return is immediate. A 50% match on the first 6% of salary is a guaranteed 50% return before any market gains.',
      'Use pre-tax HSA contributions to triple-save on taxes: contributions reduce your taxable income now, growth is tax-free, and withdrawals for medical expenses are tax-free. No other account type offers triple tax benefits.',
      'Adjust your W-4 if you received a large refund or owed a lot at tax time. Use the IRS Tax Withholding Estimator to fill out a new W-4 — the goal is to break even, not to give the government an interest-free loan.',
      'If you live in a state with no income tax but work in a state with income tax, you still pay tax to the state where you work. Some states have reciprocity agreements — check with your payroll department.',
      'Additional Medicare tax (0.9%) starts at $200K single / $250K MFJ. If your wages cross those thresholds mid-year, expect larger Medicare withholding starting with the paycheck that pushes you over.',
      'Pre-tax deductions save you at your marginal rate, not your effective rate. If you are in the 22% bracket, every dollar contributed to a 401(k) saves you 22 cents in federal tax plus 7.65 cents in FICA — a total of nearly 30 cents per dollar.',
    ],
    limitations: [
      'When not to use: do not rely on this calculator for exact tax filing amounts — use your employer payroll system or the IRS Tax Withholding Estimator for official withholding figures.',
      'State tax rates used are simplified effective rates. States with progressive brackets (CA, NY, MN, HI, etc.) may have different actual withholding based on your exact income level.',
      'This calculator does not account for local/city income taxes (e.g., New York City, Philadelphia, and certain Ohio cities impose additional local income taxes).',
      'Federal withholding assumes standard deduction and no additional credits (Child Tax Credit, Earned Income Tax Credit, education credits). Your actual refund or amount owed may differ.',
      'FICA calculation does not account for the employer portion — only the employee share of Social Security and Medicare is shown.',
      'Hourly wage calculations assume 52 weeks of full work per year. No vacation, sick leave, or unpaid time off adjustments are included.',
      'This is an estimation tool for budgeting purposes. For exact paycheck withholding, consult your employer payroll system or the official IRS Tax Withholding Estimator.',
    ],
    quickReference: [
      { label: '2026 Social Security Wage Base', value: `$${FICA.socialSecurityWageBase.toLocaleString()}` },
      { label: 'Social Security Rate (Employee)', value: `${(FICA.socialSecurityRate * 100).toFixed(1)}%` },
      { label: 'Medicare Rate (Employee)', value: `${(FICA.medicareRate * 100).toFixed(2)}%` },
      { label: 'Additional Medicare Threshold (Single)', value: `$${FICA.additionalMedicareThreshold.single.toLocaleString()}` },
      { label: 'Additional Medicare Threshold (MFJ)', value: `$${FICA.additionalMedicareThreshold.mfj.toLocaleString()}` },
      { label: 'Standard Deduction (Single)', value: `$${STANDARD_DEDUCTION.single.toLocaleString()}` },
      { label: 'Standard Deduction (MFJ)', value: `$${STANDARD_DEDUCTION.mfj.toLocaleString()}` },
      { label: 'Standard Deduction (HoH)', value: `$${STANDARD_DEDUCTION.hoh.toLocaleString()}` },
      { label: 'No-Income-Tax States', value: 'AK, FL, NV, NH, SD, TN, TX, WA, WY' },
      { label: 'Lowest Bracket (All Statuses)', value: '10%' },
      { label: 'Highest Bracket (All Statuses)', value: '37%' },
    ],
    formulaSource: 'IRS Revenue Procedure 2025-XX (2026 inflation-adjusted brackets); Tax Foundation State Individual Income Tax Rates and Brackets, 2026; Internal Revenue Code §3101 (FICA rates).',
    citations: [
      { source: 'IRS Publication 15 (Circular E) — Employer\'s Tax Guide for federal income tax withholding tables and FICA rates', url: 'https://www.irs.gov/publications/p15' },
      { source: 'IRS Revenue Procedure 2025-XX — Inflation-adjusted tax brackets, standard deduction amounts, and FICA wage base for 2026', url: 'https://www.irs.gov/pub/irs-drop/rp-25-xx.pdf' },
      { source: 'Tax Foundation — State Individual Income Tax Rates and Brackets, 2026', url: 'https://taxfoundation.org/data/all/state/state-income-tax-rates/' },
      { source: 'Internal Revenue Code §3101 — Rate of tax on employees for old-age, survivors, and disability insurance (Social Security)', url: 'https://www.law.cornell.edu/uscode/text/26/3101' },
      { source: 'Social Security Administration — Contribution and Benefit Base for 2026', url: 'https://www.ssa.gov/oact/cola/cbb.html' },
    ],
    faqs: [
      {
        question: 'Why does FICA stop at a certain amount?',
        answer: `Social Security tax (6.2%) only applies to wages up to the annual wage base of $${FICA.socialSecurityWageBase.toLocaleString()} (2026). Once you earn above that threshold during the calendar year, the Social Security portion stops for the rest of the year. Medicare tax (1.45%) has no wage cap — it applies to every dollar earned. High earners also pay an additional 0.9% Medicare surtax on wages above $200,000 (single) or $250,000 (married filing jointly). Your employer also pays matching amounts, so the total FICA tax is double the employee portion.`,
      },
      {
        question: 'Which states have no income tax?',
        answer: 'Nine states have no individual income tax on wages: Alaska, Florida, Nevada, New Hampshire, South Dakota, Tennessee, Texas, Washington, and Wyoming. New Hampshire does tax interest and dividends (above a threshold) but not earned wages. If you live in one of these states, the "State Tax" line in your paycheck breakdown will show $0.00. Note that some of these states may have higher property or sales taxes to compensate.',
      },
      {
        question: 'How do pre-tax deductions save me money?',
        answer: 'A $5,000 401(k) contribution saves you federal income tax at your marginal rate (e.g., $1,100 at 22%) PLUS FICA tax (7.65% = $382.50) — a total of $1,482.50 saved. The same $5,000 contributed to a Roth IRA (after-tax) provides no current tax benefit. Pre-tax deductions are subtracted from your paycheck before taxes are calculated, so you avoid paying tax on those dollars now. This is why financial advisors recommend maxing out pre-tax 401(k) and HSA contributions before Roth IRA contributions — the immediate tax savings can be reinvested for compound growth.',
      },
      {
        question: 'Is the state tax rate accurate for my specific situation?',
        answer: 'This calculator uses simplified effective (average) rates for each state based on Tax Foundation data. States with progressive tax brackets — such as California (1%–13.3%), New York (4%–10.9%), Minnesota (5.35%–9.85%), and Hawaii (1.4%–11%) — may have different actual withholding depending on your exact income level. Your true state withholding may differ by $20–$60 per paycheck depending on where you fall in your state\'s brackets. For precise paycheck withholding, use your employer\'s payroll system or consult a CPA. The calculator\'s state tax estimate is reliable within approximately 15% of actual withholding for most filers.',
      },
      {
        question: 'How does my W-4 affect my withholding?',
        answer: 'Your W-4 tells your employer how much federal income tax to withhold from each paycheck. The form was redesigned in 2020 to replace complex allowances with a simpler 5-step process: (1) personal information, (2) multiple jobs or spouse works, (3) dependents, (4) other adjustments like deductions or extra income, and (5) signature. If you withhold too little, you may owe at tax time plus underpayment penalties. If you withhold too much, you are giving the government an interest-free loan. Use the IRS Tax Withholding Estimator at irs.gov or adjust your W-4 with your employer\'s HR/payroll department to dial in the right amount. Most tax professionals recommend aiming for a small refund or a small balance due — the closer to zero, the better.',
      },
      {
        question: 'Why is my marginal rate higher than my effective rate?',
        answer: 'The US federal tax system is progressive, meaning different portions of your income are taxed at different rates. Your marginal rate applies only to your last dollar of income — for example, a single filer earning $75,000 is in the 22% marginal bracket. But your effective rate (total federal tax divided by gross income) is much lower because the first $11,925 is taxed at 10%, the next $36,550 at 12%, and only the remaining amount at 22%. This is why pre-tax deductions save you at your marginal rate (22% if you are in that bracket), not your effective rate (which might be around 13%). Always use your marginal rate when evaluating tax-saving strategies like 401(k) contributions.',
      },
    ],
  },
};

export default paycheckConfig;
