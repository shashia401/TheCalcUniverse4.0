import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import AutoLoanPanel from './AutoLoanPanel';

const autoLoanConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'vehiclePrice',
      label: 'Vehicle Price',
      type: 'number',
      inputMode: 'decimal',
      placeholder: '35,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: 'Agreed purchase price before any deductions',
    },
    {
      id: 'loanTerm',
      label: 'Loan Term',
      type: 'select',
      required: true,
      helpText: 'Longer terms mean lower payments but more interest',
      options: [
        { label: '36 months (3 years)', value: '36' },
        { label: '48 months (4 years)', value: '48' },
        { label: '60 months (5 years)', value: '60' },
        { label: '72 months (6 years)', value: '72' },
        { label: '84 months (7 years)', value: '84' },
      ],
    },
    {
      id: 'interestRate',
      label: 'Annual Interest Rate (APR)',
      type: 'number',
      placeholder: '6.9',
      unit: '%',
      min: 0,
      max: 30,
      step: 0.01,
      inputMode: 'decimal',
      required: true,
      helpText: 'Your loan APR based on credit score and lender',
    },
    {
      id: 'downPayment',
      label: 'Cash Down Payment',
      type: 'number',
      placeholder: '5,000',
      prefix: '$',
      min: 0,
      step: 100,
      inputMode: 'decimal',
      helpText: 'Cash you pay at signing',
    },
    {
      id: 'tradeInValue',
      label: 'Trade-In Value',
      type: 'number',
      placeholder: '8,000',
      prefix: '$',
      min: 0,
      step: 100,
      inputMode: 'decimal',
      helpText: "Dealer's offer for your trade-in vehicle",
    },
    {
      id: 'tradeInOwed',
      label: 'Amount Owed on Trade-In',
      type: 'number',
      placeholder: '5,000',
      prefix: '$',
      min: 0,
      step: 100,
      inputMode: 'decimal',
      helpText: 'Remaining loan balance on your trade-in. If trade-in value < amount owed = negative equity, which is added to your new loan.',
    },
    {
      id: 'salesTaxPct',
      label: 'Sales Tax Rate',
      type: 'number',
      placeholder: '8',
      unit: '%',
      min: 0,
      max: 20,
      step: 0.1,
      inputMode: 'decimal',
      helpText: 'In most states, sales tax applies to (Vehicle Price − Trade-In Value). This calculator uses that formula.',
    },
    {
      id: 'titleRegFees',
      label: 'Title, Registration & Doc Fees',
      type: 'number',
      placeholder: '500',
      prefix: '$',
      min: 0,
      step: 50,
      inputMode: 'decimal',
      helpText: 'Flat fees charged by DMV and dealership (title, registration, doc fee). Typically $300–$800.',
    },
  ],
  calculate: (values) => {
    const price = parseFloat(values.vehiclePrice);
    const down = parseFloat(values.downPayment) || 0;
    const tradeInValue = parseFloat(values.tradeInValue) || 0;
    const tradeInOwed = parseFloat(values.tradeInOwed) || 0;
    const apr = parseFloat(values.interestRate) / 100;
    const months = parseFloat(values.loanTerm || '60');
    const taxPct = parseFloat(values.salesTaxPct) || 0;
    const fees = parseFloat(values.titleRegFees) || 0;

    if ([price, apr].some(v => isNaN(v)) || price <= 0) return [];

    const netTradeIn = tradeInValue - tradeInOwed;
    const negativeEquity = netTradeIn < 0 ? Math.abs(netTradeIn) : 0;
    const positiveTradeIn = netTradeIn > 0 ? netTradeIn : 0;

    const taxableAmount = Math.max(0, price - positiveTradeIn);
    const salesTax = taxableAmount * (taxPct / 100);

    const outTheDoorPrice = price + salesTax + fees;

    const loanAmount = price + salesTax + fees + negativeEquity - down - positiveTradeIn;

    if (loanAmount <= 0) return [
      { id: 'paid', label: 'Vehicle is fully covered', value: 'No loan needed', highlight: true, color: 'positive' },
    ];

    const monthlyRate = apr / 12;
    let monthlyPayment: number;
    if (monthlyRate === 0) {
      monthlyPayment = loanAmount / months;
    } else {
      monthlyPayment =
        (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
        (Math.pow(1 + monthlyRate, months) - 1);
    }

    const totalPaid = monthlyPayment * months;
    const totalInterest = totalPaid - loanAmount;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const results = [
      {
        id: 'monthlyPayment',
        label: 'Estimated Monthly Payment',
        value: `$${fmt(monthlyPayment)}`,
        highlight: true,
        color: 'neutral' as const,
        interpretation: `Over the loan you'll pay $${fmt(totalInterest)} in interest on top of the amount financed — a shorter term or larger down payment cuts that fast. Cars depreciate quickly in the first few years, so a long loan term risks owing more than the car is worth (being "underwater") if you need to sell or trade in early.`,
      },
      {
        id: 'outTheDoor',
        label: 'Out-the-Door Price (Before Financing)',
        value: `$${fmt(outTheDoorPrice)}`,
        color: 'neutral' as const,
      },
      {
        id: 'totalFinanced',
        label: 'Total Amount Financed',
        value: `$${fmt(loanAmount)}`,
        color: 'neutral' as const,
      },
      {
        id: 'totalInterest',
        label: 'Total Interest Paid',
        value: `$${fmt(totalInterest)}`,
        color: 'negative' as const,
      },
      {
        id: 'totalCost',
        label: 'Total Cost of Vehicle (All-In)',
        value: `$${fmt(totalPaid + down + positiveTradeIn)}`,
        color: 'neutral' as const,
      },
      {
        id: 'salesTaxLine',
        label: `Sales Tax (${taxPct}% on $${fmt(taxableAmount)} — price minus trade-in)`,
        value: taxPct > 0 ? `$${fmt(salesTax)}` : 'Not entered',
        color: 'neutral' as const,
      },
      {
        id: 'feesLine',
        label: 'Title, Registration & Doc Fees',
        value: fees > 0 ? `$${fmt(fees)}` : 'Not entered',
        color: 'neutral' as const,
      },
    ];

    if (negativeEquity > 0) {
      results.push({
        id: 'negativeEquity',
        label: 'Negative Equity Rolled Into Loan',
        value: `$${fmt(negativeEquity)} (trade-in owed $${fmt(tradeInOwed)} > value $${fmt(tradeInValue)})`,
        color: 'negative' as const,
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(AutoLoanPanel, { values, results });
  },
  educational: {
    formula: 'M = P × [r(1+r)^n] / [(1+r)^n − 1] | Taxable = Price − Trade-In Value',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="80" y="40" width="280" height="60" fill="var(--svg-3b82f6)" rx="8"/><text x="220" y="70" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Vehicle Price: $35,000</text><rect x="80" y="120" width="280" height="40" fill="var(--svg-22c55e)" rx="8"/><text x="220" y="145" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)">Down Payment: $5,000</text><rect x="80" y="175" width="280" height="40" fill="var(--svg-ef4444)" rx="8"/><text x="220" y="200" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)">Loan Amount: $30,000</text><rect x="80" y="230" width="280" height="40" fill="var(--svg-8b5cf6)" rx="8"/><text x="220" y="255" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)">Monthly: $541 @ 5% APR</text><line x1="80" y1="280" x2="360" y2="280" stroke="var(--svg-666666)" stroke-width="1"/><text x="220" y="305" text-anchor="middle" font-size="14" fill="var(--svg-333333)">Total Interest: $2,456</text></svg>',
      alt: 'Vehicle price broken into down payment, loan amount, and monthly payment',
      caption: 'Auto loan breakdown — vehicle price minus down payment equals financed amount',
    },
    formulaDescription:
      'The monthly payment uses the standard loan amortization formula where M equals the monthly payment, P is the amount financed, r is the monthly interest rate (APR divided by 12), and n is the loan term in months. The formula M = P x [r(1+r)^n] / [(1+r)^n - 1] calculates a fixed payment that fully repays the loan over the term. The amount financed is calculated as: Vehicle Price plus Sales Tax plus Title and Registration Fees, minus Down Payment, minus Trade-In Value, plus any Negative Equity (when the trade-in loan balance exceeds the trade-in value). Sales tax is applied to the taxable amount which is the vehicle price minus any positive trade-in equity, following the most common US state tax rule. The total cost of the loan includes all interest paid over the full term, which increases significantly with longer loan terms.',
    variables: [
      { symbol: 'P, r & n', name: 'Loan Terms (Principal, Rate, Months)', description: 'Principal = Price + Tax + Fees + Negative Equity − Down − Trade-In. Monthly rate r = APR ÷ 12. Term n in months (typical: 36-84). These three values determine your monthly payment through the standard amortization formula.' },
      { symbol: 'Negative Equity', name: 'Underwater Trade-In', description: 'When you owe more on your trade-in than it\'s worth, the difference is added to your new loan principal.' },
    ],
    howToUse: [
      'Enter the agreed vehicle price.',
      'Select your loan term and enter your APR.',
      'Enter your cash down payment, trade-in value, and any remaining loan balance on the trade-in.',
      'Add your local sales tax rate and any title/registration/doc fees.',
      'The calculator applies sales tax only to (price − trade-in value), as most states require.',
    ],
    explanation:
      'An auto loan is one of the largest financial commitments most people make outside of a mortgage, yet few buyers understand how the numbers actually work at the dealership. The concept of auto financing dates back to 1919, when General Motors founded GMAC (General Motors Acceptance Corporation) to help customers afford cars — this innovation helped quadruple GM sales within four years. Today, the auto loan industry is enormous: Americans owe over $1.6 trillion in auto loan debt, with the average new car loan exceeding $40,000 and average monthly payments approaching $750. Most online auto loan calculators miss the details that actually matter at the dealership. This one correctly handles negative equity (when your trade-in is underwater — you owe more than it is worth), applies sales tax only to the taxable amount as most states require, and includes the title, registration, and doc fees that push your actual loan higher. Longer loan terms of 72 to 84 months dramatically increase total interest and create a high risk of negative equity on your next trade-in. Understanding the full picture — out-the-door price, amount financed, and total loan cost — is the best defense against dealer add-ons and unfavorable financing. Always negotiate the out-the-door price, not the monthly payment, and secure financing pre-approval from a credit union or bank before visiting the dealership.',
    workedExamples: [
      {
        scenario: 'Marcus is buying a used Honda CR-V priced at $28,000. He has $5,000 cash down, a trade-in worth $8,000 with no remaining loan, lives in a state with 7% sales tax, and expects $400 in title and doc fees. The dealer offers 6.9% APR for 60 months. What is his real monthly payment?',
        inputs: { vehiclePrice: '28000', loanTerm: '60', interestRate: '6.9', downPayment: '5000', tradeInValue: '8000', tradeInOwed: '0', salesTaxPct: '7', titleRegFees: '400' },
        result: '$331.78/month — $3,106.85 total interest over 60 months',
        insight: 'With $8,000 positive trade-in equity: taxable amount is $28,000 - $8,000 = $20,000 at 7% tax = $1,400. Out-the-door price = $28,000 + $1,400 + $400 = $29,800. Amount financed = $29,800 - $5,000 - $8,000 = $16,800. Monthly payment at 6.9% over 60 months: approximately $332. Total interest paid: about $3,108. Marcus saves significantly by having a paid-off trade-in with equity.',
      },
      {
        scenario: 'Jasmine wants a new SUV priced at $42,000. She has only $2,000 down, her trade-in is worth $15,000 but she still owes $18,000 on it, and her state charges 6% sales tax with $600 in fees. The dealer offers 8.5% APR for 72 months. What will her payments look like?',
        inputs: { vehiclePrice: '42000', loanTerm: '72', interestRate: '8.5', downPayment: '2000', tradeInValue: '15000', tradeInOwed: '18000', salesTaxPct: '6', titleRegFees: '600' },
        result: '$538.11/month — $8,525.44 total interest over 72 months',
        insight: 'Negative equity: $15,000 - $18,000 = -$3,000 rolled into the new loan. Taxable amount: $42,000 - $15,000 = $27,000 at 6% = $1,620. Out-the-door = $42,000 + $1,620 + $600 = $44,220. Amount financed = $44,220 + $3,000 (negative equity) - $2,000 - $15,000 = $30,220. Monthly payment at 8.5% over 72 months: approximately $538. Total interest: about $8,536 — nearly $8,500 in interest alone on a $30,220 loan over 6 years. The underwater trade-in and long loan term are costly.',
      },
    ],
    proTips: [
      'Always negotiate the out-the-door price first, not the monthly payment. Dealers can lower monthly payments by stretching the loan term, which costs you thousands more in interest.',
      'Get financing pre-approved from your bank or credit union before visiting the dealership. This gives you a baseline rate to compare against dealer financing — and the dealer may beat it to earn your financing business.',
      'The 20/4/10 rule of thumb for affordable car buying: put 20% down, finance for no more than 4 years (48 months), and keep total monthly vehicle expenses (payment + insurance + fuel) under 10% of gross monthly income.',
      'Avoid rolling negative equity into a new loan whenever possible. If you are underwater on your current car, consider paying down the difference in cash rather than financing it at 7-10% APR over 5-7 years.',
      'Be skeptical of 72-month and 84-month loans. While they lower monthly payments, you will be underwater on the car for most of the loan term and pay dramatically more in total interest — often thousands more.',
      'Watch for dealer add-ons in the finance office: extended warranties, GAP insurance (often cheaper through your own insurer), VIN etching, fabric protection, and nitrogen tire fills are all high-margin items you can decline or buy elsewhere for less.',
    ],
    limitations: [
      'This calculator uses the standard amortization formula with a fixed APR, but dealer financing may involve simple interest loans that calculate interest daily rather than monthly.',
      'It does not account for manufacturer incentives, rebates, or special financing offers (0% APR) that may be available on new cars. Lease buyout calculations are not supported.',
      'Credit score impact on APR is not modeled — actual rates vary significantly by credit tier. Insurance costs, GAP insurance, and extended warranties are not included but can add $50-$200+ to monthly ownership costs.',
      'The sales tax calculation follows the most common US method (tax on price minus trade-in); a few states including California, Hawaii, Kentucky, Maryland, and Virginia tax the full purchase price without trade-in credit.',
    ],
    quickReference: [
      { label: 'Down Payment Target', value: '20% of vehicle price' },
      { label: 'Max Recommended Term', value: '48-60 months' },
      { label: 'Excellent Credit APR (New)', value: '5% - 7%' },
      { label: 'Good Credit APR (New)', value: '7% - 10%' },
      { label: 'Used Car APR Premium', value: '+2-4% above new car rates' },
      { label: 'Sales Tax Basis', value: 'Price minus Trade-In (most states)' },
      { label: 'Avg Doc Fee Range', value: '$100 - $500' },
      { label: 'Key Metric', value: 'Total cost, not monthly payment' },
    ],
    commonUses: [
      'Comparing loan offers from dealerships, banks, and credit unions to find the best interest rate and monthly payment',
      'Budgeting for a new or used car purchase by estimating monthly payments before visiting a dealer',
      'Deciding between different loan terms (36 vs 60 vs 72 months) to balance payment affordability against total interest cost',
      'Evaluating the impact of down payment size, trade-in value, and sales tax on the total financed amount',
    ],
    faqs: [
      {
        question: 'What is negative equity on a trade-in?',
        answer: 'If you owe $15,000 on your current car but it\'s only worth $12,000, you have $3,000 in negative equity. Dealers typically "roll" this into your new loan, meaning you\'re financing more than the new car costs. It\'s sometimes called being "upside down" or "underwater."',
      },
      {
        question: 'How do sales tax and title/registration fees affect my loan?',
        answer: 'In most US states, sales tax applies only to price minus trade-in value. Title/registration fees typically run $50-$300, and dealer doc fees range $100-$500. These all get added to your loan amount. A few states (like California) don\'t offer the trade-in tax credit — check your DMV.',
      },
      {
        question: 'What is a good APR for a car loan?',
        answer: 'New car rates as of 2026: Excellent credit (score 750+) typically qualifies for 6% to 8% APR. Good credit (700 to 749) qualifies for 8% to 11%. Fair credit typically sees 13% to 17%. Used car rates run 2% to 4% higher across all credit tiers. Credit unions and online lenders often beat dealership financing by 1% to 2%. Always check rates from at least 3 lenders before signing — the difference can save thousands over the life of the loan.',
      },
      {
        question: 'Is a 72-month or 84-month car loan a bad idea?',
        answer: 'Long-term loans of 72 or 84 months have three major risks. First, you pay dramatically more in total interest — a $35,000 loan at 8% over 84 months costs about $11,000 in interest vs. $7,500 over 60 months. Second, you will be underwater (owing more than the car is worth) for most of the loan term because cars depreciate faster than long-term loans amortize. Third, you are more likely to need GAP insurance, which adds cost. If you need a 72 or 84-month loan to afford the monthly payment, the car is probably too expensive for your budget. Stick to 48 to 60 months whenever possible.',
      },
      {
        question: 'Should I get pre-approved before visiting the dealership?',
        answer: 'Yes, absolutely. A pre-approval from your bank or credit union gives you three advantages: it sets a firm budget before you walk into the showroom, it gives you a rate benchmark to compare against dealer financing offers, and it prevents the dealer from marking up your interest rate (a practice called dealer reserve where the dealer adds 1% to 2% to your approved rate and keeps the difference). Many credit unions offer same-day pre-approvals online. Bring your pre-approval letter to the dealership and only share it after you have negotiated the out-the-door price.',
      },
      {
        question: 'What is GAP insurance and do I need it?',
        answer: 'GAP (Guaranteed Asset Protection) insurance covers the difference between your loan balance and the car\'s actual cash value if it\'s totaled or stolen. You should strongly consider GAP if you put less than 20% down, finance for 72+ months, or roll negative equity into the loan — because you\'ll be underwater for most of the loan term. However, buy GAP through your auto insurer (typically $20-$40/year added to your policy) rather than from the dealer finance office where it can cost $500-$900 as a one-time fee. Some insurers and credit unions include GAP-like coverage as a standard policy feature.',
      },
    ],
    citations: [
      { source: 'NHTSA', url: 'https://www.nhtsa.gov/' },
      { source: 'Experian Automotive', url: 'https://www.experian.com/automotive/auto-finance-trends' },
    ],
  },
};

export default autoLoanConfig;
