import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import BreakEvenPanel from './BreakEvenPanel';

const breakEvenConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'fixedCosts',
      label: 'Total Fixed Costs',
      type: 'number',
      placeholder: '10,000',
      prefix: '$',
      min: 0,
      step: 100,
      required: true,
      inputMode: 'decimal',
      helpText: 'Rent, salaries, insurance, subscriptions — costs that do not change with volume',
    },
    {
      id: 'pricePerUnit',
      label: 'Selling Price per Unit',
      type: 'number',
      placeholder: '49.99',
      prefix: '$',
      min: 0,
      step: 0.01,
      required: true,
      inputMode: 'decimal',
      helpText: 'The price you charge customers for one unit of your product',
    },
    {
      id: 'variableCostPerUnit',
      label: 'Variable Cost per Unit',
      type: 'number',
      placeholder: '18',
      prefix: '$',
      min: 0,
      step: 0.01,
      required: true,
      inputMode: 'decimal',
      helpText: 'Materials, packaging, payment processing — costs per unit sold',
    },
  ],
  calculate: (values) => {
    const fixedCosts = parseFloat(values.fixedCosts);
    const price = parseFloat(values.pricePerUnit);
    const variableCost = parseFloat(values.variableCostPerUnit);

    if ([fixedCosts, price, variableCost].some(isNaN) || price <= 0) return [];

    const contributionMargin = price - variableCost;
    if (contributionMargin <= 0) return [
      { id: 'error', label: 'Error', value: 'Selling price must exceed variable cost', highlight: true, color: 'negative' },
    ];

    const breakEvenUnits = fixedCosts / contributionMargin;
    const breakEvenRevenue = breakEvenUnits * price;
    const contributionMarginPct = (contributionMargin / price) * 100;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return [
      {
        id: 'breakEvenUnits',
        label: 'Break-Even Units',
        value: `${Math.ceil(breakEvenUnits).toLocaleString(undefined)} units`,
        highlight: true,
        color: 'neutral',
        interpretation: `Each unit sold contributes $${fmt(contributionMargin)} toward covering your fixed costs — below this number you're losing money, above it every sale is pure profit. Raising price or cutting variable cost per unit lowers this threshold faster than trying to cut fixed costs, which are usually harder to shrink quickly.`,
      },
      {
        id: 'breakEvenRevenue',
        label: 'Break-Even Revenue',
        value: `$${fmt(breakEvenRevenue)}`,
        color: 'neutral',
      },
      {
        id: 'contributionMargin',
        label: 'Contribution Margin per Unit',
        value: `$${fmt(contributionMargin)} (${contributionMarginPct.toFixed(1)}%)`,
        color: 'positive',
      },
      {
        id: 'fixedCostNote',
        label: 'Fixed Costs to Cover',
        value: `$${fmt(fixedCosts)}`,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(BreakEvenPanel, { values, results });
  },
  educational: {
    formula: 'Break-Even Units = Fixed Costs ÷ (Price per Unit − Variable Cost per Unit)',
    formulaDescription:
      'The break-even point is the sales volume at which total revenues equal total costs — neither profit nor loss is made. It is the most fundamental question every business owner must answer before launching a product.',
    diagram: {
      svg: '<svg viewBox="0 0 420 230" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="210" y="20" font-family="system-ui,sans-serif" font-size="13" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">Break-Even Point</text>' +
        '<!-- Axes --><line x1="50" y1="200" x2="390" y2="200" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/>' +
        '<text x="390" y="218" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="end">Units Sold</text>' +
        '<line x1="50" y1="200" x2="50" y2="20" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/>' +
        '<text x="50" y="16" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)" text-anchor="middle">$</text>' +
        '<!-- Fixed cost line (horizontal) -->' +
        '<line x1="50" y1="170" x2="390" y2="170" stroke="var(--svg-ef4444)" stroke-width="2" stroke-dasharray="5,3"/>' +
        '<text x="395" y="173" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-ef4444)">Fixed Costs</text>' +
        '<!-- Revenue line (sloping up) -->' +
        '<line x1="50" y1="200" x2="370" y2="30" stroke="var(--svg-22c55e)" stroke-width="2.5" stroke-linecap="round"/>' +
        '<text x="375" y="30" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-22c55e)">Revenue</text>' +
        '<!-- Total cost line (sloping up from fixed cost) -->' +
        '<line x1="50" y1="170" x2="370" y2="60" stroke="var(--svg-f59e0b)" stroke-width="2" stroke-linecap="round"/>' +
        '<text x="375" y="58" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-f59e0b)">Total Cost</text>' +
        '<!-- Break-even point -->' +
        '<circle cx="170" cy="145" r="6" fill="var(--svg-1e293b)"/><text x="170" y="140" font-family="system-ui,sans-serif" font-size="11" fill="var(--svg-1e293b)" font-weight="700" text-anchor="middle">BE</text>' +
        '<line x1="170" y1="145" x2="170" y2="200" stroke="var(--svg-1e293b)" stroke-width="1" stroke-dasharray="3,3"/>' +
        '<text x="170" y="214" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-1e293b)" text-anchor="middle" font-weight="600">Break-Even</text>' +
        '</svg>',
      alt: 'Break-even chart showing revenue line crossing total cost line, with shaded loss and profit zones',
      caption: 'Break-even is where total revenue equals total costs — sell more and you profit, sell less and you lose',
    },
    variables: [
      { symbol: 'Fixed Costs', name: 'Fixed Costs', description: 'Costs that remain constant regardless of sales volume: rent, salaries, insurance, software subscriptions, equipment leases.' },
      { symbol: 'CM', name: 'Contribution Margin', description: 'Selling price minus variable cost per unit. Each unit sold contributes this amount toward covering fixed costs. Higher contribution margin means fewer units needed to break even.' },
    ],
    howToUse: [
      'Enter your total monthly or annual fixed costs.',
      'Enter the selling price per unit.',
      'Enter the variable cost per unit (materials, packaging, payment processing fees).',
      'The break-even point tells you exactly how many units you must sell to cover all costs.',
      'Use the result to assess whether your target sales volume is realistic for your market size.',
    ],
    explanation:
      'The break-even analysis is foundational for any product or business. It tells you the minimum sales volume required to avoid losses. Every unit sold beyond break-even contributes directly to profit at the contribution margin rate. For example, if fixed costs are $10,000, selling price is $50, and variable cost is $20, the contribution margin is $30 per unit and break-even is 334 units. Unit 335 generates $30 of pure profit. This analysis helps with pricing decisions, cost control, and evaluating new product viability. A practical edge case: if your selling price is $25 and variable cost is $25, the contribution margin is $0 and break-even never occurs — you lose your fixed costs every period. This is why businesses must ensure price exceeds variable cost. Another scenario: a software startup with $50,000 in monthly fixed costs (engineering salaries, hosting) selling a $100 per month subscription with $5 per month variable cost (hosting, support). The contribution margin is $95 per month, so break-even is just 527 subscribers — achievable for most B2B SaaS products. A coffee shop with $8,000 in monthly fixed costs selling coffee at $4.50 with $1.20 variable cost per cup has a contribution margin of $3.30 per cup. Break-even is 2,424 cups per month, or about 81 cups per day — which is achievable for a shop in a decent location but challenging for a new business in a low-traffic area.',
    commonUses: [
      'Determining the minimum number of units a new product must sell each month to cover fixed costs before launching',
      'Evaluating whether a product pricing strategy is viable by calculating how many sales are needed just to break even',
      'Assessing the impact of cost changes — if supplier prices rise, how many more units must be sold to maintain profitability',
    ],
    faqs: [
      {
        question: 'What is contribution margin?',
        answer: 'Contribution margin is the selling price minus the variable cost per unit. It represents how much each unit sale "contributes" toward covering fixed costs and generating profit. A high contribution margin means each sale does more to cover overhead. For example, a $50 product with $20 variable cost has a $30 contribution margin, meaning every unit sold contributes $30 toward paying fixed costs like rent and salaries.',
      },
      {
        question: 'What is the difference between break-even units and break-even revenue?',
        answer: 'Break-even units is how many you must sell. Break-even revenue is the dollar amount of sales needed. Both represent the same point — multiply units by price to get revenue. For example, 334 units at $50 equals $16,700 in break-even revenue. Both metrics are useful: units tell you about operational capacity, revenue tells you about market size requirements.',
      },
      {
        question: 'What counts as a fixed vs. variable cost?',
        answer: 'Fixed costs do not change with volume: rent, salaries, insurance, software subscriptions, loan payments, equipment leases. Variable costs scale with units sold: raw materials, packaging, credit card fees, shipping, sales commissions, transaction fees. In e-commerce, variable costs also include platform referral fees (per-transaction), payment processing (per-transaction), and returns processing labor. Advertising spend is typically a semi-variable cost best modeled separately rather than folded into either category.',
      },
      {
        question: 'What if I have multiple products?',
        answer: 'For multi-product businesses, calculate break-even using the weighted average contribution margin across all products. If you sell a high-margin product and a low-margin product, the mix matters significantly for overall break-even. If 80% of sales come from the high-margin product and 20% from the low-margin one, the break-even point will be lower than if the mix were reversed.',
      },
      {
        question: 'How does break-even change when I add a new product line?',
        answer: 'Adding a new product line increases fixed costs (more equipment, space, staff) but should also increase total contribution margin. Run the break-even analysis both with and without the new product line to see if the additional fixed costs are justified by the expected contribution margin from the new product. A common rule of thumb: if the new product line can cover its incremental fixed costs within 6 months, it is worth serious consideration.',
      },
      {
        question: 'How should I account for seasonal fluctuations in break-even analysis?',
        answer: 'For seasonal businesses, use annual fixed costs and annual unit projections rather than monthly numbers. If your business does 60% of annual revenue in Q4, a monthly break-even of 1,000 units may look impossible in February but very achievable in November. Alternatively, calculate break-even for each quarter separately with quarterly fixed costs and adjust variable costs for seasonal supplier pricing. E-commerce businesses with strong Q4 seasonality should ensure Q1-Q3 combined contribution covers at least 70% of annual fixed costs.',
      },
      {
        question: 'What is the margin of safety and how does it relate to break-even?',
        answer: 'Margin of safety is how much sales can drop before you reach break-even, expressed as a percentage: (Current Sales − Break-Even Sales) ÷ Current Sales × 100. If your business sells 1,000 units/month and break-even is 600 units, you have a 40% margin of safety — sales could drop 40% before you lose money. A margin of safety below 20% means the business is vulnerable to even modest demand fluctuations or cost increases. Track this metric monthly alongside break-even.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Tom runs a coffee shop with $8,000 in monthly fixed costs (rent, utilities, staff). Each cup sells for $4.50. Variable costs per cup are $1.20 (beans, milk, cup, lid). Tom wants to know how many cups he must sell per month to break even.',
        inputs: { fixedCosts: '8000', pricePerUnit: '4.50', variableCostPerUnit: '1.20' },
        result: '2,425 cups/month (about 81 cups/day) — break-even revenue of $10,912.50',
        insight: 'Contribution margin per cup = $4.50 − $1.20 = $3.30. Break-even = $8,000 ÷ $3.30 = 2,425 cups/month, or about 81 cups per day (30-day month). If the shop is open 12 hours daily, that\'s roughly 7 cups per hour. Tom\'s shop currently sells 95 cups/day, giving him a 17% margin of safety above break-even. To increase profitability, raising the price $0.50 to $5.00 would reduce break-even to 2,105 cups/month (70/day) — a significant safety improvement.',
      },
      {
        scenario: 'Deepa plans to launch a SaaS product with $45,000 in monthly fixed costs (3 engineers at $10K, hosting $3K, sales $7K, admin $5K). The product is priced at $99/month per user with variable costs of $6/month (hosting per user, payment processing). She wants to know minimum subscribers needed.',
        inputs: { fixedCosts: '45000', pricePerUnit: '99', variableCostPerUnit: '6' },
        result: '484 subscribers — break-even revenue of $47,916/month',
        insight: 'Contribution margin = $99 − $6 = $93/user/month. Break-even = $45,000 ÷ $93 = 484 subscribers. At $99/month, 484 users generate $47,916/month in revenue. If Deepa raises the price to $149/month, break-even drops to 315 subscribers — much more achievable for a B2B SaaS in the first year. This analysis helped Deepa decide to launch at $149/month rather than $99.',
      },
      {
        scenario: 'Aisha sells handmade jewelry on Etsy with $2,400 in fixed monthly costs (studio rent, website, tools). Her average necklace sells for $38 with variable costs of $14 (materials, Etsy fees, packaging, $5 shipping). She wants to know break-even and whether she can afford to quit her day job.',
        inputs: { fixedCosts: '2400', pricePerUnit: '38', variableCostPerUnit: '14' },
        result: '100 necklaces/month — break-even revenue of $3,800/month',
        insight: 'Contribution margin = $38 − $14 = $24 per necklace. Break-even = 100 necklaces/month ($3,800 revenue). Aisha currently sells 60 necklaces/month — well below break-even. To reach profitability she needs to either: (1) increase sales 67% to 100 units, (2) raise prices (at $48 with same costs, break-even drops to 71 units), or (3) reduce variable costs (negotiating material costs down to $10 lowers break-even to 86 units). She decides to raise prices to $45 and source materials in bulk, targeting profitability within 6 months.',
      },
    ],
    proTips: [
      'Always model break-even with 3 scenarios: expected, optimistic, and pessimistic. The pessimistic scenario (20% higher fixed costs, 10% lower price, 15% higher variable costs) often reveals whether the business can survive a bad quarter or a competitor price war.',
      'Include your OWN salary in fixed costs, even if you are not paying yourself yet. A business that "breaks even" without owner compensation is still losing money. Your time has value, and this practice also helps with investor conversations — they want to see a business that covers founder salary.',
      'Re-calculate break-even every time a major cost changes. A supplier price increase of just 5% can push break-even up by 15-20% at thin margins. Set calendar reminders to re-run this analysis quarterly or whenever you renegotiate supplier contracts.',
      'For e-commerce, variable costs compound at scale — include returns processing labor, warranty claims, customer support tickets, and loyalty program costs as your business grows. These "invisible" variable costs are often missed in initial break-even calculations and can delay profitability by months.',
      'If break-even is more than 18 months out at projected volumes, seriously consider whether the product is viable. Faster payback is better — target break-even within 6-12 months of launch for physical products, 12-24 months for software.',
    ],
    limitations: [
      'This calculator uses a simplified single-product break-even model with one price, one variable cost per unit, and one fixed cost figure. Real businesses typically have multiple products with varying margins and step-function fixed costs.',
      'The calculator assumes all units are sold at the same price — it does not model volume discounts, promotional pricing, or tiered pricing structures.',
      'It assumes linear cost behavior (variable costs are constant per unit regardless of volume), which may not hold at very low or very high volumes.',
      'For multi-product or multi-channel businesses, use weighted average contribution margin and total fixed costs for a rough estimate. This tool is for educational and planning purposes — consult a financial advisor for business-critical decisions.',
    ],
    quickReference: [
      { label: 'Contribution Margin', value: 'Price − Variable Cost per Unit' },
      { label: 'Contribution Margin Ratio', value: '(Price − VC) ÷ Price × 100' },
      { label: 'Break-Even Units', value: 'Fixed Costs ÷ Contribution Margin' },
      { label: 'Break-Even Revenue', value: 'Fixed Costs ÷ CM Ratio' },
      { label: 'At BE Point', value: 'Total Revenue = Total Cost' },
      { label: 'Margin of Safety', value: '(Actual − BE) ÷ Actual × 100' },
      { label: 'Target: Ecom Product', value: 'BE within 6-12 months' },
      { label: 'Target: SaaS', value: 'BE within 12-24 months' },
      { label: 'Target: Brick & Mortar', value: 'BE within 12-18 months' },
      { label: 'Monthly BE units', value: 'Daily BE × 30 or 26 biz days' },
    ],
    citations: [
      { source: 'SCORE', url: 'https://www.score.org/resource/break-even-analysis' },
      { source: 'Wikipedia', title: 'Break-even (Economics)', url: 'https://en.wikipedia.org/wiki/Break-even_(economics)' },
    ],
  },
};

export default breakEvenConfig;
