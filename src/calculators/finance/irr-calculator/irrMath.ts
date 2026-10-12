// Pure IRR / NPV math for the IRR calculator (single source of truth).

/** NPV of cashFlows[t] received at the end of year t (t = 0 is today). */
export function npvAt(rate: number, cashFlows: number[]): number {
  let npv = 0;
  for (let t = 0; t < cashFlows.length; t++) npv += cashFlows[t] / Math.pow(1 + rate, t);
  return npv;
}

/** Number of sign changes in the cash-flow sequence, ignoring zeros (Descartes: bounds the number of positive IRRs). */
export function signChanges(cashFlows: number[]): number {
  let changes = 0;
  let prev = 0;
  for (const cf of cashFlows) {
    const s = Math.sign(cf);
    if (s === 0) continue;
    if (prev !== 0 && s !== prev) changes++;
    prev = s;
  }
  return changes;
}

const MIN_RATE = -0.99;
const MAX_RATE = 1000; // 100,000% a year

/** Scan grid: fine near typical rates, coarser (geometric) at extreme ones. */
function scanGrid(): number[] {
  const g: number[] = [];
  for (let r = MIN_RATE; r < 1; r += 0.01) g.push(Math.round(r * 100) / 100);
  for (let r = 1; r < 10; r += 0.1) g.push(Math.round(r * 10) / 10);
  for (let r = 10; r < MAX_RATE; r *= 1.15) g.push(r);
  g.push(MAX_RATE);
  return g;
}
const GRID = scanGrid();

/**
 * Every real IRR in (-99%, 100,000%], sorted ascending. Found by scanning for sign changes of NPV and
 * bisecting each bracket, so it cannot converge to the wrong root, diverge or oscillate the way Newton can,
 * and it exposes multiple IRRs when the cash flows change sign more than once.
 */
export function findIRRs(cashFlows: number[]): number[] {
  if (!(cashFlows.some((c) => c > 0) && cashFlows.some((c) => c < 0))) return [];
  const roots: number[] = [];
  let prevR = GRID[0];
  let prevV = npvAt(prevR, cashFlows);
  if (prevV === 0) roots.push(prevR);
  for (let i = 1; i < GRID.length; i++) {
    const r = GRID[i];
    const v = npvAt(r, cashFlows);
    if (!isFinite(v)) { prevR = r; prevV = v; continue; }
    if (v === 0) {
      roots.push(r);
    } else if (isFinite(prevV) && prevV !== 0 && Math.sign(prevV) !== Math.sign(v)) {
      let lo = prevR;
      let hi = r;
      let vlo = prevV;
      for (let k = 0; k < 200 && hi - lo > 1e-14 * Math.max(1, Math.abs(hi)); k++) {
        const mid = (lo + hi) / 2;
        const vm = npvAt(mid, cashFlows);
        if (vm === 0) { lo = hi = mid; break; }
        if (Math.sign(vm) === Math.sign(vlo)) { lo = mid; vlo = vm; } else { hi = mid; }
      }
      roots.push((lo + hi) / 2);
    }
    prevR = r;
    prevV = v;
  }
  return Array.from(new Set(roots.map((x) => +x.toPrecision(12)))).sort((a, b) => a - b);
}

/** Simple (undiscounted) payback in years with linear interpolation inside the year; null if never repaid. */
export function paybackYears(cashFlows: number[]): number | null {
  let cumulative = 0;
  for (let t = 0; t < cashFlows.length; t++) {
    const before = cumulative;
    cumulative += cashFlows[t];
    if (cumulative >= 0) return t === 0 ? 0 : t - 1 + -before / cashFlows[t];
  }
  return null;
}
