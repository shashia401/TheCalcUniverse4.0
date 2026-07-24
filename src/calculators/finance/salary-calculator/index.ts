import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import SalaryPanel from './SalaryPanel';
import { calcFederalTax, calcFICA, STANDARD_DEDUCTIONS_2025 } from '../income-tax/taxData';

function estimateNetPay(annual: number): number {
  const deduction = STANDARD_DEDUCTIONS_2025['single'];
  const taxableIncome = Math.max(0, annual - deduction);
  const { tax: federalTax } = calcFederalTax(taxableIncome, 'single');
  const { ss, medicare } = calcFICA(annual, 'single');
  const stateEst = new Decimal(annual).times(0.045).toNumber();
  return new Decimal(annual).minus(federalTax).minus(ss).minus(medicare).minus(stateEst).toNumber();
}

const salarySvg = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="8"/><text x="160" y="20" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-1e293b)">Pay Period Conversion</text><rect x="10" y="40" width="80" height="24" rx="5" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.2"/><text x="50" y="56" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-1e40af)">$50/hr</text><line x1="90" y1="52" x2="105" y2="52" stroke="var(--svg-3b82f6)" stroke-width="1.2"/><polygon points="105,48 115,52 105,56" fill="var(--svg-3b82f6)"/><rect x="10" y="70" width="80" height="24" rx="5" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.2"/><text x="50" y="86" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-1e40af)">$8K/mo</text><line x1="90" y1="82" x2="105" y2="82" stroke="var(--svg-3b82f6)" stroke-width="1.2"/><polygon points="105,78 115,82 105,86" fill="var(--svg-3b82f6)"/><rect x="10" y="100" width="80" height="24" rx="5" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.2"/><text x="50" y="116" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-1e40af)">$2K/wk</text><line x1="90" y1="112" x2="105" y2="112" stroke="var(--svg-3b82f6)" stroke-width="1.2"/><polygon points="105,108 115,112 105,116" fill="var(--svg-3b82f6)"/><rect x="115" y="50" width="90" height="50" rx="8" fill="var(--svg-3b82f6)"/><text x="160" y="73" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-ffffff)">ANNUAL</text><text x="160" y="88" text-anchor="middle" font-size="9" fill="var(--svg-bfdbfe)">$104,000</text><line x1="205" y1="58" x2="220" y2="42" stroke="var(--svg-3b82f6)" stroke-width="1.2"/><polygon points="220,38 228,42 220,46" fill="var(--svg-3b82f6)"/><rect x="228" y="30" width="80" height="24" rx="5" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="1.2"/><text x="268" y="46" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-b45309)">$50/hr</text><line x1="205" y1="70" x2="220" y2="70" stroke="var(--svg-3b82f6)" stroke-width="1.2"/><polygon points="220,66 228,70 220,74" fill="var(--svg-3b82f6)"/><rect x="228" y="58" width="80" height="24" rx="5" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="1.2"/><text x="268" y="74" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-b45309)">$4K/bi-wk</text><line x1="205" y1="82" x2="220" y2="92" stroke="var(--svg-3b82f6)" stroke-width="1.2"/><polygon points="220,88 228,92 220,96" fill="var(--svg-3b82f6)"/><rect x="228" y="84" width="80" height="24" rx="5" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="1.2"/><text x="268" y="100" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-b45309)">$8.7K/mo</text><rect x="10" y="135" width="300" height="55" rx="8" fill="var(--svg-f1f5f9)"/><text x="160" y="153" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e293b)">Annual = Universal Baseline</text><text x="160" y="169" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Hourly x 2080 = Annual  |  Monthly x 12 = Annual</text><text x="160" y="185" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Bi-weekly x 26 = Annual  |  Weekly x 52 = Annual</text></svg>`;

const salaryConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'salaryAmount',
      label: 'Salary Amount',
      type: 'number',
      placeholder: '35',
      prefix: '$',
      inputMode: 'decimal',
      min: 0,
      step: 0.01,
      required: true,
    },
    {
      id: 'payFrequency',
      label: 'Pay Frequency',
      type: 'select',
      required: true,
      options: [
        { label: 'Hourly', value: 'hourly' },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Bi-Weekly (Every 2 Weeks)', value: 'biweekly' },
        { label: 'Semi-Monthly (Twice per Month)', value: 'semimonthly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Annually', value: 'annually' },
      ],
    },
    {
      id: 'hoursPerWeek',
      label: 'Hours Worked Per Week',
      type: 'number',
      placeholder: '40',
      unit: 'hrs',
      inputMode: 'numeric',
      min: 1,
      max: 168,
      step: 0.5,
      helpText: 'Used to calculate hourly rate from salary (default 40 hrs)',
    },
    {
      id: 'daysPerWeek',
      label: 'Days Worked Per Week',
      type: 'number',
      placeholder: '5',
      unit: 'days',
      inputMode: 'numeric',
      min: 1,
      max: 7,
      step: 1,
      helpText: 'Used to calculate daily rate (default 5 days)',
    },
  ],
  calculate: (values) => {
    const amount = parseFloat(values.salaryAmount);
    const freq = values.payFrequency || 'hourly';
    const hoursPerWeek = parseFloat(values.hoursPerWeek) || 40;
    const daysPerWeek = parseFloat(values.daysPerWeek) || 5;

    if (isNaN(amount) || amount <= 0) return [];

    const WEEKS_PER_YEAR = 52;
    const totalHoursPerYear = hoursPerWeek * WEEKS_PER_YEAR;
    const totalDaysPerYear = daysPerWeek * WEEKS_PER_YEAR;

    let annual: number;
    switch (freq) {
      case 'hourly': annual = new Decimal(amount).times(totalHoursPerYear).toNumber(); break;
      case 'daily': annual = new Decimal(amount).times(totalDaysPerYear).toNumber(); break;
      case 'weekly': annual = new Decimal(amount).times(WEEKS_PER_YEAR).toNumber(); break;
      case 'biweekly': annual = new Decimal(amount).times(26).toNumber(); break;
      case 'semimonthly': annual = new Decimal(amount).times(24).toNumber(); break;
      case 'monthly': annual = new Decimal(amount).times(12).toNumber(); break;
      case 'annually': default: annual = amount; break;
    }

    const annualD = new Decimal(annual);
    const hourly = annualD.div(totalHoursPerYear).toNumber();
    const daily = annualD.div(totalDaysPerYear).toNumber();
    const weekly = annualD.div(WEEKS_PER_YEAR).toNumber();
    const biweekly = annualD.div(26).toNumber();
    const monthly = annualD.div(12).toNumber();

    const netAnnual = estimateNetPay(annual);
    const netBiweekly = new Decimal(netAnnual).div(26).toNumber();

    const fmt = (n: number, decimals = 2) =>
      new Decimal(n).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    const heroLabel: Record<string, string> = {
      hourly: 'Annual Equivalent',
      daily: 'Annual Equivalent',
      weekly: 'Annual Equivalent',
      biweekly: 'Annual Equivalent',
      semimonthly: 'Annual Equivalent',
      monthly: 'Annual Equivalent',
      annually: 'Hourly Equivalent',
    };

    const heroValue = freq === 'annually' ? `$${fmt(hourly)}/hr` : `$${fmt(annual, 0)}/year`;

    return [
      {
        id: 'hero',
        label: heroLabel[freq],
        value: heroValue,
        highlight: true,
        color: 'positive' as const,
        interpretation: `This converts your ${freq} rate assuming standard full-time hours — actual pay varies with overtime, unpaid leave, and how many pay periods actually land in a given year. Estimated take-home after typical taxes is shown separately below; the figure above is gross, before withholding.`,
      },
      {
        id: 'hourly',
        label: 'Hourly Rate',
        value: `$${fmt(hourly)}/hr`,
        color: 'neutral' as const,
      },
      {
        id: 'daily',
        label: 'Daily Rate',
        value: `$${fmt(daily)}/day`,
        color: 'neutral' as const,
      },
      {
        id: 'weekly',
        label: 'Weekly',
        value: `$${fmt(weekly, 0)}/wk`,
        color: 'neutral' as const,
      },
      {
        id: 'biweekly',
        label: 'Bi-Weekly Paycheck',
        value: `$${fmt(biweekly, 0)}/paycheck`,
        color: 'neutral' as const,
      },
      {
        id: 'monthly',
        label: 'Monthly',
        value: `$${fmt(monthly, 0)}/mo`,
        color: 'neutral' as const,
      },
      {
        id: 'annual',
        label: 'Annual',
        value: `$${fmt(annual, 0)}/year`,
        color: 'neutral' as const,
      },
      {
        id: 'netAnnual',
        label: 'Estimated Take-Home (Annual, Single/~4.5% state)',
        value: `~$${fmt(netAnnual, 0)}/year`,
        color: 'positive' as const,
      },
      {
        id: 'netBiweekly',
        label: 'Estimated Take-Home (Bi-Weekly Paycheck)',
        value: `~$${fmt(netBiweekly, 0)}/paycheck`,
        color: 'positive' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    const amount = parseFloat(values.salaryAmount);
    const freq = values.payFrequency || 'hourly';
    const hoursPerWeek = parseFloat(values.hoursPerWeek) || 40;
    const daysPerWeek = parseFloat(values.daysPerWeek) || 5;

    if (!results.length || isNaN(amount) || amount <= 0) return null;

    return createElement(SalaryPanel, { amount, freq, hoursPerWeek, daysPerWeek });
  },
  educational: {
    formula: 'Annual = Hourly Rate x Hours/Week x 52 Weeks',
    formulaDescription:
      'All pay periods are derived from the annual equivalent. The annual is calculated by multiplying your pay amount by the number of periods in a year, using your specified hours and days per week. Whether you input an hourly wage, a monthly salary, or a daily rate, the calculator converts everything to the annual baseline and then derives all other pay periods from that annual figure. All conversions use decimal.js for precise arithmetic.',
    diagram: {
      svg: salarySvg,
      alt: 'Salary conversion diagram showing hourly, weekly, and monthly pay rates flowing into an annual baseline in the center, which converts to all other pay periods',
      caption: 'All pay periods convert through the annual baseline — the universal converter for salary comparisons',
    },
    variables: [
      { symbol: 'Annual', name: 'Annual Equivalent', description: 'The gross yearly amount, the baseline for all conversions. All other pay periods (monthly, bi-weekly, hourly, etc.) are derived from this number.' },
      { symbol: 'Bi-Weekly', name: 'Bi-Weekly Pay', description: 'Annual / 26. This is the most common payroll cycle in the US — employees paid every two weeks receive 26 paychecks per year.' },
      { symbol: 'Semi-Monthly', name: 'Semi-Monthly Pay', description: 'Annual / 24 (paid on fixed dates like the 1st and 15th, not every 2 weeks). Salaried employees are often paid semi-monthly.' },
      { symbol: 'Net Pay', name: 'Take-Home Pay', description: 'Estimated after-tax pay using 2025 federal tax brackets for single filers, standard deduction, FICA (7.65%), and a flat 4.5% estimated state tax. This is an estimate only — your actual take-home depends on your specific tax situation.' },
    ],
    howToUse: [
      'Enter your salary amount — whatever form it comes in (hourly wage, monthly salary, annual salary, etc.).',
      'Select how that amount is paid (hourly, weekly, bi-weekly, monthly, annually, etc.). The calculator converts all formats.',
      'Set your hours per week and days per week for accurate hourly and daily conversions. The defaults are 40 hours and 5 days.',
      'The grid shows all equivalent pay rates. Estimated take-home pay uses a simplified single-filer estimate with 2025 federal brackets.',
    ],
    commonUses: [
      'Convert between hourly, weekly, monthly, and annual salary formats to compare job offers with different pay structures.',
      'Estimate your take-home pay after federal and state income taxes to understand your true net earnings from any job offer.',
      'Compare a freelance contract rate against a salaried position by calculating the annual equivalent including benefits considerations.',
    ],
    workedExamples: [
      {
        scenario: 'Job offer of $45/hour as a contractor vs. a competing salaried offer of $85,000/year. Which pays more?',
        inputs: { salaryAmount: '45', payFrequency: 'hourly', hoursPerWeek: '40', daysPerWeek: '5' },
        result: 'Annual equivalent: $93,600/year',
        insight: 'The hourly contract at $45/hr is equivalent to $93,600/year — $8,600 more than the $85K salaried offer. But as a contractor, you must pay self-employment tax (~$7,160), your own health insurance (~$6,000-$12,000), and you get no paid vacation. After accounting for these, the salaried position with benefits may actually provide higher total compensation.',
      },
      {
        scenario: 'You earn $5,500/month. What is your hourly rate and bi-weekly paycheck?',
        inputs: { salaryAmount: '5500', payFrequency: 'monthly', hoursPerWeek: '40', daysPerWeek: '5' },
        result: 'Annual: $66,000/year. Hourly: $31.73/hr. Bi-weekly: $2,538/paycheck.',
        insight: 'A monthly salary of $5,500 translates to $66,000 annually. Your bi-weekly paycheck is $2,538 — but note that on a semi-monthly schedule you would get $2,750 per paycheck (2x/month vs every 2 weeks). Budgeting tip: budget based on 2 paychecks per month ($5,076) and treat the 2 "extra" paychecks per year ($5,076 total) as bonus savings.',
      },
      {
        scenario: 'A freelance graphic designer charges $600/day. What annual salary equivalent should they target if switching to full-time?',
        inputs: { salaryAmount: '600', payFrequency: 'daily', hoursPerWeek: '40', daysPerWeek: '5' },
        result: 'Annual equivalent: $156,000/year.',
        insight: 'At $600/day, the freelancer grosses $156,000/year. To match this as a salaried employee, they would need roughly $115,000-$125,000 in salary (accounting for benefits, PTO, and employer-paid FICA). This highlights why freelancers must charge premium rates: the employer pays roughly 30% on top of salary for benefits, payroll taxes, and overhead.',
      },
    ],
    proTips: [
      'When negotiating salary, always think in annual terms — a $2/hr raise sounds small but is $4,160/year at 40 hours/week. Over a 30-year career with 3% raises, that single $2/hr bump compounds to over $250,000 in lifetime earnings.',
      'Bi-weekly pay means 26 paychecks/year — two months each year will have 3 paychecks. Budget based on 2 paychecks/month and treat the "extra" checks as windfalls for debt payoff or investing.',
      'For overtime eligibility: the FLSA salary threshold for exempt employees is $58,656/year as of 2025. If you earn less than this, you must receive overtime pay (1.5x) for hours over 40/week.',
      'Use the net pay estimate to budget realistically — gross salary is aspirational, but your take-home after taxes, benefits, and 401k contributions is what you actually live on.',
    ],
    limitations: [
      'The take-home pay estimate uses a simplified single-filer model with 2025 brackets and a flat 4.5% state tax estimate. Your actual tax varies by filing status, state, deductions, credits, and pre-tax contributions.',
      'This calculator assumes a standard 52-week year with 2080 working hours. It does not account for unpaid time off, holidays, or variable schedules.',
      'Self-employment tax (both employer and employee FICA portions totaling 15.3%) is not modeled in the take-home estimate — contractors and freelancers will see higher tax deductions than shown.',
      'Benefits value (health insurance, 401k match, PTO, bonuses) is not included — a $75K job with great benefits can be worth more than a $90K job with none.',
    ],
    quickReference: [
      { label: 'Hourly to Annual (40hr/wk)', value: 'Hourly Rate x 2,080' },
      { label: 'Annual to Hourly (40hr/wk)', value: 'Annual / 2,080' },
      { label: 'Bi-Weekly to Annual', value: 'Bi-Weekly Pay x 26' },
      { label: 'Semi-Monthly to Annual', value: 'Semi-Monthly Pay x 24' },
      { label: 'Monthly to Annual', value: 'Monthly Pay x 12' },
    ],
    explanation:
      'When comparing job offers, a $50/hour contract vs. a $95,000 salaried position sounds similar, but they\'re not: $50 x 40 hrs x 52 weeks = $104,000 annually — 9% more. But salaried employees typically get benefits (health insurance, 401k match, PTO) worth $15,000-$30,000 that contractors must fund themselves. The full picture: contractors should target 1.5-2x the equivalent salaried rate to be truly competitive. Additionally, the take-home pay estimate accounts for federal income tax, FICA (Social Security and Medicare), and an average state income tax. This gives you a realistic sense of what you will actually deposit in your bank account, rather than just the gross figures. Understanding these conversions is essential when negotiating job offers, evaluating contract vs. salaried positions, or planning your household budget.',
    faqs: [
      {
        question: 'What is the difference between bi-weekly and semi-monthly pay?',
        answer: 'Bi-weekly = 26 paychecks per year (every 2 weeks). Semi-monthly = 24 paychecks per year (twice per month, on fixed dates like the 1st and 15th). Bi-weekly results in 2 months with 3 paychecks — a helpful "extra" paycheck that many people use for savings or debt payoff. Semi-monthly paychecks are slightly larger (annual / 24 vs. annual / 26) but come only twice per month on the same dates.',
      },
      {
        question: 'How accurate is the estimated take-home pay?',
        answer: 'The take-home estimate uses 2025 federal brackets for a single filer with the standard deduction, standard FICA rates, and an estimated 4.5% state income tax. Your actual take-home will vary based on your filing status, state, deductions, and pre-tax benefits (health insurance, 401k contributions, HSA/FSA). Use the Income Tax Calculator for a more precise estimate that accounts for your specific circumstances.',
      },
      {
        question: 'How do I compare a salary to a freelance hourly rate?',
        answer: 'Freelancers need to account for: self-employment tax (~7.65% additional FICA employer share), health insurance (~$5,000-$15,000/year), no paid vacation (2 weeks = ~4% of salary), no 401k match or employer retirement contributions, and overhead expenses (equipment, software, home office). A common rule: multiply your equivalent salaried hourly rate by 1.5-2x to get a competitive freelance rate. So a $50/hr salary equivalent becomes $75-$100/hr as a freelancer.',
      },
      {
        question: 'What is the standard full-time work year in hours?',
        answer: 'The standard full-time work year is 2,080 hours, calculated as 40 hours/week x 52 weeks. However, with 10 federal holidays and 2 weeks of vacation, actual hours worked is closer to 1,920. If you are paid for holidays and vacation (salaried), use 2,080. If you want to know your effective hourly rate based on actual hours worked, subtract your PTO and holidays from 2,080 before dividing.',
      },
      {
        question: 'How are overtime and holiday pay calculated from an annual salary?',
        answer: 'For non-exempt (hourly) employees, overtime is 1.5x the regular hourly rate for hours over 40/week. To find the regular rate: annual salary / 2,080. Overtime rate = regular rate x 1.5. For example, at $52,000/year ($25/hr), overtime is $37.50/hr. Some employers pay double time (2x) for holidays. Exempt salaried employees generally do not receive overtime regardless of hours worked.',
      },
    ],
    citations: [
      { source: 'US Bureau of Labor Statistics', url: 'https://www.bls.gov' },
      { source: 'US Department of Labor — FLSA Overtime Rules', url: 'https://www.dol.gov/agencies/whd/overtime' },
      { source: 'Investopedia — Salary vs Hourly', url: 'https://www.investopedia.com/terms/s/salary.asp' },
    ],
  },
};

export default salaryConfig;
