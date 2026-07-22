import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import CapRatePanel from './CapRatePanel';

const capRateConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'propertyValue',
      label: 'Property Purchase Price',
      type: 'number',
      placeholder: '300,000',
      prefix: '$',
      min: 0,
      step: 1000,
      required: true,
      helpText: 'Purchase price or current market value',
    },
    {
      id: 'annualRent',
      label: 'Gross Annual Rental Income',
      type: 'number',
      placeholder: '36,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: 'Total rent collected per year at 100% occupancy',
    },
    {
      id: 'vacancyRate',
      label: 'Vacancy Rate',
      type: 'number',
      placeholder: '7',
      unit: '%',
      min: 0,
      max: 100,
      step: 1,
      required: true,
      helpText: 'Estimated % of time the property sits vacant (5–10% is typical)',
    },
    {
      id: 'sectionExpenses',
      label: '── Annual Operating Expenses ──',
      type: 'text',
      placeholder: '',
      required: false,
    },
    {
      id: 'propertyTax',
      label: 'Property Taxes',
      type: 'number',
      placeholder: '3,600',
      prefix: '$',
      min: 0,
      step: 100,
      required: false,
      helpText: 'Annual property taxes',
    },
    {
      id: 'insurance',
      label: 'Insurance',
      type: 'number',
      placeholder: '1,200',
      prefix: '$',
      min: 0,
      step: 100,
      required: false,
      helpText: 'Annual landlord / hazard insurance',
    },
    {
      id: 'hoa',
      label: 'HOA Fees (Annual)',
      type: 'number',
      placeholder: '0',
      prefix: '$',
      min: 0,
      step: 100,
      required: false,
    },
    {
      id: 'maintenance',
      label: 'Maintenance & Repairs',
      type: 'number',
      placeholder: '2,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: false,
      helpText: 'Budget ~1–2% of property value annually',
    },
    {
      id: 'propertyManagement',
      label: 'Property Management Fees',
      type: 'number',
      placeholder: '2,520',
      prefix: '$',
      min: 0,
      step: 100,
      required: false,
      helpText: 'Typically 8–12% of collected rent',
    },
    {
      id: 'otherExpenses',
      label: 'Other Operating Expenses',
      type: 'number',
      placeholder: '500',
      prefix: '$',
      min: 0,
      step: 100,
      required: false,
      helpText: 'Utilities, landscaping, accounting, etc.',
    },
  ],
  calculate: (values) => {
    const propertyValue = parseFloat(values.propertyValue);
    const grossRent = parseFloat(values.annualRent);
    const vacancyPct = parseFloat(values.vacancyRate) / 100;

    if ([propertyValue, grossRent, vacancyPct].some(isNaN)) return [];
    if (propertyValue <= 0 || grossRent <= 0) return [];

    const propertyTax = parseFloat(values.propertyTax) || 0;
    const insurance = parseFloat(values.insurance) || 0;
    const hoa = parseFloat(values.hoa) || 0;
    const maintenance = parseFloat(values.maintenance) || 0;
    const management = parseFloat(values.propertyManagement) || 0;
    const other = parseFloat(values.otherExpenses) || 0;
    const totalExpenses = propertyTax + insurance + hoa + maintenance + management + other;

    const effectiveGrossIncome = grossRent * (1 - vacancyPct);
    const vacancyLoss = grossRent * vacancyPct;
    const noi = effectiveGrossIncome - totalExpenses;
    const capRate = (noi / propertyValue) * 100;
    const grossRentMultiplier = propertyValue / grossRent;
    const expenseRatio = totalExpenses > 0 ? (totalExpenses / effectiveGrossIncome) * 100 : 0;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const fmt2 = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const getCapColor = (rate: number): 'positive' | 'negative' | 'neutral' => {
      if (rate >= 6) return 'positive';
      if (rate >= 4) return 'neutral';
      return 'negative';
    };

    const getCapLabel = (rate: number) => {
      if (rate >= 8) return 'Strong return';
      if (rate >= 6) return 'Good return';
      if (rate >= 4) return 'Below average';
      if (rate > 0) return 'Low return (luxury market)';
      return 'Negative — property losing money';
    };

    return [
      {
        id: 'capRate',
        label: `Cap Rate — ${getCapLabel(capRate)}`,
        value: `${capRate.toFixed(2)}%`,
        highlight: true,
        color: getCapColor(capRate),
      },
      {
        id: 'noi',
        label: 'Net Operating Income (NOI)',
        value: `$${fmt(noi)}/year`,
        color: noi > 0 ? ('positive' as const) : ('negative' as const),
      },
      {
        id: 'formula',
        label: 'Formula: NOI ÷ Property Value',
        value: `$${fmt(noi)} ÷ $${fmt(propertyValue)} = ${capRate.toFixed(2)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'effectiveIncome',
        label: 'Effective Gross Income (after vacancy)',
        value: `$${fmt(effectiveGrossIncome)}/year`,
        color: 'neutral' as const,
      },
      {
        id: 'vacancyLoss',
        label: `Vacancy Loss (${(vacancyPct * 100).toFixed(0)}%)`,
        value: `-$${fmt(vacancyLoss)}/year`,
        color: 'negative' as const,
      },
      {
        id: 'totalExpenses',
        label: 'Total Operating Expenses',
        value: totalExpenses > 0 ? `-$${fmt(totalExpenses)}/year` : 'Not entered',
        color: totalExpenses > 0 ? 'negative' : 'neutral' as const,
      },
      {
        id: 'expenseRatio',
        label: 'Expense Ratio',
        value: totalExpenses > 0 ? `${expenseRatio.toFixed(1)}% of effective income` : 'N/A',
        color: expenseRatio > 50 ? ('negative' as const) : ('neutral' as const),
      },
      {
        id: 'grm',
        label: 'Gross Rent Multiplier (GRM)',
        value: `${fmt2(grossRentMultiplier)}x`,
        color: 'neutral' as const,
      },
      {
        id: 'breakEvenOccupancy',
        label: 'Break-Even Occupancy Rate',
        value: effectiveGrossIncome > 0
          ? `${Math.min(100, (totalExpenses / grossRent) * 100).toFixed(1)}% occupancy needed`
          : 'N/A',
        color: 'neutral' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CapRatePanel, { values, results });
  },
  educational: {
    formula: 'Cap Rate = (Gross Rent × (1 − Vacancy%) − Operating Expenses) ÷ Property Value × 100',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="50" width="320" height="50" fill="var(--svg-22c55e)" rx="8"/><text x="220" y="80" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Gross Annual Rent: $60,000</text><rect x="80" y="115" width="120" height="35" fill="var(--svg-ef4444)" rx="4"/><text x="140" y="138" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">− Vacancy 5%</text><rect x="220" y="115" width="140" height="35" fill="var(--svg-ef4444)" rx="4"/><text x="290" y="138" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">− OpEx $20,000</text><rect x="80" y="170" width="280" height="35" fill="var(--svg-3b82f6)" rx="4"/><text x="220" y="193" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)">NOI = $37,000</text><line x1="80" y1="215" x2="360" y2="215" stroke="var(--svg-666666)" stroke-width="1"/><rect x="80" y="230" width="280" height="40" fill="var(--svg-8b5cf6)" rx="8"/><text x="220" y="255" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">÷ Property Value $500,000</text><rect x="120" y="285" width="200" height="35" fill="var(--svg-22c55e)" rx="8"/><text x="220" y="308" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">Cap Rate = 7.4%</text></svg>',
      alt: 'Cap rate formula flow from gross rent through vacancy and expenses to NOI divided by property value',
      caption: 'Cap Rate = Net Operating Income / Property Value — the unlevered return on real estate',
    },
    formulaDescription:
      'The cap rate measures the unlevered rate of return on an income-producing property, independent of how the purchase is financed. It answers the question: "If I paid all cash for this property, what annual percentage return would the rental income generate?" Higher cap rates indicate more income relative to the purchase price but often reflect higher perceived risk, weaker location quality, or older property condition.',
    variables: [
      { symbol: 'Gross Rent', name: 'Gross Annual Rent', description: 'Total rental income the property would generate at 100% occupancy for a full year. This is the starting point before accounting for vacancy losses and operating expenses.' },
      { symbol: 'NOI', name: 'Net Operating Income', description: 'Effective Gross Income (gross rent minus vacancy losses) minus all recurring operating expenses. This is the property\'s actual income before debt service. Mortgage payments are never included in NOI.' },
      { symbol: 'Cap Rate', name: 'Capitalization Rate', description: 'The ratio of NOI to property value, expressed as a percentage. This is the primary metric used by investors to compare income properties across different markets and price points.' },
      { symbol: 'GRM', name: 'Gross Rent Multiplier', description: 'Property price divided by gross annual rent. A lower GRM suggests a better value. This is a useful quick-screening tool but does not account for operating expenses or vacancy.' },
      { symbol: 'Expense Ratio', name: 'Operating Expense Ratio', description: 'Total operating expenses divided by Effective Gross Income, expressed as a percentage. A lower expense ratio (under 50%) generally indicates a more efficiently managed property.' },
    ],
    howToUse: [
      'Enter the property purchase price or current market value and the gross annual rental income at full occupancy.',
      'Enter your estimated vacancy rate; 5-10% is typical for residential properties while commercial properties may see 10-15% vacancy.',
      'Enter each expense category individually for the most accurate Net Operating Income. Missing key expenses like maintenance or property management will inflate the cap rate.',
      'Review the calculated cap rate and its label — 6% or higher is generally considered good in most residential markets, while 3-5% is typical for luxury urban properties.',
      'Check the Expense Ratio and Gross Rent Multiplier outputs for additional insight into the property\'s efficiency and relative value.',
      'Use the break-even occupancy output to understand the minimum occupancy needed to cover all operating expenses before any debt service.',
    ],
    explanation:
      'Cap rate is the most widely used metric for evaluating and comparing real estate investment opportunities across different markets and property types. The formula is straightforward: Net Operating Income divided by Property Value, expressed as a percentage. NOI is calculated by taking the gross annual rent, subtracting vacancy losses (typically 5-10% of gross rent), and then subtracting all recurring operating expenses including property taxes, insurance, maintenance, property management fees, HOA dues, and any landlord-paid utilities. A key rule of cap rate analysis is that mortgage payments are never included in the calculation, because cap rate is designed to measure the property\'s inherent income-generating potential independent of how an individual buyer chooses to finance it. This allows apples-to-apples comparisons between cash buyers and leveraged buyers. Cap rates vary widely by market and property class. In prime urban coastal markets like New York, San Francisco, or Los Angeles, cap rates typically range from 3% to 5% because property values are elevated relative to rents. In secondary and tertiary markets, cap rates of 6% to 10% are common, reflecting lower property values and sometimes higher perceived risk. It is critical to compare cap rates only within the same market and asset class, as comparing a 4% cap rate in Manhattan to an 8% cap rate in rural Ohio is not meaningful without accounting for risk, appreciation potential, and property condition. The Gross Rent Multiplier (GRM) provides a useful secondary screen: GRM is the property price divided by gross annual rent, and lower values generally indicate better value. The Expense Ratio (operating expenses divided by effective gross income) helps assess how efficiently a property is managed, with ratios under 50% considered healthy.',
    faqs: [
      {
        question: 'What is a good cap rate for rental property?',
        answer: 'It depends entirely on the market and property class. Class A urban properties in major coastal cities typically trade at 3-5% cap rates. Suburban residential properties in growing metro areas generally range from 5-7%. Secondary and rural markets may offer 7-10% or higher. The key is to compare cap rates within the same market and asset class for a meaningful evaluation.',
      },
      {
        question: 'Why are mortgage payments excluded from cap rate?',
        answer: 'Cap rate is an unlevered metric designed to measure the property\'s income potential independent of how it is financed. Excluding debt service allows investors to compare properties on an equal footing regardless of whether they pay cash, use a 30-year mortgage, or use creative financing. Cash-on-cash return is the metric that incorporates leverage.',
      },
      {
        question: 'What is the difference between cap rate and cash-on-cash return?',
        answer: 'Cash-on-cash return includes debt service (mortgage principal and interest) and measures your return on the actual cash you invested (down payment plus closing costs). Cap rate ignores financing entirely and uses the full property value. Cash-on-cash return will be higher than cap rate when you use leverage and the cap rate exceeds your interest rate.',
      },
      {
        question: 'What expenses should be included in NOI?',
        answer: 'Include all recurring operating costs: property taxes, hazard insurance, maintenance and repairs, property management fees, HOA or condo fees, landlord-paid utilities, landscaping, snow removal, accounting, and legal costs. Also account for vacancy loss. Exclude mortgage payments, depreciation, income taxes, capital expenditures like roof replacement, and tenant improvements.',
      },
      {
        question: 'Does cap rate account for property appreciation?',
        answer: 'No, cap rate is a snapshot of current income return only and does not include appreciation or depreciation. Two properties with the same 6% cap rate could have very different total returns if one is in a rapidly appreciating market and the other is in a declining area. Total return analysis should consider both cap rate and expected appreciation.',
      },
    ],
    citations: [
      { source: 'National Association of Realtors', url: 'https://www.nar.realtor/research-and-statistics' },
      { source: 'Zillow Research', url: 'https://www.zillow.com/research/' },
    ],
  },
};

export default capRateConfig;
