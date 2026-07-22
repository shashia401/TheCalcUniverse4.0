import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import CollegeCostPanel from './CollegeCostPanel';

/*
  College Board 2024-2025 average published tuition & fees and room & board.
  Source: College Board, "Trends in College Pricing 2024"
  https://research.collegeboard.org/trends/college-pricing
*/
const TUITION_DATA: Record<string, { tuition: number; roomBoard: number }> = {
  'in-state':  { tuition: 11260, roomBoard: 12770 },
  'out-state': { tuition: 22980, roomBoard: 12770 },
  'private':   { tuition: 41540, roomBoard: 14650 },
};

const INSTITUTION_LABELS: Record<string, string> = {
  'in-state':  'In-State Public',
  'out-state': 'Out-of-State Public',
  'private':   'Private Nonprofit',
};

const collegeCostConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'childAge',
      label: "Child's Current Age",
      type: 'number',
      placeholder: '8',
      inputMode: 'numeric',
      min: 0,
      max: 22,
      step: 1,
      required: true,
      helpText: 'Current age of the child. Used to calculate years until college (assumes college starts at age 18).',
    },
    {
      id: 'currentSavings',
      label: 'Current College Savings',
      type: 'number',
      placeholder: '10,000',
      prefix: '$',
      inputMode: 'numeric',
      min: 0,
      step: 100,
      required: true,
      helpText: 'Total amount already saved for college (529 plan, savings account, etc.)',
    },
    {
      id: 'monthlyContribution',
      label: 'Monthly Contribution',
      type: 'number',
      placeholder: '200',
      prefix: '$',
      inputMode: 'numeric',
      min: 0,
      step: 10,
      required: true,
      helpText: 'Amount you plan to save each month between now and when college begins',
    },
    {
      id: 'institutionType',
      label: 'Institution Type',
      type: 'select',
      required: true,
      options: [
        { label: 'In-State Public (avg. $11,260/yr tuition)', value: 'in-state' },
        { label: 'Out-of-State Public (avg. $22,980/yr tuition)', value: 'out-state' },
        { label: 'Private Nonprofit (avg. $41,540/yr tuition)', value: 'private' },
      ],
      helpText: 'Average 2024-25 tuition & fees from College Board data',
    },
    {
      id: 'includeRoomBoard',
      label: 'Include Room & Board',
      type: 'select',
      required: true,
      options: [
        { label: 'Yes — include room & board in cost estimate', value: 'yes' },
        { label: 'No — tuition & fees only', value: 'no' },
      ],
      helpText: 'Room & board averages $12,770/yr (public) to $14,650/yr (private)',
    },
    {
      id: 'additionalCosts',
      label: 'Additional Annual Costs (Optional)',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      inputMode: 'numeric',
      min: 0,
      step: 100,
      helpText: 'Additional annual costs beyond tuition and room & board (e.g., books, supplies, travel, personal expenses).',
    },
    {
      id: 'financialAid',
      label: 'Expected Annual Financial Aid (Optional)',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      inputMode: 'numeric',
      min: 0,
      step: 100,
      helpText: 'Expected annual financial aid, grants, or scholarships to subtract from the annual cost.',
    },
    {
      id: 'tuitionInflation',
      label: 'Annual Tuition Inflation Rate',
      type: 'number',
      placeholder: '5.0',
      unit: '%',
      inputMode: 'numeric',
      min: 0,
      max: 20,
      step: 0.1,
      required: true,
      helpText: 'Historical college cost inflation has averaged 5-6% per year. Enter your assumed rate.',
    },
    {
      id: 'growthRate',
      label: 'Expected Annual Investment Return',
      type: 'number',
      placeholder: '6',
      unit: '%',
      inputMode: 'numeric',
      min: 0,
      max: 20,
      step: 0.1,
      required: true,
      helpText: 'Expected annual return on your college savings (529 plan historical average: 5-7%)',
    },
    {
      id: 'collegeYears',
      label: 'Expected Years in College',
      type: 'number',
      placeholder: '4',
      inputMode: 'numeric',
      min: 1,
      max: 6,
      step: 1,
      required: true,
      helpText: 'Typical undergraduate programs are 4 years. Some programs may be 2 or 5 years.',
    },
  ],

  calculate: (values) => {
    const childAge = parseFloat(values.childAge);
    const currentSavings = parseFloat(values.currentSavings);
    const monthlyContribution = parseFloat(values.monthlyContribution) || 0;
    const institutionType = values.institutionType || 'in-state';
    const includeRoomBoard = values.includeRoomBoard || 'yes';
    const tuitionInflation = parseFloat(values.tuitionInflation) / 100;
    const growthRate = parseFloat(values.growthRate) / 100;
    const collegeYears = parseFloat(values.collegeYears) || 4;
    const additionalCosts = parseFloat(values.additionalCosts) || 0;
    const financialAid = parseFloat(values.financialAid) || 0;

    if (isNaN(childAge) || isNaN(currentSavings) || isNaN(tuitionInflation) || isNaN(growthRate) || childAge < 0 || childAge > 22 || currentSavings < 0 || monthlyContribution < 0 || additionalCosts < 0 || financialAid < 0) return [];

    const yearsUntilCollege = Math.max(0, 18 - childAge);
    const costData = TUITION_DATA[institutionType] || TUITION_DATA['in-state'];
    const baseAnnualCost = costData.tuition + (includeRoomBoard === 'yes' ? costData.roomBoard : 0);
    const annualCostNow = baseAnnualCost + additionalCosts - financialAid;
    const showBaseCost = additionalCosts > 0 || financialAid > 0;

    // Project total college cost using Decimal.js for precision
    let totalProjectedCost = new Decimal(0);
    const yearByYearCost: number[] = [];
    for (let y = 0; y < collegeYears; y++) {
      const costInYear = new Decimal(annualCostNow)
        .mul(new Decimal(1 + tuitionInflation).pow(yearsUntilCollege + y))
        .toNumber();
      yearByYearCost.push(costInYear);
      totalProjectedCost = totalProjectedCost.add(costInYear);
    }
    const totalProjectedCostNum = totalProjectedCost.toNumber();

    // Project savings at college start
    const monthlyRate = growthRate / 12;
    const monthsUntilCollege = yearsUntilCollege * 12;

    let savingsAtCollege: number;
    if (monthlyRate === 0) {
      savingsAtCollege = currentSavings + monthlyContribution * monthsUntilCollege;
    } else {
      savingsAtCollege =
        currentSavings * Math.pow(1 + monthlyRate, monthsUntilCollege) +
        monthlyContribution * ((Math.pow(1 + monthlyRate, monthsUntilCollege) - 1) / monthlyRate);
    }

    const gap = Math.max(0, totalProjectedCostNum - savingsAtCollege);

    // Monthly savings needed to close the gap (assuming same return rate)
    let monthlyNeeded = 0;
    if (gap > 0 && monthsUntilCollege > 0) {
      if (monthlyRate === 0) {
        monthlyNeeded = gap / monthsUntilCollege;
      } else {
        monthlyNeeded =
          (gap * monthlyRate) / (Math.pow(1 + monthlyRate, monthsUntilCollege) - 1);
      }
    }

    const fmt = (n: number) => new Decimal(n).toFixed(2);
    const fmtLarge = (n: number) => {
      if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
      return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    };
    const pctFunded = savingsAtCollege > 0 ? Math.min(100, (savingsAtCollege / totalProjectedCostNum) * 100) : 0;

    const results: Array<{ id: string; label: string; value: string; highlight?: boolean; color: 'positive' | 'negative' | 'neutral' }> = [];

    if (showBaseCost) {
      results.push(
        { id: 'currentBaseCost', label: `Base Annual Cost (Before Additional Costs & Aid)`, value: fmtLarge(baseAnnualCost), color: 'neutral' as const },
      );
    }

    results.push(
      { id: 'projectedCost', label: `Projected Cost of ${collegeYears}-Year Degree`, value: fmtLarge(totalProjectedCostNum), highlight: true, color: 'negative' as const },
      { id: 'currentAnnualCost', label: `Current ${INSTITUTION_LABELS[institutionType]} Annual Cost`, value: fmtLarge(annualCostNow), color: 'neutral' as const },
      { id: 'costAtStart', label: `Annual Cost When College Starts (${Math.round(yearsUntilCollege)} yrs)`, value: fmtLarge(yearByYearCost[0] || 0), color: 'neutral' as const },
      { id: 'savingsAtCollege', label: 'Projected Savings at College Start', value: fmtLarge(savingsAtCollege), color: 'positive' as const },
      { id: 'fundingGap', label: 'Funding Gap', value: gap > 0 ? fmtLarge(gap) : 'None — fully funded!', color: gap > 0 ? 'negative' as const : 'positive' as const, highlight: gap > 0 },
      { id: 'pctFunded', label: 'Percent of Costs Covered', value: `${pctFunded.toFixed(0)}%`, color: pctFunded >= 80 ? 'positive' as const : pctFunded >= 50 ? 'neutral' as const : 'negative' as const },
    );

    if (gap > 0 && monthsUntilCollege > 0) {
      results.push(
        { id: 'monthlyNeeded', label: 'Additional Monthly Savings Needed', value: `$${fmt(monthlyNeeded)}`, highlight: true, color: monthlyNeeded > 0 ? 'negative' as const : 'positive' as const },
        { id: 'totalMonthly', label: 'Total Monthly Savings Needed', value: `$${fmt(monthlyContribution + monthlyNeeded)}`, color: 'neutral' as const },
      );
    }

    results.push(
      { id: 'yearsUntilCollege', label: 'Years Until College', value: `${Math.round(yearsUntilCollege)} year${Math.round(yearsUntilCollege) !== 1 ? 's' : ''}`, color: 'neutral' as const },
      { id: 'methodology', label: 'Data Source', value: 'Annual cost projections use the College Board 2024-25 published tuition & fees and estimated room & board. Tuition is assumed to increase at the specified annual rate. Savings projections assume the specified annual return compounded monthly. This is a simplified projection — actual costs and returns will vary. See collegecost.ed.gov for official net price data.', color: 'neutral' as const },
    );

    return results;
  },

  extraPanel: (values, results) => {
    const childAge = parseFloat(values.childAge);
    const currentSavings = parseFloat(values.currentSavings);
    const monthlyContribution = parseFloat(values.monthlyContribution) || 0;
    const institutionType = values.institutionType || 'in-state';
    const includeRoomBoard = values.includeRoomBoard || 'yes';
    const tuitionInflation = parseFloat(values.tuitionInflation) / 100;
    const growthRate = parseFloat(values.growthRate) / 100;
    const collegeYears = parseFloat(values.collegeYears) || 4;

    if (!results.length || isNaN(childAge) || isNaN(currentSavings) || childAge < 0 || currentSavings < 0) return null;

    const yearsUntilCollege = Math.max(0, 18 - childAge);
    const costData = TUITION_DATA[institutionType] || TUITION_DATA['in-state'];
    const annualCostNow = costData.tuition + (includeRoomBoard === 'yes' ? costData.roomBoard : 0);

    return createElement(CollegeCostPanel, {
      annualCostNow,
      yearsUntilCollege,
      collegeYears,
      tuitionInflation,
      growthRate,
      currentSavings,
      monthlyContribution,
      institutionLabel: INSTITUTION_LABELS[institutionType],
    });
  },

  educational: {
    formula: 'FV = PV × (1 + r)^n  +  PMT × [((1 + r)^n − 1) / r]',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">College Cost Projection</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Tuition costs rise with inflation while savings grow with investments</text><g transform="translate(30,65)"><text x="370" y="14" text-anchor="end" font-size="10" font-weight="bold" fill="var(--svg-ef4444)">Cost: $180K</text><path d="M 40,120 Q 100,110 160,90 Q 220,70 280,40 Q 310,25 340,10" fill="none" stroke="var(--svg-ef4444)" stroke-width="3" stroke-linecap="round"/><text x="160" y="100" text-anchor="middle" font-size="9" fill="var(--svg-ef4444)" font-weight="bold">Tuition Inflation (5%/yr)</text><text x="370" y="120" text-anchor="end" font-size="10" font-weight="bold" fill="var(--svg-22c55e)">Savings: $120K</text><path d="M 40,170 Q 100,168 160,160 Q 220,140 280,100 Q 310,80 340,60" fill="none" stroke="var(--svg-22c55e)" stroke-width="3" stroke-linecap="round" stroke-dasharray="6,3"/><text x="220" y="155" text-anchor="middle" font-size="9" fill="var(--svg-22c55e)" font-weight="bold">Savings Growth (6%/yr)</text><path d="M 340,35 L 340,55" stroke="var(--svg-f59e0b)" stroke-width="2"/><text x="380" y="50" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-f59e0b)">Gap: $60K</text><line x1="40" y1="170" x2="40" y2="120" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="30" y="148" text-anchor="end" font-size="9" fill="var(--svg-94a3b8)" transform="rotate(-90,30,148)">$</text><text x="40" y="192" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">Today</text><text x="160" y="192" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">Age 13</text><text x="340" y="192" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">Age 18</text></g><g transform="translate(40,215)"><rect x="10" y="0" width="370" height="110" rx="10" fill="var(--svg-f1f5f9)"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">What Makes Up the Cost?</text><rect x="25" y="28" width="60" height="24" rx="4" fill="var(--svg-3b82f6)"/><text x="55" y="44" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Tuition</text><rect x="95" y="28" width="80" height="24" rx="4" fill="var(--svg-f59e0b)"/><text x="135" y="44" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Room and Board</text><rect x="185" y="28" width="70" height="24" rx="4" fill="var(--svg-8b5cf6)"/><text x="220" y="44" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Fees</text><rect x="265" y="28" width="100" height="24" rx="4" fill="var(--svg-22c55e)"/><text x="315" y="44" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Inflation</text><text x="195" y="78" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Public In-State 4yr: $24K/yr today to $45K/yr at college start</text><text x="195" y="96" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Start saving early — each year of delay costs thousands in lost growth</text></g></svg>',
      alt: 'College cost projection diagram showing rising tuition cost curve (red) vs savings growth curve (green) over time, with funding gap highlighted in orange',
      caption: 'College costs rise faster than general inflation (5% historically), making early savings critical to close the funding gap',
    },
    formulaDescription:
      'The cost projection uses compound growth (FV = future value, PV = current cost, r = inflation rate, n = years). The savings projection adds both the compounded value of current savings and the future value of a series of monthly contributions (ordinary annuity). This calculator uses decimal.js high-precision arithmetic for all cost projections, and College Board 2024-25 data as the baseline. The funding gap calculation shows exactly what additional savings are needed to close the shortfall.',
    formulaSource: 'Future Value of Annuity formula (standard time value of money). College cost data from College Board "Trends in College Pricing 2024." 529 plan tax treatment per IRS Publication 970.',
    variables: [
      { symbol: 'PV', name: 'Current Cost', description: 'Today\'s average annual tuition, fees, and room & board for the selected institution type based on College Board 2024-25 published data.' },
      { symbol: 'r', name: 'Rate per Period', description: 'Tuition inflation rate (for cost projections) or investment return rate (for savings projections), divided by 12 for monthly compounding.' },
      { symbol: 'n', name: 'Number of Periods', description: 'Months until college starts for savings projections; years for cost inflation projections.' },
      { symbol: 'PMT', name: 'Monthly Contribution', description: 'The amount you plan to save each month toward college. Consistent monthly contributions benefit from dollar-cost averaging and compound growth.' },
      { symbol: '529 Plan', name: 'Tax-Advantaged Education Account', description: 'A state-sponsored investment account offering tax-free growth and tax-free withdrawals for qualified education expenses. Many states offer a state income tax deduction for contributions, making 529 plans the most effective savings vehicle for college.' },
    ],
    howToUse: [
      'Enter the child\'s current age — the calculator assumes college starts at age 18.',
      'Enter your current college savings and planned monthly contribution.',
      'Select the institution type — pre-filled with College Board 2024-25 average tuition & fees.',
      'Toggle room & board on or off depending on what you expect to cover.',
      'Set your assumed tuition inflation rate (historical average: 5%) and expected investment return (529 plan average: 5-7%).',
      'See your projected total cost, savings, funding gap, and the additional monthly amount needed.',
    ],
    commonUses: [
      'Project the future cost of your child college education based on current tuition rates and historical inflation trends.',
      'Determine how much you need to save monthly in a 529 plan to fully cover tuition, fees, and room and board by age 18.',
      'Compare the total cost of in-state public, out-of-state public, and private universities to plan your savings target.',
    ],
    workedExamples: [
      {
        scenario: 'The Johnsons in Denver have an 8-year-old daughter and $10,000 saved in a 529 plan. They contribute $200/month and plan for in-state public university with room & board.',
        inputs: { childAge: '8', currentSavings: '10000', monthlyContribution: '200', institutionType: 'in-state', includeRoomBoard: 'yes', tuitionInflation: '5', growthRate: '6', collegeYears: '4' },
        result: 'Projected 4-year cost: $171,000. Savings grow to approximately $51,000 by college age, covering 30% of costs. Funding gap: $120,000. To close fully, save an additional $595/month.',
        insight: 'Projected 4-year cost: $171,000. Their savings grow to ~$51,000 by college age — covering just 30% of costs, leaving a $120,000 funding gap. To close it fully, they would need to save an additional $595/month, totaling $795/month. Starting at birth instead of age 8 would have reduced the monthly need by nearly half due to the extra compounding years.',
      },
      {
        scenario: 'A newborn has $5,000 in a 529 plan gifted by grandparents. Parents plan to save for a private university with room & board, hoping to cover 100% of projected costs.',
        inputs: { childAge: '0', currentSavings: '5000', monthlyContribution: '0', institutionType: 'private', includeRoomBoard: 'yes', tuitionInflation: '5', growthRate: '6', collegeYears: '4' },
        result: 'Projected 4-year private cost: $403,000. To cover 100% from birth, save $531/month. Starting at age 5 instead would require $690/month — a 30% penalty for the delay.',
        insight: 'Projected 4-year private cost: $403,000. To cover 100%, parents need to save $531/month from birth. Waiting until the child is 5 would increase the required monthly savings to $690/month — a 30% penalty for the 5-year delay. The power of starting at birth: even with only $5,000 initially, compound growth over 18 years does heavy lifting.',
      },
    ],
    proTips: [
      'Start a 529 plan at birth: compound growth works hardest over the longest time horizon. A $200/month contribution starting at birth grows to $70,000+ by college; starting at age 10 yields only $26,000.',
      'Use your state 529 plan if it offers a tax deduction — over 30 states provide a state income tax deduction or credit for 529 contributions, effectively giving you an instant return on your savings.',
      'Grandparents can contribute to a 529 without affecting FAFSA eligibility as long as distributions are made after the FAFSA filing year (the "grandparent loophole" fixed by the FAFSA Simplification Act).',
      'Treat the projected number as a planning target, not a fixed obligation — financial aid, scholarships, and grants reduce actual costs significantly. The average net price at public universities is roughly 40% below sticker price.',
    ],
    // When not to rely on these projections: always verify with official net price calculators
    limitations: [
      'These projections use "sticker prices" — actual net prices after financial aid, grants, and scholarships are typically 30-60% lower. Use the Net Price Calculator on each school\'s website for individual estimates.',
      'College Board data is national averages — costs vary significantly by state, specific institution, and program. Flagship public universities often cost more than the state average.',
      'Tuition inflation is assumed constant at your specified rate — historically, college inflation has varied from 2% to 8% annually depending on the period and institution type.',
      '529 plan investment returns are not guaranteed — market returns can be negative in any given year, and a market downturn near college age can significantly reduce available funds.',
    ],
    quickReference: [
      { label: 'In-State Public (2024-25)', value: '$24,030/yr (all-in)' },
      { label: 'Private Nonprofit (2024-25)', value: '$56,190/yr (all-in)' },
      { label: '529 Contribution Limit', value: '$18,000/yr gift tax exclusion' },
      { label: 'Historical Tuition Inflation', value: '5% avg (past 20 yrs)' },
      { label: 'FAFSA Simplification (2024+)', value: 'Uses prior-prior year income' },
    ],
    explanation:
      'College costs have historically risen faster than general inflation — averaging 5-6% annually over the past 20 years, a trend that began in the 1980s as states reduced per-student funding for public universities. A child born today could face $100,000+ in total costs for a 4-year in-state public education, and over $200,000 for a private institution. The key to managing this is starting early: saving $200/month from birth could grow to $50,000-70,000 by college age with a 6% return, but the same amount starting at age 10 yields only $26,000 — the difference is pure compound growth. This calculator uses the latest College Board data as a baseline, then projects costs forward using your assumed inflation rate. The savings projection assumes your 529 or investment account compounds monthly at your expected return rate. 529 plans, named after Section 529 of the Internal Revenue Code (enacted in 1996), have become the primary college savings vehicle for American families, with over $450 billion in total assets.',
    faqs: [
      {
        question: 'Is the College Board data for tuition only, or does it include all costs?',
        answer: 'The College Board published tuition & fees figures are averages that include mandatory charges. Room & board is estimated separately and added when you toggle the option on. These are "sticker prices" — actual net prices are often lower after financial aid, grants, and scholarships. For your specific situation, use the Net Price Calculator at each school\'s website or visit collegecost.ed.gov.',
      },
      {
        question: 'What is a realistic tuition inflation rate to use?',
        answer: 'College tuition inflation has averaged about 5% annually over the past 20 years, but the rate varies significantly by institution type. Public 4-year in-state tuition has risen faster (6-7% in some periods) while private tuition has risen more slowly (3-4%). A 5% assumption is reasonable for long-term planning. For a conservative estimate, use 6%. For an optimistic estimate, use 4%. You can also run multiple scenarios to see a range of possible outcomes.',
      },
      {
        question: 'Should I use a 529 plan or a regular investment account?',
        answer: '529 plans offer tax-free growth and tax-free withdrawals for qualified education expenses. Many states also offer a state income tax deduction for contributions. The main trade-off is that 529 funds must be used for education (with a 10% penalty on non-qualified earnings withdrawals). If you\'re confident the money will fund education, a 529 is almost always the better choice. Coverdell ESAs are another option with more investment flexibility but lower contribution limits ($2,000/year).',
      },
      {
        question: 'What if I haven\'t started saving yet?',
        answer: 'The best time to start is now. Because of compound growth, starting early dramatically reduces the monthly amount needed. For example, saving for a newborn requires roughly half the monthly contribution needed if you start when the child is age 10 — even though you\'re saving for fewer years, the longer compounding window on the earlier savings makes a massive difference. The calculator shows exactly how much you need to save monthly to close any funding gap.',
      },
      {
        question: 'How accurate are these cost projections?',
        answer: 'These projections are estimates based on historical averages and your assumptions. Actual costs will vary based on the specific institution, financial aid received, scholarships, and actual inflation rates. We recommend treating this as a planning tool and revisiting your projections annually. The "Data Source" result links to collegecost.ed.gov for official net price data from specific schools. Always use official net price calculators on individual college websites before making financial decisions.',
      },
    ],
    citations: [
      { source: 'College Board — Trends in College Pricing 2024', url: 'https://research.collegeboard.org/trends/college-pricing' },
      { source: 'US Department of Education — Federal Student Aid', url: 'https://studentaid.gov' },
      { source: 'IRS Publication 970 — Tax Benefits for Education', url: 'https://www.irs.gov/publications/p970' },
    ],
  },
};

export default collegeCostConfig;
