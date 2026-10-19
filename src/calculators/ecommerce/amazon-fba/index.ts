import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { computeFba, isFbaCategory, FBA_CATEGORY_LABELS, STORAGE_RATE_PER_CUFT, type FbaCategory } from './fbaMath';
import AmazonFBAPanel from './AmazonFBAPanel';
import { finiteSteps } from '../../../utils/explainGuard';
import type { ExplainStep } from '../../../types/calculator';

const amazonFbaConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'sellingPrice',
      label: 'Amazon Selling Price',
      type: 'number',
      placeholder: '29.99',
      prefix: '$',
      min: 0,
      max: 100000,
      step: 0.01,
      inputMode: 'decimal',
      required: true,
      helpText: 'The price you plan to list the product for on Amazon. This should be competitive with similar products in your category. Research the top 10 listings in your subcategory for pricing benchmarks.',
    },
    {
      id: 'productCost',
      label: 'Product Cost (COGS)',
      type: 'number',
      placeholder: '7.50',
      prefix: '$',
      min: 0,
      max: 100000,
      step: 0.01,
      inputMode: 'decimal',
      required: true,
      helpText: 'Your total landed cost per unit. This includes: manufacturing cost + freight/shipping to Amazon FBA warehouse + customs duties + inspection + labeling + packaging. Be thorough -- forgetting freight or customs costs is a common new-seller mistake that wipes out margins.',
    },
    {
      id: 'weight',
      label: 'Unit Weight',
      type: 'number',
      placeholder: '1.2',
      unit: 'lbs',
      min: 0,
      max: 150,
      step: 0.1,
      inputMode: 'decimal',
      required: true,
      helpText: 'The total packaged weight of one unit (product + box + packing materials) as it ships to the customer. FBA fulfillment fees are based on this weight. Use a shipping scale for accuracy.',
    },
    {
      id: 'category',
      label: 'Product Category',
      type: 'select',
      required: true,
      options: [
        { label: 'General / Standard (15%)', value: 'general' },
        { label: 'Apparel & Accessories (5% / 10% / 17% by price)', value: 'apparel' },
        { label: 'Consumer Electronics (8%)', value: 'electronics' },
        { label: 'Electronics Accessories (15% up to $100, 8% above)', value: 'electronics-accessories' },
        { label: 'Books / Media (15% + $1.80 closing fee)', value: 'books' },
        { label: 'Jewelry (20% up to $250, 5% above)', value: 'jewelry' },
        { label: 'Beauty, Health & Personal Care (8% to $10, 15% above)', value: 'beauty' },
        { label: 'Sports & Outdoors (15%)', value: 'sports' },
      ],
      helpText: 'The Amazon category your product is listed in determines the referral fee. Several categories (apparel, jewelry, beauty, electronics accessories) use price-tiered rates, applied automatically. Rates per Amazon\'s published referral-fee schedule, checked October 2026.',
    },
    {
      id: 'volume',
      label: 'Packaged Volume (optional)',
      type: 'number',
      placeholder: '0.1',
      unit: 'cu ft',
      min: 0,
      max: 100,
      step: 0.01,
      inputMode: 'decimal',
      helpText: 'Packaged length x width x height in cubic feet (inches: L x W x H / 1,728). Used to estimate ONE month of storage per unit. Leave blank to exclude storage.',
    },
  ],
  calculate: (values) => {
    const price = parseFloat(values.sellingPrice);
    const cost = parseFloat(values.productCost);
    const weight = parseFloat(values.weight);
    const volume = parseFloat(values.volume);
    const category: FbaCategory = isFbaCategory(values.category) ? values.category : 'general';

    if (![price, cost, weight].every(Number.isFinite) || price <= 0 || weight <= 0 || cost < 0) return [];

    const f = computeFba(price, cost, weight, category, Number.isFinite(volume) ? volume : 0);
    const margin = Math.round(f.marginPct * 10) / 10;
    const roi = Math.round(f.roiPct * 10) / 10;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const results: CalculatorResult[] = [
      {
        id: 'netProfit',
        label: 'Net Profit per Unit',
        value: `$${fmt(f.netProfit)}`,
        highlight: true,
        color: f.netProfit > 0 ? 'positive' : 'negative',
        interpretation: `This is per-unit after Amazon's referral and FBA fulfillment fees (fulfillment is an illustrative weight-only estimate) — multiply by monthly unit volume to see real cash flow. Advertising (PPC), returns and inbound shipping are not included, and most new listings need ad spend to gain visibility.`,
      },
      {
        id: 'margin',
        label: 'Net Margin',
        value: `${margin.toFixed(1)}%`,
        color: margin > 20 ? 'positive' : margin > 10 ? 'neutral' : 'negative',
      },
      {
        id: 'roi',
        label: 'ROI on Cost',
        value: `${roi.toFixed(1)}%`,
        color: roi > 50 ? 'positive' : roi > 20 ? 'neutral' : 'negative',
      },
      {
        id: 'referralFee',
        label: `Referral Fee (${f.referralPct.toFixed(1)}% effective)`,
        value: `$${fmt(f.referral)}`,
        color: 'negative',
      },
    ];
    if (f.closing > 0) {
      results.push({ id: 'closingFee', label: 'Media Closing Fee', value: `$${fmt(f.closing)}`, color: 'negative' });
    }
    results.push(
      {
        id: 'fbaFee',
        label: 'FBA Fulfillment Fee (illustrative)',
        value: `$${fmt(f.fulfillment)}`,
        color: 'negative',
      },
      {
        id: 'storageFee',
        label: 'Est. Monthly Storage Fee',
        value: `$${fmt(f.storage)}/mo`,
        color: 'negative',
      },
    );
    return results;
  },
  explainSteps: (values) => {
    const price = parseFloat(values.sellingPrice);
    const cost = parseFloat(values.productCost);
    const weight = parseFloat(values.weight);
    const volume = parseFloat(values.volume);
    const category: FbaCategory = isFbaCategory(values.category) ? values.category : 'general';
    if (![price, cost, weight].every(Number.isFinite) || price <= 0 || weight <= 0 || cost < 0) return [];
    const f = computeFba(price, cost, weight, category, Number.isFinite(volume) ? volume : 0);
    const m = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const pc = (n: number) => `${parseFloat(n.toFixed(2))}%`;
    const steps: ExplainStep[] = [
      { label: 'Referral fee, Amazon\'s cut of the sale', expr: `${m(price)} × ${pc(f.referralPct)} (effective rate for ${FBA_CATEGORY_LABELS[category]}) = ${m(f.referral)}`, note: 'The rate depends on category and price band; there is a per-item minimum in most categories.' },
    ];
    if (f.closing > 0) steps.push({ label: 'Media closing fee', expr: `+ ${m(f.closing)} per item sold` });
    steps.push({ label: 'FBA fulfillment fee (illustrative estimate)', expr: `${weight} lb → ${m(f.fulfillment)}`, note: 'This is a weight-only approximation. Amazon bills by size tier, dimensional weight and price band, so check its current rate card.' });
    if (f.storage > 0) steps.push({ label: 'Monthly storage per unit', expr: `${volume} cu ft × ${m(STORAGE_RATE_PER_CUFT)} = ${m(f.storage)}`, note: 'Counted as one month of storage per unit.' });
    steps.push({ label: 'Add up the fees', expr: `${m(f.referral)}${f.closing > 0 ? ` + ${m(f.closing)}` : ''} + ${m(f.fulfillment)}${f.storage > 0 ? ` + ${m(f.storage)}` : ''} = ${m(f.totalFees)}` });
    steps.push({ label: 'Net profit per unit', expr: `${m(price)} − ${m(cost)} cost − ${m(f.totalFees)} fees = ${m(f.netProfit)}`, note: 'Advertising, returns and inbound shipping are not included.' });
    steps.push({ label: 'Margin and return on cost', expr: `Margin = ${m(f.netProfit)} ÷ ${m(price)} = ${(Math.round(f.marginPct * 10) / 10).toFixed(1)}%${cost > 0 ? `; ROI = ${m(f.netProfit)} ÷ ${m(cost)} = ${(Math.round(f.roiPct * 10) / 10).toFixed(1)}%` : ''}` });
    return finiteSteps(steps);
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(AmazonFBAPanel, { values, results });
  },
  educational: {
    formula: 'Net Profit = Price − COGS − Referral Fee − FBA Fulfillment Fee − Storage Fee',
    formulaSource:
      'Referral-fee percentages follow Amazon\'s published US referral-fee schedule (sell.amazon.com/pricing, checked October 2026). The FBA fulfillment and storage figures are illustrative weight-only approximations of Amazon\'s rate card, not the current published rates.',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="80" y="30" width="280" height="260" fill="var(--svg-e5e7eb)" rx="4"/><rect x="80" y="30" width="280" height="50" fill="var(--svg-22c55e)" rx="4"/><rect x="80" y="80" width="280" height="50" fill="var(--svg-ef4444)" rx="4"/><rect x="80" y="130" width="280" height="50" fill="var(--svg-3b82f6)" rx="4"/><rect x="80" y="180" width="280" height="50" fill="var(--svg-8b5cf6)" rx="4"/><rect x="80" y="230" width="280" height="60" fill="var(--svg-22c55e)" rx="4"/><text x="220" y="58" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)" font-weight="bold">Price</text><text x="220" y="108" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Referral + FBA + Storage</text><text x="220" y="158" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">COGS</text><text x="220" y="208" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Fees</text><text x="220" y="268" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)" font-weight="bold">Profit</text></svg>',
      alt: 'Stacked bar chart showing price breakdown into fees and profit',
      caption: 'Amazon FBA fees — referral, fulfillment, and storage fees reduce your profit',
    },
    formulaDescription:
      'Amazon FBA profitability requires accounting for Amazon\'s referral fee (a percentage of the sale price, tiered by price in some categories), the fulfillment fee (based on size, weight and price band), and storage fees.',
    variables: [
      { symbol: 'Referral Fee', name: 'Category Referral Fee', description: 'A percentage of the sale price that depends on category; apparel, jewelry, beauty and electronics accessories use price tiers. Most categories have a $0.30 minimum per item.' },
      { symbol: 'FBA Fee', name: 'Fulfillment by Amazon Fee', description: 'Per-unit fee for Amazon to pick, pack, and ship your product. Here: an illustrative weight-only estimate.' },
      { symbol: 'Storage Fee', name: 'Monthly Inventory Storage', description: 'Charged per cubic foot per month on packaged volume; the rate is higher in October-December. Here: one month per unit at an illustrative Jan-Sep rate.' },
    ],
    howToUse: [
      'Enter your Amazon selling price and product cost (landed cost).',
      'Enter the packaged weight of the unit, and optionally its packaged volume for a storage estimate.',
      'Select the product category for the correct referral fee.',
      'View net profit, margin, ROI, and itemized fee breakdown. Check the exact FBA fee for your ASIN in Amazon\'s Revenue Calculator.',
    ],
    explanation:
      'Amazon FBA sellers must account for several layers of fees. The referral fee is charged on every sale; for example Consumer Electronics is 8%, Sports & Outdoors 15%, Apparel is 5% up to $15, 10% from $15 to $20 and 17% above $20, and Jewelry is 20% on the first $250 and 5% above that. The FBA fulfillment fee covers picking, packing and shipping and depends on size tier, weight and (since 2026) price band; this calculator uses an illustrative weight-only estimate. Storage is billed monthly per cubic foot, at a higher rate in Q4. Net margin and ROI are then computed from what is left after cost and fees. Advertising, returns and inbound freight are not included, so treat the result as a ceiling, not a forecast.',
    faqs: [
      {
        question: 'Are advertising costs included in this calculator?',
        answer: 'No. Amazon PPC (pay-per-click) advertising is a major additional cost that is not included here. Subtract your expected ad cost per unit from the net profit shown to get a more realistic figure.',
      },
      {
        question: 'What is the difference between FBA and FBM?',
        answer: 'FBA (Fulfilled by Amazon) has Amazon store, pack and ship your products. FBM (Fulfilled by Merchant) means you ship directly to customers. FBA listings are eligible for Prime, which usually helps win the Buy Box, but carry fulfillment and storage fees.',
      },
      {
        question: 'How does the FBA fulfillment fee change with weight?',
        answer: 'In this calculator: $3.22 up to 1 lb, $4.18 up to 2 lb, $5.29 up to 3 lb, then $0.38 per extra pound up to 21 lb, a straight line between 21 lb and 90 lb, and $0.83 per pound above 90 lb. These are illustrative figures from an earlier rate card, not Amazon\'s current ones: the real fee also depends on size tier, dimensional weight and, from 2026, the item\'s price band. Use the Revenue Calculator in Seller Central for an exact ASIN quote.',
      },
      {
        question: 'What is the referral fee and how does it vary by category?',
        answer: 'The referral fee is Amazon\'s commission on each sale. Consumer Electronics is 8%; Electronics Accessories are 15% up to $100 and 8% above; Sports & Outdoors and most general categories are 15%; Books and Media are 15% plus a $1.80 closing fee; Apparel is 5% up to $15, 10% from $15 to $20 and 17% above $20; Jewelry is 20% on the first $250 and 5% above; Beauty, Health & Personal Care is 8% up to $10 and 15% above. Most categories have a $0.30 minimum per item. Rates checked against Amazon\'s published schedule in October 2026; Amazon can change them.',
      },
      {
        question: 'What other costs should FBA sellers consider?',
        answer: 'Beyond the fees shown here: PPC advertising, return-processing fees, aged-inventory and long-term storage surcharges, removal or disposal fees, prep and labeling services, inbound freight and duties (these belong in your landed COGS), and the Professional selling plan fee ($39.99 per month at the time of checking).',
      },
    ],
    workedExamples: [
      {
        scenario: 'Private Label Kitchen Gadget: Garlic Press at $24.99, Standard Category',
        inputs: { sellingPrice: '24.99', productCost: '6.50', weight: '0.8', category: 'general', volume: '0.1' },
        result: 'Referral fee (15%): $3.75. FBA fulfillment (0.8 lb, up to 1 lb tier): $3.22. Storage (0.1 cu ft x $0.78): $0.08. Total fees: $7.05. Net profit: $24.99 - $6.50 - $7.05 = $11.44. Net margin: 45.8%. ROI: 176.1%.',
        insight: 'Strong unit economics before advertising. If PPC adds, say, $5.00 per unit, net profit drops to about $6.44 (25.8% margin), still viable. Light weight keeps the fulfillment fee in the lowest tier.',
      },
      {
        scenario: 'Heavy Fitness Equipment: Adjustable Dumbbell Set at $89.99, Sports Category',
        inputs: { sellingPrice: '89.99', productCost: '35.00', weight: '12', category: 'sports', volume: '1.56' },
        result: 'Referral fee (15%): $13.50. FBA fulfillment (12 lb): 5.29 + (12 - 3) x 0.38 = $8.71. Storage (1.56 cu ft x $0.78): $1.22. Total fees: $23.43. Net profit: $89.99 - $35.00 - $23.43 = $31.56. Net margin: 35.1%. ROI: 90.2%.',
        insight: 'Heavy items make fulfillment and storage material. Also check dimensional weight: in a 24 x 14 x 8 inch box it is 24 x 14 x 8 / 139 = 19.3 lb, above the 12 lb actual weight, and Amazon bills the greater of the two. Re-running this calculator with 19.3 lb gives a fulfillment fee of about $11.50 and cuts net profit by roughly $2.79.',
      },
      {
        scenario: 'Phone Charging Cable at $15.99, Electronics Accessories',
        inputs: { sellingPrice: '15.99', productCost: '2.80', weight: '0.2', category: 'electronics-accessories', volume: '0.02' },
        result: 'Referral fee (15% of the first $100): $2.40. FBA fulfillment (0.2 lb): $3.22. Storage (0.02 cu ft x $0.78): $0.02. Total fees: $5.63. Net profit: $15.99 - $2.80 - $5.63 = $7.56. Net margin: 47.3%. ROI: 269.9%.',
        insight: 'Cables and chargers are Electronics Accessories (15% up to $100), not Consumer Electronics (8%): listing the same item at 8% would overstate profit by $1.12. These categories are heavily contested, so model the competitive price and ad cost before trusting a high pre-ad margin.',
      },
    ],
    proTips: [
      'Use your actual landed cost (manufacturing + freight + customs duties + inspection + labeling), not just the factory price. Forgetting freight and duties is the most common way new sellers overstate profit.',
      'Use the Amazon Revenue Calculator (Seller Central) for exact FBA fees on a specific ASIN; it accounts for dimensional weight, size tier and price band.',
      'Model advertising separately: subtract expected PPC cost per unit from net profit to see whether the product still clears your minimum margin.',
      'Compare categories carefully: an item listed as Consumer Electronics (8%) versus Electronics Accessories (15%) changes the referral fee by almost half.',
      'Time inventory so it is not sitting in fulfillment centers during Q4 when storage rates rise, and watch aged-inventory surcharges on slow sellers.',
    ],
    limitations: [
      'FBA fulfillment fees here are an ILLUSTRATIVE weight-only estimate. Amazon bills by size tier, shipping weight (the greater of actual and dimensional weight, L x W x H / 139 for standard size), and since 2026 by price band; it also adds periodic surcharges. Large, light items can cost several times more than shown. Use the Revenue Calculator in Seller Central for an exact quote.',
      'Amazon revises FBA fees every year and sometimes mid-year, so the fulfillment and storage figures here may be out of date. The referral-fee percentages follow Amazon\'s published schedule as checked in October 2026.',
      'Between 21 lb and 90 lb the fee is a straight-line bridge between two formulas, not Amazon\'s published mid-weight tiers.',
      'Storage is estimated as one month of the entered packaged volume at an illustrative standard-size Jan-Sep rate; enter no volume to exclude it. Q4 rates are roughly three times higher and aged inventory is surcharged.',
      'Not included: PPC advertising, return processing, long-term/aged inventory surcharges, removal fees, prep services, promotions, inbound freight (put it in COGS) and the Professional plan fee.',
      'Assumes every unit sells at the listed price; competition or Buy Box loss can force lower prices.',
    ],
    quickReference: [
      { label: 'Referral (Consumer Electronics)', value: '8%' },
      { label: 'Referral (Electronics Accessories)', value: '15% to $100, 8% above' },
      { label: 'Referral (Sports, most general)', value: '15%' },
      { label: 'Referral (Apparel)', value: '5% / 10% / 17% by price' },
      { label: 'Referral (Jewelry)', value: '20% to $250, 5% above' },
      { label: 'Referral (Beauty & Health)', value: '8% to $10, 15% above' },
      { label: 'Books/Media closing fee', value: '$1.80 per item' },
      { label: 'Minimum referral fee', value: '$0.30 per item' },
      { label: 'Professional plan', value: '$39.99/month' },
    ],
    commonUses: [
      'Product sourcing evaluation -- check that margins survive Amazon\'s fees before buying inventory',
      'Pricing strategy -- find the minimum selling price that keeps a target margin',
      'Fee comparison across categories -- see how the category changes the referral fee',
      'ROI analysis -- compare Amazon FBA against other sales channels',
    ],
    citations: [
      { source: 'Amazon -- Selling plans and referral fees', url: 'https://sell.amazon.com/pricing' },
      { source: 'Amazon Seller Central -- FBA Features and Fees', url: 'https://sellercentral.amazon.com/help/hub/reference/G201074180' },
      { source: 'Amazon Seller Central -- Referral Fees', url: 'https://sellercentral.amazon.com/help/hub/reference/G200336920' },
      { source: 'USITC Harmonized Tariff Schedule', url: 'https://hts.usitc.gov/' },
    ],
  },
};

export default amazonFbaConfig;
