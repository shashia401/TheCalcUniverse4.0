import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { createElement } from 'react';
import CACPanel from './CACPanel';

const cacConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'totalMarketingSpend',
      label: 'Total Sales & Marketing Spend',
      type: 'number',
      placeholder: '25,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      inputMode: 'decimal',
      helpText: 'All marketing, advertising, and sales salaries for the period',
    },
    {
      id: 'newCustomers',
      label: 'New Customers Acquired',
      type: 'number',
      placeholder: '150',
      unit: 'customers',
      min: 1,
      step: 1,
      required: true,
      inputMode: 'numeric',
      helpText: 'Total new paying customers gained in the same period',
    },
    {
      id: 'ltv',
      label: 'Average Customer LTV (optional)',
      type: 'number',
      placeholder: '500',
      prefix: '$',
      min: 0,
      step: 10,
      inputMode: 'decimal',
      helpText: 'Lifetime Value — used to calculate LTV:CAC ratio',
    },
    {
      id: 'avgOrderValue',
      label: 'Average Order Value (optional)',
      type: 'number',
      placeholder: '85',
      prefix: '$',
      min: 0,
      step: 1,
      inputMode: 'decimal',
      helpText: 'Average revenue per purchase — used to calculate payback period',
    },
    {
      id: 'grossMarginPct',
      label: 'Gross Margin %',
      type: 'number',
      placeholder: '60',
      unit: '%',
      min: 0,
      max: 100,
      step: 0.1,
      inputMode: 'decimal',
      helpText: 'Used to calculate payback period',
    },
  ],
  calculate: (values) => {
    const spend = parseFloat(values.totalMarketingSpend);
    const customers = parseFloat(values.newCustomers);
    const ltv = parseFloat(values.ltv);
    const aov = parseFloat(values.avgOrderValue);
    const margin = parseFloat(values.grossMarginPct) / 100;

    if (isNaN(spend) || isNaN(customers) || customers <= 0) return [];

    const cac = spend / customers;
    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const results: CalculatorResult[] = [
      {
        id: 'cac',
        label: 'Customer Acquisition Cost (CAC)',
        value: `$${fmt(cac)}`,
        highlight: true,
        color: 'neutral' as const,
      },
    ];

    if (!isNaN(ltv) && ltv > 0) {
      const ltvCacRatio = ltv / cac;
      results.push({
        id: 'ltvCac',
        label: 'LTV:CAC Ratio',
        value: `${ltvCacRatio.toFixed(2)}x`,
        color: ltvCacRatio >= 3 ? 'positive' as const : ltvCacRatio >= 1 ? 'neutral' as const : 'negative' as const,
      });
    }

    if (!isNaN(aov) && !isNaN(margin) && aov > 0 && margin > 0) {
      const paybackMonths = cac / (aov * margin);
      results.push({
        id: 'payback',
        label: 'Payback Period (months)',
        value: `${paybackMonths.toFixed(1)} months`,
        color: paybackMonths <= 12 ? 'positive' as const : paybackMonths <= 24 ? 'neutral' as const : 'negative' as const,
      });
    }

    results.push({
      id: 'totalSpend',
      label: 'Total Marketing Spend',
      value: `$${fmt(spend)}`,
      color: 'neutral' as const,
    });

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CACPanel, { values, results });
  },
  educational: {
    formula: 'CAC = Total Sales & Marketing Spend ÷ New Customers Acquired',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><polygon points="80,60 360,60 300,140 140,140" fill="var(--svg-3b82f6)" opacity="0.3"/><polygon points="140,140 300,140 260,220 180,220" fill="var(--svg-8b5cf6)" opacity="0.3"/><polygon points="180,220 260,220 240,280 200,280" fill="var(--svg-22c55e)" opacity="0.3"/><text x="220" y="105" text-anchor="middle" font-size="14" fill="var(--svg-333333)">$10,000 Marketing Spend</text><text x="220" y="190" text-anchor="middle" font-size="14" fill="var(--svg-333333)">100 New Customers</text><text x="220" y="258" text-anchor="middle" font-size="14" fill="var(--svg-333333)">CAC = $100</text></svg>',
      alt: 'Funnel showing marketing spend narrowing to customers and CAC',
      caption: 'Customer Acquisition Cost — total spend divided by new customers',
    },
    formulaDescription:
      'Customer Acquisition Cost measures the average cost of acquiring one new paying customer, including all sales and marketing expenses. It is a fundamental unit economics metric for any business with a marketing budget.',
    variables: [
      { symbol: 'CAC', name: 'Customer Acquisition Cost', description: 'The total cost of acquiring one new customer across all marketing and sales channels. Includes ad spend, salaries, software, and creative costs.' },
      { symbol: 'LTV:CAC', name: 'Lifetime Value to CAC Ratio', description: 'A key SaaS/e-commerce metric. A ratio above 3:1 is generally healthy. Below 1:1 means you lose money on every customer acquired.' },
      { symbol: 'Payback Period', name: 'CAC Payback Period', description: 'How many months it takes to recoup the cost of acquiring a customer through gross profit. Under 12 months is excellent for most businesses.' },
    ],
    howToUse: [
      'Enter all sales and marketing spend for the period (including salaries).',
      'Enter the number of new customers acquired in the same period.',
      'Optionally add LTV for the LTV:CAC ratio and AOV + margin for payback period.',
      'Compare your CAC to LTV and payback period to evaluate marketing efficiency.',
      'Aim for LTV:CAC above 3:1 and payback period under 12 months.',
    ],
    explanation:
      'CAC is one of the most important metrics for any business with a marketing budget. A sustainable business must have an LTV:CAC ratio above 3:1 — meaning each customer generates at least 3x what it cost to acquire them. The CAC payback period tells you how long until marketing investment is recovered. Venture-backed SaaS companies typically target payback periods of 12-18 months. E-commerce brands often need faster payback of 6-12 months. High CAC is sustainable if LTV is proportionally high. Real-world example: a DTC brand spends $50,000 on ads, content, and salaries in a month and acquires 500 customers. The CAC is $100 per customer. If each customer has an LTV of $400, the LTV:CAC ratio is 4:1 — very healthy. If that same brand switches to higher-cost influencer campaigns and CAC rises to $200 while LTV stays at $400, the ratio drops to 2:1 — still workable but with less margin for error. If they further scale and CAC hits $500 while LTV remains $400, the ratio drops below 1:1, meaning every new customer destroys value. At that point the business must either find cheaper acquisition channels, increase prices, improve retention, or reduce spending.',
    commonUses: [
      'Measuring marketing efficiency by tracking how much it costs to acquire each new customer across all channels',
      'Evaluating whether ad spend is sustainable by comparing CAC against customer lifetime value using the LTV:CAC ratio',
      'Determining how many months it takes to recoup the cost of acquiring a customer through gross profit margin',
      'Comparing acquisition costs across different marketing channels (paid search, social media, organic) to optimize budget allocation',
    ],
    faqs: [
      {
        question: 'What should be included in the marketing spend for CAC?',
        answer: 'Include all sales and marketing expenses: ad spend, agency fees, marketing software subscriptions, salaries of sales and marketing staff, content production, creative costs, and any tools used in the acquisition process. Be thorough but exclude costs that are not directly related to acquisition.',
      },
      {
        question: 'What is a good LTV:CAC ratio?',
        answer: 'A ratio of 3:1 or higher is the standard benchmark for sustainable businesses. Below 1:1 means you are losing money on each customer. Above 5:1 may indicate you are under-investing in growth and leaving revenue on the table.',
      },
      {
        question: 'How does CAC vary by channel?',
        answer: 'CAC can vary dramatically by channel. Organic search might have a CAC of $0 (excluding SEO labor), while paid search could be $50-200. Social media ads range from $20-150 depending on targeting. Always calculate CAC per channel to optimize your marketing mix, not just a blended average across all channels.',
      },
      {
        question: 'What is the difference between blended CAC and paid CAC?',
        answer: 'Blended CAC includes all channels (organic, referral, direct, paid) divided by total customers. Paid CAC only includes paid channels divided by customers from paid sources. Paid CAC is almost always higher than blended CAC. Track both to understand the true cost of your growth engine.',
      },
      {
        question: 'How often should I recalculate CAC?',
        answer: 'CAC should be calculated monthly and reviewed quarterly for trends. Rapid changes in CAC often signal shifts in ad market efficiency, seasonality, or campaign effectiveness. Spikes warrant immediate investigation; gradual increases may indicate market saturation or rising competition in your channels.',
      },
      {
        question: 'What is a good CAC payback period for e-commerce?',
        answer: 'For e-commerce, a payback period of 6-12 months is considered healthy. DTC brands with strong repeat purchase rates can sustain 12-18 month payback periods because the customer generates ongoing contribution margin. Subscription box services typically need payback within 3-6 months due to higher churn. If your payback period exceeds 18 months, you are essentially financing customer acquisition from operating cash flow — this requires significant working capital and carries substantial risk if customer retention assumptions fail.',
      },
      {
        question: 'How do I calculate LTV properly for the LTV:CAC ratio?',
        answer: 'LTV = (Average Order Value × Average Purchase Frequency × Gross Margin %) ÷ Churn Rate. For example: AOV $85, 4 purchases/year, 60% margin, 30% annual churn: LTV = ($85 × 4 × 0.60) ÷ 0.30 = $680. Be conservative: use 12-month LTV rather than multi-year projections, and always use net of returns. Common mistake: using revenue instead of gross profit for LTV, which inflates the ratio. If your LTV calculation uses revenue (not gross profit), the 3:1 benchmark becomes roughly 5:1.',
      },
      {
        question: 'How do brand awareness campaigns affect CAC?',
        answer: 'Brand campaigns typically have a delayed impact on CAC — they do not drive immediate conversions but reduce CAC across all channels over time as brand recognition increases. A brand-aware audience converts at higher rates and lower costs on paid search and social. For a fair CAC picture, allocate brand campaign spend across total new customers over a 3-6 month rolling window. Many DTC brands allocate 10-20% of marketing budget to brand campaigns and model a 2-3 month lag before seeing CAC reduction in direct response channels.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Derek runs a DTC coffee subscription brand spending $50,000/month on ads, content, and marketing salaries. He acquires 500 new subscribers per month. Each subscriber has an average LTV of $400. He wants to know CAC and LTV:CAC ratio.',
        inputs: { totalMarketingSpend: '50000', newCustomers: '500', ltv: '400' },
        result: 'CAC = $100.00 per customer, LTV:CAC = 4.00x',
        insight: 'CAC = $50,000 ÷ 500 = $100 per customer. LTV:CAC = $400 ÷ $100 = 4.0x. This is a healthy ratio above the 3:1 benchmark. Derek\'s marketing generates $200,000 in LTV (500 × $400) on $50,000 spend. If he can maintain this while scaling to 1,000 customers/month at the same CAC, monthly marketing spend would be $100,000 generating $400,000 in LTV. The 4:1 ratio gives him confidence to approach investors for growth capital.',
      },
      {
        scenario: 'Lisa runs a B2B SaaS company with $30,000 monthly sales and marketing spend (2 SDRs at $6K each, $10K ads, $8K tools/events). She acquires 100 new customers per month with an average AOV of $200/month, 80% gross margin, and 5% monthly churn. She wants to know payback period.',
        inputs: { totalMarketingSpend: '30000', newCustomers: '100', avgOrderValue: '200', grossMarginPct: '80' },
        result: 'CAC = $300.00 per customer, Payback Period = 1.9 months',
        insight: 'CAC = $30,000 ÷ 100 = $300 per customer. Monthly gross profit per customer = $200 × 0.80 = $160. Payback = $300 ÷ $160 = 1.9 months — excellent! At 5% monthly churn, average customer lifetime is 20 months. LTV = $160 × 20 = $3,200. LTV:CAC = $3,200 ÷ $300 = 10.7x. This very high ratio suggests Lisa could invest more in acquisition to accelerate growth — she is likely under-investing in marketing relative to the return she is getting.',
      },
      {
        scenario: 'Mateo runs a fashion e-commerce brand. His blended CAC across all channels is $45. He segments by channel: organic search (30% of customers at $5 CAC), email (20% at $3), paid search (25% at $55), social ads (25% at $85). His AOV is $75 at 55% margin.',
        inputs: { totalMarketingSpend: '18000', newCustomers: '400', avgOrderValue: '75', grossMarginPct: '55' },
        result: 'CAC = $45.00 per customer (blended), Payback Period = 1.1 months',
        insight: 'Blended CAC of $45 looks manageable, but channel-level analysis reveals a different story. Paid channels (social at $85, search at $55) have much higher CAC. Monthly gross profit per order = $75 × 0.55 = $41.25. Social ads customers lose money on first purchase ($85 to acquire vs. $41.25 gross profit = −$43.75 deficit). The business is subsidized by organic and email. Mateo needs to either improve social ad ROAS, increase AOV through upsells, or accept that paid social is a loss-leader for future organic growth and repeat purchases.',
      },
    ],
    proTips: [
      'Calculate CAC per marketing channel, not just blended. A healthy blended CAC of $50 can hide a paid social CAC of $120 and an organic CAC of $5. Per-channel analysis reveals where your money actually works and where it does not — crucial for budget allocation decisions.',
      'Include customer success and support team costs in your CAC calculation. Many businesses underestimate true acquisition cost by 20-30% by omitting these. Every onboarding email, support ticket, and setup call costs money and should be attributed to acquisition cost.',
      'If your CAC payback period exceeds 12 months, ensure you have sufficient working capital to bridge the gap. A $200 CAC with a $15/month contribution margin means 13.3 months to break even — you need to finance 13 months of customer acquisition before seeing positive unit-level cash flow.',
      'Watch for CAC creep: as you scale, CAC naturally rises because you exhaust the lowest-hanging-fruit audiences first. A 10-20% year-over-year CAC increase is normal for growing brands. If CAC increases faster than that, investigate audience saturation, competitive pressure, or creative fatigue.',
      'Be conservative in LTV estimates. Use actual churn data, not optimistic projections. A common trap is projecting 24-month LTV when 40% of customers churn in month 3 — your actual weighted LTV may be half of what a simple calculation shows.',
    ],
    limitations: [
      'CAC is inherently backward-looking — you are using historical spend and customer data to calculate a metric that may not predict future performance. Marketing costs typically take 1-3 months to fully materialize in customer acquisition.',
      'The calculator assumes a single-period snapshot; it does not model seasonality effects, promotional spikes, or multi-touch attribution lags.',
      'LTV estimates are inherently uncertain and depend on churn assumptions, repeat purchase rates, and customer cohort behavior that may change over time.',
      'For businesses with long sales cycles (B2B enterprise), CAC should be calculated over quarterly or annual periods, not monthly. This is a planning and educational tool.',
    ],
    quickReference: [
      { label: 'Healthy LTV:CAC', value: '3:1 minimum' },
      { label: 'Excellent LTV:CAC', value: '5:1 or higher' },
      { label: 'Danger Zone', value: 'Below 1:1 = losing money' },
      { label: 'Payback Target (Ecom)', value: '6-12 months' },
      { label: 'Payback Target (SaaS)', value: '12-18 months' },
      { label: 'DTC Apparel CAC', value: '$15-$50 per customer' },
      { label: 'Ecom Paid Search CAC', value: '$30-$80 per customer' },
      { label: 'SaaS B2B CAC', value: '$200-$1,000 per customer' },
      { label: 'CAC Formula', value: 'Marketing Spend ÷ New Customers' },
      { label: 'LTV Formula (Gross)', value: '(AOV × Frequency × GM%) ÷ Churn' },
    ],
    citations: [
      { source: 'HubSpot', url: 'https://blog.hubspot.com/marketing/what-is-cac' },
      { source: 'Google Analytics', url: 'https://support.google.com/analytics/answer/9311489' },
    ],
  },
};

export default cacConfig;
