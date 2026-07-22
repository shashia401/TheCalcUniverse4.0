import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import RentAffordabilityPanel from './RentAffordabilityPanel';

const rentAffordabilityConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'grossIncome',
      label: 'Gross Income',
      type: 'number',
      placeholder: '75,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: 'Your income before taxes — enter annual, monthly, or hourly based on the frequency selected.',
    },
    {
      id: 'incomeFrequency',
      label: 'Income Frequency',
      type: 'select',
      required: true,
      options: [
        { label: 'Annual (per year)', value: 'annual' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Hourly (40 hrs/wk)', value: 'hourly' },
      ],
      helpText: 'How your gross income amount is measured — annual, monthly, or hourly.',
    },
    {
      id: 'monthlyDebts',
      label: 'Total Monthly Debt Payments',
      type: 'number',
      placeholder: '350',
      prefix: '$',
      min: 0,
      step: 25,
      helpText: 'Car loans, student loans, minimum credit card payments — anything you already pay monthly',
    },
    {
      id: 'rentRule',
      label: 'Affordability Rule',
      type: 'select',
      required: true,
      options: [
        { label: '30% Rule — Standard (rent ≤ 30% of gross monthly income)', value: '30' },
        { label: '40x Rule — NYC/Major Cities (annual income ÷ 40 = max rent)', value: '40x' },
        { label: 'Conservative 25% — Comfortable breathing room', value: '25' },
        { label: 'Custom percentage', value: 'custom' },
      ],
      helpText: 'Choose the guideline used to calculate your maximum affordable rent.',
    },
    {
      id: 'customPct',
      label: 'Custom Rent-to-Income Percentage',
      type: 'number',
      placeholder: '35',
      unit: '%',
      min: 10,
      max: 60,
      step: 0.5,
      helpText: 'Only applies if "Custom percentage" is selected above',
    },
  ],
  calculate: (values) => {
    const grossIncome = parseFloat(values.grossIncome);
    const incomeFrequency = values.incomeFrequency || 'annual';
    const monthlyDebts = parseFloat(values.monthlyDebts) || 0;
    const rentRule = values.rentRule || '30';
    const customPct = parseFloat(values.customPct) / 100;

    if (isNaN(grossIncome) || grossIncome <= 0) return [];

    let monthlyIncome: number;
    switch (incomeFrequency) {
      case 'monthly': monthlyIncome = grossIncome; break;
      case 'hourly': monthlyIncome = grossIncome * 40 * 52 / 12; break;
      default: monthlyIncome = grossIncome / 12;
    }

    let maxRent: number;
    let ruleName: string;
    let rulePct: number;

    if (rentRule === '40x') {
      maxRent = (monthlyIncome * 12) / 40;
      ruleName = '40x Rule';
      rulePct = maxRent / monthlyIncome;
    } else if (rentRule === 'custom') {
      rulePct = isNaN(customPct) ? 0.30 : customPct;
      maxRent = monthlyIncome * rulePct;
      ruleName = `${(rulePct * 100).toFixed(0)}% Custom Rule`;
    } else {
      rulePct = parseFloat(rentRule) / 100;
      maxRent = monthlyIncome * rulePct;
      ruleName = rentRule === '25' ? '25% Conservative Rule' : '30% Rule';
    }

    const remainingAfterRentAndDebt = monthlyIncome - maxRent - monthlyDebts;
    const fmtD = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return [
      {
        id: 'maxRent',
        label: `Maximum Monthly Rent (${ruleName})`,
        value: `$${fmtD(maxRent)}`,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'monthlyIncome',
        label: 'Monthly Gross Income',
        value: `$${fmtD(monthlyIncome)}`,
        color: 'neutral' as const,
      },
      {
        id: 'rentPct',
        label: 'Rent as % of Gross Income',
        value: `${((maxRent / monthlyIncome) * 100).toFixed(1)}%`,
        color: 'neutral' as const,
      },
      {
        id: 'remainingAfterRent',
        label: 'Remaining After Rent + Debts',
        value: `$${fmtD(Math.max(0, remainingAfterRentAndDebt))}/mo`,
        color: remainingAfterRentAndDebt > monthlyIncome * 0.4 ? 'positive' as const : remainingAfterRentAndDebt > 0 ? 'neutral' as const : 'negative' as const,
      },
      {
        id: 'annualRent',
        label: 'Annual Rent Cost',
        value: `$${(maxRent * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        color: 'neutral' as const,
      },
      {
        id: 'landlordRule',
        label: 'Meets 40x Landlord Requirement?',
        value: (monthlyIncome * 12) >= maxRent * 40 ? 'Yes — income qualifies' : `No — landlords require ~$${fmtD(maxRent * 40 / 12)}/mo income`,
        color: (monthlyIncome * 12) >= maxRent * 40 ? 'positive' as const : 'negative' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    const grossIncome = parseFloat(values.grossIncome);
    const incomeFrequency = values.incomeFrequency || 'annual';
    const monthlyDebts = parseFloat(values.monthlyDebts) || 0;
    const rentRule = values.rentRule || '30';
    const customPct = parseFloat(values.customPct) / 100;

    if (!results.length || isNaN(grossIncome)) return null;

    let monthlyIncome: number;
    switch (incomeFrequency) {
      case 'monthly': monthlyIncome = grossIncome; break;
      case 'hourly': monthlyIncome = grossIncome * 40 * 52 / 12; break;
      default: monthlyIncome = grossIncome / 12;
    }

    let maxRent: number;
    if (rentRule === '40x') {
      maxRent = (monthlyIncome * 12) / 40;
    } else if (rentRule === 'custom') {
      maxRent = monthlyIncome * (isNaN(customPct) ? 0.30 : customPct);
    } else {
      maxRent = monthlyIncome * parseFloat(rentRule) / 100;
    }

    return createElement(RentAffordabilityPanel, { monthlyIncome, maxRent, monthlyDebts });
  },
  educational: {
    formula: '30% Rule: Max Rent = Monthly Income × 0.30   ·   40x Rule: Max Rent = Annual Income ÷ 40',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-f8fafc)" rx="8"/><text x="220" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-1e293b)">Rent Affordability — Where Your Money Goes</text><text x="220" y="44" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">The 30% rule: a benchmark for healthy housing costs</text><g transform="translate(40,65)"><!-- Income bar (full width) --><rect x="10" y="0" width="360" height="40" rx="6" fill="var(--svg-e2e8f0)"/><text x="190" y="26" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-475569)">Monthly Gross Income: $6,250</text><!-- Three slices: Rent, Debts, Remaining --><rect x="10" y="55" width="120" height="65" rx="8" fill="var(--svg-ef4444)"/><text x="70" y="78" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Rent</text><text x="70" y="94" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ffffff)">$1,875</text><text x="70" y="110" text-anchor="middle" font-size="9" fill="var(--svg-fca5a5)">(30%)</text><rect x="140" y="55" width="80" height="65" rx="8" fill="var(--svg-f59e0b)"/><text x="180" y="78" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Debts</text><text x="180" y="94" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ffffff)">$350</text><text x="180" y="110" text-anchor="middle" font-size="9" fill="var(--svg-fde68a)">(5.6%)</text><rect x="230" y="55" width="140" height="65" rx="8" fill="var(--svg-22c55e)"/><text x="300" y="78" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-ffffff)">Remaining</text><text x="300" y="94" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-ffffff)">$4,025</text><text x="300" y="110" text-anchor="middle" font-size="9" fill="var(--svg-bbf7d0)">(64.4%)</text><!-- Rule comparison boxes --><text x="190" y="150" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)">Rent Affordability Rules Compared</text><text x="80" y="170" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-22c55e)">25% Rule</text><text x="80" y="186" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">$1,563/mo</text><text x="80" y="198" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">Most breathing room</text><text x="195" y="170" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-3b82f6)">30% Rule</text><text x="195" y="186" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">$1,875/mo</text><text x="195" y="198" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">Standard guideline</text><text x="310" y="170" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-8b5cf6)">40x Rule</text><text x="310" y="186" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">$1,875/mo</text><text x="310" y="198" text-anchor="middle" font-size="8" fill="var(--svg-64748b)">Landlord requirement</text></g><!-- 40x rule math detail --><g transform="translate(40,285)"><rect x="10" y="0" width="370" height="42" rx="10" fill="var(--svg-f1f5f9)"/><text x="195" y="16" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e293b)">40x Rule Check: $75K/yr ÷ 40 = $1,875/mo max rent ✓</text><text x="195" y="32" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">The 40x rule is mathematically equivalent to ~30% of gross income</text></g></svg>',
      alt: 'Rent affordability visual showing monthly income split into rent (red), debts (orange), and remaining cash (green), with three affordability rules compared side by side',
      caption: 'The 30% rule (and equivalent 40x landlord rule) ensures you have enough income for other essentials and savings after paying rent',
    },
    formulaDescription:
      'The 30% rule calculates rent as a share of gross monthly income — a benchmark established by US housing policy in the 1960s. The 40x rule (popular in NYC and other major metros) requires annual income to be at least 40 times the monthly rent. Both rules arrive at roughly the same conclusion: housing costs should not consume more than about 30% of your income.',
    variables: [
      { symbol: '30% Rule', name: 'The Standard Rule', description: 'The most widely cited housing affordability benchmark. If you earn $5,000/month gross, you should spend no more than $1,500 on rent. It originated from US public housing policies in the 1960s, which capped rent at 25% for subsidized tenants, and later evolved into the 30% general personal finance guideline used by landlords and financial advisors alike.' },
      { symbol: '40x Rule', name: 'The NYC/Metro Rule', description: 'Landlords in competitive rental markets often require annual income to be at least 40 times the monthly rent. For a $2,500/month apartment, you need $100,000/year in income. This is mathematically equivalent to approximately 30% of gross income but is framed differently to simplify landlord screening. It is the standard in cities like New York, San Francisco, and Boston.' },
      { symbol: '25% Rule', name: 'Conservative Guideline', description: 'A stricter 25% rule used by financial planners who advocate for more savings and financial flexibility. This is especially valuable if you have high existing debt payments (student loans, car payments), irregular income, or are trying to save aggressively for a down payment on a home.' },
    ],
    howToUse: [
      'Enter your gross income and select whether it is annual, monthly, or hourly.',
      'Add any existing monthly debt payments (car loans, student loans, minimum credit card payments).',
      'Select the affordability rule that best fits your market — 30% for most cities, 40x for NYC and major metros, or 25% for a conservative budget.',
      'The pie chart shows how your income breaks down across rent, debts, and remaining cash — making your true financial picture immediately visible.',
    ],
    commonUses: [
      'Determine the maximum rent you can afford based on your income, existing debts, and the 30 percent or 40x affordability rule.',
      'See how much cash you will have remaining each month after paying rent and other debt obligations to assess your true financial flexibility.',
      'Compare different affordability rules to find the right balance between rent cost, lifestyle spending, and savings capacity.',
    ],
    explanation:
      'Rent affordability is not just about the 30% rule — it is about what is left over after you pay rent and other obligations. If you have $500 in monthly student loans and a $1,500 rent on a $5,000 monthly income, you are working with $3,000 for food, transportation, savings, healthcare, utilities, and emergencies. The pie chart in this calculator makes this immediately visible. The "remaining cash" slice is what really determines your quality of life and financial flexibility. A low rent that still leaves you with little after other expenses is no better than rent that stretches the 30% guideline but still leaves room for savings.',
    faqs: [
      {
        question: 'Why do landlords use the 40x rule?',
        answer: 'Landlords use the 40x rule as a quick and simple income verification screen during the application process. If rent is $2,500/month ($30,000/year), they want to see at least $100,000 in annual income, ensuring the rent will not be a financial stretch for the tenant. It is mathematically equivalent to spending about 30% of gross income on rent and has become standard practice for large building management companies in competitive markets like New York, Boston, and Los Angeles.',
      },
      {
        question: 'Should the 30% rule be based on gross or net income?',
        answer: 'The traditional 30% rule uses gross income (before taxes and deductions). However, many financial planners argue that net income (take-home pay) is more practical since you cannot pay rent with pre-tax dollars. If you live in a high-tax state or have significant deductions, applying 30% to net income results in a more conservative and realistic budget. As a rule of thumb, 30% of gross is approximately 35-40% of net for most middle-income earners.',
      },
      {
        question: 'What if I live in a high cost-of-living city and cannot hit 30%?',
        answer: 'In cities like San Francisco, New York, and Boston, even median earners often spend 40-50% of income on rent due to limited housing supply and high demand. If you must exceed the 30% guideline, offset it by eliminating other consumer debts, reducing non-essential spending, and building a larger emergency fund. The 30% rule is a guideline, not a law — but being aware that you are above it helps you make intentional trade-offs in other areas of your budget.',
      },
    ],
    citations: [
      { source: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov' },
      { source: 'US Department of Housing and Urban Development', url: 'https://www.hud.gov' },
    ],
  },
};

export default rentAffordabilityConfig;
