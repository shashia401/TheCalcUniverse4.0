import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import AmortizationPanel from '../../../components/calculator/AmortizationPanel';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const mortgageAmortizationConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'homePrice',
      label: 'Home Price',
      type: 'number',
      placeholder: '400,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Total purchase price of the home',
    },
    {
      id: 'downPayment',
      label: 'Down Payment ($)',
      type: 'number',
      placeholder: '80,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Upfront cash — or enter as % below',
    },
    {
      id: 'downPaymentPct',
      label: 'Down Payment (%)',
      type: 'number',
      placeholder: '20',
      unit: '%',
      min: 0,
      max: 100,
      step: 0.5,
      required: false,
      helpText: 'Overrides the $ amount above when filled',
    },
    {
      id: 'loanTerm',
      label: 'Loan Term',
      type: 'select',
      required: true,
      helpText: 'Number of years to repay the loan',
      options: [
        { label: '10 years', value: '10' },
        { label: '15 years', value: '15' },
        { label: '20 years', value: '20' },
        { label: '25 years', value: '25' },
        { label: '30 years', value: '30' },
      ],
    },
    {
      id: 'interestRate',
      label: 'Annual Interest Rate',
      type: 'number',
      placeholder: '6.8',
      unit: '%',
      min: 0,
      max: 30,
      step: 0.01,
      required: true,
      helpText: 'Current national average ~6.8%',
    },
    {
      id: 'propertyTax',
      label: 'Property Tax (Annual %)',
      type: 'number',
      placeholder: '1.2',
      unit: '%',
      min: 0,
      step: 0.01,
      required: false,
      helpText: 'Annual property tax as % of home value — national avg ~1.2%',
    },
    {
      id: 'homeInsurance',
      label: 'Homeowners Insurance (Annual)',
      type: 'number',
      placeholder: '1,500',
      prefix: '$',
      min: 0,
      step: 100,
      required: false,
      helpText: 'Annual homeowners insurance premium',
    },
    {
      id: 'hoaFee',
      label: 'HOA Fee (Monthly)',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      min: 0,
      step: 10,
      required: false,
      helpText: 'Monthly homeowner association dues',
    },
    {
      id: 'startMonth',
      label: 'First Payment Month',
      type: 'select',
      required: false,
      helpText: 'Month of your first payment',
      options: MONTHS.map((m, i) => ({ label: m, value: String(i + 1) })),
    },
    {
      id: 'startYear',
      label: 'First Payment Year',
      type: 'number',
      placeholder: String(new Date().getFullYear()),
      min: 2000,
      max: 2100,
      step: 1,
      required: false,
    },
  ],
  explainSteps: (values) => {
    const homePrice = parseFloat(values.homePrice);
    const annualRate = parseFloat(values.interestRate) / 100;
    const years = parseFloat(values.loanTerm || '30');

    if (isNaN(homePrice) || isNaN(annualRate) || homePrice <= 0) return [];

    const pctOverride = parseFloat(values.downPaymentPct);
    const downPayment = !isNaN(pctOverride) && values.downPaymentPct !== ''
      ? homePrice * (pctOverride / 100)
      : parseFloat(values.downPayment) || 0;
    const principal = homePrice - downPayment;
    if (principal <= 0) return [];

    const downPct = (downPayment / homePrice) * 100;
    const monthlyRate = annualRate / 12;
    const numPayments = years * 12;

    let monthlyPI: number;
    if (monthlyRate === 0) {
      monthlyPI = principal / numPayments;
    } else {
      monthlyPI =
        (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    const propertyTaxPct = parseFloat(values.propertyTax) / 100 || 0;
    const homeInsuranceAnnual = parseFloat(values.homeInsurance) || 0;
    const hoaMonthly = parseFloat(values.hoaFee) || 0;
    const pmiAnnual = downPct < 20 ? principal * 0.008 : 0;
    const monthlyPropertyTax = (homePrice * propertyTaxPct) / 12;
    const monthlyInsurance = homeInsuranceAnnual / 12;
    const monthlyPMI = pmiAnnual / 12;
    const totalMonthly = monthlyPI + monthlyPropertyTax + monthlyInsurance + monthlyPMI + hoaMonthly;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const steps: { label: string; expr: string; note?: string }[] = [
      {
        label: 'Loan amount after the down payment',
        expr: `$${fmt(homePrice)} − $${fmt(downPayment)} = $${fmt(principal)}  (${downPct.toFixed(1)}% down)`,
      },
      {
        label: 'Monthly rate and number of payments',
        expr: `r = ${(annualRate * 100).toFixed(2)}% ÷ 12 = ${(monthlyRate * 100).toFixed(4)}% · n = ${years} × 12 = ${numPayments}`,
      },
    ];

    if (monthlyRate === 0) {
      steps.push({
        label: 'Principal & interest (0% loan)',
        expr: `$${fmt(principal)} ÷ ${numPayments} = $${fmt(monthlyPI)}/mo`,
      });
    } else {
      const growth = Math.pow(1 + monthlyRate, numPayments);
      steps.push({
        label: 'Principal & interest payment',
        expr: `$${fmt(principal)} × (${monthlyRate.toFixed(6)} × ${growth.toFixed(4)}) ÷ (${growth.toFixed(4)} − 1) = $${fmt(monthlyPI)}`,
        note: 'The fixed monthly payment that retires the loan by the last month.',
      });
    }

    const escrowParts: string[] = [];
    if (monthlyPropertyTax > 0) escrowParts.push(`tax $${fmt(monthlyPropertyTax)}`);
    if (monthlyInsurance > 0) escrowParts.push(`insurance $${fmt(monthlyInsurance)}`);
    if (monthlyPMI > 0) escrowParts.push(`PMI $${fmt(monthlyPMI)}`);
    if (hoaMonthly > 0) escrowParts.push(`HOA $${fmt(hoaMonthly)}`);

    steps.push({
      label: 'Add taxes, insurance and fees for the full PITI payment',
      expr: `$${fmt(monthlyPI)}${escrowParts.length ? ' + ' + escrowParts.join(' + ') : ''} = $${fmt(totalMonthly)}/mo`,
      note: escrowParts.length
        ? 'PITI = Principal, Interest, Taxes & Insurance.'
        : 'No escrow items entered, so PITI equals principal & interest.',
    });

    return steps;
  },
  calculate: (values) => {
    const homePrice = parseFloat(values.homePrice);
    const annualRate = parseFloat(values.interestRate) / 100;
    const years = parseFloat(values.loanTerm || '30');

    if (isNaN(homePrice) || isNaN(annualRate) || homePrice <= 0) return [];

    const pctOverride = parseFloat(values.downPaymentPct);
    const downPayment = !isNaN(pctOverride) && values.downPaymentPct !== ''
      ? homePrice * (pctOverride / 100)
      : parseFloat(values.downPayment) || 0;

    const principal = homePrice - downPayment;
    if (principal <= 0) return [];

    const downPct = (downPayment / homePrice) * 100;
    const monthlyRate = annualRate / 12;
    const numPayments = years * 12;

    let monthlyPI: number;
    if (monthlyRate === 0) {
      monthlyPI = principal / numPayments;
    } else {
      monthlyPI =
        (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    const propertyTaxPct = parseFloat(values.propertyTax) / 100 || 0;
    const homeInsuranceAnnual = parseFloat(values.homeInsurance) || 0;
    const hoaMonthly = parseFloat(values.hoaFee) || 0;

    const pmiAnnual = downPct < 20 ? principal * 0.008 : 0;

    const monthlyPropertyTax = (homePrice * propertyTaxPct) / 12;
    const monthlyInsurance = homeInsuranceAnnual / 12;
    const monthlyPMI = pmiAnnual / 12;
    const totalMonthly = monthlyPI + monthlyPropertyTax + monthlyInsurance + monthlyPMI + hoaMonthly;

    const totalMortgage = monthlyPI * numPayments;
    const totalInterest = totalMortgage - principal;
    const totalOutOfPocket = totalMonthly * numPayments;

    const sm = parseInt(values.startMonth) || new Date().getMonth() + 1;
    const sy = parseInt(values.startYear) || new Date().getFullYear();
    const payoffMonthIndex = (sm - 1 + numPayments) % 12;
    const payoffYear = sy + Math.floor((sm - 1 + numPayments) / 12);
    const payoffDate = `${MONTHS[payoffMonthIndex]} ${payoffYear}`;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const results: CalculatorResult[] = [
      {
        id: 'totalMonthly',
        label: 'Total Monthly Payment (PITI)',
        value: `$${fmt(totalMonthly)}`,
        highlight: true,
        interpretation: `PITI bundles Principal, Interest, Taxes, and Insurance — the full housing payment lenders qualify you on, not just the loan payment. ${downPct < 20 ? `At ${downPct.toFixed(0)}% down you're also paying $${fmt(pmiAnnual / 12)}/mo in PMI, which drops off once you reach 20% equity.` : `At ${downPct.toFixed(0)}% down you've cleared the 20% threshold, so no PMI applies.`}`,
        color: 'neutral' as const,
      },
      {
        id: 'monthlyPI',
        label: 'Principal & Interest',
        value: `$${fmt(monthlyPI)}`,
        color: 'neutral' as const,
      },
      {
        id: 'monthlyTax',
        label: 'Property Tax (est.)',
        value: monthlyPropertyTax > 0 ? `$${fmt(monthlyPropertyTax)}` : 'Not entered',
        color: 'neutral' as const,
      },
      {
        id: 'monthlyIns',
        label: 'Homeowners Insurance',
        value: monthlyInsurance > 0 ? `$${fmt(monthlyInsurance)}` : 'Not entered',
        color: 'neutral' as const,
      },
    ];

    if (monthlyPMI > 0) {
      results.push({
        id: 'monthlyPMI',
        label: 'PMI (auto-calculated)',
        value: `$${fmt(monthlyPMI)}/mo`,
        color: 'negative' as const,
      });
    }

    if (hoaMonthly > 0) {
      results.push({
        id: 'monthlyHOA',
        label: 'HOA Fee',
        value: `$${fmt(hoaMonthly)}`,
        color: 'neutral' as const,
      });
    }

    results.push(
      {
        id: 'loanAmount',
        label: 'Loan Amount',
        value: `$${fmt(principal)}`,
        color: 'neutral' as const,
      },
      {
        id: 'downPaymentLine',
        label: 'Down Payment',
        value: `$${fmt(downPayment)} (${downPct.toFixed(1)}%)`,
        color: downPct >= 20 ? ('positive' as const) : ('negative' as const),
      },
      {
        id: 'totalInterest',
        label: 'Total Interest Paid',
        value: `$${fmt(totalInterest)}`,
        color: 'negative' as const,
      },
      {
        id: 'totalOutOfPocket',
        label: 'Total Out-of-Pocket',
        value: `$${fmt(totalOutOfPocket)}`,
        color: 'neutral' as const,
      },
      {
        id: 'payoffDate',
        label: 'Mortgage Payoff Date',
        value: payoffDate,
        color: 'positive' as const,
      },
    );

    return results;
  },
  extraPanel: (values, results) => {
    const homePrice = parseFloat(values.homePrice);
    const annualRate = parseFloat(values.interestRate) / 100;
    const years = parseFloat(values.loanTerm || '30');

    if (!results.length || isNaN(homePrice) || isNaN(annualRate)) return null;

    const pctOverride = parseFloat(values.downPaymentPct);
    const downPayment = !isNaN(pctOverride) && values.downPaymentPct !== ''
      ? homePrice * (pctOverride / 100)
      : parseFloat(values.downPayment) || 0;

    const principal = homePrice - downPayment;
    if (principal <= 0) return null;

    const downPct = (downPayment / homePrice) * 100;
    const monthlyRate = annualRate / 12;
    const numPayments = years * 12;

    let monthlyPayment: number;
    if (monthlyRate === 0) {
      monthlyPayment = principal / numPayments;
    } else {
      monthlyPayment =
        (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    const totalInterest = monthlyPayment * numPayments - principal;
    const propertyTaxPct = parseFloat(values.propertyTax) / 100 || 0;
    const homeInsuranceAnnual = parseFloat(values.homeInsurance) || 0;
    const hoaMonthly = parseFloat(values.hoaFee) || 0;
    const pmiAnnual = downPct < 20 ? principal * 0.008 : 0;

    const monthlyPropertyTax = (homePrice * propertyTaxPct) / 12;
    const monthlyInsurance = homeInsuranceAnnual / 12;
    const monthlyPMI = pmiAnnual / 12;
    const totalMonthly = monthlyPayment + monthlyPropertyTax + monthlyInsurance + monthlyPMI + hoaMonthly;

    return createElement(AmortizationPanel, {
      loanAmount: principal,
      annualRate,
      years,
      monthlyPayment,
      totalInterest,
      monthlyBreakdown: {
        principalAndInterest: monthlyPayment,
        propertyTax: monthlyPropertyTax,
        homeInsurance: monthlyInsurance,
        pmi: monthlyPMI,
        hoa: hoaMonthly,
        other: 0,
        total: totalMonthly,
      },
    });
  },
  educational: {
    formula: 'M = P × [r(1+r)^n] / [(1+r)^n − 1]',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="40" width="320" height="60" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" rx="8"/><rect x="80" y="50" width="280" height="40" fill="var(--svg-3b82f6)" rx="4"/><text x="220" y="75" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">House Price: $400,000</text><rect x="60" y="120" width="150" height="60" fill="var(--svg-22c55e)" rx="8"/><text x="135" y="148" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Down Payment</text><text x="135" y="165" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)">$80,000 (20%)</text><rect x="230" y="120" width="150" height="60" fill="var(--svg-ef4444)" rx="8"/><text x="305" y="148" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Loan Amount</text><text x="305" y="165" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)">$320,000</text><rect x="60" y="210" width="320" height="50" fill="var(--svg-8b5cf6)" rx="8"/><text x="220" y="230" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Monthly Payment</text><text x="220" y="248" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">$2,082 @ 6.5% / 30yr</text><line x1="60" y1="270" x2="380" y2="270" stroke="var(--svg-e2e8f0)" stroke-width="1"/><text x="220" y="295" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Total Interest: $429,528</text></svg>',
      alt: 'House price breakdown into down payment, loan amount, and monthly payment',
      caption: 'Mortgage amortization — monthly payment calculated from principal, rate, and term',
    },
    formulaDescription:
      'Calculates the fixed monthly principal and interest payment using the standard amortization formula. Your total PITI payment adds property taxes, homeowners insurance, HOA fees, and PMI (if applicable) on top of P&I. The amortization schedule shows the exact principal versus interest split for every payment over the full loan term.',
    variables: [
      { symbol: 'M', name: 'Monthly P&I Payment', description: 'The fixed dollar amount paid toward principal and interest each month for the life of the loan. This amount stays constant for a fixed-rate mortgage.' },
      { symbol: 'P', name: 'Principal', description: 'The loan amount equal to the home purchase price minus your down payment. This is the actual amount you are borrowing from the lender.' },
      { symbol: 'r', name: 'Monthly Rate', description: 'Your annual interest rate divided by 12. For example, a 6.8% annual rate becomes a 0.567% monthly rate used in the payment formula.' },
      { symbol: 'n', name: 'Number of Payments', description: 'The total number of monthly payments over the loan term. For a 30-year loan, this is 360 payments. For a 15-year loan, this is 180 payments.' },
      { symbol: 'PMI', name: 'Private Mortgage Insurance', description: 'Auto-calculated at approximately 0.8% of the loan amount per year when your down payment is under 20%. PMI protects the lender, not you, and is typically cancellable once you reach 20% equity.' },
    ],
    howToUse: [
      'Enter the home purchase price to set the starting point for the calculation.',
      'Enter your down payment as a dollar amount or as a percentage. If both are filled, the percentage overrides the dollar value.',
      'Select your loan term — shorter terms like 15 years have higher monthly payments but far less total interest paid over the life of the loan.',
      'Add optional details: property tax rate, annual homeowners insurance premium, and monthly HOA fee for a complete PITI picture.',
      'Review the full monthly breakdown including each PITI component, total interest paid over the loan term, and the projected payoff date.',
      'Scroll down to view the complete amortization schedule showing the principal and interest split for every monthly payment across the full loan term.',
    ],
    explanation:
      'A PITI mortgage payment covers four distinct components. Principal is the portion that actually reduces your loan balance — in the early years this is a small fraction of each payment. Interest is the cost of borrowing money from the lender; in the early years of a 30-year loan, roughly two-thirds of each payment goes toward interest alone. Taxes are annual property taxes that the lender collects monthly and holds in an escrow account to pay on your behalf. Insurance is homeowners insurance, also typically escrowed. If your down payment is under 20%, Private Mortgage Insurance (PMI) is automatically included to protect the lender against default. PMI typically costs 0.3% to 1.5% of the loan amount per year depending on your credit score and down payment size. The amortization schedule is the key tool for understanding your mortgage: early payments are heavily weighted toward interest, but over time the ratio shifts. By the halfway point of a 30-year loan, each payment applies more to principal than to interest. Making extra principal payments early in the loan term has an outsized effect on total interest savings because it reduces the balance on which future interest is calculated. A single extra payment per year can shorten a 30-year mortgage by several years and save tens of thousands in interest.',
    faqs: [
      {
        question: 'What is PITI?',
        answer: 'PITI stands for Principal, Interest, Taxes, and Insurance — the four components of a full monthly mortgage payment. Lenders use the full PITI amount (not just P&I) to calculate your front-end debt-to-income ratio when evaluating your loan application.',
      },
      {
        question: 'What is PMI and when can I remove it?',
        answer: 'Private Mortgage Insurance protects the lender in case you default on the loan when your down payment is under 20%. It is automatically calculated at roughly 0.8% of the loan per year. You can request removal once your loan-to-value ratio drops below 80%, and it must be automatically terminated at 78% LTV under the Homeowners Protection Act.',
      },
      {
        question: 'Should I choose a 15-year or 30-year mortgage?',
        answer: 'A 15-year mortgage saves tens of thousands in total interest and builds equity much faster, but the monthly payment is significantly higher. A 30-year mortgage offers lower required monthly payments and flexibility to pay extra principal on your own schedule when you have additional cash available.',
      },
      {
        question: 'How do I use the percentage down payment toggle?',
        answer: 'Enter a percentage in the Down Payment (%) field to auto-calculate the dollar equivalent. Leave it blank and only fill the dollar field if you know the exact cash amount you plan to put down. The percentage always overrides the dollar value when both are entered.',
      },
      {
        question: 'What happens if I make extra principal payments?',
        answer: 'Extra principal payments reduce the loan balance faster, which means less future interest accrues. Even one extra payment per year can shorten a 30-year mortgage by 4-5 years and save tens of thousands in interest. The amortization schedule updates to reflect this if you recalculate with a higher down payment.',
      },
    ],
    citations: [
      { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/owning-a-home/' },
      { source: 'Freddie Mac', url: 'https://www.freddiemac.com/research' },
    ],
  },
};

export default mortgageAmortizationConfig;
