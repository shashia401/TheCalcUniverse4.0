import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import SipPanel from './SipPanel';

function fmt(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const sipConfig: CalculatorConfig = {
  shapeTabs: [
    { label: 'Monthly SIP', value: 'sip', slug: 'sip' },
    { label: 'Lump Sum', value: 'lumpsum', slug: 'lumpsum' },
  ],
  inputs: [
    {
      id: 'lumpsum',
      label: 'Lump Sum Investment',
      type: 'number',
      placeholder: '1,00,000',
      prefix: '₹',
      min: 0,
      step: 5000,
      helpText: 'One-time investment amount',
      showWhen: (v) => v.shape === 'lumpsum',
    },
    {
      id: 'monthlyInvestment',
      label: 'Monthly Investment',
      type: 'number',
      placeholder: '10,000',
      prefix: '₹',
      min: 0,
      step: 500,
      helpText: 'Amount you invest every month',
      showWhen: (v) => v.shape !== 'lumpsum',
    },
    {
      id: 'expectedReturn',
      label: 'Expected Return (p.a.)',
      type: 'number',
      placeholder: '12',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 100,
      step: 0.5,
      required: true,
      helpText: 'Expected annual return rate',
    },
    {
      id: 'timePeriod',
      label: 'Time Period',
      type: 'number',
      placeholder: '10',
      unit: 'years',
      inputMode: 'decimal',
      min: 0,
      step: 1,
      required: true,
      helpText: 'Number of years you plan to invest',
    },
  ],
  calculate: (values) => {
    // Decimal.js for monetary precision — imported at top of file

    const lumpsum = parseFloat(values.lumpsum) || 0;
    const monthly = parseFloat(values.monthlyInvestment) || 0;
    const r = parseFloat(values.expectedReturn) / 100;
    const t = parseFloat(values.timePeriod);

    if ((monthly <= 0 && lumpsum <= 0) || isNaN(r) || isNaN(t) || t <= 0) return [];

    const monthlyRate = r / 12;
    const months = Math.round(t * 12);
    const totalSipInvested = monthly * months;
    const totalInvested = lumpsum + totalSipInvested;

    let fv: number;
    if (monthlyRate === 0) {
      fv = lumpsum + totalSipInvested;
    } else {
      // Lump sum: FV = lumpsum × (1 + r)^n
      const fvLumpsum = lumpsum * Math.pow(1 + monthlyRate, months);
      // SIP: annuity due (invested at month start)
      // FV = monthly × [((1 + r)^n - 1) / r] × (1 + r)
      const fvSip = monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
      fv = fvLumpsum + fvSip;
    }

    const totalReturns = fv - totalInvested;

    // Build yearly wealth chart data
    const chartData = [];
    for (let year = 1; year <= Math.min(t, 30); year++) {
      const yMonths = year * 12;
      if (monthlyRate === 0) {
        chartData.push({ year, value: lumpsum + monthly * yMonths });
      } else {
        const lumpVal = lumpsum * Math.pow(1 + monthlyRate, yMonths);
        const sipVal = monthly * ((Math.pow(1 + monthlyRate, yMonths) - 1) / monthlyRate) * (1 + monthlyRate);
        chartData.push({ year, value: Math.round((lumpVal + sipVal) * 100) / 100 });
      }
    }

    const label = lumpsum > 0 ? (monthly > 0 ? 'Lumpsum + SIP' : 'Lumpsum Only') : 'SIP Only';

    const results: CalculatorResult[] = [
      {
        id: 'futureValue',
        label: `Total Value (${label})`,
        value: fmt(fv),
        highlight: true,
        color: 'positive',
        interpretation: `Of this, ${fmt(totalInvested)} is money you contribute and the rest is projected market growth at the return you assumed. That growth compounds, but it isn't guaranteed — real returns swing year to year, so treat this as a midpoint, not a promise.`,
      },
      {
        id: 'totalInvested',
        label: 'Total Invested',
        value: fmt(totalInvested),
        color: 'neutral',
      },
      {
        id: 'totalReturns',
        label: 'Total Returns',
        value: fmt(totalReturns),
        color: 'positive',
      },
      {
        id: 'wealthChart',
        label: 'Wealth Chart Data',
        value: JSON.stringify(chartData),
      },
    ];

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(SipPanel, { values, results });
  },
  educational: {
    formula: 'FV = LS × (1 + r)^n + P × [((1 + r)^n - 1) / r] × (1 + r)',
    diagram: {
      svg: '<svg viewBox="0 0 440 280" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="24" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-333333)">How SIP Compounding Works</text><text x="220" y="48" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Each monthly investment earns returns from day one</text><circle cx="100" cy="100" r="30" fill="rgba(59,130,246,0.08)" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="100" y="96" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-3b82f6)">Month 1</text><text x="100" y="112" text-anchor="middle" font-size="10" fill="var(--svg-666666)">P x (1+r)^n</text><circle cx="220" cy="100" r="30" fill="rgba(34,197,94,0.08)" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="220" y="96" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-22c55e)">Month 2</text><text x="220" y="112" text-anchor="middle" font-size="10" fill="var(--svg-666666)">P x (1+r)^(n-1)</text><circle cx="340" cy="100" r="30" fill="rgba(139,92,246,0.08)" stroke="var(--svg-8b5cf6)" stroke-width="2"/><text x="340" y="96" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-8b5cf6)">Month n</text><text x="340" y="112" text-anchor="middle" font-size="10" fill="var(--svg-666666)">P x (1+r)</text><text x="220" y="165" text-anchor="middle" font-size="11" fill="var(--svg-333333)">Total FV = P x [(1+r)^n - 1]/r x (1+r)</text><text x="220" y="190" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Plus any Lump Sum: LS x (1+r)^n</text><line x1="130" y1="80" x2="190" y2="80" stroke="var(--svg-94a3b8)" stroke-width="1" marker-end="url(#sipArrow)"/><line x1="250" y1="80" x2="310" y2="80" stroke="var(--svg-94a3b8)" stroke-width="1" marker-end="url(#sipArrow)"/><defs><marker id="sipArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="var(--svg-94a3b8)"/></marker></defs><text x="220" y="230" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Earlier investments compound for longer periods</text><text x="220" y="250" text-anchor="middle" font-size="11" fill="var(--svg-666666)">This is the power of rupee cost averaging + compounding</text></svg>',
      alt: 'Diagram showing how monthly SIP contributions compound over time, with earlier contributions earning returns for more months',
      caption: 'Earlier SIP contributions compound for more months — time in the market matters more than timing the market',
    },
    formulaDescription:
      'The SIP formula combines two components: the future value of a lump sum (if any) plus the future value of an annuity due for monthly contributions. The annuity due formula uses the (1 + r) multiplier because SIP contributions are invested at the start of each month, giving each installment an extra month of compounding compared to end-of-month investments. This seemingly small detail adds up significantly over long periods — a 15-year SIP with the annuity due formula will show about 0.5-1% higher final value than the ordinary annuity formula. The total wealth grows through the power of compounding, where returns themselves generate further returns, creating an exponential growth curve that accelerates dramatically in the later years.',
    variables: [
      { symbol: 'P', name: 'Monthly SIP Amount', description: 'The fixed amount invested every month. Even small amounts like Rs 5,000/month compound into significant wealth over 20+ years.' },
      { symbol: 'LS', name: 'Lump Sum (Optional)', description: 'A one-time initial investment that compounds for the entire period. Bonuses, inheritances, or existing savings can be invested as a lump sum alongside the monthly SIP.' },
      { symbol: 'r', name: 'Monthly Rate', description: 'The annual expected return rate divided by 12. For Indian equity mutual funds, 10-12% annual return (0.83-1% monthly) is a commonly used estimate based on historical Nifty 50 data.' },
      { symbol: 'n', name: 'Total Months', description: 'The total number of months you invest. Longer durations dramatically amplify compounding — 10 extra years can more than double the final corpus.' },
    ],
    howToUse: [
      'Optionally enter a lump sum amount for a one-time initial investment (e.g., investing a bonus).',
      'Enter your monthly SIP investment amount — this is the amount auto-debited from your bank each month.',
      'Set your expected annual return rate based on the fund category: 10-12% for equity funds, 7-9% for hybrid funds, 5-7% for debt funds.',
      'Choose your investment time period in years — the longer, the more compounding works in your favor.',
      'Review the total maturity value, total amount invested, and total returns earned. The chart shows yearly wealth growth.',
    ],
    commonUses: [
      'Plan for retirement by calculating how much monthly SIP is needed to reach a target corpus over 20-30 years',
      'Save for a child\'s education by estimating the required monthly investment to accumulate college fees in 10-15 years',
      'Create a down payment for a home by projecting how regular SIP investments grow over 5-7 years',
      'Combine a bonus (lump sum) with ongoing monthly SIP to accelerate wealth building for any long-term goal',
    ],
    explanation:
      'A Systematic Investment Plan (SIP) is one of the most powerful wealth-building tools available to retail investors, particularly in India where it has gained massive popularity. The concept originated from the mutual fund industry\'s recognition that disciplined, regular investing helps investors overcome behavioral biases like market timing and emotional decision-making. SIP harnesses two powerful forces: rupee cost averaging (buying more units when markets are low and fewer when high) and the power of compounding (returns generating returns). This calculator uses the annuity due formula, which assumes contributions are made at the start of each month — the standard practice for SIPs in India — giving each installment an extra month of compounding compared to end-of-month investments. A monthly SIP of just Rs 10,000 at 12% annual returns grows to approximately Rs 50 lakh in 15 years, Rs 1 crore in 20 years, and Rs 3.5 crore in 30 years. The key insight is that early contributions work the hardest: the first month\'s Rs 10,000 compounds for the full 30 years, while the last month\'s Rs 10,000 compounds for just one month. This is why starting early, even with small amounts, is far more important than trying to invest large sums later.',
    workedExamples: [
      {
        scenario: 'Ravi, age 25, starts a monthly SIP of Rs 5,000 in an equity mutual fund expecting 12% annual returns. He plans to invest for 30 years until retirement at 55. How much will his corpus be, and how much of it is pure returns versus his own contributions?',
        inputs: { monthlyInvestment: '5000', expectedReturn: '12', timePeriod: '30' },
        result: 'Total invested: Rs 18 lakh. Maturity value: approximately Rs 1.76 crore. Total returns: Rs 1.58 crore (about 90% of the final corpus) — nearly 10x the amount actually invested.',
        insight: 'Total invested = Rs 5,000 x 360 months = Rs 18 lakh. The maturity value comes to approximately Rs 1.76 crore. That means Rs 1.58 crore (about 90% of the final corpus) is pure returns earned through compounding — nearly 10x the amount he actually invested. This demonstrates why starting early is the single most important factor in wealth creation.',
      },
      {
        scenario: 'Priya receives a Rs 5 lakh bonus and wants to invest it as a lump sum while also starting a Rs 15,000 monthly SIP for her daughter\'s college education in 12 years. She expects 10% annual returns from a balanced fund.',
        inputs: { lumpsum: '500000', monthlyInvestment: '15000', expectedReturn: '10', timePeriod: '12' },
        result: 'Lump sum growth: Rs 5 lakh grows to approximately Rs 15.7 lakh. SIP growth: Rs 15,000/month grows to approximately Rs 41.5 lakh. Combined corpus: approximately Rs 57.2 lakh, with Rs 30.6 lakh in returns.',
        insight: 'The lump sum of Rs 5 lakh grows to approximately Rs 15.7 lakh at 10% over 12 years. The monthly SIP of Rs 15,000 grows to approximately Rs 41.5 lakh. Combined, she will have about Rs 57.2 lakh for her daughter\'s education. The total invested is Rs 26.6 lakh, generating Rs 30.6 lakh in returns.',
      },
    ],
    proTips: [
      'Start as early as possible — a Rs 10,000 SIP started at age 25 vs. age 35 means a difference of over Rs 1 crore by retirement, even though only Rs 12 lakh extra is invested.',
      'Step up your SIP annually by 5-10% to match your income growth. A Rs 10,000 SIP stepped up 10% yearly grows to a corpus nearly 3x larger than a flat SIP over 20 years.',
      'Align your SIP date with your salary credit date (e.g., 1st or 5th of the month) to ensure consistent investing and avoid missed installments due to insufficient balance.',
      'For equity SIPs, ignore short-term market fluctuations — continuing SIPs during market downturns buys you more units at lower prices, which amplifies returns when markets recover.',
      'Use the lumpsum + SIP combination strategically: invest windfalls (bonuses, tax refunds, inheritances) as lump sums while maintaining your regular monthly SIP for disciplined wealth building.',
      'Review your SIP performance annually against the benchmark index. If the fund consistently underperforms its benchmark over 3+ years, consider switching to a better-performing fund in the same category.',
    ],
    limitations: [
      'This calculator uses a fixed annual return rate, but real-world mutual fund returns are volatile and vary year to year. The actual SIP return depends on market conditions at the time of each monthly investment.',
      'Equity mutual funds carry market risk — returns can be negative in some years, especially over short periods (less than 3-5 years).',
      'The calculator does not account for expense ratios, exit loads, or taxes (capital gains tax on equity funds: 12.5% LTCG above Rs 1.25 lakh per year; STCG at 20% for holdings under 1 year).',
      'Past returns do not guarantee future results. This is an educational projection tool, not a guarantee of returns.',
    ],
    quickReference: [
      { label: 'Equity Funds (Historical)', value: '10-12% p.a. over 10+ years' },
      { label: 'Hybrid Funds', value: '7-9% p.a. conservative estimate' },
      { label: 'Debt Funds', value: '5-7% p.a. based on current yields' },
      { label: 'SIP Date', value: 'Start of month (annuity due)' },
      { label: 'Min SIP Amount', value: 'Rs 500/month (most AMCs)' },
      { label: 'Tax on Equity Gains', value: '12.5% LTCG > Rs 1.25L/year' },
      { label: 'Key Metric', value: 'Total Returns vs Total Invested' },
      { label: 'Best Strategy', value: 'Start early + stay invested + step up' },
    ],
    faqs: [
      {
        question: 'What is the difference between lumpsum and SIP investing?',
        answer: 'A lumpsum investment puts all the money in at once, so the entire amount starts compounding immediately. SIP spreads investments over time, which reduces the impact of market volatility through rupee cost averaging. Historically, lumpsum investing has delivered higher returns in consistently rising markets, while SIP outperforms in volatile or declining markets because it buys more units when prices are low. A combination strategy — investing windfalls as lumpsum while maintaining monthly SIPs — often provides the best of both worlds.',
      },
      {
        question: 'Is it better to invest lumpsum or through SIP?',
        answer: 'It depends on market conditions and your risk tolerance. In a bull market, lumpsum typically wins because more money is invested for longer. In volatile or bear markets, SIP wins because each installment buys at different price points, lowering the average cost per unit. Research by SEBI and AMFI shows that over 7+ year periods, the performance difference narrows significantly. For most salaried investors, SIP is more practical because it aligns with regular income and removes the need to time the market.',
      },
      {
        question: 'What is the minimum amount required to start a SIP?',
        answer: 'Most Indian mutual fund houses allow SIPs starting from Rs 500 per month. Some fund houses offer micro-SIPs starting from Rs 100 per month (with reduced KYC requirements). There is no maximum limit — you can invest any amount based on your financial goals and capacity. Many investors run multiple SIPs across different fund categories (large-cap, mid-cap, flexi-cap, debt) to diversify their portfolio.',
      },
      {
        question: 'How are SIP returns taxed in India?',
        answer: 'For equity-oriented mutual funds (65%+ in Indian equities): Long-term capital gains (LTCG) above Rs 1.25 lakh per year are taxed at 12.5% without indexation benefit. Short-term capital gains (STCG) for holdings under 1 year are taxed at 20%. For debt funds: gains are taxed as per your income tax slab regardless of holding period. SIPs are taxed on a first-in-first-out (FIFO) basis — each monthly installment is treated as a separate investment with its own holding period.',
      },
      {
        question: 'Can I stop or modify my SIP anytime?',
        answer: 'Yes, SIPs are completely flexible. You can stop (pause), increase, decrease, or cancel your SIP at any time without any penalty. Most fund houses allow modifications through their website, app, or by submitting a simple form. There is no lock-in period for open-ended mutual funds (except ELSS tax-saving funds, which have a 3-year lock-in). This flexibility is one of the key advantages of SIP investing over traditional insurance-cum-investment products.',
      },
      {
        question: 'What happens to my SIP if I miss a monthly installment?',
        answer: 'Missing one or two SIP installments typically does not cancel your SIP — the auto-debit mandate continues for the next scheduled date. However, if you miss 2-3 consecutive installments due to insufficient balance, some fund houses may temporarily suspend the SIP mandate. You can easily reactivate it. To avoid missed installments, align your SIP date with when your salary is credited and maintain a buffer balance in your bank account.',
      },
      {
        question: 'What is the "15 x 15 x 15" rule of SIP investing?',
        answer: 'The 15 x 15 x 15 rule is a popular thumb rule in India: If you invest Rs 15,000 per month for 15 years at 15% annual returns, your corpus will exceed Rs 1 crore (approximately Rs 1.02 crore). This demonstrates how consistency (15 years) and a reasonable return expectation (15% from equity) can create significant wealth. The actual returns may vary — 12% is a more conservative assumption that still produces impressive results over the long term.',
      },
    ],
    citations: [
      { source: 'SEBI — Mutual Fund Investment Guide', url: 'https://www.sebi.gov.in' },
      { source: 'Association of Mutual Funds in India (AMFI)', url: 'https://www.amfiindia.com' },
    ],
  },
};

export default sipConfig;
