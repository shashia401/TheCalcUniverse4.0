import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import FIREPanel from './FIREPanel';

function solveYearsToFire(
  nw: number,
  annualSavings: number,
  fireNumber: number,
  returnRate: number
): number {
  if (nw >= fireNumber) return 0;
  if (annualSavings <= 0 || returnRate <= 0) return Infinity;

  const r = returnRate / 100;
  let t = 0;
  let balance = nw;
  const maxYears = 100;
  const target = fireNumber;

  while (t < maxYears && balance < target) {
    balance = balance * (1 + r) + annualSavings;
    t++;
    if (balance >= target) return t;
  }
  return maxYears;
}

const fireCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'currentAge',
      label: 'Your Current Age',
      type: 'number',
      placeholder: '30',
      unit: 'years',
      inputMode: 'decimal',
      min: 0,
      max: 100,
      step: 1,
      required: true,
      helpText: 'Your current age. Used to calculate your age at financial independence.',
    },
    {
      id: 'currentNetWorth',
      label: 'Current Net Worth',
      type: 'number',
      placeholder: '100000',
      prefix: '$',
      inputMode: 'decimal',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Your total savings and investments excluding home equity',
    },
    {
      id: 'annualIncome',
      label: 'Annual Income (Pre-Tax)',
      type: 'number',
      placeholder: '80000',
      prefix: '$',
      inputMode: 'decimal',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Your total annual gross income before taxes and deductions.',
    },
    {
      id: 'annualExpenses',
      label: 'Annual Expenses',
      type: 'number',
      placeholder: '50000',
      prefix: '$',
      inputMode: 'decimal',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Your expected annual spending in retirement',
    },
    {
      id: 'currentSavingsRate',
      label: 'Current Savings Rate (optional)',
      type: 'number',
      placeholder: '',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 100,
      step: 0.1,
      helpText: 'Leave blank to auto-calculate from income and expenses',
    },
    {
      id: 'investmentReturn',
      label: 'Expected Annual Investment Return',
      type: 'number',
      placeholder: '7',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 30,
      step: 0.1,
      required: true,
      helpText: 'Annual return you expect on your investment portfolio. Historical S&P 500 average: ~7% after inflation.',
    },
    {
      id: 'targetWithdrawalRate',
      label: 'Target Safe Withdrawal Rate',
      type: 'number',
      placeholder: '4',
      unit: '%',
      inputMode: 'decimal',
      min: 1,
      max: 10,
      step: 0.25,
      required: true,
      helpText: 'The Trinity Study recommends 4% as the standard safe withdrawal rate',
    },
    {
      id: 'fireType',
      label: 'FIRE Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Standard FIRE (4% Rule)', value: 'standard' },
        { label: 'Lean FIRE (Minimalist)', value: 'lean' },
        { label: 'Fat FIRE (Luxury)', value: 'fat' },
        { label: 'Coast FIRE (Barista FI)', value: 'coast' },
      ],
      helpText: 'Different FIRE styles target different retirement lifestyles',
    },
  ],
  calculate: (values) => {
    const currentAge = parseFloat(values.currentAge);
    const nw = parseFloat(values.currentNetWorth);
    const income = parseFloat(values.annualIncome);
    const expenses = parseFloat(values.annualExpenses);
    const savingsRateInput = parseFloat(values.currentSavingsRate);
    const investmentReturn = parseFloat(values.investmentReturn) || 7;
    const withdrawalRate = parseFloat(values.targetWithdrawalRate) || 4;
    const fireType = values.fireType || 'standard';

    if (
      isNaN(currentAge) ||
      isNaN(nw) ||
      isNaN(income) ||
      isNaN(expenses) ||
      currentAge < 0 ||
      income <= 0 ||
      expenses < 0
    )
      return [];

    const incomeSavingsRate = income > 0
      ? Math.min(100, ((income - expenses) / income) * 100)
      : 0;
    const savingsRate = !isNaN(savingsRateInput) && savingsRateInput > 0
      ? Math.min(100, savingsRateInput)
      : Math.max(0, incomeSavingsRate);

    const annualSavings = income - expenses;
    const wr = withdrawalRate / 100;
    const r0 = investmentReturn / 100;

    // Coast FIRE targets a retirement age (traditionally 65, per the Trinity
    // Study convention this calculator's own educational content already
    // cites) rather than "stop working now" — see quickReference below.
    const COAST_RETIREMENT_AGE = 65;

    let fireNumber: number;
    let coastFireNumber: number | null = null;
    switch (fireType) {
      case 'lean':
        fireNumber = expenses * 25;
        break;
      case 'fat':
        fireNumber = expenses * 1.5 * 25;
        break;
      case 'coast': {
        fireNumber = expenses / wr;
        const yearsToRetirement = Math.max(0, COAST_RETIREMENT_AGE - currentAge);
        coastFireNumber = fireNumber / Math.pow(1 + r0, yearsToRetirement);
        break;
      }
      default:
        fireNumber = expenses / wr;
    }

    // For Coast FIRE, "years to FIRE" means years of continued contributions
    // until net worth alone can compound to fireNumber by age 65 — not years
    // to reach fireNumber directly (that's what makes Coast FIRE different
    // from Standard FIRE).
    const solveTarget = fireType === 'coast' && coastFireNumber !== null ? coastFireNumber : fireNumber;
    const yearsToFire = solveYearsToFire(nw, Math.max(0, annualSavings), solveTarget, investmentReturn);
    const fireAge = currentAge + (yearsToFire === Infinity ? 99 : yearsToFire);
    const monthlySavings = Math.max(0, annualSavings / 12);

    let nwAtRetirement = nw;
    let totalContributions = nw;
    for (let i = 0; i < (yearsToFire === Infinity ? 0 : yearsToFire); i++) {
      nwAtRetirement = nwAtRetirement * (1 + r0) + Math.max(0, annualSavings);
      totalContributions += Math.max(0, annualSavings);
    }

    const fmt = (val: number) =>
      val >= 1_000_000
        ? `$${(val / 1_000_000).toFixed(2)}M`
        : `$${val.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`;

    const fireTypeLabels: Record<string, string> = {
      standard: 'Standard FIRE',
      lean: 'Lean FIRE',
      fat: 'Fat FIRE',
      coast: 'Coast FIRE',
    };

    return [
      {
        id: 'fireNumber',
        label: 'Target FIRE Number',
        value: fmt(fireNumber),
        highlight: true,
        color: 'positive',
        interpretation: `This is built on the 4% withdrawal rule — historically a portfolio this size can sustain your annual spending indefinitely, adjusted for inflation. It assumes a diversified portfolio and doesn't account for sequence-of-returns risk (a bad market right after you retire); many ${fireTypeLabels[fireType] || 'FIRE'} planners treat 4% as a starting point and stay flexible on spending in down years.`,
      },
      ...(fireType === 'coast' && coastFireNumber !== null
        ? [
            {
              id: 'coastFireNumber',
              label: 'Coast FIRE Number (Needed Today)',
              value: fmt(coastFireNumber),
              highlight: true,
              color: 'positive' as const,
              interpretation: `The amount you need invested right now so that, compounding at ${investmentReturn}% with zero further contributions, it grows to your ${fmt(fireNumber)} FIRE number by age ${COAST_RETIREMENT_AGE}. ${
                nw >= coastFireNumber
                  ? "You're already there — your current net worth alone is projected to coast to your FIRE number without another dollar saved."
                  : `You still need ${fmt(coastFireNumber - nw)} more before you can stop contributing and coast.`
              }`,
            },
          ]
        : []),
      {
        id: 'fireAge',
        label: fireType === 'coast' ? 'Age You Can Stop Contributing' : 'Estimated FIRE Age',
        value: yearsToFire === Infinity ? 'Not achievable' : `${fireAge.toFixed(0)} years old`,
        highlight: true,
        color: fireAge < 50 ? 'positive' : fireAge < 65 ? 'neutral' : 'negative',
        interpretation:
          fireType === 'coast'
            ? `This is when your net worth reaches the Coast FIRE number above. After this age, you can stop contributing entirely — your investments alone will compound to your full FIRE number by age ${COAST_RETIREMENT_AGE}.`
            : undefined,
      },
      {
        id: 'yearsToFire',
        label: fireType === 'coast' ? 'Years Until You Can Coast' : 'Years Until FIRE',
        value: yearsToFire === Infinity ? 'N/A' : `${yearsToFire.toFixed(0)} years`,
        color: yearsToFire <= 10 ? 'positive' : yearsToFire <= 20 ? 'neutral' : 'negative',
      },
      {
        id: 'savingsRate',
        label: 'Savings Rate',
        value: `${savingsRate.toFixed(1)}%`,
        color: savingsRate >= 50 ? 'positive' : savingsRate >= 20 ? 'neutral' : 'negative',
      },
      {
        id: 'annualSavings',
        label: 'Annual Savings',
        value: fmt(Math.max(0, annualSavings)),
        color: 'neutral',
      },
      {
        id: 'currentNetWorth',
        label: 'Current Net Worth',
        value: fmt(nw),
        color: 'neutral',
      },
      {
        id: 'fireType',
        label: 'FIRE Type',
        value: fireTypeLabels[fireType] || 'Standard FIRE',
        color: 'neutral',
      },
      {
        id: 'monthlySavings',
        label: 'Monthly Savings Needed',
        value: fmt(monthlySavings),
        color: 'neutral',
      },
      {
        id: 'nwAtRetirement',
        label: 'Projected NW at FIRE',
        value: fmt(nwAtRetirement),
        color: 'positive',
      },
      {
        id: 'totalContributions',
        label: 'Total Contributions',
        value: fmt(totalContributions),
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(FIREPanel, { values, results });
  },
  educational: {
    formula:
      'FIRE Number = Annual Expenses / Withdrawal Rate | Years to FIRE = solve(NW * (1+r)^t + Savings * ((1+r)^t - 1)/r = FIRE Number)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-1e293b)">Savings Rate &amp; the FIRE Timeline</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Higher savings rate = dramatically fewer years to retirement</text><g transform="translate(40,60)"><!-- Y-axis label --><text x="-10" y="130" text-anchor="middle" font-size="10" fill="var(--svg-64748b)" transform="rotate(-90,-10,130)">Years to FIRE</text><!-- Grid lines --><line x1="30" y1="20" x2="30" y2="210" stroke="var(--svg-cbd5e1)" stroke-width="1"/><line x1="30" y1="20" x2="340" y2="20" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="30" y1="68" x2="340" y2="68" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="30" y1="115" x2="340" y2="115" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="30" y1="163" x2="340" y2="163" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="30" y1="210" x2="340" y2="210" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><text x="25" y="24" text-anchor="end" font-size="9" fill="var(--svg-94a3b8)">0</text><text x="25" y="72" text-anchor="end" font-size="9" fill="var(--svg-94a3b8)">10</text><text x="25" y="119" text-anchor="end" font-size="9" fill="var(--svg-94a3b8)">20</text><text x="25" y="167" text-anchor="end" font-size="9" fill="var(--svg-94a3b8)">30</text><text x="25" y="214" text-anchor="end" font-size="9" fill="var(--svg-94a3b8)">40</text><!-- Bars: savings rate 10%-70% with corresponding years --><rect x="50" y="185" width="35" height="27" rx="3" fill="var(--svg-3b82f6)" opacity="0.5"/><text x="67" y="224" text-anchor="middle" font-size="8" fill="var(--svg-475569)">10%</text><text x="67" y="180" text-anchor="middle" font-size="8" fill="var(--svg-3b82f6)">37yr</text><rect x="95" y="170" width="35" height="42" rx="3" fill="var(--svg-3b82f6)"/><text x="112" y="224" text-anchor="middle" font-size="8" fill="var(--svg-475569)">20%</text><text x="112" y="165" text-anchor="middle" font-size="8" fill="var(--svg-3b82f6)">28yr</text><rect x="140" y="150" width="35" height="62" rx="3" fill="var(--svg-8b5cf6)"/><text x="157" y="224" text-anchor="middle" font-size="8" fill="var(--svg-475569)">30%</text><text x="157" y="145" text-anchor="middle" font-size="8" fill="var(--svg-8b5cf6)">22yr</text><rect x="185" y="128" width="35" height="84" rx="3" fill="var(--svg-8b5cf6)"/><text x="202" y="224" text-anchor="middle" font-size="8" fill="var(--svg-475569)">40%</text><text x="202" y="123" text-anchor="middle" font-size="8" fill="var(--svg-8b5cf6)">17yr</text><rect x="230" y="100" width="35" height="112" rx="3" fill="var(--svg-22c55e)"/><text x="247" y="224" text-anchor="middle" font-size="8" fill="var(--svg-475569)">50%</text><text x="247" y="95" text-anchor="middle" font-size="8" fill="var(--svg-22c55e)">12yr</text><rect x="275" y="62" width="35" height="150" rx="3" fill="var(--svg-22c55e)"/><text x="292" y="224" text-anchor="middle" font-size="8" fill="var(--svg-475569)">60%</text><text x="292" y="57" text-anchor="middle" font-size="8" fill="var(--svg-22c55e)">8yr</text><rect x="320" y="20" width="35" height="192" rx="3" fill="var(--svg-22c55e)"/><text x="337" y="224" text-anchor="middle" font-size="8" fill="var(--svg-475569)">70%</text><text x="337" y="15" text-anchor="middle" font-size="8" fill="var(--svg-22c55e)">5yr</text></g><g transform="translate(40,300)"><text x="180" y="10" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">The Simple Math of FIRE</text><text x="180" y="26" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Doubling your savings rate can cut your working years in half</text></g></svg>',
      alt: 'Bar chart showing years to financial independence at different savings rates, from 37 years at 10% savings rate down to 5 years at 70% savings rate',
      caption: 'The higher your savings rate, the fewer years you need to work before reaching financial independence — from 37 years at 10% savings to only 5 years at 70%',
    },
    formulaDescription:
      'The FIRE (Financial Independence, Retire Early) framework calculates how much you need saved (your FIRE number) and how many years it will take to reach it based on your savings rate and investment returns. The core equation links your savings rate directly to your timeline — the higher the rate, the fewer years you work. The 4% Rule provides the standard withdrawal rate: multiply your annual expenses by 25 to get your target number.',
    variables: [
      {
        symbol: 'FIRE Number & SWR',
        name: 'Target Nest Egg & Safe Withdrawal Rate',
        description: 'Your target nest egg is Annual Expenses ÷ Withdrawal Rate. The 4% rule establishes 25× expenses as the standard target. A higher SWR reduces the target but increases portfolio depletion risk, especially for early retirees with 50+ year horizons.',
      },
      {
        symbol: 'Savings Rate',
        name: 'Savings Rate',
        description: 'The percentage of your income saved each year. This is the single most powerful lever in FIRE — the higher your savings rate, the fewer years you work. At a 50% savings rate, you need about 17 years. At 70%, about 8 years.',
      },
      {
        symbol: 'NW',
        name: 'Net Worth',
        description: 'Your total invested assets (excluding home equity and personal property). This is your starting capital that will compound and grow through your FIRE journey.',
      },
    ],
    howToUse: [
      'Enter your current age, net worth, income, and annual expenses.',
      'Choose your FIRE type: Standard (4% rule), Lean (minimalist lifestyle with lower expenses), Fat (luxury with higher spending), or Coast (work part-time while investments grow).',
      'Adjust your expected investment return and target withdrawal rate. A 7% return with a 4% withdrawal rate is a common starting point.',
      'The calculator will show your FIRE number, estimated FIRE age, and the years remaining. Try adjusting the savings rate to see how it affects your timeline.',
      'Use the savings rate visualization panel to see how different savings rates map to different FIRE timelines. Small changes compound dramatically.',
    ],
    commonUses: [
      'Calculate the total retirement savings needed to achieve financial independence and the age at which you can stop working.',
      'Compare Standard, Lean, Fat, and Coast FIRE scenarios to see which financial independence path aligns with your lifestyle goals.',
      'Visualize how increasing your monthly savings rate dramatically shortens the number of years until you reach your FIRE number.',
    ],
    explanation:
      'The FIRE movement is built on a simple but powerful insight: your savings rate determines your timeline to financial independence. The 4% Rule, derived from the Trinity Study (1998), states that a portfolio of 50% stocks and 50% bonds can sustain a 4% annual withdrawal rate adjusted for inflation over 30 years with a high probability of success. The math is elegant: at a 50% savings rate, you need about 17 years to reach FIRE. At a 70% savings rate, you need only about 8 years. Coast FIRE means you have enough saved now that if you stop contributing and let it compound, it will grow to your FIRE number by traditional retirement age — you "coast" by working a flexible job that covers current expenses. Lean FIRE targets a minimalist lifestyle with expenses typically under $40,000/year. Fat FIRE targets a more luxurious lifestyle with a larger nest egg, often $2M+. The savings rate chart below shows the relationship visually: even moving from a 20% to a 30% savings rate can cut years off your working career.',
    faqs: [
      {
        question: 'Is the 4% Rule still valid?',
        answer: 'The 4% Rule was designed for a 30-year retirement based on historical US stock and bond returns. For early retirees who may have 50+ year retirements, many experts recommend a more conservative 3-3.5% withdrawal rate. The calculator lets you adjust this. Some newer research suggests the 4% rule is still viable with a globally diversified portfolio, but the margin of safety is thinner than originally thought.',
      },
      {
        question: 'What is the difference between Lean FIRE and Fat FIRE?',
        answer: 'Lean FIRE targets a minimalist lifestyle with annual expenses typically under $40,000, requiring a nest egg of about $1M at a 4% withdrawal rate. Fat FIRE targets a more comfortable lifestyle with higher spending, often $80,000+ annually, requiring $2M+ saved. Standard FIRE falls in between. The best FIRE path depends on your personal lifestyle preferences and spending habits — there is no universally "right" approach.',
      },
      {
        question: 'How does Coast FIRE work?',
        answer: 'Coast FIRE means you have enough invested now that it will grow to your FIRE number by retirement age without any additional contributions. You "coast" by working a flexible, lower-income job that covers current expenses while your investments grow untouched. Coast FIRE is more achievable than full FIRE because it requires a smaller current nest egg — you are trading time for compound growth rather than requiring maximum savings today.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
    
    workedExamples: [
      {
        scenario: 'Maya, a 28-year-old software engineer in Raleigh, NC with a net worth of $65,000 (401k + Roth IRA), earns $95,000/year and spends $48,000/year. She invests the difference at a 7% expected return and targets the standard 4% safe withdrawal rate. She selects Standard FIRE.',
        inputs: { currentAge: '28', currentNetWorth: '65000', annualIncome: '95000', annualExpenses: '48000', investmentReturn: '7', targetWithdrawalRate: '4', fireType: 'standard' },
        result: 'Target FIRE Number: $1,200,000 ($48,000 ÷ 0.04). Savings rate: 49.5% of income. Maya saves $47,000/year. Estimated FIRE age: approximately 43 years old — about 15 years from now.',
        insight: 'Maya\'s 49.5% savings rate is the engine driving her early retirement. At this rate, the math says she reaches financial independence in roughly 15 years — age 43 instead of 65+. The key insight from FIRE math is that savings rate matters far more than investment returns. If Maya reduced expenses to $40,000/year (savings rate ~58%), her FIRE number drops to $1,000,000 and she reaches it even faster. Conversely, lifestyle inflation — spending more as income grows — is the single biggest threat to her FIRE timeline.',
      },
      {
        scenario: 'Kevin, a 40-year-old teacher in Denver, CO with $200,000 in retirement accounts, earns $62,000/year and has kept his expenses low at $35,000/year. He wants to try Lean FIRE — a minimalist retirement lifestyle. He also checks Coast FIRE to see if he could switch to part-time work.',
        inputs: { currentAge: '40', currentNetWorth: '200000', annualIncome: '62000', annualExpenses: '35000', investmentReturn: '7', targetWithdrawalRate: '4', fireType: 'lean' },
        result: 'Lean FIRE Number: $875,000 ($35,000 × 25). Savings rate: 43.5%. Kevin saves $27,000/year. Estimated FIRE age: approximately 52 years old — about 12 years from now. Coast FIRE: Kevin\'s current $200,000 growing at 7% for 25 years without any additional contributions reaches approximately $1,085,000 by age 65 — exceeding his Lean FIRE target — meaning he could already be Coast FI at 40.',
        insight: 'Kevin is closer to financial independence than he probably realizes. His Lean FIRE target of $875,000 is achievable in about 12 years at his current savings rate — retiring at 52 is more than a decade before the traditional 65. More importantly, his Coast FIRE checkup reveals he already has enough invested that compound growth alone will carry him to his Lean FIRE number by traditional retirement age, even if he stops contributing entirely. This means Kevin could theoretically switch to a lower-paying but more fulfilling part-time job that just covers his current expenses, letting his existing nest egg grow untouched. For teachers and others in modest-income professions, Lean and Coast FIRE offer a more realistic path to financial freedom than the high-income tech worker version of FIRE often highlighted in media.',
      },
    ],

    proTips: [
      'Your savings rate is the single most powerful FIRE lever — far more impactful than chasing higher returns. Moving from a 20% to a 40% savings rate cuts your working years roughly in half. Use this calculator to model different savings rate scenarios before committing to a specific lifestyle.',
      'The 4% Rule was designed for 30-year retirements, not 50+. Early retirees should consider a 3.25-3.5% safe withdrawal rate for a longer retirement horizon. Even a 0.5% reduction in withdrawal rate significantly increases the probability your portfolio survives a 50+ year retirement.',
      'Be honest about your expenses — track every dollar for at least 3 months before calculating your FIRE number. Most people underestimate annual spending by 15-20% because they forget irregular costs like car repairs, medical bills, home maintenance, and replacing electronics.',
      'Coast FIRE is the most underrated path to financial freedom. Once your investments reach the point where compound growth alone will fund retirement at 65, you can step off the corporate treadmill and into lower-stress work — without needing the full FIRE nest egg.',
    ],

    quickReference: [
      { label: 'FIRE Number Formula', value: 'Annual Expenses ÷ Safe Withdrawal Rate (e.g., $50,000 ÷ 0.04 = $1,250,000)' },
      { label: '4% Rule Origin', value: 'Trinity Study (1998) — 50/50 stock-bond portfolio survived 30 years in 95% of historical scenarios' },
      { label: 'Standard FIRE Target', value: '25× annual expenses (4% withdrawal rate)' },
      { label: 'Lean FIRE Target', value: '25× minimal expenses (typically $25K-$40K/year → $625K-$1M nest egg)' },
      { label: 'Fat FIRE Target', value: '37.5× annual expenses (1.5× spending at 4% SWR, typically $2M+ nest egg)' },
      { label: 'Coast FIRE Check', value: 'Current NW × (1+r)^(65−age) ≥ FIRE Number → can stop contributing' },
      { label: 'Savings Rate vs Years to FI (50% rate)', value: '~17 years to FI at 7% returns (starting from $0)' },
      { label: 'Savings Rate vs Years to FI (70% rate)', value: '~8.5 years to FI at 7% returns (starting from $0)' },
    ],

    limitations: [
      'The FIRE timeline assumes a constant annual return (7% default). Real markets are volatile — a bear market in the first few years of retirement (sequence-of-returns risk) can dramatically increase failure probability even when long-term averages look fine. Monte Carlo simulation would provide more realistic probability ranges.',
      'It assumes expenses remain constant in real (inflation-adjusted) terms throughout retirement, which is rarely true. Healthcare costs rise faster than general inflation, spending typically declines in late retirement, and lump-sum expenses (new roof, car replacement, long-term care) are not modeled.',
      'The calculator does not account for taxes on investment withdrawals in taxable brokerage accounts (Roth IRA withdrawals are tax-free; Traditional IRA/401k withdrawals are taxed as ordinary income). FIRE planning must incorporate tax strategy across account types.',
      'Social Security, pensions, part-time work income, and inheritances are not factored into the FIRE number. Including even modest guaranteed income like Social Security (claimed at 62 or 70) can substantially reduce the required nest egg and shorten the timeline.',
    ],
citations: [
      { source: 'US Securities and Exchange Commission', url: 'https://www.investor.gov' },
      { source: 'Investopedia', url: 'https://www.investopedia.com/terms/f/financial-independence-retire-early-fire.asp' },
    ],
  },
};

export default fireCalculatorConfig;
