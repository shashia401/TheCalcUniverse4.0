import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import CashBackPanel from './CashBackPanel';

const cashBackVsLowInterestConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'vehiclePrice',
      label: 'Vehicle Price',
      type: 'number',
      placeholder: '35,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: 'Agreed purchase price before any deductions',
    },
    {
      id: 'downPayment',
      label: 'Down Payment',
      type: 'number',
      placeholder: '5,000',
      prefix: '$',
      min: 0,
      step: 100,
      helpText: 'Cash you pay upfront, reducing the amount financed',
    },
    {
      id: 'loanTermMonths',
      label: 'Loan Term',
      type: 'select',
      helpText: 'Shorter terms favor the cash-back option',
      options: [
        { label: '24 months (2 years)', value: '24' },
        { label: '36 months (3 years)', value: '36' },
        { label: '48 months (4 years)', value: '48' },
        { label: '60 months (5 years)', value: '60' },
        { label: '72 months (6 years)', value: '72' },
        { label: '84 months (7 years)', value: '84' },
      ],
    },
    {
      id: 'cashRebate',
      label: 'Option A — Cash Rebate Amount',
      type: 'number',
      placeholder: '3,000',
      prefix: '$',
      min: 0,
      step: 100,
      helpText: 'The cash-back offer from the dealer/manufacturer',
    },
    {
      id: 'standardRate',
      label: 'Option A — Your Bank/Credit Union Rate',
      type: 'number',
      placeholder: '6.99',
      unit: '%',
      min: 0,
      step: 0.01,
      helpText: 'The best rate you can get from your own financing sources',
    },
    {
      id: 'promoRate',
      label: 'Option B — Promotional Interest Rate',
      type: 'number',
      placeholder: '0',
      unit: '%',
      min: 0,
      step: 0.01,
      helpText: 'The special low rate offered by the manufacturer (e.g., 0%, 1.9%, 2.9%)',
    },
  ],
  calculate: (values) => {
    const vehiclePrice = parseFloat(values.vehiclePrice);
    const downPayment = parseFloat(values.downPayment) || 0;
    const n = parseFloat(values.loanTermMonths || '60');
    const cashRebate = parseFloat(values.cashRebate) || 0;
    const standardRate = parseFloat(values.standardRate);
    const promoRate = parseFloat(values.promoRate) || 0;

    if (isNaN(vehiclePrice) || vehiclePrice <= 0) return [];
    if (isNaN(standardRate)) return [];

    const loanAmount = vehiclePrice - downPayment;
    const principalA = loanAmount - cashRebate;
    const principalB = loanAmount;

    if (principalA <= 0 && principalB <= 0) return [];

    const calcPayment = (principal: number, annualRatePct: number, months: number): number => {
      if (principal <= 0) return 0;
      const r = annualRatePct / 12 / 100;
      if (r === 0) return principal / months;
      return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    };

    const monthlyA = calcPayment(principalA, standardRate, n);
    const monthlyB = calcPayment(principalB, promoRate, n);

    const totalPaidA = monthlyA * n + downPayment;
    const totalPaidB = monthlyB * n + downPayment;

    const totalInterestA = monthlyA * n - principalA;
    const totalInterestB = monthlyB * n - principalB;

    const aWins = totalPaidA <= totalPaidB;
    const savings = Math.abs(totalPaidA - totalPaidB);

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const winnerLabel = aWins ? 'Option A (Cash Back) Wins' : 'Option B (Low Rate) Wins';
    const winnerSavings = `Saves $${fmt(savings)} overall`;

    return [
      {
        id: 'winner',
        label: winnerLabel,
        value: winnerSavings,
        highlight: true,
        color: 'positive' as const,
        interpretation: `This crossover flips depending on your loan term and the rate gap — cash back tends to win on shorter loans and when the rate difference is small, while the low-rate offer wins on longer loans with a wide rate spread. Run both scenarios if you're between two term lengths, since the winner can change.`,
      },
      {
        id: 'savingsAmount',
        label: 'Total Savings with Winning Option',
        value: `$${fmt(savings)}`,
        color: 'positive' as const,
      },
      {
        id: 'optionAPayment',
        label: `Option A Monthly Payment (Cash Back + ${standardRate.toFixed(2)}% Rate)`,
        value: `$${fmt(monthlyA)}`,
        color: 'neutral' as const,
      },
      {
        id: 'optionBPayment',
        label: `Option B Monthly Payment (${promoRate.toFixed(2)}% Promotional Rate)`,
        value: `$${fmt(monthlyB)}`,
        color: 'neutral' as const,
      },
      {
        id: 'optionAInterest',
        label: 'Option A — Total Interest Paid',
        value: `$${fmt(totalInterestA)}`,
        color: totalInterestA > totalInterestB ? 'negative' as const : 'positive' as const,
      },
      {
        id: 'optionBInterest',
        label: 'Option B — Total Interest Paid',
        value: `$${fmt(totalInterestB)}`,
        color: totalInterestB > totalInterestA ? 'negative' as const : 'positive' as const,
      },
      {
        id: 'optionATotalCost',
        label: 'Option A — Total Out-of-Pocket',
        value: `$${fmt(totalPaidA)}`,
        color: aWins ? 'positive' as const : 'neutral' as const,
      },
      {
        id: 'optionBTotalCost',
        label: 'Option B — Total Out-of-Pocket',
        value: `$${fmt(totalPaidB)}`,
        color: !aWins ? 'positive' as const : 'neutral' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CashBackPanel, { values, results });
  },
  educational: {
    formula:
      'M = P × [r(1+r)^n] / [(1+r)^n − 1] | Option A Principal = Price − Down − Rebate | Option B Principal = Price − Down',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="40" y="60" width="170" height="230" fill="var(--svg-e0e7ff)" stroke="var(--svg-3b82f6)" stroke-width="1" rx="8"/><text x="125" y="90" text-anchor="middle" font-size="13" fill="var(--svg-3b82f6)" font-weight="bold">Cash Back</text><rect x="60" y="110" width="130" height="40" fill="var(--svg-22c55e)" rx="4"/><text x="125" y="135" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">-$2,000 Rebate</text><rect x="60" y="160" width="130" height="40" fill="var(--svg-ef4444)" rx="4"/><text x="125" y="185" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Higher Rate</text><text x="125" y="235" text-anchor="middle" font-size="12" fill="var(--svg-333333)">Total: $34,200</text><rect x="230" y="60" width="170" height="230" fill="var(--svg-ede9fe)" stroke="var(--svg-8b5cf6)" stroke-width="1" rx="8"/><text x="315" y="90" text-anchor="middle" font-size="13" fill="var(--svg-8b5cf6)" font-weight="bold">Low Rate</text><rect x="250" y="110" width="130" height="40" fill="var(--svg-3b82f6)" rx="4"/><text x="315" y="135" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">No Rebate</text><rect x="250" y="160" width="130" height="40" fill="var(--svg-22c55e)" rx="4"/><text x="315" y="185" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Low 1.9% APR</text><text x="315" y="235" text-anchor="middle" font-size="12" fill="var(--svg-333333)">Total: $33,800</text></svg>',
      alt: 'Two side-by-side panels comparing cash back versus low interest financing',
      caption: 'Cash back vs low interest — compare total costs to find the better deal',
    },
    formulaDescription:
      'Both options use the standard amortization formula to calculate monthly payments. Option A reduces your loan principal by the cash rebate amount but finances at your market rate. Option B keeps the full loan principal but finances at the manufacturer\'s promotional (often very low) rate. The winning option is whichever results in the lower total out-of-pocket cost over the full term.',
    variables: [
      {
        symbol: 'P',
        name: 'Principal',
        description:
          'Option A: Vehicle Price − Down Payment − Cash Rebate. Option B: Vehicle Price − Down Payment.',
      },
      {
        symbol: 'r',
        name: 'Monthly Rate',
        description: 'Annual interest rate divided by 12 and divided by 100.',
      },
      {
        symbol: 'n',
        name: 'Number of Payments',
        description: 'Loan term in months.',
      },
      {
        symbol: 'Rebate',
        name: 'Cash Back Amount',
        description:
          'Reduces the amount you finance in Option A. Higher rebates favor the cash-back option.',
      },
      {
        symbol: 'Credit Score',
        name: 'Credit Tier',
        description:
          'Qualifies you for different rates in both options. Promotional rates often require 720+ FICO. Your personal bank rate also varies by credit tier — a difference of 1-2% APR across credit tiers can shift the break-even between options.',
      },
    ],
    howToUse: [
      'Enter the agreed vehicle price and your down payment.',
      'Select the loan term you plan to use.',
      'Enter the cash rebate offer (Option A) and your bank or credit union\'s best rate.',
      'Enter the manufacturer\'s promotional interest rate (Option B) — often 0%, 1.9%, or 2.9%.',
      'The calculator compares total out-of-pocket cost for both options and identifies the winner.',
      'Use the side-by-side chart and table below for a full breakdown.',
    ],
    explanation:
      '0% financing sounds like a no-brainer — but it is not always the better deal. Here is why: when a manufacturer offers 0% financing, they are using that incentive budget instead of offering you a cash rebate. The cash-back option reduces your loan principal immediately, which means you borrow less money even if the interest rate is higher. Whether the rebate beats the low rate depends on three factors: the size of the rebate, the difference between the two rates, and the length of the loan term.\n\nFor example, on a $35,000 vehicle with a $3,000 cash rebate at 6.99% vs. 0% financing over 60 months: Option A principal = $32,000, monthly payment = ~$633, total paid = ~$37,980. Option B principal = $35,000, monthly payment = $583, total paid = $35,000. In this case, the 0% rate wins by nearly $3,000. But at shorter terms or with higher rebates and lower bank rates, the math often flips.\n\nThe key insight: the rebate lowers your principal right away — that benefit is front-loaded. The low rate benefit compounds over time. Shorter loan terms favor the cash rebate; longer terms tend to favor the low rate.',
    commonUses: [
      'Choosing between a manufacturer cash rebate and a promotional 0% or low APR financing offer when buying a new car',
      'Deciding which financing option saves more money over the full loan term based on rebate size, interest rates, and loan length',
      'Comparing total out-of-pocket costs for short-term (24-36 month) vs long-term (60-84 month) loans under each financing option',
    ],
    faqs: [
      {
        question: 'Why does 0% financing not always beat cash back?',
        answer:
          'Because the cash rebate reduces your loan principal immediately. A $3,000 rebate on a $35,000 car means you only finance $32,000, saving you interest on those dollars for the entire term. If your bank rate is moderate (say 5-7%) and the rebate is large, you may pay less total even at a higher rate. The breakeven depends on rebate size, rate difference, and term length.',
      },
      {
        question: 'When should I always take the cash back?',
        answer:
          'Consider the cash rebate when: (1) your bank or credit union rate is below 5%, (2) the rebate is large relative to the vehicle price (greater than 5%), (3) you plan a short loan term (24–36 months), or (4) you intend to pay off early. Shorter terms dramatically favor the rebate because there are fewer months of interest to overcome.',
      },
      {
        question: 'When should I always take the promotional rate?',
        answer:
          'The promotional rate usually wins when: (1) the rate is 0% or near 0%, (2) the cash rebate is small (under $1,500), (3) the loan term is long (60–84 months), or (4) your outside financing rate is high (above 7–8%). At 0%, you pay zero interest regardless of term, so any rebate you forgo is a net loss.',
      },
      {
        question: 'Can I negotiate both — cash back AND a low rate?',
        answer:
          'Rarely. Manufacturers treat them as mutually exclusive incentive programs. A dealer may sometimes split the difference, but this is uncommon on advertised promotional rates. You can, however, negotiate the vehicle price independently of which financing option you choose — always negotiate price first, then financing.',
      },
      {
        question: 'Does my credit score affect which option to pick?',
        answer:
          'Yes. Promotional rates (especially 0%) typically require excellent credit (720+ FICO). If you do not qualify for the promotional rate, the cash-back option with your bank\'s financing becomes your only real choice. Always check qualification requirements before assuming you can get the advertised rate.',
      },
    ],
    citations: [
      { source: 'Edmunds', url: 'https://www.edmunds.com/car-loans/0-percent-financing.html' },
      { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-0-apr-financing-en-2135/' },
    ],
  },
};

export default cashBackVsLowInterestConfig;
