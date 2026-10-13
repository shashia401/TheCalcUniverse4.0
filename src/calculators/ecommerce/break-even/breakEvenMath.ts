/** Break-even math shared by index.ts and BreakEvenPanel.tsx (the panel must never re-parse formatted result strings). */
export interface BreakEvenFigures {
  contributionMargin: number;
  contributionMarginPct: number;
  /** Exact (fractional) break-even volume. */
  units: number;
  /** Whole units needed (rounded up; tolerant of float noise like 0.3 / 0.1). */
  unitsCeil: number;
  /** Fixed costs / contribution-margin ratio = units x price. */
  revenue: number;
}

/** Returns null when price <= variable cost (break-even is never reached). */
export function computeBreakEven(fixedCosts: number, price: number, variableCost: number): BreakEvenFigures | null {
  const contributionMargin = price - variableCost;
  if (!(price > 0) || contributionMargin <= 0) return null;
  const units = fixedCosts / contributionMargin;
  return {
    contributionMargin,
    contributionMarginPct: (contributionMargin / price) * 100,
    units,
    unitsCeil: Math.max(0, Math.ceil(units - 1e-9)),
    revenue: units * price,
  };
}
