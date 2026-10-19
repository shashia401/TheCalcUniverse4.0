import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import HomeAffordabilityPanel from './HomeAffordabilityPanel';

import { solveAffordability, parseDtiLimit, DEFAULT_PROPERTY_TAX_PCT, DEFAULT_INSURANCE_ANNUAL } from '../../../utils/affordability';
import { affordabilitySteps } from '../../../utils/affordabilitySteps';
import { finiteSteps } from '../../../utils/explainGuard';

const homeAffordabilityConfig: CalculatorConfig = {
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
      helpText: 'Your total household gross income before taxes',
    },
    {
      id: 'monthlyDebts',
      label: 'Monthly Debt Payments',
      type: 'number',
      placeholder: '500',
      prefix: '$',
      inputMode: 'decimal',
      min: 0,
      step: 50,
      required: true,
      helpText: 'Car loans, student loans, credit cards, and other monthly debt obligations',
    },
    {
      id: 'downPayment',
      label: 'Down Payment',
      type: 'number',
      placeholder: '60,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Total cash available for your down payment',
    },
    {
      id: 'interestRate',
      label: 'Mortgage Interest Rate',
      type: 'number',
      placeholder: '6.75',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 30,
      step: 0.01,
      required: true,
      helpText: 'Current 30-year fixed mortgage rate from your lender',
    },
    {
      id: 'loanTerm',
      label: 'Loan Term',
      type: 'select',
      required: true,
      helpText: 'Number of years to repay the mortgage',
      options: [
        { label: '30 years', value: '30' },
        { label: '20 years', value: '20' },
        { label: '15 years', value: '15' },
        { label: '10 years', value: '10' },
      ],
    },
    {
      id: 'propertyTax',
      label: 'Property Tax Rate',
      type: 'number',
      placeholder: '1.2',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 5,
      step: 0.01,
      required: false,
      helpText: 'Annual property tax as a percentage of home value (US average ~1.1%)',
    },
    {
      id: 'homeInsurance',
      label: 'Annual Home Insurance',
      type: 'number',
      placeholder: '1,500',
      prefix: '$',
      min: 0,
      step: 100,
      required: false,
      helpText: 'Annual homeowners insurance premium',
    },
    {
      id: 'pmiRate',
      label: 'PMI Rate (optional)',
      type: 'number',
      placeholder: '0.8',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 3,
      step: 0.05,
      required: false,
      helpText: 'Annual private mortgage insurance as a % of the loan, charged only when down payment is under 20% (typically 0.3–1.5%). Leave blank to exclude PMI.',
    },
    {
      id: 'dtiLimit',
      label: 'DTI Limit',
      type: 'select',
      required: false,
      helpText: 'Maximum debt-to-income ratio lenders will approve (28/36 rule is standard)',
      options: [
        { label: '28% front-end / 36% back-end (Conservative)', value: '28/36' },
        { label: '31% front-end / 43% back-end (FHA Standard)', value: '31/43' },
        { label: '36% front-end / 45% back-end (Moderate)', value: '36/45' },
        { label: '43% front-end / 50% back-end (Aggressive)', value: '43/50' },
      ],
    },
  ],
  calculate: (values) => {
    const annualIncome = parseFloat(values.annualIncome);
    const annualRate = parseFloat(values.interestRate) / 100;
    if (isNaN(annualIncome) || isNaN(annualRate) || annualIncome <= 0) return [];

    const taxPct = parseFloat(values.propertyTax);
    const insurance = parseFloat(values.homeInsurance);
    const { front: frontPct, back: backPct } = parseDtiLimit(values.dtiLimit);

    const sol = solveAffordability({
      annualIncome,
      monthlyDebts: parseFloat(values.monthlyDebts) || 0,
      downPayment: parseFloat(values.downPayment) || 0,
      annualRate,
      years: parseFloat(values.loanTerm || '30'),
      propertyTaxRate: (isNaN(taxPct) ? DEFAULT_PROPERTY_TAX_PCT : taxPct) / 100,
      insuranceAnnual: isNaN(insurance) ? DEFAULT_INSURANCE_ANNUAL : insurance,
      frontPct: frontPct / 100,
      backPct: backPct / 100,
      pmiRate: (parseFloat(values.pmiRate) || 0) / 100,
    });
    if (!sol) {
      return [{ id: 'error', label: 'Notice', value: 'At these limits your existing debts and insurance leave no room for a mortgage payment. Reduce debts, raise income, or choose a higher DTI limit.', color: 'negative' as const }];
    }

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const fmt2 = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return [
      {
        id: 'maxHomePrice',
        label: 'Maximum Home Price',
        value: `$${fmt(sol.maxHomePrice)}`,
        highlight: true,
        color: 'positive',
        interpretation: `This is a ceiling, not a recommendation — it puts your total housing at ${sol.frontEndRatio.toFixed(0)}% of gross income and total debt at ${sol.backEndRatio.toFixed(0)}%. Lenders cap the back-end near 43%; buying below this leaves room for maintenance, emergencies, and rate changes the formula can't see.`,
      },
      {
        id: 'maxLoanAmount',
        label: 'Maximum Loan Amount',
        value: `$${fmt(sol.loan)}`,
        color: 'neutral',
      },
      {
        id: 'estimatedMonthlyPayment',
        label: 'Est. Monthly Payment (P&I)',
        value: `$${fmt2(sol.pi)}`,
        color: 'neutral',
      },
      {
        id: 'totalMonthlyHousing',
        label: 'Total Monthly Housing Cost',
        value: `$${fmt2(sol.totalMonthly)}`,
        color: 'neutral',
      },
      {
        id: 'frontEndDTI',
        label: 'Front-End DTI Ratio',
        value: `${sol.frontEndRatio.toFixed(1)}% (limit: ${frontPct}%)`,
        color: sol.frontEndRatio <= frontPct + 0.05 ? 'positive' : 'negative',
      },
      {
        id: 'backEndDTI',
        label: 'Back-End DTI Ratio',
        value: `${sol.backEndRatio.toFixed(1)}% (limit: ${backPct}%)`,
        color: sol.backEndRatio <= backPct + 0.05 ? 'positive' : 'negative',
      },
      {
        id: 'downPaymentPct',
        label: 'Down Payment Percentage',
        value: `${sol.downPaymentPct.toFixed(1)}%`,
        color: sol.downPaymentPct >= 20 ? 'positive' : 'negative',
      },
    ];
  },
  explainSteps: (values) => {
    const annualIncome = parseFloat(values.annualIncome);
    const annualRate = parseFloat(values.interestRate) / 100;
    if (isNaN(annualIncome) || isNaN(annualRate) || annualIncome <= 0) return [];
    const taxPct = parseFloat(values.propertyTax);
    const insurance = parseFloat(values.homeInsurance);
    const { front: frontPct, back: backPct } = parseDtiLimit(values.dtiLimit);
    const input = {
      annualIncome,
      monthlyDebts: parseFloat(values.monthlyDebts) || 0,
      downPayment: parseFloat(values.downPayment) || 0,
      annualRate,
      years: parseFloat(values.loanTerm || '30'),
      propertyTaxRate: (isNaN(taxPct) ? DEFAULT_PROPERTY_TAX_PCT : taxPct) / 100,
      insuranceAnnual: isNaN(insurance) ? DEFAULT_INSURANCE_ANNUAL : insurance,
      frontPct: frontPct / 100,
      backPct: backPct / 100,
      pmiRate: (parseFloat(values.pmiRate) || 0) / 100,
    };
    const sol = solveAffordability(input);
    if (!sol) return [];
    return finiteSteps(
      affordabilitySteps(input, sol, (n) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`)
    );
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(HomeAffordabilityPanel, { values, results });
  },
  educational: {
    formula: 'Housing = min(Income × Front %, Income × Back % − Debts)  →  Price = (Housing − Insurance + Down × k) ÷ (k + Tax Rate ÷ 12)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">Home Affordability — The DTI Framework</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Front-end and back-end ratios determine your maximum home price</text><g transform="translate(30,60)"><!-- Income bar --><rect x="40" y="0" width="360" height="35" rx="6" fill="var(--svg-dbeafe)"/><text x="220" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e40af)">Monthly Gross Income: $8,333</text><!-- Front-end DTI bar (28%) coming off income --><rect x="40" y="48" width="240" height="35" rx="6" fill="var(--svg-22c55e)"/><text x="160" y="72" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ffffff)">28% Front-End: $2,333/mo for housing</text><!-- Back-end DTI bar (36%) showing housing + debts --><rect x="40" y="96" width="300" height="35" rx="6" fill="var(--svg-8b5cf6)"/><text x="190" y="120" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ffffff)">36% Back-End: $3,000/mo total (housing + debts)</text><!-- Limiter arrow showing which is stricter --><text x="220" y="160" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e293b)">← Front-End (28%) sets the limit when debts are low →</text><text x="220" y="174" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Back-End (36%) sets the limit when debts are high</text><!-- House icon with price --><polygon points="220,185 270,200 270,215 170,215 170,200" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="1.5"/><rect x="180" y="215" width="80" height="15" rx="2" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="1"/><rect x="195" y="230" width="50" height="20" rx="2" fill="var(--svg-f1f5f9)"/><text x="220" y="252" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Max Home Price: ~$351K</text></g><g transform="translate(40,280)"><rect x="10" y="0" width="370" height="48" rx="10" fill="var(--svg-f1f5f9)"/><text x="195" y="16" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e293b)">Affordability Breakdown</text><text x="100" y="34" font-size="9" fill="var(--svg-3b82f6)">P&amp;I: $1,887</text><text x="170" y="34" font-size="9" fill="var(--svg-22c55e)">Taxes: $322</text><text x="250" y="34" font-size="9" fill="var(--svg-8b5cf6)">Insurance: $125</text><text x="325" y="34" font-size="9" fill="var(--svg-ef4444)">Total: $2,333</text></g></svg>',
      alt: 'Home affordability diagram showing monthly income, front-end DTI housing limit, back-end DTI total debt limit, and the maximum home price calculation',
      caption: 'Your maximum home price is determined by the stricter of front-end (housing only) and back-end (housing + debts) DTI limits',
    },
    formulaDescription:
      'Home affordability is determined by two DTI limits: front-end (housing costs ÷ gross income) and back-end (all debts ÷ gross income). The stricter of the two sets your maximum monthly payment (PITI: principal and interest, property tax, insurance, plus PMI if you enter a PMI rate and put down less than 20%). Property tax grows with the price, so the price is solved directly: Price = (Housing − Insurance + Down × k) ÷ (k + Tax Rate ÷ 12), where k is the monthly payment per $1 borrowed.',
    variables: [
      { symbol: 'Front-End DTI', name: 'Housing Ratio', description: 'Monthly housing costs (P&I + taxes + insurance) as a percentage of gross monthly income. Typically capped at 28%.' },
      { symbol: 'Back-End DTI', name: 'Total Debt Ratio', description: 'All monthly debt payments including housing, as a percentage of gross monthly income. Typically capped at 36–43%.' },
      { symbol: 'P&I', name: 'Principal & Interest', description: 'The core mortgage payment calculated from the loan amount, interest rate, and term.' },
      { symbol: 'GDS', name: 'Gross Debt Service', description: 'Another term for front-end DTI, used commonly in Canada and the UK.' },
    ],
    howToUse: [
      'Enter your total household gross annual income before taxes.',
      'Enter all current monthly debt payments (car, student loans, credit cards).',
      'Enter your available down payment — more down means a larger home you can afford.',
      'Enter the current mortgage interest rate and your preferred loan term.',
      'Optionally adjust property tax, insurance, and DTI limit for your situation.',
      'Review your maximum home price, loan amount, and DTI ratios.',
    ],
    commonUses: [
      'Determine the maximum home price you can afford based on your household income, down payment, and current debt obligations.',
      'Understand how different down payment amounts and interest rates affect your monthly mortgage payment and total borrowing power.',
      'Apply the 28/36 debt-to-income rule to find a comfortable price range that avoids becoming house-poor.',
    ],
    explanation:
      'Home affordability is governed by your debt-to-income (DTI) ratio — the percentage of your gross income that goes toward debt payments. Most conventional lenders use the 28/36 rule: no more than 28% of gross income on housing costs and no more than 36% on total debts. FHA loans are more lenient, allowing up to 31%/43%. The lower of the two limits (front vs. back end) determines your true maximum. Down payment also plays a major role: a larger down payment reduces your loan amount, which lowers monthly payments and allows you to afford a more expensive home.',
    faqs: [
      {
        question: 'What is the 28/36 rule?',
        answer: 'The 28/36 rule is the classic affordability guideline: spend no more than 28% of gross monthly income on housing costs (front-end), and no more than 36% on all debt payments combined (back-end). Many lenders use this as a baseline for conventional loan approval.',
      },
      {
        question: 'Does the calculator include PMI?',
        answer: 'Optionally. Enter an annual PMI rate (typically 0.3–1.5% of the loan, depending on credit score and loan product) and the calculator adds PMI to the monthly housing cost whenever your down payment is under 20% of the price, which lowers the price you can afford. Leave it blank to exclude PMI.',
      },
      {
        question: 'How does income affect how much house I can afford?',
        answer: 'Higher income directly increases your maximum monthly payment, which drives up the maximum loan amount and home price. Doubling income roughly doubles buying power, assuming debts remain constant.',
      },
      {
        question: 'Should I borrow the maximum the lender will give me?',
        answer: 'Not necessarily. Lender maximums are based on qualifying ratios, not on your actual lifestyle expenses. Many financial advisors recommend staying at or below 25% of gross income on housing to preserve financial flexibility for savings, emergencies, and other goals.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
    
    workedExamples: [
      {
        scenario: 'Amanda, a single first-time homebuyer in Austin, TX earning $92,000/year, has $45,000 saved for a down payment. She has a $400/month car loan and $150/month in student loan payments. She is looking at 30-year fixed mortgages at 6.75% with property taxes at 1.8% (Texas average) and $1,800/year in homeowners insurance. She uses the standard 28/36 DTI limits.',
        inputs: { annualIncome: '92000', monthlyDebts: '550', downPayment: '45000', interestRate: '6.75', loanTerm: '30', propertyTax: '1.8', homeInsurance: '1800', dtiLimit: '28/36' },
        result: 'Maximum home price: approximately $286,569. Maximum loan amount: $241,569. Estimated monthly P&I: $1,567. Total monthly housing cost (P&I + taxes + insurance): $2,147. Front-end DTI: 28.0% — this is the binding constraint. Back-end DTI: 35.2% (under the 36% limit, with room to spare). Down payment: 15.7% — below 20%, so PMI will apply.',
        insight: 'Amanda\'s front-end DTI is the binding constraint here, not her back-end — her $550/month in existing debt keeps her comfortably under the back-end cap (35.2% vs. the 36% limit), so her housing budget is actually set by the 28% front-end rule alone. Paying off her car loan wouldn\'t raise her max home price at all in this scenario, because the front-end limit (28% of income) constrains her regardless of her other debts. Her down payment is strong at nearly 16% but falls short of the 20% threshold to avoid PMI, which would add roughly $100-$300/month at a 0.5–1.5% PMI rate (enter a PMI rate above to see the lower price that results). She should compare the result with local listing prices and, if needed, increase her down payment or look at condos or townhouses.',
      },
      {
        scenario: 'Raj and Priya Patel in Chicago, IL are a married couple with a combined income of $175,000. They have saved $120,000 for a down payment and have $800/month in combined debt (two car payments). They are considering a 15-year fixed mortgage at 6.25% to pay off their home faster. Illinois property taxes are 2.1% and home insurance runs $2,200/year. They use the conservative 28/36 DTI limits.',
        inputs: { annualIncome: '175000', monthlyDebts: '800', downPayment: '120000', interestRate: '6.25', loanTerm: '15', propertyTax: '2.1', homeInsurance: '2200', dtiLimit: '28/36' },
        result: 'Maximum home price: approximately $477,412. Maximum loan amount: $357,412. Estimated monthly P&I: $3,065. Total monthly housing cost: $4,083. Front-end DTI: 28.0% — the binding constraint (their $800/month in other debt leaves plenty of back-end room, so the 28% housing-only cap is what limits them). Down payment: 25.1% — above 20%, no PMI required.',
        insight: 'The Patels chose a 15-year mortgage to save on interest, but the shorter term dramatically increases their monthly P&I compared to a 30-year loan. Because their total housing budget is fixed by the 28% front-end rule ($4,083/month) regardless of loan term, switching terms doesn\'t change that budget — it only changes how much loan a fixed $4,083/month payment can support. On a 30-year term at the same rate, that same $4,083/month payment supports a smaller monthly P&I ($2,873) but a larger loan, pushing their maximum home price up to about $586,665. This example highlights that loan term reshapes affordability by changing how much loan a given payment buys — not by changing the underlying DTI-driven budget. The Patels might prefer the 30-year term for the larger home price and lower required payment, adding extra principal payments voluntarily to still pay it off faster.',
      },
    ],

    proTips: [
      'Lender approval is not the same as affordability. Just because a bank will lend you $500,000 does not mean you should borrow that much. Budget for maintenance (1-2% of home value annually), utilities, and furnishing costs — lenders do not include these in DTI calculations, but you certainly should.',
      'A 15-year mortgage saves tens of thousands in interest but significantly reduces your maximum home price because monthly payments are much higher. Many buyers are better served by a 30-year mortgage with voluntary extra principal payments — you get the flexibility to scale back payments if needed.',
      'Property taxes vary dramatically by location and are often the surprise expense that breaks a budget. Illinois and New Jersey (roughly 2% or more) have some of the highest effective rates; Hawaii and Colorado (well under 1%) are among the lowest. Always verify the exact tax rate for the specific property — not the county average.',
      'PMI (Private Mortgage Insurance) on conventional loans with less than 20% down typically costs 0.5-1.5% of the loan amount annually. On a $300,000 loan, that is $125-$375/month. Enter a PMI rate above to include it; with it, a down payment under 20% lowers the maximum price.',
    ],

    quickReference: [
      { label: '28/36 Rule', value: '28% of gross income on housing (front-end), 36% on all debts (back-end) — conventional loan standard' },
      { label: '31/43 Rule (FHA)', value: '31% front-end, 43% back-end — FHA loan qualifying ratios' },
      { label: 'Front-End DTI Formula', value: '(P&I + Property Tax + Insurance + HOA) ÷ Monthly Gross Income' },
      { label: 'Back-End DTI Formula', value: '(All Housing Costs + All Monthly Debts) ÷ Monthly Gross Income' },
      { label: 'Average Property Tax (US)', value: '~1.1% of home value annually (the default here) — much lower in Hawaii, over 2% in New Jersey and Illinois' },
      { label: 'PMI Cost (Below 20% Down)', value: '0.5-1.5% of loan amount annually = $125-$375/month on a $300K loan' },
      { label: 'Maintenance Budget Rule', value: '1-2% of home value per year for repairs and maintenance (not in DTI calculations but essential for affordability)' },
    ],

    limitations: [
      'PMI is only included if you enter a PMI rate; leave it blank and a down payment under 20% will overstate what you can afford. PMI varies with credit score and loan size, and FHA mortgage insurance premiums work differently.',
      'It estimates maximum affordability based on DTI ratios alone. Real lender approval considers additional factors: credit score (minimum 620 for conventional, 580 for FHA), employment history (2+ years), cash reserves (2-6 months of payments), and the specific property\'s condition and appraisal value.',
      'HOA fees, special assessments, flood insurance (required in designated flood zones), and earthquake insurance are not modeled. In high-HOA areas, condo or townhouse fees of $300-$600/month can consume 10-15% of the DTI budget — a critical omission for condo buyers.',
      'Property tax and insurance use flat estimates (a % of price and a yearly premium); real bills vary by county and change over time.',
    ],
citations: [
      { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
      { source: 'Federal Housing Finance Agency', url: 'https://www.fhfa.gov' },
    ],
  },
};

export default homeAffordabilityConfig;
