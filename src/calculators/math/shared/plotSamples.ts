/**
 * Sample f on [lo, hi] for SvgLineChart: non-finite values are dropped and outliers (poles of tan(x), 1/x ...)
 * are clipped so one vertical asymptote does not flatten the rest of the curve.
 */
export function plotSamples(f: (x: number) => number, lo: number, hi: number, n = 160): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const x = lo + ((hi - lo) * i) / n;
    const y = f(x);
    if (Number.isFinite(x) && Number.isFinite(y)) pts.push({ x, y });
  }
  if (pts.length < 8) return pts;
  const mags = pts.map((p) => Math.abs(p.y)).sort((a, b) => a - b);
  const bound = Math.max(10, 6 * mags[Math.floor(mags.length * 0.9)]);
  return pts.filter((p) => Math.abs(p.y) <= bound);
}
