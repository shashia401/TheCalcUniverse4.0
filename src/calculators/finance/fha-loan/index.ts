import { createElement } from 'react';
import Decimal from 'decimal.js';
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
      inputMode: 'decimal',
      helpText: 'The agreed purchase price of the home. FHA loan limits vary by county — the 2025 floor is $524,225 in low-cost areas and up to $1,209,750 in high-cost markets. Check HUD.gov for your county limit.',
    },
    {
      id: 'downPaymentPct',
      label: 'Down Payment',
      type: 'select',
      required: true,
      helpText: 'FHA requires minimum 3.5% (credit score 580 or higher) or 10% (credit score 500-579). A larger down payment reduces your MIP rate from 0.55% to 0.50% and allows MIP to drop off after 11 years instead of lasting the full loan term.',
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
      inputMode: 'decimal',
      min: 0,
      max: 30,
      step: 0.01,
      required: true,
      helpText: 'The annual interest rate quoted by your lender. FHA rates are typically slightly below conventional loan rates because the government insures the loan. Even a 0.25% difference can change your monthly payment significantly — shop with at least three approved FHA lenders.',
    },
    {
      id: 'loanTerm',
      label: 'Loan Term',
      type: 'select',
      required: true,
      helpText: '30-year terms offer lower monthly payments but more total interest over the life of the loan. 15-year terms build equity faster with higher monthly payments and substantially less total interest. Most FHA borrowers choose the 30-year option.',
      options: [
        { label: '30 years', value: '30' },
        { label: '15 years', value: '15' },
      ],
    },
  ],
  calculate: (values) => {
    // Validate all required inputs before creating Decimal objects
    const homePriceStr = (values.homePrice || '').trim();
    const downPctStr = (values.downPaymentPct || '3.5').trim();
    const annualRateStr = (values.interestRate || '').trim();
    const loanTermStr = (values.loanTerm || '30').trim();

    if (
      !homePriceStr ||
      !annualRateStr ||
      isNaN(Number(homePriceStr)) ||
      isNaN(Number(annualRateStr)) ||
      isNaN(Number(downPctStr))
    ) return [];

    let homePrice: Decimal;
    let downPct: Decimal;
    let annualRate: Decimal;
    let years: Decimal;

    try {
      homePrice = new Decimal(homePriceStr);
      downPct = new Decimal(downPctStr).div(100);
      annualRate = new Decimal(annualRateStr).div(100);
      years = new Decimal(loanTermStr);
    } catch {
      return [];
    }

    if (!homePrice.isFinite() || !downPct.isFinite() || !annualRate.isFinite()) return [];
    if (homePrice.lte(0) || downPct.lt(0) || annualRate.lt(0)) return [];

    const downPayment = homePrice.times(downPct);
    const baseLoan = homePrice.minus(downPayment);

    // Upfront MIP: 1.75% of base loan (always financed into the loan)
    const upfrontMIP = baseLoan.times(0.0175);
    const totalLoan = baseLoan.plus(upfrontMIP);

    const monthlyRate = annualRate.div(12);
    const numPayments = years.times(12).toNumber();

    let monthlyPI: Decimal;
    if (monthlyRate.eq(0)) {
      monthlyPI = totalLoan.div(numPayments);
    } else {
      const onePlusR = monthlyRate.plus(1);
      const factor = new Decimal(Math.pow(onePlusR.toNumber(), numPayments));
      monthlyPI = totalLoan.times(monthlyRate).times(factor).div(factor.minus(1));
    }

    // Annual MIP rate: 0.55% if down payment < 10%, 0.50% if >= 10%
    const annualMIPRate = downPct.lt(0.1) ? new Decimal(0.0055) : new Decimal(0.005);
    const monthlyMIP = baseLoan.times(annualMIPRate).div(12);
    const totalMonthly = monthlyPI.plus(monthlyMIP);

    const mipDuration = downPct.lt(0.1) ? 'Life of loan' : '11 years';

    const fmt = (d: Decimal) =>
      d.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return [
      {
        id: 'totalMonthly',
        value: `$${fmt(totalMonthly)}`,
        label: 'Total Monthly Payment',
        highlight: true,
        color: 'neutral',
      },
      {
        id: 'monthlyPI',
        value: `$${fmt(monthlyPI)}`,
        label: 'Principal & Interest',
        color: 'neutral',
      },
      {
        id: 'monthlyMIP',
        value: `$${fmt(monthlyMIP)}`,
        label: 'Monthly MIP (Mortgage Insurance)',
        color: 'negative',
      },
      {
        id: 'upfrontMIP',
        value: `$${fmt(upfrontMIP)}`,
        label: 'Upfront MIP (1.75%)',
        color: 'negative',
      },
      {
        id: 'downPayment',
        value: `$${fmt(downPayment)}`,
        label: 'Down Payment Required',
        color: 'neutral',
      },
      {
        id: 'mipDuration',
        value: mipDuration,
        label: 'MIP Duration',
        color: downPct.lt(0.1) ? 'negative' : 'neutral',
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
    commonUses: [
      'Estimate the true total monthly cost of an FHA loan including both upfront and annual MIP premiums before making an offer on a home.',
      'Compare FHA financing against conventional mortgage options by running the same home price, rate, and down payment through both calculators to see the total cost difference including insurance.',
      'Determine whether putting 10% down instead of 3.5% is worthwhile — the savings from the lower annual MIP rate (0.50% vs 0.55%) and the 11-year MIP cancellation can be substantial over the life of the loan.',
      'Plan for a future refinance by understanding how much MIP you will pay until you can build 20% equity and refinance into a conventional loan without mortgage insurance.',
      'Evaluate the impact of lender rate quotes by plugging in different interest rates to see how even small rate differences change the monthly payment and total interest paid.',
    ],
    workedExamples: [
      {
        scenario: 'Maria is a first-time homebuyer in Phoenix, Arizona looking at a $320,000 home. She has a 620 credit score and qualifies for an FHA loan with 3.5% down at 6.75% interest. She wants to understand her total monthly payment including MIP and whether the 3.5% down option makes sense for her budget.',
        inputs: { homePrice: '320000', downPaymentPct: '3.5', interestRate: '6.75', loanTerm: '30' },
        result: 'Monthly P&I: $2,036; monthly MIP: $142; total monthly payment: $2,178. Total MIP over 30 years: $51,120 (monthly) + $5,404 (upfront) = $56,524. Switching to 10% down saves over $33,000 in MIP.',
        insight: 'With 3.5% down ($11,200), Maria\'s base loan is $308,800. The upfront MIP of $5,404 is financed into the loan, bringing the total financed amount to $314,204. Her monthly P&I payment is $2,036. The monthly MIP at the 0.55% rate is $142, making her total monthly payment $2,178. Because she put less than 10% down, MIP remains for the life of the loan. Over 30 years, Maria will pay approximately $51,120 in monthly MIP premiums plus the $5,404 upfront premium. If Maria could increase her down payment to 10%, her MIP rate would drop to 0.50%, the monthly MIP would be $122, and MIP would cancel after 11 years — saving over $33,000 in MIP premiums over the loan term.',
      },
      {
        scenario: 'James and Alicia have saved $50,000 for a down payment and are considering a $400,000 home. James has a 700 credit score. They are deciding between 10% down at 6.5% and 3.5% down at the same rate, weighing the trade-off between keeping cash reserves and minimizing MIP costs.',
        inputs: { homePrice: '400000', downPaymentPct: '10', interestRate: '6.5', loanTerm: '30' },
        result: 'Monthly P&I: $2,315; monthly MIP: $150; total monthly payment: $2,465. MIP cancels after 11 years saving $34,200. With 3.5% down instead: monthly payment rises to $2,662 with $70,000 more in total MIP over 30 years.',
        insight: 'With 10% down ($40,000), their base loan is $360,000. Upfront MIP is $6,300, making the total financed $366,300. Their monthly P&I payment is $2,315, and monthly MIP at 0.50% is $150 — total monthly payment of $2,465. MIP cancels after 11 years, saving approximately $34,200 in future MIP payments. By comparison, with 3.5% down ($14,000), they keep $26,000 more cash in hand but the base loan rises to $386,000, monthly MIP at 0.55% is $177, and MIP lasts for the entire 30-year term. Over 30 years, the lower down payment costs about $70,000 more in total MIP premiums. The decision depends on whether they value liquidity today or long-term savings — keeping cash may be wise if they need an emergency fund, but the long-term MIP cost is substantial.',
      },
      {
        scenario: 'Robert is a veteran deciding between an FHA loan and a VA loan for a $275,000 home. He qualifies for both programs. The FHA loan offers 6.25% with 3.5% down, while the VA loan offers 6.0% with zero down and no mortgage insurance. He wants to quantify the MIP cost advantage of the VA loan.',
        inputs: { homePrice: '275000', downPaymentPct: '3.5', interestRate: '6.25', loanTerm: '30' },
        result: 'FHA monthly: $1,784 (including $122 MIP). VA monthly: $1,648. VA loan saves $136/month and $63,000 total over 30 years compared to FHA with lifetime MIP.',
        insight: 'With the FHA loan at 3.5% down ($9,625), Robert\'s base loan is $265,375. Upfront MIP of $4,644 brings the total to $270,019. His monthly P&I payment is $1,662, monthly MIP is $122, and total monthly payment is $1,784. Over 30 years, total MIP costs reach $48,564. With the VA loan: zero down, no mortgage insurance, and 0.25% lower rate. The monthly payment would be approximately $1,648 — $136 less per month than the FHA loan. Over 30 years, the VA loan saves Robert roughly $49,000 in MIP premiums plus $14,000 in interest from the lower rate. For eligible veterans, the VA loan is almost always the better financial choice compared to FHA financing.',
      },
    ],
    proTips: [
      'If you have a credit score above 680 and can make at least a 5% down payment, always compare FHA against conventional loans. Conventional PMI can be canceled once you reach 20% equity, while FHA MIP with less than 10% down lasts the entire loan term — potentially costing tens of thousands more.',
      'The upfront MIP of 1.75% is almost always financed into the loan rather than paid in cash at closing. While this preserves your cash, remember that you pay interest on the upfront MIP for the entire loan term. On a $300,000 loan, financing $5,250 in upfront MIP at 6.5% over 30 years adds roughly $6,400 in extra interest on the MIP alone.',
      'If you currently have an FHA loan with less than 10% down and your home has appreciated significantly, look into refinancing into a conventional loan. Once your loan-to-value ratio reaches 80% or lower, a conventional refinance eliminates MIP entirely and could lower your monthly payment substantially.',
      'FHA loans are assumable, meaning a future buyer can take over your loan at your original interest rate. In a rising-rate environment, this is a valuable selling feature that conventional loans do not offer. Keep this in mind when comparing FHA against conventional financing.',
      'Check your county\'s FHA loan limits before house hunting. In 2025, the floor is $524,225 for single-family homes in most areas, but some counties have lower limits. You cannot use an FHA loan for a purchase price above your county\'s limit, so verify eligibility before making an offer.',
      'For borrowers with credit scores between 500 and 579, FHA is one of the few paths to homeownership — but it requires a 10% down payment. Take 6-12 months to improve your credit score above 580 before applying if possible, as reaching that threshold unlocks the 3.5% down payment option and saves you thousands at closing.',
    ],
    limitations: [
      'This calculator uses the standard FHA MIP rates for loans with terms greater than 15 years. For 15-year loans, MIP rates may differ (0.45% to 0.70% annual depending on LTV).',
      'FHA streamline refinance MIP rates (0.55% annual, 0.01% upfront) are not modeled here — use a dedicated refinance calculator for that scenario.',
      'FHA loan limits vary by county and property type (single-family, duplex, triplex, four-plex) and are not enforced by this tool.',
      'The calculator assumes a fixed interest rate for the full term; adjustable-rate FHA loans exist but behave differently.',
      'Property taxes, homeowners insurance, and HOA fees are not included — your actual housing payment will be higher.',
      'FHA requires mortgage insurance regardless of down payment size, unlike conventional loans where PMI can be avoided with 20% down.',
      'This tool is for estimation purposes; actual MIP rates and loan terms are set by HUD and your approved FHA lender at the time of application.',
    ],
    quickReference: [
      { label: 'Minimum Down Payment (Credit 580+)', value: '3.5% down, 0.55% annual MIP, life of loan. Upfront MIP 1.75% always applies' },
      { label: 'Minimum Down Payment (Credit 500-579)', value: '10% down, 0.55% annual MIP, life of loan. Fewer lenders approve below 580' },
      { label: 'Down Payment 10% or More', value: '10-20% down, 0.50% annual MIP for 11 years. MIP drops off after year 11' },
      { label: 'FHA Streamline Refinance', value: '0.55% annual MIP, 0.01% upfront. Must already have an FHA loan' },
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
      {
        question: 'Is the upfront MIP refundable if I refinance?',
        answer: 'You may receive a partial refund of the upfront MIP if you refinance into another FHA loan within 36 months of closing. The refund amount decreases over time: 55% refund in year 1, declining to 5% by year 3, and no refund after 36 months. Refinancing into a conventional loan does not qualify for any upfront MIP refund.',
      },
      {
        question: 'Can I get an FHA loan for a fixer-upper or renovation?',
        answer: 'Yes, the FHA 203(k) program allows you to finance both the home purchase and renovation costs in a single mortgage. The loan amount is based on the projected value after renovations. Minimum down payment requirements and MIP rules are the same as standard FHA loans. This is a popular option for buyers looking at homes that need significant repairs.',
      },
    ],
    citations: [
      { source: 'U.S. Department of Housing and Urban Development — FHA Loan Programs', url: 'https://www.hud.gov/program_offices/housing/fhahistory' },
      { source: 'Federal Housing Administration — About Single Family Programs', url: 'https://www.hud.gov/program_offices/housing/sfh/fha_about' },
      { source: 'Consumer Financial Protection Bureau — What is mortgage insurance?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-mortgage-insurance-en-1953/' },
      { source: 'HUD Handbook 4000.1 — FHA Single Family Housing Policy', url: 'https://www.hud.gov/program_offices/housing/sfh/handbook_4000-1' },
    ],
  },
};

export default fhaLoanConfig;
