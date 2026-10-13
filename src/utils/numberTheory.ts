// Integer factorisation for the factor / common-factor / factoring calculators.
// Works on any safe integer (up to 2^53 - 1) and stays fast for the worst case (a product of two
// ~47-bit primes) by using deterministic Miller-Rabin + Pollard's rho instead of O(sqrt n) trial division.
import { gcdBig } from './rational';

/** Largest integer the calculators accept: beyond this a JS number is no longer exact. */
export const MAX_FACTOR_INPUT = Number.MAX_SAFE_INTEGER; // 9 007 199 254 740 991

const SMALL_PRIMES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base %= mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }
  return result;
}

/** Deterministic Miller-Rabin: the first 12 primes as witnesses are exact for every n < 3.3e24. */
function isPrimeBig(n: bigint): boolean {
  if (n < 2n) return false;
  for (const p of SMALL_PRIMES) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }
  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s++;
  }
  for (const a of SMALL_PRIMES) {
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let composite = true;
    for (let r = 1; r < s; r++) {
      x = (x * x) % n;
      if (x === n - 1n) {
        composite = false;
        break;
      }
    }
    if (composite) return false;
  }
  return true;
}

export function isPrime(n: number): boolean {
  return Number.isSafeInteger(n) && n >= 2 && isPrimeBig(BigInt(n));
}

function isqrt(n: bigint): bigint {
  if (n < 2n) return n;
  let x = BigInt(Math.floor(Math.sqrt(Number(n))));
  while (x * x > n) x--;
  while ((x + 1n) * (x + 1n) <= n) x++;
  return x;
}

/** A non-trivial factor of an odd composite n (Pollard's rho, Floyd cycle detection). */
function rho(n: bigint): bigint {
  const r = isqrt(n);
  if (r * r === n) return r;
  for (let c = 1n; ; c++) {
    let x = 2n;
    let y = 2n;
    let d = 1n;
    while (d === 1n) {
      x = (x * x + c) % n;
      y = (y * y + c) % n;
      y = (y * y + c) % n;
      d = gcdBig(x > y ? x - y : y - x, n);
    }
    if (d !== n) return d;
  }
}

function splitPrimes(n: bigint, out: bigint[]): void {
  if (n === 1n) return;
  if (isPrimeBig(n)) {
    out.push(n);
    return;
  }
  const f = rho(n);
  splitPrimes(f, out);
  splitPrimes(n / f, out);
}

/** Prime factorisation as ascending [prime, exponent] pairs. n must be a safe integer >= 1 ([] for 1). */
export function factorize(n: number): [number, number][] {
  if (!Number.isSafeInteger(n) || n < 1) throw new RangeError('factorize needs a positive safe integer');
  const counts = new Map<number, number>();
  let rest = n;
  for (let p = 2; p < 1000 && p * p <= rest; p += p === 2 ? 1 : 2) {
    while (rest % p === 0) {
      counts.set(p, (counts.get(p) ?? 0) + 1);
      rest /= p;
    }
  }
  if (rest > 1) {
    const big: bigint[] = [];
    splitPrimes(BigInt(rest), big);
    for (const p of big) counts.set(Number(p), (counts.get(Number(p)) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => a[0] - b[0]);
}

/** All positive divisors of n in ascending order, generated from the factorisation. */
export function divisorsOf(n: number): number[] {
  let divs = [1];
  for (const [p, e] of factorize(n)) {
    const next: number[] = [];
    let pk = 1;
    for (let k = 0; k <= e; k++) {
      for (const d of divs) next.push(d * pk);
      pk *= p;
    }
    divs = next;
  }
  return divs.sort((a, b) => a - b);
}

/** Euclid on safe integers (exact: remainders never exceed the inputs). */
export function gcdNum(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

/** "2^3 × 3 × 5" style string for a factorisation (1 -> "1"). */
export function formatFactorization(f: [number, number][]): string {
  if (!f.length) return '1';
  return f.map(([p, e]) => (e === 1 ? `${p}` : `${p}^${e}`)).join(' × ');
}

export type SafeIntParse =
  | { kind: 'incomplete' }
  | { kind: 'invalid'; message: string }
  | { kind: 'ok'; n: number };

/**
 * Classify the text of a "positive whole number" field. Blank, non-numeric, zero and negative input are
 * 'incomplete' (no result, same as before); a decimal or a value above 2^53 - 1 gets an explaining message
 * (parseInt would silently truncate "24.9" to 24 and mis-round anything past 2^53).
 */
export function parsePositiveSafeInt(raw: string | undefined, max = MAX_FACTOR_INPUT): SafeIntParse {
  const s = (raw ?? '').trim();
  if ((/^\d*\.\d*$/.test(s) && /\d/.test(s)) || /^\d+(\.\d*)?[eE][+-]?\d+$/.test(s)) {
    return { kind: 'invalid', message: 'Enter a whole number (no decimals or exponents).' };
  }
  if (!/^\d+$/.test(s)) return { kind: 'incomplete' };
  const big = BigInt(s);
  if (big < 1n) return { kind: 'incomplete' };
  if (big > BigInt(max)) {
    return {
      kind: 'invalid',
      message: `Numbers above ${max.toLocaleString('en-US')} are not supported (a JavaScript number is no longer exact beyond that).`,
    };
  }
  return { kind: 'ok', n: Number(big) };
}

/** Sum of all divisors σ(n) from the factorisation, exact (it can pass 2^53 for n near the limit). */
export function sigma(factors: [number, number][]): bigint {
  let total = 1n;
  for (const [p, e] of factors) {
    const bp = BigInt(p);
    total *= (bp ** BigInt(e + 1) - 1n) / (bp - 1n);
  }
  return total;
}

/** Comma-joined list capped at `cap` entries, with "… (N more)" so a highly composite number cannot flood the DOM. */
export function capList(items: (number | string)[], cap = 500): string {
  if (items.length <= cap) return items.join(', ');
  return `${items.slice(0, cap).join(', ')}, … (${items.length - cap} more)`;
}
