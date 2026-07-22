export interface GrowthPoint {
  year: number;
  value: number;
}

export interface PVData {
  futureValue: number;
  presentValue: number;
  discountAmount: number;
  discountFactor: number;
  periods: number;
  discountRate: number;
  compoundingFrequency: number;
  effectiveAnnualRate: number;
  growthTimeline: GrowthPoint[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmtDollar(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 ? '-' : ''}$${formatted}`;
}

export function fmtDollarCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function compoundingLabel(m: number): string {
  switch (m) {
    case 1: return 'Annually';
    case 2: return 'Semi-annually';
    case 4: return 'Quarterly';
    case 12: return 'Monthly';
    case 365: return 'Daily';
    default: return `${m}x/year`;
  }
}

export function computePV(fv: number, rate: number, years: number, m: number): number {
  const rPerPeriod = rate / 100 / m;
  return fv / Math.pow(1 + rPerPeriod, years * m);
}

export function computeEffectiveRate(rate: number, m: number): number {
  return Math.pow(1 + rate / 100 / m, m) - 1;
}
