import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import InvestmentPanel from './InvestmentPanel';

const investmentSvg = '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="4"/><text x="160" y="14" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Compound Growth Over Time</text><text x="160" y="28" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">$10K + $500/mo @ 8% for 20 years</text><g transform="translate(15,35)"><line x1="25" y1="5" x2="25" y2="108" stroke="var(--svg-cbd5e1)" stroke-width="1"/><line x1="25" y1="108" x2="290" y2="108" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="20" y="9" text-anchor="end" font-size="7" fill="var(--svg-94a3b8)">$300K</text><text x="20" y="33" text-anchor="end" font-size="7" fill="var(--svg-94a3b8)">$200K</text><text x="20" y="57" text-anchor="end" font-size="7" fill="var(--svg-94a3b8)">$100K</text><text x="20" y="83" text-anchor="end" font-size="7" fill="var(--svg-94a3b8)">$50K</text><text x="20" y="112" text-anchor="end" font-size="7" fill="var(--svg-94a3b8)">$0</text><line x1="25" y1="5" x2="290" y2="5" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="25" y1="30" x2="290" y2="30" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="25" y1="55" x2="290" y2="55" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><line x1="25" y1="80" x2="290" y2="80" stroke="var(--svg-e2e8f0)" stroke-width="0.5"/><path d="M 40,110 L 80,107 L 120,100 L 160,85 Q 200,65 240,38 Q 265,22 290,10" fill="none" stroke="var(--svg-22c55e)" stroke-width="2.5" stroke-linecap="round"/><line x1="40" y1="110" x2="290" y2="52" stroke="var(--svg-3b82f6)" stroke-width="2" stroke-dasharray="5,3" stroke-linecap="round"/><path d="M 40,110 L 80,107 L 120,100 L 160,85 Q 200,65 240,38 Q 265,22 290,10 L 290,52 L 240,60 Q 200,72 160,88 L 120,100 L 80,107 L 40,110 Z" fill="var(--svg-22c55e)" opacity="0.1"/><text x="40" y="120" text-anchor="middle" font-size="6" fill="var(--svg-94a3b8)">0</text><text x="120" y="120" text-anchor="middle" font-size="6" fill="var(--svg-94a3b8)">5yr</text><text x="200" y="120" text-anchor="middle" font-size="6" fill="var(--svg-94a3b8)">10yr</text><text x="280" y="120" text-anchor="middle" font-size="6" fill="var(--svg-94a3b8)">20yr</text></g><rect x="195" y="146" width="110" height="18" rx="3" fill="var(--svg-22c55e)" opacity="0.2"/><rect x="195" y="146" width="10" height="10" rx="2" fill="var(--svg-22c55e)"/><text x="210" y="155" font-size="7" fill="var(--svg-475569)">Market Returns</text><rect x="195" y="160" width="110" height="18" rx="3" fill="var(--svg-3b82f6)" opacity="0.2"/><rect x="195" y="160" width="10" height="10" rx="2" fill="var(--svg-3b82f6)"/><text x="210" y="169" font-size="7" fill="var(--svg-475569)">Your Contributions</text><rect x="15" y="173" width="170" height="22" rx="6" fill="var(--svg-f1f5f9)"/><text x="100" y="188" text-anchor="middle" font-size="6" font-weight="bold" fill="var(--svg-22c55e)">FV = P(1+r)^n + C[(1+r)^n - 1]/r</text><text x="260" y="188" font-size="6" fill="var(--svg-64748b)">Compounding = exponential</text></svg>';

const investmentConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'startingAmount',
      slider: { min: 0, max: 100000, step: 1000 },
      label: 'Starting Amount',
      type: 'number',
      defaultValue: '10000',
      placeholder: '10,000',
      prefix: '$',
      min: 0,
      step: 500,
      inputMode: 'numeric',
      helpText: 'Initial lump sum investment (can be $0)',
    },
    {
      id: 'contribution',
      slider: { min: 0, max: 5000, step: 50 },
      label: 'Additional Contribution',
      type: 'number',
      defaultValue: '500',
      placeholder: '500',
      prefix: '$',
      min: 0,
      step: 50,
      inputMode: 'numeric',
      required: true,
      helpText: 'Amount added on the frequency below',
    },
    {
      id: 'contributionFrequency',
      label: 'Contribution Frequency',
      type: 'select',
      required: true,
      helpText: 'How often you add money to your investment. Weekly investing captures slightly more compounding, but the difference is small — consistency matters most.',
      options: [
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Annually', value: 'annually' },
      ],
    },
    {
      id: 'years',
      slider: { min: 1, max: 40, step: 1 },
      label: 'Years to Grow',
      type: 'number',
      defaultValue: '20',
      placeholder: '20',
      unit: 'years',
      min: 1,
      max: 100,
      step: 1,
      inputMode: 'numeric',
      required: true,
      helpText: 'How many years you plan to stay invested. Longer time horizons amplify compounding dramatically.',
    },
    {
      id: 'returnRate',
      slider: { min: 0, max: 15, step: 0.1 },
      label: 'Expected Annual Return',
      type: 'number',
      defaultValue: '8',
      placeholder: '8',
      unit: '%',
      min: 0,
      max: 50,
      step: 0.1,
      inputMode: 'decimal',
      required: true,
      helpText: 'S&P 500 has historically returned ~10% nominal, ~7% inflation-adjusted',
    },
    {
      id: 'returnVariance',
      label: 'Return Variance (+/-)',
      type: 'number',
      placeholder: '2',
      unit: '%',
      min: 0,
      max: 20,
      step: 0.5,
      inputMode: 'decimal',
      helpText: 'Creates optimistic/pessimistic scenarios. Default +/-2% is realistic for a diversified portfolio.',
    },
  ],
  calculate: (values) => {
    const P = new Decimal(values.startingAmount || 0);
    const contribution = new Decimal(values.contribution || 0);
    const freq = values.contributionFrequency || 'monthly';
    const years = parseFloat(values.years);
    const returnRate = parseFloat(values.returnRate) / 100;
    const variance = parseFloat(values.returnVariance) / 100 || 0.02;

    if (isNaN(years) || isNaN(returnRate) || years <= 0) return [];

    const monthlyContrib = freq === 'weekly'
      ? contribution.mul(52).div(12)
      : freq === 'annually'
      ? contribution.div(12)
      : contribution;

    const months = years * 12;

    const calcFV = (rate: number): Decimal => {
      const mr = new Decimal(rate).div(12);
      const futureP = P.mul(mr.plus(1).pow(months));
      const futurePMT = rate === 0
        ? monthlyContrib.mul(months)
        : monthlyContrib.mul(mr.plus(1).pow(months).minus(1)).div(mr);
      return futureP.plus(futurePMT);
    };

    const expected = calcFV(returnRate);
    const optimistic = calcFV(returnRate + variance);
    const pessimistic = calcFV(Math.max(0, returnRate - variance));

    const totalContributed = P.plus(
      freq === 'weekly'
        ? contribution.mul(52).mul(years)
        : freq === 'annually'
        ? contribution.mul(years)
        : contribution.mul(12).mul(years)
    );

    const totalReturns = expected.minus(totalContributed);

    const fmtDollar = (d: Decimal): string => {
      const n = d.toNumber();
      if (n >= 1_000_000)
        return `$${(n / 1_000_000).toFixed(2)}M`;
      return `$${d.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    };

    const freqLabel = freq === 'weekly' ? 'week' : freq === 'monthly' ? 'month' : 'year';

    return [
      {
        id: 'expected',
        label: `Future Investment Value (${(returnRate * 100).toFixed(1)}% return)`,
        value: fmtDollar(expected),
        highlight: true,
        color: 'positive' as const,
        interpretation: totalContributed.gt(0)
          ? `Of the ${fmtDollar(expected)} projected, ${fmtDollar(totalReturns)} (${totalReturns.div(totalContributed).mul(100).toFixed(0)}%) is market growth on top of the ${fmtDollar(totalContributed)} you put in. Returns aren't guaranteed — this scenario ranges from ${fmtDollar(pessimistic)} to ${fmtDollar(optimistic)}, so treat it as a midpoint, not a promise.`
          : undefined,
      },
      {
        id: 'totalContributed',
        label: 'Total Principal Invested (You)',
        value: fmtDollar(totalContributed),
        color: 'neutral' as const,
      },
      {
        id: 'totalReturns',
        label: 'Total Investment Returns (Market)',
        value: fmtDollar(totalReturns),
        color: 'positive' as const,
      },
      {
        id: 'growthMultiple',
        label: 'Your Money Multiplied',
        value: `${expected.div(totalContributed.isZero() ? 1 : totalContributed).toFixed(1)}x`,
        color: 'positive' as const,
      },
      {
        id: 'optimistic',
        label: `Optimistic Scenario (+${(variance * 100).toFixed(0)}% = ${((returnRate + variance) * 100).toFixed(1)}%)`,
        value: fmtDollar(optimistic),
        color: 'positive' as const,
      },
      {
        id: 'pessimistic',
        label: `Pessimistic Scenario (-${(variance * 100).toFixed(0)}% = ${(Math.max(0, returnRate - variance) * 100).toFixed(1)}%)`,
        value: fmtDollar(pessimistic),
        color: 'negative' as const,
      },
      {
        id: 'contributionSummary',
        label: `Contribution: $${contribution.toFixed(0)}/${freqLabel} for ${years} year${years !== 1 ? 's' : ''}`,
        value: `Monthly equivalent: $${monthlyContrib.toFixed(0)}/mo`,
        color: 'neutral' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    const P = parseFloat(values.startingAmount) || 0;
    const contribution = parseFloat(values.contribution) || 0;
    const freq = values.contributionFrequency || 'monthly';
    const years = parseFloat(values.years);
    const returnRate = parseFloat(values.returnRate) / 100;
    const variance = parseFloat(values.returnVariance) / 100 || 0.02;

    if (!results.length || isNaN(years) || isNaN(returnRate) || years <= 0) return null;

    return createElement(InvestmentPanel, {
      startingAmount: P,
      contribution,
      contributionFrequency: freq as 'weekly' | 'monthly' | 'annually',
      years,
      returnRate,
      variance,
    });
  },
  educational: {
    formula: 'FV = P*(1+r)^n + C*[(1+r)^n - 1]/r',
    diagram: {
      svg: investmentSvg,
      alt: 'Investment growth chart showing a dashed linear line for contributions and an exponential compounding curve above it, with the gap representing market returns over time',
      caption: 'Your contributions grow linearly while compounding investment returns grow exponentially — over decades, market returns typically contribute 70%+ of your final portfolio',
    },
    formulaDescription:
      'Future Value combines the growth of the initial lump sum with the future value of recurring contributions, all compounded monthly. The first term grows the starting balance, while the second term captures the effect of regular investing over time. All calculations use decimal.js for precise financial results.',
    variables: [
      { symbol: 'FV', name: 'Future Value', description: 'The total portfolio value at the end of the investment period, including all contributions and compounded returns.' },
      { symbol: 'P', name: 'Starting Amount', description: 'The initial lump sum invested. Can be set to $0 if you are starting with no existing investments.' },
      { symbol: 'C', name: 'Monthly Contribution', description: 'The regular contribution amount converted to a monthly equivalent regardless of whether you contribute weekly, monthly, or annually.' },
      { symbol: 'r', name: 'Monthly Return', description: 'The expected annual return divided by 12. Historical S&P 500 average return is approximately 10% nominal (about 0.83% monthly) or 7% inflation-adjusted.' },
      { symbol: 'n', name: 'Months', description: 'The total investment period in months, calculated as years multiplied by 12.' },
    ],
    howToUse: [
      'Enter your starting investment amount (can be $0 if you are starting from scratch with no existing portfolio).',
      'Enter your regular contribution amount and select whether you invest weekly, monthly, or annually.',
      'Enter the number of years you plan to invest — longer time horizons dramatically amplify the power of compounding.',
      'Set your expected annual return and return variance to model best-case, worst-case, and expected scenarios for realistic planning.',
    ],
    commonUses: [
      'Project the future value of an investment portfolio with recurring contributions to see how consistent investing grows wealth over time.',
      'Model optimistic, expected, and pessimistic scenarios using the variance feature to understand the full range of potential retirement outcomes.',
      'Visualize the tipping point where investment returns exceed your own contributions as the dominant source of portfolio growth.',
    ],
    explanation:
      'This calculator models a realistic investment portfolio with recurring contributions over time. The variance feature is key: no investment returns exactly the same amount every year. Seeing the full range of outcomes from pessimistic to optimistic helps set realistic expectations and prevents overconfidence in any single projection. The bar chart below shows how much of your final value comes from your actual contributions versus market returns. For long time horizons of 20-30 years, the market typically does most of the work — investment returns often account for 70% or more of the final balance, with your own contributions making up the rest. This is the core insight that motivates consistent, long-term investing. A common mistake is using overly optimistic return assumptions (12%+) that look great on paper but rarely materialize. Professional financial planners typically use 5-7% real returns for long-term planning. The contribution frequency setting matters less than you might think — the difference between weekly and monthly contributions over 30 years is typically less than 1-2% of the final balance. What matters far more is consistency: automating contributions and never stopping, especially during market downturns when you are buying assets at a discount. The rule of 72 provides a quick mental check: divide 72 by your expected return to estimate how many years it takes your money to double. At 7%, money doubles roughly every 10.3 years, so $10,000 becomes about $80,000 over 30 years even without additional contributions. Finally, remember that this calculator shows nominal returns before inflation. To estimate real purchasing power, subtract your expected inflation rate from your return assumption — historically, US equities have returned about 7% annually after inflation over the very long term. When planning for retirement, a common target is the 4% withdrawal rule: multiply your expected annual expenses by 25 to estimate the portfolio size needed. For example, if you need $40,000/year from investments, you would need approximately $1,000,000. Use the optimistic, expected, and pessimistic scenarios together to create a range of possible retirement dates and portfolio values. Dollar-cost averaging by investing the same amount regularly removes the pressure of trying to time the market, which even professional fund managers consistently fail to do over long periods.',
    workedExamples: [
      {
        scenario: 'Emma starts investing at age 30 with $10,000 and contributes $500/month, expecting 8% annual returns over 30 years until retirement at 60.',
        inputs: { startingAmount: '10000', contribution: '500', contributionFrequency: 'monthly', years: '30', returnRate: '8', returnVariance: '2' },
        result: 'Future value: approximately $813,000 after 30 years with $190,000 in contributions and $623,000 in market returns.',
        insight: 'After 30 years, Emma\'s portfolio grows to approximately $813,000 — of which $190,000 is her own contributions and $623,000 is market returns. The market did 77% of the work. If she started just 10 years earlier at age 20, the same contributions would grow to over $1.9 million, demonstrating the massive impact of starting early.',
      },
      {
        scenario: 'James receives a $50,000 inheritance and invests it as a lump sum with no additional contributions, expecting 7% annual returns over 20 years.',
        inputs: { startingAmount: '50000', contribution: '0', contributionFrequency: 'monthly', years: '20', returnRate: '7', returnVariance: '2' },
        result: 'Future value: approximately $193,000 after 20 years, nearly quadrupling the initial $50,000 investment through compound growth alone.',
        insight: 'The $50,000 grows to about $193,000 purely through compounding — nearly quadrupling without a single additional contribution. This demonstrates the power of time in the market: the "Rule of 72" says at 7%, money doubles roughly every 10.3 years, so 20 years yields roughly 4x growth.',
      },
      {
        scenario: 'Maria, a 25-year-old teacher, starts contributing $300/month to her Roth IRA with an initial $2,000 investment, expecting 9% annual returns over 35 years until age 60.',
        inputs: { startingAmount: '2000', contribution: '300', contributionFrequency: 'monthly', years: '35', returnRate: '9', returnVariance: '3' },
        result: 'Future value: approximately $890,000 after 35 years with $128,000 in contributions and $762,000 in market returns.',
        insight: 'After 35 years, Maria\'s portfolio grows to approximately $890,000 in the expected scenario. Her total contributions are only $128,000 ($2,000 + $300 × 12 × 35), meaning market returns contributed over $760,000 — about 85% of the final value. In the pessimistic scenario (6% returns), she would still have about $425,000, demonstrating that even below-average returns produce substantial wealth with consistent, long-term investing. The key lesson: start early, stay consistent, and let compounding do the heavy lifting.',
      },
    ],
    proTips: [
      'Use the pessimistic scenario as your baseline for retirement planning — if you can live comfortably on the pessimistic outcome, the expected and optimistic scenarios become a bonus rather than a necessity.',
      'Increase your contribution by 1% each year (e.g., when you get a raise). A 1% annual increase over 30 years can add 20-30% more to your final portfolio with almost no lifestyle impact.',
      'The contribution frequency matters less than consistency. Whether you invest weekly or monthly, automating the transfer is the single most important habit — set it and forget it.',
      'Keep investment fees below 0.50% annually. A 1% fee difference on a $500,000 portfolio over 30 years costs you over $150,000 in lost returns. Use low-cost index funds or ETFs.',
    ],
    limitations: [
      'This calculator uses a constant annual return rate, which does not reflect real market volatility. Actual returns vary significantly year to year — the variance feature provides a range, but real returns can fall outside this range in extreme market conditions.',
      'The calculator compounds monthly rather than daily or continuously.',
      'Taxes on dividends, capital gains distributions, and withdrawals are not modeled.',
      'Inflation is not directly factored in (use an inflation-adjusted return rate like 7% instead of 10% to approximate real purchasing power).',
      'Employer matches, account fees, and contribution limits (401k, IRA) are not included.',
    ],
    quickReference: [
      { label: 'Rule of 72', value: '72 / return% = years to double' },
      { label: 'S&P 500 Historical', value: '~10% nominal, ~7% real' },
      { label: 'Conservative Portfolio', value: '4-5% expected return' },
      { label: 'Aggressive Portfolio', value: '8-10% expected return' },
      { label: 'Monthly Compounding', value: 'r/12 applied each month' },
      { label: '4% Withdrawal Rule', value: 'Retire when FV x 0.04 >= expenses' },
    ],
    faqs: [
      {
        question: 'What return rate should I use?',
        answer: 'The S&P 500 has returned approximately 10% nominal annually over the long term (about 7% after inflation). A diversified portfolio with a mix of stocks and bonds might use 6-8% for planning. A conservative, bond-heavy portfolio might use 3-5%. For conservative planning that builds in a margin of safety, use a lower number. The variance feature can help you test different scenarios.',
      },
      {
        question: 'What is the return variance for?',
        answer: 'Return variance creates three scenarios for comparison: expected (your entered rate), optimistic (your rate plus the variance), and pessimistic (your rate minus the variance). This is important because actual investment returns fluctuate significantly from year to year. A plus or minus 2% variance is reasonable for a diversified portfolio and helps you understand the range of possible outcomes.',
      },
      {
        question: 'Weekly vs. monthly contributions -- which is better?',
        answer: 'Weekly contributions invest your money slightly earlier in the year compared to monthly contributions, capturing a few extra days or weeks of compounding. The difference is small but real over long time horizons of 20-30 years. However, the most important factor is consistency — automate whatever contribution frequency fits your income and budget, whether that is weekly, bi-weekly, or monthly payments.',
      },
      {
        question: 'How does inflation affect my investment projections?',
        answer: 'This calculator shows nominal (pre-inflation) returns. To estimate real purchasing power, subtract the expected inflation rate from your return assumption. For example, if you expect 8% nominal returns and 3% inflation, use 5% as your return rate for a real (inflation-adjusted) projection. Historically, inflation has averaged about 3% annually in the US.',
      },
      {
        question: 'Should I invest a lump sum all at once or dollar-cost average?',
        answer: 'Research from Vanguard shows that lump sum investing beats dollar-cost averaging (DCA) about two-thirds of the time because markets tend to go up over time — meaning money invested earlier has more time to compound. However, DCA reduces the psychological risk of investing right before a market crash. If you have a large sum, consider investing half as a lump sum and DCA the rest over 6-12 months as a compromise between math and emotion.',
      },
      {
        question: 'How much should I save for retirement each month?',
        answer: 'A common guideline is to save 15-20% of your pre-tax income for retirement, including any employer match. For example, if you earn $60,000/year, aim to save $750-$1,000/month to all retirement accounts combined. Starting early is more important than hitting the exact percentage — someone who starts saving $500/month at age 25 will have roughly the same portfolio at age 65 as someone who starts at age 35 saving $1,200/month, thanks to the extra decade of compounding. Use this calculator to test your own numbers and see the dramatic impact of starting early.',
      },
      {
        question: 'How do I account for taxes and fees in my projections?',
        answer: 'This calculator shows pre-tax, pre-fee returns. To account for fees, reduce your expected return by the expense ratio of your investments. For example, if you expect 8% returns but your funds charge 0.30% in fees, use 7.7% as your return rate. For taxes, the impact depends on the account type: Roth IRAs and 401(k)s grow tax-free (use the full return rate), while taxable brokerage accounts lose roughly 1-2% of returns annually to taxes on dividends and capital gains distributions. Use the lower end of your expected return range for taxable accounts.',
      },
    ],
    citations: [
      { source: 'US Securities and Exchange Commission', url: 'https://www.investor.gov' },
      { source: 'Investopedia — Compound Interest', url: 'https://www.investopedia.com/terms/c/compoundinterest.asp' },
      { source: 'Vanguard — Lump Sum vs. DCA Research', url: 'https://investor.vanguard.com/investor-resources-education' },
    ],
  },
};

export default investmentConfig;
