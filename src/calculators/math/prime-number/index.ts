import { CalculatorConfig } from '../../../types/calculator';
import { createElement } from 'react';
import PrimeNumberPanel from './PrimeNumberPanel';

/**
 * Check if n is prime using trial division up to sqrt(n).
 * Returns true for primes >= 2, false otherwise.
 */
function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  const limit = Math.floor(Math.sqrt(n));
  for (let i = 3; i <= limit; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

/**
 * Find all prime factors of n (with multiplicity).
 * Only called for n >= 2. Uses trial division starting from 2.
 */
function getPrimeFactors(n: number): number[] {
  const factors: number[] = [];
  let num = n;
  // Divide by 2
  while (num % 2 === 0) {
    factors.push(2);
    num /= 2;
  }
  // Divide by odd numbers
  for (let p = 3; p * p <= num; p += 2) {
    while (num % p === 0) {
      factors.push(p);
      num /= p;
    }
  }
  // If num is still > 1, it's a prime factor
  if (num > 1) factors.push(num);
  return factors;
}

/**
 * Count the number of divisors of n using prime factorization:
 * If n = p1^a * p2^b * ..., then divisor count = (a+1)(b+1)...
 */
function countDivisors(n: number): number {
  if (n < 2) return n === 1 ? 1 : 0;
  let count = 1;
  let num = n;
  let p = 2;
  while (p * p <= num) {
    let exp = 0;
    while (num % p === 0) {
      exp++;
      num /= p;
    }
    if (exp > 0) count *= exp + 1;
    p = p === 2 ? 3 : p + 2;
  }
  if (num > 1) count *= 2; // remaining prime factor with exponent 1
  return count;
}

/**
 * Build a human-readable description of the primality checking steps.
 */
function buildPrimalitySteps(n: number): string {
  if (n < 2) return `Numbers less than 2 are not prime by definition.`;
  if (n === 2) return `2 is the only even prime number. It is divisible only by 1 and itself.`;
  if (n % 2 === 0) return `Even numbers greater than 2 are not prime (divisible by 2).`;

  const limit = Math.floor(Math.sqrt(n));
  const steps: string[] = [];
  steps.push(`Checking divisibility of ${n} by odd numbers from 3 up to √${n} = ${limit}:\n`);
  let foundDivisor = false;
  for (let i = 3; i <= limit; i += 2) {
    if (n % i === 0) {
      steps.push(`  ${n} ÷ ${i} = ${n / i} — divisible! ${n} is composite.`);
      foundDivisor = true;
      break;
    }
  }
  if (!foundDivisor) {
    steps.push(`  No divisors found up to ${limit}. Therefore, ${n} is prime.`);
  }
  return steps.join('\n');
}

const primeNumberConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'n',
      label: 'Number',
      type: 'number',
      placeholder: 'Enter a number',
      defaultValue: '97',
      min: 1,
      max: 10000000,
      required: true,
      inputMode: 'numeric',
      helpText: 'Enter a positive integer to check if it is prime',
    },
  ],
  calculate: (values) => {
    const n = parseInt(values.n, 10);
    if (isNaN(n) || n < 2 || !Number.isFinite(n) || n > 10000000) return [];

    const prime = isPrime(n);
    const factorList = prime ? [] : getPrimeFactors(n);
    const divisorCount = countDivisors(n);
    const steps = buildPrimalitySteps(n);

    return [
      {
        id: 'isPrime',
        label: 'Is Prime',
        value: prime ? 'Yes' : 'No',
        highlight: true,
        color: prime ? 'positive' : 'negative',
      },
      {
        id: 'factors',
        label: 'Prime Factors',
        value: factorList.length > 0 ? factorList.join(', ') : (prime ? n.toString() + ' (prime)' : 'None'),
      },
      {
        id: 'divisorCount',
        label: 'Number of Divisors',
        value: divisorCount.toLocaleString(),
      },
      {
        id: 'primalityCheck',
        label: 'Primality Check Steps',
        value: steps,
      },
    ];
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
      'Enter any positive integer between 1 and 10,000,000 in the input field.',
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
      { label: 'Trial division limit', value: 'sqrt(n), check up to 3162 for 10M' },
    ],
    faqs: [
      {
        question: 'Is 1 a prime number?',
        answer: 'No, 1 is not a prime number. By definition, a prime number must have exactly two distinct positive divisors. The number 1 has only one divisor (itself). Excluding 1 from the primes ensures the Fundamental Theorem of Arithmetic holds: every integer has a unique prime factorization. If 1 were considered prime, factorizations would no longer be unique (e.g., 6 = 2 × 3 = 1 × 2 × 3 = 1 × 1 × 2 × 3, etc.).',
      },
      {
        question: 'What is the largest known prime number?',
        answer: 'The largest known prime as of early 2025 is 2^136279841 - 1, a Mersenne prime discovered by the Great Internet Mersenne Prime Search (GIMPS) project. It has over 41 million digits. Mersenne primes are of the form 2^p - 1 and are easier to test for primality using the Lucas-Lehmer test. New ones are discovered regularly by distributed computing projects.',
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
        answer: 'RSA encryption, one of the most widely used encryption systems, relies on the fact that multiplying two large primes together is easy, but factoring the result back into primes is extremely hard. A typical RSA key uses two primes that are each hundreds of digits long. The security of the system depends on this asymmetry — even with the fastest computers, factoring a 2048-bit number into its prime factors would take longer than the age of the universe with current algorithms.',
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
      'If you are testing many numbers, remember that the trial division algorithm checks up to sqrt(n). For n = 10,000,000, this means at most 1,581 odd numbers need to be checked, which is very fast.',
      'The divisor count result is especially useful: a prime has exactly 2 divisors, a prime power p^k has k+1 divisors, and composite numbers with many small prime factors can have surprisingly many divisors (e.g., 720 has 30 divisors).',
      'For cryptographic or large-number use cases, note that this calculator is limited to 10 million. Prime generation for RSA keys (which uses 1024-bit or 2048-bit numbers) requires specialized libraries and probabilistic primality tests.',
    ],
    limitations: [
      'The trial division algorithm becomes computationally expensive for numbers near the 10 million upper bound, though still within practical limits (sqrt(10M) = 3162 divisions).',
      'Numbers larger than 10 million cannot be tested with this calculator.',
      'The primality test is deterministic for the supported range but does not provide a certificate of primality suitable for cryptographic verification.',
      'The prime factorization shown for composite numbers may not be unique in its display format, though the fundamental theorem of arithmetic guarantees uniqueness of the factor set.',
    ],
    citations: [
      { source: 'Wikipedia — Prime Number', url: 'https://en.wikipedia.org/wiki/Prime_number' },
      { source: 'Wolfram MathWorld — Prime Number', url: 'https://mathworld.wolfram.com/PrimeNumber.html' },
    ],
  },
};

export default primeNumberConfig;
