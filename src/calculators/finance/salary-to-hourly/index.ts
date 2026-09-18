import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import SalaryToHourlyPanel from './SalaryToHourlyPanel';

const salaryToHourlyConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'salary',
      label: 'Annual Salary',
      type: 'number',
      placeholder: '65,000',
      prefix: '$',
      min: 0,
      step: 0.01,
      required: true,
      helpText: 'Your gross annual salary before taxes or deductions',
    },
    {
      id: 'hoursPerWeek',
      label: 'Hours Worked Per Week',
      type: 'number',
      placeholder: '40',
      unit: 'hrs',
      inputMode: 'decimal',
      min: 1,
      max: 168,
      step: 0.5,
      required: true,
      helpText: 'Average number of hours you work each week',
    },
    {
      id: 'weeksPerYear',
      label: 'Weeks Worked Per Year',
      type: 'number',
      placeholder: '52',
      unit: 'wks',
      inputMode: 'decimal',
      min: 1,
      max: 52,
      step: 1,
      required: true,
      helpText: 'Number of weeks worked per year (52 = no unpaid time off)',
    },
  ],
  calculate: (values) => {
    const salary = parseFloat(values.salary);
    const hoursPerWeek = parseFloat(values.hoursPerWeek);
    const weeksPerYear = parseFloat(values.weeksPerYear || '52');

    if (isNaN(salary) || isNaN(hoursPerWeek) || isNaN(weeksPerYear) || hoursPerWeek <= 0 || weeksPerYear <= 0) return [];

    const totalHours = hoursPerWeek * weeksPerYear;
    const hourlyRate = salary / totalHours;
    const dailyRate = hourlyRate * hoursPerWeek / 5;
    const weeklyRate = salary / weeksPerYear;
    const monthlyRate = salary / 12;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return [
      {
        id: 'hourlyRate',
        label: 'Hourly Rate',
        value: `$${fmt(hourlyRate)}`,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'dailyRate',
        label: 'Daily Rate (8 hr equivalent)',
        value: `$${fmt(dailyRate)}`,
        color: 'neutral',
      },
      {
        id: 'weeklyRate',
        label: 'Weekly Rate',
        value: `$${fmt(weeklyRate)}`,
        color: 'neutral',
      },
      {
        id: 'monthlyRate',
        label: 'Monthly Rate',
        value: `$${fmt(monthlyRate)}`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(SalaryToHourlyPanel, { values, results });
  },
  educational: {
    formula: 'Hourly Rate = Annual Salary ÷ (Hours Per Week × Weeks Per Year)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">Salary to Hourly Conversion</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Your annual salary broken down by time unit</text><g transform="translate(30,65)"><!-- Annual salary block --><rect x="20" y="0" width="370" height="45" rx="8" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="205" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-1e40af)">Annual Salary: $65,000</text><text x="205" y="36" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Gross income before taxes and deductions</text><!-- Down arrows --><path d="M 100,45 L 100,58" stroke="var(--svg-64748b)" stroke-width="1.5"/><path d="M 205,45 L 205,58" stroke="var(--svg-64748b)" stroke-width="1.5"/><path d="M 310,45 L 310,58" stroke="var(--svg-64748b)" stroke-width="1.5"/><path d="M 130,110 L 130,123" stroke="var(--svg-64748b)" stroke-width="1.5"/><path d="M 280,110 L 280,123" stroke="var(--svg-64748b)" stroke-width="1.5"/><!-- Monthly & Weekly row --><rect x="20" y="58" width="160" height="48" rx="6" fill="var(--svg-22c55e)"/><text x="100" y="80" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ffffff)">Monthly: $5,417</text><text x="100" y="96" text-anchor="middle" font-size="8" fill="var(--svg-d1fae5)">$65K ÷ 12 months</text><rect x="240" y="58" width="150" height="48" rx="6" fill="var(--svg-3b82f6)"/><text x="315" y="80" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ffffff)">Weekly: $1,250</text><text x="315" y="96" text-anchor="middle" font-size="8" fill="var(--svg-dbeafe)">$65K ÷ 52 weeks</text><!-- Daily & Hourly row --><rect x="20" y="123" width="160" height="48" rx="6" fill="var(--svg-8b5cf6)"/><text x="100" y="145" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ffffff)">Daily: $250</text><text x="100" y="161" text-anchor="middle" font-size="8" fill="var(--svg-e9d5ff)">$65K ÷ 260 working days</text><rect x="240" y="123" width="150" height="48" rx="6" fill="var(--svg-f59e0b)"/><text x="315" y="145" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-ffffff)">Hourly: $31.25</text><text x="315" y="161" text-anchor="middle" font-size="8" fill="var(--svg-fef3c7)">$65K ÷ (40hr × 52wk)</text></g><!-- Comparison to freelance --><g transform="translate(40,195)"><rect x="10" y="0" width="370" height="130" rx="10" fill="var(--svg-f1f5f9)"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Salary vs. Freelance: True Cost Comparison</text><rect x="25" y="28" width="155" height="55" rx="6" fill="var(--svg-22c55e)"/><text x="102" y="46" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Salaried Employee</text><text x="102" y="62" text-anchor="middle" font-size="9" fill="var(--svg-d1fae5)">$31.25/hr take-home</text><text x="102" y="76" text-anchor="middle" font-size="8" fill="var(--svg-d1fae5)">+ benefits, PTO, 401k match</text><rect x="230" y="28" width="135" height="55" rx="6" fill="var(--svg-f59e0b)"/><text x="297" y="46" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Freelancer</text><text x="297" y="62" text-anchor="middle" font-size="9" fill="var(--svg-fef3c7)">Must charge 1.5-2× to match</text><text x="297" y="76" text-anchor="middle" font-size="8" fill="var(--svg-fef3c7)">= ~$50-$62/hr</text><text x="195" y="100" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Multiply desired salary rate by 1.5-2× for competitive freelance rate</text><text x="195" y="116" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Factor in: SE tax 15.3%, health insurance, no PTO, non-billable time</text></g></svg>',
      alt: 'Salary to hourly conversion diagram showing annual salary $65K broken down into monthly, weekly, daily, and hourly rates with salary vs freelance comparison',
      caption: 'Your hourly rate reveals the true value of your time -- use it to compare job offers and set freelance rates',
    },
    formulaDescription:
      'The hourly rate is derived by dividing the annual salary by the total number of hours worked in a year, accounting for your specific schedule. This simple conversion is the foundation for all the other period conversions — daily, weekly, and monthly rates are all derived from the same annual baseline. The key variable most people overlook is the "weeks per year" input: many salaried jobs advertise 52 weeks but in practice involve fewer working weeks due to holidays and vacation.',
    variables: [
      { symbol: 'HR', name: 'Hourly Rate', description: 'The equivalent dollar amount earned per hour based on your salary and working schedule. The most fungible unit for comparing different job offers.' },
      { symbol: 'S', name: 'Annual Salary', description: 'Your gross annual compensation before taxes or deductions. This is the starting point for all rate conversions.' },
      { symbol: 'H', name: 'Hours Per Week', description: 'The average number of hours you work each week. Standard full-time is 40 hours. If you regularly work more, your effective hourly rate drops proportionally.' },
      { symbol: 'W', name: 'Weeks Per Year', description: 'The number of weeks you work in a year. Use 52 for a standard full-year schedule with paid vacation. Use fewer only if you take unpaid time off or work seasonally.' },
      { symbol: 'Freelance Rate', name: 'Equivalent Freelance Rate', description: 'To match a salaried position, freelancers typically need to charge 1.5–2× the equivalent hourly rate to cover self-employment taxes, health insurance, PTO, and non-billable time. A $31.25/hr salaried role requires roughly $50–$62/hr as a freelancer.' },
    ],
    howToUse: [
      'Enter your annual gross salary, average hours per week, and weeks per year.',
      'The calculator instantly shows your equivalent hourly, daily, weekly, and monthly rates.',
      'Use the hourly rate to compare job offers and evaluate whether freelance rates are competitive.',
    ],
    commonUses: [
      'Convert an annual salary to its equivalent hourly, daily, weekly, and monthly rates for comparing different job offer formats.',
      'Determine what hourly freelance rate you need to charge to match a salaried position when accounting for self-employment costs.',
      'Calculate the hourly value of your time to evaluate whether outsourcing tasks or taking on side work is financially worthwhile.',
    ],
    explanation:
      'Converting a salary to an hourly rate is essential when comparing job offers, evaluating freelance rates, or understanding the true value of your time. A $65,000 salary at a standard 40-hour week works out to about $31.25 per hour — but if that job demands 50 hours per week, the effective hourly rate drops to $25. This converter makes those comparisons transparent. It also helps freelancers set rates that are competitive with salaried equivalents. For example, a freelance rate of $75/hour — at 1,500 billable hours per year (accounting for non-billable time, admin, and holidays) — produces $112,500 annual gross. But after self-employment taxes (15.3% vs. 7.65% for employees), health insurance ($5,000–$15,000/year), and zero employer 401(k) match, the equivalent salaried position paying $85,000 with benefits often comes out ahead. The general rule: multiply your desired salaried hourly rate by 1.5–2× to get your competitive freelance rate. This converter is the first step in making that calculation transparent and data-driven.',
    faqs: [
      {
        question: 'Should I use 52 weeks or fewer?',
        answer: 'Use 52 if you receive paid vacation and holidays (your employer pays you whether you work or not). Use fewer weeks only if you take unpaid time off or work seasonally. For teachers working 9 months or seasonal workers, use the actual number of weeks you are on the job. This distinction is critical because using 52 weeks for a seasonal worker will significantly understate your effective hourly rate.',
      },
      {
        question: 'Does this account for taxes?',
        answer: 'No. This calculator works with gross (pre-tax) figures. Your actual take-home pay depends on your federal and state tax brackets, deductions, and withholding. For net pay estimates, use a paycheck or tax calculator which accounts for federal, FICA, and state taxes.',
      },
      {
        question: 'How do I compare a salary offer to a freelance rate?',
        answer: 'Freelancers typically need to charge 1.5–2× their equivalent salaried hourly rate to account for self-employment taxes, benefits (health insurance, retirement), unpaid time between projects, and business expenses. An employee earning $40/hour actually costs an employer about $55/hour including payroll taxes and benefits. A freelancer needs to cover both sides of that equation.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
    
    workedExamples: [
      {
        scenario: 'Tom, a graphic designer in Portland, earns $65,000/year working 40 hours per week, 52 weeks per year. He wants to know his equivalent hourly rate for comparing a freelance opportunity.',
        inputs: {
          'Annual Salary': '$65,000',
          'Hours Worked Per Week': '40',
          'Weeks Worked Per Year': '52',
        },
        result: 'Hourly Rate: $31.25. Daily Rate: $250.00. Weekly Rate: $1,250.00. Monthly Rate: $5,416.67.',
        insight: 'Tom earns $31.25 per hour as a salaried employee. To match this as a freelancer, he would need to charge roughly $47-$63/hour (1.5-2x multiplier) to account for self-employment taxes (15.3% vs the 7.65% he pays as an employee), health insurance, no paid time off, and non-billable hours spent on admin, marketing, and client acquisition. If Tom can bill 1,500 hours/year (accounting for 500+ hours of non-billable time), he would need a rate of about $62/hour to match his current $65K salary with equivalent benefits.',
      },
      {
        scenario: 'Maria is a teacher in Miami earning $52,000 on a 10-month contract. She works 40 hours per week for 40 weeks per year. She wants to understand her hourly rate and explore summer side work.',
        inputs: {
          'Annual Salary': '$52,000',
          'Hours Worked Per Week': '40',
          'Weeks Worked Per Year': '40',
        },
        result: 'Hourly Rate: $32.50. Daily Rate: $260.00. Weekly Rate: $1,300.00. Monthly Rate: $4,333.33.',
        insight: 'Maria\'s hourly rate of $32.50 is higher than it first appears when comparing to a 52-week worker — because she works only 40 weeks, her salary is compressed into fewer hours. If she worked 52 weeks at the same hourly rate, she would earn $67,600. Her summer break gives her 12 weeks to earn additional income — teaching summer school at $35/hour for 20 hours/week over 8 weeks would add $5,600, bringing her effective annual earnings to $57,600 without sacrificing her entire break.',
      },
    ],

    proTips: [
      'When comparing salary to freelance, multiply your salaried hourly rate by 1.5-2x. An employee earning $31.25/hr costs an employer about $42-45/hr including payroll taxes, benefits, and overhead. As a freelancer, you need to cover both sides of that equation.',
      'If your job regularly demands more than 40 hours, use the actual hours in the calculator. A $65K salary at 50 hours/week is only $25.00/hr — $6.25 less per hour than the standard 40-hour assumption. Knowing this number helps evaluate whether the extra hours are worth it.',
      'Use the daily rate for project pricing. If you earn $250/day as a salaried employee, a 5-day freelance project at $500/day ($2,500 total) represents 10 days of employee-equivalent earnings — giving you 5 extra "days" of earning power for the same time invested.',
      'Don\'t forget to factor in the value of employer benefits when comparing W-2 to 1099. A W-2 job paying $31.25/hr with health insurance ($8K value), 401k match ($3K), and PTO ($5K) is actually worth about $39-41/hr in total compensation — pushing your freelance rate target to $59-82/hr.',
    ],

    quickReference: [
      { label: 'Standard Full-Time', value: '40 hrs/wk × 52 wks = 2,080 hrs/yr' },
      { label: '$50K salary', value: '$24.04/hr (at 2,080 hours)' },
      { label: '$75K salary', value: '$36.06/hr (at 2,080 hours)' },
      { label: '$100K salary', value: '$48.08/hr (at 2,080 hours)' },
      { label: '$150K salary', value: '$72.12/hr (at 2,080 hours)' },
      { label: 'Freelance multiplier', value: '1.5-2× salary rate to match total comp' },
      { label: 'Part-year (40 wks)', value: 'Multiply hourly rate by 1.3× vs 52-week' },
    ],

    limitations: [
      'Gross (pre-tax) rates only. Your actual spendable hourly income after taxes, health insurance premiums, and retirement contributions will be 20-35% lower. Use a tax calculator to estimate take-home rates for more accurate planning.',
      'Assumes a consistent schedule across all weeks. Many salaried jobs have seasonal crunch periods (accountants in March-April, retail in November-December) where hours spike well above 40, reducing the effective rate during those periods.',
      'The daily rate uses a (Hours/5) formula which assumes a 5-day work week. For compressed schedules (4x10, 9/80), the daily rate will be less meaningful. The hourly rate remains accurate regardless of schedule.',
      'Does not account for unpaid lunch breaks. If you work 9:00-5:30 with a 30-minute unpaid lunch, your paid hours are 40 but you\'re at work for 42.5 hours. This is a separate concept from the "True Hourly Rate" calculator which explicitly models commute and overtime.',
    ],
citations: [
      { source: 'US Bureau of Labor Statistics', url: 'https://www.bls.gov' },
      { source: 'Investopedia', url: 'https://www.investopedia.com/terms/h/hourly-wage.asp' },
    ],
  },
};

export default salaryToHourlyConfig;
