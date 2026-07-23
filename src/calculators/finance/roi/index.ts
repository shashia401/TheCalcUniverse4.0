import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import ROIPanel from './ROIPanel';

const roiConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'amountInvested',
      label: 'Amount Invested',
      type: 'number',
      placeholder: '10,000',
      prefix: '$',
      min: 0,
      step: 0.01,
      inputMode: 'decimal',
      required: true,
      helpText: 'The initial capital or cost of the investment',
    },
    {
      id: 'amountReturned',
      label: 'Amount Returned',
      type: 'number',
      placeholder: '15,000',
      prefix: '$',
      min: 0,
      step: 0.01,
      inputMode: 'decimal',
      required: true,
      helpText: 'The total value received back from the investment',
    },
    {
      id: 'years',
      label: 'Holding Period',
      type: 'number',
      placeholder: '5',
      unit: 'years',
      min: 0.25,
      max: 60,
      step: 0.25,
      inputMode: 'decimal',
      required: false,
      helpText: 'How long you held the investment (in years). Enter this to see the annualized ROI — the true per-year return.',
    },
  ],
  calculate: (values) => {
    const invested = parseFloat(values.amountInvested);
    const returned = parseFloat(values.amountReturned);
    const years = parseFloat(values.years) || 0;

    if (isNaN(invested) || isNaN(returned) || invested <= 0) {
      return [];
    }

    const netProfit = returned - invested;
    const totalRoi = (netProfit / invested) * 100;
    const multiplier = returned / invested;

    // Annualized ROI: (1 + totalROI)^(1/years) - 1 → CAGR formula
    const totalRoiDecimal = returned / invested;
    const annualizedRoi = years > 0
      ? (Math.pow(totalRoiDecimal, 1 / years) - 1) * 100
      : 0;

    const fmt = (n: number) =>
      Math.abs(n).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const results: CalculatorResult[] = [
      {
        id: 'roi',
        label: 'Return on Investment (ROI)',
        value: `${totalRoi >= 0 ? '+' : '-'}${Math.abs(totalRoi).toFixed(2)}%`,
        highlight: true,
        color: totalRoi >= 0 ? 'positive' : 'negative',
        interpretation: years > 0
          ? `That's a total return earned over ${years} year${years === 1 ? '' : 's'} — about ${annualizedRoi >= 0 ? '+' : ''}${annualizedRoi.toFixed(1)}% per year. Compare the annualized figure between investments: a big total return means little until you know how long it took to earn.`
          : `This is your total return on the money invested. To compare it fairly against other opportunities, factor in how long it took — a return over one month is very different from the same return over five years.`,
      },
      {
        id: 'netProfit',
        label: netProfit >= 0 ? 'Net Profit' : 'Net Loss',
        value: `${netProfit >= 0 ? '+' : '-'}$${fmt(netProfit)}`,
        color: netProfit >= 0 ? 'positive' : 'negative',
      },
      {
        id: 'multiplier',
        label: 'Investment Multiplier',
        value: `${multiplier.toFixed(2)}x`,
        color: 'neutral',
      },
    ];

    if (years > 0) {
      results.push({
        id: 'annualizedRoi',
        label: `Annualized ROI (${years}yr)`,
        value: `${annualizedRoi >= 0 ? '+' : '-'}${Math.abs(annualizedRoi).toFixed(2)}%`,
        color: annualizedRoi >= 10 ? 'positive' : annualizedRoi >= 0 ? 'neutral' : 'negative',
      });
      results.push({
        id: 'holdingPeriod',
        label: 'Holding Period',
        value: `${years} ${years === 1 ? 'year' : 'years'}`,
        color: 'neutral',
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ROIPanel, { values, results });
  },
  educational: {
    formula: 'ROI = ((Amount Returned − Amount Invested) / Amount Invested) × 100',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">Return on Investment (ROI)</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">ROI normalizes profit as a percentage of cost for fair comparison</text><g transform="translate(30,65)"><!-- Investment box --><rect x="40" y="0" width="150" height="55" rx="8" fill="var(--svg-fee2e2)" stroke="var(--svg-ef4444)" stroke-width="2"/><text x="115" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-dc2626)">-$10,000</text><text x="115" y="40" text-anchor="middle" font-size="10" fill="var(--svg-991b1b)">Amount Invested</text><!-- Arrow --><text x="210" y="30" text-anchor="middle" font-size="20" font-weight="bold" fill="var(--svg-64748b)">→</text><!-- Return box --><rect x="240" y="0" width="150" height="55" rx="8" fill="var(--svg-dcfce7)" stroke="var(--svg-22c55e)" stroke-width="2"/><text x="315" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-15803d)">+$15,000</text><text x="315" y="40" text-anchor="middle" font-size="10" fill="var(--svg-166534)">Amount Returned</text><!-- Formula breakdown --><rect x="40" y="68" width="350" height="55" rx="10" fill="var(--svg-f1f5f9)"/><text x="215" y="86" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e293b)">ROI = ($15,000 − $10,000) ÷ $10,000 × 100 = +50%</text><text x="80" y="105" text-anchor="middle" font-size="9" fill="var(--svg-22c55e)">Net Profit: $5,000</text><text x="215" y="105" text-anchor="middle" font-size="9" fill="var(--svg-8b5cf6)">Multiplier: 1.50×</text><text x="340" y="105" text-anchor="middle" font-size="9" fill="var(--svg-f59e0b)">Annualized: 8.45%</text></g><!-- Same ROI, different scale --><g transform="translate(40,138)"><rect x="10" y="0" width="370" height="78" rx="10" fill="var(--svg-f1f5f9)"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Same ROI, Any Investment Size</text><rect x="25" y="28" width="110" height="20" rx="4" fill="var(--svg-22c55e)"/><text x="80" y="42" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">$100→$150 = 50% ROI</text><rect x="145" y="28" width="110" height="20" rx="4" fill="var(--svg-3b82f6)"/><text x="200" y="42" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">$10K→$15K = 50% ROI</text><rect x="265" y="28" width="110" height="20" rx="4" fill="var(--svg-8b5cf6)"/><text x="320" y="42" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">$1M→$1.5M = 50% ROI</text><text x="195" y="70" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">ROI percentage normalizes across any size — the universal comparison metric</text></g><!-- ROI grades --><g transform="translate(40,230)"><rect x="10" y="0" width="370" height="97" rx="10" fill="var(--svg-f1f5f9)"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Annualized ROI Benchmarks (Stocks)</text><rect x="25" y="28" width="105" height="22" rx="4" fill="var(--svg-22c55e)"/><text x="77" y="43" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">10%+ Excellent</text><rect x="140" y="28" width="105" height="22" rx="4" fill="var(--svg-3b82f6)"/><text x="192" y="43" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">7-10% Good</text><rect x="255" y="28" width="105" height="22" rx="4" fill="var(--svg-f59e0b)"/><text x="307" y="43" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-ffffff)">4-7% Moderate</text><text x="65" y="66" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">S&P 500 historical: ~10%</text><text x="195" y="66" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Bonds: 2-5%</text><text x="320" y="66" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Real estate: 8-12%</text><text x="195" y="90" text-anchor="middle" font-size="8" fill="var(--svg-94a3b8)">CAGR is the honest metric — arithmetic averages overstate returns when volatile</text></g></svg>',
      alt: 'ROI diagram showing -$10,000 invested arrow becoming +$15,000 returned, with formula calculation (50% ROI, 1.50x multiplier, 8.45% annualized) and ROI benchmark table',
      caption: 'ROI normalizes profit as a percentage of cost, letting you compare a $100 investment against a $1M investment on equal footing',
    },
    formulaDescription:
      'The ROI formula expresses the net gain or loss as a percentage of the original investment, allowing direct comparison across investments of any size. A $50 profit on a $100 investment shows 50% ROI, just as a $50,000 profit on a $100,000 investment shows 50% ROI. This percentage normalization is what makes ROI the universal language of investment evaluation.',
    variables: [
      {
        symbol: 'ROI',
        name: 'Return on Investment',
        description:
          'The percentage gain or loss on an investment relative to its cost. A positive value indicates profit; a negative value indicates a loss. ROI is the most widely used profitability metric in finance.',
      },
      {
        symbol: 'AR',
        name: 'Amount Returned',
        description:
          'The total value received from the investment. This includes the return of your original principal plus any gains (or minus any losses). Enter the total you got back, not just the profit.',
      },
      {
        symbol: 'AI',
        name: 'Amount Invested',
        description:
          'The initial capital deployed into the investment. This is your cost basis — the starting point for all ROI calculations. Include all costs associated with the investment, not just the purchase price.',
      },
      {
        symbol: 'CAGR',
        name: 'Compound Annual Growth Rate',
        description:
          'Also known as annualized ROI, CAGR normalizes multi-year returns to a single year. If $10,000 grows to $16,105 over 5 years, the CAGR is 10% — meaning the investment grew at the equivalent of 10% each year, compounded. CAGR is the most honest metric for comparing investments with different holding periods.',
      },
      {
        symbol: 't',
        name: 'Holding Period (Years)',
        description:
          'The length of time the investment was held, measured in years. Enter fractional values for partial years (e.g., 1.5 for 18 months, 0.25 for 3 months). Annualized ROI is especially sensitive to the holding period — small differences in t can produce large differences in annualized returns for short-term investments.',
      },
    ],
    howToUse: [
      'Enter the total amount of money you initially put into the investment in the "Amount Invested" field.',
      'Enter the total amount you received back from that investment in the "Amount Returned" field. This is the final value, not just the profit.',
      'Optionally enter the holding period in years to see the annualized ROI — the true per-year return accounting for the time your money was invested.',
      'The calculator instantly outputs your ROI percentage, net profit or loss in dollars, and your investment multiplier.',
      'Compare investments of different sizes and types using ROI percentage. Use annualized ROI when the holding periods differ.',
    ],
    commonUses: [
      'Calculate the percentage return on any investment by comparing the total amount returned against the total amount invested.',
      'Compare investments of different sizes and types on an equal footing using standardized ROI and annualized ROI percentages.',
      'Evaluate business, stock, real estate, or marketing investments by measuring the profit or loss relative to the capital deployed.',
    ],
    explanation:
      'Return on Investment (ROI) is the most universally used profitability metric in finance and business. It answers one essential question: for every dollar I put in, how many dollars did I get back? ROI strips away the raw dollar amounts and expresses performance as a percentage, which makes it possible to compare a $500 investment in a local business against a $500,000 investment in real estate on an equal footing. A positive ROI means your investment grew in value. A negative ROI means it shrank. Investors, business owners, and marketers all use ROI to prioritize where to allocate capital. While ROI is powerful, it does not account for the time an investment was held — a 50% ROI over 2 years (annualized ~22%) is very different from 50% over 10 years (annualized ~4%). For that reason, enter the holding period to see the annualized ROI, which uses the CAGR formula to give you the true per-year return. This makes ROI directly comparable across investments with different time horizons.',
    faqs: [
      {
        question: 'What is a good ROI?',
        answer:
          'A "good" ROI depends entirely on the asset class, risk level, and time horizon. For publicly traded stocks, an average annual ROI of 7–10% is historically considered healthy. For real estate, 8–12% annually is typical. For higher-risk business investments or startups, investors typically expect 20–30%+ to justify the risk. Always compare ROI within the same asset category and on an annualized basis when holding periods differ.',
      },
      {
        question: 'What is the difference between ROI and ROE?',
        answer:
          'ROI (Return on Investment) measures profit relative to the total cost of an investment and can be applied to any asset. ROE (Return on Equity) is a corporate finance metric that measures a company\'s profit relative to shareholders\' equity — it is specific to evaluating a company\'s efficiency at generating profit from its equity base. ROE is one type of ROI but they are not interchangeable.',
      },
      {
        question: 'Can ROI be negative?',
        answer:
          'Yes. A negative ROI means the investment lost money — the amount returned was less than the amount invested. For example, investing $10,000 and receiving $8,000 back yields an ROI of -20%. This is a financial loss of $2,000. Even negative ROIs are useful for analysis — they help you identify what failed and avoid similar investments in the future.',
      },
      {
        question: 'Does ROI account for inflation?',
        answer:
          'Standard ROI does not account for inflation. A 5% ROI in a year with 4% inflation is effectively only a 1% real gain in purchasing power. For inflation-adjusted analysis, calculate your "Real ROI" by subtracting the inflation rate from your nominal ROI. For multi-year investments, subtract the cumulative inflation rate rather than simple subtraction. The annualized ROI shown in this calculator also uses nominal dollars — subtract 2-3% for a real (inflation-adjusted) estimate.',
      },
      {
        question: 'How is ROI used in business decision-making?',
        answer:
          'Businesses use ROI to prioritize capital allocation across competing projects. A company with limited resources will fund the projects with the highest expected ROI first. Marketing departments track ROI on ad campaigns (ROAS -- Return on Ad Spend), real estate investors use ROI to compare properties, and corporate finance teams evaluate mergers and acquisitions using ROI. The key insight is that ROI standardizes profit across projects of vastly different scales — a $10,000 project and a $10 million project can be compared directly using the same percentage metric.',
      },
      {
        question: 'Can I use ROI to compare a stock investment against a real estate investment?',
        answer:
          'Yes, but be thorough about including all costs. For stocks, your amount invested should include brokerage commissions and your amount returned should be net of selling fees. For real estate, the amount invested should include the down payment, closing costs, renovation expenses, and holding costs. The amount returned should be net sale proceeds after agent commissions, transfer taxes, and mortgage payoff. Always annualize both ROIs for a fair comparison — a 40% stock ROI over 2 years (annualized ~18.3%) is very different from a 40% real estate ROI over 10 years (annualized ~3.4%).',
      },
      {
        question: 'What are the limitations of using ROI?',
        answer:
          'ROI has several important limitations. It does not account for the time value of money unless annualized. It ignores risk — two investments with equal ROI may have very different risk profiles. It does not consider the absolute size of the investment (a 20% ROI on $1,000 is $200 profit; a 5% ROI on $100,000 is $5,000 profit). ROI also ignores liquidity, tax implications, and opportunity cost. For these reasons, sophisticated investors use ROI alongside other metrics like the Sharpe ratio for risk-adjusted return, IRR for multi-year cash flow investments, and NPV for time-value-adjusted analysis.',
      },
    ],
    workedExamples: [
      {
        scenario: 'David bought 100 shares of a tech stock at $150/share ($15,000 total). After 3 years, he sold all shares at $225/share ($22,500 total), receiving $200 in dividends along the way.',
        inputs: { amountInvested: '15000', amountReturned: '22700', years: '3' },
        result: 'ROI: +51.33%, Annualized ROI: +14.82%, Multiplier: 1.51x, Net Profit: +$7,700.00',
        insight: 'David\'s $200 in dividends boosted his total return from $22,500 to $22,700 — adding about 1.33% to his absolute ROI. The annualized return of 14.82% exceeds the S&P 500 historical average of ~10%, classifying this as an excellent investment. However, David should consider whether this outperformance compensated for the substantial single-stock risk he took versus a diversified index fund.',
      },
      {
        scenario: 'Priya invested $5,000 in a small business venture. After 2 years, the business failed and she recovered only $2,500 from liquidating inventory.',
        inputs: { amountInvested: '5000', amountReturned: '2500', years: '2' },
        result: 'ROI: -50.00%, Net Loss: -$2,500.00, Multiplier: 0.50x, Annualized ROI: -29.29%',
        insight: 'A -50% total ROI means Priya lost half her investment. The annualized loss of -29.29% per year quantifies the severity. An important mathematical truth: a 50% loss requires a 100% gain just to break even. If Priya had diversified across 10 similar small-business investments instead of concentrating all her capital in one, the odds of total loss would be dramatically lower.',
      },
      {
        scenario: 'Marcus invested $200,000 as a 20% down payment on a rental property, plus $15,000 in closing costs and renovations ($215,000 total invested). After 5 years he sold for $310,000, netting $275,000 after agent fees and mortgage payoff.',
        inputs: { amountInvested: '215000', amountReturned: '275000', years: '5' },
        result: 'ROI: +27.91%, Annualized ROI: +5.05%, Net Profit: +$60,000.00, Multiplier: 1.28x',
        insight: 'While the 27.91% total ROI seems modest compared to stock market returns, the annualized 5.05% does not tell the full story. Marcus also benefited from rental income during the 5 years (not included in this calculation), mortgage principal paydown by tenants, and significant tax advantages like depreciation deductions. Real estate ROI calculations should always include rental cash flow alongside the sale proceeds.',
      },
    ],
    proTips: [
      'Always annualize ROI when comparing investments with different holding periods. A 30% ROI over 1 year (30% annualized) is far superior to a 50% ROI over 10 years (~4.1% annualized).',
      'Include ALL costs in "Amount Invested" — not just the purchase price but also transaction fees, closing costs, renovation expenses, and carrying costs. An incomplete cost basis inflates your ROI and leads to poor investment decisions.',
      'When evaluating business or side-hustle ROI, include the value of your time as part of the investment. A $10,000 profit on a project that consumed 1,000 hours of your labor is effectively $10/hour — you may have been better off with a part-time job.',
      'Use the Rule of 72 to quickly estimate annualized ROI: 72 divided by the annual return rate equals the approximate years to double your money. If a stock doubled in 7 years, the annualized ROI is approximately 72/7 = 10.3%. Similarly, 72 divided by the years to double equals the annualized rate.',
    ],
    limitations: [
      'ROI does not account for risk. Two investments with identical ROI may carry dramatically different risk levels — a 50% ROI on a speculative cryptocurrency is not equivalent to a 50% ROI on a diversified index fund.',
      'Standard ROI ignores the time value of money and cash flow timing. For investments with multiple cash flows over time, use IRR (Internal Rate of Return) or NPV (Net Present Value) instead, which properly discount future cash flows.',
      'ROI is backward-looking and does not predict future performance. Past returns, especially when measured over short periods, are a poor predictor of future results. The S&P 500 returned 31.5% in 2019 but -18.1% in 2022 — neither year alone is indicative of the long-term average.',
      'For leveraged investments (mortgages, margin trading), standard ROI can be misleading. A 10% ROI on a property purchased with 20% down is effectively a 50% return on your actual cash invested. Use Cash-on-Cash Return for leveraged real estate.',
    ],
  citations: [
    { source: 'US Securities and Exchange Commission', url: 'https://www.investor.gov' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/r/returnoninvestment.asp' },
  ],
  },
};

export default roiConfig;
