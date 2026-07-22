import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';

const MAX_LTV_BY_CREDIT: Record<string, { label: string; maxLtv: number }> = {
  excellent: { label: 'Excellent (740+)', maxLtv: 0.85 },
  good: { label: 'Good (700–739)', maxLtv: 0.80 },
  fair: { label: 'Fair (650–699)', maxLtv: 0.75 },
  poor: { label: 'Below 650', maxLtv: 0.65 },
};

/** Decimal.js-based PMT: M = P × [r(1+r)^n] / [(1+r)^n − 1] */
function pmtDecimal(principal: number, monthlyRate: number, periods: number): number {
  if (monthlyRate === 0) return principal / periods;
  if (periods <= 0) return principal;
  const p = new Decimal(principal);
  const r = new Decimal(monthlyRate);
  const onePlusR = r.plus(1);
  const pow = onePlusR.pow(periods);
  return p.times(r).times(pow).div(pow.minus(1)).toNumber();
}

const homeEquityLoanConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'homeValue',
      label: 'Current Home Value',
      type: 'number',
      defaultValue: '400000',
      placeholder: '400,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      inputMode: 'decimal',
      helpText: 'Estimated current market value of your home. Use a recent appraisal, Zillow Zestimate, or Redfin estimate for the most accurate result.',
      slider: { min: 100000, max: 1000000, step: 5000 },
    },
    {
      id: 'currentMortgage',
      label: 'Current Mortgage Balance',
      type: 'number',
      defaultValue: '250000',
      placeholder: '250,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      inputMode: 'decimal',
      helpText: 'Remaining balance on your first mortgage. You can borrow against the equity above this amount. Check your most recent mortgage statement for the exact payoff balance.',
    },
    {
      id: 'creditProfile',
      label: 'Your Credit Profile',
      type: 'select',
      required: true,
      helpText: 'Lenders set maximum combined loan-to-value (CLTV) based on your credit score. Higher scores unlock more equity access and better interest rates.',
      options: [
        { label: 'Excellent (740+)', value: 'excellent' },
        { label: 'Good (700–739)', value: 'good' },
        { label: 'Fair (650–699)', value: 'fair' },
        { label: 'Below 650', value: 'poor' },
      ],
    },
    {
      id: 'desiredLoan',
      label: 'Desired Loan Amount',
      type: 'number',
      defaultValue: '50000',
      placeholder: '50,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      inputMode: 'decimal',
      helpText: 'How much equity do you want to borrow? This will be checked against the maximum CLTV limit for your credit profile. If it exceeds the limit, the approved amount will be capped.',
      slider: { min: 5000, max: 200000, step: 1000 },
    },
    {
      id: 'interestRate',
      label: 'Interest Rate',
      type: 'number',
      defaultValue: '8.5',
      placeholder: '8.5',
      unit: '%',
      min: 0,
      max: 30,
      step: 0.01,
      required: true,
      inputMode: 'decimal',
      helpText: 'Home equity loan rates are typically 1–3% higher than first mortgage rates. Rates are fixed for the full term, unlike HELOCs which use variable rates.',
      slider: { min: 0, max: 15, step: 0.1 },
    },
    {
      id: 'loanTerm',
      label: 'Loan Term',
      type: 'select',
      required: true,
      helpText: 'Home equity loans are typically 10–20 years. Longer terms lower your monthly payment but significantly increase total interest paid over the life of the loan.',
      options: [
        { label: '5 years', value: '60' },
        { label: '10 years', value: '120' },
        { label: '15 years', value: '180' },
        { label: '20 years', value: '240' },
        { label: '30 years', value: '360' },
      ],
    },
    {
      id: 'closingCosts',
      label: 'Closing Costs',
      type: 'number',
      placeholder: '2,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: false,
      inputMode: 'decimal',
      helpText: 'Home equity loans have closing costs — typically 2–5% of the loan amount. These include appraisal, origination fee, title search, and recording fees. Costs may be rolled into the loan balance.',
    },
  ],
  // Living Answer chart — cumulative principal vs interest over the term.
  // Mirrors calculate()'s financed-amount and CLTV-cap logic exactly.
  chart: (values) => {
    const homeValue = parseFloat(values.homeValue);
    const currentMortgage = values.currentMortgage === '' ? 0 : (parseFloat(values.currentMortgage) || 0);
    const desiredLoan = values.desiredLoan === '' ? 0 : (parseFloat(values.desiredLoan) || 0);
    const annualRate = parseFloat(values.interestRate);
    const loanTermMonths = parseFloat(values.loanTerm);
    const closingCosts = values.closingCosts === '' || values.closingCosts === undefined ? 0 : (parseFloat(values.closingCosts) || 0);
    const creditProfile = values.creditProfile || 'good';
    if (isNaN(homeValue) || homeValue <= 0 || isNaN(annualRate) || annualRate < 0 ||
        isNaN(desiredLoan) || desiredLoan < 0 || isNaN(loanTermMonths) || loanTermMonths <= 0) return null;

    const profile = MAX_LTV_BY_CREDIT[creditProfile] || MAX_LTV_BY_CREDIT.good;
    const maxHeloc = Math.max(0, homeValue * profile.maxLtv - currentMortgage);
    const actualLoan = Math.min(desiredLoan, maxHeloc);
    if (actualLoan <= 0) return null;
    const financed = actualLoan + Math.min(closingCosts, actualLoan * 0.05);
    const monthlyRate = annualRate / 100 / 12;
    const payment = pmtDecimal(financed, monthlyRate, loanTermMonths);

    const byMonth = loanTermMonths <= 36;
    const points: { x: number; values: number[] }[] = [{ x: 0, values: [0, 0] }];
    let balance = financed;
    let cumP = 0;
    let cumI = 0;
    for (let m = 1; m <= loanTermMonths; m++) {
      const interest = balance * monthlyRate;
      const principalPaid = Math.min(payment - interest, balance);
      cumI += interest;
      cumP += principalPaid;
      balance -= principalPaid;
      if (byMonth || m % 12 === 0 || m === loanTermMonths) {
        points.push({ x: byMonth ? m : Math.round(m / 12), values: [cumP, cumI] });
      }
    }
    return {
      points,
      seriesLabels: ['Principal', 'Interest'],
      seriesColors: ['var(--brand-default)', '#e11d48'],
      xAxisLabel: byMonth ? 'mo' : 'yr',
      formatValue: (n: number) => `$${Math.round(n).toLocaleString()}`,
      caption: 'Cumulative principal repaid vs interest paid over the loan term. Hover to read any point.',
    };
  },
  calculate: (values) => {
    const homeValue = parseFloat(values.homeValue);
    const currentMortgage = values.currentMortgage === '' ? 0 : (parseFloat(values.currentMortgage) || 0);
    const desiredLoan = values.desiredLoan === '' ? 0 : (parseFloat(values.desiredLoan) || 0);
    const annualRate = parseFloat(values.interestRate);
    const loanTermRaw = parseFloat(values.loanTerm);
    const loanTermMonths = isNaN(loanTermRaw) || loanTermRaw <= 0 ? NaN : loanTermRaw;
    const closingCosts = values.closingCosts === '' || values.closingCosts === undefined ? 0 : (parseFloat(values.closingCosts) || 0);
    const creditProfile = values.creditProfile || 'good';

    // Comprehensive NaN/edge case guards
    if (
      isNaN(homeValue) || homeValue <= 0 ||
      isNaN(annualRate) || annualRate < 0 ||
      isNaN(desiredLoan) || desiredLoan < 0 ||
      isNaN(currentMortgage) || currentMortgage < 0 ||
      isNaN(loanTermMonths) || loanTermMonths <= 0
    ) {
      return [];
    }

    const profile = MAX_LTV_BY_CREDIT[creditProfile] || MAX_LTV_BY_CREDIT.good;
    const maxLtvPct = profile.maxLtv;

    const totalEquity = homeValue - currentMortgage;
    const maxTotalLoan = homeValue * maxLtvPct;
    const maxHeloc = Math.max(0, maxTotalLoan - currentMortgage);

    const isUnderLimit = desiredLoan <= maxHeloc;
    const actualLoan = isUnderLimit ? desiredLoan : maxHeloc;

    const monthlyRate = annualRate / 100 / 12;
    const monthlyPayment = pmtDecimal(actualLoan, monthlyRate, loanTermMonths);
    const actualClosingCosts = Math.min(closingCosts, actualLoan * 0.05);
    const financedAmount = actualLoan + actualClosingCosts;
    const actualMonthlyPayment = pmtDecimal(financedAmount, monthlyRate, loanTermMonths);

    // Use Decimal for precise total calculations
    const totalPayment = new Decimal(actualMonthlyPayment).times(loanTermMonths).toNumber();
    const totalInterest = new Decimal(totalPayment).minus(financedAmount).toNumber();

    // Equity stack data for visualization
    const stackData = {
      homeValue,
      mortgageBalance: currentMortgage,
      helocAmount: actualLoan,
      remainingEquity: totalEquity - actualLoan,
      totalEquity,
      maxAvailable: maxHeloc,
    };

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtInt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const cltvRatio = (actualLoan + currentMortgage) / homeValue;

    const paymentLabel = 'Monthly Payment';
    return [
      { id: 'monthlyPayment', label: paymentLabel,
        value: actualClosingCosts > 0
          ? `$${fmt(actualMonthlyPayment)} (costs rolled in)`
          : `$${fmt(monthlyPayment)}`,
        highlight: true, color: 'neutral' },
      { id: 'maxAvailable', label: 'Maximum Available',
        value: maxHeloc > 0 ? `$${fmtInt(maxHeloc)}` : '$0',
        color: maxHeloc > 0 ? 'positive' : 'negative' },
      { id: 'actualLoan', label: 'Approved Loan Amount',
        value: `$${fmtInt(actualLoan)}`,
        color: isUnderLimit ? 'positive' : 'negative' },
      { id: 'ltvRatio', label: 'Combined LTV (CLTV)',
        value: `${(cltvRatio * 100).toFixed(1)}%`,
        color: cltvRatio <= 0.8 ? 'positive' : cltvRatio <= 0.9 ? 'neutral' : 'negative' },
      { id: 'totalEquity', label: 'Total Equity',
        value: `$${fmtInt(totalEquity)}`, color: 'neutral' },
      { id: 'remainingEquity', label: 'Remaining Equity After Loan',
        value: `$${fmtInt(Math.max(0, totalEquity - actualLoan))}`,
        color: totalEquity - actualLoan > 0 ? 'positive' : 'negative' },
      { id: 'totalInterest', label: 'Total Interest Paid (Full Term)',
        value: `$${fmtInt(totalInterest)}`, color: 'negative' },
      { id: 'closingCostsLine', label: 'Closing Costs',
        value: closingCosts > 0 ? `$${fmtInt(actualClosingCosts)}` : 'Not entered',
        color: 'neutral' },
      { id: 'creditProfileUsed', label: 'Max CLTV (Based on Credit)',
        value: `${(maxLtvPct * 100).toFixed(0)}%`, color: 'neutral' },
      { id: '_equityStack', label: '_equityStack',
        value: JSON.stringify(stackData) },
    ];
  },
  educational: {
    formula: 'CLTV = (First Mortgage + Home Equity Loan) ÷ Home Value',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="#f8fafc" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="#1e293b">Home Equity — The Equity Stack</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="#64748b">Your home value is split into mortgage, equity loan, and your remaining equity</text><g transform="translate(50,65)"><!-- House icon --><polygon points="170,0 240,25 240,50 100,50 100,25" fill="#dbeafe" stroke="#3b82f6" stroke-width="2"/><rect x="135" y="25" width="70" height="25" rx="3" fill="#f1f5f9"/><text x="170" y="42" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">$400K</text><text x="170" y="65" text-anchor="middle" font-size="10" font-weight="bold" fill="#475569">Your Home\'s Value</text><!-- Stacked equity bar --><rect x="30" y="85" width="280" height="40" rx="6" fill="#3b82f6" opacity="0.5"/><text x="170" y="110" text-anchor="middle" font-size="12" font-weight="bold" class="fill-white">First Mortgage: $250,000 (62.5%)</text><rect x="30" y="128" width="120" height="40" rx="6" fill="#f59e0b"/><text x="90" y="153" text-anchor="middle" font-size="12" font-weight="bold" class="fill-white">Equity Loan: $50K</text><rect x="30" y="171" width="130" height="40" rx="6" fill="#22c55e"/><text x="95" y="196" text-anchor="middle" font-size="12" font-weight="bold" class="fill-white">Your Equity: $100K</text><!-- Brackets explaining CLTV --><g transform="translate(325,85)"><text x="0" y="16" font-size="10" font-weight="bold" fill="#475569">CLTV Calculation</text><text x="0" y="34" font-size="9" fill="#3b82f6">$250K + $50K</text><text x="0" y="48" font-size="9" fill="#64748b">= $300K total loans</text><text x="0" y="62" font-size="9" fill="#64748b">CLTV = $300K / $400K</text><text x="0" y="76" font-size="10" font-weight="bold" fill="#f59e0b">= 75%</text></g></g><g transform="translate(40,235)"><rect x="10" y="0" width="370" height="92" rx="10" fill="#f1f5f9"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e293b">Credit Profile Determines Max CLTV</text><text x="90" y="38" text-anchor="middle" font-size="10" fill="#22c55e">Excellent (740+): 85%</text><text x="90" y="54" text-anchor="middle" font-size="10" fill="#3b82f6">Good (700-739): 80%</text><text x="280" y="38" text-anchor="middle" font-size="10" fill="#f59e0b">Fair (650-699): 75%</text><text x="280" y="54" text-anchor="middle" font-size="10" fill="#ef4444">Below 650: 65%</text><text x="195" y="78" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e293b">Higher credit = more equity access + better rates</text></g></svg>',
      alt: 'Home equity stack diagram showing a house icon worth $400K divided into first mortgage (blue), equity loan (orange), and remaining equity (green) with CLTV calculation',
      caption: 'Your CLTV equals all loans against your home divided by its value — lenders cap this at 80-85% to protect themselves from market declines',
    },
    formulaDescription:
      `Lenders limit the combined loan-to-value ratio based on your credit score. The CLTV tells you how much of your home equity you can actually access. Most lenders cap CLTV at 80-85% for excellent credit, meaning you must maintain at least 15-20% equity in your home after the new loan. The monthly payment is calculated using the standard amortization formula: M = P x [r(1+r)^n] / [(1+r)^n - 1], where P is the financed amount (loan plus closing costs), r is the monthly interest rate, and n is the total number of monthly payments.`,
    variables: [
      { symbol: 'CLTV & Borrowing Power', name: 'Combined LTV & Accessible Equity', description: 'CLTV is the total of all loans against your home divided by its value. Accessible equity is home value × max CLTV percentage minus existing mortgage balance. Most lenders cap CLTV at 85% for excellent credit, meaning you must keep at least 15% equity.' },
      { symbol: 'Total Equity', name: 'Your Home Equity', description: 'Current home value minus what you owe on your first mortgage. A significant portion of this is unavailable because lenders require you to keep a minimum equity stake in the property.' },
      { symbol: 'HELOC', name: 'Home Equity Line of Credit', description: 'A revolving line of credit secured by your home with a variable interest rate. Unlike a home equity loan, you draw funds as needed and only pay interest on the amount borrowed. HELOCs typically have a 10-year draw period followed by a 20-year repayment period.' },
    ],
    howToUse: [
      'Enter your home\'s estimated market value and existing first mortgage balance — these determine your total equity.',
      'Select your credit profile (Excellent, Good, Fair, or Below 650) and enter the amount you want to borrow — the calculator will flag it if it exceeds your maximum CLTV limit.',
      'Enter the interest rate and loan term, then review the equity stack visualization to see how your home value is distributed and what your monthly payment will be.',
    ],
    commonUses: [
      'Calculate the fixed monthly payment for a home equity loan lump sum based on your available equity, interest rate, and term.',
      'Compare a home equity loan against a HELOC to decide which borrowing option suits your renovation or debt consolidation needs.',
      'Determine whether you qualify by checking your combined loan-to-value ratio against lender limits for your credit profile.',
    ],
    quickReference: [
      { label: 'Excellent Credit (740+)', value: 'Max CLTV: 85%' },
      { label: 'Good Credit (700–739)', value: 'Max CLTV: 80%' },
      { label: 'Fair Credit (650–699)', value: 'Max CLTV: 75%' },
      { label: 'Below 650', value: 'Max CLTV: 65%' },
      { label: 'Typical Closing Costs', value: '2–5% of loan amount' },
      { label: 'Typical Loan Term', value: '10–20 years' },
    ],
    proTips: [
      'Shop at least three lenders for home equity loans — rates and closing costs can vary by 1-2% between lenders, potentially saving you thousands over the loan term.',
      'Pay attention to the APR, not just the interest rate. The APR includes closing costs and fees, giving you the true cost of borrowing for comparison shopping.',
      'If your CLTV is borderline, consider making extra mortgage payments for 6-12 months to build more equity before applying — even a 5% equity increase can unlock significantly better terms.',
      'Home equity loan interest may be tax-deductible if you use the funds to "buy, build, or substantially improve" your home. Keep receipts and consult a tax professional.',
      'A 15-year term instead of 20 years typically saves you 30-40% in total interest while only increasing your monthly payment by about 20%. Run both scenarios in this calculator to see the difference.',
    ],
    limitations: [
      'This calculator estimates borrowing power based on CLTV limits but does not account for debt-to-income (DTI) ratio requirements, which most lenders cap at 43%. Your actual approved amount may be lower if your DTI is high.',
      'The interest rate shown is for estimation only. Actual rates depend on your credit score, loan amount, loan term, location, and the specific lender\'s underwriting criteria.',
      'Home equity loans put your home at risk of foreclosure if you cannot make payments. This calculator does not assess your ability to repay — always borrow conservatively.',
      'Closing cost estimates (2-5%) are industry averages. Your actual costs may differ based on your state\'s recording fees, appraisal requirements, and the lender\'s fee structure.',
    ],
    workedExamples: [
      {
        scenario: `Maria owns a home in Austin, TX worth $400,000 with a $250,000 remaining first mortgage. Her credit score is 740 (Excellent), and she wants to borrow $50,000 for a kitchen renovation. She gets quoted an 8.5% fixed rate for a 10-year term with $2,000 in closing costs.`,
        inputs: { homeValue: '400000', currentMortgage: '250000', creditProfile: 'excellent', desiredLoan: '50000', interestRate: '8.5', loanTerm: '120' },
        result: `Maria qualifies for the full $50,000 because her CLTV of 75% ($300K / $400K) is under the 85% limit. Her monthly payment including rolled-in closing costs is approximately $645, with total interest of about $25,400 over 10 years.`,
        insight: `Maria's excellent credit gives her access to 85% CLTV, well above her current 75%. This means she could borrow up to $90,000 if needed. The 10-year term keeps her total interest manageable compared to a longer term. If she chose a 20-year term, her monthly payment would drop to about $430 but total interest would nearly triple.`,
      },
      {
        scenario: `James has a home worth $300,000 with a $250,000 mortgage. His credit score is 670 (Fair), limiting him to 75% CLTV. He needs $40,000 to consolidate high-interest credit card debt and is offered a 9.5% rate for 15 years.`,
        inputs: { homeValue: '300000', currentMortgage: '250000', creditProfile: 'fair', desiredLoan: '40000', interestRate: '9.5', loanTerm: '180' },
        result: `James's maximum borrowing power is only $0 because 75% of $300,000 = $225,000, which is less than his $250,000 mortgage. He currently has no accessible equity. The calculator shows $0 available and flags his desired loan as exceeding the limit.`,
        insight: `James is in a tough spot. He has $50,000 in total equity but his Fair credit profile prevents him from accessing any of it because lenders want him to maintain at least 25% equity. His options are to improve his credit score to Good (700+) which would only unlock 80% CLTV = $240K max, still under his mortgage, or to pay down his mortgage below $225,000 before applying.`,
      },
    ],
    explanation:
      `A home equity loan is a second mortgage that lets you borrow against the equity you have built in your home. Unlike a HELOC (Home Equity Line of Credit), which is a revolving line of credit with a variable rate, a home equity loan provides a lump sum with a fixed interest rate and fixed monthly payments over a set term. Lenders evaluate your Combined Loan-to-Value (CLTV) ratio, the sum of your first mortgage balance and the new home equity loan divided by your home's current market value. Most lenders cap CLTV at 80-85% for borrowers with excellent credit, though some will go to 90% at higher rates. The equity stack chart in this calculator shows how your home value is partitioned: the first mortgage occupies the bottom portion, the home equity loan sits on top of that, and your remaining untapped equity is at the top. This visual makes it clear exactly how much of your home's value you control free and clear. The concept of using home equity as collateral was developed in the 19th century by building and loan associations that helped working families access capital through their property, and the modern home equity lending industry has grown into a multi-billion dollar market serving millions of American homeowners.`,
    citations: [
      { source: 'CFPB', title: 'What you should know about home equity lines of credit', url: 'https://www.consumerfinance.gov/owning-a-home/loan-options/heloc/' },
      { source: 'Federal Reserve', title: 'Mortgage Debt Outstanding by Type of Property and Holder', url: 'https://www.federalreserve.gov/data/mortoutstand/current.htm' },
      { source: 'IRS', title: 'Publication 936: Home Mortgage Interest Deduction', url: 'https://www.irs.gov/publications/p936' },
    ],
    faqs: [
      {
        question: 'Home equity loan vs. HELOC — what is the difference?',
        answer: `A home equity loan is a fixed-rate, fixed-term lump sum loan. You receive all the money at once and repay it in equal monthly installments over 5-30 years. A HELOC is a revolving line of credit secured by your home with a variable interest rate. You draw funds as needed during the draw period (typically 10 years) and pay interest only on what you borrow. Home equity loans are better for one-time expenses like a renovation project or debt consolidation. HELOCs are better for ongoing or unpredictable expenses.`,
      },
      {
        question: 'What are typical closing costs for a home equity loan?',
        answer: `Closing costs range from 2% to 5% of the loan amount and may include an appraisal fee ($300-$600), origination fee (0.5-1% of the loan), title search and insurance, and recording fees. Many lenders offer no-closing-cost options, but these typically come with a higher interest rate. Always compare the APR, which includes fees, rather than just the interest rate when shopping lenders.`,
      },
      {
        question: 'Is the interest on a home equity loan tax deductible?',
        answer: `Under IRS rules effective from 2018, interest on home equity loans and HELOCs is deductible only if the borrowed funds are used to buy, build, or substantially improve the home that secures the loan. Using the money for debt consolidation, tuition, medical bills, or other personal expenses makes the interest non-deductible. Consult a tax professional for your specific situation.`,
      },
      {
        question: 'What credit score do I need for a home equity loan?',
        answer: `Most lenders require a minimum credit score of 620-680 for a home equity loan. However, the best rates and highest CLTV limits (up to 85%) are reserved for borrowers with scores above 740. Below 650, you may still qualify but face lower CLTV caps (65%), higher rates, and stricter DTI requirements. Some credit unions and community banks have more flexible underwriting than large national lenders.`,
      },
      {
        question: 'How is the CLTV (Combined Loan-to-Value) calculated?',
        answer: `CLTV divides the total of all loans secured by your home by its current market value. For example, if you owe $200,000 on your first mortgage and want a $50,000 home equity loan on a home worth $400,000, your CLTV is ($200,000 + $50,000) / $400,000 = 62.5%. Most lenders cap CLTV at 80-85%, meaning you must maintain at least 15-20% equity after the loan closes. This protects the lender in case home values decline.`,
      },
    ],
  },
};

export default homeEquityLoanConfig;
