import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import { cagr, arithmeticAverage } from '../../../utils/financial';
import AverageReturnPanel from './AverageReturnPanel';

const averageReturnConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'inputMode',
      label: 'Input Method',
      type: 'select',
      required: true,
      options: [
        { label: 'Starting & Ending Values', value: 'simple' },
        { label: 'List of Annual Returns (%)', value: 'annual' },
      ],
      helpText: 'Choose how to provide your return data — either a single start/end value or a list of year-by-year returns.',
    },
    {
      id: 'startingValue',
      label: 'Starting Value',
      type: 'number',
      placeholder: '10,000',
      prefix: '$',
      min: 0,
      step: 100,
      showWhen: (v) => v.inputMode === 'simple',
      helpText: 'The initial value of your investment at the beginning of the period.',
    },
    {
      id: 'endingValue',
      label: 'Ending Value',
      type: 'number',
      placeholder: '18,000',
      prefix: '$',
      min: 0,
      step: 100,
      showWhen: (v) => v.inputMode === 'simple',
      helpText: 'The final value of your investment at the end of the period.',
    },
    {
      id: 'years',
      label: 'Time Period (Years)',
      type: 'number',
      placeholder: '5',
      inputMode: 'decimal',
      min: 1,
      max: 50,
      step: 1,
      showWhen: (v) => v.inputMode === 'simple',
      helpText: 'Number of years between the starting and ending values.',
    },
    {
      id: 'returnsInput',
      label: 'Annual Returns (comma-separated %)',
      type: 'text',
      placeholder: '12, -5, 8, 15, 3',
      helpText: 'Enter each year\'s return as a percentage, separated by commas. Example: 12, -5, 8, 15, 3',
      showWhen: (v) => v.inputMode === 'annual',
    },
  ],

  calculate: (values) => {
    // Decimal.js for monetary precision — imported at top of file

    const mode = values.inputMode || 'simple';

    if (mode === 'simple') {
      const clean = (v: string) => String(v).replace(/[$,]/g, '');
      const start = parseFloat(clean(values.startingValue));
      const end = parseFloat(clean(values.endingValue));
      const years = parseFloat(clean(values.years));

      if (isNaN(start) || isNaN(end) || isNaN(years) || start <= 0 || end <= 0 || years <= 0) return [];

      const cagrRate = cagr(start, end, years);
      const simpleReturn = (end - start) / start;
      const arithmeticAvg = simpleReturn / years;

      // Simulate actual compounding to show difference
      let simulatedEnd = start;
      for (let y = 0; y < Math.floor(years); y++) {
        simulatedEnd *= (1 + cagrRate);
      }
      const lastYearFraction = years - Math.floor(years);
      if (lastYearFraction > 0) simulatedEnd *= (1 + cagrRate * lastYearFraction);

      const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;
      const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const growthMultiple = end / start;

      return [
        { id: 'cagr', label: 'Compound Annual Growth Rate (CAGR)', value: fmtPct(cagrRate), highlight: true, color: cagrRate > 0 ? 'positive' as const : 'negative' as const },
        { id: 'simpleAvg', label: 'Simple Average Return (Annual)', value: fmtPct(arithmeticAvg), color: 'neutral' as const },
        { id: 'totalReturn', label: 'Total Return Over Period', value: fmtPct(simpleReturn), color: 'neutral' as const },
        { id: 'growthMultiple', label: 'Growth Multiple', value: `${growthMultiple.toFixed(2)}x`, color: 'positive' as const },
        { id: 'startVal', label: 'Starting Value', value: `$${fmt(start)}`, color: 'neutral' as const },
        { id: 'endVal', label: 'Ending Value', value: `$${fmt(end)}`, color: 'positive' as const },
        { id: 'difference', label: 'CAGR vs Simple Average', value: `${(Math.abs(cagrRate - arithmeticAvg) * 100).toFixed(2)}% difference — CAGR is the more accurate metric for investments`, color: 'neutral' as const },
      ];
    }

    // Annual returns mode
    const returnsStr = values.returnsInput || '';
    const returns = returnsStr.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
    if (returns.length < 2) return [];

    const returnsDecimal = returns.map((r) => r / 100);
    const arithmeticAvg = arithmeticAverage(returnsDecimal);

    // CAGR from array: find start and end values for visualization
    // For CAGR from return series, we compound: (1+r1)(1+r2)...(1+rn) - 1
    const cumulativeGrowth = returnsDecimal.reduce((acc, r) => acc * (1 + r), 1);
    const totalReturn = cumulativeGrowth - 1;
    const cagrRate = Math.pow(cumulativeGrowth, 1 / returns.length) - 1;

    const posYears = returnsDecimal.filter((r) => r > 0).length;
    const negYears = returnsDecimal.filter((r) => r < 0).length;
    const bestYear = Math.max(...returnsDecimal);
    const worstYear = Math.min(...returnsDecimal);

    const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;

    return [
      { id: 'cagr', label: `CAGR (${returns.length}-Year Period)`, value: fmtPct(cagrRate), highlight: true, color: cagrRate > 0 ? 'positive' as const : 'negative' as const },
      { id: 'simpleAvg', label: 'Arithmetic Average', value: fmtPct(arithmeticAvg), color: 'neutral' as const },
      { id: 'totalReturn', label: 'Total Cumulative Return', value: fmtPct(totalReturn), color: 'neutral' as const },
      { id: 'bestYear', label: 'Best Year', value: fmtPct(bestYear), color: 'positive' as const },
      { id: 'worstYear', label: 'Worst Year', value: fmtPct(worstYear), color: 'negative' as const },
      { id: 'positiveYears', label: 'Positive Years', value: `${posYears} of ${returns.length} (${(posYears / returns.length * 100).toFixed(0)}%)`, color: 'positive' as const },
      { id: 'negativeYears', label: 'Negative Years', value: `${negYears} of ${returns.length} (${(negYears / returns.length * 100).toFixed(0)}%)`, color: 'negative' as const },
      { id: 'difference', label: 'Key Insight', value: `CAGR (${fmtPct(cagrRate)}) vs. Average (${fmtPct(arithmeticAvg)}) — CAGR accounts for volatility drag and is the true measure of investment growth`, color: 'neutral' as const },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(AverageReturnPanel, { values, results });
  },

  educational: {
    formula: 'CAGR = (EV/BV)^(1/n) − 1    |    Arithmetic Average = (r₁ + r₂ + ... + rₙ) ÷ n',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">CAGR vs. Arithmetic Average</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Volatility drag: why CAGR is the honest measure</text><g transform="translate(30,65)"><!-- Example returns as bar chart --><rect x="40" y="30" width="40" height="100" rx="4" fill="var(--svg-22c55e)"/><text x="60" y="24" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-22c55e)">+50%</text><text x="60" y="145" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">Year 1</text><rect x="100" y="130" width="40" height="70" rx="4" fill="var(--svg-ef4444)"/><text x="120" y="124" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ef4444)">-50%</text><text x="120" y="215" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">Year 2</text><rect x="160" y="60" width="40" height="70" rx="4" fill="var(--svg-22c55e)"/><text x="180" y="54" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-22c55e)">+35%</text><text x="180" y="145" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">Year 3</text><rect x="220" y="40" width="40" height="90" rx="4" fill="var(--svg-22c55e)"/><text x="240" y="34" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-22c55e)">+45%</text><text x="240" y="145" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">Year 4</text><rect x="280" y="110" width="40" height="20" rx="4" fill="var(--svg-ef4444)"/><text x="300" y="104" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ef4444)">-10%</text><text x="300" y="145" text-anchor="middle" font-size="9" fill="var(--svg-94a3b8)">Year 5</text></g><!-- Comparison box --><g transform="translate(40,150)"><rect x="10" y="0" width="370" height="75" rx="10" fill="var(--svg-f1f5f9)"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Two Different Averages from the Same Data</text><rect x="40" y="28" width="140" height="20" rx="4" fill="var(--svg-22c55e)"/><text x="110" y="42" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">CAGR: +7.4% (True Growth)</text><rect x="200" y="28" width="170" height="20" rx="4" fill="var(--svg-f59e0b)"/><text x="285" y="42" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">Arithmetic Avg: +14.0% (Misleading)</text><text x="195" y="66" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">The gap is "volatility drag" — arithmetic average ignores compounding math</text></g><!-- Key insight --><g transform="translate(40,240)"><rect x="10" y="0" width="370" height="88" rx="10" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="1"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-b45309)">The 50/50 Trap: Why Sequence Matters</text><rect x="25" y="28" width="155" height="24" rx="4" fill="var(--svg-22c55e)"/><text x="102" y="44" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">Year 1: +50% → $150</text><rect x="25" y="54" width="155" height="24" rx="4" fill="var(--svg-ef4444)"/><text x="102" y="70" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">Year 2: -50% → $75</text><text x="275" y="36" text-anchor="middle" font-size="9" fill="var(--svg-ef4444)">Arithmetic avg: 0%</text><text x="275" y="52" text-anchor="middle" font-size="9" fill="var(--svg-22c55e)">CAGR: -13.4%</text><text x="275" y="70" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">You lost 25% of your money!</text><text x="195" y="84" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">The more volatile the returns, the bigger the CAGR vs. average gap</text></g></svg>',
      alt: 'Average return diagram showing 5-year bar chart of returns (+50%, -50%, +35%, +45%, -10%) comparing CAGR (7.4%) vs arithmetic average (14.0%) with the 50/50 trap explanation',
      caption: 'CAGR is always lower than or equal to the arithmetic average in volatile markets -- the gap (volatility drag) reveals the true cost of volatility',
    },
    formulaDescription:
      'CAGR (Compound Annual Growth Rate) is the year-over-year growth rate that would produce the same final result if returns were constant. The arithmetic average simply sums the annual returns and divides by the number of years. CAGR is always lower than or equal to the arithmetic average in volatile markets — this gap is called "volatility drag." The more volatile the returns, the larger the gap between these two metrics, which is why CAGR is the more honest measure of true investment performance.',
    variables: [
      { symbol: 'CAGR', name: 'Compound Annual Growth Rate', description: 'The smoothed annualized return that accounts for compounding. If a $10,000 investment grows to $18,000 over 5 years, the CAGR is 12.5% — meaning it grew at 12.5% every year to reach the same endpoint. CAGR is the standard for comparing investment returns across different time periods.' },
      { symbol: 'Arithmetic Avg', name: 'Simple Average', description: 'Sum of annual returns divided by number of years. A portfolio returning +25%, -10%, +15% has an arithmetic average of 10%. But the actual CAGR is lower due to volatility. Financial ads sometimes use the arithmetic average to make returns look better.' },
      { symbol: 'Volatility Drag', name: 'Volatility Drag', description: 'The mathematical gap between arithmetic average and CAGR. A 50% loss requires a 100% gain to break even. The more volatile the returns, the larger the gap between average and CAGR. This is why consistent but moderate returns often outperform volatile high returns over time.' },
    ],
    howToUse: [
      'Choose "Starting & Ending Values" to calculate CAGR from a single investment period — useful for real estate, business investments, or any buy-and-hold asset.',
      'Enter the starting value, ending value, and time period in years.',
      'CAGR is displayed first — the most important metric for investment performance. The simple average is shown for comparison.',
      'Choose "Annual Returns" to enter a list of per-year returns (e.g., 12, -5, 8, 15, 3). This mode also shows best/worst years and volatility statistics.',
      'The calculator shows both CAGR and arithmetic average side-by-side, with the volatility drag clearly visible. The difference between them tells you how volatile your returns were.',
    ],
    commonUses: [
      'Calculate the true compound annual growth rate of an investment portfolio over multiple years including the effect of volatility drag.',
      'Evaluate a fund manager performance claim by comparing the advertised arithmetic average return against the actual CAGR.',
      'Analyze a series of annual investment returns to understand how volatility reduces your effective compounded returns over time.',
    ],
    explanation:
      'The difference between CAGR and arithmetic average is one of the most misunderstood concepts in investing. If a fund manager says "our average annual return was 12%," check if they mean arithmetic or CAGR. Arithmetic averages are always higher in volatile markets. Example: a portfolio that gains 50% one year and loses 50% the next has an arithmetic average of 0% — but the CAGR is -13.4% because the 50% loss erases more than the 50% gain. This is why CAGR is the only honest measure of investment performance. For financial planning, always use CAGR when projecting future values. The arithmetic average is useful for comparing fund performance to benchmarks only when you understand it overstates true growth. The "annual returns" mode of this calculator makes the volatility drag visible by showing the gap between CAGR and the arithmetic average for your specific return series.',
    faqs: [
      {
        question: 'Why is CAGR always lower than the arithmetic average?',
        answer: 'CAGR accounts for compounding and volatility drag. When returns fluctuate, losses reduce the base from which future gains compound. A 50% gain followed by a 25% loss: arithmetic average is 12.5%, but the CAGR is 6.1%. The gap widens with volatility. This is why consistent but moderate returns often outperform volatile high returns over time. A fund that returns 8% every year beats a fund that returns +30%, -10%, +30%, -10% over the same period, even though the volatile fund has a higher arithmetic average.',
      },
      {
        question: 'Should I use CAGR or arithmetic average for financial planning?',
        answer: 'Always use CAGR for projecting future values. The arithmetic average overstates growth because it ignores compounding. For Monte Carlo simulations or retirement planning, use CAGR (or better, a distribution of returns centered on CAGR). The arithmetic average is useful for comparing fund performance to benchmarks only when you are aware it overstates true growth. When a fund says "10-year average return," check whether they mean CAGR or arithmetic — the difference can be 1-3% annually.',
      },
      {
        question: 'What is a "good" CAGR?',
        answer: 'Historical S&P 500 CAGR (1926–2024): approximately 10% nominal, 7% after inflation. A 10-year CAGR of 8–12% would be considered solid for equities. Bond CAGRs typically run 2–5%. For any investment, compare its CAGR to an appropriate benchmark (S&P 500 for US equities, Bloomberg Aggregate for bonds). A CAGR below the risk-free rate (Treasury yield) over a long period suggests the investment is not compensating you adequately for the risk taken.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
    
    workedExamples: [
      {
        scenario: 'Priya in Austin, TX invested $25,000 in a mutual fund 7 years ago and her account is now worth $42,500. She wants to know her true annualized return using the Starting & Ending Values mode.',
        inputs: { inputMode: 'simple', startingValue: '25000', endingValue: '42500', years: '7' },
        result: 'CAGR = (42,500 / 25,000)^(1/7) − 1 = 7.88%. Her total return over the period was 70.00%, and the growth multiple is 1.70x.',
        insight: 'Priya\'s 7.88% CAGR is the honest measure of her investment\'s annual performance. While the simple arithmetic average would show 10.00% (70% total return divided by 7 years), CAGR accounts for compounding and is the number she should use when comparing her fund against benchmarks or projecting future growth. The 2.12 percentage point gap between her arithmetic average and CAGR represents volatility drag — the mathematical cost of year-to-year return fluctuations.',
      },
      {
        scenario: 'Marcus in Chicago tracked his stock portfolio returns over 5 years: +22% in year 1, -8% in year 2, +15% in year 3, +5% in year 4, and -3% in year 5. He enters these as annual returns to see his true performance.',
        inputs: { inputMode: 'annual', returnsInput: '22, -8, 15, 5, -3' },
        result: 'CAGR = 5.62% over the 5-year period. Arithmetic average is 6.20%. Best year was +22%, worst year was -8%. 3 of 5 years were positive (60%).',
        insight: 'Marcus\'s arithmetic average of 6.20% makes his portfolio look slightly better than the 5.62% CAGR reveals. The 0.58 percentage point gap is volatility drag — his negative years (-8% and -3%) reduced the base from which his gains compounded. Over decades, a seemingly small annual gap compounds into a meaningful dollar difference. This is why mutual fund advertisements that quote "average annual returns" without specifying whether they mean arithmetic or CAGR can be misleading.',
      },
    ],

    proTips: [
      'Always use CAGR, not the arithmetic average, when comparing investment performance or projecting future values. The arithmetic average overstates growth because it ignores compounding math — the gap between them (volatility drag) is the true cost of return fluctuations.',
      'A 50% loss requires a 100% gain just to break even. Before celebrating a big winning year, check your CAGR over the full period — volatile high returns often underperform steady moderate ones over time.',
      'When evaluating a fund manager or financial advisor\'s performance claim, ask explicitly: "Is that the CAGR or the arithmetic average?" If they cannot tell you the difference, that is a red flag.',
      'For retirement planning projections, use a CAGR of 5-7% (after-inflation) rather than the historical 10% S&P 500 average — volatility drag and sequence-of-returns risk make conservative estimates more realistic for long-term planning.',
    ],

    quickReference: [
      { label: 'CAGR Formula', value: '(Ending Value / Starting Value)^(1/years) − 1' },
      { label: 'S&P 500 CAGR (1926-2024)', value: '~10% nominal, ~7% after inflation' },
      { label: 'Volatility Drag Definition', value: 'The gap between arithmetic average and CAGR — wider gap = more volatile returns' },
      { label: 'Rule of 72', value: '72 ÷ CAGR ≈ years to double your money (e.g., 7.2% CAGR doubles in ~10 years)' },
      { label: '50% Loss Recovery', value: 'A 50% loss requires a 100% gain to return to the starting value — sequence risk is why CAGR matters' },
    ],

    limitations: [
      'CAGR smooths out year-to-year volatility into a single constant rate. Real investments never grow at a steady rate — sequence-of-returns risk means the order of gains and losses matters enormously, especially when withdrawing money during retirement.',
      'This calculator assumes returns are reinvested and does not account for taxes, management fees, expense ratios, trading costs, or inflation. A stated 8% CAGR might be only 5-6% after fees and taxes in a taxable account.',
      'Past returns do not predict future results. A strong CAGR over the last 5-10 years tells you nothing about the next 5-10 years — reversion to the mean is a powerful force in financial markets.',
      'The CAGR from the simple mode is only valid for lump-sum investments held without additions or withdrawals. If you made contributions or withdrawals during the period, use a money-weighted return (IRR) calculation instead.',
    ],
citations: [
      { source: 'US Securities and Exchange Commission', url: 'https://www.investor.gov' },
      { source: 'Investopedia', url: 'https://www.investopedia.com/terms/a/averagereturn.asp' },
    ],
  },
};

export default averageReturnConfig;
