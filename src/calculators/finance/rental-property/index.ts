import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import RentalWaterfallPanel from './RentalWaterfallPanel';
import { STATE_TAX_RATES } from './utils';

const rentalPropertyConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'purchasePrice',
      label: 'Purchase Price',
      type: 'number',
      placeholder: '350,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Total acquisition price of the property',
    },
    {
      id: 'downPayment',
      label: 'Down Payment',
      type: 'number',
      placeholder: '70,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Cash down payment (investment properties typically require 20–25%)',
    },
    {
      id: 'closingCosts',
      label: 'Closing Costs & Repairs',
      type: 'number',
      placeholder: '10,000',
      prefix: '$',
      min: 0,
      step: 500,
      required: false,
      helpText: 'Upfront closing costs, inspections, and any initial repairs',
    },
    {
      id: 'interestRate',
      label: 'Mortgage Interest Rate',
      type: 'number',
      placeholder: '7.25',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 30,
      step: 0.01,
      required: true,
      helpText: 'Annual mortgage interest rate for investment property loan',
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
      ],
    },
    {
      id: 'monthlyRent',
      label: 'Monthly Gross Rent',
      type: 'number',
      placeholder: '2,500',
      prefix: '$',
      min: 0,
      step: 50,
      required: true,
      helpText: 'Total monthly rental income at full occupancy',
    },
    {
      id: 'vacancyRate',
      label: 'Vacancy Rate',
      type: 'number',
      placeholder: '5',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 100,
      step: 1,
      required: false,
      helpText: 'Expected percentage of time the property sits vacant (national average ~5–8%)',
    },
    {
      id: 'propertyTaxState',
      label: 'Property Tax by State',
      type: 'select',
      required: false,
      helpText: 'Select a state to auto-fill the average effective property tax rate. Select "Custom" to enter manually below.',
      options: [
        { label: '— Custom (enter below)', value: 'custom' },
        { label: 'Alabama (0.41%)', value: 'al' },
        { label: 'Alaska (0.96%)', value: 'ak' },
        { label: 'Arizona (0.66%)', value: 'az' },
        { label: 'Arkansas (0.62%)', value: 'ar' },
        { label: 'California (0.76%)', value: 'ca' },
        { label: 'Colorado (0.55%)', value: 'co' },
        { label: 'Connecticut (1.79%)', value: 'ct' },
        { label: 'Delaware (0.58%)', value: 'de' },
        { label: 'Florida (0.81%)', value: 'fl' },
        { label: 'Georgia (0.81%)', value: 'ga' },
        { label: 'Hawaii (0.31%)', value: 'hi' },
        { label: 'Idaho (0.69%)', value: 'id' },
        { label: 'Illinois (1.95%)', value: 'il' },
        { label: 'Indiana (0.76%)', value: 'in' },
        { label: 'Iowa (1.32%)', value: 'ia' },
        { label: 'Kansas (1.32%)', value: 'ks' },
        { label: 'Kentucky (0.84%)', value: 'ky' },
        { label: 'Louisiana (0.53%)', value: 'la' },
        { label: 'Maine (1.28%)', value: 'me' },
        { label: 'Maryland (1.02%)', value: 'md' },
        { label: 'Massachusetts (1.12%)', value: 'ma' },
        { label: 'Michigan (1.43%)', value: 'mi' },
        { label: 'Minnesota (1.11%)', value: 'mn' },
        { label: 'Mississippi (0.65%)', value: 'ms' },
        { label: 'Missouri (0.93%)', value: 'mo' },
        { label: 'Montana (0.78%)', value: 'mt' },
        { label: 'Nebraska (1.49%)', value: 'ne' },
        { label: 'Nevada (0.54%)', value: 'nv' },
        { label: 'New Hampshire (1.53%)', value: 'nh' },
        { label: 'New Jersey (2.13%)', value: 'nj' },
        { label: 'New Mexico (0.66%)', value: 'nm' },
        { label: 'New York (1.40%)', value: 'ny' },
        { label: 'North Carolina (0.72%)', value: 'nc' },
        { label: 'North Dakota (0.95%)', value: 'nd' },
        { label: 'Ohio (1.40%)', value: 'oh' },
        { label: 'Oklahoma (0.81%)', value: 'ok' },
        { label: 'Oregon (0.93%)', value: 'or' },
        { label: 'Pennsylvania (1.31%)', value: 'pa' },
        { label: 'Rhode Island (1.33%)', value: 'ri' },
        { label: 'South Carolina (0.55%)', value: 'sc' },
        { label: 'South Dakota (1.24%)', value: 'sd' },
        { label: 'Tennessee (0.65%)', value: 'tn' },
        { label: 'Texas (1.63%)', value: 'tx' },
        { label: 'Utah (0.60%)', value: 'ut' },
        { label: 'Vermont (1.70%)', value: 'vt' },
        { label: 'Virginia (0.78%)', value: 'va' },
        { label: 'Washington (0.91%)', value: 'wa' },
        { label: 'West Virginia (0.60%)', value: 'wv' },
        { label: 'Wisconsin (1.55%)', value: 'wi' },
        { label: 'Wyoming (0.57%)', value: 'wy' },
      ],
    },
    {
      id: 'propertyTax',
      label: 'Annual Property Tax ($)',
      type: 'number',
      placeholder: '4,200',
      prefix: '$',
      min: 0,
      step: 100,
      required: false,
      helpText: 'Annual property tax. If a state is selected above, this is auto-calculated. Override manually if needed.',
      showWhen: (v) => v.propertyTaxState === 'custom',
    },
    {
      id: 'insurance',
      label: 'Annual Landlord Insurance',
      type: 'number',
      placeholder: '1,800',
      prefix: '$',
      min: 0,
      step: 100,
      required: false,
      helpText: 'Annual landlord/rental property insurance premium (typically $100–$200/month)',
    },
    {
      id: 'hoaFees',
      label: 'Monthly HOA Fees',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      inputMode: 'decimal',
      min: 0,
      step: 10,
      required: false,
      helpText: 'Critical for condos and planned communities. HOA fees can significantly impact cash flow — enter monthly amount.',
    },
    {
      id: 'maintenancePct',
      label: 'Maintenance & CapEx Buffer',
      type: 'number',
      placeholder: '10',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 50,
      step: 0.5,
      required: false,
      helpText: 'Annual maintenance and capital expenditure reserve as % of gross rent (rule of thumb: 10–15%)',
    },
    {
      id: 'propertyMgmtPct',
      label: 'Property Management Fee',
      type: 'number',
      placeholder: '8',
      unit: '%',
      inputMode: 'decimal',
      min: 0,
      max: 30,
      step: 0.5,
      required: false,
      helpText: 'Monthly property management fee as % of gross rent (leave 0 if self-managing)',
    },
  ],
  calculate: (values) => {
    const purchasePrice = parseFloat(values.purchasePrice);
    const downPayment = parseFloat(values.downPayment) || 0;
    const closingCosts = parseFloat(values.closingCosts) || 0;
    const annualRate = parseFloat(values.interestRate) / 100;
    const years = parseFloat(values.loanTerm || '30');
    const monthlyRent = parseFloat(values.monthlyRent);
    const vacancyRate = parseFloat(values.vacancyRate) / 100 || 0.05;

    // State-based property tax: if state is selected (not custom), auto-calculate
    const stateKey = values.propertyTaxState || 'custom';
    const stateData = STATE_TAX_RATES[stateKey];
    const manualPropTax = parseFloat(values.propertyTax);
    let annualPropertyTax: number;
    let stateRateUsed = 0;
    if (stateKey !== 'custom' && stateData && stateData.rate > 0 && (!manualPropTax || isNaN(manualPropTax) || manualPropTax === 0)) {
      stateRateUsed = stateData.rate;
      annualPropertyTax = purchasePrice * stateRateUsed;
    } else {
      annualPropertyTax = manualPropTax || 0;
    }

    const annualInsurance = parseFloat(values.insurance) || 0;
    const monthlyHOA = parseFloat(values.hoaFees) || 0;
    const annualHOA = monthlyHOA * 12;
    const maintenancePct = parseFloat(values.maintenancePct) / 100 || 0.10;
    const mgmtPct = parseFloat(values.propertyMgmtPct) / 100 || 0;

    if (isNaN(purchasePrice) || isNaN(monthlyRent) || purchasePrice <= 0 || monthlyRent <= 0) return [];

    const loanAmount = purchasePrice - downPayment;
    const totalCashInvested = downPayment + closingCosts;
    const monthlyRate = annualRate / 12;
    const numPayments = years * 12;

    let monthlyMortgage = 0;
    if (loanAmount > 0) {
      if (monthlyRate === 0) {
        monthlyMortgage = loanAmount / numPayments;
      } else {
        monthlyMortgage =
          (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
          (Math.pow(1 + monthlyRate, numPayments) - 1);
      }
    }

    const annualGrossRent = monthlyRent * 12;
    const annualVacancyLoss = annualGrossRent * vacancyRate;
    const effectiveGrossRent = annualGrossRent - annualVacancyLoss;

    const annualMaintenance = annualGrossRent * maintenancePct;
    const annualMgmtFee = effectiveGrossRent * mgmtPct;
    const totalAnnualOpEx =
      annualPropertyTax + annualInsurance + annualHOA + annualMaintenance + annualMgmtFee;

    const noi = effectiveGrossRent - totalAnnualOpEx;
    const annualDebtService = monthlyMortgage * 12;
    const annualCashFlow = noi - annualDebtService;
    const monthlyCashFlow = annualCashFlow / 12;

    const capRate = purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0;
    const cashOnCash = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
    const grossRentMultiplier = monthlyRent > 0 ? purchasePrice / annualGrossRent : 0;
    const dscr = annualDebtService > 0 ? noi / annualDebtService : 0;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtInt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    return [
      {
        id: 'monthlyCashFlow',
        label: 'Monthly Cash Flow',
        value: `${monthlyCashFlow < 0 ? '-' : ''}$${fmt(Math.abs(monthlyCashFlow))}`,
        highlight: true,
        color: monthlyCashFlow >= 0 ? 'positive' : 'negative',
      },
      {
        id: 'annualCashFlow',
        label: 'Annual Cash Flow',
        value: `${annualCashFlow < 0 ? '-' : ''}$${fmtInt(Math.abs(annualCashFlow))}`,
        color: annualCashFlow >= 0 ? 'positive' : 'negative',
      },
      {
        id: 'cashOnCash',
        label: 'Cash-on-Cash Return',
        value: `${cashOnCash.toFixed(2)}%`,
        color: cashOnCash >= 8 ? 'positive' : cashOnCash >= 4 ? 'neutral' : 'negative',
      },
      {
        id: 'capRate',
        label: 'Cap Rate',
        value: `${capRate.toFixed(2)}%`,
        color: capRate >= 6 ? 'positive' : capRate >= 4 ? 'neutral' : 'negative',
      },
      {
        id: 'noi',
        label: 'Net Operating Income (NOI)',
        value: `$${fmtInt(noi)}/yr`,
        color: noi >= 0 ? 'neutral' : 'negative',
      },
      {
        id: 'dscr',
        label: 'Debt Service Coverage Ratio',
        value: `${dscr.toFixed(2)}x`,
        color: dscr >= 1.25 ? 'positive' : dscr >= 1.0 ? 'neutral' : 'negative',
      },
      {
        id: 'grm',
        label: 'Gross Rent Multiplier',
        value: `${grossRentMultiplier.toFixed(1)}x`,
        color: grossRentMultiplier <= 12 ? 'positive' : grossRentMultiplier <= 15 ? 'neutral' : 'negative',
      },
      {
        id: 'monthlyMortgage',
        label: 'Monthly Mortgage Payment',
        value: `$${fmt(monthlyMortgage)}`,
        color: 'neutral',
      },
      {
        id: '_waterfallData',
        label: '_waterfallData',
        value: JSON.stringify({
          monthlyGrossRent: monthlyRent,
          monthlyVacancyLoss: annualVacancyLoss / 12,
          monthlyEffectiveRent: effectiveGrossRent / 12,
          monthlyOpEx: totalAnnualOpEx / 12,
          monthlyNOI: noi / 12,
          monthlyMortgage,
          monthlyCashFlow,
          capRate,
          cashOnCash,
          dscr,
          purchasePrice,
          totalCashInvested,
          monthlyHOA,
          propertyTaxRate: stateRateUsed > 0 ? stateRateUsed : undefined,
          propertyTaxState: stateKey !== 'custom' ? stateKey : undefined,
        }),
      },
      ...(stateRateUsed > 0 ? [{
        id: 'propertyTaxRate',
        label: 'Property Tax Rate Used',
        value: `${(stateRateUsed * 100).toFixed(2)}% (${stateData?.label ?? 'state avg'})`,
        color: 'neutral' as const,
      }] : []),
    ];
  },
  extraPanel: (values, results) => createElement(RentalWaterfallPanel, { values, results }),
  educational: {
    formula: 'Cash-on-Cash = Annual Cash Flow ÷ Total Cash Invested × 100',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">Rental Property Cash Flow Waterfall</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Every dollar of rent flows through expenses down to net cash flow</text><g transform="translate(30,60)"><!-- Waterfall bars going down --><rect x="50" y="0" width="330" height="28" rx="4" fill="var(--svg-22c55e)"/><text x="215" y="20" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ffffff)">Gross Rent: $30,000/yr ($2,500/mo)</text><line x1="50" y1="30" x2="380" y2="30" stroke="var(--svg-cbd5e1)" stroke-width="0.5"/><rect x="50" y="34" width="290" height="24" rx="4" fill="var(--svg-fbbf24)"/><text x="195" y="51" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e293b)">− Vacancy (5%): $1,500</text><line x1="50" y1="60" x2="380" y2="60" stroke="var(--svg-cbd5e1)" stroke-width="0.5"/><rect x="50" y="64" width="250" height="24" rx="4" fill="var(--svg-f59e0b)"/><text x="175" y="81" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">− OpEx (Tax, Ins, HOA, Maint, Mgmt): $10,200</text><line x1="50" y1="90" x2="380" y2="90" stroke="var(--svg-cbd5e1)" stroke-width="0.5"/><rect x="50" y="94" width="190" height="28" rx="4" fill="var(--svg-3b82f6)"/><text x="145" y="113" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ffffff)">NOI: $18,300</text><line x1="50" y1="124" x2="380" y2="124" stroke="var(--svg-cbd5e1)" stroke-width="0.5"/><rect x="50" y="128" width="130" height="24" rx="4" fill="var(--svg-ef4444)"/><text x="115" y="145" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">− Debt Service: $12,000</text><line x1="50" y1="154" x2="380" y2="154" stroke="var(--svg-cbd5e1)" stroke-width="0.5"/><rect x="50" y="158" width="60" height="32" rx="4" fill="var(--svg-22c55e)"/><text x="80" y="179" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-ffffff)">$6,300</text><text x="200" y="180" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Annual Cash Flow = $6,300</text><text x="200" y="196" font-size="10" fill="var(--svg-64748b)">Cash-on-Cash Return = $6,300 / $80,000 = 7.9%</text></g><g transform="translate(40,260)"><rect x="10" y="0" width="370" height="68" rx="10" fill="var(--svg-f1f5f9)"/><text x="195" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Key Metrics at a Glance</text><text x="85" y="38" text-anchor="middle" font-size="10" fill="var(--svg-22c55e)">Cap Rate: 5.2%</text><text x="195" y="38" text-anchor="middle" font-size="10" fill="var(--svg-3b82f6)">CoC: 7.9%</text><text x="310" y="38" text-anchor="middle" font-size="10" fill="var(--svg-8b5cf6)">DSCR: 1.52x</text><text x="100" y="56" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">NOI / Purchase Price</text><text x="200" y="56" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">Cash Flow / Cash Invested</text><text x="310" y="56" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">NOI / Debt Service</text></g></svg>',
      alt: 'Rental property waterfall chart showing gross rent progressively reduced by vacancy, operating expenses, and debt service down to net cash flow and cash-on-cash return',
      caption: 'The cash flow waterfall shows how each dollar of rent flows through expenses — positive cash flow depends on keeping costs below rental income',
    },
    formulaDescription:
      'Rental property analysis uses multiple metrics to evaluate investment quality: cap rate measures return independent of financing; cash-on-cash measures your leveraged return; DSCR measures debt safety; and GRM provides a quick relative valuation.',
    variables: [
      { symbol: 'NOI', name: 'Net Operating Income', description: 'Effective gross rent minus all operating expenses (taxes, insurance, HOA, maintenance, management). Does not include mortgage payments.' },
      { symbol: 'Cap Rate', name: 'Capitalization Rate', description: 'NOI ÷ Purchase Price. Measures the unlevered yield of the property. Typical range: 4–8%. Higher is better.' },
      { symbol: 'CoC', name: 'Cash-on-Cash Return', description: 'Annual cash flow after debt service ÷ total cash invested. Measures your return on the actual dollars you put in. Target: 8%+.' },
      { symbol: 'DSCR', name: 'Debt Service Coverage Ratio', description: 'NOI ÷ Annual Mortgage Payments. Most lenders require ≥1.25x to qualify for an investment property loan.' },
      { symbol: 'GRM', name: 'Gross Rent Multiplier', description: 'Purchase Price ÷ Annual Gross Rent. A quick valuation shortcut — lower is generally better. Typical range: 8–15x.' },
    ],
    howToUse: [
      'Enter the property purchase price and your down payment.',
      'Add upfront closing costs or initial repair expenses to the cash invested.',
      'Enter the mortgage interest rate and loan term for investment property.',
      'Enter the expected monthly gross rent at full occupancy.',
      'Enter property taxes (varies significantly by market — check your county assessor).',
      'Enter HOA fees if applicable — critical for condo investments.',
      'Adjust vacancy rate, maintenance buffer, and management fees to reflect local reality.',
      'Review the Cash Flow Waterfall to see exactly where your rent dollars go.',
    ],
    commonUses: [
      'Analyze a potential rental property investment by calculating monthly cash flow after all expenses including mortgage, taxes, and vacancy.',
      'Compare the cap rate and cash-on-cash return across different investment properties to identify the best value in your market.',
      'Determine the minimum rent needed to cover all ownership costs and generate your target monthly profit margin.',
    ],
    explanation:
      'A profitable rental property should generate positive monthly cash flow after all expenses and mortgage payments. Property taxes vary enormously by market — Austin TX averages ~2.2% while Michigan averages ~1.4% of assessed value. HOA fees are especially important for condos and can range from $100 to $1,000+/month. The cash flow waterfall shows exactly where each dollar of rent goes, from gross income down through vacancy, operating expenses, and debt service to your net cash flow.',
    faqs: [
      {
        question: 'What is a good cap rate for a rental property?',
        answer: 'Cap rates vary significantly by market and property type. In high-cost urban markets, cap rates of 4–5% are common. In secondary and tertiary markets, 6–8% or higher is typical. Higher cap rates imply higher risk-adjusted returns but may also reflect higher vacancy risk or less appreciation potential.',
      },
      {
        question: 'What is the 1% rule for rental properties?',
        answer: 'The 1% rule is a quick filter: the monthly rent should equal at least 1% of the purchase price (e.g., $3,500/month rent on a $350,000 property). Properties that pass the 1% rule generally generate positive cash flow. In expensive markets, most properties fail this test, which is why investors often look to secondary markets.',
      },
      {
        question: 'Why do HOA fees matter so much for condos?',
        answer: 'HOA fees directly reduce your net cash flow dollar-for-dollar. A condo with $400/month HOA fees needs $400 more in rent (or $400 less in other expenses) to achieve the same cash flow as a non-HOA property. Always verify whether HOA fees cover water, trash, or exterior insurance, as these may offset other expense line items.',
      },
      {
        question: 'What does DSCR mean for getting a loan?',
        answer: 'Lenders use the Debt Service Coverage Ratio to assess whether the rental income can support the mortgage. A DSCR of 1.25x means the NOI is 25% more than the annual mortgage payment. Many investment property lenders require a minimum DSCR of 1.20–1.25x. Below 1.0x means the property loses money before maintenance.',
      },
    
      {
        question: 'How accurate is this calculator for real-world use?',
        answer: 'This calculator uses standard mathematical formulas and provides estimates based on the inputs you enter. For financial decisions, always verify results with a qualified professional and check against official statements or lender-provided figures which may include additional factors not modeled here.',
      },],
    
    workedExamples: [
      {
        scenario: 'Vanessa is evaluating a $350,000 single-family rental in Nashville, TN, with a 20% down payment ($70,000), $10,000 in closing costs, a 7.25% interest rate on a 30-year loan, and expected monthly rent of $2,500. She estimates 5% vacancy, 10% maintenance buffer, and plans to self-manage (0% property management). Tennessee property taxes average 0.65%. Annual insurance: $1,800.',
        inputs: {
          'Purchase Price': '$350,000',
          'Down Payment': '$70,000',
          'Closing Costs & Repairs': '$10,000',
          'Mortgage Interest Rate': '7.25',
          'Loan Term': '30',
          'Monthly Gross Rent': '$2,500',
          'Vacancy Rate': '5',
          'Property Tax by State': 'Tennessee (0.65%)',
          'Annual Landlord Insurance': '$1,800',
          'Monthly HOA Fees': '0',
          'Maintenance & CapEx Buffer': '10',
          'Property Management Fee': '0',
        },
        result: 'Monthly Cash Flow: -$124.68. Annual Cash Flow: -$1,496. Cash-on-Cash Return: -1.87%. Cap Rate: 6.12%. NOI: $21,425/yr. DSCR: 0.93x. GRM: 11.7x. Monthly Mortgage: $1,910.09.',
        insight: 'At a 7.25% interest rate with 20% down, Vanessa\'s property is slightly cash-flow negative at approximately -$125/month. The mortgage payment of $1,910/month consumes most of the effective gross rent of $2,375/month after vacancy, leaving a narrow margin after operating expenses. The DSCR of 0.93x falls below the typical 1.20-1.25x lender minimum for investment property loans. Cap rate of 6.12% is reasonable, but leverage at current rates erodes cash flow. If Vanessa could negotiate the purchase price down to $320,000 or secure a 6.5% rate, the deal could turn cash-flow positive. Tennessee\'s relatively low property taxes (0.65%) help keep operating expenses manageable compared to higher-tax states.',
      },
      {
        scenario: 'Derek is analyzing a $200,000 condo in Chicago, IL, with 25% down ($50,000), $7,000 closing costs, 7.5% interest on a 30-year loan, and $1,800/month expected rent. The condo has a $350/month HOA fee. He expects 8% vacancy, budgets 12% for maintenance, and will use a property manager at 8%. Illinois property taxes average 1.95%. Annual insurance: $1,200.',
        inputs: {
          'Purchase Price': '$200,000',
          'Down Payment': '$50,000',
          'Closing Costs & Repairs': '$7,000',
          'Mortgage Interest Rate': '7.5',
          'Loan Term': '30',
          'Monthly Gross Rent': '$1,800',
          'Vacancy Rate': '8',
          'Property Tax by State': 'Illinois (1.95%)',
          'Annual Landlord Insurance': '$1,200',
          'Monthly HOA Fees': '350',
          'Maintenance & CapEx Buffer': '12',
          'Property Management Fee': '8',
        },
        result: 'Monthly Cash Flow: -$516.30. Annual Cash Flow: -$6,196. Cash-on-Cash Return: -10.87%. Cap Rate: 3.20%. NOI: $6,390/yr. DSCR: 0.51x. GRM: 9.3x. Monthly Mortgage: $1,048.82.',
        insight: 'Derek\'s condo is deeply cash-flow negative at over -$500/month — a clear warning sign. Three factors are driving the negative result: (1) Illinois\' high property taxes at nearly 2% add $3,900/year, (2) the $350/month HOA adds $4,200/year with no offsetting benefit, and (3) property management at 8% plus a higher vacancy assumption and maintenance budget eats into the rent. The DSCR of 0.51x means the property generates only about half the income needed to cover debt service — conventional investment property loans typically require 1.20x minimum. Derek should either find a property without HOA fees, negotiate a lower purchase price, target a lower interest rate, or look in a lower-tax area.',
      },
    ],

    proTips: [
      'The 1% rule is a quick filter: monthly rent should be at least 1% of the purchase price. A $350K property should rent for $3,500+/month. Most properties fail this in expensive markets, so use it as a screening tool, not a hard rule.',
      'HOA fees are the silent cash-flow killer. A $400/month HOA requires roughly $50,000 more in rent (at an 8% cap rate equivalent) to generate the same return. Always check HOA financials and reserve studies before buying a condo.',
      'Self-managing boosts your cash-on-cash return by 1–3 percentage points — but factor in the value of your time. At 8% management on $2,500 rent, you are paying $200/month to avoid midnight repair calls. Many investors start self-managing and switch to professional management after 2-3 properties.',
      'Run this calculator with multiple vacancy and maintenance scenarios. A 5% vacancy rate assumes roughly 2.5 weeks of vacancy per year — realistic in strong markets but optimistic in weaker ones. Stress-test with 8-10% vacancy and 15% maintenance to see if the deal still works.',
    ],

    quickReference: [
      { label: '1% Rule', value: 'Monthly rent ≥ 1% of purchase price' },
      { label: 'Target CoC Return', value: '8%+ (cash flow ÷ cash invested)' },
      { label: 'Target Cap Rate', value: '6%+ (NOI ÷ purchase price)' },
      { label: 'Lender DSCR Minimum', value: '1.20–1.25x' },
      { label: 'Good GRM', value: 'Under 12x (lower is better)' },
      { label: 'Typical Down Payment', value: '20–25% for investment property' },
      { label: 'Prop Tax Range', value: '0.3% (HI) to 2.5% (NJ)' },
    ],

    limitations: [
      'This is a first-year pro forma analysis using constant inputs. It does not model rent growth, property appreciation, tax benefit of depreciation (which can shelter thousands in rental income annually), or future capital expenditures like roof replacement or HVAC failure.',
      'The state-based property tax rates are average effective rates — actual rates vary by county, city, and school district within each state. A property in suburban Chicago may have a 2.5% effective rate while one in rural southern Illinois may be under 1.5%. Always use the specific property\'s actual tax bill or county assessor data.',
      'Vacancy and maintenance are self-reported estimates. Actual vacancy depends on local market conditions, property desirability, and tenant screening quality. Maintenance costs tend to be lumpy — years of low expenses followed by a $15,000 roof replacement.',
      'It does not model closing costs when you eventually sell the property (typically 6-8% for real estate commissions plus transfer taxes), which can significantly reduce your total return on investment when you exit.',
    ],
citations: [
      { source: 'Internal Revenue Service (Publication 527)', url: 'https://www.irs.gov/publications/p527' },
      { source: 'US Department of Housing and Urban Development', url: 'https://www.hud.gov' },
    ],
  },
};

export default rentalPropertyConfig;
