import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import EtsyFeesPanel from './EtsyFeesPanel';

const OFFSITE_AD_RATES: Record<string, { rate: number; label: string }> = {
  no: { rate: 0, label: 'No' },
  standard: { rate: 0.12, label: 'Yes — Standard (12%)' },
  qualified: { rate: 0.15, label: 'Yes — Qualified (15%)' },
};

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
      id: 'offsiteAds',
      label: 'Offsite Ads',
      type: 'select',
      required: true,
      options: [
        { label: 'No', value: 'no' },
        { label: 'Yes — Standard (12% fee)', value: 'standard' },
        { label: 'Yes — Qualified (< $10K, 15% fee)', value: 'qualified' },
      ],
      helpText: 'Offsite Ads are Etsy\'s ad program — if you earn under $10K/year, the rate is 15%',
    },
  ],

  calculate: (values) => {
    const itemPrice = parseFloat(values.itemPrice);
    const shippingCharged = parseFloat(values.shippingCharged || '0');
    const materialCost = parseFloat(values.materialCost || '0');
    const offsiteAds = values.offsiteAds;
    const adRateInfo = OFFSITE_AD_RATES[offsiteAds];

    if (isNaN(itemPrice) || itemPrice <= 0 || !adRateInfo) return [];

    const totalSale = itemPrice + shippingCharged;

    const listingFee = 0.20;
    const transactionFee = itemPrice * 0.065;
    const paymentFee = totalSale * 0.03 + 0.25;
    const offsiteAdsFee = totalSale * adRateInfo.rate;
    const shippingFee = shippingCharged * 0.065;

    const totalFees = listingFee + transactionFee + paymentFee + offsiteAdsFee + shippingFee;
    const netProfit = itemPrice + shippingCharged - materialCost - totalFees;
    const profitMargin = totalSale > 0 ? (netProfit / totalSale) * 100 : 0;

    const fmt = (n: number) =>
      n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return [
      {
        id: 'listingFee',
        label: 'Listing Fee',
        value: `$${fmt(listingFee)}`,
        color: 'negative' as const,
      },
      {
        id: 'transactionFee',
        label: 'Transaction Fee (6.5%)',
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
        label: 'Shipping Transaction Fee (6.5%)',
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
        interpretation: `Etsy's listing, transaction, and payment processing fees stack up fast — this is what's actually left after all of them, before your own time and materials are factored in as a labor cost. Many sellers underprice by forgetting to build these fees into their listed price from the start.`,
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
    formula: 'Net Profit = Price + Shipping − Costs − (Listing + Transaction + Payment + Ads + Shipping Fees)',
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="60" y="20" width="320" height="300" fill="var(--svg-f3f4f6)" rx="8"/><rect x="80" y="40" width="280" height="40" fill="var(--svg-22c55e)" rx="4"/><rect x="80" y="90" width="280" height="35" fill="var(--svg-3b82f6)" rx="4"/><rect x="80" y="135" width="280" height="35" fill="var(--svg-8b5cf6)" rx="4"/><rect x="80" y="180" width="280" height="35" fill="var(--svg-ef4444)" rx="4"/><rect x="80" y="225" width="280" height="35" fill="var(--svg-f59e0b)" rx="4"/><rect x="80" y="270" width="280" height="35" fill="var(--svg-22c55e)" rx="4"/><text x="220" y="65" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)">Item Price</text><text x="220" y="113" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Listing Fee</text><text x="220" y="158" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Transaction Fee</text><text x="220" y="203" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Payment Processing</text><text x="220" y="248" text-anchor="middle" font-size="12" fill="var(--svg-ffffff)">Offsite Ads</text><text x="220" y="293" text-anchor="middle" font-size="13" fill="var(--svg-ffffff)">Net Profit</text></svg>',
      alt: 'Stacked fee breakdown showing Etsy fees reducing item price to profit',
      caption: 'Etsy fees — listing, transaction, payment, and ads fees eat into revenue',
    },
    formulaDescription:
      'Etsy charges multiple fees on every sale: a $0.20 listing fee, 6.5% transaction fee, 3% + $0.25 payment processing fee, optional Offsite Ads fee (12-15%), and a 6.5% fee on the shipping amount. These fees can take 15-30% of your total sale.',
    variables: [
      { symbol: 'Listing', name: 'Listing Fee', description: 'A flat $0.20 fee charged each time you list or renew an item. It costs $0.20 even if the item doesn\'t sell.' },
      { symbol: 'Transaction', name: 'Transaction Fee', description: '6.5% of the item price. This is Etsy\'s core marketplace fee.' },
      { symbol: 'Payment', name: 'Payment Processing Fee', description: '3% of the total sale amount (item price + shipping) plus a $0.25 flat fee. Covers credit card processing.' },
      { symbol: 'Offsite Ads', name: 'Offsite Ads Fee', description: '12% (standard) or 15% (qualified <$10K/year) fee on the total sale when a buyer comes from an Etsy ad.' },
      { symbol: 'Shipping', name: 'Shipping Transaction Fee', description: '6.5% of the shipping amount charged to the buyer. Many sellers forget that the shipping charge is also subject to Etsy\'s transaction fee, which can eat into what appears to be cost-covering shipping revenue.' },
    ],
    howToUse: [
      'Enter your item price, shipping charged, and material/production costs.',
      'Select your Offsite Ads status — No, Standard (12%), or Qualified (15%).',
      'View the complete fee breakdown and net profit.',
      'Use the profit margin to determine if you need to adjust pricing.',
      'Review the Shipping Transaction Fee — even shipping costs are subject to Etsy\'s 6.5% fee, which affects your net on shipped items.',
    ],
    explanation:
      'Etsy\'s fee structure is complex and can significantly impact your profitability. A $50 item with $5 shipping and $20 in costs faces a $0.20 listing fee, $3.25 transaction fee, $1.90 payment processing fee, and $0.33 shipping fee — totalling $5.68 in fees before any Offsite Ads costs. That\'s 10.3% of your total sale going to fees before ads. With Offsite Ads at 12%, the fee jumps to $12.28, or 22.3% of the sale. Successful Etsy sellers target items with high perceived value relative to material costs (ideally 3-5x markup on materials) and factor all fees into their pricing from the start. Understanding this fee structure is essential to building a profitable Etsy business.',
    faqs: [
      {
        question: 'What is Offsite Ads and do I have to use it?',
        answer: 'Offsite Ads is Etsy\'s program that promotes your listings on Google, social media, and other sites. If you earn less than $10,000 in a rolling 12-month period, you can opt out. If you earn more than $10K, participation is mandatory but the rate drops to 12%. You\'re only charged when a sale comes from an ad — not on organic sales.',
      },
      {
        question: 'How should I price my items to cover fees?',
        answer: 'A common strategy is to multiply your desired profit by at least 1.3-1.5x to account for fees. For example, if your cost is $20 and you want to make $30 profit, price the item at $50 or higher. Also consider that Etsy runs frequent sales and promotions that you may be expected to participate in.',
      },
      {
        question: 'Are there any other fees I should know about?',
        answer: 'Etsy also charges a $0.20 auto-renewal fee for listings every 4 months if they don\'t sell. Optional promoted listings (Etsy Ads) are separate from Offsite Ads. If you use Etsy Payments (required in most countries), the 3% + $0.25 fee applies. Currency conversion fees may apply for international sales.',
      },
      {
        question: 'How do shipping fees affect my Etsy profit?',
        answer: 'Many sellers forget that Etsy charges its 6.5% transaction fee on the shipping amount charged to the buyer, not just the item price. If you charge $5 for shipping, Etsy takes $0.33 of that. More importantly, if you offer "free shipping" (absorbing the cost), you lose that 6.5% fee on the shipping amount, but you also lose the shipping revenue entirely. The best approach is to calculate shipping costs accurately and include them transparently in your pricing strategy.',
      },
      {
        question: 'What is the effective total fee percentage on Etsy?',
        answer: 'For a $50 item with $5 shipping and no Offsite Ads: listing fee ($0.20) + transaction fee ($3.25) + payment processing ($1.90) + shipping fee ($0.33) = $5.68, or about 10.3% of the total sale. With Offsite Ads at 12%, this jumps to $12.28, or 22.3%. With Offsite Ads at 15%, it becomes $14.03, or 25.5%. Understanding these effective rates is essential for pricing — aim for at least a 20-30% net margin after all fees to build a sustainable business.',
      },
      {
        question: 'Should I use Etsy Ads (promoted listings)?',
        answer: 'Etsy Ads (formerly Promoted Listings) are separate from Offsite Ads. With Etsy Ads, you set a daily budget and bid on keywords within Etsy\'s search results. Unlike Offsite Ads, you pay for clicks, not sales. Etsy Ads can be effective for new shops building visibility but require careful monitoring of cost-per-click and conversion rates. Most experienced sellers recommend mastering organic SEO first before spending on Etsy Ads, as optimized titles, tags, and photos drive more cost-effective traffic.',
      },
    ],
    quickReference: [
      { label: 'Listing Fee', value: '$0.20 per item (relisted every 4 months)' },
      { label: 'Transaction Fee', value: '6.5% of item price' },
      { label: 'Payment Processing', value: '3% + $0.25 per transaction' },
      { label: 'Shipping Transaction Fee', value: '6.5% of shipping charged to buyer' },
      { label: 'Offsite Ads (Standard)', value: '12% of total sale' },
      { label: 'Offsite Ads (Qualified, <$10K/yr)', value: '15% of total sale' },
      { label: 'Auto-Renewal', value: '$0.20 every 4 months for unsold items' },
      { label: 'Typical Total Fees (no ads)', value: '~10-13% of total sale' },
    ],
    commonUses: [
      'Pricing new products — determine the minimum price needed to cover all Etsy fees and material costs while maintaining a profitable margin',
      'Profitability analysis — calculate exact take-home profit per sale, including all hidden fees that eat into revenue beyond the obvious transaction fee',
      'Shipping strategy — evaluate whether including shipping in the item price or charging separately is more profitable given the 6.5% shipping transaction fee',
      'Offsite Ads decision — compare net profit with and without Offsite Ads fees to decide whether opting out (when eligible under $10K revenue) makes financial sense',
      'Product category expansion — understand how fee percentages shift profit margins when selling across different item types (physical goods vs. digital downloads, which have no shipping fees)',
    ],
    citations: [
      { source: 'Etsy', url: 'https://www.etsy.com/seller/fees' },
      { source: 'Etsy Seller Handbook', url: 'https://www.etsy.com/seller-handbook/' },
    ],
  },
};

export default etsyFeesConfig;
