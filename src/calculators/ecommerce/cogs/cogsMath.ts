/** COGS math shared by index.ts and COGSPanel.tsx (the panel must never re-parse formatted result strings). */
export interface CogsFigures {
  goodsAvailable: number;
  /** Raw beginning + purchases - ending (negative means ending inventory exceeds goods available - impossible). */
  rawCogs: number;
  /** COGS floored at 0. */
  cogs: number;
  /** True when ending inventory exceeds goods available for sale. */
  impossible: boolean;
  /** Present only when revenue > 0. */
  grossProfit?: number;
  grossMarginPct?: number;
  cogsPct?: number;
}

export function computeCogs(begin: number, purchases: number, ending: number, revenue?: number): CogsFigures {
  const goodsAvailable = begin + purchases;
  const rawCogs = goodsAvailable - ending;
  const cogs = Math.max(0, rawCogs);
  const out: CogsFigures = { goodsAvailable, rawCogs, cogs, impossible: rawCogs < 0 };
  if (revenue !== undefined && Number.isFinite(revenue) && revenue > 0) {
    out.grossProfit = revenue - cogs;
    out.grossMarginPct = ((revenue - cogs) / revenue) * 100;
    out.cogsPct = (cogs / revenue) * 100;
  }
  return out;
}
