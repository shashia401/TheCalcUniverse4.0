import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import PresentValuePanel from './PresentValuePanel';

const pvSvg = `<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">Discounting: Future Money Brought to Today</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Higher discount rates = less you need to invest today</text><g transform="translate(40,70)"><rect x="250" y="0" width="150" height="80" rx="10" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="2"/><text x="325" y="28" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-b45309)">Future Value</text><text x="325" y="50" text-anchor="middle" font-size="24" font-weight="bold" fill="var(--svg-d97706)">$FV</text><text x="325" y="68" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Target amount needed later</text><rect x="40" y="0" width="150" height="80" rx="10" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="2"/><text x="115" y="28" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e40af)">Present Value</text><text x="115" y="50" text-anchor="middle" font-size="24" font-weight="bold" fill="var(--svg-2563eb)">$PV</text><text x="115" y="68" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">Amount to invest today</text><line x1="195" y1="40" x2="245" y2="40" stroke="var(--svg-ef4444)" stroke-width="3" stroke-linecap="round"/><polygon points="245,34 255,40 245,46" fill="var(--svg-ef4444)"/><text x="225" y="28" text-anchor="middle" font-size="10" fill="var(--svg-ef4444)" font-weight="bold">Discount</text><text x="225" y="58" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">/ (1+r)^n</text><rect x="40" y="110" width="360" height="50" rx="8" fill="var(--svg-f1f5f9)" stroke="var(--svg-cbd5e1)" stroke-width="1"/><text x="220" y="130" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-475569)">Higher Discount Rate = Smaller Present Value</text><text x="220" y="148" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">At 10% discount: $100K in 10yr = $38.5K today | At 5%: = $61.4K today</text><rect x="55" y="180" width="70" height="80" rx="4" fill="var(--svg-3b82f6)"/><text x="90" y="270" text-anchor="middle" font-size="8" fill="var(--svg-475569)">3% rate</text><text x="90" y="176" text-anchor="middle" font-size="8" fill="var(--svg-3b82f6)" font-weight="bold">$74K</text><rect x="145" y="210" width="70" height="50" rx="4" fill="var(--svg-8b5cf6)"/><text x="180" y="270" text-anchor="middle" font-size="8" fill="var(--svg-475569)">7% rate</text><text x="180" y="206" text-anchor="middle" font-size="8" fill="var(--svg-8b5cf6)" font-weight="bold">$51K</text><rect x="235" y="235" width="70" height="25" rx="4" fill="var(--svg-ef4444)"/><text x="270" y="270" text-anchor="middle" font-size="8" fill="var(--svg-475569)">10% rate</text><text x="270" y="231" text-anchor="middle" font-size="8" fill="var(--svg-ef4444)" font-weight="bold">$39K</text><rect x="325" y="247" width="70" height="13" rx="4" fill="var(--svg-ef4444)" opacity="0.6"/><text x="360" y="270" text-anchor="middle" font-size="8" fill="var(--svg-475569)">15% rate</text><text x="360" y="243" text-anchor="middle" font-size="8" fill="var(--svg-ef4444)" font-weight="bold">$25K</text></g><g transform="translate(40,300)"><text x="180" y="10" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">PV = FV / (1+r/m)^(n x m)</text><text x="180" y="26" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">The discount rate is your expected return — higher returns require less capital today</text></g></svg>`;

const presentValueConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'futureValue',
      label: 'Future Value (FV)',
      type: 'number',
      prefix: '$',
      placeholder: '100,000',
      inputMode: 'numeric',
      required: true,
      helpText: 'The amount of money you want to have at the end of the investment period.',
    },
    {
      id: 'periods',
      label: 'Number of Periods (Years)',
      type: 'number',
      placeholder: '10',
      inputMode: 'numeric',
      required: true,
      helpText:
        'Enter the number of years. The calculator multiplies by compounding frequency internally.',
    },
    {
      id: 'discountRate',
      label: 'Discount Rate / Expected Return',
      type: 'number',
      unit: '%',
      placeholder: '7',
      inputMode: 'decimal',
      step: 0.01,
      required: true,
      helpText:
        'The annual interest rate or required rate of return. Use 7% for long-run S&P 500 (inflation-adjusted), 10% for nominal.',
    },
    {
      id: 'compoundingFrequency',
      label: 'Compounding Frequency',
      type: 'select',
      required: true,
      options: [
        { label: 'Annually (once per year)', value: '1' },
        { label: 'Semi-annually (twice per year)', value: '2' },
        { label: 'Quarterly (4x per year)', value: '4' },
        { label: 'Monthly (12x per year)', value: '12' },
        { label: 'Daily (365x per year)', value: '365' },
      ],
    },
  ],

  calculate: (values) => {
    const futureValue = parseFloat(values.futureValue);
    const periods = parseFloat(values.periods);
    const discountRate = parseFloat(values.discountRate);
    const m = parseInt(values.compoundingFrequency || '1', 10);

    if ([futureValue, periods, discountRate].some(isNaN)) return [];
    if (futureValue <= 0 || periods <= 0 || discountRate < 0) return [];

    // Core PV calculation using Decimal.js
    const rPerPeriod = new Decimal(discountRate).div(100).div(m);
    const totalPeriods = m * periods;
    const presentValue = new Decimal(futureValue).div(
      new Decimal(1).plus(rPerPeriod).pow(totalPeriods)
    ).toNumber();

    const discountAmount = futureValue - presentValue;
    const discountFactor = new Decimal(presentValue).div(futureValue);
    const effectiveAnnualRate = new Decimal(1)
      .plus(new Decimal(discountRate).div(100).div(m))
      .pow(m)
      .minus(1)
      .toNumber();

    // Growth timeline
    const maxPoints = Math.min(Math.ceil(periods), 20);
    const step = periods / maxPoints;
    const growthTimeline: { year: number; value: number }[] = [];

    for (let i = 0; i <= maxPoints; i++) {
      const y = Math.min(i * step, periods);
      const value = new Decimal(presentValue)
        .times(new Decimal(1).plus(effectiveAnnualRate).pow(y))
        .toDecimalPlaces(2)
        .toNumber();
      growthTimeline.push({ year: parseFloat(y.toFixed(2)), value });
    }
    // Ensure endpoint is exact FV
    if (growthTimeline.length > 0) {
      growthTimeline[growthTimeline.length - 1].value = futureValue;
    }

    const fmt = (n: number) =>
      new Decimal(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    const reciprocal = new Decimal(1).div(discountFactor);

    return [
      {
        id: 'presentValueResult',
        label: 'Present Value (PV) — Amount Needed Today',
        value: `$${fmt(presentValue)}`,
        highlight: true,
        color: 'positive' as const,
        interpretation: `This is how much you'd need today, at your assumed discount rate, to grow into the future amount — the flip side of compound interest. A higher discount rate lowers this number, since it assumes your money could earn more elsewhere; use a rate that reflects a realistic alternative investment, not a wish.`,
      },
      {
        id: 'discountAmountResult',
        label: 'Total Discount Amount (FV - PV)',
        value: `$${fmt(discountAmount)}`,
        color: 'negative' as const,
      },
      {
        id: 'discountFactorResult',
        label: 'Discount Factor (1 today = $X in the future)',
        value: `1 : ${reciprocal.toFixed(4)}`,
        color: 'neutral' as const,
      },
      {
        id: 'effectiveAnnualRateResult',
        label: 'Effective Annual Rate (with compounding)',
        value: `${(effectiveAnnualRate * 100).toFixed(4)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'futureValueResult',
        label: 'Future Value (your target)',
        value: `$${fmt(futureValue)}`,
        color: 'neutral' as const,
      },
      {
        id: '_pvData',
        label: '_pvData',
        value: JSON.stringify({
          futureValue,
          presentValue,
          discountAmount,
          discountFactor: discountFactor.toNumber(),
          periods,
          discountRate,
          compoundingFrequency: m,
          effectiveAnnualRate,
          growthTimeline,
        }),
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PresentValuePanel, { values, results });
  },

  educational: {
    formula: 'PV = FV / (1 + r/m)^(n x m)',
    diagram: {
      svg: pvSvg,
      alt: 'Diagram showing future value being discounted back to present value, with a bar chart comparing how different discount rates (3%, 7%, 10%, 15%) reduce the present value of the same $100K future goal',
      caption: 'Present value discounts future money back to today — at a 10% return rate, you need only $39K today to have $100K in 10 years',
    },
    formulaDescription:
      'Present Value (PV) is what a future sum of money is worth today, discounted at a given rate. FV = Future Value. r = annual discount rate. m = compounding periods per year. n = number of years. The formula reveals the Time Value of Money: a dollar today is worth more than a dollar in the future because it can be invested to grow. The discounting process is the reverse of compounding — instead of projecting forward, we pull future money back to the present. All calculations use decimal.js for precision arithmetic.',
    formulaSource:
      'The PV formula is a direct algebraic rearrangement of the compound interest formula FV = PV x (1 + r/m)^(n x m). It is the fundamental building block of discounted cash flow (DCF) analysis used in corporate finance, bond pricing, and investment valuation.',
    variables: [
      {
        symbol: 'PV',
        name: 'Present Value',
        description: 'The current value of a future sum. The amount you need to invest today. PV is always less than or equal to FV (assuming positive discount rates).',
      },
      {
        symbol: 'FV',
        name: 'Future Value',
        description: 'The target amount you want to have at the end of the period. This is the nominal sum you aim to accumulate, before accounting for the time value of money.',
      },
      {
        symbol: 'r/m',
        name: 'Rate per Period',
        description:
          'Annual discount rate divided by compounding frequency. More frequent compounding means each period has a smaller rate but compounds more times, increasing the effective annual rate and reducing the PV needed today.',
      },
      {
        symbol: 'n x m',
        name: 'Total Compounding Periods',
        description:
          'Total number of times interest compounds. 10 years monthly = 120 compounding periods. More periods mean more frequent compounding, which slightly reduces the PV required to reach a given FV.',
      },
      {
        symbol: 'Discount Factor',
        name: 'Conversion Ratio',
        description: 'The factor used to discount future money to today: PV = FV x Discount Factor. A factor of 0.614 means $1 in the future is worth $0.614 today. Higher discount rates produce lower discount factors, making future money worth less now.',
      },
    ],
    howToUse: [
      'Enter the target future value, the number of years until you need the money, and your expected annual return rate.',
      'Select compounding frequency (monthly produces a slightly higher effective rate than annual).',
      'Review the present value — the amount to invest today. Adjust the discount rate to see how sensitive your PV is to return assumptions.',
    ],
    commonUses: [
      'Determine how much you need to invest today to reach a specific financial goal, such as saving $100,000 for college in 10 years.',
      'Calculate the fair price of a future cash flow or investment by discounting it back to present value at your required rate of return.',
      'Compare the present value of different investment opportunities to decide which one offers the best value for your money today.',
      'Price a zero-coupon bond: the PV of the face value discounted at the bond yield gives you the fair market price.',
    ],
    workedExamples: [
      {
        scenario: 'You want $100,000 for a child college fund in 15 years. How much should you invest today at a 7% expected annual return?',
        inputs: { futureValue: '100000', periods: '15', discountRate: '7', compoundingFrequency: '1' },
        result: 'PV = $36,244.60',
        insight: 'With annual compounding, you need $36,245 today to reach $100,000 in 15 years at 7%. If you can earn 9% instead, you only need $27,454 — a difference of nearly $8,800. This is why choosing the right investment vehicle matters immensely for long-term goals.',
      },
      {
        scenario: 'A relative promises to give you $50,000 in 8 years. What is that promise worth today if your required return is 5% with quarterly compounding?',
        inputs: { futureValue: '50000', periods: '8', discountRate: '5', compoundingFrequency: '4' },
        result: 'PV = $33,591.94',
        insight: 'The promise of $50,000 in 8 years is worth only $33,592 today at a 5% discount rate. If you could invest that $33,592 today at 5% compounded quarterly, it would grow to exactly $50,000 in 8 years. This illustrates why lottery winners choosing between a lump sum and annuity payments should always calculate the PV of the annuity stream.',
      },
      {
        scenario: 'You are offered a lump-sum pension buyout of $200,000 now vs. receiving $500,000 in 20 years. Which is better if you can earn 6% annually?',
        inputs: { futureValue: '500000', periods: '20', discountRate: '6', compoundingFrequency: '1' },
        result: 'PV = $155,902.36',
        insight: 'The $500,000 future payment is worth only $155,902 today at a 6% discount rate — much less than the $200,000 lump sum offer. You should take the lump sum. But at 4%, the PV jumps to $228,193, making the future payment the better deal. Discount rate choice changes the decision entirely.',
      },
    ],
    proTips: [
      'Use a lower discount rate (3-5%) for critical goals you cannot afford to miss (college, retirement basics) — this forces you to save more, providing a safety margin.',
      'Use a higher discount rate (8-10%) for aspirational goals — it reflects optimistic returns and tells you the minimum you could get away with saving.',
      'The discount rate should match the risk of the future cash flow: use the 10-year Treasury yield (~4-5%) for guaranteed payments like bonds, and 7-10% for equity-like uncertain returns.',
      'Always sensitivity-test your PV analysis with at least two discount rates — a 2% change in rate can swing the required investment by 30%+ for long time horizons.',
    ],
    limitations: [
      'The PV formula assumes the discount rate is constant for the entire period — in reality, rates change over time and different time horizons warrant different rates.',
      'This calculator does not account for taxes or inflation nibbling away at your real purchasing power — for real (inflation-adjusted) planning, subtract the expected inflation rate from your discount rate.',
      'The PV of a single future sum does not account for interim cash flows — for multi-period cash flow analysis, use NPV or IRR calculators instead.',
      'Extremely long time horizons (>50 years) amplify any error in the discount rate assumption exponentially — small differences compound into large PV variations.',
    ],
    quickReference: [
      { label: 'PV of $100K in 10yr at 7%', value: '$50,835' },
      { label: 'PV of $100K in 20yr at 7%', value: '$25,842' },
      { label: 'PV of $1M in 30yr at 7%', value: '$131,367' },
      { label: 'Rule of 72: Doubling Time', value: '72 / Rate% = Years to Double' },
      { label: 'S&P 500 Long-Run Real Return', value: '~7% (inflation-adjusted)' },
    ],
    explanation:
      'Present Value is one of the cornerstones of finance. It answers the question: "How much do I need to invest today to have a specific amount in the future?" This is essential for retirement planning, college savings, bond pricing, and investment analysis. The key insight is that a dollar received in the future is worth less than a dollar received today — because you could invest today\'s dollar and earn a return. The discount rate captures this opportunity cost. The choice of discount rate dramatically affects the result: needing $100,000 in 10 years at a 5% discount rate requires investing $61,391 today. At a 10% rate, you only need $38,554 — because you assume a higher return on your investments. This sensitivity is why PV analysis always includes rate assumptions, and why conservative planners use lower discount rates to ensure they save enough. All computations in this calculator use decimal.js to avoid floating-point errors in financial calculations.',
    faqs: [
      {
        question: 'What discount rate should I use?',
        answer:
          'The discount rate depends on your goal. For investments: 7% is the inflation-adjusted S&P 500 long-run return (a common benchmark). 10% is the nominal S&P 500 average. For risk-free planning: use the current 10-year Treasury yield (~4-5%). For a business project: use your WACC (weighted average cost of capital). A higher discount rate means a lower present value — it makes future money worth less today. When in doubt, try multiple rates to see the range.',
      },
      {
        question: 'What is the difference between Present Value and Net Present Value (NPV)?',
        answer:
          "Present Value (PV) discounts a single future cash flow back to today. Net Present Value (NPV) discounts multiple cash flows across different time periods and sums them all, including the initial investment (typically negative). NPV is used for investment decisions (like our IRR Calculator) — if NPV is positive, the investment exceeds your required return. PV is used for simpler single-amount questions like 'How much do I need to invest today to have $X in Y years?' or 'What is a future promised payment worth right now?'",
      },
      {
        question: 'How does compounding frequency affect present value?',
        answer:
          'More frequent compounding slightly increases the effective annual rate. For example, 7% compounded monthly has an effective annual rate of 7.229%. This means with monthly compounding, you need to invest slightly less today to reach the same future value — because your money grows slightly faster. The difference is small at typical rates but becomes meaningful at higher rates or over longer periods. Daily vs. monthly compounding makes almost no difference in practice.',
      },
      {
        question: 'Can PV be used to compare investments with different time horizons?',
        answer:
          'Yes — that is one of PV\'s most powerful uses. By discounting all future cash flows back to today, you can directly compare a 5-year bond paying $50,000 with a 20-year real estate investment returning $200,000. The investment with the higher PV (using the same discount rate) is the better opportunity in today\'s dollars. This apples-to-apples comparison is why PV is fundamental to capital budgeting and investment analysis.',
      },
      {
        question: 'How does inflation affect my present value calculation?',
        answer:
          'Inflation reduces the purchasing power of future money. To account for it, subtract the expected inflation rate from your discount rate to get a "real" discount rate. For example, if your nominal return is 7% and inflation is 3%, your real rate is approximately 4% (more precisely: 1.07/1.03 - 1 = 3.88%). Using the real rate gives you the inflation-adjusted PV — how much you need today in today\'s purchasing power. For long-term planning (>10 years), always use real rates to avoid the illusion that nominal dollars equal real wealth.',
      },
    ],
    citations: [
      { source: 'US Securities and Exchange Commission', url: 'https://www.investor.gov' },
      { source: 'Investopedia — Present Value', url: 'https://www.investopedia.com/terms/p/presentvalue.asp' },
      { source: 'CFA Institute — Time Value of Money', url: 'https://www.cfainstitute.org' },
    ],
  },
};

export default presentValueConfig;
