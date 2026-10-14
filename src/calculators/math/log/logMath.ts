import Decimal from 'decimal.js';

// Private Decimal constructor: 30 significant digits, and no change to the global Decimal config that other
// calculators share.
const D = Decimal.clone({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

export type LogResult =
  | { kind: 'incomplete' }
  | { kind: 'error'; message: string }
  | { kind: 'ok'; base: Decimal; x: Decimal; result: Decimal; log10: Decimal; ln: Decimal; log2: Decimal; exactExponent: number | null };

function parse(s: string | undefined): Decimal | null {
  const t = (s ?? '').trim();
  if (!t || !/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) return null;
  try {
    const d = new D(t);
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

/** Significant-digit display: 10 digits, plain integers stay integers, no float round trip. */
export const fmtLog = (n: Decimal): string => n.toSignificantDigits(10).toString();

/** log_b(x) = ln x / ln b with a domain check; flags results that are exactly integral (b^k === x). */
export function computeLog(baseStr: string | undefined, xStr: string | undefined): LogResult {
  const base = parse(baseStr);
  const x = parse(xStr);
  if (!base || !x) return { kind: 'incomplete' };
  if (base.lte(0) || base.eq(1)) return { kind: 'error', message: 'The base must be positive and not equal to 1.' };
  if (x.lte(0)) return { kind: 'error', message: 'The number x must be greater than 0 (zero and negative numbers have no real logarithm).' };
  if (Math.abs(base.e) > 1000 || Math.abs(x.e) > 1000) return { kind: 'error', message: 'Values must be between 1e-1000 and 1e1000.' };

  const lnx = x.ln();
  const lnb = base.ln();
  const result = lnx.div(lnb);

  // Exact only if b^k equals x exactly for the nearest integer k (checked with exact BigInt/Decimal powers),
  // not merely "within 1e-10", which called 2^60+1 a power of 2.
  let exactExponent: number | null = null;
  const k = result.toDecimalPlaces(0).toNumber();
  if (Math.abs(k) <= 1000 && base.sd(true) * Math.max(1, Math.abs(k)) <= 200) {
    const probe = Decimal.clone({ precision: 220 });
    if (new probe(base.toString()).pow(k).eq(new probe(x.toString()))) exactExponent = k;
  }

  return { kind: 'ok', base, x, result, log10: x.log(10), ln: lnx, log2: x.log(2), exactExponent };
}
