/**
 * Amazon FBA math shared by index.ts and AmazonFBAPanel.tsx (the panel must never re-parse formatted result strings).
 *
 * Referral-fee schedule: sell.amazon.com/pricing (fetched Oct 2026): Consumer Electronics 8%;
 * Electronics Accessories 15% up to $100 then 8%; Apparel 5% (<= $15), 10% ($15-$20), 17% (> $20);
 * Jewelry 20% up to $250 then 5% above; Beauty/Health/Personal Care 8% (<= $10) then 15%;
 * Sports & Outdoors 15%; Books/Media 15% + $1.80 closing fee; most categories have a $0.30 minimum.
 *
 * FBA fulfillment and storage figures are ILLUSTRATIVE weight-only approximations (Amazon bills by size tier,
 * dimensional weight and price band, and re-publishes the rate card every year) - see the calculator's limitations.
 */
export type FbaCategory =
  | 'general'
  | 'apparel'
  | 'electronics'
  | 'electronics-accessories'
  | 'books'
  | 'jewelry'
  | 'beauty'
  | 'sports';

export const FBA_CATEGORY_LABELS: Record<FbaCategory, string> = {
  general: 'General / Standard',
  apparel: 'Apparel & Accessories',
  electronics: 'Consumer Electronics',
  'electronics-accessories': 'Electronics Accessories',
  books: 'Books / Media',
  jewelry: 'Jewelry',
  beauty: 'Beauty, Health & Personal Care',
  sports: 'Sports & Outdoors',
};

export const MIN_REFERRAL_FEE = 0.3;
export const BOOK_CLOSING_FEE = 1.8;
/** Illustrative standard-size storage rate, $ per cubic foot per month (Jan-Sep). */
export const STORAGE_RATE_PER_CUFT = 0.78;

export function isFbaCategory(v: string): v is FbaCategory {
  return v in FBA_CATEGORY_LABELS;
}

/** Referral fee in dollars for a selling price (before the per-item minimum is applied for books). */
export function referralFee(category: FbaCategory, price: number): number {
  switch (category) {
    case 'electronics':
      return Math.max(MIN_REFERRAL_FEE, price * 0.08);
    case 'electronics-accessories':
      return Math.max(MIN_REFERRAL_FEE, Math.min(price, 100) * 0.15 + Math.max(0, price - 100) * 0.08);
    case 'apparel':
      return Math.max(MIN_REFERRAL_FEE, price * (price <= 15 ? 0.05 : price <= 20 ? 0.1 : 0.17));
    case 'jewelry':
      return Math.max(MIN_REFERRAL_FEE, Math.min(price, 250) * 0.2 + Math.max(0, price - 250) * 0.05);
    case 'beauty':
      return Math.max(MIN_REFERRAL_FEE, price * (price <= 10 ? 0.08 : 0.15));
    case 'books':
      return price * 0.15; // no minimum; the $1.80 closing fee is separate
    default:
      return Math.max(MIN_REFERRAL_FEE, price * 0.15);
  }
}

/**
 * Illustrative weight-only FBA fulfillment fee (US$). Between 21 lb (standard formula) and 90 lb (oversize formula)
 * the fee is bridged with a straight line so it is continuous and monotonic.
 */
export function fbaFulfillmentFee(weightLb: number): number {
  const fee21 = 5.29 + (21 - 3) * 0.38;
  const fee90 = 89.98;
  if (weightLb <= 1) return 3.22;
  if (weightLb <= 2) return 4.18;
  if (weightLb <= 3) return 5.29;
  if (weightLb <= 21) return 5.29 + (weightLb - 3) * 0.38;
  if (weightLb <= 90) return fee21 + (weightLb - 21) * ((fee90 - fee21) / (90 - 21));
  return fee90 + (weightLb - 90) * 0.83;
}

export interface FbaFigures {
  referral: number;
  closing: number;
  fulfillment: number;
  storage: number;
  totalFees: number;
  netProfit: number;
  /** Net margin in percent of selling price. */
  marginPct: number;
  /** Return on cost in percent. */
  roiPct: number;
  /** Effective referral rate in percent of selling price. */
  referralPct: number;
}

export function computeFba(
  price: number,
  cost: number,
  weightLb: number,
  category: FbaCategory,
  volumeCuFt = 0,
): FbaFigures {
  const referral = referralFee(category, price);
  const closing = category === 'books' ? BOOK_CLOSING_FEE : 0;
  const fulfillment = fbaFulfillmentFee(weightLb);
  const storage = Math.max(0, volumeCuFt) * STORAGE_RATE_PER_CUFT;
  const totalFees = referral + closing + fulfillment + storage;
  const netProfit = price - cost - totalFees;
  return {
    referral,
    closing,
    fulfillment,
    storage,
    totalFees,
    netProfit,
    marginPct: (netProfit / price) * 100,
    roiPct: cost > 0 ? (netProfit / cost) * 100 : 0,
    referralPct: (referral / price) * 100,
  };
}

/** Approximate weight band used by the panel (not Amazon's size tier, which also needs dimensions). */
export function weightBand(weightLb: number): string {
  if (weightLb <= 3) return 'Lightweight (up to 3 lb)';
  if (weightLb <= 21) return 'Mid-weight (3-21 lb)';
  if (weightLb <= 90) return 'Heavy (21-90 lb)';
  return 'Extra heavy (over 90 lb)';
}
