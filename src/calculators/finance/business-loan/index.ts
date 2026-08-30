import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import BusinessLoanPanel from './BusinessLoanPanel';

function getDSCRInterpretation(dscr: number): { label: string; color: 'positive' | 'negative' | 'neutral' } {
  if (dscr >= 1.5) return { label: 'Strong — Most lenders will approve', color: 'positive' };
  if (dscr >= 1.25) return { label: 'Good — Likely to be approved by most lenders', color: 'positive' };
  if (dscr >= 1.0) return { label: 'Marginal — May face stricter terms or higher rate', color: 'neutral' };
  return { label: 'Insufficient — Loan payments exceed income. High denial risk.', color: 'negative' };
}

const businessLoanSvg = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto">
  <rect width="320" height="200" fill="var(--svg-f8fafc)" rx="6"/>
  <text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)" font-family="system-ui,sans-serif">Debt Service Coverage Ratio</text>
  <rect x="30" y="35" width="260" height="30" rx="6" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/>
  <text x="160" y="55" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e40af)" font-family="system-ui,sans-serif">Monthly Income (NOI): $8,500</text>
  <rect x="30" y="80" width="155" height="30" rx="6" fill="var(--svg-ef4444)"/>
  <text x="107" y="100" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)" font-family="system-ui,sans-serif">Loan Payment: $5,129</text>
  <text x="160" y="130" text-anchor="middle" font-size="10" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">DSCR = $8,500 / $5,129 = 1.66</text>
  <text x="160" y="143" text-anchor="middle" font-size="9" fill="var(--svg-10b981)" font-weight="bold" font-family="system-ui,sans-serif">1.50+ = Strong approval</text>
  <rect x="30" y="155" width="260" height="8" rx="4" fill="var(--svg-fee2e2)"/>
  <rect x="30" y="155" width="65" height="8" rx="4" fill="var(--svg-ef4444)"/>
  <rect x="95" y="155" width="65" height="8" rx="4" fill="var(--svg-fef3c7)"/>
  <rect x="160" y="155" width="65" height="8" rx="4" fill="var(--svg-dcfce7)"/>
  <rect x="225" y="155" width="65" height="8" rx="4" fill="var(--svg-10b981)"/>
  <text x="30" y="178" font-size="7" fill="var(--svg-94a3b8)" font-family="system-ui,sans-serif">1.0</text>
  <text x="95" y="178" font-size="7" fill="var(--svg-94a3b8)" font-family="system-ui,sans-serif">1.25</text>
  <text x="160" y="178" font-size="7" fill="var(--svg-94a3b8)" font-family="system-ui,sans-serif">1.5</text>
  <text x="250" y="178" font-size="7" fill="var(--svg-94a3b8)" font-family="system-ui,sans-serif">2.0</text>
  <text x="160" y="193" text-anchor="middle" font-size="8" fill="var(--svg-64748b)" font-family="system-ui,sans-serif">Lenders typically require DSCR &gt;= 1.25</text>
</svg>`;

const businessLoanConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'loanAmount',
      label: 'Loan Amount',
      type: 'number',
      placeholder: '250,000',
      prefix: '$',
      inputMode: 'numeric',
      required: true,
      helpText: 'Total amount you need to borrow for your business.',
    },
    {
      id: 'loanTermMonths',
      label: 'Loan Term',
      type: 'select',
      options: [
        { label: '12 months (1 year)', value: '12' },
        { label: '24 months (2 years)', value: '24' },
        { label: '36 months (3 years)', value: '36' },
        { label: '48 months (4 years)', value: '48' },
        { label: '60 months (5 years)', value: '60' },
        { label: '84 months (7 years)', value: '84' },
        { label: '120 months (10 years)', value: '120' },
      ],
      helpText: 'How long you have to repay the loan — longer terms mean lower payments but more interest.',
    },
    {
      id: 'interestRate',
      label: 'Annual Interest Rate',
      type: 'number',
      placeholder: '8.50',
      unit: '%',
      inputMode: 'numeric',
      min: 0,
      step: 0.01,
      required: true,
      helpText:
        'SBA loans: 5-10%. Bank term loans: 6-14%. Online lenders: 10-30%.',
    },
    {
      id: 'originationFee',
      label: 'Origination Fee',
      type: 'number',
      placeholder: '2.00',
      unit: '%',
      inputMode: 'numeric',
      min: 0,
      max: 10,
      step: 0.25,
      helpText:
        'Most business loans charge 1-5% of the loan amount upfront. Deducted from disbursement.',
    },
    {
      id: 'monthlyNOI',
      label: 'Monthly Net Operating Income (for DSCR)',
      type: 'number',
      placeholder: '8,500',
      prefix: '$',
      inputMode: 'numeric',
      helpText:
        "Your business's monthly net income before debt payments. Used to calculate Debt Service Coverage Ratio. Leave blank to skip DSCR.",
    },
  ],

  calculate: (values) => {
    const loanAmount = parseFloat(values.loanAmount);
    const n = parseInt(values.loanTermMonths, 10) || 60;
    const annualRate = parseFloat(values.interestRate);
    const originationFeePct = parseFloat(values.originationFee) || 0;
    const monthlyNOI = parseFloat(values.monthlyNOI);

    if (isNaN(loanAmount) || isNaN(annualRate) || loanAmount <= 0 || annualRate < 0) return [];

    const monthlyRate = annualRate / 100 / 12;

    // Use Decimal.js for precise monetary calculations
    let monthlyPayment: number;
    if (monthlyRate === 0) {
      monthlyPayment = loanAmount / n;
    } else {
      const decLoan = new Decimal(loanAmount);
      const decRate = new Decimal(monthlyRate);
      const denominator = new Decimal(1).sub(
        new Decimal(1).add(decRate).pow(-n)
      );
      monthlyPayment = decLoan.mul(decRate).div(denominator).toNumber();
    }

    const totalPaid = monthlyPayment * n;
    const totalInterest = totalPaid - loanAmount;
    const originationFeeAmount = new Decimal(loanAmount).mul(originationFeePct / 100).toNumber();
    const actualCashReceived = loanAmount - originationFeeAmount;
    const totalCostIncFees = totalPaid + originationFeeAmount;

    const fmt = (num: number) =>
      new Decimal(num).toFixed(2);

    // Build amortization schedule
    type AmortRow = {
      month: number;
      beginningBalance: number;
      payment: number;
      interest: number;
      principal: number;
      endingBalance: number;
    };

    const schedule: AmortRow[] = [];
    let balance = loanAmount;

    for (let mo = 1; mo <= n; mo++) {
      const interest = balance * monthlyRate;
      const principal = monthlyPayment - interest;
      const endingBalance = Math.max(0, balance - principal);
      schedule.push({
        month: mo,
        beginningBalance: balance,
        payment: monthlyPayment,
        interest,
        principal,
        endingBalance,
      });
      balance = endingBalance;
    }

    const results: CalculatorResult[] = [
      {
        id: 'monthlyPayment',
        label: 'Estimated Monthly Payment',
        value: `$${fmt(monthlyPayment)}`,
        highlight: true,
        color: 'neutral' as const,
        interpretation: `Over the term you'll pay $${fmt(totalInterest)} in interest — the cost of the capital. For a business that interest is usually tax-deductible (principal isn't), so weigh it against the return the borrowed money is expected to generate, not the payment alone.`,
      },
      {
        id: 'totalInterest',
        label: 'Total Interest Over Loan Term',
        value: `$${fmt(totalInterest)}`,
        color: 'negative' as const,
      },
      {
        id: 'originationFeeResult',
        label: `Origination Fee (${originationFeePct.toFixed(2)}%)`,
        value:
          originationFeeAmount > 0
            ? `$${fmt(originationFeeAmount)} — Cash received: $${fmt(actualCashReceived)}`
            : '$0 — No origination fee',
        color: originationFeeAmount > 0 ? 'negative' as const : 'neutral' as const,
      },
      {
        id: 'totalCost',
        label: 'Total Cost of Loan (Payments + Origination Fee)',
        value: `$${fmt(totalCostIncFees)}`,
        color: 'negative' as const,
      },
      {
        id: 'actualCashReceived',
        label: 'Actual Cash Deposited in Your Account',
        value: `$${fmt(actualCashReceived)}`,
        color: 'positive' as const,
      },
    ];

    if (!isNaN(monthlyNOI) && monthlyNOI > 0) {
      const dscr = monthlyNOI / monthlyPayment;
      const { label, color } = getDSCRInterpretation(dscr);
      results.push({
        id: 'dscrResult',
        label: 'Debt Service Coverage Ratio (DSCR)',
        value: `${dscr.toFixed(2)} — ${label}`,
        color,
      });
    }

    results.push({
      id: '_amortization',
      label: '_amortization',
      value: JSON.stringify(schedule),
    });

    return results;
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BusinessLoanPanel, { values, results });
  },

  educational: {
    formula: 'M = P × r / (1 − (1 + r)^−n)',
    diagram: {
      svg: businessLoanSvg,
      alt: 'DSCR calculation diagram showing monthly income bar versus loan payment bar with the DSCR ratio and scale interpretation',
      caption: 'Lenders require DSCR of 1.25+ — it measures how many times your income covers the debt payment',
    },
    formulaDescription:
      'The standard loan amortization formula calculates your fixed monthly payment. M = monthly payment, P = principal loan amount, r = monthly interest rate (annual rate divided by 12), n = total number of monthly payments. Origination fees reduce the actual cash you receive while you still repay the full principal — this means your true cost of capital (effective APR) is always higher than the stated interest rate when fees are present. This calculator uses decimal.js high-precision arithmetic for all monetary calculations.',
    formulaSource: 'Standard loan amortization formula (PMT formula) used by CFPB, SBA, and all major commercial lenders. DSCR methodology per SBA Standard Operating Procedure 50 10 7.',
    variables: [
      {
        symbol: 'M',
        name: 'Monthly Payment',
        description: 'The fixed payment due each month covering both principal and interest portions of the loan.',
      },
      {
        symbol: 'P',
        name: 'Principal',
        description: 'The total loan amount borrowed before any fees or adjustments.',
      },
      {
        symbol: 'r',
        name: 'Monthly Interest Rate',
        description: 'The annual interest rate divided by 12. This is the periodic rate applied to the outstanding balance each month.',
      },
      {
        symbol: 'n',
        name: 'Number of Payments',
        description: 'The full loan term in months. A 5-year loan has 60 payments; a 10-year loan has 120 payments.',
      },
      {
        symbol: 'DSCR',
        name: 'Debt Service Coverage Ratio',
        description: 'Net Operating Income divided by Monthly Debt Payment. This is the key metric lenders use to assess whether your business generates enough cash flow to comfortably service the proposed debt.',
      },
    ],
    howToUse: [
      'Enter the loan amount you need to borrow for your business.',
      'Select the loan term — longer terms lower monthly payments but increase total interest paid over the life of the loan.',
      'Enter the annual interest rate — compare SBA, bank, and online lender rates.',
      'Add an origination fee percentage if applicable (common with SBA loans and online lenders).',
      'Optionally enter your monthly Net Operating Income to see your DSCR and assess the likelihood of lender approval.',
    ],
    commonUses: [
      'Determine whether your business qualifies for an SBA or traditional bank loan by calculating your debt service coverage ratio.',
      'Compare loan offers from different lenders by evaluating the total cost including origination fees and interest rates.',
      'Plan business expansion by modeling how a new loan payment fits within your current net operating income and cash flow.',
    ],
    workedExamples: [
      {
        scenario: 'River City Bakery seeks a $250,000 SBA 7(a) loan over 5 years for a second location. Their monthly NOI is $8,500, and they are quoted 8.5% with a 2% origination fee.',
        inputs: { loanAmount: '250000', loanTermMonths: '60', interestRate: '8.5', originationFee: '2', monthlyNOI: '8500' },
        result: 'Monthly payment is $5,129 with total interest of $57,740 over 60 months. Including $5,000 origination fee, total cost is $312,740. DSCR is 1.66 — strong approval territory.',
        insight: 'The monthly payment is $5,129, giving a DSCR of 1.66 — strong approval territory. However, the $5,000 origination fee means they only receive $245,000 in cash. The true cost including fees is $312,740 over 5 years. With a DSCR above 1.50, they have room to negotiate the origination fee down or ask for a rate reduction.',
      },
      {
        scenario: 'A tech startup with $45,000 monthly NOI wants a $500,000 equipment loan at 12% over 3 years from an online lender with a 3% origination fee.',
        inputs: { loanAmount: '500000', loanTermMonths: '36', interestRate: '12', originationFee: '3', monthlyNOI: '45000' },
        result: 'Monthly payment is $16,608 with total interest of $97,880 over 36 months. Including $15,000 origination fee, total cost is $612,880. DSCR is 2.71 — very strong approval territory.',
        insight: 'Monthly payment of $16,608 and DSCR of 2.71 is very strong. But the 3% origination fee costs $15,000 upfront, and total interest over 3 years is $97,880. The startup might qualify for a bank loan at 7-9% given their strong cash flow, saving $20,000+ in interest.',
      },
    ],
    proTips: [
      'A DSCR above 1.50 gives you negotiating leverage — ask for a lower rate, reduced origination fee, or longer term to improve cash flow.',
      'SBA 7(a) loans cap interest rates (prime + 2.25-4.75% depending on loan size) and origination fees (3% max for SBA-guaranteed portion) — always compare against SBA caps.',
      'When comparing loan offers, always look at the total cost including ALL fees, not just the stated interest rate. A loan with a lower rate but higher fees can cost more overall.',
      'If your DSCR is below 1.25, consider a longer loan term to lower monthly payments and improve your ratio, or increase your NOI before applying.',
    ],
    limitations: [
      'DSCR is calculated using your stated NOI — lenders will verify through tax returns, bank statements, and financial statements. Actual verified NOI may differ from your estimate.',
      'Origination fees, guarantee fees (SBA), packaging fees, and closing costs vary by lender and are not fully enumerated here — request a complete fee schedule before committing.',
      'Loan approval depends on factors beyond DSCR: personal credit score, time in business, collateral, and industry risk. A good DSCR is necessary but not sufficient for approval.',
    ],
    quickReference: [
      { label: 'SBA 7(a) Max Rate (2025)', value: 'Prime + 2.25-4.75%' },
      { label: 'Minimum DSCR (SBA)', value: '1.25' },
      { label: 'Typical Origination Fee', value: '1-5% of loan amount' },
      { label: 'SBA Guarantee Fee (>$1M)', value: 'Up to 3.75%' },
      { label: 'Typical Bank Term', value: '1-10 years' },
    ],
    explanation:
      'DSCR (Debt Service Coverage Ratio) is the single most important number that lenders evaluate when considering a business loan application. The concept was formalized by commercial banks in the mid-20th century as a standardized way to measure a business ability to service debt. A DSCR of 1.25 means your business earns $1.25 for every $1.00 of debt payment — the minimum most SBA lenders require for approval. A higher DSCR signals stronger cash flow and increases your negotiating power for better rates. Origination fees, while often overlooked, reduce your effective cash received and increase your true cost of capital. A 2% origination fee on a 5-year $250,000 loan at 8.5% raises your effective APR by roughly 0.4-0.5 percentage points, even though the stated rate stays the same.',
    faqs: [
      {
        question: 'What DSCR do most lenders require for a business loan?',
        answer:
          'Most traditional banks and SBA lenders require a minimum DSCR of 1.25, meaning your net operating income must be at least 25% higher than your proposed monthly debt payments. Some lenders may accept a DSCR as low as 1.15 for otherwise strong borrowers with good credit and collateral. Online lenders may be more flexible on DSCR but typically charge higher rates. A DSCR above 1.50 significantly improves your negotiating position for better terms.',
      },
      {
        question: 'How does an origination fee affect my true cost of borrowing?',
        answer:
          'An origination fee is deducted upfront from your loan disbursement, so you receive less cash than the total loan amount — but you still repay the full principal plus interest. This increases your effective APR above the stated interest rate. For example, a $250,000 loan with a 2% origination fee means you receive $245,000 but must repay the full $250,000 plus interest over the loan term. Always compare APRs (which include fees by law), not just stated rates.',
      },
      {
        question: 'What is the difference between an SBA loan and a conventional business loan?',
        answer:
          'SBA (Small Business Administration) loans are partially guaranteed by the federal government, which allows lenders to offer lower rates (typically 5-10%) and longer terms (up to 25 years for real estate, 10 years for working capital). The trade-offs include more extensive paperwork, longer approval times (often weeks or months), and stricter eligibility requirements including personal guarantees. Conventional bank loans are faster but require stronger credit and collateral. Online business lenders offer the fastest funding but charge significantly higher rates, often with APRs of 15-40% when all fees are included.',
      },
      {
        question: 'What counts as Net Operating Income for DSCR calculation?',
        answer:
          'NOI for DSCR typically includes EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization) adjusted for owner compensation and non-recurring items. Lenders use your business tax returns and financial statements to calculate this — not your internal P&L. They will add back depreciation, amortization, interest expense, and sometimes owner salary or distributions to arrive at a normalized cash flow figure. Your stated NOI should be conservative; lenders will recalculate it anyway.',
      },
      {
        question: 'Should I choose a longer loan term to lower my monthly payment?',
        answer:
          'A longer term lowers monthly payments and improves DSCR, but increases total interest significantly. For example, extending a $250,000 loan at 8.5% from 5 to 10 years drops payments from $5,129 to $3,099 but adds roughly $67,000 in extra interest. Choose the shortest term you can comfortably afford with a DSCR above 1.25. Some lenders will let you make extra principal payments without penalty to pay off early.',
      },
    ],
    citations: [
      { source: 'US Small Business Administration — Loan Programs', url: 'https://www.sba.gov' },
      { source: 'Consumer Financial Protection Bureau — Small Business Lending', url: 'https://www.consumerfinance.gov' },

    ],
  },
};

export default businessLoanConfig;
