import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { MAX_FACTOR_INPUT, parsePositiveSafeInt } from '../../../utils/numberTheory';
import { analyzePrime } from './primeNumberMath';
import { createElement } from 'react';
import PrimeNumberPanel from './PrimeNumberPanel';
import type { ExplainStep } from '../../../types/calculator';
import { TRIAL_STEP_LIMIT } from './primeNumberMath';

const primeNumberConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'n',
      label: 'Number',
      type: 'number',
      placeholder: 'Enter a number',
      defaultValue: '97',
      min: 1,
      max: MAX_FACTOR_INPUT,
      required: true,
      inputMode: 'numeric',
      helpText: 'Enter a positive integer to check if it is prime',
    },
  ],
  calculate: (values): CalculatorResult[] => {
    const p = parsePositiveSafeInt(values.n);
    if (p.kind === 'invalid') return [{ id: 'error', label: 'Error', value: p.message, color: 'negative' }];
    if (p.kind !== 'ok') return [];
    const { n } = p;

    const { prime, factors, divisorCount, steps } = analyzePrime(n);
    const factorText = n === 1 ? 'None (1 is neither prime nor composite)' : factors.length > 0 ? factors.join(', ') : `${n} (prime)`;

    return [
      { id: 'isPrime', label: 'Is Prime', value: prime ? 'Yes' : 'No', highlight: true, color: prime ? 'positive' : 'negative' },
      { id: 'factors', label: 'Prime Factors', value: factorText },
      { id: 'divisorCount', label: 'Number of Divisors', value: divisorCount.toLocaleString('en-US') },
      { id: 'primalityCheck', label: 'Primality Check Steps', value: steps },
    ];
  },
  explainSteps: (values) => {
    const pr = parsePositiveSafeInt(values.n);
    if (pr.kind !== 'ok') return [];
    const a = analyzePrime(pr.n);
    const n = a.n;
    if (n < 2) return [{ label: 'Apply the definition of a prime', expr: a.steps }];
    const limit = Math.floor(Math.sqrt(n));
    const out: ExplainStep[] = [];
    if (n >= 4) {
      out.push({
        label: 'Only divisors up to the square root need testing',
        expr: `√${n} ≈ ${Math.sqrt(n).toFixed(3)}, so test 2 up to ${limit}`,
        ...(n > TRIAL_STEP_LIMIT ? { note: 'Very large numbers are checked with a faster test (Miller–Rabin) that gives the same answer.' } : {}),
      });
    }
    if (a.prime) {
      out.push({ label: 'Look for a divisor', expr: n >= 4 ? `No whole number from 2 to ${limit} divides ${n}, so ${n} is prime` : `${n} has no divisor other than 1 and itself, so it is prime` });
      out.push({ label: 'Count the divisors', expr: `Only 1 and ${n}  →  2 divisors` });
      return out;
    }
    const f = a.factors[0];
    const groups = new Map<number, number>();
    for (const x of a.factors) groups.set(x, (groups.get(x) ?? 0) + 1);
    out.push({ label: 'Look for a divisor', expr: `${n} ÷ ${f} = ${n / f}, so ${n} is composite` });
    out.push({ label: 'Break it into prime factors', expr: `${n} = ${[...groups].map(([q, e]) => (e > 1 ? `${q}^${e}` : `${q}`)).join(' × ')}` });
    out.push({ label: 'Count the divisors: add 1 to each exponent and multiply', expr: `${[...groups.values()].map((e) => `(${e}+1)`).join(' × ')} = ${a.divisorCount}` });
    return out;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PrimeNumberPanel, { values, results });
  },
  educational: {
    formula: 'n is prime iff it has exactly two distinct positive divisors: 1 and itself',
    formulaDescription:
      'A prime number is a positive integer greater than 1 that has no positive divisors other than 1 and itself. To check primality, we use trial division: test whether n is divisible by any integer from 2 up to the square root of n. If none divide evenly, n is prime. This method works because if n has a divisor d greater than sqrt(n), then n/d would be a divisor smaller than sqrt(n), so we only need to check up to sqrt(n).',
    variables: [
      {
        symbol: 'n',
        name: 'Number to Test',
        description: 'The positive integer being checked for primality. Must be at least 2.',
      },
      {
        symbol: 'p',
        name: 'Trial Divisor',
        description: 'Each integer we test as a possible divisor of n, starting from 2 and going up to the square root of n.',
      },
      {
        symbol: 'd(n)',
        name: 'Divisor Count',
        description: 'The total number of positive integers that divide n evenly, including 1 and n. A prime has exactly 2 divisors.',
      },
      {
        symbol: 'sqrt(n)',
        name: 'Upper Bound for Trial Division',
        description: 'The square root of n. If n has any divisor other than 1 and itself, at least one will be at or below sqrt(n).',
      },
    ],
    howToUse: [
      'Enter any positive whole number from 1 up to 9,007,199,254,740,991 in the input field.',
      'The calculator instantly tells you whether the number is prime or composite.',
      'If the number is composite, view its complete list of prime factors separated by commas.',
      'See the divisor count to understand how many numbers divide the input evenly.',
      'Read the step-by-step primality check to understand exactly how the determination was made.',
    ],
    quickReference: [
      { label: 'Smallest prime', value: '2' },
      { label: 'Only even prime', value: '2' },
      { label: 'First 5 primes', value: '2, 3, 5, 7, 11' },
      { label: 'Composite example', value: '12 = 2 x 2 x 3' },
      { label: 'Primes under 100', value: '25 primes' },
      { label: 'Trial division limit', value: 'sqrt(n), e.g. odd divisors up to 3161 for n = 10 million' },
    ],
    faqs: [
      {
        question: 'Is 1 a prime number?',
        answer: 'No, 1 is not a prime number. By definition, a prime number must have exactly two distinct positive divisors. The number 1 has only one divisor (itself). Excluding 1 from the primes ensures the Fundamental Theorem of Arithmetic holds: every integer has a unique prime factorization. If 1 were considered prime, factorizations would no longer be unique (e.g., 6 = 2 × 3 = 1 × 2 × 3 = 1 × 1 × 2 × 3, etc.).',
      },
      {
        question: 'What is the largest known prime number?',
        answer: 'The largest known prime (as of the most recent GIMPS announcement we have verified, October 2024) is 2^136279841 - 1, a Mersenne prime found by the Great Internet Mersenne Prime Search (GIMPS) project. It has 41,024,320 digits. Mersenne primes are of the form 2^p - 1 and are easier to test for primality using the Lucas-Lehmer test. New ones are discovered regularly by distributed computing projects.',
      },
      {
        question: 'What is the difference between a prime and a composite number?',
        answer: 'A prime number has exactly two factors: 1 and itself. A composite number has more than two factors — it can be divided evenly by numbers other than 1 and itself. For example, 7 is prime (only 1 and 7 divide it), while 12 is composite (it can be divided by 1, 2, 3, 4, 6, and 12). Every integer greater than 1 is either prime or composite.',
      },
      {
        question: 'How does trial division work for primality testing?',
        answer: 'Trial division tests whether n is divisible by any integer d from 2 up to sqrt(n). If n is divisible by any d in this range, then n is composite (we have found a divisor). If no d divides n, then n is prime. We only need to go up to sqrt(n) because if n = a × b and both a and b are greater than sqrt(n), then a × b > n, which is impossible. So at least one factor must be at or below sqrt(n).',
      },
      {
        question: 'How do prime numbers relate to cryptography?',
        answer: 'RSA encryption, one of the most widely used encryption systems, relies on the fact that multiplying two large primes together is easy, but factoring the result back into primes is extremely hard. A typical RSA key uses two primes that are each hundreds of digits long. The security of the system depends on this asymmetry — no known classical algorithm can factor a properly generated 2048-bit number in practical time.',
      },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="600" height="300" fill="transparent"/><text x="300" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="currentColor">Prime Number Distribution (First 100 Numbers)</text><rect x="20" y="50" width="560" height="4" fill="currentColor" rx="2"/><!-- Row markers: green for prime, gray for composite --><rect x="22" y="60" width="10" height="10" fill="var(--svg-22c55e)" rx="2"/><text x="36" y="69" font-size="10" fill="currentColor">= Prime</text><rect x="120" y="60" width="10" height="10" fill="var(--svg-9ca3af)" rx="2"/><text x="134" y="69" font-size="10" fill="currentColor">= Composite</text><!-- Grid showing primes as green dots, composites as gray dots --><g transform="translate(20, 90)">  <text x="0" y="10" font-size="9" fill="currentColor">1-20</text>  <rect x="40" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="54" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="68" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="82" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="96" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="110" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="124" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="138" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="152" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="166" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="180" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="194" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="208" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="222" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="236" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="250" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="264" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="278" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="292" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="306" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/></g><g transform="translate(20, 110)">  <text x="0" y="10" font-size="9" fill="currentColor">21-40</text>  <rect x="40" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="54" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="68" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="82" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="96" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="110" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="124" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="138" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="152" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="166" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="180" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="194" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="208" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="222" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="236" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="250" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="264" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="278" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="292" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="306" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/></g><g transform="translate(20, 130)">  <text x="0" y="10" font-size="9" fill="currentColor">41-60</text>  <rect x="40" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="54" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="68" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="82" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="96" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="110" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="124" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="138" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="152" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="166" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="180" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="194" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="208" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="222" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="236" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="250" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="264" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="278" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="292" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="306" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/></g><g transform="translate(20, 150)">  <text x="0" y="10" font-size="9" fill="currentColor">61-80</text>  <rect x="40" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="54" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="68" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="82" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="96" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="110" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="124" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="138" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="152" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="166" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="180" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="194" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="208" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="222" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="236" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="250" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="264" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="278" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="292" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="306" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/></g><g transform="translate(20, 170)">  <text x="0" y="10" font-size="9" fill="currentColor">81-100</text>  <rect x="40" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="54" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="68" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="82" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="96" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="110" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="124" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="138" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="152" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="166" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="180" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="194" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="208" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="222" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="236" y="2" width="8" height="8" fill="var(--svg-22c55e)" rx="1"/><rect x="250" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="264" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="278" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="292" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/><rect x="306" y="2" width="8" height="8" fill="var(--svg-9ca3af)" rx="1"/></g><text x="300" y="210" text-anchor="middle" font-size="12" fill="currentColor">Primes become less frequent as numbers get larger</text><text x="300" y="230" text-anchor="middle" font-size="11" fill="var(--svg-6b7280)">Green: prime (25 primes in first 100 numbers) | Gray: composite</text><text x="300" y="260" text-anchor="middle" font-size="11" fill="var(--svg-6b7280)">This illustrates the Prime Number Theorem: density of primes ≈ 1/ln(n)</text><text x="300" y="285" text-anchor="middle" font-size="10" fill="var(--svg-9ca3af)">Number of primes up to 100: 25 (primes under 100: 2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97)</text></svg>',
      alt: 'Grid visualization showing prime numbers distribution among the first 100 integers, with green squares for primes and gray squares for composite numbers across 5 rows of 20 numbers each.',
      caption: 'Prime number distribution from 1 to 100. Primes are shown in green. There are 25 primes in the first 100 numbers, illustrating that primes become sparser as numbers increase.',
    },
    workedExamples: [
      {
        scenario: 'Maria is teaching her 6th-grade class about prime factorization. She wants to check if 97 is prime to demonstrate that not all numbers in the 90s are composite (90, 91, 92, 93, 94, 95, 96 are all composite).',
        inputs: { n: '97' },
        result: '97 IS prime. Divisors: 2 (1 and 97). sqrt(97) = 9.8, checked odd numbers 3, 5, 7, 9 — no divisors found.',
        insight: 'Testing 97: sqrt(97) = 9.8, so we check divisibility by odd numbers 3, 5, 7, 9. 97/3 = 32.33 (not integer), 97/5 = 19.4, 97/7 = 13.857, 97/9 = 10.778. No divisors found, so 97 is prime. It is the largest prime under 100 and a member of the Pythagorean triple (65, 72, 97). Its prime factorization is just 97 itself.',
      },
      {
        scenario: 'A computer science student needs to verify that 1,000,003 is prime for a hashing algorithm assignment. They recall that primes of the form 10^6 + 3 sometimes produce good hash table sizes.',
        inputs: { n: '1000003' },
        result: '1,000,003 IS prime. Divisors: 2 (1 and itself). sqrt(1000003) = 1000, checked all odd numbers up to 999 — no divisors found. Suitable for hash table sizing.',
        insight: 'The trial division algorithm checks all potential divisors up to sqrt(1000003) = 1000. After checking all odd numbers from 3 to 999 and finding no divisor, the calculator confirms 1,000,003 IS prime. This makes it suitable for a hash table size as it minimizes collision patterns. The number has exactly 2 divisors: 1 and itself.',
      },
    ],
    proTips: [
      'All primes greater than 3 are of the form 6k+1 or 6k-1. Use this fact to quickly spot likely primes: a number not fitting either form cannot be prime (except 2 and 3).',
      'Numbers ending in 0, 2, 4, 6, or 8 (even numbers > 2) and numbers ending in 5 (> 5) are always composite — you do not need a calculator for these.',
      'If you are testing many numbers, remember that the trial division algorithm checks up to sqrt(n). For n = 10,000,000, √n ≈ 3162, so at most 1,580 odd divisors (3, 5, …, 3161) need to be checked, which is very fast. Above that, this calculator switches to the Miller–Rabin test.',
      'The divisor count result is especially useful: a prime has exactly 2 divisors, a prime power p^k has k+1 divisors, and composite numbers with many small prime factors can have surprisingly many divisors (e.g., 720 has 30 divisors).',
      'For cryptographic or large-number use cases, note that this calculator stops at 9,007,199,254,740,991 (2⁵³ − 1). Prime generation for RSA keys (which uses 1024-bit or 2048-bit numbers) requires specialized big-number libraries.',
    ],
    limitations: [
      'Up to 10 million the steps list shows the trial divisions; above that the answer comes from the Miller–Rabin test, which is instant but is not shown division by division.',
      'Numbers larger than 9,007,199,254,740,991 cannot be tested (a JavaScript number is no longer exact beyond that).',
      'The primality test is deterministic (not probabilistic) for the whole supported range, but it does not produce a certificate of primality suitable for cryptographic verification.',
      'The prime factorization shown for composite numbers may not be unique in its display format, though the fundamental theorem of arithmetic guarantees uniqueness of the factor set.',
    ],
    citations: [
      { source: 'Wikipedia — Prime Number', url: 'https://en.wikipedia.org/wiki/Prime_number' },
      { source: 'Wolfram MathWorld — Prime Number', url: 'https://mathworld.wolfram.com/PrimeNumber.html' },
    ],
  },
};

export default primeNumberConfig;
