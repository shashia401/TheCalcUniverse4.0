import { createElement, useMemo } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { fvWithContributions, fmtCurrency } from '../../../utils/financial';

function MutualFundPanel({ values }: { values: Record<string, string>; results: CalculatorResult[] }) {
  const initial = parseFloat(values.initialInvestment) || 0;
  const monthly = parseFloat(values.monthlyContribution) || 0;
  const annualReturn = parseFloat(values.expectedReturn) / 100 || 0;
  const expenseRatio = parseFloat(values.expenseRatio) / 100 || 0;
  const years = parseFloat(values.investmentYears) || 0;

  const chartData = useMemo(() => {
    if (years <= 0) return [];
    const monthlyRate = annualReturn / 12;
    const data: Array<{ year: number; withFee: number; withoutFee: number }> = [];
    for (let y = 1; y <= years; y++) {
      const m = y * 12;
      const netRate = (annualReturn - expenseRatio) / 12;
      // With fee: reduced net return
      const withFee = netRate > 0
        ? fvWithContributions(initial, monthly, netRate, m)
        : initial + monthly * m;
      // Without fee: full return
      const withoutFee = fvWithContributions(initial, monthly, monthlyRate, m);
      data.push({ year: y, withFee, withoutFee });
    }
    return data;
  }, [initial, monthly, annualReturn, expenseRatio, years]);

  const last = chartData[chartData.length - 1];
  const feeImpactDollars = last ? last.withoutFee - last.withFee : 0;
  const feeImpactPct = last && last.withoutFee > 0 ? (feeImpactDollars / last.withoutFee) * 100 : 0;

  if (chartData.length === 0) return null;

  const maxVal = Math.max(...chartData.map((d) => d.withoutFee));
  const width = 520;
  const height = 180;
  const padL = 55;
  const padR = 20;
  const padT = 16;
  const padB = 36;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const toX = (i: number) => padL + (i / (chartData.length - 1)) * chartW;
  const toY = (v: number) => padT + (1 - v / maxVal) * chartH;

  const pathWith = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.withFee).toFixed(1)}`).join(' ');
  const pathWithout = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.withoutFee).toFixed(1)}`).join(' ');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Fee Impact Visualization</span>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Without Fees</p>
            <p className="text-lg font-black text-emerald-700">{last ? fmtCurrency(last.withoutFee) : '$0'}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">With {expenseRatio * 100}% Fee</p>
            <p className="text-lg font-black text-amber-700">{last ? fmtCurrency(last.withFee) : '$0'}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 col-span-2 sm:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Fees Cost You</p>
            <p className="text-lg font-black text-red-600">{fmtCurrency(feeImpactDollars)} ({feeImpactPct.toFixed(1)}% of final)</p>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px' }} role="img" aria-label="Mutual fund growth comparison chart">
            {[0, 0.25, 0.5, 0.75, 1].map((g) => {
              const y = padT + (1 - g) * chartH;
              return (
                <g key={g}>
                  <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
                  <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">
                    {maxVal * g >= 1_000_000 ? `$${(maxVal * g / 1_000_000).toFixed(1)}M` : `$${(maxVal * g / 1_000).toFixed(0)}K`}
                  </text>
                </g>
              );
            })}
            <path d={pathWithout} fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinejoin="round" />
            <path d={pathWith} fill="none" stroke="#f59e0b" strokeWidth={2.5} strokeLinejoin="round" strokeDasharray="4 3" />
            <rect x={padL} y={padT} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth={0.5} />
          </svg>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-emerald-500" />
            <span className="text-[10px] text-slate-500">Without Expense Ratio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-amber-500" style={{ strokeDasharray: '4 3' }} />
            <span className="text-[10px] text-slate-500">With {(expenseRatio * 100).toFixed(2)}% Fee</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const mutualFundConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'initialInvestment',
      label: 'Initial Investment',
      type: 'number',
      placeholder: '10,000',
      prefix: '$',
      min: 0,
      step: 500,
      required: true,
      helpText: 'One-time amount you are investing today (lump sum)',
    },
    {
      id: 'monthlyContribution',
      label: 'Monthly Contribution',
      type: 'number',
      placeholder: '500',
      prefix: '$',
      inputMode: 'decimal',
      min: 0,
      step: 50,
      required: true,
      helpText: 'Amount you add every month on top of the initial investment',
    },
    {
      id: 'expectedReturn',
      label: 'Expected Annual Return',
      type: 'number',
      placeholder: '8',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 30,
      step: 0.1,
      required: true,
      helpText: 'Estimated annual market return before fees (S&P 500 historical: ~10%)',
    },
    {
      id: 'expenseRatio',
      label: 'Expense Ratio',
      type: 'number',
      placeholder: '0.75',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 5,
      step: 0.01,
      required: true,
      helpText: "The fund's annual expense ratio. Index funds: 0.03–0.20%. Actively managed funds: 0.50–1.50%.",
    },
    {
      id: 'investmentYears',
      label: 'Investment Timeframe',
      type: 'number',
      placeholder: '20',
      unit: 'years',
      inputMode: 'decimal',
      min: 1,
      max: 50,
      step: 1,
      required: true,
      helpText: 'Number of years you plan to stay invested — longer periods amplify fee impact',
    },
  ],

  calculate: (values) => {
    const initial = parseFloat(values.initialInvestment);
    const monthly = parseFloat(values.monthlyContribution) || 0;
    const annualReturn = parseFloat(values.expectedReturn) / 100;
    const expenseRatio = parseFloat(values.expenseRatio) / 100;
    const years = parseFloat(values.investmentYears);

    if (isNaN(initial) || isNaN(annualReturn) || isNaN(expenseRatio) || isNaN(years) || years <= 0) return [];

    const months = years * 12;
    const netAnnualReturn = annualReturn - expenseRatio;
    const monthlyRate = annualReturn / 12;
    const netMonthlyRate = netAnnualReturn / 12;

    const totalContributions = initial + monthly * months;
    const withoutFees = monthlyRate > 0
      ? fvWithContributions(initial, monthly, monthlyRate, months)
      : totalContributions;
    const withFees = netMonthlyRate > 0
      ? fvWithContributions(initial, monthly, netMonthlyRate, months)
      : totalContributions;
    const feeImpact = withoutFees - withFees;
    const feeImpactPct = withoutFees > 0 ? (feeImpact / withoutFees) * 100 : 0;
    const contributionPct = withoutFees > 0 ? (totalContributions / withoutFees) * 100 : 0;
    const earningsWith = withFees - totalContributions;

    return [
      { id: 'withFees', label: `Projected Balance (${(expenseRatio * 100).toFixed(2)}% Expense Ratio)`, value: fmtCurrency(withFees), highlight: true, color: 'positive' as const, interpretation: `That ${(expenseRatio * 100).toFixed(2)}% annual fee costs you ${fmtCurrency(feeImpact)} over this period — ${feeImpactPct.toFixed(1)}% of what you'd otherwise have. Fees compound too, quietly, which is why even a "small" 1% difference in expense ratio can add up to a meaningful chunk of your balance over decades.` },
      { id: 'withoutFees', label: 'Projected Balance (No Fees)', value: fmtCurrency(withoutFees), color: 'neutral' as const },
      { id: 'feeImpact', label: 'Total Cost of Fees', value: `${fmtCurrency(feeImpact)} (${feeImpactPct.toFixed(1)}% of balance)`, color: 'negative' as const },
      { id: 'totalContributions', label: 'Total Contributions', value: fmtCurrency(totalContributions), color: 'neutral' as const },
      { id: 'earningsWith', label: 'Investment Growth (After Fees)', value: fmtCurrency(earningsWith), color: 'positive' as const },
      { id: 'netReturn', label: 'Net Annual Return After Fees', value: `${(netAnnualReturn * 100).toFixed(2)}%`, color: 'neutral' as const },
      { id: 'contributionPct', label: 'Contributions as % of Final Balance', value: `${contributionPct.toFixed(0)}%`, color: 'neutral' as const },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(MutualFundPanel, { values, results });
  },

  educational: {
    formula: 'FV = PV(1+r−e)^n + PMT[((1+r−e)^n − 1)/(r−e)]',
    formulaSource: 'Standard future value formula with expense ratio (e) deducted from annual return (r). Referenced in SEC Mutual Fund Cost Calculator methodology and FINRA Fund Analyzer.',
    diagram: {
      svg: '<svg viewBox="0 0 440 280" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="24" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-333333)">How Expense Ratios Erode Returns</text><text x="220" y="48" text-anchor="middle" font-size="11" fill="var(--svg-666666)">The gap between with-fee and without-fee growth widens over time</text><rect x="40" y="70" width="160" height="70" rx="6" fill="rgba(34,197,94,0.08)" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="120" y="96" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-22c55e)">No Fees</text><text x="120" y="114" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Full return r compounds</text><text x="120" y="130" text-anchor="middle" font-size="10" fill="var(--svg-666666)">FV = PV(1+r)^n</text><rect x="240" y="70" width="160" height="70" rx="6" fill="rgba(239,68,68,0.08)" stroke="var(--svg-ef4444)" stroke-width="2"/><text x="320" y="96" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ef4444)">With Fee (e)</text><text x="320" y="114" text-anchor="middle" font-size="10" fill="var(--svg-666666)">Net return r-e compounds</text><text x="320" y="130" text-anchor="middle" font-size="10" fill="var(--svg-666666)">FV = PV(1+r-e)^n</text><line x1="200" y1="105" x2="240" y2="105" stroke="var(--svg-94a3b8)" stroke-width="1" marker-end="url(#mfArrow)"/><text x="220" y="175" text-anchor="middle" font-size="11" fill="var(--svg-333333)">The fee gap = FV_no_fees - FV_with_fees</text><text x="220" y="198" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Example: 1% fee over 30 years consumes ~25-30% of final balance</text><text x="220" y="222" text-anchor="middle" font-size="11" fill="var(--svg-666666)">A $10,000 investment with $500/month at 8% grows to:</text><text x="220" y="246" text-anchor="middle" font-size="11" fill="var(--svg-22c55e)">$844,000 without fees vs $678,000 with 1% fee ($166,000 lost)</text><defs><marker id="mfArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="var(--svg-94a3b8)"/></marker></defs></svg>',
      alt: 'Comparison showing how a portfolio grows without fees vs with fees, where the gap widens dramatically over time',
      caption: 'Expense ratios are deducted annually from returns before compounding — the fee gap widens exponentially over long time periods',
    },
    formulaDescription:
      'The same future value formula, but with the expense ratio (e) subtracted from the annual return (r). The fee compounds silently — a 1% fee on a 30-year portfolio consumes roughly 25–30% of the final balance. The net return (r − e) is the actual growth rate your money experiences after the fund company takes its cut. This formula makes it painfully clear why fees matter so much over long time horizons.',
    variables: [
      { symbol: 'Expense Ratio', name: 'Annual Fee', description: "The fund's annual operating expense as a percentage of assets. Index funds: 0.03–0.20%. Actively managed: 0.50–1.50%. This fee is deducted from returns before they compound, silently eroding your growth year after year." },
      { symbol: 'r − e', name: 'Net Return', description: 'The gross annual return minus the expense ratio. If the market returns 8% and the fund charges 0.75%, your net return is 7.25% — but the fee compounds, so the real impact grows over time and becomes far larger than a simple subtraction would suggest.' },
      { symbol: 'Fee Drag', name: 'The Silent Killer', description: 'Over 30 years, a 1% fee on a $500K portfolio costs approximately $150,000–$200,000 in lost growth. The fee is paid every year, rain or shine, regardless of fund performance. It is the single largest controllable cost in investing.' },
    ],
    howToUse: [
      'Enter your initial investment and planned monthly contributions.',
      "Enter the expected annual return based on the fund's historical performance or benchmark (e.g., S&P 500 ~10% nominal, ~7% real).",
      "Enter the fund's expense ratio — find this in the fund's prospectus (e.g., VTSAX = 0.04%, actively managed funds = 0.50–1.50%).",
      'Set your investment timeframe — the fee impact grows exponentially with time, not linearly.',
      'Compare the "with fees" vs. "without fees" numbers and the fee impact visualization chart to see how much fees actually cost you over the long run.',
    ],
    commonUses: [
      'Compare the long-term impact of different expense ratios to see how fund fees reduce your investment returns over time.',
      'Decide between an actively managed fund and a low-cost index fund by projecting the fee-adjusted growth difference over decades.',
      'Understand how seemingly small differences in expense ratios compound into tens or hundreds of thousands of dollars in lost growth.',
    ],
    explanation:
      "An expense ratio is the annual fee that mutual funds charge investors as a percentage of assets under management, and it is the single most important factor in long-term investment returns. Most investors dramatically underestimate the impact of fees. A 1% expense ratio sounds small, but over 30 years it consumes roughly 25 to 30 percent of your final portfolio value. The modern mutual fund industry traces back to the 20th century — the Massachusetts Investors Trust, launched in 1924, was the first open-end mutual fund. Jack Bogle founded Vanguard in 1975 and launched the first retail index fund in 1976, democratizing low-cost investing. Bogle's central insight — that most active fund managers fail to beat their benchmarks after fees — has been confirmed annually by the SPIVA scorecard. Today, a $10,000 investment with $500/month contributions at 8% return grows to $844,000 without fees. With a 1% fee: $678,000. The difference ($166,000) went to the fund manager, not you. Index funds with 0.03% to 0.10% expense ratios eliminate almost all of this drag. This calculator makes the 'fee question' visible: would you rather pay 0.04% for VTSAX or 1.50% for an actively managed fund with no guarantee of outperformance? The chart shows the year-by-year divergence between a portfolio with fees and one without — the gap widens markedly over time as the fee compounds on a growing balance.",
    workedExamples: [
      {
        scenario: "Sarah, age 30, is choosing between VTSAX (0.04% expense ratio) and a popular actively managed large-cap fund (0.85% expense ratio). She plans to invest $10,000 initially plus $500/month for 30 years, expecting 8% market returns. How much will fees cost her with each choice?",
        inputs: { initialInvestment: '10000', monthlyContribution: '500', expectedReturn: '8', expenseRatio: '0.85', investmentYears: '30' },
        result: "With the actively managed fund (0.85% fee), projected balance is approximately $603,000. Fee cost: roughly $181,000 over 30 years — nearly 3x total contributions of $190,000. Switching to VTSAX (0.04% fee) would save approximately $172,000.",
        insight: "With the actively managed fund (0.85% fee), the projected balance is about $603,000. The total cost of fees: approximately $181,000 over 30 years — nearly 3x her total contributions of $190,000. Switching to VTSAX (0.04% fee) would save roughly $172,000 in fees. The fee difference alone could fund several years of retirement.",
      },
      {
        scenario: "James inherited $50,000 at age 25 and wants to invest it without additional contributions for 35 years until retirement at 60. He is considering a fund with 1.25% expense ratio vs. a low-cost index fund at 0.10%. Market returns are expected at 9%.",
        inputs: { initialInvestment: '50000', monthlyContribution: '0', expectedReturn: '9', expenseRatio: '1.25', investmentYears: '35' },
        result: "With the expensive fund (1.25% fee), projected balance is approximately $683,000. Fee cost: roughly $337,000 — over one-third of potential wealth. With an index fund (0.10% fee), projected balance is approximately $985,000. The $302,000 difference is purely from the expense ratio gap.",
        insight: "Without fees at 9%, the portfolio would grow to approximately $1,020,000. With the expensive fund (net return 7.75%), it reaches about $683,000. Fees consume $337,000 — over one-third of potential wealth. With the index fund (0.10% fee), it reaches about $985,000 — only $35,000 lost to fees. The $302,000 difference between the two fund choices is purely from the expense ratio gap of 1.15%.",
      },
    ],
    proTips: [
      "The expense ratio is the single best predictor of future fund performance — lower fees consistently correlate with higher net returns across all fund categories and time periods.",
      "Look beyond the headline expense ratio: some funds charge additional 12b-1 marketing and distribution fees and transaction costs that do not appear in the published expense ratio but still reduce your net returns.",
      "When comparing two funds, focus on the fee impact in dollar terms rather than percentage terms. A 0.5% difference sounds small but can mean $100,000+ in lost retirement savings over a 30-year period.",
      "Use this calculator to compare funds in the same category — index fund vs. index fund, or active fund vs. active fund. The real shock comes from comparing a low-cost index fund against a high-cost active fund with similar holdings.",
      "For workplace retirement plans like 401k and 403b accounts, always check the expense ratios of available funds. Some plans offer institutional share classes with lower fees — prioritizing these can significantly boost retirement outcomes.",
      "ETFs and index mutual funds tracking the same index may have different expense ratios — compare both before choosing. Vanguard, Fidelity, and Schwab now offer nearly identical products with fees under 0.05%.",
    ],
    limitations: [
      'This calculator assumes constant annual returns every year, but real market returns are volatile. Expense ratios are deducted regardless of fund performance — you pay the fee even in negative-return years, which amplifies losses.',
      'The calculator does not account for front-end loads, back-end loads, or 12b-1 distribution fees that some funds charge on top of the expense ratio.',
      'Transaction costs including brokerage, bid-ask spreads, and market impact are not included but do reduce net returns.',
      'Tax implications of mutual fund capital gains distributions are not modeled — actively managed funds tend to generate more taxable distributions than index funds.',
      'Past returns do not guarantee future results.',
    ],
    quickReference: [
      { label: "Index Fund ER (VTSAX)", value: "0.04%" },
      { label: "Index Fund ER (FXAIX)", value: "0.015%" },
      { label: "Fidelity ZERO Funds", value: "0.00%" },
      { label: "Active Fund Avg ER", value: "0.45% to 0.90%" },
      { label: "1% Fee Over 30 Years", value: "~25-30% of final balance" },
      { label: "SPIVA Underperform Rate", value: "~80-90% over 10-15 years" },
      { label: "Key Decision Rule", value: "Lower ER almost always wins" },
      { label: "Check Prospectus For", value: "Annual Fund Operating Expenses" },
    ],
    faqs: [
      {
        question: 'What is a good expense ratio?',
        answer: 'For index funds: 0.03–0.20% is excellent. Vanguard Total Stock Market (VTSAX): 0.04%. Fidelity ZERO funds: 0.00%. For actively managed funds: 0.50–1.00% is reasonable for specialized strategies. Anything above 1.50% is expensive and rarely justified by outperformance. The average asset-weighted expense ratio for US mutual funds has fallen below 0.40% due to the rise of index investing and increased fee awareness among investors.',
      },
      {
        question: 'Does a higher expense ratio mean better performance?',
        answer: 'No — extensive academic research (including the SPIVA scorecard by S&P Global) shows that low-cost funds outperform high-cost funds on average over 5- and 10-year periods. Expense ratios are the single best predictor of future fund performance relative to peers. Higher fees do not buy better returns — they guarantee lower net returns. The data is so clear that Warren Buffett famously won a $1 million bet: an S&P 500 index fund outperformed a basket of hedge funds over 10 years, purely because of lower fees.',
      },
      {
        question: 'How do I find a fund\'s expense ratio?',
        answer: 'The expense ratio is listed in every mutual fund\'s prospectus and on any major financial site (Morningstar, Yahoo Finance, the fund company\'s website). It is expressed as a percentage of assets under management. ETFs and index funds typically have lower expense ratios than actively managed mutual funds. Look for the "Expense Ratio" or "Management Expense Ratio" (MER) in Canada. The prospectus also lists the expense ratio broken down into management fees, administrative costs, and distribution fees (12b-1).',
      },
      {
        question: 'Why does a seemingly small difference in expense ratio matter so much?',
        answer: 'Because the fee is charged every single year on the entire portfolio balance, not just on your contributions. As your portfolio grows through contributions and compounding, the dollar amount of the fee grows with it. A 1% fee on a $10,000 portfolio is only $100 per year, but on a $1 million portfolio it is $10,000 per year. Over decades, this compounds into an enormous drag. Mathematically, the fee reduces the compounding rate (r becomes r minus e), and small changes in the compounding rate produce huge differences over long periods due to the exponential nature of compound growth. This is why the gap between the two lines in the fee impact chart widens dramatically in the later years.',
      },
      {
        question: 'Are there really mutual funds with zero expense ratio?',
        answer: 'Yes. Fidelity introduced four ZERO index funds in 2018 with 0.00% expense ratio and no minimum investment requirement. These include FZROX (Total US Market) and FZILX (International). These funds use proprietary Fidelity-designed indices to avoid paying licensing fees to index providers like S&P or MSCI. The zero-fee structure is permanent, not a temporary waiver. Other brokers including BNY Mellon and SoFi have also launched zero-fee funds to compete. These are legitimate products, though they may only be available within that specific brokerage platform.',
      },
    ],
  },
};

export default mutualFundConfig;
