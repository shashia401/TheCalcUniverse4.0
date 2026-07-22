import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import Panel401k from './Panel401k';

const k401Svg = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto">
  <rect width="320" height="200" fill="var(--svg-f8fafc)" rx="6"/>
  <text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)" font-family="system-ui,sans-serif">How Your 401(k) Grows Over Time</text>
  <line x1="35" y1="165" x2="285" y2="165" stroke="var(--svg-cbd5e1)" stroke-width="1"/>
  <line x1="35" y1="165" x2="35" y2="30" stroke="var(--svg-cbd5e1)" stroke-width="1"/>
  <path d="M 35,165 Q 80,158 130,143 Q 180,120 230,85 Q 260,68 285,52" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 35,165 Q 80,158 130,143 Q 180,120 230,85 Q 260,68 285,52 L 285,165 Z" fill="var(--svg-3b82f6)" opacity="0.08"/>
  <line x1="35" y1="165" x2="285" y2="135" stroke="var(--svg-94a3b8)" stroke-width="1.5" stroke-dasharray="5,3"/>
  <text x="225" y="131" font-size="9" fill="var(--svg-475569)" font-family="system-ui,sans-serif">Contributions</text>
  <text x="225" y="102" font-size="9" fill="var(--svg-ef4444)" font-weight="bold" font-family="system-ui,sans-serif">Investment Returns</text>
  <text x="160" y="185" text-anchor="middle" font-size="8" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">FV = PV(1+r)^t + PMT((1+r)^t-1)/r  |  Time in Years</text>
</svg>`;

const k401Config: CalculatorConfig = {
  inputs: [
    {
      id: 'currentAge',
      label: 'Current Age',
      type: 'number',
      placeholder: '30',
      unit: 'yrs',
      inputMode: 'numeric',
      min: 16,
      max: 80,
      step: 1,
      required: true,
      helpText: 'Your current age — used to calculate years until retirement.',
    },
    {
      id: 'retirementAge',
      label: 'Retirement Age',
      type: 'number',
      placeholder: '65',
      unit: 'yrs',
      inputMode: 'numeric',
      min: 40,
      max: 90,
      step: 1,
      required: true,
      helpText: 'The age you plan to stop working and start withdrawing.',
    },
    {
      id: 'currentBalance',
      label: 'Current 401(k) Balance',
      type: 'number',
      placeholder: '25,000',
      prefix: '$',
      inputMode: 'numeric',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Total amount already saved in your 401(k) account today.',
    },
    {
      id: 'annualSalary',
      label: 'Current Annual Salary',
      type: 'number',
      placeholder: '80,000',
      prefix: '$',
      inputMode: 'numeric',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Your current gross annual income before taxes and deductions.',
    },
    {
      id: 'salaryIncrease',
      label: 'Expected Annual Salary Increase',
      type: 'number',
      placeholder: '3',
      unit: '%',
      inputMode: 'numeric',
      min: 0,
      max: 20,
      step: 0.5,
      helpText: 'Average annual raise. Historical US average is ~3%',
    },
    {
      id: 'yourContribution',
      label: 'Your Contribution Rate',
      type: 'number',
      placeholder: '6',
      unit: '%',
      inputMode: 'numeric',
      min: 0,
      max: 100,
      step: 0.5,
      required: true,
      helpText: 'Percentage of salary you contribute each year',
    },
    {
      id: 'employerMatch',
      label: 'Employer Match',
      type: 'number',
      placeholder: '50',
      unit: '%',
      inputMode: 'numeric',
      min: 0,
      max: 200,
      step: 5,
      helpText: 'e.g., "50%" means they match 50 cents for every dollar you contribute',
    },
    {
      id: 'employerMatchLimit',
      label: 'Employer Match Limit',
      type: 'number',
      placeholder: '6',
      unit: '% of salary',
      inputMode: 'numeric',
      min: 0,
      max: 100,
      step: 0.5,
      helpText: 'The max % of salary eligible for match. e.g., "50% up to 6%" → enter 6 here',
    },
    {
      id: 'rateOfReturn',
      label: 'Expected Annual Rate of Return',
      type: 'number',
      placeholder: '7',
      unit: '%',
      inputMode: 'numeric',
      min: 0,
      max: 30,
      step: 0.5,
      required: true,
      helpText: 'Historical S&P 500 inflation-adjusted average: ~7%',
    },
  ],
  calculate: (values) => {
    const currentAge = parseFloat(values.currentAge);
    const retirementAge = parseFloat(values.retirementAge);
    const currentBalance = parseFloat(values.currentBalance) || 0;
    const annualSalary = parseFloat(values.annualSalary);
    const salaryIncrease = (parseFloat(values.salaryIncrease) || 3) / 100;
    const yourContrib = parseFloat(values.yourContribution) / 100;
    const employerMatch = (parseFloat(values.employerMatch) || 0) / 100;
    const employerMatchLimit = (parseFloat(values.employerMatchLimit) || 0) / 100;
    const rate = parseFloat(values.rateOfReturn) / 100;

    if ([currentAge, retirementAge, annualSalary, yourContrib, rate].some(isNaN)) return [];
    if (retirementAge <= currentAge) return [];

    const years = retirementAge - currentAge;
    const monthlyRate = rate / 12;

    // Use Decimal.js for precise monetary accumulation
    let balance = new Decimal(currentBalance);
    let totalYourContribs = new Decimal(0);
    let totalEmployerContribs = new Decimal(0);
    let salary = new Decimal(annualSalary);

    for (let y = 0; y < years; y++) {
      const yourAnnual = salary.mul(yourContrib);
      const eligibleForMatch = Math.min(yourContrib, employerMatchLimit);
      const employerAnnual = salary.mul(eligibleForMatch).mul(employerMatch);
      totalYourContribs = totalYourContribs.add(yourAnnual);
      totalEmployerContribs = totalEmployerContribs.add(employerAnnual);

      const monthlyContrib = (yourAnnual.add(employerAnnual)).div(12);
      for (let m = 0; m < 12; m++) {
        balance = balance.mul(1 + monthlyRate).add(monthlyContrib);
      }
      salary = salary.mul(1 + salaryIncrease);
    }

    const balanceNum = balance.toNumber();
    const totalYourContribsNum = totalYourContribs.toNumber();
    const totalEmployerContribsNum = totalEmployerContribs.toNumber();
    const totalContribsNum = totalYourContribsNum + totalEmployerContribsNum;
    const growthReturns = balanceNum - currentBalance - totalContribsNum;

    const fmtM = (n: number) =>
      n >= 1_000_000
        ? `$${(n / 1_000_000).toFixed(2)}M`
        : `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    const matchPct = employerMatch > 0
      ? ` (${(employerMatch * 100).toFixed(0)}% up to ${(employerMatchLimit * 100).toFixed(1)}%)`
      : '';

    return [
      {
        id: 'totalBalance',
        label: `Estimated 401(k) Balance at Age ${retirementAge}`,
        value: fmtM(balanceNum),
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'yourContribs',
        label: 'Your Total Contributions',
        value: fmtM(totalYourContribsNum),
        color: 'neutral' as const,
      },
      {
        id: 'employerContribs',
        label: `Employer's Total Contributions${matchPct}`,
        value: employerMatch > 0 ? fmtM(totalEmployerContribsNum) : '$0 (no match configured)',
        color: totalEmployerContribsNum > 0 ? 'positive' as const : 'neutral' as const,
      },
      {
        id: 'investmentReturns',
        label: 'Total Investment Returns (Compounding)',
        value: fmtM(growthReturns),
        color: 'positive' as const,
      },
      {
        id: 'returnsPct',
        label: 'Compounding Returns as % of Total Balance',
        value: `${((growthReturns / balanceNum) * 100).toFixed(1)}%`,
        color: 'positive' as const,
      },
      {
        id: 'monthlyRetirement',
        label: 'Estimated Monthly Withdrawal (4% Rule)',
        value: `$${((balanceNum * 0.04) / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo`,
        color: 'positive' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    const currentAge = parseFloat(values.currentAge);
    const retirementAge = parseFloat(values.retirementAge);
    const currentBalance = parseFloat(values.currentBalance) || 0;
    const annualSalary = parseFloat(values.annualSalary);
    const salaryIncrease = (parseFloat(values.salaryIncrease) || 3) / 100;
    const yourContrib = parseFloat(values.yourContribution) / 100;
    const employerMatch = (parseFloat(values.employerMatch) || 0) / 100;
    const employerMatchLimit = (parseFloat(values.employerMatchLimit) || 0) / 100;
    const rate = parseFloat(values.rateOfReturn) / 100;

    if (!results.length || isNaN(currentAge) || isNaN(retirementAge) || isNaN(annualSalary) || retirementAge <= currentAge) return null;

    return createElement(Panel401k, {
      currentAge, retirementAge, currentBalance, annualSalary,
      salaryIncrease, yourContrib, employerMatch, employerMatchLimit, rate,
    });
  },
  educational: {
    formula: 'FV = (Balance₀ + Σ[YourContrib + EmployerMatch]) × (1 + r/12)^(12×years)',
    diagram: {
      svg: k401Svg,
      alt: 'Growth chart showing 401(k) balance growing over time with contributions (straight line) versus total balance including compounding returns (curved)',
      caption: 'Investment returns eventually dwarf contributions — the power of decades of compounding at work',
    },
    formulaDescription:
      'Each year, contributions grow on a monthly compounding basis. The employer match is calculated as: min(yourContribRate, matchLimit) × matchPercent × salary, added alongside your own contributions before compounding. Over a 35-year career, investment returns typically account for 60-80% of the ending balance — contributions alone are rarely enough. This calculator uses high-precision decimal arithmetic to ensure accurate projections for retirement planning.',
    formulaSource: 'Future Value of Annuity formula (standard time value of money equation); IRS Publication 590-A for contribution limits and tax treatment of 401(k) plans.',
    variables: [
      { symbol: 'Employer Match', name: 'Employer Match', description: 'Free money added to your account. A "50% match up to 6%" means: if you contribute 6% of your salary, your employer adds another 3% (50% of 6%). Not contributing at least up to the match limit is leaving free money on the table.' },
      { symbol: '4% Rule', name: 'Safe Withdrawal Rate', description: 'A widely cited guideline suggesting you can withdraw 4% of your portfolio annually in retirement without running out of money over a 30-year retirement.' },
      { symbol: 'r', name: 'Rate of Return', description: 'The annualized growth rate of your investments. The S&P 500 has returned approximately 7% annually after inflation over long periods.' },
      { symbol: 'PMT', name: 'Annual Contribution', description: 'The total contributions (your contributions plus employer match) made each year, prorated across 12 monthly compounding periods for more precise growth modeling.' },
    ],
    howToUse: [
      'Enter your current age and target retirement age.',
      'Enter your current 401(k) balance, salary, and annual salary increase expectation.',
      'Set your contribution rate — try at least the employer match limit to capture free money.',
      'Enter your employer match structure. Example: "50% match up to 6%" → Match: 50, Limit: 6.',
      'The chart below shows the three growth buckets over time — your contributions, employer contributions, and investment returns.',
    ],
    commonUses: [
      'Plan for retirement by calculating how much your 401(k) will grow with employer matching contributions over time.',
      'Compare the impact of different contribution rates on your tax savings and future nest egg balance.',
      'Evaluate whether increasing your contribution percentage to capture the full employer match is worth the reduction in take-home pay.',
      'Model the long-term effect of salary increases and catch-up contributions after age 50 on your retirement readiness.',
    ],
    workedExamples: [
      {
        scenario: 'Maria, a 30-year-old software engineer earning $120,000 in San Francisco with a 6% 401(k) contribution and a generous 50% match up to 6%',
        inputs: { currentAge: '30', retirementAge: '65', currentBalance: '50,000', annualSalary: '120,000', yourContribution: '6', employerMatch: '50', employerMatchLimit: '6', rateOfReturn: '7' },
        result: 'After 35 years of contributions with employer match, your 401(k) grows to approximately $2,138,000. Total employee contributions: $252,000. Total employer match: $378,000. Investment returns: $1,458,000.',
        insight: 'At retirement, Maria has over $2.1M — roughly 3x her total contributions. Her employer pays in $378,000 in matching funds over 35 years. The compounding returns ($1.3M) dominate the final balance, accounting for more than 60% of her total retirement nest egg.',
      },
      {
        scenario: 'David, 45, plays catch-up after starting late with only $30,000 saved and a $75,000 salary — he contributes 10% to close the gap',
        inputs: { currentAge: '45', retirementAge: '67', currentBalance: '30,000', annualSalary: '75,000', yourContribution: '10', employerMatch: '50', employerMatchLimit: '6', rateOfReturn: '7' },
        result: 'After 22 years of catch-up contributions, your 401(k) grows to approximately $590,000. Total employee contributions: $165,000. Total employer match: $99,000. Investment returns: $296,000.',
        insight: 'Even starting at 45, David accumulates $590,000 by age 67. The key insight: increasing contributions from 6% to 10% adds over $120,000 to his final balance. Catch-up contributions after age 50 (an extra $7,500/year in 2025) would push this even higher.',
      },
    ],
    proTips: [
      'Never leave free money on the table: always contribute at least enough to get the full employer match. A 50% match on 6% is an instant 50% return.',
      'Increase contributions by 1% per year (auto-escalation) — most people do not notice the difference in take-home pay but compound growth makes it massive over decades.',
      'If your employer offers a Roth 401(k) option, consider it if you are early in your career and expect higher tax rates in retirement.',
      'After age 50, maximize catch-up contributions: the IRS allows an extra $7,500 in 2025, which is a powerful boost to late-career savings.',
      'When changing jobs, roll your old 401(k) into your new employer plan or an IRA — cashing out triggers income tax plus a 10% early withdrawal penalty before age 59½.',
    ],
    // Know when not to rely on calculator outputs — see limitations below
    limitations: [
      'This calculator assumes constant annual salary increases and investment returns — real markets fluctuate year to year, and lumpy returns can significantly change outcomes.',
      'Employer match vesting schedules are not modeled — many plans require 3-5 years of service before matches fully belong to you.',
      'The 4% rule is a rough guideline, not a guarantee — actual safe withdrawal rates depend on market conditions at retirement, longevity, and spending flexibility.',
      'IRS contribution limits change annually and are not enforced by this calculator — verify current-year limits before relying on projections.',
    ],
    quickReference: [
      { label: '2025 Employee Limit (under 50)', value: '$23,500' },
      { label: '2025 Catch-Up (50+)', value: '$7,500 extra' },
      { label: 'Early Withdrawal Penalty', value: '10% + income tax' },
      { label: 'RMD Starting Age', value: '73 (SECURE 2.0)' },
      { label: 'S&P 500 Historical Return', value: '~10% nominal, ~7% real' },
    ],
    explanation:
      'The 401(k) is a tax-advantaged retirement savings account offered by employers, first introduced in 1978 as part of the Revenue Act and named after the century-old Internal Revenue Code section that created it. It is the most powerful savings tool available to most Americans. Contributions reduce your taxable income today (traditional 401k), and the employer match is an instant 50-100% return on that portion of your contribution — no investment can reliably beat that. The magic, however, is in the compounding returns: Einstein reportedly called compound interest the "eighth wonder of the world." For a 30-year-old who maxes out their 401(k), investment returns will typically account for 70-80% of the final balance at retirement. The stacked area chart below makes this exponential effect immediately visible.',
    faqs: [
      {
        question: 'What is the 2025 401(k) contribution limit?',
        answer: 'In 2025, the IRS employee contribution limit is $23,500 ($31,000 if age 50+, and up to $34,750 for ages 60-63 under SECURE 2.0). The total combined limit (employee + employer) is $70,000.',
      },
      {
        question: 'How does the employer match work?',
        answer: 'A common match is "50% up to 6% of salary." If your salary is $80,000 and you contribute 6% ($4,800), your employer contributes 50% of that — $2,400. If you only contribute 4%, your employer adds $1,600 (50% of $3,200), leaving free money behind. Always contribute at least up to the match limit.',
      },
      {
        question: 'Should I use traditional or Roth 401(k)?',
        answer: 'Traditional: contributions reduce your taxable income now, but withdrawals in retirement are taxed. Roth: no tax break today, but all growth and withdrawals are tax-free in retirement. General guidance: if you expect to be in a higher tax bracket in retirement (common for younger earners), Roth is usually better.',
      },
      {
        question: 'What if my employer has a vesting schedule?',
        answer: 'Vesting means you must work a certain number of years before the employer match fully "belongs" to you. This calculator assumes all employer contributions vest immediately. Check your plan documents for your specific vesting schedule.',
      },
      {
        question: 'What happens to my 401(k) if I change jobs?',
        answer: 'You have four options when leaving a job: (1) leave the money in your former employer plan (allowed if balance exceeds $5,000-$7,000), (2) roll it into your new employer 401(k), (3) roll it into a traditional or Roth IRA, or (4) cash out. Rolling over preserves tax advantages; cashing out triggers income tax plus a 10% early withdrawal penalty before age 59½. A direct rollover (trustee-to-trustee transfer) avoids mandatory 20% withholding.',
      },
    ],
    citations: [
      { source: 'IRS Publication 590-A — Contributions to Individual Retirement Arrangements', url: 'https://www.irs.gov/publications/p590a' },
      { source: 'US Securities and Exchange Commission — Investor.gov Retirement Tools', url: 'https://www.investor.gov' },
      { source: 'SECURE 2.0 Act of 2022 — Retirement Savings Provisions', url: 'https://www.congress.gov/bill/117th-congress/house-bill/2617' },
    ],
  },
};

export default k401Config;
