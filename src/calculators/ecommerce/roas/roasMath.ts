/** ROAS math shared by index.ts and ROASPanel.tsx (the panel must never re-parse formatted result strings). */
export type RoasStatus = 'above' | 'at' | 'below';

export interface RoasFigures {
  roas: number;
  /** Revenue minus ad spend. */
  revenueMinusSpend: number;
  /** Ad spend per order, or null when orders were not given. */
  cpa: number | null;
  /** 1 / gross margin: the ROAS at which gross profit exactly repays the ad spend; null without a margin. */
  breakEvenRoas: number | null;
  /** Gross profit (revenue x margin) minus ad spend; null without a margin. */
  profitAfterAds: number | null;
  /** Compared at 2 dp, as displayed. Null without a margin. */
  status: RoasStatus | null;
}

export function computeRoas(adSpend: number, revenue: number, grossMarginPct?: number, orders?: number): RoasFigures {
  const roas = revenue / adSpend;
  const hasMargin = grossMarginPct !== undefined && Number.isFinite(grossMarginPct) && grossMarginPct > 0;
  const breakEvenRoas = hasMargin ? 1 / (grossMarginPct! / 100) : null;
  let status: RoasStatus | null = null;
  if (breakEvenRoas !== null) {
    const a = Math.round(roas * 100);
    const b = Math.round(breakEvenRoas * 100);
    status = a > b ? 'above' : a === b ? 'at' : 'below';
  }
  return {
    roas,
    revenueMinusSpend: revenue - adSpend,
    cpa: orders !== undefined && Number.isFinite(orders) && orders > 0 ? adSpend / orders : null,
    breakEvenRoas,
    profitAfterAds: hasMargin ? revenue * (grossMarginPct! / 100) - adSpend : null,
    status,
  };
}
