export interface PresentValueRow {
  year: number;
  cashFlow: number;
  discountFactor: number;
  presentValue: number;
}

export interface IRRData {
  cashFlows: number[];
  irr: number | null;
  npv: number | null;
  discountRate: number | null;
  presentValues: PresentValueRow[];
  paybackPeriod: number | null;
  totalCashInflows: number;
  totalReturn: number;
}

export const BENCHMARKS = [
  { label: 'High-Yield Savings (~5%)', threshold: 0.05 },
  { label: 'S&P 500 Average (~10%)', threshold: 0.10 },
  { label: 'Typical Real Estate (8–12%)', threshold: 0.10 },
  { label: 'Venture Capital Target (20%+)', threshold: 0.20 },
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
