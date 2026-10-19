import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { marginExplain, solveMargin } from '../margin-calculator/marginMath';
import { createElement } from 'react';
import ProfitMarginPanel from './ProfitMarginPanel';

const profitMarginConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'mode',
      label: 'Calculate',
      type: 'select',
      required: true,
      options: [
        { label: 'Profit Margin (from cost & revenue)', value: 'margin' },
        { label: 'Markup % (from cost & revenue)', value: 'markup' },
        { label: 'Selling Price (from cost & margin %)', value: 'price_from_margin' },
        { label: 'Selling Price (from cost & markup %)', value: 'price_from_markup' },
      ],
    },
    {
      id: 'cost',
      label: 'Cost / COGS',
      type: 'number',
      placeholder: '50',
      prefix: '$',
      min: 0,
      step: 0.01,
      required: true,
      inputMode: 'decimal',
      helpText: 'The total cost to produce or acquire the product',
    },
    {
      id: 'revenue',
      label: 'Selling Price / Revenue',
      type: 'number',
      placeholder: '80',
      prefix: '$',
      min: 0,
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'Required for margin and markup calculations',
    },
    {
      id: 'targetPct',
      label: 'Target Margin or Markup %',
      type: 'number',
      placeholder: '40',
      unit: '%',
      min: 0,
      max: 99.9,
      step: 0.1,
      inputMode: 'decimal',
      helpText: 'Required when calculating selling price',
    },
  ],
  calculate: (values) => {
    const mode = values.mode || 'margin';
    const targetPct = parseFloat(values.targetPct);
    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const pct = (n: number) => `${n.toFixed(2)}%`;

    // The margin/markup/price algebra lives in margin-calculator/marginMath (one source of truth).
    const sol = solveMargin(
      mode === 'margin' || mode === 'markup'
        ? { solveFor: mode, costInput: values.cost, revenueInput: values.revenue }
        : mode === 'price_from_margin'
          ? { solveFor: 'revenue', costInput: values.cost, marginInput: values.targetPct }
          : { solveFor: 'revenue', costInput: values.cost, markupInput: values.targetPct },
    );
    if (!sol) return [];
    const { profit, margin, markup } = sol;
    const markupText = markup === null ? 'N/A (cost is zero)' : pct(markup);

    if (mode === 'margin' || mode === 'markup') {
      return [
        {
          id: 'primary',
          label: mode === 'margin' ? 'Gross Profit Margin' : 'Markup Percentage',
          value: mode === 'margin' ? pct(margin) : markupText,
          highlight: true,
          interpretation: `Margin (profit ÷ selling price) and markup (profit ÷ cost) describe the same $${fmt(profit)} of profit differently — margin is always the smaller number of the two. This is gross profit only, before overhead like rent, salaries, or marketing; net margin after those costs will be lower.`,
          color: profit > 0 ? 'positive' : 'negative',
        },
        { id: 'profit', label: 'Gross Profit', value: `$${fmt(profit)}`, color: profit > 0 ? 'positive' as const : 'negative' as const },
        { id: 'margin', label: 'Gross Margin %', value: pct(margin), color: 'neutral' as const },
        { id: 'markup', label: 'Markup %', value: markupText, color: 'neutral' as const },
      ];
    }

    const label = mode === 'price_from_margin' ? 'Margin' : 'Markup';
    const out: CalculatorResult[] = [
      { id: 'price', label: `Selling Price for ${targetPct}% ${label}`, value: `$${fmt(sol.revenue)}`, highlight: true, color: 'positive' as const },
      { id: 'profit', label: 'Profit per Unit', value: `$${fmt(profit)}`, color: 'positive' as const },
    ];
    if (mode === 'price_from_markup') {
      out.push({ id: 'margin', label: 'Resulting Margin %', value: pct(margin), color: 'neutral' });
    }
    return out;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(ProfitMarginPanel, { values, results });
  },
  explainSteps: (values) => {
    const mode = values.mode || 'margin';
    const sol = solveMargin(
      mode === 'margin' || mode === 'markup'
        ? { solveFor: mode, costInput: values.cost, revenueInput: values.revenue }
        : mode === 'price_from_margin'
          ? { solveFor: 'revenue', costInput: values.cost, marginInput: values.targetPct }
          : { solveFor: 'revenue', costInput: values.cost, markupInput: values.targetPct },
    );
    if (!sol) return [];
    return marginExplain(sol, (n) => `${n.toFixed(2)}%`);
  },
  educational: {
    formula: 'Margin % = (Revenue − Cost) ÷ Revenue × 100 | Markup % = (Revenue − Cost) ÷ Cost × 100',
    formulaDescription:
      'Profit margin measures profit as a percentage of revenue. Markup measures profit as a percentage of cost. These are related but different metrics that are frequently confused in business.',
    diagram: {
      svg: '<svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="210" y="20" font-family="system-ui,sans-serif" font-size="14" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">From Revenue to Profit (Waterfall)</text>' +
        '<!-- Revenue bar --><rect x="30" y="40" width="360" height="30" rx="6" fill="var(--svg-3b82f6)"/>' +
        '<text x="210" y="60" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">Revenue — $100.00</text>' +
        '<!-- COGS deduction --><rect x="30" y="85" width="360" height="20" rx="4" fill="var(--svg-ef4444)"/>' +
        '<text x="210" y="99" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">— Cost of Goods Sold ($40.00)</text>' +
        '<!-- Gross Profit --><rect x="30" y="115" width="216" height="28" rx="6" fill="var(--svg-22c55e)"/>' +
        '<text x="138" y="134" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">Gross Profit — $60.00</text>' +
        '<!-- Expenses --><rect x="30" y="153" width="216" height="18" rx="4" fill="var(--svg-f97316)"/>' +
        '<text x="138" y="165" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">— Operating Expenses ($30.00)</text>' +
        '<!-- Net Profit --><rect x="30" y="181" width="108" height="28" rx="6" fill="var(--svg-8b5cf6)"/>' +
        '<text x="84" y="200" font-family="system-ui,sans-serif" font-size="12" fill="var(--svg-ffffff)" font-weight="600" text-anchor="middle">Net Profit — $30.00</text>' +
        '</svg>',
      alt: 'Waterfall chart showing revenue to net profit after subtracting COGS and operating expenses',
      caption: 'Profit margin shows how much of your revenue you keep after all costs: Revenue − COGS − Expenses = Net Profit',
    },
    variables: [
      { symbol: 'Margin', name: 'Gross Profit Margin', description: 'Profit divided by revenue. A 40% margin means 40 cents of every dollar is profit. Used by investors, accountants, and for industry benchmarking.' },
      { symbol: 'Markup', name: 'Markup Percentage', description: 'Profit divided by cost. A 60% markup means you charge 60% more than your cost. Used by retailers and wholesalers for pricing from cost.' },
    ],
    howToUse: [
      'Select what you want to calculate from the dropdown: margin %, markup %, selling price from margin, or selling price from markup.',
      'Enter your cost/COGS (cost of goods sold).',
      'Enter the selling price (for margin/markup) or target percentage (for price calculation).',
      'View the profit, margin %, and markup % all at once.',
      'Use the results to set your pricing strategy — target margins vary widely by industry and business model.',
    ],
    explanation:
      'Margin and markup are frequently confused. A 50% markup does NOT equal a 50% margin. If cost is $100 and markup is 50%, the price is $150 — but the margin is only 33% (50 ÷ 150). This distinction is critical when negotiating wholesale pricing, setting retail prices, or comparing profitability across industries. Target margins differ a lot between industries, so compare against similar businesses. Real-world example: a furniture store buys a table for $200 and wants a 50% markup, so they price it at $300. The gross margin is 33%. If a buyer asks for "50% margin" pricing on a wholesale deal, the store would need to price at $400 (markup of 100%). Confusing these two terms in a wholesale negotiation could cost thousands in lost profit per order. Another common scenario: a restaurant with food cost of $8 per plate marks up 300% to a menu price of $32. That 300% markup equals a 75% gross margin (24 ÷ 32). Understanding both numbers helps the owner decide whether to raise prices or negotiate with suppliers.',
    commonUses: [
      'Setting retail prices by calculating the required selling price to achieve a target gross margin percentage',
      'Analyzing product profitability by computing gross margin from cost and revenue for inventory management decisions',
      'Understanding the difference between margin and markup to avoid costly miscommunication in wholesale and retail pricing negotiations',
    ],
    faqs: [
      {
        question: 'What is the difference between margin and markup?',
        answer: 'Margin is profit as a percentage of the selling price. Markup is profit as a percentage of the cost. Same profit, different denominators — leading to different percentages. The quick conversion: Margin = Markup / (100 + Markup); Markup = Margin / (100 − Margin). For example, if you want 50% margin, you need 100% markup. If you use 50% markup, you only get 33% margin.',
      },
      {
        question: 'What is a good profit margin for retail?',
        answer: 'It depends heavily on the category and business model, and published figures vary by source. High-volume, low-price categories such as groceries run on thin margins and rely on turnover, while brands selling differentiated products usually need higher gross margins to cover marketing and overhead. Gross margin must be large enough to pay for fees, shipping, returns, advertising and overhead and still leave a net profit, so benchmark against comparable businesses.',
      },
      {
        question: 'How do I calculate my target selling price from desired margin?',
        answer: 'Use the formula: Selling Price = Cost ÷ (1 − Desired Margin %). For example, if your product costs $75 and you want 40% margin: $75 ÷ (1 − 0.40) = $125. This ensures you achieve exactly the margin percentage you target. For a 25% margin on a $60 item: $60 ÷ (1 − 0.25) = $80 selling price.',
      },
      {
        question: 'How do e-commerce platform fees affect my real margin?',
        answer: 'Platform fees are deducted from revenue before calculating net margin, not included in COGS. If a product has 50% gross margin ($50 cost, $100 price) but Amazon charges 15% referral fee ($15) and FBA fee ($5), the net product margin is just 30% ($30 profit on $100). Always model these separately from gross margin.',
      },
      {
        question: 'What is the difference between gross margin and net margin?',
        answer: 'Gross margin only subtracts COGS from revenue. Net margin subtracts ALL expenses: COGS, salaries, rent, marketing, platform fees, shipping, and returns. A business can have 60% gross margin and 3% net margin if overhead is high. This calculator handles gross margin; track both for a complete picture.',
      },
      {
        question: 'Why does my margin drop when I run a discount or sale?',
        answer: 'Discounts reduce revenue without reducing COGS, so every percentage point off your price dramatically impacts margin. If a product has a 40% margin at full price ($100 cost, $167 sale), a 20% discount brings the price to $133 — your margin drops to 25% because COGS remained $100. To maintain the same dollar profit during a sale, you would need to sell significantly more volume. This is why many retailers limit discounts to clearance or specific promotional periods rather than ongoing strategies.',
      },
      {
        question: 'How do shipping costs affect my gross margin calculation?',
        answer: 'If you pass shipping costs to the customer, exclude them from both revenue and COGS. If you offer free shipping and absorb the cost, include inbound shipping in COGS and outbound shipping as a separate operating expense (not COGS for gross margin). Absorbing shipping lowers your effective margin by the shipping cost as a share of the order, so many brands build shipping into the product price to offer "free shipping" while protecting margin.',
      },
      {
        question: 'How should I think about margin when expanding internationally?',
        answer: 'International expansion adds margin-diluting costs: currency conversion fees, higher shipping costs, duties and tariffs, local payment processing fees and localization. Duty rates depend on the product and the country, so check them before committing to a market. Always rerun the margin calculation with country-specific costs.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Jenny runs a handmade candle e-commerce brand. Her soy wax, fragrance, and jar cost $8.50 per candle. She currently sells for $18.99 and wants to know her current margin, then figure out what price she needs for a 60% margin.',
        inputs: { cost: '8.50', revenue: '18.99', targetPct: '60', mode: 'price_from_margin' },
        result: 'Current: 55.24% margin, $10.49 profit. Target price for 60% margin: $21.25',
        insight: 'At $18.99 with $8.50 cost, Jenny has a 55.2% gross margin and $10.49 profit per candle. To achieve a 60% margin, she would need to price at $21.25 — a modest $2.26 increase per candle that delivers a significant improvement in unit profitability. Whether customers accept the higher price is something she would need to test.',
      },
      {
        scenario: 'Marcus runs a wholesale electronics business. A retail buyer asks him for "50% margin" on a product that costs Marcus $120 to source. Marcus is tempted to quote $180 (a 50% markup), but that is only a 33.3% margin. A true 50% margin means pricing at $240.',
        inputs: { cost: '120', revenue: '240', targetPct: '50', mode: 'margin' },
        result: 'Gross Margin = 50.00%, Gross Profit = $120.00, Markup = 100.00%',
        insight: 'At $240 selling price with $120 COGS, the gross margin is exactly 50% ($120 profit / $240 revenue). If Marcus had sold at $180 (thinking 50% markup = 50% margin), he would only have a 33.3% margin. The key lesson: when a buyer asks for "margin," they mean margin, not markup. Clarifying the terminology before quoting avoids a costly mistake.',
      },
      {
        scenario: 'Sophia sells herbal tea blends through her Shopify store. Her blend costs $4.20 per unit including packaging. She currently sells for $12.00 and runs a 15% off sale for Black Friday. She wants to know her margin at full price vs. sale price.',
        inputs: { cost: '4.20', revenue: '12.00', mode: 'margin' },
        result: 'Gross Margin = 65.00%, Gross Profit = $7.80, Markup = 185.71%',
        insight: 'At full price of $12.00, Sophia has a 65% gross margin with $7.80 profit per unit. During the 15% sale at $10.20, her margin drops to 58.8% with $6.00 profit per unit — a 23% reduction in dollar profit per sale. To make the same total profit during the sale period, she would need to sell 30% more units. This helps her decide whether the volume lift justifies the margin sacrifice, and she could set a sale price floor of $9.33 (a 55% margin: 4.20 ÷ 0.45) to protect profitability.',
      },
    ],
    proTips: [
      'Always use margin when talking to investors, accountants, or comparing profitability across competitors. Use markup only for internal pricing from cost — the two metrics are never equal and confusing them in negotiations can cost you thousands.',
      'Build a margin buffer for e-commerce platform fees: if your target is a given margin after fees, price from the net-of-fees margin (use the Amazon FBA or Etsy fee calculators) rather than from gross margin alone.',
      'Track margin per SKU monthly in a spreadsheet alongside sales volume. Products with declining margins need immediate attention — the cause could be rising supplier costs, increased competition forcing price cuts, or hidden fulfillment cost creep.',
      'When evaluating a new product, run the "margin from cost" calculation first: if your target retail price is $40 and you need 50% margin, your max allowable cost is $20. Only source products that come in at or below that number.',
      'For subscription or repeat-purchase products, calculate margin on the first order and on recurring orders separately. First-order margin is usually negative due to acquisition costs; recurring margin on months 2+ is where profitability lives.',
    ],
    limitations: [
      'This calculator computes gross margin only — the profit remaining after subtracting the direct cost of goods sold from revenue. It does not account for operating expenses, fulfillment costs, platform fees, payment processing, advertising, or taxes.',
      'For e-commerce specifically, net product margin after all selling costs is much lower than the gross margin shown here. Model your full P&L including all variable selling costs for a complete picture.',
      'This calculator uses a single-product model and does not handle multi-product margin mix, volume-based discount tiers, or supplier minimum order quantity economics.',
      'For financial reporting or tax purposes, consult an accountant.',
    ],
    quickReference: [
      { label: '25% Margin', value: '33.3% Markup' },
      { label: '33.3% Margin', value: '50% Markup' },
      { label: '50% Margin', value: '100% Markup' },
      { label: '60% Margin', value: '150% Markup' },
      { label: '75% Margin', value: '300% Markup' },
      { label: 'Margin from Markup', value: 'M% = Mu% ÷ (100 + Mu%)' },
      { label: 'Markup from Margin', value: 'Mu% = M% ÷ (100 − M%)' },
      { label: 'Price from Margin', value: 'Cost ÷ (1 − M%/100)' },
    ],
    citations: [
      { source: 'Wikipedia - Profit Margin', url: 'https://en.wikipedia.org/wiki/Profit_margin' },
    ],
  },
};

export default profitMarginConfig;
