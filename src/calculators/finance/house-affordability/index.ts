import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import HouseAffordabilityPanel from './HouseAffordabilityPanel';
import { solveAffordability, parseDtiLimit, DEFAULT_PROPERTY_TAX_PCT, DEFAULT_INSURANCE_ANNUAL } from '../../../utils/affordability';
import { affordabilitySteps } from '../../../utils/affordabilitySteps';
import { finiteSteps } from '../../../utils/explainGuard';

const houseAffordabilitySvg = '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="4"/><text x="160" y="14" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">House Affordability: DTI Approach</text><g transform="translate(15,22)"><rect x="10" y="5" width="280" height="24" rx="4" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="150" y="21" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--svg-1e40af)">Monthly Income: $8,333</text><line x1="150" y1="29" x2="150" y2="36" stroke="var(--svg-64748b)" stroke-width="1.2"/><rect x="10" y="36" width="100" height="22" rx="4" fill="var(--svg-22c55e)"/><text x="60" y="51" text-anchor="middle" font-size="7" font-weight="bold" fill="var(--svg-ffffff)">Front cap: $2,333</text><text x="60" y="64" text-anchor="middle" font-size="6" fill="var(--svg-64748b)">28% Front-End DTI</text><rect x="120" y="36" width="70" height="22" rx="4" fill="var(--svg-f59e0b)"/><text x="155" y="51" text-anchor="middle" font-size="7" font-weight="bold" fill="var(--svg-ffffff)">Back cap: $2,500</text><text x="155" y="64" text-anchor="middle" font-size="6" fill="var(--svg-64748b)">36% less $500 debts</text><text x="200" y="51" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-64748b)">&rarr;</text><rect x="215" y="36" width="75" height="22" rx="4" fill="var(--svg-8b5cf6)"/><text x="252" y="51" text-anchor="middle" font-size="7" font-weight="bold" fill="var(--svg-ffffff)">Housing: $2,333</text><rect x="10" y="75" width="280" height="40" rx="6" fill="var(--svg-f1f5f9)"/><text x="150" y="90" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-1e293b)">PITI = P&amp;I + Taxes + Insurance</text><rect x="25" y="96" width="72" height="14" rx="3" fill="var(--svg-3b82f6)"/><text x="61" y="106" text-anchor="middle" font-size="6" font-weight="bold" fill="var(--svg-ffffff)">P&amp;I ~$1,887</text><rect x="105" y="96" width="55" height="14" rx="3" fill="var(--svg-f59e0b)"/><text x="132" y="106" text-anchor="middle" font-size="6" font-weight="bold" fill="var(--svg-ffffff)">Tax ~$322</text><rect x="168" y="96" width="55" height="14" rx="3" fill="var(--svg-ef4444)"/><text x="195" y="106" text-anchor="middle" font-size="6" font-weight="bold" fill="var(--svg-ffffff)">Ins ~$125</text><text x="248" y="106" font-size="8" font-weight="bold" fill="var(--svg-22c55e)">Max: $351K</text><rect x="10" y="122" width="280" height="34" rx="6" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="0.5"/><text x="150" y="138" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--svg-b45309)">The 28/36 Rule</text><text x="80" y="152" text-anchor="middle" font-size="6" fill="var(--svg-64748b)">Housing cost &le; 28% of income</text><text x="235" y="152" text-anchor="middle" font-size="6" fill="var(--svg-64748b)">All debts &le; 36% of income</text><rect x="10" y="164" width="280" height="26" rx="6" fill="var(--svg-f1f5f9)"/><text x="150" y="178" text-anchor="middle" font-size="7" fill="var(--svg-475569)">Housing = lower of (Income x 28%) and (Income x 36% - Debts)</text><text x="150" y="189" text-anchor="middle" font-size="6" fill="var(--svg-64748b)">Solve for price: loan + down payment, tax grows with price</text></svg>';

const houseAffordabilityConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'annualIncome',
      label: 'Annual Gross Income',
      type: 'number',
      placeholder: '100,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Combined household gross income before taxes',
    },
    {
      id: 'monthlyDebts',
      label: 'Total Monthly Debt Payments',
      type: 'number',
      placeholder: '500',
      prefix: '$',
      min: 0,
      step: 50,
      helpText: 'Auto loans, student loans, minimum credit card payments, personal loans, and other recurring monthly obligations.',
    },
    {
      id: 'downPayment',
      label: 'Down Payment Available',
      type: 'number',
      placeholder: '60,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Cash you have saved for the upfront down payment on a home.',
    },
    {
      id: 'dtiLimit',
      label: 'DTI Target Limit',
      type: 'select',
      required: true,
      options: [
        { label: 'Conservative — 28% back-end (Safe, easy approval)', value: '28' },
        { label: 'Moderate — 36% back-end (28/36 rule)', value: '36' },
        { label: 'Aggressive — 43% back-end (FHA standard, 31/43)', value: '43' },
        { label: 'Custom', value: 'custom' },
      ],
      helpText: 'Maximum total debt-to-income ratio (housing + other debts). The housing-only (front-end) cap is paired automatically: 28% up to 36%, 31% up to 43%, 36% above.',
    },
    {
      id: 'customDti',
      label: 'Custom Back-End DTI Limit (%)',
      type: 'number',
      placeholder: '40',
      unit: '%',
      min: 10,
      max: 60,
      step: 0.5,
      helpText: 'Only used if Custom DTI is selected above',
    },
    {
      id: 'interestRate',
      label: 'Interest Rate',
      type: 'number',
      placeholder: '6.75',
      unit: '%',
      min: 0,
      max: 25,
      step: 0.01,
      required: true,
      helpText: 'Current mortgage interest rate offered by your lender.',
    },
    {
      id: 'loanTerm',
      label: 'Loan Term',
      type: 'select',
      required: true,
      options: [
        { label: '30-Year Fixed', value: '30' },
        { label: '20-Year Fixed', value: '20' },
        { label: '15-Year Fixed', value: '15' },
        { label: '10-Year Fixed', value: '10' },
      ],
      helpText: 'Length of the mortgage — shorter terms have higher payments but less interest.',
    },
    {
      id: 'propertyTax',
      label: 'Property Tax Rate (optional)',
      type: 'number',
      placeholder: '1.1',
      unit: '%',
      min: 0,
      max: 5,
      step: 0.01,
      helpText: 'Annual property tax as a % of home value. Blank = 1.1% (US average).',
    },
    {
      id: 'homeInsurance',
      label: 'Annual Home Insurance (optional)',
      type: 'number',
      placeholder: '1,500',
      prefix: '$',
      min: 0,
      step: 100,
      helpText: 'Annual homeowners insurance premium. Blank = $1,500.',
    },
    {
      id: 'pmiRate',
      label: 'PMI Rate (optional)',
      type: 'number',
      placeholder: '0.8',
      unit: '%',
      min: 0,
      max: 3,
      step: 0.05,
      helpText: 'Annual PMI as a % of the loan, charged only when the down payment is under 20% (typically 0.3–1.5%). Blank = PMI not modelled.',
    },
  ],
  calculate: (values) => {
    const annualIncome = parseFloat(values.annualIncome);
    const interestRate = parseFloat(values.interestRate) / 100;
    const loanTermYears = parseFloat(values.loanTerm || '30');
    const limitRaw = values.dtiLimit === 'custom' ? values.customDti : values.dtiLimit || '36';
    const { front, back } = parseDtiLimit(limitRaw);

    if ([annualIncome, interestRate, loanTermYears].some(isNaN) || annualIncome <= 0 || (values.dtiLimit === 'custom' && !(parseFloat(values.customDti) > 0))) return [];

    const taxPct = parseFloat(values.propertyTax);
    const insurance = parseFloat(values.homeInsurance);
    const monthlyDebts = parseFloat(values.monthlyDebts) || 0;
    const sol = solveAffordability({
      annualIncome,
      monthlyDebts,
      downPayment: parseFloat(values.downPayment) || 0,
      annualRate: interestRate,
      years: loanTermYears,
      propertyTaxRate: (isNaN(taxPct) ? DEFAULT_PROPERTY_TAX_PCT : taxPct) / 100,
      insuranceAnnual: isNaN(insurance) ? DEFAULT_INSURANCE_ANNUAL : insurance,
      frontPct: front / 100,
      backPct: back / 100,
      pmiRate: (parseFloat(values.pmiRate) || 0) / 100,
    });

    if (!sol) {
      return [{ id: 'error', label: 'Notice', value: 'At this DTI limit your existing debts and insurance leave no room for a mortgage payment. Reduce debts, raise income, or choose a higher DTI limit.', color: 'negative' as const }];
    }

    const fmtD = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtK = (n: number) =>
      n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

    return [
      {
        id: 'maxHomePrice',
        label: 'Maximum Home Price You Can Afford',
        value: fmtK(sol.maxHomePrice),
        highlight: true,
        color: 'positive' as const,
        interpretation: `This puts your housing at ${sol.frontEndRatio.toFixed(0)}% of gross income and your back-end DTI (all debt including housing) at ${sol.backEndRatio.toFixed(0)}% — lenders typically cap around 43-45%. It's the lender's ceiling, not a comfort level; buying meaningfully below this leaves breathing room for maintenance, rate changes, and life's surprises.`,
      },
      {
        id: 'maxLoan',
        label: 'Maximum Loan Amount',
        value: fmtK(sol.loan),
        color: 'neutral' as const,
      },
      {
        id: 'maxHousingPayment',
        label: 'Total Monthly Housing Payment (PITI)',
        value: `$${fmtD(sol.totalMonthly)}/mo`,
        color: 'neutral' as const,
      },
      {
        id: 'maxPI',
        label: 'Est. Principal & Interest (P&I)',
        value: `$${fmtD(sol.pi)}/mo`,
        color: 'neutral' as const,
      },
      {
        id: 'taxesInsurance',
        label: sol.pmi > 0 ? 'Property Tax, Insurance & PMI' : 'Property Tax & Insurance',
        value: `$${fmtD(sol.tax + sol.insurance + sol.pmi)}/mo`,
        color: 'neutral' as const,
      },
      {
        id: 'downPaymentPct',
        label: 'Down Payment as % of Home Price',
        value: `${sol.downPaymentPct.toFixed(1)}%${sol.downPaymentPct < 20 ? ' — PMI likely required' : ' — No PMI!'}`,
        color: sol.downPaymentPct >= 20 ? 'positive' as const : 'neutral' as const,
      },
      {
        id: 'frontEndDTI',
        label: 'Front-End DTI (Housing Only)',
        value: `${sol.frontEndRatio.toFixed(1)}%`,
        color: sol.frontEndRatio <= 28.05 ? 'positive' as const : 'neutral' as const,
      },
      {
        id: 'backEndDTI',
        label: 'Back-End DTI (All Debts)',
        value: `${sol.backEndRatio.toFixed(1)}%`,
        color: sol.backEndRatio <= 36.05 ? 'positive' as const : 'neutral' as const,
      },
    ];
  },
  explainSteps: (values) => {
    const annualIncome = parseFloat(values.annualIncome);
    const interestRate = parseFloat(values.interestRate) / 100;
    const loanTermYears = parseFloat(values.loanTerm || '30');
    const limitRaw = values.dtiLimit === 'custom' ? values.customDti : values.dtiLimit || '36';
    const { front, back } = parseDtiLimit(limitRaw);
    if ([annualIncome, interestRate, loanTermYears].some(isNaN) || annualIncome <= 0 || (values.dtiLimit === 'custom' && !(parseFloat(values.customDti) > 0))) return [];
    const taxPct = parseFloat(values.propertyTax);
    const insurance = parseFloat(values.homeInsurance);
    const input = {
      annualIncome,
      monthlyDebts: parseFloat(values.monthlyDebts) || 0,
      downPayment: parseFloat(values.downPayment) || 0,
      annualRate: interestRate,
      years: loanTermYears,
      propertyTaxRate: (isNaN(taxPct) ? DEFAULT_PROPERTY_TAX_PCT : taxPct) / 100,
      insuranceAnnual: isNaN(insurance) ? DEFAULT_INSURANCE_ANNUAL : insurance,
      frontPct: front / 100,
      backPct: back / 100,
      pmiRate: (parseFloat(values.pmiRate) || 0) / 100,
    };
    const sol = solveAffordability(input);
    if (!sol) return [];
    const fmtK = (n: number) =>
      n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    return finiteSteps(affordabilitySteps(input, sol, fmtK));
  },
  extraPanel: (values, results) => {
    const annualIncome = parseFloat(values.annualIncome);
    if (!results.length || results[0].id === 'error' || isNaN(annualIncome)) return null;

    return createElement(HouseAffordabilityPanel, {
      annualIncome,
      monthlyDebts: parseFloat(values.monthlyDebts) || 0,
      downPayment: parseFloat(values.downPayment) || 0,
      dtiLimit: values.dtiLimit === 'custom' ? values.customDti : values.dtiLimit || '36',
      interestRate: parseFloat(values.interestRate) / 100,
      loanTermYears: parseFloat(values.loanTerm || '30'),
      propertyTaxPct: parseFloat(values.propertyTax),
      insuranceAnnual: parseFloat(values.homeInsurance),
      pmiPct: parseFloat(values.pmiRate) || 0,
    });
  },
  educational: {
    formula: 'Housing = min(Income × Front %, Income × Back % − Debts)  →  Price = (Housing − Insurance + Down × k) ÷ (k + Tax Rate ÷ 12)',
    diagram: {
      svg: houseAffordabilitySvg,
      alt: 'House affordability flow diagram showing monthly income flowing through the 28% DTI limit, subtracting existing debts, yielding available PITI split into P&I, taxes, and insurance',
      caption: 'Lenders use the 28/36 rule where housing costs should not exceed 28% of income and total debts should not exceed 36% of income to determine borrowing capacity',
    },
    formulaDescription:
      'Working backward from your DTI limit: the housing payment is capped by the lower of the front-end limit (Monthly Income × Front %) and the back-end limit (Monthly Income × Back % − Existing Debts). Property tax and insurance come out of that payment first, and what remains pays principal and interest on the loan. Because property tax is a percentage of the price, the maximum price is solved directly from k, the monthly payment per $1 borrowed. This calculator uses the same engine as the Home Affordability Calculator.',
    variables: [
      { symbol: 'DTI Ratios', name: 'Front-End & Back-End DTI', description: 'Back-end DTI = (all debts including housing) / gross monthly income. Front-end DTI = housing only / income. The 28/36 rule is standard: housing ≤ 28%, all debts ≤ 36%. 43% is the FHA standard back-end limit; some programs approve higher with compensating factors.' },
      { symbol: 'PITI', name: 'Total Housing Payment', description: 'Principal, Interest, Taxes, and Insurance — the four components of the true monthly cost of homeownership. Property tax (default 1.1% of the price per year) and insurance (default $1,500 per year) are estimated separately and come out of the housing payment first.' },
      { symbol: 'PMI', name: 'Private Mortgage Insurance', description: 'Required by lenders when your down payment is less than 20% of the purchase price. It protects the lender (not you) against default and typically costs 0.5-1.5% of the loan amount per year (about $125-$375/month on a $300,000 loan). Enter a PMI rate above to include it in the payment.' },
    ],
    howToUse: [
      'Enter your combined annual household gross income (before taxes and deductions).',
      'Enter all your current monthly debt payments — auto loans, student loans, minimum credit card payments, personal loans.',
      'Enter how much you have available for a down payment — larger down payments reduce or eliminate PMI.',
      'Select your comfort level with debt. Conservative 28% is safest; Moderate 36% is common; Aggressive 43% is the FHA standard limit.',
      'Enter the current mortgage interest rate and desired loan term to see your maximum affordable home price.',
    ],
    commonUses: [
      'Determine the maximum home price you can qualify for based on your income, existing debts, and available down payment.',
      'Compare how different DTI comfort levels — conservative, moderate, or aggressive — affect your home buying budget.',
      'Plan your home search by understanding how interest rates and loan terms translate into a maximum affordable purchase price.',
    ],
    explanation:
      'This calculator works backward from your income — the same approach lenders use when evaluating mortgage applications. The key number is the back-end DTI, which measures all your monthly debts (including the proposed mortgage payment) as a percentage of gross monthly income. A 36% back-end DTI on a $100,000 annual income means you can have $3,000/month in total debt payments. If you already pay $500 in existing debts, the back-end limit leaves $2,500 for housing, but the 28% front-end limit caps housing at $2,333, so $2,333 is the budget. Property tax and insurance are taken out of that (about $322 and $125 per month at the defaults on a $351,000 home), leaving about $1,887 for principal and interest. That payment is then reversed through the mortgage formula to give the maximum loan and, with your down payment, the maximum home price (about $351,000 with $60,000 down at 6.75% over 30 years).',
    faqs: [
      {
        question: 'What is the 28/36 rule?',
        answer: 'This is a traditional lender guideline stating that your housing payment should not exceed 28% of gross monthly income (front-end ratio), and all debt payments combined should not exceed 36% of gross income (back-end ratio). While government-backed loans like FHA may allow up to 43% DTI, following the 28/36 rule provides a financial cushion and significantly reduces the risk of becoming "house-poor" — where most of your income goes to housing costs with little left for savings, emergencies, and other goals.',
      },
      {
        question: 'Does this include property taxes and insurance?',
        answer: 'Yes. It uses the property tax rate and annual insurance premium you enter (defaults: 1.1% of the home price and $1,500 per year) and subtracts them from your housing budget before sizing the loan. Actual property tax rates vary significantly by location — from under 0.5% of home value annually in some areas to over 2.5% in others — so look up your county rate and get an insurance quote for the specific property.',
      },
      {
        question: 'What is PMI and when can I avoid it?',
        answer: 'Private Mortgage Insurance protects the lender (not you) when your down payment is less than 20% of the purchase price. It typically costs 0.5-1.5% of the loan amount per year (about $125-$375/month on a $300,000 loan). You can avoid PMI by saving a 20% down payment, using a conventional loan with a "piggyback" second mortgage (80/10/10 structure), or using certain loan programs like VA loans which do not require PMI.',
      },
      {
        question: 'Should I max out what the calculator allows?',
        answer: 'Not necessarily. The calculator shows the maximum loan amount the bank would approve, not what is most comfortable for your lifestyle. Lenders may approve you at 43% DTI, but many financial advisors suggest targeting 28-33% to maintain flexibility for retirement savings, emergencies, travel, and other life goals. Consider your full financial picture, not just the approval maximum.',
      },
      {
        question: 'How much should I put down on a house?',
        answer: 'The traditional recommendation is 20% to avoid PMI, but many buyers put down less. FHA loans allow as little as 3.5% down, and conventional loans may allow 3-5% for qualified buyers. A larger down payment means lower monthly payments, less total interest, and no PMI. However, it is also important to keep an emergency fund after closing — depleting all savings for a down payment can be risky.',
      },
    ],
    citations: [
      { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
      { source: 'Federal Housing Finance Agency', url: 'https://www.fhfa.gov' },
    ],
  },
};

export default houseAffordabilityConfig;
