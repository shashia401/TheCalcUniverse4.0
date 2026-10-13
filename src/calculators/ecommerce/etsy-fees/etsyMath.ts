/**
 * Etsy fee math shared by index.ts and EtsyFeesPanel.tsx (the panel must never re-parse formatted result strings).
 *
 * US schedule as reported for 2026 (Etsy's own fee page blocks automated fetching, so these were cross-checked
 * against several 2026 fee guides - verify on etsy.com/legal/fees before pricing):
 * listing $0.20; transaction 6.5% of item + shipping (+ gift wrap); payment processing 3% + $0.25 of the order total;
 * Offsite Ads 15% (shops under $10K in the last 12 months, optional) or 12% (shops at $10K+, mandatory) only on
 * orders that come through an Offsite Ad.
 */
export const OFFSITE_AD_RATES: Record<string, { rate: number; label: string }> = {
  no: { rate: 0, label: 'No' },
  standard: { rate: 0.12, label: 'Yes — Standard (12%)' },
  qualified: { rate: 0.15, label: 'Yes — Qualified (15%)' },
};

export const LISTING_FEE = 0.2;
export const TRANSACTION_RATE = 0.065;
export const PAYMENT_RATE = 0.03;
export const PAYMENT_FIXED = 0.25;

export interface EtsyFigures {
  totalSale: number;
  listingFee: number;
  transactionFee: number;
  shippingFee: number;
  paymentFee: number;
  offsiteAdsFee: number;
  totalFees: number;
  netProfit: number;
  /** Net margin in percent of the total sale. */
  marginPct: number;
}

export function computeEtsy(
  itemPrice: number,
  shippingCharged: number,
  materialCost: number,
  shippingCost: number,
  offsiteMode: string,
): EtsyFigures | null {
  const ad = OFFSITE_AD_RATES[offsiteMode];
  if (!ad) return null;
  const totalSale = itemPrice + shippingCharged;
  const listingFee = LISTING_FEE;
  const transactionFee = itemPrice * TRANSACTION_RATE;
  const shippingFee = shippingCharged * TRANSACTION_RATE;
  const paymentFee = totalSale * PAYMENT_RATE + PAYMENT_FIXED;
  const offsiteAdsFee = totalSale * ad.rate;
  const totalFees = listingFee + transactionFee + shippingFee + paymentFee + offsiteAdsFee;
  const netProfit = totalSale - materialCost - shippingCost - totalFees;
  return {
    totalSale,
    listingFee,
    transactionFee,
    shippingFee,
    paymentFee,
    offsiteAdsFee,
    totalFees,
    netProfit,
    marginPct: totalSale > 0 ? (netProfit / totalSale) * 100 : 0,
  };
}
