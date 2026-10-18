import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { STANDARD_DEDUCTION, FICA } from '../../../utils/taxData';
import { STATE_INCOME_TAX, STATE_INCOME_TAX_YEAR, hasNoWageTax } from '../../../utils/stateTax';
import PaycheckPanel from './PaycheckPanel';
import { computePaycheck, PAY_FREQUENCIES } from './paycheckMath';

const STATE_OPTIONS = Object.entries(STATE_INCOME_TAX)
  .sort((x, y) => x[1].name.localeCompare(y[1].name))
  .map(([code, info]) => ({
    label: `${info.name}${hasNoWageTax(code) ? ' (No Tax on Wages)' : ''}`,
    value: code,
  }));

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
      helpText: `The state where you live and work. Nine states do not tax wages. State tax uses the ${STATE_INCOME_TAX_YEAR} state rate schedule and standard deduction (personal exemptions, credits and local taxes are not included).`,
    },
    {
      id: 'retirementContributions',
      label: 'Pre-Tax Retirement Contributions (Annual)',
      type: 'number',
      placeholder: '5,000',
      prefix: '$',
      min: 0,
      step: 100,
      inputMode: 'decimal',
      helpText: 'Traditional 401(k), 403(b), or similar deferrals. These reduce federal and state taxable income but NOT Social Security or Medicare (FICA) wages.',
    },
    {
      id: 'preTaxDeductions',
      label: 'Pre-Tax Benefits: Health, HSA, FSA (Annual)',
      type: 'number',
      placeholder: '2,000',
      prefix: '$',
      min: 0,
      step: 100,
      inputMode: 'decimal',
      helpText: 'Health insurance premiums, HSA and FSA contributions taken through payroll (Section 125 plan). These reduce income tax AND FICA wages.',
    },
  ],

  calculate: (values) => {
    const c = computePaycheck(values);
    if (!c) return [];

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const per = (n: number) => n / c.periods;
    const freqInfo = PAY_FREQUENCIES[c.freq];
    const takeHomePct = (c.netAnnual / c.grossAnnual) * 100;
    const totalEffectiveRate = (c.totalTax / c.grossAnnual) * 100;
    const effectiveRate = (c.fed.totalTax / c.grossAnnual) * 100;
    const deductions = c.retirement + c.benefits;

    const results: CalculatorResult[] = [
      {
        id: 'netPaycheck',
        label: `Net Pay (${freqInfo.label})`,
        value: `$${fmt(per(c.netAnnual))}`,
        highlight: true,
        color: 'positive' as const,
        interpretation: `You take home about ${takeHomePct.toFixed(0)}% of gross — the rest is federal, state, and FICA tax plus any pre-tax deductions. Withholding is an estimate the IRS trues up at filing; if you consistently owe or get a big refund, adjust your W-4 rather than waiting for tax season.`,
      },
      {
        id: 'netAnnual',
        label: `Net Pay (Annual)`,
        value: `$${fmt(c.netAnnual)}`,
        color: 'positive' as const,
      },
      {
        id: 'fedPerPaycheck',
        label: `Federal Income Tax / ${c.freq}`,
        value: `$${fmt(per(c.fed.totalTax))}`,
        color: 'negative' as const,
      },
      {
        id: 'ficaPerPaycheck',
        label: `FICA (SS + Medicare) / ${c.freq}`,
        value: `$${fmt(per(c.fica))}`,
        color: 'negative' as const,
      },
      {
        id: 'statePerPaycheck',
        label: c.noStateTax ? `State Income Tax / ${c.freq}` : `${c.stateName} Tax / ${c.freq}`,
        value: c.noStateTax ? '$0.00 (No state income tax on wages)' : `$${fmt(per(c.stateTax))}`,
        color: c.noStateTax ? 'positive' as const : 'negative' as const,
      },
      {
        id: 'marginalRate',
        label: `Federal Marginal Tax Rate`,
        value: `${(c.fed.marginalRate * 100).toFixed(0)}%`,
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
        value: `$${fmt(c.grossAnnual)}`,
        color: 'neutral' as const,
      },
    ];

    if (deductions > 0) {
      results.push({
        id: 'deductions',
        label: `Pre-Tax Deductions / ${c.freq}`,
        value: `$${fmt(per(deductions))}`,
        color: 'neutral' as const,
      });
    }

    if (c.retirementClamped) {
      results.push({
        id: 'deferralLimited',
        label: 'Retirement Deferral Limited',
        value: `$${fmt(c.retirement)}/yr applied (you entered $${fmt(c.retirementRequested)})`,
        color: 'negative' as const,
        interpretation: 'A deferral cannot be larger than the pay left after the payroll taxes (FICA and any income tax) owed on that pay, so the amount was reduced until net pay is zero. Check the amount you entered.',
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
      'Your employer withholds federal income tax (based on W-4 withholding), FICA (Social Security 6.2% + Medicare 1.45%), and state income tax from each paycheck. Pre-tax 401(k) deferrals reduce your income-taxable wages; payroll health premiums, HSA and FSA contributions (Section 125 benefits) reduce both income-taxable wages and FICA wages, so those carry the extra 7.65% savings.',
    diagram: {
      svg: '<svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="380" height="200" rx="12" fill="#f8faf7" stroke="#c4d4b0" stroke-width="2"/><text x="200" y="38" text-anchor="middle" font-size="14" font-weight="700" fill="#2d5016">Where Your Gross Pay Goes</text><rect x="40" y="60" width="180" height="130" rx="6" fill="#5b8c2a"/><text x="130" y="90" text-anchor="middle" font-size="12" font-weight="600" fill="#fff">Net Take-Home Pay</text><text x="130" y="110" text-anchor="middle" font-size="18" font-weight="700" fill="#fff">~77%</text><rect x="230" y="60" width="50" height="130" rx="6" fill="#d97845"/><text x="255" y="90" text-anchor="middle" font-size="10" font-weight="600" fill="#fff">Federal</text><text x="255" y="108" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">~10%</text><rect x="290" y="60" width="40" height="130" rx="6" fill="#c44e2f"/><text x="310" y="90" text-anchor="middle" font-size="9" font-weight="600" fill="#fff">FICA</text><text x="310" y="108" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">~8%</text><rect x="340" y="60" width="35" height="130" rx="6" fill="#b5a642"/><text x="357" y="90" text-anchor="middle" font-size="8" font-weight="600" fill="#fff">State</text><text x="357" y="108" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">~5%</text><rect x="40" y="198" width="18" height="8" rx="2" fill="#5b8c2a"/><text x="65" y="206" font-size="9" fill="#555">Take-Home</text><rect x="130" y="198" width="18" height="8" rx="2" fill="#d97845"/><text x="155" y="206" font-size="9" fill="#555">Fed Tax</text><rect x="220" y="198" width="18" height="8" rx="2" fill="#c44e2f"/><text x="245" y="206" font-size="9" fill="#555">FICA</text><rect x="300" y="198" width="18" height="8" rx="2" fill="#b5a642"/><text x="325" y="206" font-size="9" fill="#555">State</text></svg>',
      alt: 'Horizontal stacked bar chart showing an illustrative paycheck breakdown: about 77% net take-home pay, 10% federal income tax, 8% FICA, and 5% state income tax.',
      caption: 'Illustrative breakdown for a single filer earning $75,000/year in a state with a roughly 5% income tax (2026 federal rules). Actual percentages vary with income, filing status, state, and pre-tax deductions.',
    },
    variables: [
      { symbol: 'FICA', name: 'Social Security + Medicare', description: `Social Security: 6.2% on wages up to $${FICA.socialSecurityWageBase.toLocaleString()}. Medicare: 1.45% on all wages. Additional Medicare: 0.9% above $200K single / $250K MFJ. Your employer matches the Social Security and regular Medicare amounts, so the total FICA tax is double what you see on your pay stub.` },
      { symbol: 'Tax Rates', name: 'Marginal & Effective Rate', description: 'Marginal rate is the tax rate on your last dollar of income — use this for evaluating the tax savings of pre-tax deductions. Effective rate is total federal tax divided by gross income and is always lower than marginal due to progressive brackets.' },
      { symbol: 'Pre-Tax Deduction', name: 'Income Reducer', description: 'Traditional 401(k) deferrals reduce your income-taxable wages dollar-for-dollar but NOT your FICA wages: a $5,000 deferral at a 22% bracket saves $1,100 of federal income tax. Payroll health premiums, HSA and FSA contributions reduce income-taxable wages AND FICA wages: $5,000 of those saves $1,100 plus $382.50 of FICA, $1,482.50 in total.' },
    ],
    howToUse: [
      'Select Annual Salary or Hourly Wage as your pay type, then enter the relevant amount.',
      'Choose your IRS filing status (Single, Married Filing Jointly, or Head of Household) and your state of residence from the dropdown.',
      'Enter annual pre-tax retirement deferrals (401(k)/403(b)) and, separately, pre-tax benefits such as health insurance premiums, HSA, or FSA contributions.',
      'Review the per-paycheck breakdown showing exactly where each dollar goes, and the pie chart for a visual overview.',
    ],
    commonUses: [
      'Calculate your exact take-home pay per paycheck after federal income tax, FICA, and state tax withholding for accurate monthly budgeting.',
      'Compare how different filing statuses, states of residence, and pre-tax deduction levels affect your net paycheck amount.',
      'Estimate the real impact of 401(k) and HSA contributions on your take-home pay — a $500/month 401(k) contribution reduces your take-home pay by only about $390 in the 22% federal bracket (about $440 in the 12% bracket), because the contribution lowers your income tax.',
      'Plan a job change or relocation by comparing take-home pay in different states, accounting for varying state income tax rates.',
    ],
    explanation:
      'Your gross pay and your take-home pay are two very different numbers. The United States introduced payroll tax withholding in the 20th century during World War II in 1943 under the Current Tax Payment Act, transforming tax collection from an annual lump-sum system to the per-paycheck method we know today. Social Security payroll taxes were first collected in 1937 following the Social Security Act of 1935, and Medicare taxes began in 1966 after the program was enacted in 1965 under President Lyndon B. Johnson. Every paycheck, your employer withholds federal income tax (based on your W-4 form), Social Security tax of 6.2% (up to the annual wage base), Medicare tax of 1.45% (plus 0.9% for high earners above $200K single / $250K MFJ), and state income tax that ranges from 0% in no-tax states to over 9% in high-tax states. On top of withholding, pre-tax deductions lower your taxable income: traditional 401(k) deferrals reduce income tax only, while payroll health premiums, HSA and FSA contributions also escape the 7.65% FICA tax, so a dollar of those can save you 30 cents or more in combined federal taxes at the 22% bracket. This calculator shows you exactly what each paycheck looks like after all deductions and taxes, with a full visual breakdown of where every dollar goes, so you can budget confidently and make informed decisions about your benefits elections.',
    workedExamples: [
      {
        scenario: 'Maria earns $75,000/year in Texas, files Single, gets paid bi-weekly, and defers $5,000 into her traditional 401(k). Texas has no state income tax, so her state-level tax is $0. She plugs these numbers into the calculator to see her take-home pay.',
        inputs: { payMode: 'salary', annualSalary: '75000', payFrequency: 'biweekly', filingStatus: 'single', state: 'TX', retirementContributions: '5000' },
        result: 'Maria takes home approximately $2,219 per bi-weekly paycheck after federal income tax ($6,570/yr) and FICA ($5,737.50/yr). Her $5,000 401(k) deferral (about $192/paycheck) saves $1,100 of federal income tax; it does not reduce FICA. Texas has no state income tax.',
        insight: 'Maria sees about $2,219 per bi-weekly paycheck after federal taxes and FICA. Her $5,000 401(k) deferral (about $192 per paycheck) lowers her taxable income from $58,900 to $53,900, saving $1,100 of federal income tax this year compared with a Roth contribution, which has no immediate tax benefit. Her FICA is still computed on the full $75,000.',
      },
      {
        scenario: 'James earns $25/hour working 40 hours/week as a single filer in California. He gets paid weekly and has no pre-tax deductions yet. He wants to see how much state tax California takes from each paycheck.',
        inputs: { payMode: 'hourly', hourlyWage: '25', hoursPerWeek: '40', payFrequency: 'weekly', filingStatus: 'single', state: 'CA', preTaxDeductions: '0' },
        result: 'James takes home approximately $820 per week from his $1,000 gross pay. Federal income tax is about $78/week ($4,060/year), FICA $76.50/week, and California income tax about $25/week ($1,322/year, from the 2026 California brackets and standard deduction). Moving to Nevada (no state income tax) would save that California tax.',
        insight: 'James discovers California takes about $25 per week in state income tax from his $1,000 gross paycheck, because only the income above the $5,540 state standard deduction is taxed, and mostly in the 1%-6% brackets. His net weekly pay is approximately $820 after federal tax, FICA, and state tax. If he moved to Nevada (no state income tax), he would save about $1,322/year in state taxes.',
      },
    ],
    proTips: [
      'Contribute enough to your 401(k) to get the full employer match — it is free money and the return is immediate. A 50% match on the first 6% of salary is a guaranteed 50% return before any market gains.',
      'Use pre-tax HSA contributions (through payroll) to triple-save on taxes: contributions reduce your taxable income now and skip FICA, growth is tax-free, and withdrawals for medical expenses are tax-free. No other account type offers triple tax benefits.',
      'Adjust your W-4 if you received a large refund or owed a lot at tax time. Use the IRS Tax Withholding Estimator to fill out a new W-4 — the goal is to break even, not to give the government an interest-free loan.',
      'If you live in a state with no income tax but work in a state with income tax, you still pay tax to the state where you work. Some states have reciprocity agreements — check with your payroll department.',
      'Additional Medicare tax (0.9%) starts at $200K single / $250K MFJ. If your wages cross those thresholds mid-year, expect larger Medicare withholding starting with the paycheck that pushes you over.',
      'Pre-tax deductions save you at your marginal rate, not your effective rate. In the 22% bracket every dollar deferred to a 401(k) saves 22 cents of federal income tax (FICA is still owed); every dollar of payroll health premium, HSA or FSA also saves 7.65 cents of FICA, nearly 30 cents in total.',
    ],
    limitations: [
      'Method: this is an annualised estimate, not IRS Publication 15-T per-period withholding. Annual federal tax is computed from annual wages, the standard deduction and the 2026 brackets, then divided by the number of pay periods; it does not apply the Pub. 15-T percentage-method or wage-bracket tables, W-4 Step 2-4 adjustments, or per-period rounding, so a paycheck stub can differ.',
      'A retirement deferral larger than the pay that can fund it is reduced automatically (shown in the results) so net pay is never negative.',
      'Pennsylvania taxes 401(k) deferrals (they are not excluded from PA taxable compensation per the PA Department of Revenue), so for Pennsylvania the state tax is computed on wages before retirement deferrals; payroll health premiums under a Section 125 plan are excluded, but dependent-care contributions are not. Other state schedules are applied to wages after deferrals and have not been individually verified for deferral treatment.',
      'When not to use: do not rely on this calculator for exact tax filing amounts — use your employer payroll system or the IRS Tax Withholding Estimator for official withholding figures.',
      `State income tax applies each state's ${STATE_INCOME_TAX_YEAR} rate schedule and standard deduction to your wages. State personal exemptions, credits, standard-deduction phase-outs, and state payroll taxes (CA/NJ/NY disability insurance, WA Paid Family Leave) are not included, and head-of-household uses the single schedule, so real withholding can differ.`,
      'This calculator does not account for local/city income taxes (e.g., New York City, Philadelphia, Maryland counties, and certain Ohio cities impose additional local income taxes).',
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
    formulaSource: 'IRS Revenue Procedure 2025-32 (2026 inflation-adjusted brackets and standard deduction); SSA 2026 contribution and benefit base ($184,500); Tax Foundation State Individual Income Tax Rates and Brackets, 2026; Internal Revenue Code §3101 (FICA rates).',
    citations: [
      { source: 'IRS Publication 15 (Circular E) — Employer\'s Tax Guide for federal income tax withholding tables and FICA rates', url: 'https://www.irs.gov/publications/p15' },

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
        answer: 'Nine states do not tax wages: Alaska, Florida, Nevada, New Hampshire, South Dakota, Tennessee, Texas, Washington, and Wyoming (Washington taxes only capital gains above a threshold). If you live in one of these states, the "State Tax" line in your paycheck breakdown will show $0.00. Note that some of these states may have higher property or sales taxes to compensate.',
      },
      {
        question: 'How do pre-tax deductions save me money?',
        answer: 'A $5,000 traditional 401(k) deferral saves federal income tax at your marginal rate (e.g., $1,100 at 22%); it does not reduce Social Security or Medicare tax. $5,000 of payroll health premiums, HSA or FSA contributions saves the same $1,100 PLUS FICA tax (7.65% = $382.50), a total of $1,482.50. The same $5,000 contributed to a Roth IRA (after-tax) provides no current tax benefit. Pre-tax deductions are subtracted before income tax is calculated, so you avoid tax on those dollars now, which is why many advisors suggest capturing an employer 401(k) match and funding an HSA before other savings.',
      },
      {
        question: 'Is the state tax rate accurate for my specific situation?',
        answer: 'The calculator applies each state\'s 2026 rate schedule and standard deduction (Tax Foundation, as of January 1, 2026) to your wages after pre-tax deductions, using the joint schedule for married filing jointly and the single schedule otherwise. Progressive states such as California (1%–13.3%), New York (3.9%–10.9%), Minnesota (5.35%–9.85%), and Hawaii (1.4%–11%) are taxed bracket by bracket. It does not include personal exemptions and credits, local income taxes, or state disability/family-leave payroll taxes, and an employer\'s withholding tables work differently from your final tax return, so treat the result as an estimate and use your employer\'s payroll system or a CPA for exact figures.',
      },
      {
        question: 'How does my W-4 affect my withholding?',
        answer: 'Your W-4 tells your employer how much federal income tax to withhold from each paycheck. The form was redesigned in 2020 to replace complex allowances with a simpler 5-step process: (1) personal information, (2) multiple jobs or spouse works, (3) dependents, (4) other adjustments like deductions or extra income, and (5) signature. If you withhold too little, you may owe at tax time plus underpayment penalties. If you withhold too much, you are giving the government an interest-free loan. Use the IRS Tax Withholding Estimator at irs.gov or adjust your W-4 with your employer\'s HR/payroll department to dial in the right amount. Most tax professionals recommend aiming for a small refund or a small balance due — the closer to zero, the better.',
      },
      {
        question: 'Why is my marginal rate higher than my effective rate?',
        answer: 'The US federal tax system is progressive, meaning different portions of your income are taxed at different rates. Your marginal rate applies only to your last dollar of income — for example, a single filer earning $75,000 is in the 22% marginal bracket. But your effective rate (total federal tax divided by gross income) is much lower: after the $16,100 standard deduction, the first $12,400 of taxable income is taxed at 10%, the next $38,000 at 12%, and only the remaining $8,500 at 22%, for $7,670 of tax or 10.2% of the $75,000. This is why pre-tax deductions save you at your marginal rate (22% if you are in that bracket), not your effective rate (about 10% here). Always use your marginal rate when evaluating tax-saving strategies like 401(k) contributions.',
      },
    ],
  },
};

export default paycheckConfig;
