/**
 * Strict number parse: "2abc" and "" give NaN (parseFloat would accept the first), "1e3" and ".5" are fine.
 * Returns NaN for anything that is not a finite number.
 */
export function parseNumberStrict(raw: string | undefined): number {
  const s = (raw ?? '').trim();
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/** Strict parse that also rejects negatives and absurdly large values (NaN); callers check divisors for 0. */
export function parseNonNegative(raw: string | undefined, max = 1e18): number {
  const n = parseNumberStrict(raw);
  return n >= 0 && n <= max ? n : NaN;
}
