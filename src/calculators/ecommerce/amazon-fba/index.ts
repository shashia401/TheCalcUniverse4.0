import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import AmazonFBAPanel from './AmazonFBAPanel';

const amazonFbaConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'sellingPrice',
      label: 'Amazon Selling Price',
      type: 'number',
      placeholder: '29.99',
      prefix: '$',
      min: 0,
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
        { label: 'General / Standard (15%)', value: '15' },
        { label: 'Apparel & Accessories (17%)', value: '17' },
        { label: 'Electronics (8%)', value: '8' },
        { label: 'Books / Media (15%)', value: '15' },
        { label: 'Jewelry (20%)', value: '20' },
        { label: 'Beauty & Health (8%)', value: '8' },
        { label: 'Sports & Outdoors (15%)', value: '15' },
      ],
      helpText: 'The Amazon category your product is listed in determines the referral fee percentage. Choose carefully -- listing in an incorrect category can lead to listing suppression or fee adjustments.',
    },
  ],
  calculate: (values) => {
    const price = parseFloat(values.sellingPrice);
    const cost = parseFloat(values.productCost);
    const weight = parseFloat(values.weight);
    const referralPct = parseFloat(values.category || '15') / 100;

    if ([price, cost, weight].some(isNaN) || price <= 0 || weight <= 0) return [];

    const referralFee = price * referralPct;

    let fbaFulfillmentFee: number;
    if (weight <= 1) fbaFulfillmentFee = 3.22;
    else if (weight <= 2) fbaFulfillmentFee = 4.18;
    else if (weight <= 3) fbaFulfillmentFee = 5.29;
    else if (weight <= 21) fbaFulfillmentFee = 5.29 + (weight - 3) * 0.38;
    else fbaFulfillmentFee = 89.98 + (weight - 90) * 0.83;

    const monthlyStorageFee = weight * 0.75;
    const totalFees = referralFee + fbaFulfillmentFee + monthlyStorageFee;
    const netProfit = price - cost - totalFees;
    const roi = cost > 0 ? (netProfit / cost) * 100 : 0;
    const margin = (netProfit / price) * 100;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return [
      {
        id: 'netProfit',
        label: 'Net Profit per Unit',
        value: `$${fmt(netProfit)}`,
        highlight: true,
        color: netProfit > 0 ? 'positive' : 'negative',
        interpretation: `This is per-unit after Amazon's referral and FBA fulfillment fees — multiply by monthly unit volume to see real cash flow, since a healthy-looking margin can still lose money at low volume once storage and advertising costs are added. Aim for enough margin to absorb PPC spend, which most new listings need to gain visibility.`,
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
        label: `Referral Fee (${(referralPct * 100).toFixed(0)}%)`,
        value: `$${fmt(referralFee)}`,
        color: 'negative',
      },
      {
        id: 'fbaFee',
        label: 'FBA Fulfillment Fee',
        value: `$${fmt(fbaFulfillmentFee)}`,
        color: 'negative',
      },
      {
        id: 'storageFee',
        label: 'Est. Monthly Storage Fee',
        value: `$${fmt(monthlyStorageFee)}/mo`,
        color: 'negative',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(AmazonFBAPanel, { values, results });
  },
  educational: {
    formula: 'Net Profit = Price − COGS − Referral Fee − FBA Fee − Storage Fee',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="80" y="30" width="280" height="260" fill="var(--svg-e5e7eb)" rx="4"/><rect x="80" y="30" width="280" height="50" fill="var(--svg-22c55e)" rx="4"/><rect x="80" y="80" width="280" height="50" fill="var(--svg-ef4444)" rx="4"/><rect x="80" y="130" width="280" height="50" fill="var(--svg-3b82f6)" rx="4"/><rect x="80" y="180" width="280" height="50" fill="var(--svg-8b5cf6)" rx="4"/><rect x="80" y="230" width="280" height="60" fill="var(--svg-22c55e)" rx="4"/><text x="220" y="58" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)" font-weight="bold">Price</text><text x="220" y="108" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Referral + FBA + Storage</text><text x="220" y="158" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">COGS</text><text x="220" y="208" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Fees</text><text x="220" y="268" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)" font-weight="bold">Profit</text></svg>',
      alt: 'Stacked bar chart showing price breakdown into fees and profit',
      caption: 'Amazon FBA fees — referral, fulfillment, and storage fees reduce your profit',
    },
    formulaDescription:
      'Amazon FBA profitability requires accounting for Amazon\'s referral fee (percentage of sale price), fulfillment fees (based on weight and size), and storage fees.',
    variables: [
      { symbol: 'Referral Fee', name: 'Category Referral Fee', description: 'Amazon charges 8-20% of the sale price depending on product category.' },
      { symbol: 'FBA Fee', name: 'Fulfillment by Amazon Fee', description: 'Per-unit fee for Amazon to pick, pack, and ship your product based on weight and dimensions.' },
      { symbol: 'Storage Fee', name: 'Monthly Inventory Storage', description: 'Fee for storing your inventory in Amazon\'s fulfillment centers (higher Oct-Dec).' },
    ],
    howToUse: [
      'Enter your Amazon selling price and product cost (landed cost).',
      'Enter the packaged weight of the unit.',
      'Select the product category for the correct referral fee percentage.',
      'View net profit, margin, ROI, and itemized fee breakdown.',
    ],
    explanation:
      'Amazon FBA sellers must account for multiple layers of fees that can significantly erode margins. The referral fee (8-20%) is charged on every sale. The FBA fulfillment fee covers picking, packing, and shipping. Monthly storage fees apply for all inventory held in Amazon warehouses (significantly higher October through December for Q4). Successful FBA sellers typically target a minimum 25-30% net margin after all fees. Products with margins below 15-20% are generally not viable on Amazon due to competition and advertising costs.',
    faqs: [
      {
        question: 'Are advertising costs included in this calculator?',
        answer: 'No. Amazon PPC (Pay-Per-Click) advertising is a major additional cost not included here. Many sellers spend 15-30% of revenue on ads, especially for new products.',
      },
      {
        question: 'What is the difference between FBA and FBM?',
        answer: 'FBA (Fulfilled by Amazon) has Amazon warehouse and ship your products. FBM (Fulfilled by Merchant) means you ship directly to customers. FBA typically wins the Buy Box more reliably but has higher fees.',
      },
      {
        question: 'What margins should I target for Amazon FBA?',
        answer: 'Most successful FBA sellers target 25-40% net margins before advertising. After ads, a 15-20% net margin is sustainable. Below 10% net is very difficult to build a profitable business.',
      },
      {
        question: 'How does the FBA fulfillment fee change with weight?',
        answer: 'FBA fulfillment fees increase with weight and size tier. Small standard items under 1 lb cost around $3.22 to fulfill. Large standard items up to 21 lbs have base fees plus $0.38 per additional pound over 3 lbs. Oversize items over 90 lbs cost $89.98 plus $0.83 per additional pound over 90 lbs. Dimensional weight may also apply for large but lightweight items. Always check the latest Amazon fee schedule, as rates are adjusted annually.',
      },
      {
        question: 'What is the referral fee and how does it vary by category?',
        answer: 'The referral fee is Amazon\'s commission on each sale, typically 8-20% of the selling price. Electronics and Beauty/Health categories have the lowest referral fees at 8%. Jewelry has the highest at 20%. Most standard categories like Home, Sports, and Books are 15%. Apparel and Accessories are 17%. There is also a minimum per-item referral fee ($0.30 for most categories). Category selection when listing a product can significantly affect profitability.',
      },
      {
        question: 'What other costs should FBA sellers consider?',
        answer: 'Beyond the fees shown in this calculator, successful sellers account for: Amazon PPC advertising (typically 15-30% of revenue for new products), return processing fees (FBA charges the fulfillment fee again for returned items), long-term storage fees (for inventory held over 365 days), removal or disposal fees (for unsold inventory), and prep service fees (if using a third-party to label and prep items). Many experienced sellers find that all-in costs including advertising represent 35-50% of the selling price.',
      },
    ],
    workedExamples: [
      {
        scenario: 'Private Label Kitchen Gadget: Garlic Press at $24.99, Standard Category',
        inputs: { sellingPrice: '24.99', productCost: '6.50', weight: '0.8', category: '15' },
        result: 'Referral fee (15%): $3.75. FBA fulfillment (0.8 lbs, under 1 lb): $3.22. Monthly storage (0.8 lbs): $0.60. Total fees: $7.57. Net profit: $24.99 - $6.50 - $7.57 = $10.92. Net margin: 43.7%. ROI: 168.0%.',
        insight: 'This is a healthy FBA product with strong unit economics. At $10.92 net profit per unit, selling 100 units/month = $1,092 profit before advertising. If PPC ads cost 20% of revenue ($5.00 per unit for a new product), net-after-ads profit drops to $5.92 (23.7% margin) -- still viable. The key to this product\'s success: low weight (0.8 lbs) keeps fulfillment fees at the minimum tier ($3.22), and the standard 15% referral fee is manageable. A common optimization: ordering 3,000 units instead of 1,000 could drop COGS from $6.50 to $4.80, adding $1.70/unit profit. At 100 units/month, that is $2,040 additional annual profit from a single negotiation with the supplier.',
      },
      {
        scenario: 'Heavy Fitness Equipment: Adjustable Dumbbell Set at $89.99, Sports Category',
        inputs: { sellingPrice: '89.99', productCost: '35.00', weight: '12', category: '15' },
        result: 'Referral fee (15%): $13.50. FBA fulfillment (12 lbs, tier 3-21 lbs): 5.29 + (12-3) x 0.38 = $8.71. Monthly storage (12 lbs): $9.00. Total fees: $31.21. Net profit: $89.99 - $35.00 - $31.21 = $23.78. Net margin: 26.4%. ROI: 67.9%.',
        insight: 'Heavy products present a unique FBA challenge: fulfillment and storage fees become significant. At 12 lbs, the FBA fee ($8.71) is nearly 10% of the selling price on its own, and monthly storage ($9.00 for one unit) is more than the product\'s daily profit in ad spend scenarios. For heavy items, consider: (1) FBM (Fulfilled by Merchant) where you ship yourself -- UPS/FedEx ground for a 12 lb package is typically $12-$18, which may be more than FBA but avoids storage fees for slow-moving inventory. (2) Bundling with lighter accessories (workout guide, resistance bands) to add perceived value without adding much weight. (3) Dimensional weight: if this dumbbell set ships in a 24x14x8 inch box, the dimensional weight is (24x14x8)/139 = 19.3 lbs -- which is more than the actual 12 lbs. Amazon charges based on the GREATER of actual weight and dimensional weight, so the true FBA fee may be $5.29 + (19.3-3) x 0.38 = $11.48. This product becomes much less profitable when dimensional weight applies. Heavy/bulky products on FBA require large margins to absorb the fulfillment costs.',
      },
      {
        scenario: 'Low-Cost Electronics Accessory: Phone Charging Cable at $15.99, Electronics Category',
        inputs: { sellingPrice: '15.99', productCost: '2.80', weight: '0.2', category: '8' },
        result: 'Referral fee (8%): $1.28. FBA fulfillment (0.2 lbs, under 1 lb): $3.22. Monthly storage (0.2 lbs): $0.15. Total fees: $4.65. Net profit: $15.99 - $2.80 - $4.65 = $8.54. Net margin: 53.4%. ROI: 305.0%.',
        insight: 'Low-cost electronics accessories have attractive unit economics because of the 8% electronics referral fee (the lowest Amazon offers). At $8.54 profit on a $15.99 item with only $2.80 COGS, this looks fantastic on paper. But the fatal flaw is competition: phone charging cables are one of the most saturated categories on Amazon with thousands of sellers. To win the Buy Box in this category, you will likely need to spend aggressively on PPC ($4-$6 per unit, or 25-38% of revenue) and may need to price at $12.99 to be competitive, which drops net profit to $12.99 - $2.80 - ($1.04 ref + $3.22 FBA + $0.15 storage) = $5.78 before ads, and approximately $1-$2 after ads. The high-ROI calculation is deceptive without accounting for competitive pricing pressure and ad costs. The electronics category also has a high return rate (5-10%) because cables fail, arrive defective, or the customer ordered the wrong connector type -- FBA charges the fulfillment fee AGAIN for returned items that are resellable. Lesson: always model the competitive selling price and ad spend, not just the aspirational price. For unsaturated electronics subcategories (niche adapters, specialty cables, B2B electronics), these margins can be real.',
      },
    ],
    proTips: [
      'Always include your actual landed cost (manufacturing + freight + customs + inspection + labeling), not just the per-unit manufacturing price. A product that costs $3/unit to manufacture in Shenzhen may have a landed cost of $6-7/unit after: sea freight ($1-2/unit for a 40ft container), US customs duties (0-25% depending on product category and country of origin -- check the USITC HTS database), freight forwarder fees ($0.50-1/unit), Amazon labeling/prep ($0.50-1/unit), and 3PL receiving/inspection ($0.50-1/unit). Forgetting freight and duties is the most common new-seller profit-killer.',
      'Use the Amazon Revenue Calculator (Seller Central > Inventory > Revenue Calculator) for exact FBA fees on specific ASINs. This free calculator gives you the exact fulfillment fee for any specific product by ASIN, accounting for both actual weight and dimensional weight. The fee estimates in this calculator are based on weight tiers and are approximate -- dimensional weight may increase your actual fee. Large but lightweight items (pillows, comforters, foam products) are particularly affected because their dimensional weight far exceeds actual weight.',
      'Factor PPC advertising costs into your profit model before sourcing any product. A realistic PPC budget for a new FBA product: 15-30% of revenue for the first 3-6 months while building organic ranking, tapering to 10-15% for established products with strong organic positions. A product with 25% net margin before ads becomes barely profitable (5-10%) after a 20% ad spend. The "Rule of 40" is a useful guideline: your pre-ad margin + your organic rank velocity should sum to at least 40 for a sustainably profitable product. If your pre-ad margin is 30% and you have strong organic ranking (low ad dependency), you are well above 40. If your pre-ad margin is 15% and you are ad-dependent, you are in trouble.',
      'Watch for long-term storage fees (LTSF) if inventory sits in Amazon warehouses for more than 365 days. For inventory aged 271-365 days, Amazon charges a long-term storage fee of approximately $1.50 per cubic foot per month (in addition to the monthly storage fee of $0.75/cu ft). For inventory aged 365+ days, the fee jumps to $6.90 per cubic foot per month or $0.15 per unit, whichever is greater. A slow-moving product with 1,000 units in storage can accumulate thousands in LTSF fees over a year. Proactive sellers set up automated removal orders for inventory approaching 270 days and either liquidate the stock (eBay, wholesale lots, liquidation marketplaces), run promotional discounts to clear it, or have it returned to a 3PL.',
      'Consider dimensional weight, not just scale weight. Amazon charges the GREATER of actual weight and dimensional weight (length x width x height in inches / 139 for standard-size items). A product weighing 1 lb in a 20x15x3 inch box has dimensional weight of (20x15x3)/139 = 6.47 lbs, so you pay the 6+ lb fulfillment rate ($5.29 + 3.47 x $0.38 = $6.61) rather than the 1 lb rate ($3.22). This more than doubles the fulfillment cost. The solution: optimize packaging to reduce dimensional weight. Changing that 20x15x3 box to 18x13x3 reduces dimensional weight to (18x13x3)/139 = 5.05 lbs, saving money. Custom packaging that fits the product snugly pays for itself in FBA fee savings within months.',
      'Plan inventory for Q4 (October-December) with precision. Monthly storage fees triple from $0.75/cu ft (Jan-Sep) to $2.40/cu ft (Oct-Dec). A shipment of 5,000 units arriving in September that does not sell through until January will incur 4 months of elevated storage fees at $2.40/cu ft vs $0.75/cu ft -- a difference that can erase the Q4 profit margin on slow-moving SKUs. Time your Q4 inventory to arrive in late October/early November (not September) so the expensive storage window is shorter, and use Amazon\'s Inventory Performance Index (IPI) dashboard to monitor sell-through rate.',
      'Bundle products to improve margins. Instead of selling a single garlic press for $24.99 with $3.75 referral + $3.22 FBA fees ($6.97 total fee on $24.99 = 27.9%), create a bundle: garlic press + peeler + cleaning brush + recipe guide for $34.99 at 0.9 lbs. Referral fee: $5.25. FBA fee: $3.22 (still under 1 lb). Total fees: $8.47 on $34.99 = 24.2%. The bundle increases perceived value more than it increases fees because the weight stays under the 1 lb threshold. Bundling is the most underused profit optimization strategy on FBA.',
    ],
    limitations: [
      'FBA fulfillment fees in this calculator are based on item weight only and DO NOT account for dimensional weight. Amazon charges the greater of actual weight and dimensional weight (L x W x H in inches / 139 for standard-size items). Large, lightweight items (pillows, blankets, foam products, empty storage bins, lampshades) will have dimensional weights far exceeding their actual weights, and their true FBA fee could be 2-5x higher than what this calculator shows. For large or bulky items, use the Amazon Revenue Calculator on Seller Central for exact dimensional-weight-based fees by ASIN.',
      'Amazon adjusts FBA fees annually (typically in February) and occasionally mid-year. The fee schedule used in this calculator may not reflect the most current rates. Significant fee changes in recent years include: the introduction of dimensional weight pricing, the addition of a fuel and inflation surcharge (5% average increase across all tiers in 2022-2023), and the restructuring of oversize and large-standard tiers. Always verify current rates at Amazon Seller Central > Fulfillment by Amazon > FBA features and fees.',
      'Storage fees shown are estimates based on weight and do not account for cubic footage, which is how Amazon actually bills monthly storage. Amazon charges $0.75 per cubic foot per month (January-September) and $2.40 per cubic foot (October-December) for standard-size products, based on the product\'s packaged dimensions. Products with inefficient packaging (large box, small product) pay disproportionately more storage fees than this calculator estimates. The calculator uses a rough weight-based estimate that may not reflect actual cubic-foot-based charges.',
      'This calculator does NOT include: (a) Amazon PPC advertising costs (typically 15-30% of revenue for new/competitive products), (b) return processing fees (FBA charges the fulfillment fee again for returned items that are resellable), (c) long-term storage fees for inventory held 271+ days ($1.50-$6.90/cu ft), (d) removal or disposal fees for unsold inventory ($1.50-$3.00 per unit), (e) prep service fees if using a third-party to label, polybag, or bubble wrap items ($0.50-$2.00/unit), (f) costs of giveaways or promotional discounts for launch, (g) trademark/brand registry costs ($225-$525 per class), and (h) professional seller account fee ($39.99/month). All-in costs for an FBA product typically represent 35-55% of the selling price, well above what this calculator shows.',
      'The calculator assumes all units sell at the listed price. In reality, competitive pressure may force price reductions, and Amazon\'s automated repricing tools can drive prices down as competitors match or undercut each other. Additionally, Amazon sometimes suppresses the Buy Box on listings where the price is not competitive relative to other e-commerce sites (including the brand\'s own website), which can reduce sales velocity dramatically. Successful sellers model a range of selling prices, not a single point estimate, to understand the profit profile at different competitive price points.',
    ],
    quickReference: [
      { label: 'Referral Fee (Electronics)', value: '8% of selling price' },
      { label: 'Referral Fee (Standard)', value: '15% of selling price' },
      { label: 'Referral Fee (Jewelry)', value: '20% of selling price' },
      { label: 'Referral Fee (Apparel)', value: '17% of selling price' },
      { label: 'FBA Fee (under 1 lb)', value: '~$3.22' },
      { label: 'FBA Fee (1-2 lbs)', value: '~$4.18' },
      { label: 'FBA Fee (2-3 lbs)', value: '~$5.29' },
      { label: 'FBA Fee (3+ lbs, per lb over 3)', value: '+$0.38/lb' },
      { label: 'Monthly Storage (std, Jan-Sep)', value: '~$0.75/cu ft' },
      { label: 'Monthly Storage (std, Oct-Dec)', value: '~$2.40/cu ft' },
      { label: 'Pro Seller Account (monthly)', value: '$39.99/month' },
      { label: 'Min net margin target (pre-ad)', value: '25-30%' },
      { label: 'Min net margin target (post-ad)', value: '15-20%' },
      { label: 'Typical PPC ad spend', value: '15-30% of revenue' },
    ],
    commonUses: [
      'Product sourcing evaluation -- analyze potential products before purchasing inventory to verify that margins are viable after all Amazon fees',
      'Pricing strategy -- determine the minimum selling price needed to maintain target margins across different product categories and weight tiers',
      'Fee comparison across categories -- compare how profitability changes if a product is listed in different Amazon categories with different referral fee percentages',
      'Inventory planning -- estimate total fee burden per unit to forecast monthly and annual profit across projected sales volumes',
      'ROI analysis -- calculate return on investment including all fees to compare Amazon FBA against other sales channels like eBay, Shopify, or wholesale',
    ],
    citations: [
      { source: 'Amazon Seller Central -- FBA Features and Fees', url: 'https://sellercentral.amazon.com/help/hub/reference/G201074180' },
      { source: 'Amazon Seller Central -- Referral Fees', url: 'https://sellercentral.amazon.com/help/hub/reference/G200336920' },

      { source: 'USITC Harmonized Tariff Schedule', url: 'https://hts.usitc.gov/' },
    ],
  },
};

export default amazonFbaConfig;
