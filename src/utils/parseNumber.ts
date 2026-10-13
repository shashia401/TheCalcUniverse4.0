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
