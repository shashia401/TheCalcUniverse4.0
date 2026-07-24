import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { createElement } from 'react';
import COGSPanel from './COGSPanel';

const cogsConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'beginningInventory',
      label: 'Beginning Inventory Value',
      type: 'number',
      placeholder: '50,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: 'Value of inventory at the start of the period',
    },
    {
      id: 'purchases',
      label: 'Purchases / Production Costs',
      type: 'number',
      placeholder: '120,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: 'New inventory purchased or manufactured during the period',
    },
    {
      id: 'endingInventory',
      label: 'Ending Inventory Value',
      type: 'number',
      placeholder: '45,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      helpText: 'Value of remaining unsold inventory at end of period',
    },
    {
      id: 'revenue',
      label: 'Revenue for Period',
      type: 'number',
      placeholder: '250,000',
      prefix: '$',
      min: 0,
      step: 100,
      helpText: 'Total revenue — used to calculate gross margin and COGS %',
    },
  ],
  calculate: (values) => {
    const beginInv = parseFloat(values.beginningInventory);
    const purchases = parseFloat(values.purchases);
    const endInv = parseFloat(values.endingInventory);
    const revenue = parseFloat(values.revenue);

    if ([beginInv, purchases, endInv].some(isNaN)) return [];

    const cogs = Math.max(0, beginInv + purchases - endInv);
    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const results: CalculatorResult[] = [
      {
        id: 'cogs',
        label: 'Cost of Goods Sold (COGS)',
        value: `$${fmt(cogs)}`,
        highlight: true,
        interpretation: `COGS only counts direct product costs — inventory, materials, direct labor — not overhead like rent or marketing. It's the number that feeds gross margin and is deductible on your tax return; keeping accurate inventory records matters here since errors compound into every downstream profit calculation.`,
        color: 'neutral' as const,
      },
      {
        id: 'goodsAvailable',
        label: 'Goods Available for Sale',
        value: `$${fmt(beginInv + purchases)}`,
        color: 'neutral' as const,
      },
    ];

    if (!isNaN(revenue) && revenue > 0) {
      const grossProfit = revenue - cogs;
      const grossMargin = (grossProfit / revenue) * 100;
      const cogsPct = (cogs / revenue) * 100;
      results.push(
        { id: 'grossProfit', label: 'Gross Profit', value: `$${fmt(grossProfit)}`, color: grossProfit > 0 ? 'positive' as const : 'negative' as const },
        { id: 'grossMargin', label: 'Gross Margin %', value: `${grossMargin.toFixed(2)}%`, color: grossMargin > 40 ? 'positive' as const : grossMargin > 20 ? 'neutral' as const : 'negative' as const },
        { id: 'cogsPct', label: 'COGS as % of Revenue', value: `${cogsPct.toFixed(2)}%`, color: 'neutral' as const },
      );
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(COGSPanel, { values, results });
  },
  educational: {
    formula: 'COGS = Beginning Inventory + Purchases − Ending Inventory',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="80" y="80" width="280" height="200" fill="var(--svg-f3f4f6)" rx="8"/><rect x="100" y="100" width="240" height="35" fill="var(--svg-3b82f6)" rx="4"/><text x="220" y="123" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)">Beginning Inventory</text><rect x="100" y="145" width="240" height="35" fill="var(--svg-8b5cf6)" rx="4"/><text x="220" y="168" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)">+ Purchases</text><rect x="100" y="190" width="180" height="35" fill="var(--svg-ef4444)" rx="4"/><text x="190" y="213" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)">− Ending Inventory</text><rect x="100" y="240" width="240" height="30" fill="var(--svg-22c55e)" rx="4"/><text x="220" y="260" text-anchor="middle" font-size="14" fill="var(--svg-ffffff)">= COGS</text></svg>',
      alt: 'Formula visual showing beginning inventory plus purchases minus ending inventory equals COGS',
      caption: 'COGS formula — beginning inventory plus purchases minus ending inventory',
    },
    formulaDescription:
      'Cost of Goods Sold is calculated using the basic inventory accounting formula, representing the direct cost of the products sold during a period. It is one of the most important numbers on any income statement.',
    variables: [
      { symbol: 'Beginning Inventory', name: 'Beginning Inventory', description: 'The cost value of all inventory on hand at the start of the accounting period. This matches the ending inventory of the prior period.' },
      { symbol: 'Purchases', name: 'Net Purchases / Production', description: 'All costs of new inventory purchased or manufactured during the period, adjusted for returns and discounts.' },
      { symbol: 'Ending Inventory', name: 'Ending Inventory', description: 'The cost value of remaining unsold inventory at the end of the period. Must be physically counted or estimated using a costing method.' },
    ],
    howToUse: [
      'Enter the value of your beginning inventory (from the start of the period).',
      'Enter the total cost of inventory purchased or produced during the period.',
      'Enter the value of unsold inventory remaining at the end of the period.',
      'Optionally enter total revenue to see gross profit and margin calculations.',
      'Review COGS as a percentage of revenue — if it is too high, explore supplier alternatives or price increases.',
    ],
    explanation:
      'COGS is a critical income statement line item. It represents the direct cost of the products a business sells. Lower COGS with the same revenue means higher gross profit and margin. COGS only includes costs directly tied to production: raw materials, direct labor, and manufacturing overhead. It does NOT include selling expenses, marketing, or administrative overhead — those are operating expenses. Tracking COGS accurately is essential for understanding true product profitability and pricing strategy. Real-world example: a clothing brand reports beginning inventory of $50,000, makes $120,000 in purchases, and has $45,000 in ending inventory. Their COGS is $125,000. If revenue is $250,000, gross profit is $125,000 (50% margin). If the owner overestimates ending inventory at $55,000, COGS drops to $115,000 and margin inflates to 54% — creating a false picture of profitability that will reverse when the inventory error is discovered. This is why physical inventory counts and accurate costing methods matter so much. For a manufacturer, COGS also includes factory labor and overhead. A furniture maker spending $200 on wood, $50 on hardware, $80 in direct labor, and $30 in factory overhead per table has a COGS of $360 per table.',
    commonUses: [
      'Calculating true product cost for inventory accounting and tax reporting at the end of each accounting period',
      'Determining gross profit and gross margin by subtracting COGS from revenue to evaluate business profitability',
      'Tracking inventory efficiency by monitoring COGS as a percentage of revenue month over month to spot cost trends',
      'Comparing COGS across different product lines to identify which products are most profitable to sell',
    ],
    faqs: [
      {
        question: 'What is included in COGS?',
        answer: 'COGS includes all costs directly related to production: raw materials, direct labor, manufacturing overhead, inbound freight, and import duties. It excludes operating expenses like rent, non-production salaries, marketing, and administrative costs.',
      },
      {
        question: 'What is the difference between COGS and operating expenses?',
        answer: 'COGS is the direct cost of goods sold. Operating expenses (rent, salaries, marketing) are costs of running the business. COGS is deducted from revenue first to calculate gross profit, then operating expenses are deducted to get operating income.',
      },
      {
        question: 'What inventory costing methods can I use?',
        answer: 'Common methods include FIFO (First In, First Out), LIFO (Last In, First Out — not allowed under IFRS), and Weighted Average Cost. Each method can produce different COGS values, especially during periods of inflation. FIFO generally produces lower COGS in inflationary environments, which increases reported profit.',
      },
      {
        question: 'How does COGS affect my taxes?',
        answer: 'COGS directly reduces taxable income. The IRS requires businesses that carry inventory to use an accrual method of accounting and accurately track COGS. Overstating ending inventory (and thus understating COGS) inflates taxable profit; understating ending inventory increases COGS and reduces taxable profit.',
      },
      {
        question: 'How does the costing method (FIFO vs. LIFO) affect COGS?',
        answer: 'In periods of rising prices, FIFO assumes older (cheaper) inventory is sold first, resulting in lower COGS and higher reported profit. LIFO assumes newer (more expensive) inventory is sold first, resulting in higher COGS and lower taxable income. Weighted average smooths price fluctuations. FIFO is the most common method and is required under IFRS accounting standards.',
      },
    ],
    citations: [
      { source: 'IRS', url: 'https://www.irs.gov/businesses/small-businesses-self-employed/cost-of-goods-sold' },
      { source: 'U.S. Small Business Administration', url: 'https://www.sba.gov/business-guide/manage-your-business/manage-your-finances/cost-goods-sold' },
    ],
  },
};

export default cogsConfig;
