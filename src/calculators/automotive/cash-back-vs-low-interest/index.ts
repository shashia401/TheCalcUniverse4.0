import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import { compareOffers } from './cashBackMath';
import CashBackPanel from './CashBackPanel';
import { finiteSteps } from '../../../utils/explainGuard';

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
    const c = compareOffers(values);
    if (!c) return [];
    const { monthlyA, monthlyB, interestA, interestB, totalPaidA, totalPaidB, aWins, tie, savings, standardRate, promoRate } = c;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const winnerLabel = tie ? 'Both Options Cost the Same' : aWins ? 'Option A (Cash Back) Wins' : 'Option B (Low Rate) Wins';
    const winnerSavings = tie ? 'No difference in total cost' : `Saves $${fmt(savings)} overall`;

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
        value: `$${fmt(interestA)}`,
        color: interestA > interestB ? 'negative' as const : 'positive' as const,
      },
      {
        id: 'optionBInterest',
        label: 'Option B — Total Interest Paid',
        value: `$${fmt(interestB)}`,
        color: interestB > interestA ? 'negative' as const : 'positive' as const,
      },
      {
        id: 'optionATotalCost',
        label: 'Option A — Total Out-of-Pocket',
        value: `$${fmt(totalPaidA)}`,
        color: aWins && !tie ? 'positive' as const : 'neutral' as const,
      },
      {
        id: 'optionBTotalCost',
        label: 'Option B — Total Out-of-Pocket',
        value: `$${fmt(totalPaidB)}`,
        color: !aWins && !tie ? 'positive' as const : 'neutral' as const,
      },
    ];
  },
  explainSteps: (values) => {
    const c = compareOffers(values);
    if (!c) return [];
    const f = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const price = parseFloat(values.vehiclePrice);
    const rebate = parseFloat(values.cashRebate) || 0;
    const rate = (x: number) => `${parseFloat(x.toFixed(3))}%`;
    return finiteSteps([
      { label: 'Option A: take the rebate, finance at your own rate', expr: `Loan = ${f(price)} − ${f(c.downPayment)} down − ${f(rebate)} rebate = ${f(c.principalA)}` },
      { label: 'Option A monthly payment', expr: `${f(c.principalA)} at ${rate(c.standardRate)} over ${c.n} months = ${f(c.monthlyA)}/month`, note: 'Standard loan payment formula.' },
      { label: 'Option B: skip the rebate, take the promotional rate', expr: `Loan = ${f(price)} − ${f(c.downPayment)} down = ${f(c.principalB)}; at ${rate(c.promoRate)} over ${c.n} months = ${f(c.monthlyB)}/month` },
      { label: 'Total paid under each option', expr: `A: ${f(c.monthlyA)} × ${c.n} + ${f(c.downPayment)} down${c.excessRebate > 0 ? ` − ${f(c.excessRebate)} rebate beyond the loan` : ''} = ${f(c.totalPaidA)}; B: ${f(c.monthlyB)} × ${c.n} + ${f(c.downPayment)} down = ${f(c.totalPaidB)}`, note: `Interest paid: A ${f(c.interestA)}, B ${f(c.interestB)}.` },
      { label: 'Compare', expr: c.tie ? 'Both options cost the same.' : `${c.aWins ? 'Option A (cash back)' : 'Option B (low rate)'} is cheaper by ${f(c.savings)}` },
    ]);
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CashBackPanel, { values, results });
  },
  educational: {
    formula:
      'M = P × [r(1+r)^n] / [(1+r)^n − 1] | Option A Principal = Price − Down − Rebate | Option B Principal = Price − Down',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="40" y="60" width="170" height="230" fill="var(--svg-e0e7ff)" stroke="var(--svg-3b82f6)" stroke-width="1" rx="8"/><text x="125" y="90" text-anchor="middle" font-size="13" fill="var(--svg-3b82f6)" font-weight="bold">Cash Back</text><rect x="60" y="110" width="130" height="40" fill="var(--svg-22c55e)" rx="4"/><text x="125" y="135" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">-$2,000 Rebate</text><rect x="60" y="160" width="130" height="40" fill="var(--svg-ef4444)" rx="4"/><text x="125" y="185" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">6.99% Bank Rate</text><text x="125" y="235" text-anchor="middle" font-size="12" fill="var(--svg-333333)">Total: $33,258</text><rect x="230" y="60" width="170" height="230" fill="var(--svg-ede9fe)" stroke="var(--svg-8b5cf6)" stroke-width="1" rx="8"/><text x="315" y="90" text-anchor="middle" font-size="13" fill="var(--svg-8b5cf6)" font-weight="bold">Low Rate</text><rect x="250" y="110" width="130" height="40" fill="var(--svg-3b82f6)" rx="4"/><text x="315" y="135" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">No Rebate</text><rect x="250" y="160" width="130" height="40" fill="var(--svg-22c55e)" rx="4"/><text x="315" y="185" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Low 1.9% APR</text><text x="315" y="235" text-anchor="middle" font-size="12" fill="var(--svg-333333)">Total: $31,471</text></svg>',
      alt: 'Two side-by-side panels comparing cash back versus low interest financing',
      caption: 'Cash back vs low interest — $30,000 car, $2,000 rebate at a 6.99% bank rate versus 1.9% promotional financing over 60 months',
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
          'Qualifies you for different rates in both options. Promotional rates are usually reserved for top-tier credit. Your own bank rate also varies by credit tier, and a difference of even a point or two of APR can shift the break-even between the options.',
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
      '0% financing sounds like a no-brainer — but it is not always the better deal. Here is why: when a manufacturer offers 0% financing, they are using that incentive budget instead of offering you a cash rebate. The cash-back option reduces your loan principal immediately, which means you borrow less money even if the interest rate is higher. Whether the rebate beats the low rate depends on three factors: the size of the rebate, the difference between the two rates, and the length of the loan term.\n\nFor example, on a $35,000 vehicle with a $3,000 cash rebate at 6.99% vs. 0% financing over 60 months: Option A principal = $32,000, monthly payment = ~$633, total paid = ~$38,009. Option B principal = $35,000, monthly payment = $583, total paid = $35,000. In this case, the 0% rate wins by about $3,000. But at shorter terms or with higher rebates and lower bank rates, the math often flips.\n\nThe key insight: the rebate lowers your principal right away — that benefit is front-loaded. The low rate benefit compounds over time. Shorter loan terms favor the cash rebate; longer terms tend to favor the low rate.',
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
        question: 'When does cash back usually win?',
        answer:
          'Cash back tends to win when the rebate is large relative to the price, your own bank or credit union rate is low, and the loan term is short, because the promotional rate then has fewer months and fewer dollars of interest to save. For example, on a $35,000 car with a $3,000 rebate and 0% promotional financing, a 4% bank loan over 36 months is cheaper with the rebate ($34,012 vs $35,000 total), but over 60 months the 0% offer is cheaper ($35,000 vs $35,360). Run your own numbers — it is a close call more often than the headline offers suggest.',
      },
      {
        question: 'When does the promotional rate usually win?',
        answer:
          'The promotional rate tends to win when it is at or near 0%, the rebate is small, the loan term is long (60–84 months), or your outside financing rate is high. At 0% you pay no interest regardless of term, so the only question is whether the rebate is worth more than the interest you would otherwise pay: on a $35,000 car, a $3,000 rebate financed at 6.99% over 60 months costs about $3,000 more than 0% financing.',
      },
      {
        question: 'Can I negotiate both — cash back AND a low rate?',
        answer:
          'Rarely. Manufacturers treat them as mutually exclusive incentive programs. A dealer may sometimes split the difference, but this is uncommon on advertised promotional rates. You can, however, negotiate the vehicle price independently of which financing option you choose — always negotiate price first, then financing.',
      },
      {
        question: 'Does my credit score affect which option to pick?',
        answer:
          'Yes. Promotional rates (especially 0%) are typically reserved for well-qualified buyers with top-tier credit. If you do not qualify for the promotional rate, the cash-back option with your bank\'s financing becomes your only real choice. Always check qualification requirements before assuming you can get the advertised rate.',
      },
    ],
    citations: [
      { source: 'Edmunds', url: 'https://www.edmunds.com/car-loans/0-percent-financing.html' },
      { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-0-apr-financing-en-2135/' },
    ],
  },
};

export default cashBackVsLowInterestConfig;
