import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import IRRPanel from './IRRPanel';

function computeNPV(rate: number, cashFlows: number[]): number {
  let npv = 0;
  for (let t = 0; t < cashFlows.length; t++) {
    npv += cashFlows[t] / Math.pow(1 + rate, t);
  }
  return npv;
}

function calculateIRR(cashFlows: number[]): number | null {
  // Newton's method
  let rate = 0.1;
  const maxIterations = 1000;
  const tolerance = 1e-7;
  let prevRate = NaN;
  let oscillationCount = 0;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      if (t > 0) dnpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
    }

    if (!isFinite(npv) || !isFinite(dnpv)) break;

    if (Math.abs(dnpv) < 1e-12) {
      rate = rate * 1.01 + 0.01;
      continue;
    }

    const newRate = rate - npv / dnpv;

    if (isFinite(prevRate)) {
      const diff = Math.abs(newRate - prevRate);
      if (diff < tolerance * 0.1) {
        oscillationCount++;
        if (oscillationCount > 50) return (newRate + prevRate) / 2;
      } else {
        oscillationCount = 0;
      }
    }

    if (!isFinite(newRate)) break;
    if (Math.abs(newRate - rate) < tolerance) return newRate;

    prevRate = rate;
    rate = newRate;
  }

  // Bisection fallback when Newton fails
  if (computeNPV(-0.999, cashFlows) > 0 && computeNPV(1.0, cashFlows) < 0) {
    let lo = -0.999, hi = 1.0;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      const npvMid = computeNPV(mid, cashFlows);
      if (Math.abs(npvMid) < tolerance) return mid;
      if (npvMid > 0) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  return null;
}

const irrSvg = '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="4"/><text x="160" y="14" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">IRR &amp; NPV: Cash Flow Timeline</text><line x1="20" y1="50" x2="300" y2="50" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/><text x="35" y="40" text-anchor="middle" font-size="7" fill="var(--svg-94a3b8)">Yr0</text><circle cx="35" cy="50" r="3" fill="var(--svg-cbd5e1)"/><text x="85" y="40" text-anchor="middle" font-size="7" fill="var(--svg-94a3b8)">Yr1</text><circle cx="85" cy="50" r="3" fill="var(--svg-cbd5e1)"/><text x="135" y="40" text-anchor="middle" font-size="7" fill="var(--svg-94a3b8)">Yr2</text><circle cx="135" cy="50" r="3" fill="var(--svg-cbd5e1)"/><text x="185" y="40" text-anchor="middle" font-size="7" fill="var(--svg-94a3b8)">Yr3</text><circle cx="185" cy="50" r="3" fill="var(--svg-cbd5e1)"/><text x="235" y="40" text-anchor="middle" font-size="7" fill="var(--svg-94a3b8)">Yr4</text><circle cx="235" cy="50" r="3" fill="var(--svg-cbd5e1)"/><text x="285" y="40" text-anchor="middle" font-size="7" fill="var(--svg-94a3b8)">Yr5</text><circle cx="285" cy="50" r="3" fill="var(--svg-cbd5e1)"/><line x1="35" y1="50" x2="35" y2="80" stroke="var(--svg-ef4444)" stroke-width="2.5" stroke-linecap="round"/><polygon points="35,85 29,77 41,77" fill="var(--svg-ef4444)"/><rect x="10" y="88" width="50" height="28" rx="4" fill="var(--svg-fee2e2)" stroke="var(--svg-ef4444)" stroke-width="1"/><text x="35" y="102" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-dc2626)">-$100K</text><text x="35" y="114" text-anchor="middle" font-size="6" fill="var(--svg-64748b)">Investment</text><line x1="85" y1="50" x2="85" y2="28" stroke="var(--svg-22c55e)" stroke-width="2" stroke-linecap="round"/><polygon points="85,24 80,32 90,32" fill="var(--svg-22c55e)"/><text x="85" y="21" text-anchor="middle" font-size="7" fill="var(--svg-16a34a)" font-weight="bold">$25K</text><line x1="135" y1="50" x2="135" y2="22" stroke="var(--svg-22c55e)" stroke-width="2" stroke-linecap="round"/><polygon points="135,18 130,26 140,26" fill="var(--svg-22c55e)"/><text x="135" y="15" text-anchor="middle" font-size="7" fill="var(--svg-16a34a)" font-weight="bold">$30K</text><line x1="185" y1="50" x2="185" y2="15" stroke="var(--svg-22c55e)" stroke-width="2" stroke-linecap="round"/><polygon points="185,11 180,19 190,19" fill="var(--svg-22c55e)"/><text x="185" y="8" text-anchor="middle" font-size="7" fill="var(--svg-16a34a)" font-weight="bold">$35K</text><line x1="235" y1="50" x2="235" y2="20" stroke="var(--svg-22c55e)" stroke-width="2" stroke-linecap="round"/><polygon points="235,16 230,24 240,24" fill="var(--svg-22c55e)"/><text x="235" y="13" text-anchor="middle" font-size="7" fill="var(--svg-16a34a)" font-weight="bold">$40K</text><line x1="285" y1="50" x2="285" y2="12" stroke="var(--svg-22c55e)" stroke-width="2" stroke-linecap="round"/><polygon points="285,8 280,16 290,16" fill="var(--svg-22c55e)"/><text x="285" y="5" text-anchor="middle" font-size="7" fill="var(--svg-16a34a)" font-weight="bold">$45K</text><rect x="50" y="124" width="220" height="26" rx="6" fill="var(--svg-f3e8ff)" stroke="var(--svg-8b5cf6)" stroke-width="1"/><text x="160" y="138" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-7c3aed)">NPV = $Sigma CFt / (1+IRR)^t = 0</text><text x="160" y="149" text-anchor="middle" font-size="6" fill="var(--svg-64748b)">IRR solves for the breakeven discount rate</text><rect x="15" y="158" width="290" height="22" rx="6" fill="var(--svg-f1f5f9)"/><text x="160" y="172" text-anchor="middle" font-size="7" font-weight="bold" fill="var(--svg-1e293b)">Decision Rule</text><text x="70" y="178" text-anchor="middle" font-size="6" fill="var(--svg-22c55e)">IRR &gt; Cost of Capital = Accept</text><text x="232" y="178" text-anchor="middle" font-size="6" fill="var(--svg-ef4444)">IRR &lt; Cost of Capital = Reject</text></svg>';

const irrCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'initialInvestment',
      label: 'Initial Investment (Year 0)',
      type: 'number',
      placeholder: '100,000',
      prefix: '$',
      min: 0,
      step: 1,
      required: true,
      helpText:
        'This is the cash you invest upfront. It will be treated as a negative cash flow (outflow).',
    },
    {
      id: 'discountRate',
      label: 'Discount Rate / Cost of Capital (for NPV)',
      type: 'number',
      placeholder: '10',
      unit: '%',
      min: 0,
      step: 0.1,
      helpText:
        'Used to calculate Net Present Value. If left blank, only IRR is calculated. Typically your required rate of return or WACC.',
    },
    {
      id: 'year1',
      label: 'Year 1 Cash Flow',
      type: 'number',
      placeholder: '25,000',
      prefix: '$',
      step: 1,
      helpText:
        'Net cash flow in Year 1. Can be positive (income) or negative (additional investment).',
    },
    {
      id: 'year2',
      label: 'Year 2 Cash Flow',
      type: 'number',
      placeholder: '30,000',
      prefix: '$',
      step: 1,
    },
    {
      id: 'year3',
      label: 'Year 3 Cash Flow',
      type: 'number',
      placeholder: '35,000',
      prefix: '$',
      step: 1,
    },
    {
      id: 'year4',
      label: 'Year 4 Cash Flow (optional)',
      type: 'number',
      placeholder: '40,000',
      prefix: '$',
      step: 1,
      showWhen: (v) => v.year1 !== '' && v.year2 !== '' && v.year3 !== '',
    },
    {
      id: 'year5',
      label: 'Year 5 Cash Flow (optional)',
      type: 'number',
      placeholder: '45,000',
      prefix: '$',
      step: 1,
      showWhen: (v) => v.year4 !== '',
    },
    {
      id: 'year6',
      label: 'Year 6 Cash Flow (optional)',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      step: 1,
      showWhen: (v) => v.year5 !== '',
    },
    {
      id: 'year7',
      label: 'Year 7 Cash Flow (optional)',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      step: 1,
      showWhen: (v) => v.year6 !== '',
    },
    {
      id: 'year8',
      label: 'Year 8 Cash Flow (optional)',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      step: 1,
      showWhen: (v) => v.year7 !== '',
    },
    {
      id: 'year9',
      label: 'Year 9 Cash Flow (optional)',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      step: 1,
      showWhen: (v) => v.year8 !== '',
    },
    {
      id: 'year10',
      label: 'Year 10 Cash Flow (optional)',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      step: 1,
      showWhen: (v) => v.year9 !== '',
    },
  ],

  calculate: (values) => {
    const initialInvestment = parseFloat(values.initialInvestment);
    if (isNaN(initialInvestment) || initialInvestment <= 0) return [];

    const yearKeys = ['year1', 'year2', 'year3', 'year4', 'year5', 'year6', 'year7', 'year8', 'year9', 'year10'];

    // Build raw year values — only include up to last non-empty entry
    const rawYears: number[] = [];
    let lastFilledIndex = -1;
    for (let i = 0; i < yearKeys.length; i++) {
      const raw = values[yearKeys[i]];
      if (raw !== undefined && raw !== '') {
        lastFilledIndex = i;
      }
    }

    for (let i = 0; i <= lastFilledIndex; i++) {
      const raw = values[yearKeys[i]];
      rawYears.push(raw !== undefined && raw !== '' ? parseFloat(raw) || 0 : 0);
    }

    if (rawYears.length === 0) return [];

    // cashFlows[0] = -initialInvestment (outflow), cashFlows[1..n] = year values
    const cashFlows: number[] = [-initialInvestment, ...rawYears];

    // Check for at least one sign change (required for IRR to make sense)
    let hasPositive = false;
    let hasNegative = false;
    for (const cf of cashFlows) {
      if (cf > 0) hasPositive = true;
      if (cf < 0) hasNegative = true;
    }

    const discountRateStr = values.discountRate;
    const discountRate = discountRateStr !== undefined && discountRateStr !== ''
      ? parseFloat(discountRateStr)
      : NaN;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtInt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    let irr: number | null = null;
    let irrValid = false;
    if (hasPositive && hasNegative) {
      const result = calculateIRR(cashFlows);
      if (result !== null && isFinite(result)) {
        irr = result;
        irrValid = true;
      }
    }

    // NPV calculation
    let npv: number = NaN;
    let presentValues: Array<{ year: number; cashFlow: number; discountFactor: number; presentValue: number }> = [];
    if (!isNaN(discountRate) && discountRate >= 0) {
      const dr = discountRate / 100;
      npv = 0;
      presentValues = cashFlows.map((cf, t) => {
        const discountFactor = 1 / Math.pow(1 + dr, t);
        const presentValue = cf * discountFactor;
        npv += presentValue;
        return { year: t, cashFlow: cf, discountFactor, presentValue };
      });
    }

    // Total cash inflows = sum of positive flows from year 1 onward
    const totalCashInflows = cashFlows.slice(1).reduce((sum, cf) => sum + (cf > 0 ? cf : 0), 0);
    const totalReturn = totalCashInflows - initialInvestment;

    // Payback period: how many years until cumulative cash flow (including -initialInvestment) turns positive
    let paybackPeriod: number = NaN;
    let cumulative = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      cumulative += cashFlows[t];
      if (cumulative >= 0) {
        // Interpolate
        if (t === 0) {
          paybackPeriod = 0;
        } else {
          const prevCumulative = cumulative - cashFlows[t];
          paybackPeriod = t - 1 + (-prevCumulative) / cashFlows[t];
        }
        break;
      }
    }

    const results = [];

    // IRR result
    if (irrValid && irr !== null) {
      results.push({
        id: 'irrResult',
        label: 'Internal Rate of Return (IRR)',
        value: `${(irr * 100).toFixed(2)}%`,
        highlight: true,
        color: (irr > 0.15 ? 'positive' : irr > 0 ? 'neutral' : 'negative') as 'positive' | 'neutral' | 'negative',
        interpretation: `IRR is the discount rate at which this project's cash flows break even — compare it to your required return or cost of capital, not to zero. A high IRR on a tiny investment can matter less than a modest IRR on a large one, so weigh it alongside the payback period and total cash generated, not alone.`,
      });
    } else {
      results.push({
        id: 'irrResult',
        label: 'Internal Rate of Return (IRR)',
        value: 'Cannot calculate \u2014 check cash flows',
        highlight: true,
        color: 'negative' as const,
      });
    }

    // NPV result (only if discount rate provided and valid)
    if (!isNaN(discountRate) && !isNaN(npv)) {
      results.push({
        id: 'npvResult',
        label: 'Net Present Value (NPV)',
        value: `${npv >= 0 ? '' : '-'}$${fmt(Math.abs(npv))}`,
        color: (npv >= 0 ? 'positive' : 'negative') as 'positive' | 'negative',
      });
    }

    results.push({
      id: 'totalCashInflows',
      label: 'Total Cash Inflows (Years 1+)',
      value: `$${fmtInt(totalCashInflows)}`,
      color: 'neutral' as const,
    });

    results.push({
      id: 'totalReturn',
      label: 'Net Return (Inflows minus Investment)',
      value: `${totalReturn >= 0 ? '' : '-'}$${fmtInt(Math.abs(totalReturn))}`,
      color: (totalReturn >= 0 ? 'positive' : 'negative') as 'positive' | 'negative',
    });

    if (!isNaN(paybackPeriod)) {
      results.push({
        id: 'paybackPeriodResult',
        label: 'Payback Period',
        value: `${paybackPeriod.toFixed(1)} years`,
        color: 'neutral' as const,
      });
    }

    results.push({
      id: '_irrData',
      label: '_irrData',
      value: JSON.stringify({
        cashFlows,
        irr: irrValid ? irr : null,
        npv: !isNaN(npv) ? npv : null,
        discountRate: !isNaN(discountRate) ? discountRate : null,
        presentValues,
        paybackPeriod: !isNaN(paybackPeriod) ? paybackPeriod : null,
        totalCashInflows,
        totalReturn,
      }),
    });

    return results;
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(IRRPanel, { values, results });
  },

  educational: {
    formula: 'NPV = \u03a3 CFt / (1+r)^t = 0 (solve for r)',
    diagram: {
      svg: irrSvg,
      alt: 'Cash flow timeline diagram showing Year 0 investment of -alt: 00K as a downward red arrow and Years 1-5 positive inflows as upward green arrows of increasing size',
      caption: 'IRR is the discount rate that makes the net present value of all cash flows equal to zero - the breakeven return rate that determines whether an investment creates value',
    },
    formulaDescription:
      'IRR is the discount rate that makes the Net Present Value (NPV) of all cash flows equal to zero. It represents the annualized rate of return you earn on your investment, accounting for the timing of each cash flow. The calculator uses the Newton-Raphson method \u2014 the same numerical iteration technique used in professional financial calculators and spreadsheet software \u2014 to solve for the rate when a closed-form algebraic solution is not possible.',
    variables: [
      {
        symbol: 'IRR',
        name: 'Internal Rate of Return',
        description:
          'The annualized return rate. Compare to your cost of capital (WACC). If IRR > WACC, the investment creates value. If IRR < WACC, the investment destroys value.',
      },
      {
        symbol: 'NPV',
        name: 'Net Present Value',
        description:
          "The total value of the investment in today's dollars. Positive NPV means the investment exceeds your required return rate. NPV is considered the more theoretically sound metric by finance academics.",
      },
      {
        symbol: 'r',
        name: 'Discount Rate',
        description:
          'Your required rate of return (or WACC). NPV > 0 when IRR > discount rate. The discount rate represents your opportunity cost \u2014 the return you could earn on a comparable investment.',
      },
    ],
    howToUse: [
      'Enter your initial investment (Year 0 cash outflow) \u2014 treated as a negative cash flow.',
      'Add expected cash inflows for each future year up to 10 periods. You can skip later years by leaving them blank.',
      'Optionally enter a discount rate or cost of capital to calculate NPV alongside IRR.',
      'Compare the computed IRR against your required rate of return or WACC to determine if the investment creates value.',
      'A positive NPV and IRR above your cost of capital indicates a value-creating investment. If they disagree, trust NPV.',
    ],
    commonUses: [
      'Evaluate a potential investment by calculating the annualized return rate that makes all future cash flows equal to the initial outlay.',
      'Compare multiple investment opportunities with different cash flow patterns and time horizons using a single standardized return metric.',
      'Determine whether a project or acquisition creates value by comparing its IRR against your cost of capital or hurdle rate.',
    ],
    explanation:
      'The Internal Rate of Return (IRR) is one of the most widely used metrics in corporate finance, private equity, and real estate investment analysis. It represents the annualized effective compounded return rate that makes the net present value of all cash flows from a particular investment equal to zero. Unlike simple return metrics (ROI), IRR accounts for the time value of money by weighting earlier cash flows more heavily than later ones. This makes it particularly useful for comparing investments with different time horizons and cash flow patterns. The calculator uses the Newton-Raphson iterative method to solve for the rate since no closed-form solution exists for polynomials of degree 5 or higher. When evaluating investments, the general rule is: accept projects where IRR exceeds the cost of capital, and reject those where it falls below. However, IRR has limitations — it assumes interim cash flows are reinvested at the same rate, and multiple IRRs can exist when cash flows change direction more than once. In these cases, NPV analysis is considered more theoretically sound.',
    faqs: [
      {
        question: 'What is a good IRR?',
        answer:
          'A "good" IRR depends on your cost of capital and risk tolerance. As a general rule: IRR > 15% is strong for most business investments; IRR > 20% is a high-return target common in private equity; IRR > WACC (Weighted Average Cost of Capital) means the investment is creating value. For real estate, 8\u201312% IRR is typically considered good. For venture capital, target IRRs of 25\u201330%+ are common due to the high failure rate of individual investments.',
      },
      {
        question: 'What is the difference between IRR and ROI?',
        answer:
          'ROI measures total return as a percentage of investment without accounting for time. IRR accounts for the timing of cash flows \u2014 a dollar received in Year 1 is worth more than a dollar received in Year 5. IRR is a more accurate measure for multi-year investments. For example, an investment that doubles your money in 2 years has an IRR of ~41%, while the same return in 10 years has an IRR of ~7% \u2014 but both have an ROI of 100%.',
      },
      {
        question: 'When can IRR be misleading?',
        answer:
          'IRR assumes interim cash flows are reinvested at the same IRR rate, which may not be realistic. For projects with multiple sign changes in cash flows (e.g., years with negative cash flows after positive ones), multiple IRRs may exist. In these cases, Modified IRR (MIRR) or NPV analysis is preferred. Also, IRR can be misleading for comparing mutually exclusive projects of different sizes \u2014 a small project with high IRR may create less total value than a large project with moderate IRR.',
      },
    ],
    citations: [
      { source: 'US Securities and Exchange Commission', url: 'https://www.investor.gov' },
      { source: 'Investopedia', url: 'https://www.investopedia.com/terms/i/irr.asp' },
    ],
  },
};

export default irrCalculatorConfig;
