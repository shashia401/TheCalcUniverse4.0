// Numerical one-sided limits that survive floating-point cancellation.
//
// The old calculator took f(a ± 1e-8) as "the limit", which is wrong whenever f cancels:
// (1 - cos x)/x^2 at 1e-8 evaluates to 0 (true limit 1/2), and 1/x was reported as a finite average.
// Here f is sampled at h = h0, h0/2, h0/4 ... and the sequence is extrapolated to h = 0 two ways:
//   - Richardson/Ridders extrapolation (exact for error series c1*h + c2*h^2 + ...), and
//   - Aitken delta-squared (exact for a pure power law c*h^p, e.g. sqrt(h)),
// keeping whichever reports the smaller error. Divergence to +-infinity and non-convergence are detected explicitly.

export type SideLimit =
  | { kind: 'value'; value: number; error: number }
  | { kind: 'infinity'; sign: 1 | -1 }
  | { kind: 'oscillates' }
  | { kind: 'undefined' }; // f is not defined (NaN) on this side

const H0 = 0.1;
const STEPS = 24; // down to h = 0.1 / 2^23 ~ 1.2e-8

function ridders(y: number[]): { value: number; error: number } {
  const n = y.length;
  const T: number[][] = [];
  let best = { value: y[n - 1], error: Infinity };
  for (let i = 0; i < n; i++) {
    T[i] = [y[i]];
    for (let j = 1; j <= i; j++) {
      const f = 2 ** j;
      T[i][j] = (f * T[i][j - 1] - T[i - 1][j - 1]) / (f - 1);
      const err = Math.max(Math.abs(T[i][j] - T[i][j - 1]), Math.abs(T[i][j] - T[i - 1][j - 1]));
      if (err <= best.error) best = { value: T[i][j], error: err };
    }
    // Once the best error is established, stop when higher orders amplify noise.
    if (i >= 3 && best.error < Infinity && Math.abs(T[i][i] - T[i - 1][i - 1]) > 4 * best.error) break;
  }
  return best;
}

function aitken(y: number[]): { value: number; error: number } {
  let best = { value: y[y.length - 1], error: Infinity };
  let prev = NaN;
  for (let i = 2; i < y.length; i++) {
    const d1 = y[i] - y[i - 1];
    const d0 = y[i - 1] - y[i - 2];
    const den = d1 - d0;
    const a = den === 0 ? y[i] : y[i] - (d1 * d1) / den;
    if (Number.isFinite(prev) && Number.isFinite(a)) {
      const err = Math.abs(a - prev);
      if (i >= 4 && err < best.error) best = { value: a, error: err };
    }
    prev = a;
  }
  return best;
}

export function sideLimit(f: (x: number) => number, a: number, sign: 1 | -1): SideLimit {
  const y: number[] = [];
  for (let k = 0; k < STEPS; k++) {
    const v = f(a + (sign * H0) / 2 ** k);
    // +-Infinity is kept (a pole); NaN breaks the run.
    y.push(v);
  }
  const tail = y.slice(-6);
  if (tail.every(Number.isNaN)) return { kind: 'undefined' };

  // Divergence: |y| grows without bound along the last samples (differences do not shrink).
  const last = y.slice(-8);
  const finite = last.every(Number.isFinite);
  const lastVal = y[y.length - 1];
  if (Math.abs(lastVal) === Infinity) return { kind: 'infinity', sign: lastVal > 0 ? 1 : -1 };
  if (finite) {
    const mono = last.every((v, i) => i === 0 || Math.abs(v) > Math.abs(last[i - 1]));
    const d = (i: number) => Math.abs(last[i] - last[i - 1]);
    if (mono && Math.abs(last[7]) > 10 && d(7) >= 0.5 * d(3) && last.every((v) => Math.sign(v) === Math.sign(last[7]))) {
      return { kind: 'infinity', sign: last[7] > 0 ? 1 : -1 };
    }
  }

  // Convergence: use the longest all-finite prefix, but stop early enough to avoid noise-dominated samples.
  let n = 0;
  while (n < y.length && Number.isFinite(y[n])) n++;
  if (n < 6) return { kind: 'oscillates' };
  const seq = y.slice(0, Math.min(n, 12)); // h down to ~5e-5: deeper samples are dominated by rounding noise
  const r = ridders(seq);
  const at = aitken(seq);
  const best = at.error < r.error ? at : r;
  const scale = Math.max(1, Math.abs(best.value));
  if (!Number.isFinite(best.value) || best.error > 1e-3 * scale) {
    // Not converging: last values still moving a lot -> oscillation (sin(1/x)) or slow divergence.
    return { kind: 'oscillates' };
  }
  return { kind: 'value', value: best.value, error: best.error };
}

/** Display value: snap to 0, integers and simple fractions (q <= 12) when within the error estimate, else 10 significant digits. */
export function limitToString(v: number, err: number): string {
  if (!Number.isFinite(v)) return v > 0 ? '∞' : '-∞';
  const tol = Math.max(10 * err, 1e-9);
  if (Math.abs(v) <= tol) return '0';
  // Cancellation (e.g. (sin x - x)/x^3) limits the real accuracy to ~1e-8, so integers and simple fractions are
  // recognised within max(10*err, 1e-8 relative).
  const snap = Math.max(tol, 1e-8 * Math.max(1, Math.abs(v)));
  const r = Math.round(v);
  if (Math.abs(v - r) <= snap && Math.abs(r) < 1e15) return String(r);
  for (let q = 2; q <= 12; q++) {
    const pn = Math.round(v * q);
    if (Math.abs(v - pn / q) <= snap) return String(Number((pn / q).toPrecision(10)));
  }
  return String(Number(v.toPrecision(10)));
}
