import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import IncomeTaxPanel from './IncomeTaxPanel';
import {
  FilingStatus,
  STANDARD_DEDUCTIONS_2025,
  STATE_RATES_2025,
  computeIncomeTax,
  RETIREMENT_LIMITS_2025,
} from './taxData';

const STATE_OPTIONS = Object.entries(STATE_RATES_2025)
  .sort((a, b) => a[1].name.localeCompare(b[1].name))
  .map(([code, info]) => ({
    label: `${info.name}${info.noIncomeTax ? ' (No Income Tax)' : ''}`,
    value: code,
  }));

const incomeTaxSvg = '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="4"/><text x="160" y="14" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Paycheck Breakdown</text><rect x="15" y="24" width="290" height="20" rx="4" fill="var(--svg-e2e8f0)"/><text x="160" y="38" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-475569)">Gross Income: $75,000</text><rect x="15" y="50" width="30" height="18" rx="3" fill="var(--svg-3b82f6)"/><text x="30" y="62" text-anchor="middle" font-size="6" font-weight="bold" fill="var(--svg-ffffff)">401k</text><rect x="48" y="50" width="70" height="18" rx="3" fill="var(--svg-ef4444)"/><text x="83" y="62" text-anchor="middle" font-size="7" font-weight="bold" fill="var(--svg-ffffff)">Federal $8,350</text><rect x="122" y="50" width="45" height="18" rx="3" fill="var(--svg-f59e0b)"/><text x="144" y="62" text-anchor="middle" font-size="6" font-weight="bold" fill="var(--svg-ffffff)">FICA</text><rect x="171" y="50" width="30" height="18" rx="3" fill="var(--svg-8b5cf6)"/><text x="186" y="62" text-anchor="middle" font-size="6" font-weight="bold" fill="var(--svg-ffffff)">State</text><rect x="205" y="50" width="100" height="18" rx="3" fill="var(--svg-22c55e)"/><text x="255" y="62" text-anchor="middle" font-size="7" font-weight="bold" fill="var(--svg-ffffff)">Take-Home</text><rect x="15" y="78" width="290" height="55" rx="6" fill="var(--svg-f1f5f9)"/><text x="160" y="93" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-1e293b)">Progressive Tax Brackets (2025 Single)</text><rect x="25" y="98" width="50" height="14" rx="3" fill="var(--svg-22c55e)"/><text x="50" y="108" text-anchor="middle" font-size="6" font-weight="bold" fill="var(--svg-ffffff)">10%</text><text x="80" y="108" font-size="6" fill="var(--svg-64748b)">$0-$11,925</text><rect x="145" y="98" width="50" height="14" rx="3" fill="var(--svg-3b82f6)"/><text x="170" y="108" text-anchor="middle" font-size="6" font-weight="bold" fill="var(--svg-ffffff)">12%</text><text x="200" y="108" font-size="6" fill="var(--svg-64748b)">$11,926-$48,475</text><rect x="25" y="114" width="50" height="14" rx="3" fill="var(--svg-f59e0b)"/><text x="50" y="124" text-anchor="middle" font-size="6" font-weight="bold" fill="var(--svg-ffffff)">22%</text><text x="80" y="124" font-size="6" fill="var(--svg-64748b)">$48,476-$103,350</text><rect x="15" y="140" width="290" height="28" rx="6" fill="var(--svg-f1f5f9)"/><text x="85" y="152" font-size="7" fill="var(--svg-f59e0b)">Marginal: 22%</text><text x="160" y="152" text-anchor="middle" font-size="6" fill="var(--svg-64748b)">|</text><text x="235" y="152" font-size="7" fill="var(--svg-22c55e)">Effective: ~11%</text><text x="160" y="163" text-anchor="middle" font-size="6" fill="var(--svg-64748b)">You only pay each bracket rate on income within that bracket</text><rect x="15" y="174" width="290" height="20" rx="6" fill="var(--svg-f1f5f9)"/><text x="160" y="188" text-anchor="middle" font-size="7" fill="var(--svg-475569)">Net Pay = Gross - Federal - FICA - State - Pre-Tax Deductions</text></svg>';

const incomeTaxConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'grossIncome',
      label: 'Gross Annual Income',
      type: 'number',
      placeholder: '75,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
    },
    {
      id: 'filingStatus',
      label: 'Filing Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Single', value: 'single' },
        { label: 'Married Filing Jointly', value: 'mfj' },
        { label: 'Married Filing Separately', value: 'mfs' },
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
      id: 'retirement401k',
      label: 'Pre-Tax 401(k) / 403(b) Contributions',
      type: 'number',
      placeholder: '6,000',
      prefix: '$',
      min: 0,
      max: RETIREMENT_LIMITS_2025.traditional401k + RETIREMENT_LIMITS_2025.superCatchUp401k,
      step: 500,
      helpText: `2026 limit: $${RETIREMENT_LIMITS_2025.traditional401k.toLocaleString()}; $${(RETIREMENT_LIMITS_2025.traditional401k + RETIREMENT_LIMITS_2025.catchUp401k).toLocaleString()} if age 50+; $${(RETIREMENT_LIMITS_2025.traditional401k + RETIREMENT_LIMITS_2025.superCatchUp401k).toLocaleString()} if age 60-63. Reduces income tax but not Social Security/Medicare tax.`,
    },
    {
      id: 'healthInsurance',
      label: 'Health Insurance Premiums (Annual)',
      type: 'number',
      placeholder: '3,000',
      prefix: '$',
      min: 0,
      step: 100,
      helpText: 'Employer-sponsored pre-tax health insurance premiums reduce FICA and federal tax',
    },
    {
      id: 'otherPreTax',
      label: 'Other Pre-Tax Deductions',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      inputMode: 'decimal',
      min: 0,
      step: 100,
      helpText: 'Payroll-deducted HSA contributions, health FSA and dependent care FSA. These reduce both income tax and FICA. (A deductible IRA contribution only reduces income tax and is not included here.)',
    },
  ],
  calculate: (values) => {
    const gross = parseFloat(values.grossIncome);
    const status = (values.filingStatus || 'single') as FilingStatus;
    const stateCode = values.state || 'TX';
    const retirement401k = parseFloat(values.retirement401k) || 0;
    const health = parseFloat(values.healthInsurance) || 0;
    const otherPreTax = parseFloat(values.otherPreTax) || 0;

    if (isNaN(gross) || gross <= 0) return [];

    const t = computeIncomeTax({ gross, status, stateCode, retirement401k, health, otherPreTax });
    const { standardDeduction, taxableIncome, federalTax, marginalRate, ficaTotal, stateInfo, stateRate, stateTax, totalTax, netPay, effectiveRate, totalEffectiveRate } = t;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return [
      {
        id: 'netPay',
        label: 'Estimated Take-Home Pay (Annual)',
        value: `$${fmt(netPay)}`,
        highlight: true,
        color: 'positive' as const,
        interpretation: `You keep ${((netPay / Math.max(gross, 1)) * 100).toFixed(0)}¢ of every dollar earned. Your top bracket is ${(marginalRate * 100).toFixed(0)}%, but your all-in effective rate is only ${totalEffectiveRate.toFixed(1)}% — only income above each bracket threshold is taxed at the higher rate, so a raise never reduces your take-home pay.${stateInfo?.noIncomeTax ? ` ${stateInfo.name} has no state income tax, which boosts your net pay versus most states.` : ''}`,
      },
      {
        id: 'netMonthly',
        label: 'Take-Home Pay (Monthly)',
        value: `$${fmt(netPay / 12)}/mo`,
        color: 'positive' as const,
      },
      {
        id: 'netBiweekly',
        label: 'Take-Home Pay (Bi-Weekly)',
        value: `$${fmt(netPay / 26)}/paycheck`,
        color: 'positive' as const,
      },
      {
        id: 'federalTax',
        label: 'Federal Income Tax',
        value: `$${fmt(federalTax)} (${((federalTax / gross) * 100).toFixed(1)}% of gross)`,
        color: 'negative' as const,
      },
      {
        id: 'ficaTotal',
        label: 'FICA (Social Security + Medicare)',
        value: `$${fmt(ficaTotal)}`,
        color: 'negative' as const,
      },
      {
        id: 'stateTax',
        label: `${stateInfo?.name || stateCode} State Income Tax`,
        value: stateInfo?.noIncomeTax
          ? 'No state income tax'
          : `$${fmt(stateTax)} (${(stateRate * 100).toFixed(2)}% effective rate)`,
        color: stateInfo?.noIncomeTax ? 'positive' as const : 'negative' as const,
      },
      {
        id: 'marginalRate',
        label: 'Federal Marginal Tax Rate (Top Bracket)',
        value: `${(marginalRate * 100).toFixed(0)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'effectiveRate',
        label: 'Federal Effective Tax Rate (Actual % of Gross)',
        value: `${effectiveRate.toFixed(2)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'totalEffectiveRate',
        label: 'All-In Effective Tax Rate (Federal + FICA + State)',
        value: `${totalEffectiveRate.toFixed(2)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'taxableIncome',
        label: 'Federal Taxable Income (After Standard Deduction)',
        value: `$${fmt(taxableIncome)} (Std. Deduction: $${fmt(standardDeduction)})`,
        color: 'neutral' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    const gross = parseFloat(values.grossIncome);
    const status = (values.filingStatus || 'single') as FilingStatus;
    const stateCode = values.state || 'TX';
    const retirement401k = parseFloat(values.retirement401k) || 0;
    const health = parseFloat(values.healthInsurance) || 0;
    const otherPreTax = parseFloat(values.otherPreTax) || 0;

    if (!results.length || isNaN(gross) || gross <= 0) return null;

    return createElement(IncomeTaxPanel, {
      gross, status, stateCode, retirement401k, health, otherPreTax,
    });
  },
  educational: {
    formula: 'Net Pay = Gross Income − Federal Tax − FICA − State Tax − Pre-Tax Deductions',
    diagram: {
      svg: incomeTaxSvg,
      alt: 'Income tax diagram showing gross income split into segments for 401k, federal tax $8,350, FICA, state tax, and take-home pay with progressive tax bracket annotations',
      caption: 'Federal income tax uses progressive marginal brackets where only the income within each bracket is taxed at that rate, making the effective rate lower than the marginal rate',
    },
    formulaDescription:
      'Federal income tax is calculated using progressive marginal brackets on taxable income (after the standard deduction). FICA is calculated on earned wages. State tax applies each state\'s flat rate (or a rough effective rate for graduated-rate states) to federal AGI, as an estimate.',
    variables: [
      { symbol: 'AGI', name: 'Adjusted Gross Income', description: 'Gross income minus above-the-line deductions (401k, health insurance, HSA). This is the starting point for calculating taxable income.' },
      { symbol: 'Taxable Income', name: 'Taxable Income', description: 'AGI minus the standard deduction. Federal income tax brackets are applied to this number.' },
      { symbol: 'Tax Rates', name: 'Marginal & Effective Tax Rates', description: 'Marginal rate is the tax rate on your last dollar of income (your highest bracket). Effective rate is total federal tax divided by gross income — always lower than the marginal rate due to progressive brackets. Together they show both the cost of earning more and your true tax burden.' },
    ],
    howToUse: [
      'Enter your gross annual income and select your filing status — married filing jointly typically has lower rates.',
      'Select your state of residence to include state income tax, and enter pre-tax contributions (401k, health insurance) which reduce your taxable income.',
      'Review results showing your take-home pay, marginal vs. effective tax rates, and full breakdown of federal, FICA, and state taxes.',
    ],
    commonUses: [
      'Estimate your annual federal income tax liability and effective tax rate based on your income, filing status, and deductions.',
      'Compare the tax impact of different filing statuses to understand how marriage or head-of-household status affects your taxes.',
      'Plan pre-tax retirement contributions by seeing how much 401k and HSA contributions lower your taxable income and tax bill.',
    ],
    explanation:
      'The US federal income tax system is progressive — higher income is taxed at higher rates, but only for the income within each bracket. If you\'re in the 22% bracket, you don\'t pay 22% on all your income — you pay 10% on the first portion, 12% on the next, and only 22% on the income that falls in that bracket. This is why the "effective rate" is always lower than the "marginal rate." Pre-tax 401(k) contributions reduce your taxable income (but not your Social Security and Medicare wages), while employer health premiums and payroll HSA/FSA contributions reduce both, making all of them valuable.',
    faqs: [
      {
        question: 'What is the difference between marginal and effective tax rate?',
        answer: 'Your marginal rate is the rate on your last dollar of income (your bracket). Your effective rate is the total tax divided by total income — it\'s the actual percentage of your income paid in taxes. A $75,000 single filer with just the standard deduction is in the 22% bracket for 2026, but their federal effective rate is only about 10%.',
      },
      {
        question: 'Does my 401(k) contribution really reduce my taxes?',
        answer: 'Yes. A traditional 401(k) contribution reduces your federal AGI dollar-for-dollar. At a 22% marginal rate, a $10,000 contribution saves $2,200 in federal taxes. It does not reduce Social Security or Medicare taxes, because 401(k) deferrals are still FICA wages.',
      },
      {
        question: 'What is FICA?',
        answer: 'FICA stands for Federal Insurance Contributions Act. It funds Social Security (6.2% on wages up to $184,500 in 2026) and Medicare (1.45% on all wages, plus 0.9% additional Medicare tax on wages over $200,000 for single filers). Your employer pays a matching 6.2% + 1.45%.',
      },
      {
        question: 'Are state income tax rates accurate?',
        answer: 'This calculator uses a simplified effective rate for states with graduated brackets. Actual state taxes depend on state-specific deductions, credits, and income levels. For precise state tax, consult your state\'s tax authority or a tax professional.',
      },
      {
        question: 'Should I take the standard deduction or itemize?',
        answer: 'The standard deduction for 2026 is $16,100 for single filers and $32,200 for married couples filing jointly. You should itemize only if your total itemizable deductions (mortgage interest, state and local taxes up to $10,000, charitable contributions, and medical expenses exceeding 7.5% of AGI) exceed the standard deduction. For most taxpayers, the standard deduction yields a lower tax bill, especially after the Tax Cuts and Jobs Act nearly doubled standard deduction amounts. If you own a home with a large mortgage, donate significantly to charity, or have large medical bills, itemizing may be better.',
      },
    ],
  
    workedExamples: [
      {
        scenario: 'Jake, a single 29-year-old graphic designer in Dallas, TX, earns $75,000/year. He contributes $6,000 to his 401(k) and pays $3,000/year in health insurance premiums (pre-tax). He has no other pre-tax deductions. Texas has no state income tax.',
        inputs: { grossIncome: '75000', filingStatus: 'single', state: 'TX', retirement401k: '6000', healthInsurance: '3000', otherPreTax: '0' },
        result: 'Federal taxable income: $49,900 ($75,000 − $6,000 − $3,000 = $66,000 AGI − $16,100 standard deduction). Federal income tax: approximately $5,740. FICA: $5,508 (SS: $4,464 on $72,000 FICA wages + Medicare: $1,044). Total tax: $11,248. Annual take-home pay: $54,752 ($4,563/month, $2,106 biweekly). Federal marginal rate: 12%. Federal effective rate: 7.7%. All-in effective rate: 15.0%.',
        insight: 'Jake keeps about 73 cents of every dollar he earns after all taxes and pre-tax deductions. His taxable income of $49,900 falls entirely within the 12% bracket (which runs up to $50,400 for single filers in 2026), so his federal effective rate is only 7.7% — the progressive brackets tax the first $12,400 at 10% and the rest at 12%, with none of his income reaching the 22% bracket. His $6,000 401(k) contribution reduces his taxable income dollar-for-dollar, saving him $720 in federal taxes (12% × $6,000). Note that 401(k) contributions do NOT reduce FICA wages (only health insurance and HSA do) — his FICA wages are $72,000. Living in no-income-tax Texas saves him roughly $3,000-$4,000 annually compared to a high-tax state like California or New York.',
      },
      {
        scenario: 'Emily and Ryan Thompson in Portland, OR file married jointly with a combined income of $185,000. They each contribute $10,000 to their 401(k)s ($20,000 total) and pay $6,000/year in health insurance premiums. Ryan also contributes $4,000 to an HSA. Oregon has an effective state rate of approximately 7.7%.',
        inputs: { grossIncome: '185000', filingStatus: 'mfj', state: 'OR', retirement401k: '20000', healthInsurance: '6000', otherPreTax: '4000' },
        result: 'Federal taxable income: $122,800 ($185,000 − $20,000 − $6,000 − $4,000 = $155,000 AGI − $32,200 MFJ standard deduction). Federal income tax: approximately $16,440. FICA: $13,388 (SS: $10,850 on $175,000 FICA wages + Medicare: $2,538). Oregon state tax: approximately $11,935 (7.7% of $155,000 AGI). Total tax: $41,763. Annual take-home pay: $113,238 ($9,436/month). Federal marginal rate: 22%. Federal effective rate: 8.9%. All-in effective rate: 22.6%.',
        insight: 'The Thompsons\' combined all-in tax rate of 22.6% is driven significantly by FICA ($13,388) and Oregon\'s state income tax ($11,935), which together exceed their federal tax bill. Their pre-tax deductions are a powerful tax shield: the $30,000 in combined 401(k), health insurance, and HSA contributions reduce their federal AGI by that full amount, saving approximately $6,600 in federal taxes (22% × $30,000). At a 22% federal marginal rate, every additional dollar of traditional 401(k) contribution saves $0.22 in federal tax — an immediate 22% return before any investment growth. For high-income couples in high-tax states, maximizing pre-tax contributions is the single most impactful tax strategy available.',

      },
    ],

    proTips: [
      'Pre-tax 401(k) contributions reduce your taxable income dollar-for-dollar (they do not reduce FICA wages). At a 22% marginal rate, a $10,000 contribution saves $2,200 in federal tax, plus your state tax rate on the same amount, before any investment gains. Pre-tax health premiums do save FICA too: $1,000 of premiums saves $76.50 in payroll tax on top of the income tax.',
      'Your "all-in" effective rate (federal + FICA + state) is the number that matters for budgeting, not your marginal bracket. A single filer earning $100,000 is in the 22% bracket but pays only about 21% in federal income tax plus FICA combined (before any state tax), not 22% + 7.65%. Understanding this difference prevents overestimating your tax burden.',
      'If you live in a no-income-tax state (TX, FL, NV, WA, TN, SD, WY, AK, NH), you can save several percent of your income (up to roughly 10% in the highest-tax states) compared to high-tax states. This calculator lets you model "what if I moved" scenarios — the difference can be thousands per year, which is why state tax rates influence relocation decisions for remote workers.',
      'Health insurance premiums deducted from your paycheck are pre-tax for both federal income tax AND FICA. This dual tax benefit makes employer-sponsored health insurance one of the most tax-efficient ways to pay for healthcare — even more tax-advantaged than many people realize.',
    ],

    quickReference: [
      { label: '2026 Standard Deduction (Single)', value: '$16,100 — reduces taxable income with no itemization required' },
      { label: '2026 Standard Deduction (MFJ)', value: '$32,200 — married filing jointly' },
      { label: '2026 Standard Deduction (HoH)', value: '$24,150 — head of household' },
      { label: 'Social Security Tax (2026)', value: '6.2% on wages up to $184,500 (wage base limit)' },
      { label: 'Medicare Tax', value: '1.45% on all wages + 0.9% additional on wages above $200K (single) / $250K (MFJ)' },
      { label: '2026 401(k) Limit (Under 50)', value: '$24,500 — pre-tax or Roth contributions' },
      { label: '2026 401(k) Limit (50+)', value: '$32,500 — includes $8,000 catch-up ($35,750 for ages 60-63)' },
      { label: 'Marginal vs Effective Rate', value: 'Marginal = rate on last dollar. Effective = total tax ÷ gross income (always lower due to progressive brackets)' },
    ],

    limitations: [
      'State income tax is a simplified estimate: one rate applied to federal AGI (flat-rate states use their 2026 rate; graduated states use a rough effective rate for a typical income), with no state deductions or exemptions. Many states have graduated brackets with multiple rates, standard deductions, and personal exemptions. The calculator\'s state estimate is approximate — for precise state tax planning, use your state\'s official tax calculator or consult a tax preparer.',
      'It does not model tax credits (Child Tax Credit, Earned Income Tax Credit, education credits, saver\'s credit), itemized deductions (mortgage interest, charitable contributions, SALT capped at $10,000), or above-the-line deductions beyond the pre-tax categories provided. Real tax liability may be significantly lower if you qualify for credits.',
      'FICA calculation applies the Social Security wage base cap ($184,500 in 2026) but does not account for multiple jobs (where each employer withholds separately, potentially causing over-withholding that is refunded at tax time). Additional Medicare tax applies above $200K (single) / $250K (MFJ).',
      'This calculator assumes all income is W-2 wage income. Self-employment income, investment income (capital gains, dividends, interest), rental income, and retirement distributions are taxed differently and are not modeled. Self-employed individuals must pay both the employee and employer portions of FICA (15.3% total on the first $184,500).',
    ],
citations: [
    { source: 'IRS Publication 17', url: 'https://www.irs.gov/publications/p17' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/i/incometax.asp' },
  ],
  },
};

export default incomeTaxConfig;
