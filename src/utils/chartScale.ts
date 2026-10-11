// Pure helpers for the hand-rolled SVG charts (SvgBarChart / SvgLineChart).
// Kept free of React so they can be unit-tested in the node test environment.

/** "Nice" axis ticks covering [min, max]: round steps of 1, 2, 5 × 10^n. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min > max) [min, max] = [max, min];
  if (min === max) {
    const pad = Math.abs(min) || 1;
    min -= pad;
    max += pad;
  }
  const rawStep = (max - min) / Math.max(1, count - 1);
  const mag = 10 ** Math.floor(Math.log10(rawStep));
  const norm = rawStep / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const lo = Math.floor(min / step + 1e-9) * step;
  const hi = Math.ceil(max / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let i = 0; lo + i * step <= hi + step * 1e-9; i++) {
    ticks.push(Number((lo + i * step).toPrecision(12)));
  }
  return ticks;
}

/** Linear map from the domain [d0, d1] to the range [r0, r1]. */
export function linearScale(d0: number, d1: number, r0: number, r1: number): (v: number) => number {
  const span = d1 - d0;
  if (span === 0) return () => (r0 + r1) / 2;
  return (v) => r0 + ((v - d0) / span) * (r1 - r0);
}

/** Compact axis label: 1200 -> "1200", 25_000 -> "25K", 2_500_000 -> "2.5M", 0.25 -> "0.25". */
export function formatTick(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return `${+(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${+(n / 1e6).toFixed(2)}M`;
  if (a >= 1e4) return `${+(n / 1e3).toFixed(1)}K`;
  if (a >= 1) return String(+n.toFixed(2));
  return String(+n.toPrecision(3));
}
