import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import EtsyFeesPanel from './EtsyFeesPanel';
import { computeEtsy } from './etsyMath';

const etsyFeesConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'itemPrice',
      label: 'Item Price',
      type: 'number',
      placeholder: '50.00',
      prefix: '$',
      min: 0,
      step: 0.01,
      required: true,
      helpText: 'The price you charge for the item',
    },
    {
      id: 'shippingCharged',
      label: 'Shipping Charged to Buyer',
      type: 'number',
      placeholder: '5.00',
      prefix: '$',
      min: 0,
      step: 0.01,
      helpText: 'Amount you charge the buyer for shipping',
    },
    {
      id: 'materialCost',
      label: 'Material & Production Cost',
      type: 'number',
      placeholder: '20.00',
      prefix: '$',
      min: 0,
      step: 0.01,
      helpText: 'Your cost of materials and production per item',
    },
    {
      id: 'shippingCost',
      label: 'Your Shipping Cost (postage & packaging)',
      type: 'number',
      placeholder: '4.50',
      prefix: '$',
      min: 0,
      step: 0.01,
      helpText: 'What you actually pay to ship the order. Optional, but without it the shipping you charge counts as pure profit.',
    },
    {
      id: 'offsiteAds',
      label: 'Offsite Ads',
      type: 'select',
      required: true,
      options: [
        { label: 'No', value: 'no' },
        { label: 'Yes — Standard (12% fee)', value: 'standard' },
        { label: 'Yes — Qualified (< $10K, 15% fee)', value: 'qualified' },
      ],
      helpText: 'Etsy charges this only on orders that come through an Offsite Ad. Shops under $10K in sales over the past 12 months pay 15% (and can opt out); shops at $10K+ pay 12% (mandatory).',
    },
  ],

  calculate: (values) => {
    const itemPrice = parseFloat(values.itemPrice);
    const shippingCharged = parseFloat(values.shippingCharged || '0');
    const materialCost = parseFloat(values.materialCost || '0');
    const shippingCost = parseFloat(values.shippingCost || '0');

    if (![itemPrice, shippingCharged, materialCost, shippingCost].every(Number.isFinite) || itemPrice <= 0) return [];
    if (shippingCharged < 0 || materialCost < 0 || shippingCost < 0) return [];

    const f = computeEtsy(itemPrice, shippingCharged, materialCost, shippingCost, values.offsiteAds);
    if (!f) return [];
    const { totalSale, listingFee, transactionFee, paymentFee, offsiteAdsFee, shippingFee, totalFees, netProfit } = f;
    const profitMargin = Math.round(f.marginPct * 10) / 10; // classify on the displayed value

    // half-up to the cent, immune to binary noise (5.675 must show $5.68, not $5.67)
    const fmt = (n: number) =>
      (Math.round((n + (n < 0 ? -1e-9 : 1e-9)) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return [
      {
        id: 'listingFee',
        label: 'Listing Fee',
        value: `$${fmt(listingFee)}`,
        color: 'negative' as const,
      },
      {
        id: 'transactionFee',
        label: 'Transaction Fee (6.5% of item)',
        value: `$${fmt(transactionFee)}`,
        color: 'negative' as const,
      },
      {
        id: 'paymentFee',
        label: 'Payment Processing Fee (3% + $0.25)',
        value: `$${fmt(paymentFee)}`,
        color: 'negative' as const,
      },
      {
        id: 'offsiteAdsFee',
        label: 'Offsite Ads Fee',
        value: `$${fmt(offsiteAdsFee)}`,
        color: 'negative' as const,
      },
      {
        id: 'shippingFee',
        label: 'Transaction Fee on Shipping (6.5%)',
        value: `$${fmt(shippingFee)}`,
        color: 'negative' as const,
      },
      {
        id: 'totalFees',
        label: 'Total Fees',
        value: `$${fmt(totalFees)}`,
        color: 'negative' as const,
      },
      {
        id: 'netProfit',
        label: 'Net Profit (Take-Home)',
        value: `$${fmt(netProfit)}`,
        highlight: true,
        interpretation: `Etsy's listing, transaction, and payment processing fees stack up fast — this is what's left after all of them, your materials and your postage, but before your own time is counted as a labor cost. Many sellers underprice by forgetting to build these fees into their listed price from the start.`,
        color: netProfit > 0 ? 'positive' as const : 'negative' as const,
      },
      {
        id: 'profitMargin',
        label: 'Profit Margin',
        value: `${profitMargin.toFixed(1)}%`,
        color: profitMargin > 30 ? 'positive' as const : profitMargin > 10 ? 'neutral' as const : 'negative' as const,
      },
      {
        id: 'totalSale',
        label: 'Total Sale Amount',
        value: `$${fmt(totalSale)}`,
        color: 'neutral' as const,
      },
    ];
  },

  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(EtsyFeesPanel, { values, results });
  },

  educational: {
    formula: 'Net Profit = Price + Shipping Charged − Materials − Your Postage − (Listing + Transaction + Payment + Ads + Shipping Transaction Fees)',
    formulaSource: 'US fee rates as reported in 2026 fee guides (listing $0.20, transaction 6.5% of item + shipping, payment processing 3% + $0.25, Offsite Ads 12% / 15%). Etsy\'s own fee page could not be fetched automatically, so confirm current rates at etsy.com/legal/fees.',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="20" width="320" height="300" fill="var(--svg-f3f4f6)" rx="8"/><rect x="80" y="40" width="280" height="40" fill="var(--svg-22c55e)" rx="4"/><rect x="80" y="90" width="280" height="35" fill="var(--svg-3b82f6)" rx="4"/><rect x="80" y="135" width="280" height="35" fill="var(--svg-8b5cf6)" rx="4"/><rect x="80" y="180" width="280" height="35" fill="var(--svg-ef4444)" rx="4"/><rect x="80" y="225" width="280" height="35" fill="var(--svg-f59e0b)" rx="4"/><rect x="80" y="270" width="280" height="35" fill="var(--svg-22c55e)" rx="4"/><text x="220" y="65" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)">Item Price</text><text x="220" y="113" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Listing Fee</text><text x="220" y="158" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Transaction Fee</text><text x="220" y="203" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Payment Processing</text><text x="220" y="248" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Offsite Ads</text><text x="220" y="293" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)">Net Profit</text></svg>',
      alt: 'Stacked fee breakdown showing Etsy fees reducing item price to profit',
      caption: 'Etsy fees — listing, transaction, payment, and ads fees eat into revenue',
    },
    formulaDescription:
      'Etsy charges multiple fees on every sale: a $0.20 listing fee, 6.5% transaction fee, 3% + $0.25 payment processing fee, optional Offsite Ads fee (12-15%), and a 6.5% fee on the shipping amount. Together these commonly take roughly 10% of a sale before ads and 22-25% when an Offsite Ad drove the order.',
    variables: [
      { symbol: 'Listing', name: 'Listing Fee', description: 'A flat $0.20 fee charged each time you list or renew an item. It costs $0.20 even if the item doesn\'t sell.' },
      { symbol: 'Transaction', name: 'Transaction Fee', description: '6.5% of the item price. This is Etsy\'s core marketplace fee.' },
      { symbol: 'Payment', name: 'Payment Processing Fee', description: '3% of the total sale amount (item price + shipping) plus a $0.25 flat fee. Covers credit card processing.' },
      { symbol: 'Offsite Ads', name: 'Offsite Ads Fee', description: '12% (standard) or 15% (qualified <$10K/year) fee on the total sale when a buyer comes from an Etsy ad.' },
      { symbol: 'Shipping', name: 'Shipping Transaction Fee', description: '6.5% of the shipping amount charged to the buyer. Many sellers forget that the shipping charge is also subject to Etsy\'s transaction fee, which can eat into what appears to be cost-covering shipping revenue.' },
    ],
    howToUse: [
      'Enter your item price, shipping charged, material/production costs and your own postage cost.',
      'Select your Offsite Ads status — No, Standard (12%), or Qualified (15%).',
      'View the complete fee breakdown and net profit.',
      'Use the profit margin to determine if you need to adjust pricing.',
      'Review the Shipping Transaction Fee — even shipping costs are subject to Etsy\'s 6.5% fee, which affects your net on shipped items.',
    ],
    explanation:
      'Etsy\'s fee structure is complex and can significantly impact your profitability. A $50 item with $5 shipping and $20 in materials faces a $0.20 listing fee, $3.25 transaction fee, $1.90 payment processing fee, and $0.33 shipping fee — totalling $5.68 in fees before any Offsite Ads costs. That\'s 10.3% of your total sale going to fees before ads. With Offsite Ads at 12%, the fee jumps to $12.28, or 22.3% of the sale. Factor all fees, your postage and your time into the listed price from the start. Understanding this fee structure is essential to building a profitable Etsy business.',
    faqs: [
      {
        question: 'What is Offsite Ads and do I have to use it?',
        answer: 'Offsite Ads is Etsy\'s program that promotes your listings on Google, social media, and other sites. If you earn less than $10,000 in a rolling 12-month period, you can opt out. If you earn more than $10K, participation is mandatory but the rate drops to 12%. You\'re only charged when a sale comes from an ad — not on organic sales.',
      },
      {
        question: 'How should I price my items to cover fees?',
        answer: 'Work backwards: add your materials, postage and the profit you want, then solve for the price that still leaves that amount after Etsy\'s fees (about 9.5% of the order plus $0.45 in fixed fees before any ads). For example, with $20 materials and $30 desired profit the price must be about $55.75, because fees come off the top ((50 + 0.45) ÷ 0.905). Etsy also runs sales and promotions that you may choose to join.',
      },
      {
        question: 'Are there any other fees I should know about?',
        answer: 'Listings are charged $0.20 again each time they renew (every four months or when a multi-quantity listing sells). Optional promoted listings (Etsy Ads) are separate from Offsite Ads. If you use Etsy Payments (required in most countries), the 3% + $0.25 fee applies. Currency conversion fees may apply for international sales.',
      },
      {
        question: 'How do shipping fees affect my Etsy profit?',
        answer: 'Many sellers forget that Etsy charges its 6.5% transaction fee on the shipping amount charged to the buyer, not just the item price. If you charge $5 for shipping, Etsy takes $0.33 of that. More importantly, if you offer "free shipping" (absorbing the cost), you lose that 6.5% fee on the shipping amount, but you also lose the shipping revenue entirely. The best approach is to calculate shipping costs accurately and include them transparently in your pricing strategy.',
      },
      {
        question: 'What is the effective total fee percentage on Etsy?',
        answer: 'For a $50 item with $5 shipping and no Offsite Ads: listing fee ($0.20) + transaction fee ($3.25) + payment processing ($1.90) + shipping fee ($0.33) = $5.68, or about 10.3% of the total sale. With Offsite Ads at 12%, this jumps to $12.28, or 22.3%. With Offsite Ads at 15%, it becomes $13.93, or 25.3%. Understanding these effective rates is essential for pricing; decide your own minimum net margin after fees, materials, postage and time.',
      },
      {
        question: 'Should I use Etsy Ads (promoted listings)?',
        answer: 'Etsy Ads (formerly Promoted Listings) are separate from Offsite Ads. With Etsy Ads, you set a daily budget and bid on keywords within Etsy\'s search results. Unlike Offsite Ads, you pay for clicks, not sales. Etsy Ads can be effective for new shops building visibility but require careful monitoring of cost-per-click and conversion rates. Most experienced sellers recommend mastering organic SEO first before spending on Etsy Ads, as optimized titles, tags, and photos drive more cost-effective traffic.',
      },
    ],
    quickReference: [
      { label: 'Listing Fee', value: '$0.20 per item (relisted every 4 months)' },
      { label: 'Transaction Fee', value: '6.5% of item price (+ shipping)' },
      { label: 'Payment Processing', value: '3% + $0.25 per transaction' },
      { label: 'Shipping Transaction Fee', value: '6.5% of shipping charged to buyer' },
      { label: 'Offsite Ads (shops at $10K+)', value: '12% of total sale, mandatory' },
      { label: 'Offsite Ads (shops under $10K)', value: '15% of total sale, optional' },
      { label: 'Renewal', value: '$0.20 each time a listing renews' },
    ],
    limitations: [
      'Fee rates are the US rates as reported for 2026 and can change; confirm them on Etsy\'s fee page. Other countries, currencies and Etsy Plus, Etsy Ads or regulatory fees are not modelled.',
      'Offsite Ads fees are reported to be capped per order (the cap is reported as $100); this calculator does not apply any cap, so it overstates the fee on very large orders.',
      'The $0.20 listing fee is charged once per listing (and per renewal), not per sale; the calculator charges it once to each sale as a simple estimate.',
      'Sales tax, currency-conversion fees, refunds and returns are not included.',
    ],
    commonUses: [
      'Pricing new products — determine the minimum price needed to cover all Etsy fees and material costs while maintaining a profitable margin',
      'Profitability analysis — calculate exact take-home profit per sale, including all hidden fees that eat into revenue beyond the obvious transaction fee',
      'Shipping strategy — evaluate whether including shipping in the item price or charging separately is more profitable given the 6.5% shipping transaction fee',
      'Offsite Ads decision — run the same sale with Offsite Ads set to No and then Yes to see how much the fee costs when an ad drives the order',
      'Product category expansion — understand how fee percentages shift profit margins when selling across different item types (physical goods vs. digital downloads, which have no shipping fees)',
    ],
    citations: [
      { source: 'Etsy', url: 'https://www.etsy.com/seller/fees' },
      { source: 'Etsy Seller Handbook', url: 'https://www.etsy.com/seller-handbook/' },
    ],
  },
};

export default etsyFeesConfig;
