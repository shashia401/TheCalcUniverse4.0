import { factorize, isPrime } from '../../../utils/numberTheory';

/** Largest n for which the step list spells out the trial divisions (sqrt(n) <= ~3162 odd candidates). */
export const TRIAL_STEP_LIMIT = 10_000_000;

export interface PrimeAnalysis {
  n: number;
  prime: boolean;
  /** prime factors with multiplicity, ascending ([] for 1 and for primes) */
  factors: number[];
  divisorCount: number;
  steps: string;
}

/** Deterministic Miller-Rabin (12 witnesses, exact below 3.3e24) + Pollard rho: instant for every safe integer. */
export function analyzePrime(n: number): PrimeAnalysis {
  const prime = isPrime(n);
  const fac = n >= 2 ? factorize(n) : [];
  const factors = prime ? [] : fac.flatMap(([p, e]) => Array<number>(e).fill(p));
  const divisorCount = n < 1 ? 0 : fac.reduce((acc, [, e]) => acc * (e + 1), 1);
  return { n, prime, factors, divisorCount, steps: primalitySteps(n, prime, fac[0]?.[0]) };
}

function primalitySteps(n: number, prime: boolean, smallestFactor: number | undefined): string {
  if (n < 2) return `${n === 1 ? '1' : 'Numbers less than 2'} is neither prime nor composite: a prime needs exactly two distinct divisors and 1 has only one.`;
  if (n === 2) return `2 is the only even prime number. It is divisible only by 1 and itself.`;
  if (n % 2 === 0) return `Even numbers greater than 2 are not prime (divisible by 2), so ${n} is composite.`;
  if (n <= TRIAL_STEP_LIMIT) {
    const limit = Math.floor(Math.sqrt(n));
    const lines = [`Checking divisibility of ${n} by odd numbers from 3 up to √${n} = ${limit}:\n`];
    for (let i = 3; i <= limit; i += 2) {
      if (n % i === 0) {
        lines.push(`  ${n} ÷ ${i} = ${n / i} — divisible! ${n} is composite.`);
        return lines.join('\n');
      }
    }
    lines.push(`  No divisors found up to ${limit}. Therefore, ${n} is prime.`);
    return lines.join('\n');
  }
  return prime
    ? `${n} passes deterministic Miller–Rabin tests for the 12 bases 2, 3, 5, …, 37, which is a proof of primality for every n below 3.3×10²⁴. Therefore, ${n} is prime.`
    : `${n} fails a deterministic Miller–Rabin test, so it is composite. Its smallest prime factor is ${smallestFactor}.`;
}
