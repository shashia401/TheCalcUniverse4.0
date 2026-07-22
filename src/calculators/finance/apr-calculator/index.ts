import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import APRPanel from './APRPanel';

function calcAPR(netProceeds: number, monthlyPayment: number, n: number): number {
  if (netProceeds <= 0 || monthlyPayment <= 0 || n <= 0) return 0;
  let r = 0.005; // initial guess: 0.5% monthly
  for (let i = 0; i < 1000; i++) {
    const pow = Math.pow(1 + r, n);
    const f = netProceeds - monthlyPayment * (pow - 1) / (r * pow);
    // Use numerical derivative
    const h = 0.000001;
    const f2 = netProceeds - monthlyPayment * (Math.pow(1 + r + h, n) - 1) / ((r + h) * Math.pow(1 + r + h, n));
    const df = (f2 - f) / h;
    if (Math.abs(df) < 1e-10) break;
    const rNew = r - f / df;
    if (Math.abs(rNew - r) < 1e-10) { r = rNew; break; }
    r = rNew;
    if (r <= 0) r = 0.0001;
  }
  return r * 12; // annualize
}

const aprSvg = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto">
  <rect width="320" height="200" fill="var(--svg-f8fafc)" rx="6"/>
  <text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)" font-family="system-ui,sans-serif">APR: The True Cost of Borrowing</text>
  <rect x="25" y="35" width="110" height="40" rx="6" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/>
  <text x="80" y="52" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e40af)" font-family="system-ui,sans-serif">Loan Amount</text>
  <text x="80" y="67" text-anchor="middle" font-size="9" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">$200,000</text>
  <line x1="80" y1="75" x2="80" y2="98" stroke="var(--svg-94a3b8)" stroke-width="1.5"/>
  <polygon points="75,93 80,101 85,93" fill="var(--svg-94a3b8)"/>
  <rect x="170" y="78" width="100" height="30" rx="6" fill="var(--svg-fee2e2)" stroke="var(--svg-ef4444)" stroke-width="1.5"/>
  <text x="220" y="97" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-dc2626)" font-family="system-ui,sans-serif">- $4,000 Fees</text>
  <rect x="25" y="110" width="110" height="40" rx="6" fill="var(--svg-dcfce7)" stroke="var(--svg-10b981)" stroke-width="1.5"/>
  <text x="80" y="127" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-15803d)" font-family="system-ui,sans-serif">Net Proceeds</text>
  <text x="80" y="142" text-anchor="middle" font-size="9" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">$196,000</text>
  <rect x="185" y="118" width="120" height="32" rx="6" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="1.5"/>
  <text x="245" y="135" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-b45309)" font-family="system-ui,sans-serif">APR = 6.72%</text>
  <text x="245" y="146" text-anchor="middle" font-size="8" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">vs 6.50% nominal</text>
  <line x1="135" y1="130" x2="183" y2="130" stroke="var(--svg-f59e0b)" stroke-width="1.5"/>
  <text x="160" y="178" text-anchor="middle" font-size="9" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">APR = interest rate applied to net cash</text>
  <text x="160" y="192" text-anchor="middle" font-size="9" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">received. Always compare APR, not the rate.</text>
</svg>`;

const aprCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'loanAmount',
      label: 'Loan Amount',
      type: 'number',
      prefix: '$',
      placeholder: '200,000',
      required: true,
      helpText: 'Total amount you are borrowing before any fees are deducted.',
    },
    {
      id: 'nominalRate',
      label: 'Nominal Interest Rate',
      type: 'number',
      unit: '%',
      placeholder: '6.5',
      min: 0,
      max: 50,
      step: 0.01,
      required: true,
      helpText: 'The interest rate as quoted by the lender — does not include fees.',
    },
    {
      id: 'loanTermValue',
      label: 'Loan Term',
      type: 'number',
      placeholder: '30',
      required: true,
      helpText: 'Length of the loan — enter the numeric value, then select years or months below.',
    },
    {
      id: 'loanTermUnit',
      label: 'Term Unit',
      type: 'select',
      options: [
        { label: 'Years', value: 'years' },
        { label: 'Months', value: 'months' },
      ],
      helpText: 'Choose whether the loan term above is in years or months.',
    },
    {
      id: 'upfrontFees',
      label: 'Upfront Fees / Closing Costs',
      type: 'number',
      prefix: '$',
      placeholder: '4,000',
      helpText:
        'Include: origination fees, discount points, broker fees, admin fees. Do NOT include prepaid items (escrow, insurance, taxes) which are not part of APR.',
    },
  ],

  calculate: (values) => {
    const loanAmount = parseFloat(values.loanAmount);
    const nominalRate = parseFloat(values.nominalRate);
    const loanTermValue = parseFloat(values.loanTermValue);
    const loanTermUnit = values.loanTermUnit || 'years';
    const upfrontFees = parseFloat(values.upfrontFees) || 0;

    if (isNaN(loanAmount) || loanAmount <= 0) return [];
    if (isNaN(nominalRate) || nominalRate < 0) return [];
    if (isNaN(loanTermValue) || loanTermValue <= 0) return [];

    const termMonths = loanTermUnit === 'years' ? loanTermValue * 12 : loanTermValue;
    const monthlyNominalRate = nominalRate / 100 / 12;

    let monthlyPayment: number;
    if (monthlyNominalRate === 0) {
      monthlyPayment = loanAmount / termMonths;
    } else {
      monthlyPayment =
        (loanAmount * monthlyNominalRate) /
        (1 - Math.pow(1 + monthlyNominalRate, -termMonths));
    }

    const netCashReceived = loanAmount - upfrontFees;
    const totalPaid = monthlyPayment * termMonths;
    const totalNominalInterest = totalPaid - loanAmount;
    const totalCostWithFees = totalPaid + upfrontFees;

    let aprAnnual: number;
    if (upfrontFees === 0) {
      aprAnnual = nominalRate;
    } else {
      aprAnnual = calcAPR(netCashReceived, monthlyPayment, termMonths) * 100;
    }

    const aprDifference = aprAnnual - nominalRate;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const aprColor =
      aprDifference > 1 ? 'negative' : aprDifference > 0.25 ? 'neutral' : 'positive';

    return [
      {
        id: 'aprResult',
        label: 'True APR (Annual Percentage Rate)',
        value: `${aprAnnual.toFixed(3)}%`,
        highlight: true,
        color: aprColor as 'positive' | 'neutral' | 'negative',
      },
      {
        id: 'nominalRateResult',
        label: 'Nominal Interest Rate (as quoted)',
        value: `${nominalRate.toFixed(3)}%`,
      },
      {
        id: 'aprDifferenceResult',
        label: 'APR is Higher Than Rate By',
        value: `${aprDifference.toFixed(3)} percentage points`,
        color: (aprDifference > 0 ? 'negative' : 'neutral') as 'negative' | 'neutral',
      },
      {
        id: 'monthlyPaymentResult',
        label: 'Monthly Payment',
        value: `$${fmt(monthlyPayment)}`,
      },
      {
        id: 'netCashReceivedResult',
        label: 'Net Cash Received (After Fees)',
        value: `$${fmt(netCashReceived)}`,
        color: (upfrontFees > 0 ? 'negative' : 'neutral') as 'negative' | 'neutral',
      },
      {
        id: 'totalNominalInterest',
        label: 'Total Interest Paid',
        value: `$${fmt(totalNominalInterest)}`,
      },
      {
        id: 'totalCostWithFees',
        label: 'Total Cost of Loan (Interest + Fees)',
        value: `$${fmt(totalCostWithFees)}`,
      },
      {
        id: 'upfrontFeesResult',
        label: 'Total Upfront Fees',
        value: upfrontFees > 0 ? `$${fmt(upfrontFees)}` : 'None',
      },
      {
        id: '_aprData',
        label: '_aprData',
        value: JSON.stringify({
          loanAmount,
          nominalRate,
          upfrontFees,
          netCashReceived,
          monthlyPayment,
          totalNominalInterest,
          totalCostWithFees,
          aprAnnual,
          aprDifference,
          termMonths,
        }),
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(APRPanel, { values, results });
  },

  educational: {
    formula: 'APR = Annual rate r such that: Net Proceeds = Payment × [1 − (1+r/12)^−n] / (r/12)',
    formulaDescription:
      'The APR is the interest rate that, applied to the actual cash you receive (loan amount minus fees), produces the same monthly payment as your loan. It is always equal to or higher than the nominal rate. The higher the fees, the higher the gap. APR is the single best number for comparing loan offers because it captures both the interest rate and the fee cost in one percentage figure.',
    diagram: {
      svg: aprSvg,
      alt: 'Flow diagram showing loan amount minus upfront fees equals net proceeds, with APR compared to nominal rate',
      caption: 'APR captures both the interest rate and all upfront fees in a single percentage — always higher than the nominal rate when fees exist',
    },
    variables: [
      {
        symbol: 'Nominal Rate',
        name: 'Interest Rate',
        description:
          'The rate used to calculate your monthly payment, applied to the full loan amount. This is the "headline" rate lenders advertise, but it excludes fees.',
      },
      {
        symbol: 'APR',
        name: 'Annual Percentage Rate',
        description:
          'The true cost of borrowing. Computed on the net proceeds you actually receive. Legally required under the Truth in Lending Act (TILA) to be disclosed on mortgage and most consumer loans. APR is always >= the nominal rate.',
      },
      {
        symbol: 'Net Proceeds',
        name: 'Cash Received',
        description:
          'Loan Amount minus upfront fees. This is the actual cash you receive — and the basis for computing APR. The less cash you actually receive relative to the loan amount, the higher the APR.',
      },
    ],
    howToUse: [
      'Enter the total loan amount you are borrowing.',
      'Input the nominal interest rate quoted by the lender (the advertised rate).',
      'Specify the loan term — choose years or months. Longer terms spread fees over more payments, which reduces the APR impact.',
      'Enter the upfront fees and closing costs. Be thorough — include origination fees, discount points, and broker fees.',
      'Compare the computed APR against the nominal rate to understand your true borrowing cost. Use APR to compare loan offers from different lenders on an apples-to-apples basis.',
    ],
    commonUses: [
      'Compare mortgage offers from different lenders by calculating the true annual percentage rate including all fees and points.',
      'Understand the real cost of borrowing when a low advertised interest rate is paired with high origination fees or closing costs.',
      'Evaluate auto loan and personal loan offers to determine whether a lower rate with higher fees is better than a higher rate with no fees.',
    ],
    explanation:
      'APR is mandated by the Truth in Lending Act (TILA) to give consumers a single number that captures the total cost of borrowing. It converts the interest rate and all upfront fees into one annualized percentage. This is critical because lenders can manipulate the headline rate by charging higher fees. A loan advertised at 5.0% with $10,000 in fees may actually be more expensive than a 5.5% loan with zero fees. The APR calculation solves for the interest rate that, when applied to the actual cash you receive (loan minus fees), produces the same monthly payment. This is an iterative numerical computation — the calculator uses a Newton-Raphson solver to find the rate. When comparing mortgage offers, always compare APR, not the nominal rate. The only caveat: if you plan to sell or refinance early, factor in how long you will hold the loan, because upfront fees are amortized over the loan term in the APR calculation.',
    faqs: [
      {
        question: 'Why does my APR matter more than my interest rate?',
        answer:
          'A lender can offer you a 5.0% rate with $10,000 in fees, or a 5.5% rate with $0 fees. The 5.5% rate will have a lower APR on short loan terms — meaning it is actually cheaper. The interest rate only tells you the cost of the principal. APR tells you the cost of the entire transaction including fees. When shopping for a mortgage, compare APRs across lenders to see the true cost.',
      },
      {
        question: 'What fees are included in APR?',
        answer:
          'APR must include origination fees, discount points, mortgage broker fees, and certain closing fees directly associated with the loan. It does NOT include prepaid interest, property taxes, homeowner insurance, or title insurance — these are excluded by regulation (RESPA/TILA). Always ask your lender for the APR, not just the rate. The APR disclosure is legally required in the Loan Estimate document you receive within 3 days of applying for a mortgage.',
      },
      {
        question: 'Should I choose the lowest APR loan?',
        answer:
          'Generally yes — but with one exception. If you plan to sell or refinance in under 5 years, a loan with a lower rate and higher fees may actually cost you more if you exit early before "earning back" the fee savings through lower interest. In that scenario, a no-fee, slightly higher rate may cost less overall. Always consider your expected holding period when evaluating APR. A break-even analysis of closing costs vs. monthly savings is the best way to decide.',
      },
    ],
  citations: [
    { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
    { source: 'Investopedia', url: 'https://www.investopedia.com/terms/a/apr.asp' },
  ],
  },
};

export default aprCalculatorConfig;
