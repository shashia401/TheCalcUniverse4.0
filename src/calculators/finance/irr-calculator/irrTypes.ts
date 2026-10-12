export interface PresentValueRow {
  year: number;
  cashFlow: number;
  discountFactor: number;
  presentValue: number;
}

export interface IRRData {
  cashFlows: number[];
  irr: number | null;
  allIrrs?: number[];
  signChanges?: number;
  npv: number | null;
  discountRate: number | null;
  presentValues: PresentValueRow[];
  paybackPeriod: number | null;
  totalCashInflows: number;
  totalReturn: number;
}

export const BENCHMARKS = [
  // Illustrative reference points, not live market data.
  { label: 'Savings-account style return (~4%)', threshold: 0.04 },
  { label: 'Long-run US stock market (~10% nominal)', threshold: 0.10 },
  { label: 'Typical real-estate target (8–12%)', threshold: 0.10 },
  { label: 'Venture capital target (20%+)', threshold: 0.20 },
];

export function fmtCurrency(n: number, compact = false): string {
  if (compact) {
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  }
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return `${n < 0 ? '-' : ''}$${formatted}`;
}
