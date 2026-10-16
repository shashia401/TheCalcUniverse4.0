import { normQuantile } from '../../../utils/distributions';

/**
 * Cochran's sample size for a proportion with finite population correction:
 *   n0 = Z² p (1 − p) / E²           (infinite population)
 *   n  = n0 / (1 + (n0 − 1) / N)     (finite population correction)
 * Z is the exact two-sided normal quantile (1.9600 for 95%, 2.5758 for 99%), not a rounded table value.
 * Results are rounded UP to whole respondents; a 1e-9 slack stops float noise (e.g. 400.00000000000006) from adding one.
 */
export interface Cochran {
  z: number;
  /** Infinite-population size, unrounded. */
  n0: number;
  /** Finite-population-corrected size, unrounded. */
  nFinite: number;
  /** Recommended whole-number sample size (never more than N). */
  n: number;
  /** Whole-number infinite-population size. */
  n0Ceil: number;
}

export function cochranSampleSize(population: number, confidencePct: number, marginFraction: number, proportion = 0.5): Cochran {
  const z = normQuantile(1 - (1 - confidencePct / 100) / 2);
  const n0 = (z * z * proportion * (1 - proportion)) / (marginFraction * marginFraction);
  const nFinite = n0 / (1 + (n0 - 1) / population);
  const ceil = (x: number) => Math.ceil(x - 1e-9);
  return { z, n0, nFinite, n: Math.min(ceil(nFinite), population), n0Ceil: ceil(n0) };
}
