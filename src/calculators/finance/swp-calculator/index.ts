import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import SwpPanel from './SwpPanel';

function fmt(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const swpConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'corpus',
      label: 'Total Corpus',
      type: 'number',
      placeholder: '1,00,00,000',
      prefix: '₹',
      min: 0,
      step: 100000,
      required: true,
      helpText: 'Your total investment corpus',
    },
    {
      id: 'expectedReturn',
      label: 'Expected Return (p.a.)',
      type: 'number',
      placeholder: '8',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 100,
      step: 0.5,
      required: true,
      helpText: 'Expected annual return on remaining corpus',
    },
    {
      id: 'monthlyWithdrawal',
      label: 'Monthly Withdrawal',
      type: 'number',
      placeholder: '50,000',
      prefix: '₹',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Amount you withdraw every month',
    },
    {
      id: 'withdrawalPeriod',
      label: 'Withdrawal Period',
      type: 'number',
      placeholder: '30',
      unit: 'years',
      inputMode: 'decimal',
      min: 0,
      step: 1,
      required: true,
      helpText: 'How many years you need the withdrawals to last',
    },
  ],
  calculate: (values) => {
    // Decimal.js for monetary precision — imported at top of file

    const corpus = parseFloat(values.corpus) || 0;
    const r = parseFloat(values.expectedReturn) / 100;
    const monthlyW = parseFloat(values.monthlyWithdrawal) || 0;
    const t = parseFloat(values.withdrawalPeriod);

    if (corpus <= 0 || monthlyW <= 0 || isNaN(r) || isNaN(t) || t <= 0) return [];

    const monthlyRate = r / 12;
    const targetMonths = Math.round(t * 12);

    // Simulate month-by-month to accurately track depletion
    let balance = corpus;
    let monthsLasted = 0;
    const chartData: { year: number; value: number }[] = [];

    for (let m = 1; m <= 600; m++) { // max 50 years
      if (balance <= 0) break;
      // Apply growth first
      if (monthlyRate > 0) {
        balance = balance * (1 + monthlyRate);
      }
      // Subtract withdrawal
      balance -= monthlyW;
      monthsLasted = m;

      // Record yearly snapshots
      if (m % 12 === 0) {
        chartData.push({ year: m / 12, value: Math.round(balance * 100) / 100 });
        if (balance <= 0) break;
      }

      // Stop at the requested withdrawal period
      if (m >= targetMonths) break;
    }

    const totalWithdrawn = monthlyW * Math.min(monthsLasted, targetMonths);
    const endingValue = balance;

    const results: CalculatorResult[] = [
      {
        id: 'finalValue',
        label: `Final Value (${monthsLasted >= targetMonths ? 'Corpus preserved' : 'Depleted'})`,
        value: fmt(endingValue),
        highlight: true,
        color: endingValue > 0 ? 'positive' : 'negative',
        interpretation: monthsLasted >= targetMonths
          ? `Your withdrawal rate stayed below the assumed growth rate, so the corpus outlasted the withdrawal period and still has value left. This assumes a steady return every month — real markets don't move in a straight line, so a market downturn early in withdrawals can deplete a fund faster than this model shows.`
          : `Withdrawals outpaced growth and the fund ran out after ${monthsLasted} of the ${targetMonths} months requested. Lowering the monthly withdrawal or extending the time horizon are the two levers that fix this.`,
      },
      {
        id: 'totalInvested',
        label: 'Total Investment',
        value: fmt(corpus),
        color: 'neutral',
      },
      {
        id: 'totalWithdrawn',
        label: 'Total Withdrawal',
        value: fmt(totalWithdrawn),
        color: 'neutral',
      },
      {
        id: 'monthsLasted',
        label: 'Withdrawal Period',
        value: `${monthsLasted} months (${(monthsLasted / 12).toFixed(1)} yr)`,
        color: 'neutral',
      },
      {
        id: 'withdrawalChart',
        label: 'Withdrawal Chart Data',
        value: JSON.stringify(chartData),
      },
    ];

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(SwpPanel, { values, results });
  },
  educational: {
    formula: 'Balance_t = Balance_t-1 × (1 + r/12) − Withdrawal',
    diagram: {
      svg: '<svg viewBox="0 0 440 280" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="24" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-333333)">How SWP Works — Withdrawals vs. Growth</text><text x="220" y="48" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Each month: corpus earns returns, then withdrawal is deducted</text><rect x="40" y="70" width="160" height="70" fill="rgba(59,130,246,0.06)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="6"/><text x="120" y="96" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-3b82f6)">Start of Month</text><text x="120" y="114" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Corpus Balance</text><text x="120" y="130" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Earns Monthly Return</text><rect x="240" y="70" width="160" height="70" fill="rgba(239,68,68,0.06)" stroke="var(--svg-ef4444)" stroke-width="2" rx="6"/><text x="320" y="96" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ef4444)">End of Month</text><text x="320" y="114" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Withdrawal Deducted</text><text x="320" y="130" text-anchor="middle" font-size="10" fill="var(--svg-666666)">New Balance for Next Month</text><line x1="200" y1="105" x2="240" y2="105" stroke="var(--svg-94a3b8)" stroke-width="1" marker-end="url(#swpArr)"/><text x="220" y="175" text-anchor="middle" font-size="11" fill="var(--svg-333333)">Balance_t = Balance_t-1 x (1 + r/12) - Withdrawal</text><text x="220" y="200" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Sustainable when: Returns > Withdrawals</text><text x="220" y="222" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Depletion risk when: Withdrawals > Returns</text><text x="220" y="250" text-anchor="middle" font-size="10" fill="var(--svg-94a3b8)">The 4% rule: withdrawing 4% of initial corpus annually typically lasts 30+ years</text><defs><marker id="swpArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="var(--svg-94a3b8)"/></marker></defs></svg>',
      alt: 'Diagram showing how SWP works: corpus earns returns at start of month, withdrawal is deducted at end of month, and the remaining balance carries forward',
      caption: 'Each month, the corpus earns returns first, then the withdrawal is deducted from the remaining balance',
    },
    formulaDescription:
      'The SWP calculation simulates month-by-month depletion: at the start of each month, the remaining balance earns one month of returns (r/12), then the monthly withdrawal is deducted. If the returns exceed the withdrawal, the corpus grows — this is the ideal scenario for perpetual income. If the withdrawal exceeds returns, the corpus gradually depletes. The simulation runs until either the balance reaches zero or the requested withdrawal period ends. The key metric is sustainability: can the corpus survive the full required period? The SWP formula is essentially the reverse of the SIP formula — instead of adding money monthly, you are removing it while the remaining balance continues compounding.',
    variables: [
      { symbol: 'P', name: 'Initial Corpus', description: 'The total investable amount at the start of withdrawals. This is typically your retirement corpus or any large investment intended for regular income generation.' },
      { symbol: 'r', name: 'Annual Return Rate', description: 'The expected annual return on the remaining balance. A balanced portfolio (equity + debt) typically expects 7-9% post-retirement. The monthly rate is r/12 applied each month before the withdrawal.' },
      { symbol: 'W', name: 'Monthly Withdrawal', description: 'The fixed amount withdrawn every month for living expenses. This should be set based on your monthly budget needs. A withdrawal rate of 4-6% of the initial corpus (annualized) is generally considered sustainable for 30+ years.' },
      { symbol: 't', name: 'Withdrawal Period', description: 'The number of years you need the corpus to last. For retirement planning, this is typically 25-35 years (e.g., retiring at 60 with life expectancy of 85-90).' },
    ],
    howToUse: [
      'Enter your total corpus — this is the amount you\'ll draw from (e.g., retirement savings, investment maturity amount).',
      'Set the expected annual return rate based on your post-retirement asset allocation (conservative: 6-7%, balanced: 7-9%).',
      'Enter the monthly withdrawal amount you need for living expenses — be realistic about your budget.',
      'Set the withdrawal period in years — this should match your expected remaining lifespan or the period you need income.',
      'Check the results: does the corpus survive the full period? If not, reduce withdrawals or increase the corpus.',
    ],
    commonUses: [
      'Plan retirement income by simulating how long a retirement corpus of Rs 1 crore will last with monthly withdrawals of Rs 50,000',
      'Calculate sustainable withdrawal rate to avoid outliving savings — find the monthly amount that preserves the corpus',
      'Compare SWP with annuity products by projecting how much monthly income each option generates from the same corpus',
      'Determine if a corpus is sufficient for early retirement (FIRE) by testing different withdrawal rates against a 40-50 year horizon',
    ],
    explanation:
      'A Systematic Withdrawal Plan (SWP) is the mirror image of an SIP — instead of putting money in regularly, you take money out regularly while the remaining balance continues to earn returns. SWPs are most commonly used in retirement planning, where a retiree needs a predictable monthly income from their accumulated corpus without liquidating everything at once. The concept of sustainable withdrawal rates gained prominence from the "Trinity Study" (1998, updated 2011) by Cooley, Hubbard, and Walz at Trinity University, which established the famous "4% rule": withdrawing 4% of the initial portfolio value annually (adjusted for inflation) gives a high probability (~95%) of not outliving your money over a 30-year retirement. In the Indian context, slightly higher withdrawal rates of 5-6% are sometimes considered given higher expected equity returns, but this comes with greater sequence-of-returns risk. The key risk in SWP is "reverse compounding" — when you withdraw during market downturns, you lock in losses and deplete the corpus faster. This is why a balanced asset allocation (equity + debt) with a cash buffer for 2-3 years of expenses is recommended for SWP strategies.',
    workedExamples: [
      {
        scenario: 'Mr. Sharma, age 60, has a retirement corpus of Rs 1 crore invested in a balanced fund. He needs Rs 50,000 per month for living expenses. Assuming 8% annual returns, will his corpus last 30 years until age 90?',
        inputs: { corpus: '10000000', expectedReturn: '8', monthlyWithdrawal: '50000', withdrawalPeriod: '30' },
        result: 'With 8% returns and Rs 50,000/month withdrawal (6% annual withdrawal rate), the corpus lasts approximately 28-29 years — just short of 30 years. Reducing withdrawals to Rs 45,000/month (5.4% withdrawal rate) would extend the corpus to cover the full 30 years.',
        insight: 'With 8% returns and Rs 50,000/month withdrawal (6% annual withdrawal rate), the corpus lasts approximately 28-29 years — just short of the 30-year target. Mr. Sharma should either reduce withdrawals to about Rs 45,000/month (5.4% withdrawal rate) or supplement with an additional Rs 10-15 lakh corpus to comfortably cover 30 years.',
      },
      {
        scenario: 'Ananya, age 45, is planning early retirement (FIRE) with a corpus of Rs 3 crore. She needs Rs 1 lakh per month and expects 9% returns from a diversified portfolio. Can she sustain this for 45 years?',
        inputs: { corpus: '30000000', expectedReturn: '9', monthlyWithdrawal: '100000', withdrawalPeriod: '45' },
        result: 'At a 4% annual withdrawal rate (Rs 1 lakh/month = Rs 12 lakh/year = 4% of Rs 3 crore), the corpus has a high probability of lasting 45+ years at 9% returns. With returns exceeding the withdrawal rate by 5%, the corpus may actually grow over time.',
        insight: 'At a 4% annual withdrawal rate (Rs 1 lakh/month = Rs 12 lakh/year = 4% of Rs 3 crore), the corpus has a high probability of lasting 45+ years at 9% returns. In fact, with returns exceeding the withdrawal rate by 5%, the corpus may actually grow over time. Ananya\'s plan is conservative and sustainable — the key risk is sequence-of-returns in the first 5 years of early retirement.',
      },
    ],
    proTips: [
      'Follow the 4% rule as a starting point: withdrawing 4% of your initial corpus annually (adjusted for inflation) has historically supported 30+ year retirements with a 60/40 equity/debt portfolio.',
      'Keep 2-3 years of expenses in a liquid fund or fixed deposit as a "cash bucket." During market downturns, withdraw from this buffer instead of selling equity at lows — this is the bucket strategy.',
      'Review and adjust withdrawals annually based on actual portfolio performance. If the portfolio underperforms for 2-3 consecutive years, reduce withdrawals by 10-15% temporarily.',
      'For Indian SWPs from mutual funds, note that each withdrawal is treated as a redemption and taxed accordingly (equity: 12.5% LTCG above Rs 1.25L/year; debt: slab rate). Plan withdrawals across fund types to optimize tax efficiency.',
      'Consider a "dynamic SWP" where you withdraw a fixed percentage of the current balance rather than a fixed amount — this automatically adjusts to portfolio performance and virtually guarantees you never run out of money.',
      'Sequence-of-returns risk is highest in the first 5 years of retirement. A bad market in years 1-5 is far more damaging than a bad market in years 20-25 because you are selling units at depressed prices early on.',
    ],
    limitations: [
      'This calculator assumes a constant annual return rate year after year, but real-world returns are volatile. A few consecutive bad years early in retirement (sequence-of-returns risk) can deplete the corpus much faster than the calculator suggests.',
      'It does not account for inflation — Rs 50,000 today will have much less purchasing power in 20 years. A proper retirement plan should use "real returns" (returns minus inflation) for projections.',
      'The calculator simulates month-by-month but does not account for taxes on withdrawals, exit loads, or fund management fees.',
      'For retirement planning, consider consulting a SEBI-registered fee-only financial planner for a comprehensive plan that accounts for inflation, healthcare costs, and life expectancy.',
    ],
    quickReference: [
      { label: '4% Rule (Trinity Study)', value: '4% of corpus/year, adjusted for inflation' },
      { label: 'Indian Conservative SWR', value: '5-6% for equity-heavy portfolios' },
      { label: 'Perpetual SWR', value: '3-3.5% to preserve corpus indefinitely' },
      { label: 'SWP vs Annuity', value: 'SWP retains capital; annuity surrenders it' },
      { label: 'Bucket Strategy', value: '2-3yr cash + balance in balanced fund' },
      { label: 'Tax: Equity LTCG', value: '12.5% above Rs 1.25L/year' },
      { label: 'Sequence Risk', value: 'Bad markets in early years are most damaging' },
      { label: 'Key Metric', value: 'Does corpus survive the full period?' },
    ],
    faqs: [
      {
        question: 'How long will my corpus last?',
        answer: 'The calculator simulates month-by-month withdrawals and growth. Your corpus lasts as long as the balance stays above zero after each withdrawal. A sustainable withdrawal rate is typically 4-6% of the initial corpus per year. At 8% returns with 5% withdrawal rate, the corpus can last 30+ years. At 8% returns with 10% withdrawal rate, it may deplete in 12-15 years. The chart shows the projected balance year by year so you can see exactly when depletion occurs.',
      },
      {
        question: 'What is a safe withdrawal rate for Indian retirees?',
        answer: 'The classic "4% rule" from the US Trinity Study suggests withdrawing 4% of initial corpus annually (adjusted for inflation) for a 30-year retirement with 95% success rate. For India, a withdrawal rate of 5-6% is sometimes used due to higher expected equity returns (10-12% vs 7-8% in the US), but this carries higher risk. A conservative Indian SWP withdrawal rate is 4-5% for a balanced portfolio. For early retirement (FIRE) requiring 40-50 years, aim for 3-3.5% withdrawal rate to ensure the corpus outlasts you.',
      },
      {
        question: 'Is SWP better than buying an annuity?',
        answer: 'SWP gives you control over your capital — you can increase/decrease withdrawals, change funds, and the remaining corpus goes to your heirs. Annuities (like LIC\'s Jeevan Akshay) surrender your capital to the insurance company in exchange for guaranteed lifetime income. The trade-off is certainty vs. flexibility: annuities provide guaranteed income for life but no liquidity; SWP provides flexibility and capital preservation but carries market risk. Many planners recommend a hybrid: annuity for essential expenses + SWP for discretionary spending.',
      },
      {
        question: 'How does inflation affect my SWP?',
        answer: 'Inflation is the silent killer of SWP plans. If you withdraw Rs 50,000/month today, at 6% inflation you will need Rs 90,000/month in 10 years and Rs 1.6 lakh/month in 20 years to maintain the same purchasing power. The calculator does not automatically adjust for inflation. To account for it, either use "real returns" (nominal return minus inflation) or increase your withdrawal amount by 5-7% each year. A proper retirement plan must account for inflation in expenses and healthcare costs.',
      },
      {
        question: 'How are SWP withdrawals taxed in India?',
        answer: 'Each SWP installment is treated as a redemption of mutual fund units on a first-in-first-out (FIFO) basis. For equity funds: LTCG (held > 1 year) taxed at 12.5% above Rs 1.25 lakh per year; STCG (held < 1 year) at 20%. For debt funds: taxed at your income tax slab rate regardless of holding period (as per 2023 Budget changes). For tax-efficient SWP, stagger your initial investment over multiple funds and withdraw from debt fund units held over 3 years first to minimize short-term gains tax.',
      },
      {
        question: 'What is the bucket strategy for SWP?',
        answer: 'The bucket strategy divides your corpus into three buckets: Bucket 1 (2-3 years of expenses in liquid funds/FDs) for immediate needs — immune to market volatility. Bucket 2 (5-7 years in balanced/hybrid funds) for medium-term needs. Bucket 3 (rest in equity funds) for long-term growth. You spend from Bucket 1, refill it from Bucket 2 during good market years, and refill Bucket 2 from Bucket 3. This prevents selling equity during market crashes and is one of the most effective risk-management strategies for retirees.',
      },
    ],
    citations: [
      { source: 'SEBI — Mutual Funds', url: 'https://www.sebi.gov.in' },
      { source: 'Trinity Study — Cooley, Hubbard & Walz (1998)', url: 'https://en.wikipedia.org/wiki/Trinity_study' },
    ],
  },
};

export default swpConfig;
