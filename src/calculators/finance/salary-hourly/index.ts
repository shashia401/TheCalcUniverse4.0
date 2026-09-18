import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { createElement } from 'react';
import SalaryHourlyPanel from './SalaryHourlyPanel';

const salaryHourlyConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'annualSalary',
      label: 'Annual Salary',
      type: 'number',
      placeholder: '80000',
      prefix: '$',
      inputMode: 'decimal',
      min: 0,
      step: 0.01,
      required: true,
      helpText: 'Your gross annual salary before taxes',
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
    },
    {
      id: 'trueHourlyToggle',
      label: 'Calculate True Hourly Rate',
      type: 'select',
      required: true,
      options: [
        { label: 'No (Standard calculation only)', value: 'no' },
        { label: 'Yes (Include commute, overtime & PTO)', value: 'yes' },
      ],
      helpText: 'True hourly rate accounts for commute time, commute costs, unpaid overtime, and paid time off',
    },
    {
      id: 'commuteHoursPerDay',
      label: 'Commute Time (round trip)',
      type: 'number',
      placeholder: '1',
      unit: 'hrs',
      inputMode: 'decimal',
      min: 0,
      step: 0.25,
      helpText: 'Total daily commute time in hours (to and from work)',
      showWhen: (values) => values.trueHourlyToggle === 'yes',
    },
    {
      id: 'commuteCostPerDay',
      label: 'Commute Cost per Day',
      type: 'number',
      placeholder: '10',
      prefix: '$',
      inputMode: 'decimal',
      min: 0,
      step: 0.5,
      helpText: 'Daily cost of commuting (gas, tolls, parking, transit fare)',
      showWhen: (values) => values.trueHourlyToggle === 'yes',
    },
    {
      id: 'unpaidOvertimeHours',
      label: 'Unpaid Overtime per Week',
      type: 'number',
      placeholder: '0',
      unit: 'hrs',
      inputMode: 'decimal',
      min: 0,
      step: 0.5,
      helpText: 'Extra hours you work each week that you are not paid for',
      showWhen: (values) => values.trueHourlyToggle === 'yes',
    },
    {
      id: 'paidTimeOff',
      label: 'Paid Time Off',
      type: 'number',
      placeholder: '15',
      unit: 'days',
      inputMode: 'decimal',
      min: 0,
      step: 1,
      helpText: 'Number of paid days off per year (PTO + holidays)',
      showWhen: (values) => values.trueHourlyToggle === 'yes',
    },
  ],

  calculate: (values) => {
    const salary = parseFloat(values.annualSalary);
    const hoursPerWeek = parseFloat(values.hoursPerWeek);
    const trueHourlyToggle = values.trueHourlyToggle || 'no';

    if (isNaN(salary) || salary <= 0 || isNaN(hoursPerWeek) || hoursPerWeek <= 0) return [];

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const standardHourly = salary / (hoursPerWeek * 52);
    const weeklyPay = salary / 52;
    const monthlyPay = salary / 12;
    const biweeklyPay = salary / 26;

    const results: CalculatorResult[] = [
      {
        id: 'standardHourly',
        label: 'Standard Hourly Rate',
        value: `$${fmt(standardHourly)}`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'weeklyPay',
        label: 'Weekly Pay',
        value: `$${fmt(weeklyPay)}`,
        color: 'neutral' as const,
      },
      {
        id: 'monthlyPay',
        label: 'Monthly Pay',
        value: `$${fmt(monthlyPay)}`,
        color: 'neutral' as const,
      },
      {
        id: 'biweeklyPay',
        label: 'Biweekly Pay',
        value: `$${fmt(biweeklyPay)}`,
        color: 'neutral' as const,
      },
      {
        id: 'salary',
        label: 'Annual Salary',
        value: `$${fmt(salary)}`,
        color: 'neutral' as const,
      },
      {
        id: 'hoursPerWeek',
        label: 'Hours per Week',
        value: hoursPerWeek.toFixed(1),
        color: 'neutral' as const,
      },
    ];

    if (trueHourlyToggle === 'yes') {
      const commuteHours = parseFloat(values.commuteHoursPerDay || '0');
      const commuteCost = parseFloat(values.commuteCostPerDay || '0');
      const overtime = parseFloat(values.unpaidOvertimeHours || '0');
      const ptoDays = parseFloat(values.paidTimeOff || '0');

      const workDaysPerWeek = 5;
      const workingWeeks = 52 - ptoDays / workDaysPerWeek;
      const effectiveHoursPerWeek = hoursPerWeek + commuteHours * workDaysPerWeek + overtime;
      const effectiveAnnualHours = effectiveHoursPerWeek * workingWeeks;
      const commuteCostsAnnual = commuteCost * workDaysPerWeek * workingWeeks;
      const trueHourly = (salary - commuteCostsAnnual) / effectiveAnnualHours;

      results.push({
        id: 'trueHourly',
        label: 'True Hourly Rate (after commute & overtime)',
        value: `$${fmt(trueHourly)}`,
        highlight: true,
        color: 'neutral' as const,
      });
      results.push({
        id: 'effectiveHoursPerWeek',
        label: 'Effective Hours per Week (incl. commute & overtime)',
        value: `${effectiveHoursPerWeek.toFixed(1)} hrs`,
        color: 'neutral' as const,
      });
      results.push({
        id: 'effectiveAnnualHours',
        label: 'Effective Annual Hours',
        value: `${effectiveAnnualHours.toFixed(0)} hrs`,
        color: 'neutral' as const,
      });
      results.push({
        id: 'commuteCostsAnnual',
        label: 'Annual Commute Cost',
        value: `$${fmt(commuteCostsAnnual)}`,
        color: 'negative' as const,
      });
    }

    return results;
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(SalaryHourlyPanel, { values, results });
  },

  educational: {
    formula: 'Standard Hourly = Salary ÷ (Hours × 52) | True Hourly = (Salary − Commute Costs) ÷ Effective Annual Hours',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="6"/><text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)">True Hourly Rate</text><text x="160" y="34" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Standard vs. the rate that includes commute and overtime</text><rect x="18" y="48" width="130" height="55" rx="8" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="83" y="68" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-1e40af)">Standard Hourly</text><text x="83" y="84" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-2563eb)">$38.46/hr</text><text x="83" y="97" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">40hr/wk × 52wk</text><text x="160" y="80" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-94a3b8)">VS</text><rect x="172" y="48" width="130" height="55" rx="8" fill="var(--svg-fef2f2)" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="237" y="68" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-991b1b)">True Hourly</text><text x="237" y="84" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-dc2626)">$31.65/hr</text><text x="237" y="97" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">+commute &amp; overtime</text><rect x="20" y="118" width="280" height="72" rx="8" fill="var(--svg-f1f5f9)"/><text x="160" y="137" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e293b)">What Is Missing from the Standard Rate?</text><text x="50" y="156" font-size="9" fill="var(--svg-3b82f6)">+ 1hr commute/day = 5hr/wk unpaid</text><text x="50" y="172" font-size="9" fill="var(--svg-ef4444)">+ 5hr unpaid overtime/week</text><text x="225" y="172" font-size="9" fill="var(--svg-f59e0b)">= 18% pay cut</text></svg>',
      alt: 'True hourly rate comparison showing standard hourly rate of $38.46/hr versus true hourly rate of $31.65/hr after accounting for commute time and unpaid overtime',
      caption: 'Standard hourly rate ignores commute time and unpaid overtime — the true hourly rate reveals your actual earnings per hour of life spent on work',
    },
    formulaDescription:
      'The standard hourly rate divides your salary by total hours worked. The true hourly rate also accounts for commute time, commute costs, and unpaid overtime — revealing your actual earnings per hour of life spent on work. For most salaried workers, the true hourly rate is significantly lower than the standard calculation suggests, often by 20–40%.',
    variables: [
      { symbol: 'Standard', name: 'Standard Hourly Rate', description: 'Salary divided by hours worked per year. Assumes every hour is equally compensated and ignores commute time and unpaid overtime.' },
      { symbol: 'True Hourly', name: 'True Hourly Rate', description: 'Your adjusted hourly wage after accounting for commute time, commute costs, unpaid overtime, and paid time off. This is your actual earnings per hour of life dedicated to work.' },
      { symbol: 'Effective Hours', name: 'Effective Hours per Week', description: 'Total hours per week dedicated to work including commute time and unpaid overtime. This can be 20–50% higher than your stated working hours.' },
    ],
    howToUse: [
      'Enter your annual salary and hours worked per week.',
      'Toggle "Calculate True Hourly Rate" to see the impact of commute and unpaid time on your effective wage.',
      'Enter your daily commute time (round trip), daily commute costs, unpaid overtime hours, and paid time off days.',
      'Compare standard vs. true hourly rates side by side — the difference is often eye-opening.',
      'Use this analysis when evaluating job offers or considering a role with a longer commute.',
    ],
    commonUses: [
      'Calculate your true hourly wage accounting for commute time, unpaid overtime, and work-related expenses beyond the standard 2,080-hour divisor.',
      'Compare the effective pay of two job offers with different salaries, commute lengths, and expected overtime requirements.',
      'Determine whether a higher-paying job with a longer commute actually pays less per hour when all your time and costs are included.',
    ],
    explanation:
      'The standard method of calculating hourly rate — dividing salary by 2,080 hours (40 hrs × 52 weeks) — is misleading for most workers. It ignores commute time, which can add 5–15 hours per week of unpaid, unreimbursed time. It ignores unpaid overtime, which is increasingly common in salaried roles where "getting the job done" takes more than 40 hours. And it ignores commute costs, which can easily reach $3,000–$5,000 per year in gas, tolls, parking, and vehicle wear-and-tear. When you account for these factors, a seemingly good salary can translate to a much lower effective hourly wage. For example, an $80,000 salary with a 1-hour daily commute and 5 hours of unpaid overtime per week is effectively earning closer to $22/hour. This insight is crucial when comparing job offers, negotiating salary, or deciding whether a higher-paying job with a longer commute is actually worth it. The true hourly rate gives you a realistic basis for comparing a job to a freelance or contract opportunity.',
    faqs: [
      {
        question: 'Should I use 52 weeks or fewer for the standard calculation?',
        answer: 'Standard calculations typically use 52 weeks. However, the true hourly calculation accounts for paid time off by reducing the working weeks — if you have 15 PTO days, you effectively work 49 weeks per year. This is more accurate because you are paid for 52 weeks but only working 49, so your actual hours spent on work are fewer, which slightly increases your true hourly rate.',
      },
      {
        question: 'How do I compare two job offers using this?',
        answer: 'Calculate the true hourly rate for each offer, including different commute times and costs. A job paying $90K with a 30-minute commute may be worth more than one paying $100K with a 90-minute commute. For a 5-day work week: 30-min commute = 5 hours/week = ~260 hours/year lost. 90-min commute = 15 hours/week = ~780 hours/year lost. At $100K, that extra 520 hours translates to a difference of nearly $20/hour in effective earnings. Also factor in health insurance, retirement matching, and other benefits.',
      },
      {
        question: 'Does this account for taxes?',
        answer: 'No. Both standard and true hourly rates are pre-tax (gross). Your take-home pay will be lower after federal, state, and FICA taxes. For net pay estimates, use a dedicated paycheck or tax calculator. The true hourly rate is most useful for comparing the relative value of different job offers on a level playing field, not for calculating exact take-home amounts.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
  
    workedExamples: [
      {
        scenario: 'Jessica earns $80,000/year as a marketing coordinator in Dallas. She works 40 hours per week officially but typically puts in 5 hours of unpaid overtime. Her round-trip commute is 1 hour daily, costing about $10/day in gas and parking. She gets 15 paid days off per year.',
        inputs: {
          'Annual Salary': '$80,000',
          'Hours Worked Per Week': '40',
          'Calculate True Hourly Rate': 'Yes (Include commute, overtime & PTO)',
          'Commute Time (round trip)': '1',
          'Commute Cost per Day': '10',
          'Unpaid Overtime per Week': '5',
          'Paid Time Off': '15',
        },
        result: 'Standard Hourly: $38.46/hr. True Hourly: $31.65/hr. Effective Hours per Week: 50 hrs (incl. commute & overtime). Effective Annual Hours: 2,450 hrs. Annual Commute Cost: $2,450.',
        insight: 'Jessica\'s "true" hourly rate is $31.65 — about an 18% reduction from her standard $38.46 rate. This means every hour of her life dedicated to work (including the 1-hour daily commute and 5 hours of unpaid overtime each week) earns her about $31.65. The 5 hours of unpaid overtime alone reduces her effective rate by nearly $4/hour. When comparing this job to a $70K fully remote position, the remote job at $33.65/hr standard would be $33.65/hr true (zero commute) — actually paying slightly more per hour of life invested.',
      },
      {
        scenario: 'Marcus earns $120,000 as a senior developer in San Francisco. He works 45 hours/week, has a brutal 2-hour daily round-trip BART commute costing $14/day, typically works 5 hours of unpaid overtime, and gets 20 PTO days. He is considering a $100K fully remote offer.',
        inputs: {
          'Annual Salary': '$120,000',
          'Hours Worked Per Week': '45',
          'Calculate True Hourly Rate': 'Yes (Include commute, overtime & PTO)',
          'Commute Time (round trip)': '2',
          'Commute Cost per Day': '14',
          'Unpaid Overtime per Week': '5',
          'Paid Time Off': '20',
        },
        result: 'Standard Hourly: $51.28/hr. True Hourly: $40.50/hr. Effective Hours per Week: 60 hrs (incl. commute & overtime). Effective Annual Hours: 2,880 hrs. Annual Commute Cost: $3,360.',
        insight: 'Marcus\'s true hourly rate of $40.50 is about 21% below his standard $51.28 rate — a significant gap driven by his long commute and long hours. His 60 effective weekly hours mean he is effectively working 1.5 full-time jobs. The $100K remote offer at 45 hours/week with no commute would give a true hourly rate of about $42.74/hr ($100K ÷ (45hrs × 48wks with 20 PTO days)). Despite the $20K nominal pay cut, the remote role actually pays slightly more per hour actually spent on work — and Marcus would reclaim 520+ hours per year (10 hours of commute per week). This is the classic case where the lower-paying job is actually the better deal when you account for total time invested.',
      },
    ],

    proTips: [
      'The true hourly rate is your most honest tool for comparing job offers. A $100K remote job with no commute beats a $120K office job with a 90-minute daily commute every time — the difference can be $10-15/hour in effective pay.',
      'Don\'t forget work-from-home costs in the true hourly calculation. If you work remotely, your commute cost is zero but you may have higher utility bills, internet costs, and home office expenses. Subtract these from your salary for an apples-to-apples comparison.',
      'Use the true hourly rate to evaluate everyday spending decisions. That $5 daily latte costs you about 9 minutes of work at $31.65/hr true. That $50 dinner is over 1.5 hours of your life. This framing helps prioritize spending on what truly matters.',
      'If your true hourly rate is significantly below minimum wage in your area, you are effectively working for poverty wages despite a comfortable salary — a sign to renegotiate hours, find a closer job, or switch roles.',
    ],

    quickReference: [
      { label: 'Standard Formula', value: 'Salary ÷ (Hours/week × 52)' },
      { label: 'True Formula', value: '(Salary − Commute Costs) ÷ Effective Annual Hours' },
      { label: '$50K, 40hr/wk', value: '~$24.04/hr standard' },
      { label: '$100K, 40hr/wk', value: '~$48.08/hr standard' },
      { label: '$80K + 1hr commute', value: '$38.46 → $31.65 true (18% cut)' },
      { label: '20 PTO days', value: 'Reduces working weeks from 52 to 48' },
      { label: 'Commute cost est.', value: 'IRS mileage rate: $0.70/mile (2026)' },
    ],

    limitations: [
      'Both standard and true hourly rates are gross (pre-tax). Your actual take-home pay after federal, state, FICA, and benefit deductions will be 20-35% lower depending on your tax bracket and state.',
      'Does not account for the value of employer benefits: health insurance ($5K-$20K/year), 401(k) match (typically 3-6% of salary), life insurance, disability coverage, and tuition reimbursement. A job with great benefits at a lower salary can be more valuable than a higher-salary job with no benefits.',
      'Paid Time Off is modeled as a reduction in working weeks, but the calculator assumes a consistent 5-day work week. If you work a compressed 4x10 schedule or have irregular hours, the effective hours calculation will be slightly off.',
      'Commute costs use the simplified daily average. For accurate numbers, use the IRS standard mileage rate ($0.70/mile for 2026) multiplied by your daily round-trip miles, plus actual parking and toll costs. A 30-mile round trip at the IRS rate costs $21/day in vehicle wear alone.',
    ],
citations: [
    { source: 'US Bureau of Labor Statistics', url: 'https://www.bls.gov' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/h/hourly-wage.asp' },
  ],
  },
};

export default salaryHourlyConfig;
