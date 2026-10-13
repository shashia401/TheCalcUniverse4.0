// Exact BigInt helpers for the factorial / fibonacci calculators. Doubles lose exactness beyond
// 2^53 (F(79), 19!), so everything that must be digit-for-digit correct goes through BigInt.

/** n! for a non-negative integer n (exact). */
export function factorialBig(n: number): bigint {
  let r = 1n;
  for (let i = 2n; i <= BigInt(n); i++) r *= i;
  return r;
}

/** Number of trailing decimal zeros of n! (Legendre: factors of 5 in n!). */
export function factorialTrailingZeros(n: number): number {
  let count = 0;
  for (let p = 5; p <= n; p *= 5) count += Math.floor(n / p);
  return count;
}

/** [F(1), F(2), ..., F(n)] with F(1) = F(2) = 1, exact. */
export function fibonacciSequenceBig(n: number): bigint[] {
  const seq: bigint[] = [];
  let a = 0n;
  let b = 1n;
  for (let i = 0; i < n; i++) {
    seq.push(b);
    [a, b] = [b, a + b];
  }
  return seq;
}

/** "1,234,567" — en-US digit grouping for a BigInt (locale independent, so SSR and client agree). */
export function groupDigits(n: bigint | string): string {
  const s = n.toString();
  const neg = s.startsWith('-');
  const digits = neg ? s.slice(1) : s;
  return (neg ? '-' : '') + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** "7.257416e+306" for a positive BigInt, rounded to `sig` significant digits from its decimal digits (no float, no overflow). */
export function bigToScientific(n: bigint, sig = 7): string {
  const s = n.toString();
  if (s.length <= sig) return s;
  let lead = BigInt(s.slice(0, sig)) + (s.charCodeAt(sig) >= 53 ? 1n : 0n); // 53 = '5'
  let exp = s.length - 1;
  if (lead.toString().length > sig) {
    lead /= 10n; // 9.9999995 rounded up to 10.00000
    exp += 1;
  }
  const d = lead.toString();
  return `${`${d[0]}.${d.slice(1)}`.replace(/\.?0+$/, '')}e+${exp}`;
}
