import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import FIREPanel from './FIREPanel';

import { parseFireInputs, computeFire, COAST_RETIREMENT_AGE } from './fireMath';

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
      label: 'Annual Take-Home Income (After Tax)',
      type: 'number',
      placeholder: '80000',
      prefix: '$',
      inputMode: 'decimal',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Income you actually have available each year after taxes and payroll deductions. Annual savings are this minus your expenses.',
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
      helpText: 'Leave blank to use take-home income minus expenses. If you enter a rate, annual savings = income x rate.',
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
      helpText: 'Annual return after inflation (a real return, since expenses are held constant in inflation-adjusted dollars). The long-run US stock market real return is often quoted at around 7%.',
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
        { label: 'Lean FIRE (Minimalist, enter your lean expenses)', value: 'lean' },
        { label: 'Fat FIRE (Luxury, adds a 1.5x spending cushion)', value: 'fat' },
        { label: 'Coast FIRE (Barista FI)', value: 'coast' },
      ],
      helpText: 'Different FIRE styles target different retirement lifestyles. Lean and Standard use your expenses as entered; Fat adds a 1.5x cushion; Coast solves for when you can stop contributing and let investing carry you to the target by age 65.',
    },
  ],
  calculate: (values) => {
    const inputs = parseFireInputs(values);
    if (!inputs) return [];
    const fire = computeFire(inputs);

    const nw = inputs.netWorth;
    const investmentReturn = inputs.returnPct;
    const withdrawalRate = inputs.withdrawalPct;
    const fireType = inputs.fireType;
    const { fireNumber, coastFireNumber, savingsRate, annualSavings, monthlySavings, nwAtRetirement, totalContributions } = fire;
    const yearsToFire = fire.yearsToFire;
    const fireAge = fire.fireAge;

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
        interpretation: `This is built on a ${withdrawalRate}% withdrawal rate${fireType === 'fat' ? ' with a 1.5x spending cushion' : ''} — a portfolio this size is meant to fund your annual spending, adjusted for inflation (the 4% rule held up over 30-year periods historically). It assumes a diversified portfolio and doesn't account for sequence-of-returns risk (a bad market right after you retire); many ${fireTypeLabels[fireType] || 'FIRE'} planners treat 4% as a starting point and stay flexible on spending in down years.`,
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
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-1e293b)">Savings Rate &amp; the FIRE Timeline</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Higher savings rate = dramatically fewer years to retirement</text><g transform="translate(40,60)"><!-- Y-axis label --><text x="-10" y="130" text-anchor="middle" font-size="10" fill="var(--svg-64748b)" transform="rotate(-90,-10,130)">Years to FIRE</text><!-- Grid lines --><line x1="30" y1="20" x2="30" y2="212" stroke="var(--svg-cbd5e1)" stroke-width="1"/><line x1="30" y1="212" x2="340" y2="212" stroke="var(--svg-cbd5e1)" stroke-width="1"/><line x1="30" y1="170" x2="340" y2="170" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="30" y1="128" x2="340" y2="128" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="30" y1="85" x2="340" y2="85" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="30" y1="43" x2="340" y2="43" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><text x="25" y="216" text-anchor="end" font-size="9" fill="var(--svg-475569)">0</text><text x="25" y="174" text-anchor="end" font-size="9" fill="var(--svg-475569)">10</text><text x="25" y="132" text-anchor="end" font-size="9" fill="var(--svg-475569)">20</text><text x="25" y="89" text-anchor="end" font-size="9" fill="var(--svg-475569)">30</text><text x="25" y="47" text-anchor="end" font-size="9" fill="var(--svg-475569)">40</text><!-- Bars: years to FIRE from $0 at 7% real return, target 25x spending --><rect x="50" y="35" width="35" height="177" rx="3" fill="var(--svg-1d4ed8)"/><text x="67" y="224" text-anchor="middle" font-size="8" fill="var(--svg-475569)">10%</text><text x="67" y="30" text-anchor="middle" font-size="8" fill="var(--svg-1d4ed8)">42yr</text><rect x="95" y="82" width="35" height="130" rx="3" fill="var(--svg-1d4ed8)"/><text x="112" y="224" text-anchor="middle" font-size="8" fill="var(--svg-475569)">20%</text><text x="112" y="77" text-anchor="middle" font-size="8" fill="var(--svg-1d4ed8)">31yr</text><rect x="140" y="111" width="35" height="101" rx="3" fill="var(--svg-6d28d9)"/><text x="157" y="224" text-anchor="middle" font-size="8" fill="var(--svg-475569)">30%</text><text x="157" y="106" text-anchor="middle" font-size="8" fill="var(--svg-6d28d9)">24yr</text><rect x="185" y="132" width="35" height="80" rx="3" fill="var(--svg-6d28d9)"/><text x="202" y="224" text-anchor="middle" font-size="8" fill="var(--svg-475569)">40%</text><text x="202" y="127" text-anchor="middle" font-size="8" fill="var(--svg-6d28d9)">19yr</text><rect x="230" y="149" width="35" height="63" rx="3" fill="var(--svg-15803d)"/><text x="247" y="224" text-anchor="middle" font-size="8" fill="var(--svg-475569)">50%</text><text x="247" y="144" text-anchor="middle" font-size="8" fill="var(--svg-15803d)">15yr</text><rect x="275" y="164" width="35" height="48" rx="3" fill="var(--svg-15803d)"/><text x="292" y="224" text-anchor="middle" font-size="8" fill="var(--svg-475569)">60%</text><text x="292" y="159" text-anchor="middle" font-size="8" fill="var(--svg-15803d)">11yr</text><rect x="320" y="177" width="35" height="35" rx="3" fill="var(--svg-15803d)"/><text x="337" y="224" text-anchor="middle" font-size="8" fill="var(--svg-475569)">70%</text><text x="337" y="172" text-anchor="middle" font-size="8" fill="var(--svg-15803d)">8yr</text></g><g transform="translate(40,300)"><text x="180" y="10" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">The Simple Math of FIRE</text><text x="180" y="26" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Going from a 25% to a 50% savings rate cuts the years to FIRE nearly in half (27 to 15)</text></g></svg>',
      alt: 'Bar chart showing years to financial independence at different savings rates, from about 42 years at a 10% savings rate down to about 8 years at 70% (7% real return, starting from zero)',
      caption: 'The higher your savings rate, the fewer years you need to work before reaching financial independence — from about 42 years at 10% savings to about 8 years at 70% (7% real return, starting from $0)',
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
        description: 'The percentage of your income saved each year. This is the single most powerful lever in FIRE — the higher your savings rate, the fewer years you work. At a 50% savings rate, you need about 15 years. At 70%, about 8 years (7% real return, starting from zero).',
      },
      {
        symbol: 'NW',
        name: 'Net Worth',
        description: 'Your total invested assets (excluding home equity and personal property). This is your starting capital that will compound and grow through your FIRE journey.',
      },
    ],
    howToUse: [
      'Enter your current age, net worth, take-home (after-tax) income, and annual expenses.',
      'Choose your FIRE type: Standard (your expenses at your withdrawal rate), Lean (enter minimalist expenses), Fat (adds a 1.5x spending cushion), or Coast (find when you can stop contributing and let investments grow to the target by 65).',
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
      'The FIRE movement is built on a simple but powerful insight: your savings rate determines your timeline to financial independence. The 4% Rule, derived from the Trinity Study (1998), states that a portfolio of 50% stocks and 50% bonds can sustain a 4% annual withdrawal rate adjusted for inflation over 30 years with a high probability of success. The math is elegant: at a 50% savings rate, you need about 15 years to reach FIRE (about 17 if you assume a 5% real return). At a 70% savings rate, you need only about 8 years. Coast FIRE means you have enough saved now that if you stop contributing and let it compound, it will grow to your FIRE number by traditional retirement age — you "coast" by working a flexible job that covers current expenses. Lean FIRE targets a minimalist lifestyle with expenses typically under $40,000/year. Fat FIRE targets a more luxurious lifestyle with a larger nest egg, often $2M+. The savings rate chart below shows the relationship visually: even moving from a 20% to a 30% savings rate can cut years off your working career.',
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
        scenario: 'Maya, a 28-year-old software engineer in Raleigh, NC with a net worth of $65,000 (401k + Roth IRA), takes home $95,000/year after taxes and spends $48,000/year. She invests the difference at a 7% expected return and targets the standard 4% safe withdrawal rate. She selects Standard FIRE.',
        inputs: { currentAge: '28', currentNetWorth: '65000', annualIncome: '95000', annualExpenses: '48000', investmentReturn: '7', targetWithdrawalRate: '4', fireType: 'standard' },
        result: 'Target FIRE Number: $1,200,000 ($48,000 ÷ 0.04). Savings rate: 49.5% of take-home income. Maya saves $47,000/year. Estimated FIRE age: 42 years old — 14 years from now (her portfolio reaches about $1.23M).',
        insight: 'Maya\'s 49.5% savings rate is the engine driving her early retirement. At this rate, the math says she reaches financial independence in roughly 14 years — age 42 instead of 65+. The key insight from FIRE math is that savings rate matters far more than investment returns. If Maya reduced expenses to $40,000/year (savings rate ~58%), her FIRE number drops to $1,000,000 and she reaches it even faster. Conversely, lifestyle inflation — spending more as income grows — is the single biggest threat to her FIRE timeline.',
      },
      {
        scenario: 'Kevin, a 40-year-old teacher in Denver, CO with $200,000 in retirement accounts, takes home $62,000/year after taxes and has kept his expenses low at $35,000/year. He wants to try Lean FIRE — a minimalist retirement lifestyle. He also checks Coast FIRE to see if he could switch to part-time work.',
        inputs: { currentAge: '40', currentNetWorth: '200000', annualIncome: '62000', annualExpenses: '35000', investmentReturn: '7', targetWithdrawalRate: '4', fireType: 'lean' },
        result: 'Lean FIRE Number: $875,000 ($35,000 × 25). Savings rate: 43.5%. Kevin saves $27,000/year. Estimated FIRE age: 52 years old — 12 years from now. Coast FIRE: Kevin\'s current $200,000 growing at 7% for 25 years without any additional contributions reaches approximately $1,085,000 by age 65 — exceeding his Lean FIRE target — meaning he could already be Coast FI at 40.',
        insight: 'Kevin is closer to financial independence than he probably realizes. His Lean FIRE target of $875,000 is achievable in about 12 years at his current savings rate — retiring at 52 is more than a decade before the traditional 65. More importantly, his Coast FIRE checkup reveals he already has enough invested that compound growth alone will carry him to his Lean FIRE number by traditional retirement age, even if he stops contributing entirely. This means Kevin could theoretically switch to a lower-paying but more fulfilling part-time job that just covers his current expenses, letting his existing nest egg grow untouched. For teachers and others in modest-income professions, Lean and Coast FIRE offer a more realistic path to financial freedom than the high-income tech worker version of FIRE often highlighted in media.',
      },
    ],

    proTips: [
      'Your savings rate is the single most powerful FIRE lever — far more impactful than chasing higher returns. Moving from a 20% to a 40% savings rate cuts your working years by more than a third (about 31 to 19 years from a standing start). Use this calculator to model different savings rate scenarios before committing to a specific lifestyle.',
      'The 4% Rule was designed for 30-year retirements, not 50+. Early retirees should consider a 3.25-3.5% safe withdrawal rate for a longer retirement horizon. Even a 0.5% reduction in withdrawal rate significantly increases the probability your portfolio survives a 50+ year retirement.',
      'Be honest about your expenses — track every dollar for at least 3 months before calculating your FIRE number. Most people underestimate annual spending by 15-20% because they forget irregular costs like car repairs, medical bills, home maintenance, and replacing electronics.',
      'Coast FIRE is the most underrated path to financial freedom. Once your investments reach the point where compound growth alone will fund retirement at 65, you can step off the corporate treadmill and into lower-stress work — without needing the full FIRE nest egg.',
    ],

    quickReference: [
      { label: 'FIRE Number Formula', value: 'Annual Expenses ÷ Safe Withdrawal Rate (e.g., $50,000 ÷ 0.04 = $1,250,000)' },
      { label: '4% Rule Origin', value: 'Trinity Study (1998) — a 4% inflation-adjusted withdrawal from a 50/50 to 75/25 stock-bond portfolio survived 30-year periods in the large majority of historical scenarios' },
      { label: 'Standard FIRE Target', value: '25× annual expenses (4% withdrawal rate)' },
      { label: 'Lean FIRE Target', value: '25× minimal expenses (typically $25K-$40K/year → $625K-$1M nest egg)' },
      { label: 'Fat FIRE Target', value: '37.5× annual expenses at a 4% SWR (this calculator adds a 1.5× cushion; typically $2M+ nest egg)' },
      { label: 'Coast FIRE Check', value: 'Current NW × (1+r)^(65−age) ≥ FIRE Number → can stop contributing' },
      { label: 'Savings Rate vs Years to FI (50% rate)', value: '~15 years to FI at 7% real returns (starting from $0)' },
      { label: 'Savings Rate vs Years to FI (70% rate)', value: '~8 years to FI at 7% real returns (starting from $0)' },
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
