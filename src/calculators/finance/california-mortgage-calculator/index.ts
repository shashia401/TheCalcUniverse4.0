import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig } from '../../../types/calculator';
import CAMortgagePanel from './CAMortgagePanel';

const caMortgageConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'homePrice',
      label: 'Home Price',
      type: 'number',
      placeholder: '750,000',
      prefix: '$',
      inputMode: 'numeric',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'California median home price is ~$750,000 (highest in the US)',
    },
    {
      id: 'downPayment',
      label: 'Down Payment',
      type: 'number',
      placeholder: '150,000',
      prefix: '$',
      inputMode: 'numeric',
      min: 0,
      step: 1000,
      required: true,
      helpText: '20% down avoids PMI. CalHFA offers down payment assistance for first-time buyers.',
    },
    {
      id: 'interestRate',
      label: 'Interest Rate',
      type: 'percentage',
      placeholder: '6.9',
      inputMode: 'numeric',
      min: 0,
      max: 15,
      step: 0.125,
      required: true,
      helpText: 'Current CA average: ~6.9% for 30-year fixed (April 2026)',
    },
    {
      id: 'loanTerm',
      label: 'Loan Term',
      type: 'select',
      placeholder: '30',
      options: [
        { value: '15', label: '15 years' },
        { value: '20', label: '20 years' },
        { value: '30', label: '30 years' },
      ],
      required: true,
      helpText: 'Length of the mortgage. 30-year fixed is most common in California.',
    },
    {
      id: 'propertyTaxRate',
      label: 'Property Tax Rate',
      type: 'percentage',
      placeholder: '0.77',
      inputMode: 'numeric',
      min: 0,
      max: 3,
      step: 0.1,
      helpText: 'CA average is ~0.77% — limited by Prop 13 (assessed value locked at purchase)',
    },
  ],
  calculate: (values) => {
    const homePrice = parseFloat(values.homePrice);
    const downPayment = parseFloat(values.downPayment) || 0;
    const rate = (parseFloat(values.interestRate) || 0) / 100;
    const term = parseInt(values.loanTerm) || 30;
    const taxRate = (parseFloat(values.propertyTaxRate) || 0) / 100;

    if (isNaN(homePrice) || isNaN(rate) || isNaN(term)) return [];
    if (homePrice <= 0 || downPayment < 0 || downPayment >= homePrice) return [];

    const loanAmount = homePrice - downPayment;
    const downPct = ((downPayment / homePrice) * 100).toFixed(1);
    const months = term * 12;
    const monthlyRate = rate / 12;

    // Use Decimal.js for precise mortgage calculations
    let basePayment: number;
    if (monthlyRate > 0) {
      const decLoan = new Decimal(loanAmount);
      const decRate = new Decimal(monthlyRate);
      const onePlusR = new Decimal(1).add(decRate);
      const numerator = decLoan.mul(decRate).mul(onePlusR.pow(months));
      const denominator = onePlusR.pow(months).sub(1);
      basePayment = numerator.div(denominator).toNumber();
    } else {
      basePayment = loanAmount / months;
    }

    const monthlyTax = (homePrice * taxRate) / 12;
    const hasPmi = parseFloat(downPct) < 20;
    const monthlyPmi = hasPmi ? loanAmount * 0.005 / 12 : 0;
    const totalMonthly = basePayment + monthlyTax + monthlyPmi;
    const totalInterest = basePayment * months - loanAmount;
    const totalCost = loanAmount + totalInterest;
    const fmt = (n: number, d = 2) => n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
    return [
      { id: 'monthlyPayment', label: 'Monthly Payment (Principal & Interest)', value: `$${fmt(basePayment)}`, highlight: true, color: 'positive' },
      { id: 'totalMonthly', label: 'Monthly with Property Taxes', value: `$${fmt(totalMonthly)}`, highlight: true, color: 'neutral' },
      { id: 'loanAmount', label: 'Loan Amount', value: `$${fmt(loanAmount, 0)}`, color: 'neutral' },
      { id: 'downPercent', label: 'Down Payment', value: `${downPct}% ($${fmt(downPayment, 0)})`, color: hasPmi ? 'negative' : 'positive' },
      { id: 'totalInterest', label: 'Total Interest Paid', value: `$${fmt(totalInterest, 0)}`, color: 'neutral' },
      { id: 'totalCost', label: 'Total Cost of Loan', value: `$${fmt(totalCost, 0)}`, color: 'neutral' },
      { id: 'propertyTaxNote', label: 'Annual Property Taxes', value: `$${fmt(monthlyTax * 12, 0)}/yr`, color: 'neutral' },
      { id: '_caData', label: '', value: JSON.stringify({ loanAmount, downPct, hasPmi, monthlyTax, term }) },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CAMortgagePanel, { values, results });
  },
  educational: {
    formula: 'M = P × [r(1+r)^n] / [(1+r)^n - 1]',
    formulaDescription:
      'Standard monthly mortgage payment formula. California has relatively low property taxes (~0.77% effective rate) thanks to Proposition 13, but home prices are the highest in the nation. State income tax (1-13.3%) also affects overall affordability. This calculator uses decimal.js high-precision arithmetic for accurate payment calculations, and includes Prop 13 tax caps, Mello-Roos assessments, and PMI when the down payment is below 20%.',
    formulaSource: 'Standard mortgage amortization formula per CFPB mortgage disclosure requirements. Prop 13 tax rates based on California State Board of Equalization published data.',
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-333333)">Prop 13: How California Compares</text><rect x="20" y="35" width="135" height="22" rx="4" fill="var(--svg-3b82f6)" opacity="0.8"/><text x="87" y="49" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">CA: 0.77% tax + income tax</text><rect x="20" y="63" width="170" height="22" rx="4" fill="var(--svg-ef4444)" opacity="0.8"/><text x="105" y="77" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">TX: 1.80% tax + NO income tax</text><rect x="20" y="91" width="145" height="22" rx="4" fill="var(--svg-3b82f6)" opacity="0.6"/><text x="92" y="105" text-anchor="middle" font-size="9" fill="var(--svg-ffffff)">FL: 0.90% tax + NO income tax</text><line x1="20" y1="122" x2="300" y2="122" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="140" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-555555)">CA median: $750K</text><text x="160" y="156" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-555555)">TX: $350K | FL: $400K</text><rect x="15" y="163" width="290" height="30" rx="5" fill="var(--svg-f0f9ff)" stroke="var(--svg-dddddd)" stroke-width="1"/><text x="160" y="178" text-anchor="middle" font-size="9" fill="var(--svg-555555)">Prop 13: 1% max rate, 2%/yr cap</text><text x="160" y="190" text-anchor="middle" font-size="9" fill="var(--svg-555555)">Mello-Roos can add 0.5-2% extra</text></svg>',
      alt: 'Comparison of California property tax rates vs Texas and Florida',
      caption: 'California has low property taxes (0.77%) due to Prop 13 but the highest home prices and state income tax.',
    },
    variables: [
      { symbol: 'Prop 13', name: 'Proposition 13', description: 'California\'s landmark property tax law limits the tax rate to 1% of assessed value plus local bonds, and caps annual assessment increases at 2%. This keeps property taxes low for long-term homeowners.' },
      { symbol: 'CalHFA', name: 'California Housing Finance Agency', description: 'Offers down payment assistance and competitive mortgages for first-time homebuyers. Programs include CalHFA FHA, CalPLUS, and the MyHome assistance program with up to 3.5% of purchase price.' },
      { symbol: 'Mello-Roos', name: 'Mello-Roos Tax', description: 'Additional property tax assessment in some California communities to fund local infrastructure. Can add 0.5-2% to the effective tax rate. Not covered by Prop 13 protections.' },
      { symbol: 'PMI', name: 'Private Mortgage Insurance', description: 'Required when down payment is less than 20% of the home value. Protects the lender (not you) if you default. PMI typically costs 0.5-1.5% of the loan amount annually and can be cancelled once equity reaches 20%.' },
    ],
    howToUse: [
      'Enter the California home price — use $750,000 as a starting point.',
      'Enter your down payment. CalHFA offers up to 3.5% assistance for qualifying first-time buyers.',
      'Select your loan term. 30-year fixed is standard in California.',
      'Enter the property tax rate. The default 0.77% reflects Prop 13 limits — check if your area has Mello-Roos.',
      'Review the results — California has both property tax and state income tax (up to 13.3%), unlike Texas or Florida.',
    ],
    commonUses: [
      'Estimate monthly mortgage payments on a California home including Proposition 13 property taxes and Mello-Roos special assessments.',
      'Compare how California high home prices and progressive state income tax affect your overall housing affordability.',
      'Plan your home buying budget by modeling the impact of CalHFA down payment assistance programs and different loan terms.',
    ],
    workedExamples: [
      {
        scenario: 'The Garcia family in Sacramento buys a $650,000 home with 20% down at 6.9% on a 30-year fixed mortgage. Their community has no Mello-Roos.',
        inputs: { homePrice: '650000', downPayment: '130000', interestRate: '6.9', loanTerm: '30', propertyTaxRate: '0.77' },
        result: 'Monthly P&I is $3,424, plus $417 in property taxes for a total of $3,841/month. With 20% down, no PMI. Annual property tax under Prop 13 is approximately $5,000.',
        insight: 'Monthly P&I is $3,424, plus $417 in property taxes for a total of $3,841/month. With 20% down, no PMI. Their property taxes are only ~$5,000/year thanks to Prop 13 — compare to Texas where the same-value home would incur ~$11,700/year in property tax despite the lower purchase price.',
      },
      {
        scenario: 'A first-time buyer in Los Angeles uses CalHFA MyHome assistance (3.5%) toward a $750,000 condo with only 5% down.',
        inputs: { homePrice: '750000', downPayment: '37500', interestRate: '7.25', loanTerm: '30', propertyTaxRate: '0.85' },
        result: 'Monthly P&I is $4,864, plus $531 property tax and $297 PMI = $5,692/month. With only 5% down, PMI adds $3,564/year until equity reaches 20%. Total annual housing cost is approximately $68,304.',
        insight: 'Monthly P&I is $4,864, plus $531 property tax and $297 PMI = $5,692/month. The PMI adds $3,564/year until equity reaches 20%. With CalHFA assistance, the effective down payment is $63,750 (8.5%). Saving aggressively to refinance out of PMI once they have 20% equity could save $3,500+/year.',
      },
    ],
    proTips: [
      'Run Prop 13 numbers carefully: your tax basis resets to the purchase price, so two identical homes can have dramatically different tax bills depending on when they were last sold.',
      'Check for Mello-Roos before making an offer — some communities add 1-2% to the effective tax rate, adding hundreds per month to your payment.',
      'CalHFA MyHome down payment assistance is a deferred-payment loan — no monthly payments, due when you sell or refinance. It covers up to 3.5% of the purchase price.',
      'If you can put down 20%, do it: PMI in California can add $200-500/month because of the high loan amounts, and it protects the lender, not you.',
    ],
    limitations: [
      'Prop 13 tax calculations assume the purchase price becomes the assessed value — supplemental tax bills may apply in the first year if the property was previously assessed at a much lower value.',
      'Mello-Roos assessments vary by community and are not listed on MLS — always check with the county assessor or title company before closing.',
      'CalHFA programs have income limits that vary by county (e.g., $159,000 for a 1-2 person household in many CA counties for 2025). Not all buyers qualify.',
    ],
    quickReference: [
      { label: 'CA Prop 13 Max Rate', value: '1% of assessed value' },
      { label: 'CA Median Home Price', value: '~$750,000' },
      { label: 'CA State Income Tax', value: '1% – 13.3%' },
      { label: 'Mello-Roos Range', value: '0.5% – 2% extra' },
      { label: 'CalHFA MyHome Max', value: '3.5% of price' },
    ],
    explanation:
      'The California housing market is defined by the highest home prices in the continental US and a unique property tax system governed by Proposition 13. Passed by voters in 1978 as a taxpayer revolt against rapidly rising assessments, Prop 13 caps property tax at 1 percent of assessed value (plus local voter-approved bonds) and limits annual assessment increases to 2 percent. This means two identical homes in the same neighborhood can have dramatically different tax bills depending on when they were last sold — the welcome neighbor effect. For new homebuyers, the effective property tax rate is typically around 0.77 to 1.1 percent of the purchase price. However, some communities add Mello-Roos special taxes for schools and infrastructure, which can increase the effective rate by 0.5 to 2 percent. California also has a progressive state income tax of 1 to 13.3 percent. First-time homebuyers can access CalHFA programs offering down payment assistance and competitive rates. High housing costs mean many California buyers opt for larger down payments or look to smaller and more affordable markets in the Central Valley and Inland Empire.',
    faqs: [
      { question: 'How does Proposition 13 affect new homebuyers?', answer: 'Prop 13 limits property tax to 1% of the purchase price (plus local bonds) and caps increases at 2%/year. For a new buyer, your tax is based on your purchase price — so you pay ~1% of what you paid. This is much lower than Texas (~1.8%) but on a much higher home price.' },
      { question: 'What is Mello-Roos?', answer: 'A Mello-Roos is an additional property tax assessment in some California communities to fund new schools, roads, utilities, or public facilities. It is NOT covered by Prop 13 protections and can add 0.5-2% to your annual tax rate. Always check if a home is in a Mello-Roos district before making an offer.' },
      { question: 'What down payment help is available in California?', answer: 'CalHFA (California Housing Finance Agency) offers several programs: The MyHome Assistance Program provides up to 3.5% of the purchase price for down payment or closing costs. CalPLUS combines a lower-rate mortgage with a zero-interest deferred-payment loan. Income limits apply based on county.' },
      { question: 'How does California\'s state income tax affect home affordability?', answer: 'California has one of the highest state income tax rates in the US (1-13.3% brackets). When calculating how much home you can afford, factor in that your take-home pay is reduced by state income tax — unlike Texas, Florida, or Nevada which have no state income tax.' },
      { question: 'What are supplemental property tax bills in California?', answer: 'When you buy a home, the county assessor issues a supplemental tax bill for the difference between the previous owner assessed value (under Prop 13) and your new purchase price. For example, if the previous owner had been in the home for 20 years and was paying taxes on a $300,000 assessment, your supplemental bill covers the difference between that and your $750,000 purchase price for the remainder of the tax year. Budget for this one-time supplemental bill in your first year of homeownership — it can be several thousand dollars.',
      },
    ],
    citations: [
      { source: 'CalHFA Homebuyer Programs', url: 'https://www.calhfa.ca.gov/homebuyer/' },

      { source: 'CFPB — Mortgage Payment Calculator Methodology', url: 'https://www.consumerfinance.gov/owning-a-home/' },
    ],
  },
};
export default caMortgageConfig;
