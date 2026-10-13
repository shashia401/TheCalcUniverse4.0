import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import SaaSltvCACPanel from './SaaSltvCACPanel';
import { computeSaas } from './saasMath';

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
      helpText: 'Percentage of customers who cancel each month. Customer lifetime is 1 ÷ churn, capped at 120 months.',
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
    const grossMargin = rawMargin !== undefined && rawMargin !== '' ? parseFloat(rawMargin) : 80;

    if (
      ![arpu, churnRate, marketingSpend, customersAcquired, grossMargin].every(Number.isFinite) ||
      arpu <= 0 ||
      customersAcquired <= 0 ||
      marketingSpend < 0 ||
      churnRate < 0
    )
      return [];

    const f = computeSaas(arpu, churnRate, marketingSpend, customersAcquired, grossMargin);
    const { lifetimeMonths, ltv, cac, ltvCacRatio, paybackMonths, mrrPerSpend, cohortRevenue } = f;

    const fmt = (val: number) =>
      val >= 1_000_000
        ? `$${(val / 1_000_000).toFixed(2)}M`
        : `$${val.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;

    // classify on the displayed (rounded) values
    const ratioShown = Math.round(ltvCacRatio * 100) / 100;
    const ratioColor: 'positive' | 'neutral' | 'negative' =
      ratioShown >= 3 ? 'positive' : ratioShown >= 1 ? 'neutral' : 'negative';
    const paybackShown = Math.round(paybackMonths * 10) / 10;

    const results: CalculatorResult[] = [
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
        value: isFinite(ltvCacRatio) ? `${ltvCacRatio.toFixed(2)}:1` : 'N/A (no spend)',
        highlight: true,
        interpretation: `3:1 is the widely cited healthy target — below that, acquisition costs are eating too much of what each customer is worth; well above 5:1 can actually mean you're under-investing in growth and leaving market share on the table. This is a lifetime projection built on retention assumptions, so it's only as reliable as your churn estimate.`,
        color: ratioColor,
      },
      {
        id: 'paybackMonths',
        label: 'CAC Payback Period',
        value: isFinite(paybackMonths) ? `${paybackMonths.toFixed(1)} months` : 'N/A (0% margin)',
        color: isFinite(paybackMonths) ? (paybackShown <= 12 ? 'positive' : paybackShown <= 24 ? 'neutral' : 'negative') : 'neutral',
      },
      {
        id: 'avgLifetimeMonths',
        label: f.lifetimeCapped ? 'Avg. Customer Lifetime (capped at 10 years)' : 'Avg. Customer Lifetime',
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
        color: 'neutral',
      },
      {
        id: 'newMrrPerSpend',
        label: 'New Monthly Revenue per $1 of Spend',
        value: isFinite(mrrPerSpend) ? `$${mrrPerSpend.toFixed(2)}` : 'N/A (no spend)',
        color: 'neutral',
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
        value: fmt(cohortRevenue),
        color: 'positive',
      },
    ];
    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(SaaSltvCACPanel, { values, results });
  },
  educational: {
    formula:
      'LTV = ARPU × (1 / Monthly Churn Rate) × (Gross Margin %)\nCAC = Marketing Spend / New Customers\nLTV:CAC Ratio = LTV / CAC\nPayback = CAC / (ARPU × Gross Margin %)\nNew MRR per $1 = (ARPU × New Customers) / Marketing Spend',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="100" width="130" height="200" fill="var(--svg-3b82f6)" rx="4"/><rect x="240" y="140" width="130" height="160" fill="var(--svg-8b5cf6)" rx="4"/><line x1="60" y1="300" x2="370" y2="300" stroke="var(--svg-666666)" stroke-width="2"/><text x="125" y="320" text-anchor="middle" font-size="14" fill="var(--svg-333333)">LTV</text><text x="305" y="320" text-anchor="middle" font-size="14" fill="var(--svg-333333)">CAC</text><text x="125" y="90" text-anchor="middle" font-size="13" fill="var(--svg-3b82f6)">$300</text><text x="305" y="130" text-anchor="middle" font-size="13" fill="var(--svg-8b5cf6)">$100</text></svg>',
      alt: 'Two bars comparing LTV to CAC showing the ratio relationship',
      caption: 'LTV:CAC Ratio — healthy SaaS businesses target 3:1 or higher',
    },
    formulaDescription:
      'These formulas form the backbone of SaaS unit-economics modeling. LTV measures how much revenue a customer generates over their lifetime. CAC measures how much it costs to acquire them. The LTV:CAC ratio tells you if your unit economics are healthy.',
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
        description: 'LTV:CAC ratio should be 3:1 or higher for healthy unit economics. Payback period (months of gross profit needed to recoup CAC) is commonly targeted at about a year or less.',
      },
    ],
    howToUse: [
      'Enter your monthly ARPU (Average Revenue Per User).',
      'Enter your monthly churn rate (percentage of customers who cancel each month).',
      'Enter your total marketing and sales spend for the period.',
      'Enter the number of new customers acquired in the same period.',
      'The calculator will compute LTV, CAC, ratio, payback period and new monthly revenue per dollar of spend.',
      'A commonly cited target is LTV:CAC above 3:1 with payback of roughly a year or less.',
    ],
    explanation:
      'The LTV:CAC ratio is the single most important metric in SaaS. It tells you whether your customer acquisition engine is efficient. The golden standard is 3:1 — you generate $3 of lifetime value for every $1 spent acquiring a customer. Below 1:1 means you are losing money on every customer. Between 1:1 and 3:1 is workable but has room for improvement. Above 3:1 indicates a healthy, scalable business. The payback period — how long it takes to recoup your CAC from a customer\'s gross margin — is commonly targeted at about a year or less. "New monthly revenue per $1 of spend" shows how much recurring revenue each marketing dollar buys; it is not the classic SaaS Magic Number, which compares quarter-over-quarter revenue growth with the previous quarter\'s spend and needs data this calculator does not collect.',
    commonUses: [
      'Evaluating SaaS business unit economics by comparing customer lifetime value to customer acquisition cost',
      'Determining how many months it takes to recoup customer acquisition costs through monthly recurring revenue and gross margin',
      'Assessing the impact of churn rate changes on customer lifetime value and overall business sustainability',
      'Checking how much new recurring revenue each marketing dollar buys',
    ],
    faqs: [
      {
        question: 'What is a good LTV:CAC ratio?',
        answer: 'A widely cited benchmark is 3:1. Below 1:1 is problematic, 1-3:1 has room for improvement, and above 3:1 indicates healthy unit economics. It is a rule of thumb, not a law: it depends on churn assumptions and how fast you can fund growth.',
      },
      {
        question: 'How do I reduce my CAC payback period?',
        answer: 'Increase ARPU through upsells and pricing optimization, reduce churn to extend customer lifetime, and optimize marketing channels for lower-cost acquisition.',
      },
      {
        question: 'What is the SaaS Magic Number?',
        answer: 'The classic Magic Number measures sales efficiency as (this quarter\'s revenue − last quarter\'s revenue) × 4 ÷ last quarter\'s sales and marketing spend. This calculator shows a simpler figure instead: new monthly recurring revenue (ARPU × new customers) per dollar of marketing spend. Both indicate how much recurring revenue each marketing dollar buys, but they are not the same number.',
      },
      {
        question: 'What is considered a healthy churn rate for SaaS?',
        answer: 'There is no single threshold: B2B SaaS with annual contracts usually churns far less per month than self-serve B2C subscriptions. What matters is the trend and how churn feeds your lifetime: lifetime = 1 ÷ churn, so cutting monthly churn from 5% to 4% lengthens the average lifetime from 20 to 25 months (+25%).',
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
