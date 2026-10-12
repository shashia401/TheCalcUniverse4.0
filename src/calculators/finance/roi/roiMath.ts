/** ROI math shared by index.ts and ROIPanel.tsx (the panel must never re-parse formatted result strings). */
export interface RoiFigures {
  netProfit: number;
  /** Total ROI in percent (50 = +50%). */
  totalRoiPct: number;
  multiplier: number;
  /** Annualized ROI (CAGR) in percent; 0 when no holding period was given. */
  annualizedPct: number;
}

export function computeRoi(invested: number, returned: number, years: number): RoiFigures {
  const multiplier = returned / invested;
  return {
    netProfit: returned - invested,
    totalRoiPct: (multiplier - 1) * 100,
    multiplier,
    annualizedPct: years > 0 ? (Math.pow(multiplier, 1 / years) - 1) * 100 : 0,
  };
}
