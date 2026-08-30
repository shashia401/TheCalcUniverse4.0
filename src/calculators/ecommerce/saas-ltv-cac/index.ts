import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import SaaSltvCACPanel from './SaaSltvCACPanel';

const saasLtvCacConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'arpu',
      label: 'Average Revenue Per User (ARPU)',
      type: 'number',
      placeholder: '50',
      prefix: '$',
      min: 0,
      step: 0.01,
      required: true,
      helpText: 'Monthly recurring revenue per customer',
    },
    {
      id: 'monthlyChurnRate',
      label: 'Monthly Churn Rate',
      type: 'number',
      placeholder: '5',
      unit: '%',
      min: 0,
      max: 100,
      step: 0.1,
      required: true,
      helpText: 'Percentage of customers who cancel each month',
    },
    {
      id: 'totalMarketingSpend',
      label: 'Total Marketing & Sales Spend',
      type: 'number',
      placeholder: '50000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: 'Total marketing and sales costs for the period',
    },
    {
      id: 'newCustomersAcquired',
      label: 'New Customers Acquired',
      type: 'number',
      placeholder: '200',
      min: 1,
      step: 1,
      required: true,
      helpText: 'Number of new customers acquired in the period',
    },
    {
      id: 'grossMargin',
      label: 'Gross Margin',
      type: 'number',
      placeholder: '80',
      unit: '%',
      min: 0,
      max: 100,
      step: 0.1,
      helpText: 'Percentage of revenue retained after cost of goods sold. Default 80% for SaaS.',
    },
  ],
  calculate: (values) => {
    const arpu = parseFloat(values.arpu);
    const churnRate = parseFloat(values.monthlyChurnRate);
    const marketingSpend = parseFloat(values.totalMarketingSpend);
    const customersAcquired = parseFloat(values.newCustomersAcquired);
    const rawMargin = values.grossMargin;
    const grossMargin = (rawMargin !== undefined && rawMargin !== '') ? parseFloat(rawMargin) : 80;

    if (
      isNaN(arpu) ||
      isNaN(churnRate) ||
      isNaN(marketingSpend) ||
      isNaN(customersAcquired) ||
      arpu <= 0 ||
      customersAcquired <= 0
    )
      return [];

    const churnDecimal = churnRate / 100;
    const lifetimeMonths =
      churnDecimal > 0
        ? Math.min(120, 1 / churnDecimal)
        : 120;
    const marginDecimal = grossMargin / 100;
    const ltv = arpu * lifetimeMonths * marginDecimal;
    const cac = marketingSpend / customersAcquired;
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;
    const paybackMonths = marginDecimal > 0 ? cac / (arpu * marginDecimal) : Infinity;
    const magicNumber = lifetimeMonths > 0 ? (arpu * customersAcquired) / marketingSpend : 0;
    const totalRevenue = arpu * customersAcquired * lifetimeMonths;

    const fmt = (val: number) =>
      val >= 1_000_000
        ? `$${(val / 1_000_000).toFixed(2)}M`
        : `$${val.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;

    const ratioColor: 'positive' | 'neutral' | 'negative' =
      ltvCacRatio >= 3 ? 'positive' : ltvCacRatio >= 1 ? 'neutral' : 'negative';

    return [
      {
        id: 'ltv',
        label: 'Customer Lifetime Value (LTV)',
        value: fmt(ltv),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'cac',
        label: 'Customer Acquisition Cost (CAC)',
        value: fmt(cac),
        color: 'negative',
      },
      {
        id: 'ltvCacRatio',
        label: 'LTV:CAC Ratio',
        value: `${ltvCacRatio.toFixed(2)}:1`,
        highlight: true,
        interpretation: `3:1 is the widely cited healthy target — below that, acquisition costs are eating too much of what each customer is worth; well above 5:1 can actually mean you're under-investing in growth and leaving market share on the table. This is a lifetime projection built on retention assumptions, so it's only as reliable as your churn estimate.`,
        color: ratioColor,
      },
      {
        id: 'paybackMonths',
        label: 'CAC Payback Period',
        value: isFinite(paybackMonths) ? `${paybackMonths.toFixed(1)} months` : 'N/A (0% margin)',
        color: isFinite(paybackMonths) ? (paybackMonths <= 12 ? 'positive' : paybackMonths <= 24 ? 'neutral' : 'negative') : 'neutral',
      },
      {
        id: 'avgLifetimeMonths',
        label: 'Avg. Customer Lifetime',
        value: `${lifetimeMonths.toFixed(1)} months`,
        color: 'neutral',
      },
      {
        id: 'arpu',
        label: 'Average Revenue Per User',
        value: fmt(arpu),
        color: 'neutral',
      },
      {
        id: 'churnRate',
        label: 'Monthly Churn Rate',
        value: `${churnRate.toFixed(1)}%`,
        color: churnRate <= 3 ? 'positive' : churnRate <= 7 ? 'neutral' : 'negative',
      },
      {
        id: 'magicNumber',
        label: 'SaaS Magic Number',
        value: `${magicNumber.toFixed(2)}x`,
        color: magicNumber >= 1 ? 'positive' : magicNumber >= 0.5 ? 'neutral' : 'negative',
      },
      {
        id: 'grossMargin',
        label: 'Gross Margin',
        value: `${grossMargin.toFixed(0)}%`,
        color: 'neutral',
      },
      {
        id: 'totalRevenue',
        label: 'Total Revenue from Cohort',
        value: fmt(totalRevenue),
        color: 'positive',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(SaaSltvCACPanel, { values, results });
  },
  educational: {
    formula:
      'LTV = ARPU × (1 / Monthly Churn Rate) × (Gross Margin %)\nCAC = Marketing Spend / New Customers\nLTV:CAC Ratio = LTV / CAC\nPayback = CAC / (ARPU × Gross Margin %)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="100" width="130" height="200" fill="var(--svg-3b82f6)" rx="4"/><rect x="240" y="140" width="130" height="160" fill="var(--svg-8b5cf6)" rx="4"/><line x1="60" y1="300" x2="370" y2="300" stroke="var(--svg-666666)" stroke-width="2"/><text x="125" y="320" text-anchor="middle" font-size="14" fill="var(--svg-333333)">LTV</text><text x="305" y="320" text-anchor="middle" font-size="14" fill="var(--svg-333333)">CAC</text><text x="125" y="90" text-anchor="middle" font-size="13" fill="var(--svg-3b82f6)">$300</text><text x="305" y="130" text-anchor="middle" font-size="13" fill="var(--svg-8b5cf6)">$100</text></svg>',
      alt: 'Two bars comparing LTV to CAC showing the ratio relationship',
      caption: 'LTV:CAC Ratio — healthy SaaS businesses target 3:1 or higher',
    },
    formulaDescription:
      'These four formulas form the backbone of SaaS financial modeling. LTV measures how much revenue a customer generates over their lifetime. CAC measures how much it costs to acquire them. The LTV:CAC ratio tells you if your unit economics are healthy.',
    variables: [
      {
        symbol: 'LTV',
        name: 'Customer Lifetime Value',
        description: 'The total gross profit a customer generates over their entire relationship with your business.',
      },
      {
        symbol: 'CAC',
        name: 'Customer Acquisition Cost',
        description: 'The total cost of acquiring a new customer, including all marketing and sales expenses.',
      },
      {
        symbol: 'LTV:CAC & Payback',
        name: 'Key SaaS Metrics (Ratio & Payback Period)',
        description: 'LTV:CAC ratio should be 3:1 or higher for healthy unit economics. Payback period (months to recoup CAC) should ideally be under 12 months.',
      },
    ],
    howToUse: [
      'Enter your monthly ARPU (Average Revenue Per User).',
      'Enter your monthly churn rate (percentage of customers who cancel each month).',
      'Enter your total marketing and sales spend for the period.',
      'Enter the number of new customers acquired in the same period.',
      'The calculator will compute LTV, CAC, ratio, payback period, and the SaaS Magic Number.',
      'A healthy SaaS business has LTV:CAC > 3:1 and payback under 12 months.',
    ],
    explanation:
      'The LTV:CAC ratio is the single most important metric in SaaS. It tells you whether your customer acquisition engine is efficient. The golden standard is 3:1 — you generate $3 of lifetime value for every $1 spent acquiring a customer. Below 1:1 means you are losing money on every customer. Between 1:1 and 3:1 is workable but has room for improvement. Above 3:1 indicates a healthy, scalable business. The payback period — how long it takes to recoup your CAC from a customer\'s gross margin — should ideally be under 12 months. The SaaS Magic Number (new revenue / marketing spend) measures sales efficiency: above 1.0x is excellent, 0.5-1.0x is good, below 0.5x needs improvement.',
    commonUses: [
      'Evaluating SaaS business unit economics by comparing customer lifetime value to customer acquisition cost',
      'Determining how many months it takes to recoup customer acquisition costs through monthly recurring revenue and gross margin',
      'Assessing the impact of churn rate changes on customer lifetime value and overall business sustainability',
      'Calculating the SaaS Magic Number to measure sales and marketing efficiency quarter over quarter',
    ],
    faqs: [
      {
        question: 'What is a good LTV:CAC ratio?',
        answer: 'The golden standard is 3:1. Below 1:1 is problematic, 1-3:1 has room for improvement, and above 3:1 indicates a healthy, scalable business with strong unit economics.',
      },
      {
        question: 'How do I reduce my CAC payback period?',
        answer: 'Increase ARPU through upsells and pricing optimization, reduce churn to extend customer lifetime, and optimize marketing channels for lower-cost acquisition.',
      },
      {
        question: 'What is the SaaS Magic Number?',
        answer: 'The Magic Number measures sales and marketing efficiency. It is calculated as (new revenue this quarter — new revenue last quarter) / marketing spend. Above 1.0x is world-class, 0.5-1.0x is good, below 0.5x needs improvement.',
      },
      {
        question: 'What is considered a healthy churn rate for SaaS?',
        answer: 'For B2B SaaS, monthly churn under 3% is good, under 2% is excellent. For B2C SaaS, monthly churn under 5-7% is typical. Reducing churn by even 1% can dramatically increase LTV.',
      },
      {
        question: 'How does customer segmentation affect LTV and CAC?',
        answer: 'Enterprise customers often have much higher LTV but also higher CAC due to longer sales cycles. Self-serve customers have lower CAC but may churn faster. A healthy SaaS tracks LTV:CAC by segment — a blended ratio of 3:1 can mask one segment at 6:1 and another at 0.5:1. Optimize acquisition spend per segment for maximum efficiency.',
      },
    ],
    citations: [
      { source: 'Wikipedia — Customer Lifetime Value', url: 'https://en.wikipedia.org/wiki/Customer_lifetime_value' },
      { source: 'Corporate Finance Institute — LTV:CAC Ratio', url: 'https://corporatefinanceinstitute.com/resources/valuation/ltv-cac-ratio/' },
    ],
  },
};

export default saasLtvCacConfig;
