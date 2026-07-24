import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import MarginCalculatorPanel from './MarginCalculatorPanel';

const marginCalculatorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'solveFor',
      label: 'Solve For',
      type: 'select',
      options: [
        { label: 'Gross Margin (%)', value: 'margin' },
        { label: 'Markup (%)', value: 'markup' },
        { label: 'Revenue / Selling Price ($)', value: 'revenue' },
        { label: 'Cost ($)', value: 'cost' },
      ],
    },
    {
      id: 'costInput',
      label: 'Cost (Unit Cost / COGS)',
      type: 'number',
      placeholder: '50.00',
      prefix: '$',
      min: 0,
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'Your cost to produce or purchase the item (required when solving for margin, markup, or revenue)',
    },
    {
      id: 'revenueInput',
      label: 'Revenue (Selling Price)',
      type: 'number',
      placeholder: '90.00',
      prefix: '$',
      min: 0,
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'The price you sell the item for (required when solving for margin, markup, or cost)',
    },
    {
      id: 'marginInput',
      label: 'Gross Margin (%)',
      type: 'number',
      placeholder: '44.44',
      unit: '%',
      min: 0,
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'Enter when solving for revenue or cost using margin (margin = profit / revenue)',
    },
    {
      id: 'markupInput',
      label: 'Markup (%)',
      type: 'number',
      placeholder: '80.00',
      unit: '%',
      min: 0,
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'Enter when solving for revenue or cost using markup (markup = profit / cost)',
    },
  ],
  calculate: (values) => {
    const solveFor = values.solveFor || 'margin';
    const costInput = parseFloat(values.costInput);
    const revenueInput = parseFloat(values.revenueInput);
    const marginInput = parseFloat(values.marginInput);
    const markupInput = parseFloat(values.markupInput);

    const fmt = (n: number): string =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const fmtPct = (n: number): string => `${n.toFixed(4).replace(/\.?0+$/, '')}%`;

    // Helper: compute margin from cost+revenue
    const computeMargin = (cost: number, revenue: number): number =>
      revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;

    // Helper: compute markup from cost+revenue
    const computeMarkup = (cost: number, revenue: number): number =>
      cost > 0 ? ((revenue - cost) / cost) * 100 : 0;

    // ----- solveFor === 'margin' -----
    if (solveFor === 'margin') {
      if (isNaN(costInput) || isNaN(revenueInput) || revenueInput <= 0) return [];
      const cost = costInput;
      const revenue = revenueInput;
      const profit = revenue - cost;
      const margin = computeMargin(cost, revenue);
      const markup = computeMarkup(cost, revenue);

      // Explainer: what 50% markup really means in margin terms
      const exampleMarkup = 50;
      const exampleMargin = (exampleMarkup / (100 + exampleMarkup)) * 100;

      return [
        {
          id: 'solvedValue',
          label: 'Gross Margin (%)',
          value: fmtPct(margin),
          highlight: true,
          interpretation: `Margin and markup answer different questions from the same numbers — margin is profit as a share of the selling price, markup is profit as a share of cost. A 50% markup is only a ${exampleMargin.toFixed(1)}% margin, which is why the two get confused; always check which one a target or industry benchmark actually refers to.`,
          color: profit >= 0 ? 'positive' as const : 'negative' as const,
        },
        {
          id: 'secondaryMetric',
          label: 'Markup (%)',
          value: fmtPct(markup),
          color: 'neutral' as const,
        },
        {
          id: 'grossProfit',
          label: 'Gross Profit (Revenue − Cost)',
          value: `$${fmt(profit)}`,
          color: profit >= 0 ? 'positive' as const : 'negative' as const,
        },
        {
          id: 'costResult',
          label: 'Cost',
          value: `$${fmt(cost)}`,
          color: 'neutral' as const,
        },
        {
          id: 'revenueResult',
          label: 'Revenue (Selling Price)',
          value: `$${fmt(revenue)}`,
          color: 'neutral' as const,
        },
        {
          id: 'marginResult',
          label: 'Gross Margin (%)',
          value: fmtPct(margin),
          color: 'neutral' as const,
        },
        {
          id: 'markupResult',
          label: 'Markup (%)',
          value: fmtPct(markup),
          color: 'neutral' as const,
        },
        {
          id: 'differenceExplainer',
          label: `Key: 50% Markup ≠ 50% Margin — at 50% markup, margin = ${exampleMargin.toFixed(1)}%`,
          value: `Markup % ÷ (100 + Markup %) = Margin %`,
          color: 'neutral' as const,
        },
      ];
    }

    // ----- solveFor === 'markup' -----
    if (solveFor === 'markup') {
      if (isNaN(costInput) || isNaN(revenueInput) || revenueInput <= 0) return [];
      const cost = costInput;
      const revenue = revenueInput;
      const profit = revenue - cost;
      const margin = computeMargin(cost, revenue);
      const markup = computeMarkup(cost, revenue);

      const exampleMarkup = 50;
      const exampleMargin = (exampleMarkup / (100 + exampleMarkup)) * 100;

      return [
        {
          id: 'solvedValue',
          label: 'Markup (%)',
          value: fmtPct(markup),
          highlight: true,
          color: profit >= 0 ? 'positive' as const : 'negative' as const,
        },
        {
          id: 'secondaryMetric',
          label: 'Gross Margin (%)',
          value: fmtPct(margin),
          color: 'neutral' as const,
        },
        {
          id: 'grossProfit',
          label: 'Gross Profit (Revenue − Cost)',
          value: `$${fmt(profit)}`,
          color: profit >= 0 ? 'positive' as const : 'negative' as const,
        },
        {
          id: 'costResult',
          label: 'Cost',
          value: `$${fmt(cost)}`,
          color: 'neutral' as const,
        },
        {
          id: 'revenueResult',
          label: 'Revenue (Selling Price)',
          value: `$${fmt(revenue)}`,
          color: 'neutral' as const,
        },
        {
          id: 'marginResult',
          label: 'Gross Margin (%)',
          value: fmtPct(margin),
          color: 'neutral' as const,
        },
        {
          id: 'markupResult',
          label: 'Markup (%)',
          value: fmtPct(markup),
          color: 'neutral' as const,
        },
        {
          id: 'differenceExplainer',
          label: `Key: 50% Markup ≠ 50% Margin — at 50% markup, margin = ${exampleMargin.toFixed(1)}%`,
          value: `Margin % = Markup % ÷ (100 + Markup %)`,
          color: 'neutral' as const,
        },
      ];
    }

    // ----- solveFor === 'revenue' -----
    if (solveFor === 'revenue') {
      if (isNaN(costInput) || costInput <= 0) return [];
      const cost = costInput;

      // Prefer margin if filled; fall back to markup
      const useMargin = !isNaN(marginInput) && marginInput >= 0 && marginInput < 100;
      const useMarkup = !isNaN(markupInput) && markupInput >= 0;

      if (!useMargin && !useMarkup) return [];

      let revenue: number;
      let solvedVia: string;
      let derivedMargin: number;
      let derivedMarkup: number;

      if (useMargin) {
        // revenue = cost / (1 - margin/100)
        if (marginInput >= 100) return [];
        revenue = cost / (1 - marginInput / 100);
        solvedVia = `${marginInput}% Margin`;
        derivedMargin = marginInput;
        derivedMarkup = computeMarkup(cost, revenue);
      } else {
        // revenue = cost * (1 + markup/100)
        revenue = cost * (1 + markupInput / 100);
        solvedVia = `${markupInput}% Markup`;
        derivedMargin = computeMargin(cost, revenue);
        derivedMarkup = markupInput;
      }

      const profit = revenue - cost;
      const exampleMarkup = 50;
      const exampleMargin = (exampleMarkup / (100 + exampleMarkup)) * 100;

      return [
        {
          id: 'solvedValue',
          label: `Revenue (Selling Price) — from ${solvedVia}`,
          value: `$${fmt(revenue)}`,
          highlight: true,
          color: 'positive' as const,
        },
        {
          id: 'grossProfit',
          label: 'Gross Profit (Revenue − Cost)',
          value: `$${fmt(profit)}`,
          color: profit >= 0 ? 'positive' as const : 'negative' as const,
        },
        {
          id: 'costResult',
          label: 'Cost',
          value: `$${fmt(cost)}`,
          color: 'neutral' as const,
        },
        {
          id: 'revenueResult',
          label: 'Revenue (Selling Price)',
          value: `$${fmt(revenue)}`,
          color: 'neutral' as const,
        },
        {
          id: 'marginResult',
          label: 'Gross Margin (%)',
          value: fmtPct(derivedMargin),
          color: 'neutral' as const,
        },
        {
          id: 'markupResult',
          label: 'Markup (%)',
          value: fmtPct(derivedMarkup),
          color: 'neutral' as const,
        },
        {
          id: 'differenceExplainer',
          label: `Key: 50% Markup ≠ 50% Margin — at 50% markup, margin = ${exampleMargin.toFixed(1)}%`,
          value: `Revenue from Margin: Cost ÷ (1 − Margin%) | Revenue from Markup: Cost × (1 + Markup%)`,
          color: 'neutral' as const,
        },
      ];
    }

    // ----- solveFor === 'cost' -----
    if (solveFor === 'cost') {
      if (isNaN(revenueInput) || revenueInput <= 0) return [];
      const revenue = revenueInput;

      // Prefer margin if filled; fall back to markup
      const useMargin = !isNaN(marginInput) && marginInput >= 0 && marginInput < 100;
      const useMarkup = !isNaN(markupInput) && markupInput >= 0;

      if (!useMargin && !useMarkup) return [];

      let cost: number;
      let solvedVia: string;
      let derivedMargin: number;
      let derivedMarkup: number;

      if (useMargin) {
        // cost = revenue * (1 - margin/100)
        cost = revenue * (1 - marginInput / 100);
        solvedVia = `${marginInput}% Margin`;
        derivedMargin = marginInput;
        derivedMarkup = computeMarkup(cost, revenue);
      } else {
        // cost = revenue / (1 + markup/100)
        cost = revenue / (1 + markupInput / 100);
        solvedVia = `${markupInput}% Markup`;
        derivedMargin = computeMargin(cost, revenue);
        derivedMarkup = markupInput;
      }

      const profit = revenue - cost;
      const exampleMarkup = 50;
      const exampleMargin = (exampleMarkup / (100 + exampleMarkup)) * 100;

      return [
        {
          id: 'solvedValue',
          label: `Cost — from ${solvedVia}`,
          value: `$${fmt(cost)}`,
          highlight: true,
          color: 'positive' as const,
        },
        {
          id: 'grossProfit',
          label: 'Gross Profit (Revenue − Cost)',
          value: `$${fmt(profit)}`,
          color: profit >= 0 ? 'positive' as const : 'negative' as const,
        },
        {
          id: 'costResult',
          label: 'Cost',
          value: `$${fmt(cost)}`,
          color: 'neutral' as const,
        },
        {
          id: 'revenueResult',
          label: 'Revenue (Selling Price)',
          value: `$${fmt(revenue)}`,
          color: 'neutral' as const,
        },
        {
          id: 'marginResult',
          label: 'Gross Margin (%)',
          value: fmtPct(derivedMargin),
          color: 'neutral' as const,
        },
        {
          id: 'markupResult',
          label: 'Markup (%)',
          value: fmtPct(derivedMarkup),
          color: 'neutral' as const,
        },
        {
          id: 'differenceExplainer',
          label: `Key: 50% Markup ≠ 50% Margin — at 50% markup, margin = ${exampleMargin.toFixed(1)}%`,
          value: `Cost from Margin: Revenue × (1 − Margin%) | Cost from Markup: Revenue ÷ (1 + Markup%)`,
          color: 'neutral' as const,
        },
      ];
    }

    return [];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(MarginCalculatorPanel, { values, results });
  },
  educational: {
    formula:
      'Margin % = (Revenue − Cost) ÷ Revenue × 100 | Markup % = (Revenue − Cost) ÷ Cost × 100',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="80" width="320" height="200" fill="var(--svg-e5e7eb)" rx="8"/><rect x="60" y="80" width="220" height="200" fill="var(--svg-ef4444)" rx="8"/><rect x="280" y="80" width="100" height="200" fill="var(--svg-22c55e)" rx="8"/><line x1="280" y1="75" x2="280" y2="285" stroke="var(--svg-666666)" stroke-width="2" stroke-dasharray="5,5"/><text x="170" y="190" text-anchor="middle" font-size="16" fill="var(--svg-ffffff)">Cost</text><text x="330" y="190" text-anchor="middle" font-size="16" fill="var(--svg-ffffff)">Margin</text><text x="220" y="310" text-anchor="middle" font-size="14" fill="var(--svg-333333)">Revenue</text></svg>',
      alt: 'Revenue bar split into cost and margin sections',
      caption: 'Gross margin is the portion of revenue left after subtracting cost',
    },
    formulaDescription:
      'Gross margin measures profit as a share of revenue (the selling price). Markup measures profit as a share of cost. These two percentages are mathematically related but are never equal unless profit is zero. The conversion formula is: Margin % = Markup % ÷ (100 + Markup %) and Markup % = Margin % ÷ (100 − Margin %).',
    variables: [
      {
        symbol: 'Margin %',
        name: 'Gross Profit Margin',
        description:
          'Profit divided by revenue. Tells you what fraction of each dollar of sales is profit. A 40% margin means $0.40 of every $1.00 in revenue is gross profit.',
      },
      {
        symbol: 'Markup %',
        name: 'Markup Percentage',
        description:
          'Profit divided by cost. Tells you how much above cost you are pricing the item. An 80% markup means you charge 80% more than what the item costs you.',
      },
      {
        symbol: 'COGS',
        name: 'Cost of Goods Sold',
        description:
          'The direct cost to produce or purchase one unit. Includes materials, manufacturing, and in e-commerce: product cost + inbound shipping.',
      },
      {
        symbol: 'Revenue',
        name: 'Selling Price',
        description:
          'The price the customer pays. In retail/e-commerce, this is the list price before any discounts or fees.',
      },
      {
        symbol: 'Gross Profit',
        name: 'Gross Profit (Dollars)',
        description:
          'Revenue minus COGS, expressed in dollars. This is the absolute profit before operating expenses. A 40% margin on a $100 item yields $40 of gross profit per unit.',
      },
    ],
    howToUse: [
      'Select what you want to solve for using the "Solve For" dropdown.',
      'To find your margin or markup: enter Cost and Revenue, then select Gross Margin or Markup.',
      'To find the right selling price: enter Cost and either your target Margin % or Markup %, then select Revenue.',
      'To find your allowable cost: enter Revenue and either your target Margin % or Markup %, then select Cost.',
      'All four results (cost, revenue, margin, markup) are shown together so you can see the full picture at once.',
    ],
    explanation:
      'The single most common mistake in retail and e-commerce pricing is treating margin and markup as the same number. They are not — and confusing them leads to systematic under-pricing that quietly destroys profitability.\n\nHere is the core math: if your cost is $50 and you apply a 50% markup, your price is $75 and your margin is 33.3% — not 50%. Why? Because margin is calculated on the selling price ($25 profit ÷ $75 = 33.3%), while markup is calculated on cost ($25 profit ÷ $50 = 50%). Same $25 profit, two completely different percentages.\n\nThis matters most when communicating with buyers, wholesale partners, or platforms. A buyer might ask for "50% margin" and you quote "50% markup" — you have just accepted a deal that pays you far less than expected.\n\nConversion formulas:\n  Margin from Markup: Margin % = Markup % ÷ (100 + Markup %)\n  Markup from Margin: Markup % = Margin % ÷ (100 − Margin %)\n\nExample: 80% markup → 80 ÷ 180 = 44.4% margin. 50% margin → 50 ÷ 50 = 100% markup.\n\nFor e-commerce specifically, gross margin only tells part of the story. After platform fees (Amazon ~15%, Shopify payments ~2.9%), shipping, returns (~5-20% in apparel), and ad spend (often 20-40% of revenue as TACOS/ACOS), net margin is often 5-15% of what gross margin suggests. Always model your full P&L, not just your margin.',
    commonUses: [
      'Setting retail or wholesale prices by calculating the correct selling price from cost and your desired margin percentage',
      'Avoiding costly pricing mistakes by understanding the difference between margin and markup when negotiating with buyers',
      'Determining the maximum allowable product cost to hit a target margin at a given market selling price',
      'Converting between margin and markup percentages for accurate financial reporting and pricing strategy decisions',
    ],
    faqs: [
      {
        question: 'Why does 50% markup not equal 50% margin?',
        answer:
          'Because they use different denominators. Markup divides profit by cost; margin divides profit by revenue (the selling price). At 50% markup: cost $100, price $150, profit $50. Markup = $50 ÷ $100 = 50%. Margin = $50 ÷ $150 = 33.3%. The higher the markup, the bigger the gap between the two numbers. At 100% markup (doubling the price), margin is only 50%.',
      },
      {
        question: 'Which metric should I use — margin or markup?',
        answer:
          'Use margin when talking to investors, accountants, or comparing profitability across businesses (industry benchmarks are almost always in margin terms). Use markup when setting prices from cost — it is simpler to say "apply a 2x markup" than to say "target a 50% margin." Both are correct; just be explicit about which you mean to avoid costly miscommunication.',
      },
      {
        question: 'What is a good gross margin for e-commerce?',
        answer:
          'It varies by category: Consumer electronics 10-25%, Apparel 50-70%, Beauty/personal care 60-80%, Home goods 40-60%, Software/digital goods 70-90%. Amazon FBA sellers often target 30-50% gross margin before fees; after Amazon\'s referral fee (8-15%) and FBA fees, net product margin is often 15-30%. Always model fees explicitly — they are not small.',
      },
      {
        question: 'How do I back-calculate what my cost must be to hit a target margin?',
        answer:
          'Use the formula: Cost = Revenue × (1 − Margin %). For example, if your selling price is $100 and you need 60% gross margin, your maximum allowable cost is $100 × (1 − 0.60) = $40. This is called "cost-back" or "design-to-cost" pricing and is the correct approach when you cannot change your price (e.g., a marketplace category where price competition is fierce).',
      },
      {
        question: 'What is the difference between gross margin and net margin?',
        answer:
          'Gross margin = (Revenue − COGS) ÷ Revenue. It only subtracts the direct cost of goods. Net margin = (Revenue − All Expenses) ÷ Revenue. It subtracts COGS plus all operating expenses: rent, labor, software, ads, shipping, returns, payment processing. A business can have 60% gross margin and 2% net margin if overhead is high. This calculator computes gross margin. Always track both.',
      },
      {
        question: 'When would I solve for cost instead of revenue?',
        answer:
          'Solve for cost when your selling price is fixed by the market (e.g., competitive marketplace categories) and you need to determine the maximum you can pay your supplier. For example, if your product must sell at $49.99 to compete and you need 40% margin, your max COGS is $49.99 × (1 − 0.40) = $29.99. This tells you exactly what to negotiate with suppliers. If no supplier can meet that cost, the product is not viable at that price point.',
      },
      {
        question: 'How does offering free shipping change my margin calculation?',
        answer:
          'Free shipping is effectively a cost you absorb. If your shipping cost is $5 per order and you offer free shipping, you should either: (1) include the $5 in COGS before calculating margin, or (2) treat shipping as a separate line item and calculate margin on revenue minus COGS minus shipping. Many e-commerce businesses that switch to free shipping find their effective margin drops 5-10 percentage points. To compensate, some increase product prices slightly to absorb the shipping cost while maintaining margin.',
      },
      {
        question: 'What is the relationship between margin and inventory turn rate?',
        answer:
          'Low-margin products can still be highly profitable if they turn over quickly. A product with 20% margin that sells 12 times per year can generate more annual profit than a product with 60% margin that sells twice per year. For example: a $20 product with 20% margin ($4 profit) selling 1,000 units/month generates $48,000 annual profit. A $100 product with 60% margin ($60 profit) selling 50 units/month generates only $36,000 annual profit. Always consider margin in context of volume and turn rate.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Mike runs a furniture store and buys a dining table for $200 from his supplier. He wants to price it at 50% gross margin. He uses the "Solve for Revenue with Margin" mode to find the correct selling price.',
        inputs: { solveFor: 'revenue', costInput: '200', marginInput: '50' },
        result: 'Selling price = $400.00, Gross Profit = $200.00, Margin = 50%, Markup = 100%',
        insight: 'At 50% margin, Mike needs to sell the table for $400. Gross profit is $200 per table. If he mistakenly used 50% markup instead (a common error), he would price at $300 — that gives only 33.3% margin and $100 less profit per table. On 50 tables sold per quarter, that confusion costs $5,000 in lost profit. Mike now uses the calculator for every new product to ensure margins are calculated correctly.',
      },
      {
        scenario: 'Nadia sells skincare products on Amazon at $34.99. She needs a 35% margin minimum to be profitable after Amazon fees. She wants to know the maximum she can pay her supplier per unit.',
        inputs: { solveFor: 'cost', revenueInput: '34.99', marginInput: '35' },
        result: 'Maximum allowable COGS = $22.74 per unit',
        insight: 'Nadia\'s maximum allowable COGS is $34.99 × (1 − 0.35) = $22.74 per unit. She currently pays $24.50, which gives only 30% margin — below her 35% target. She negotiates with her supplier for a volume discount, getting cost down to $21.90 by committing to 2,000 units per order. This brings her margin to 37.4%, giving her a 2.4% buffer above her minimum threshold for seasonal price promotions.',
      },
      {
        scenario: 'A competitor analysis reveals that three similar products in Raj\'s category sell for $59.99, $64.99, and $69.99. Raj\'s cost is $28 per unit. He uses the margin calculator at each price to find the sweet spot.',
        inputs: { solveFor: 'margin', costInput: '28', revenueInput: '64.99' },
        result: 'Gross Margin = 56.9%, Gross Profit = $36.99, Markup = 132.1%',
        insight: 'At $59.99 margin is 53.3% with $31.99 profit; at $64.99 margin is 56.9% with $36.99 profit; at $69.99 margin is 60% with $41.99 profit. Raj chooses $64.99 — it positions him in the middle of the competitive set while delivering a healthy 56.9% margin. The extra $5 in price from the lowest option yields $5 more profit per unit, which compounds significantly at scale.',
      },
    ],
    proTips: [
      'The "Solve For" dropdown lets you work four different pricing problems with one calculator. Learn all four modes: margin from price, markup from price, price from margin, and cost from margin — they cover virtually every pricing question you will face in e-commerce.',
      'Always calculate your cost-back (max COGS) before approaching suppliers. Knowing your ceiling prevents overpaying. The formula is simple: Max Cost = Selling Price × (1 − Target Margin %). Use this calculator\'s "Solve for Cost" mode to verify.',
      'When negotiating wholesale bulk discounts, run the margin calculation at the new lower cost. A 10% cost reduction increases margin by MORE than 10% — on a $100 item with 40% margin, a 10% cost cut (from $60 to $54) raises margin to 46%, a 15% margin improvement.',
      'Track your margin at list price AND at your most common discount level. A product with 55% margin at full price drops to 40% at 25% off — knowing both numbers prevents over-discounting during sales events.',
    ],
    limitations: [
      'This calculator computes gross margin using standard formulas with a single-product model and fixed cost/revenue inputs. Results represent gross values before platform fees, payment processing, shipping, returns, advertising, and other operating expenses.',
      'For e-commerce specifically, effective net margin after all selling costs is often 40-70% lower than gross margin. Multi-product businesses should use weighted average COGS for overall margin analysis.',
      'Volume discounts, supplier tier pricing, seasonal cost fluctuations, and currency exchange rate effects are not modeled.',
      'For financial reporting, tax preparation, or investor presentations, verify figures with an accountant.',
    ],
    quickReference: [
      { label: '25% Markup', value: '20% Margin' },
      { label: '50% Markup', value: '33.3% Margin' },
      { label: '100% Markup', value: '50% Margin' },
      { label: '200% Markup', value: '66.7% Margin' },
      { label: '300% Markup', value: '75% Margin' },
      { label: 'Margin → Markup', value: 'M% ÷ (100 − M%)' },
      { label: 'Markup → Margin', value: 'Mu% ÷ (100 + Mu%)' },
      { label: 'Price from Cost+Markup', value: 'Cost × (1 + Mu%/100)' },
      { label: 'Ecom Healthy GM', value: '35-65% depending on category' },
      { label: 'Cost from Price+Margin', value: 'Price × (1 − M%/100)' },
    ],
    citations: [
      { source: 'Shopify', url: 'https://www.shopify.com/blog/markup-vs-margin' },
      { source: 'U.S. Small Business Administration', url: 'https://www.sba.gov/business-guide/manage-your-business/manage-your-finances/cost-goods-sold' },
    ],
  },
};

export default marginCalculatorConfig;
