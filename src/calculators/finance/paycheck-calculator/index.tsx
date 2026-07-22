import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { STANDARD_DEDUCTION, FICA, FilingStatus, calculateFederalTax } from '../../../utils/taxData';
import PaycheckPanel from './PaycheckPanel';

// ─── State Tax Data (Simplified effective rates for paycheck estimation) ──
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
    },
    {
      id: 'annualSalary',
      label: 'Annual Gross Salary',
      type: 'number',
      placeholder: '75,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      showWhen: (v) => v.payMode !== 'hourly',
      helpText: 'Your total annual salary before any taxes or deductions.',
    },
    {
      id: 'hourlyWage',
      label: 'Hourly Wage',
      type: 'number',
      placeholder: '25.00',
      prefix: '$',
      min: 0,
      step: 0.5,
      required: true,
      showWhen: (v) => v.payMode === 'hourly',
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
      required: true,
      showWhen: (v) => v.payMode === 'hourly',
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
      label: 'State of Residence',
      type: 'select',
      required: true,
      options: STATE_OPTIONS,
    },
    {
      id: 'preTaxDeductions',
      label: 'Pre-Tax Deductions (Annual)',
      type: 'number',
      placeholder: '5,000',
      prefix: '$',
      min: 0,
      step: 100,
      helpText: '401(k), health insurance, HSA, FSA, etc. These reduce both federal taxable income AND FICA wages.',
    },
  ],

  calculate: (values) => {
    const mode = (values.payMode || 'salary') as PayMode;
    const salary = parseFloat(values.annualSalary) || 0;
    const hourlyWage = parseFloat(values.hourlyWage) || 0;
    const hoursPerWeek = parseFloat(values.hoursPerWeek) || 40;
    const stateCode = values.state || 'TX';
    const status = (values.filingStatus || 'single') as FilingStatus;
    const preTaxDed = parseFloat(values.preTaxDeductions) || 0;
    const freq = (values.payFrequency || 'biweekly') as PayFreq;

    const grossAnnual = mode === 'salary' ? salary : hourlyWage * hoursPerWeek * 52;

    if (grossAnnual <= 0) return [];

    const ficaWages = Math.max(0, grossAnnual - preTaxDed);
    const fedAGI = ficaWages;
    const stdDed = STANDARD_DEDUCTION[status];
    const taxable = Math.max(0, fedAGI - stdDed);

    const fedResult = calculateFederalTax(taxable, status);

    const ss = Math.min(ficaWages, FICA.socialSecurityWageBase) * FICA.socialSecurityRate;
    const medicare = ficaWages * FICA.medicareRate;
    const threshold = status === 'mfj' ? FICA.additionalMedicareThreshold.mfj : FICA.additionalMedicareThreshold.single;
    const additionalMedicare = ficaWages > threshold ? (ficaWages - threshold) * FICA.additionalMedicareRate : 0;
    const ficaTotal = ss + medicare + additionalMedicare;

    const stateInfo = STATE_TAX[stateCode];
    const stateTax = stateInfo?.noIncomeTax ? 0 : grossAnnual * (stateInfo?.rate || 0);

    const totalTax = fedResult.totalTax + ficaTotal + stateTax;
    const netAnnual = grossAnnual - totalTax - preTaxDed;

    const freqInfo = PAY_FREQUENCIES[freq];
    const periods = freqInfo.periods;
    const netPerPaycheck = netAnnual / periods;
    const fedPerPaycheck = fedResult.totalTax / periods;
    const ficaPerPaycheck = ficaTotal / periods;
    const statePerPaycheck = stateTax / periods;
    const deductionsPerPaycheck = preTaxDed / periods;

    const effectiveRate = (fedResult.totalTax / grossAnnual) * 100;
    const totalEffectiveRate = (totalTax / grossAnnual) * 100;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
        label: 'Net Pay (Annual)',
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
        label: 'Federal Marginal Tax Rate',
        value: `${(fedResult.marginalRate * 100).toFixed(0)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'effectiveRate',
        label: 'Federal Effective Tax Rate',
        value: `${effectiveRate.toFixed(2)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'totalEffectiveRate',
        label: 'All-In Effective Rate (Fed + FICA + State)',
        value: `${totalEffectiveRate.toFixed(2)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'grossAnnual',
        label: 'Gross Annual Income',
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
      'Your employer withholds federal income tax (based on W-4), FICA (Social Security + Medicare), and state income tax from each paycheck. Pre-tax deductions (401k, health insurance) reduce both taxable income and FICA wages.',
    variables: [
      { symbol: 'FICA', name: 'Social Security + Medicare', description: `Social Security: 6.2% on wages up to $${FICA.socialSecurityWageBase.toLocaleString()}. Medicare: 1.45% on all wages. Additional Medicare: 0.9% above $200K/$250K. Your employer matches these amounts.` },
      { symbol: 'Tax Rates', name: 'Marginal & Effective Rate', description: 'Marginal rate is the tax rate on your last dollar of income. Effective rate is total federal tax divided by gross income — always lower than the marginal rate due to progressive brackets. Both are shown in your results.' },
      { symbol: 'Pre-Tax Deduction', name: 'Income Reducer', description: '401(k), health insurance, HSA, and FSA contributions reduce your taxable income AND FICA wages dollar-for-dollar, giving you a double tax benefit.' },
    ],
    howToUse: [
      'Select Annual Salary or Hourly Wage, then enter the relevant amount and your pay frequency.',
      'Select your filing status and state of residence, then enter annual pre-tax deductions (401k, health insurance, HSA).',
      'Review the per-paycheck breakdown and pie chart to understand where your money goes.',
    ],
    commonUses: [
      'Calculate your exact take-home pay per paycheck after federal income tax, FICA, and state tax withholding for accurate budgeting.',
      'Compare how different filing statuses, states of residence, and pre-tax deductions affect your net paycheck amount.',
      'Estimate the impact of 401k and HSA contributions on your take-home pay to plan your retirement savings contributions wisely.',
    ],
    explanation:
      'Your gross pay is not what hits your bank account. Every paycheck, your employer withholds federal income tax (based on your W-4), Social Security (6.2% up to the wage base), Medicare (1.45% + 0.9% for high earners), and state income tax (0–9.3% depending on your state). Pre-tax deductions for 401(k), health insurance, HSA, and FSA reduce both your federal income tax AND your FICA taxes — they are the most tax-efficient way to save. This calculator shows exactly what each paycheck looks like after all deductions and taxes, with a visual breakdown of where every dollar goes.',
    faqs: [
      {
        question: 'Why does FICA stop at a certain amount?',
        answer: `Social Security tax (6.2%) only applies to wages up to the annual wage base of $${FICA.socialSecurityWageBase.toLocaleString()} (2026). Once you earn above that, the Social Security portion stops for the rest of the year. Medicare tax (1.45%) has no wage cap — it applies to every dollar earned. High earners also pay an additional 0.9% Medicare surtax on wages above $200,000 (single) or $250,000 (MFJ).`,
      },
      {
        question: 'Which states have no income tax?',
        answer: 'Eight states have no individual income tax: Alaska, Florida, Nevada, South Dakota, Tennessee, Texas, Washington, and Wyoming. New Hampshire has no tax on earned wages (only interest/dividends). If you live in one of these states, the "State Tax" line in your paycheck breakdown will be $0.',
      },
      {
        question: 'How do pre-tax deductions save me money?',
        answer: 'A $5,000 401(k) contribution saves you federal income tax at your marginal rate (e.g., $1,100 at 22%) PLUS FICA tax (7.65% = $382.50) — a total of $1,482.50 saved. The same $5,000 contributed to a Roth IRA (after-tax) provides no current tax benefit. This is why financial advisors recommend maxing out pre-tax 401(k) before Roth IRA contributions.',
      },
      {
        question: 'Is the state tax rate accurate?',
        answer: 'This calculator uses simplified flat/effective rates for each state. States with progressive brackets (CA, NY, MN, etc.) may have different actual amounts depending on your income level. For precise paycheck withholding, use your employer\'s payroll system or the IRS Tax Withholding Estimator.',
      },
      {
        question: 'How does my W-4 affect my withholding?',
        answer: 'Your W-4 tells your employer how much federal income tax to withhold from each paycheck. The form was redesigned in 2020 to replace allowances with a simpler 5-step process. If you withhold too little, you may owe at tax time plus penalties. If you withhold too much, you are giving the government an interest-free loan. Use the IRS Tax Withholding Estimator or adjust your W-4 with your employer to dial in the right amount.',
      },
    ],
  },
};

export default paycheckConfig;
