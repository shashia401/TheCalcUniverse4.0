import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import FHAMIPPanel from './FHAMIPPanel';

const fhaLoanConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'homePrice',
      label: 'Home Purchase Price',
      type: 'number',
      placeholder: '300,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
    },
    {
      id: 'downPaymentPct',
      label: 'Down Payment',
      type: 'select',
      required: true,
      helpText: 'FHA requires minimum 3.5% (credit score ≥ 580) or 10% (credit score 500-579)',
      options: [
        { label: '3.5% (Minimum — Credit Score ≥ 580)', value: '3.5' },
        { label: '5%', value: '5' },
        { label: '10% (Credit Score 500-579)', value: '10' },
        { label: '15%', value: '15' },
        { label: '20%', value: '20' },
      ],
    },
    {
      id: 'interestRate',
      label: 'Interest Rate',
      type: 'number',
      placeholder: '6.8',
      unit: '%',
      min: 0,
      max: 30,
      step: 0.01,
      required: true,
    },
    {
      id: 'loanTerm',
      label: 'Loan Term',
      type: 'select',
      required: true,
      options: [
        { label: '30 years', value: '30' },
        { label: '15 years', value: '15' },
      ],
    },
  ],
  calculate: (values) => {
    const homePrice = parseFloat(values.homePrice);
    const downPct = parseFloat(values.downPaymentPct || '3.5') / 100;
    const annualRate = parseFloat(values.interestRate) / 100;
    const years = parseFloat(values.loanTerm || '30');

    if (isNaN(homePrice) || isNaN(downPct) || isNaN(annualRate) || homePrice <= 0) return [];

    const downPayment = homePrice * downPct;
    const baseLoan = homePrice - downPayment;

    const upfrontMIP = baseLoan * 0.0175;
    const totalLoan = baseLoan + upfrontMIP;

    const monthlyRate = annualRate / 12;
    const numPayments = years * 12;

    let monthlyPI: number;
    if (monthlyRate === 0) {
      monthlyPI = totalLoan / numPayments;
    } else {
      monthlyPI =
        (totalLoan * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    const annualMIPRate = downPct < 0.1 ? 0.0055 : 0.005;
    const monthlyMIP = (baseLoan * annualMIPRate) / 12;
    const totalMonthly = monthlyPI + monthlyMIP;

    const mipDuration = downPct < 0.1 ? 'Life of loan' : '11 years';

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return [
      {
        id: 'totalMonthly',
        label: 'Total Monthly Payment',
        value: `$${fmt(totalMonthly)}`,
        highlight: true,
        interpretation: `This includes $${fmt(monthlyMIP)}/mo in mortgage insurance premium, which every FHA loan requires regardless of down payment. It runs for ${mipDuration.toLowerCase()} at your ${(downPct * 100).toFixed(0)}% down payment — putting down at least 10% caps it at 11 years instead of the life of the loan.`,
        color: 'neutral',
      },
      {
        id: 'monthlyPI',
        label: 'Principal & Interest',
        value: `$${fmt(monthlyPI)}`,
        color: 'neutral',
      },
      {
        id: 'monthlyMIP',
        label: 'Monthly MIP (Mortgage Insurance)',
        value: `$${fmt(monthlyMIP)}`,
        color: 'negative',
      },
      {
        id: 'upfrontMIP',
        label: 'Upfront MIP (1.75%)',
        value: `$${fmt(upfrontMIP)}`,
        color: 'negative',
      },
      {
        id: 'downPayment',
        label: 'Down Payment Required',
        value: `$${fmt(downPayment)}`,
        color: 'neutral',
      },
      {
        id: 'mipDuration',
        label: 'MIP Duration',
        value: mipDuration,
        color: downPct < 0.1 ? 'negative' : 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(FHAMIPPanel, { values, results });
  },
  educational: {
    formula: 'Total FHA Payment = P&I (on base loan + Upfront MIP) + Annual MIP / 12',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="40" width="320" height="50" fill="var(--svg-3b82f6)" rx="8"/><text x="220" y="70" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Base Loan Amount</text><rect x="80" y="110" width="280" height="35" fill="var(--svg-8b5cf6)" rx="4"/><text x="220" y="133" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">+ Upfront MIP (1.75%)</text><rect x="80" y="155" width="280" height="35" fill="var(--svg-ef4444)" rx="4"/><text x="220" y="178" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Total Financed Amount</text><rect x="80" y="210" width="280" height="35" fill="var(--svg-f59e0b)" rx="4"/><text x="220" y="233" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">+ Annual MIP / 12 (monthly)</text><rect x="80" y="260" width="280" height="40" fill="var(--svg-22c55e)" rx="8"/><text x="220" y="286" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Total Monthly FHA Payment</text></svg>',
      alt: 'FHA loan breakdown from base loan amount through upfront and annual MIP to total payment',
      caption: 'FHA loan structure — base loan plus upfront MIP and annual MIP components',
    },
    formulaDescription:
      'FHA loans require two types of mortgage insurance premiums: an upfront MIP equal to 1.75% of the loan amount (typically financed into the loan itself), and an annual MIP paid in monthly installments at a rate of 0.50% to 0.55% of the loan balance depending on your down payment and loan term. Understanding both components is essential for comparing an FHA loan against a conventional mortgage.',
    variables: [
      { symbol: 'Upfront & Annual MIP', name: 'Mortgage Insurance Premiums', description: 'Upfront MIP = 1.75% of loan amount (rolled into the loan). Annual MIP = 0.50%-0.55% of loan balance per year, paid monthly. Upfront MIP is financed; annual MIP lasts 11 years or life of loan depending on down payment.' },
      { symbol: 'P&I', name: 'Principal & Interest', description: 'The standard amortization payment calculated on the total loan amount including the financed upfront MIP, using the standard fixed-rate mortgage formula.' },
      { symbol: 'Base Loan', name: 'Base Loan Amount', description: 'The home purchase price minus your down payment. This is the starting point before the upfront MIP is added.' },
    ],
    howToUse: [
      'Enter the home purchase price to establish the base loan amount.',
      'Select your down payment percentage — the minimum is 3.5% for borrowers with credit scores of 580 or higher.',
      'Enter the interest rate you have been quoted by your lender. Even a 0.25% difference can significantly impact the monthly payment.',
      'Select your loan term: 30-year terms offer lower monthly payments, while 15-year terms build equity faster with higher payments.',
      'Review the total monthly payment including both the principal and interest component and the monthly MIP charge.',
      'Check the upfront MIP dollar amount — this is often financed, meaning you pay interest on it for the life of the loan.',
    ],
    explanation:
      'FHA loans are mortgages insured by the Federal Housing Administration and issued by approved lenders. They were created to help lower-income and first-time buyers access homeownership who might not qualify for conventional loans. The key advantage is a low minimum down payment of just 3.5% (with a credit score of 580 or higher), and more lenient debt-to-income requirements. The trade-off is mandatory Mortgage Insurance Premiums (MIP) that apply to every FHA loan regardless of your down payment size. Unlike conventional Private Mortgage Insurance (PMI), FHA MIP cannot be canceled if you put less than 10% down; it remains in effect for the entire loan term. If your down payment is 10% or more, MIP drops off after 11 years. Borrowers with strong credit scores above 680 and the ability to make a 20% down payment should carefully compare conventional loans, as avoiding MIP entirely can save tens of thousands of dollars over the life of the loan. FHA loans also have maximum loan limits that vary by county, so check whether your target property falls within those limits before proceeding.',
    faqs: [
      {
        question: 'Can I remove FHA MIP?',
        answer: 'If your down payment was less than 10%, MIP is required for the entire loan term and cannot be canceled. The only way to eliminate it is to refinance into a conventional loan once you have built at least 20% equity in the property through appreciation and principal paydown.',
      },
      {
        question: 'What credit score do I need for an FHA loan?',
        answer: 'A credit score of 580 or higher qualifies you for the 3.5% minimum down payment option. Scores between 500 and 579 require a 10% down payment. Scores below 500 are not eligible for FHA financing. Individual lenders may impose their own overlay requirements above these minimums.',
      },
      {
        question: 'Are FHA loans only for first-time buyers?',
        answer: 'No. FHA loans are available to any qualifying borrower who intends to occupy the property as their primary residence, not just first-time buyers. However, you can only have one FHA loan at a time, so you cannot use FHA financing for investment properties or second homes.',
      },
      {
        question: 'How does FHA MIP differ from conventional PMI?',
        answer: 'Conventional PMI can be canceled once your loan-to-value ratio reaches 80%, either automatically at 78% or by request. FHA MIP with less than 10% down lasts the entire loan term. Conventional PMI rates also vary based on credit score and down payment, whereas FHA MIP rates are fixed by the government.',
      },
      {
        question: 'What are the FHA loan limits for 2025?',
        answer: 'FHA loan limits vary by county. For 2025, the floor for most low-cost areas is approximately $524,225, while high-cost areas can go up to $1,209,750. You can check the HUD website for your specific county\'s limit before applying.',
      },
    ],
    citations: [
      { source: 'U.S. Department of Housing and Urban Development', url: 'https://www.hud.gov/program_offices/housing/fhahistory' },
      { source: 'Wikipedia', title: 'FHA Insured Loan', url: 'https://en.wikipedia.org/wiki/FHA_insured_loan' },
    ],
  },
};

export default fhaLoanConfig;
