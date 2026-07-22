import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import GCFPanel from './GCFPanel';

function gcd(a: number, b: number): number {
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function getPrimeFactors(n: number): { factor: number; exponent: number }[] {
  const factors: { factor: number; exponent: number }[] = [];
  let num = n;
  for (let p = 2; p * p <= num; p++) {
    if (num % p === 0) {
      let count = 0;
      while (num % p === 0) { num /= p; count++; }
      factors.push({ factor: p, exponent: count });
    }
  }
  if (num > 1) factors.push({ factor: num, exponent: 1 });
  return factors;
}

const gcfConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'a',
      label: 'Number A',
      type: 'number',
      placeholder: '24',
      min: 1,
      step: 1,
      inputMode: 'numeric',
      helpText: 'Enter the first positive integer',
    },
    {
      id: 'b',
      label: 'Number B',
      type: 'number',
      placeholder: '36',
      min: 1,
      step: 1,
      inputMode: 'numeric',
      helpText: 'Enter the second positive integer',
    },
  ],
  calculate: (values) => {
    const a = parseInt(values.a);
    const b = parseInt(values.b);

    if (isNaN(a) || isNaN(b) || a < 1 || b < 1 || !Number.isFinite(a) || !Number.isFinite(b)) return [];

    const gcf = gcd(a, b);
    const pfA = getPrimeFactors(a);
    const pfB = getPrimeFactors(b);

    // Find shared prime factors
    const shared: { factor: number; exponent: number }[] = [];
    for (const f of pfA) {
      const match = pfB.find(p => p.factor === f.factor);
      if (match) {
        shared.push({ factor: f.factor, exponent: Math.min(f.exponent, match.exponent) });
      }
    }

    // Euclidean algorithm steps
    const euclidSteps: string[] = [];
    let x = a, y = b;
    while (y) {
      const r = x % y;
      euclidSteps.push(`${x} = ${y} × ${Math.floor(x / y)} + ${r}`);
      [x, y] = [y, r];
    }
    euclidSteps.push(`GCF(${a}, ${b}) = ${x}`);

    return [
      { id: 'gcf', label: `GCF of ${a} and ${b}`, value: gcf.toString(), highlight: true, color: 'positive' },
      { id: 'euclidSteps', label: 'Euclidean Algorithm', value: euclidSteps.join(' | ') },
      { id: '_primeData', label: 'Prime Data', value: JSON.stringify({ a: pfA, b: pfB, shared }) },
      { id: 'primeData', label: 'Prime Data', value: JSON.stringify({ a: pfA, b: pfB, shared }) },
      { id: 'sharedFactors', label: 'Shared Prime Factors', value: shared.map(f => `${f.factor}^${f.exponent}`).join(' × ') },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(GCFPanel, { values, results });
  },
  educational: {
    formula: 'GCF(a, b) = largest number dividing both a and b evenly',
    formulaDescription:
      'The Greatest Common Factor (GCF), also called the Greatest Common Divisor (GCD), is the largest positive integer that divides both numbers without a remainder. This calculator demonstrates two methods: the Euclidean algorithm (by repeated division) and prime factorization (by comparing shared prime factors with a visual Venn diagram).',
    variables: [
      { symbol: 'a, b', name: 'Input Numbers', description: 'The positive integers to find the GCF of. Both must be whole numbers greater than 0.' },
      { symbol: 'GCF', name: 'Greatest Common Factor', description: 'The largest positive integer that divides both a and b without a remainder.' },
      { symbol: 'Euclidean Algorithm', name: 'Algorithm Steps', description: 'A step-by-step division process that efficiently finds the GCF without factoring.' },
    ],
    howToUse: [
      'Enter two positive integers to find their Greatest Common Factor.',
      'View the GCF result along with the step-by-step Euclidean algorithm showing each division.',
      'The Venn diagram visualizes the prime factors of each number, with shared factors in the overlapping region.',
      'The shared prime factors section lists the primes common to both numbers, which multiply to form the GCF.',
    ],
    explanation:
      'The Greatest Common Factor (GCF) is the largest number that divides into both input numbers evenly. It is also called the Greatest Common Divisor (GCD) or Highest Common Factor (HCF). The Euclidean algorithm is the most efficient method for finding the GCF, especially for large numbers: it works by repeatedly replacing the larger number with the remainder of dividing the larger by the smaller until the remainder reaches zero. The last non-zero remainder is the GCF. This algorithm has been known since ancient Greece (circa 300 BCE) and remains one of the oldest numerical algorithms still in common use. The alternative method, prime factorization, breaks each number into its prime building blocks; the GCF is the product of shared prime factors raised to the lowest exponent appearing in either factorization. For example, 24 = 2 × 2 × 2 × 3 and 36 = 2 × 2 × 3 × 3, so the shared primes are 2 (twice) and 3 (once), giving GCF = 2 × 2 × 3 = 12.',
    quickReference: [
      { label: 'GCF via prime factors', value: 'Product of shared primes (lowest exponent)' },
      { label: 'GCF via Euclidean', value: 'GCD(a,b) = GCD(b, a mod b) until remainder 0' },
      { label: 'LCM relationship', value: 'LCM(a,b) × GCF(a,b) = a × b' },
      { label: 'Co-prime (relatively prime)', value: 'GCF = 1 (e.g. 14 and 15)' },
      { label: 'Common divisor', value: 'Any factor shared by both numbers' },
      { label: 'GCF of same number', value: 'GCF(a, a) = a' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="22" text-anchor="middle" fill="var(--svg-374151)" font-size="12" font-weight="bold">GCF(24, 36) = 12</text><text x="80" y="48" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="10" font-weight="bold">24</text><line x1="60" y1="52" x2="100" y2="52" stroke="var(--svg-3b82f6)" stroke-width="1"/><text x="30" y="70" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="10">2</text><text x="50" y="70" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="9">&amp;times;</text><text x="70" y="70" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="10">2</text><text x="90" y="70" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="9">&amp;times;</text><text x="110" y="70" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="10">2</text><text x="130" y="70" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="9">&amp;times;</text><text x="150" y="70" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="10">3</text><text x="240" y="48" text-anchor="middle" fill="var(--svg-ef4444)" font-size="10" font-weight="bold">36</text><line x1="220" y1="52" x2="260" y2="52" stroke="var(--svg-ef4444)" stroke-width="1"/><text x="204" y="70" text-anchor="middle" fill="var(--svg-ef4444)" font-size="10">2</text><text x="220" y="70" text-anchor="middle" fill="var(--svg-ef4444)" font-size="9">&amp;times;</text><text x="236" y="70" text-anchor="middle" fill="var(--svg-ef4444)" font-size="10">2</text><text x="252" y="70" text-anchor="middle" fill="var(--svg-ef4444)" font-size="9">&amp;times;</text><text x="268" y="70" text-anchor="middle" fill="var(--svg-ef4444)" font-size="10">3</text><text x="276" y="70" text-anchor="middle" fill="var(--svg-ef4444)" font-size="9">&amp;times;</text><text x="290" y="70" text-anchor="middle" fill="var(--svg-ef4444)" font-size="10">3</text><rect x="60" y="85" width="200" height="35" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="8"/><text x="160" y="102" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="11" font-weight="bold">Shared Prime Factors</text><text x="160" y="116" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="10">2 &amp;times; 2 &amp;times; 3 = 12</text><text x="160" y="138" text-anchor="middle" fill="var(--svg-6b7280)" font-size="10">Euclidean Algorithm:</text><text x="160" y="153" text-anchor="middle" fill="var(--svg-6b7280)" font-size="10">36 &amp;divide; 24 = 1 R 12</text><text x="160" y="168" text-anchor="middle" fill="var(--svg-6b7280)" font-size="10">24 &amp;divide; 12 = 2 R 0</text><text x="160" y="183" text-anchor="middle" fill="var(--svg-059669)" font-size="10" font-weight="bold">Last non-zero remainder: 12</text></svg>',
      alt: 'Prime factor boxes for 24 and 36 showing shared prime factors that multiply to the GCF',
      caption: 'The GCF is the product of shared prime factors raised to the lowest exponent in either factorization.',
    },
    workedExamples: [
      {
        scenario: 'Simplify the fraction 42/56 to its lowest terms using GCF.',
        inputs: { a: '42', b: '56' },
        result: 'GCF(42, 56) = 14',
        insight: 'Divide both numerator and denominator by 14: 42÷14=3, 56÷14=4. The simplified fraction is 3/4. The Euclidean algorithm: 56 = 42×1 + 14, 42 = 14×3 + 0.',
      },
      {
        scenario: 'A baker has 48 chocolate chip cookies and 72 oatmeal cookies. What is the largest equal group size for gift boxes?',
        inputs: { a: '48', b: '72' },
        result: 'GCF(48, 72) = 24',
        insight: 'Each gift box can hold 24 cookies, using 2 boxes for chocolate chip (48/24=2) and 3 boxes for oatmeal (72/24=3). This uses all cookies with no leftovers.',
      },
      {
        scenario: 'Check if 14 and 15 are co-prime (relatively prime) for use in modular arithmetic.',
        inputs: { a: '14', b: '15' },
        result: 'GCF(14, 15) = 1',
        insight: 'Since the GCF is 1, the numbers are co-prime. This means they share no common prime factors and their product 14×15=210 equals their LCM. Co-prime numbers are essential in cryptography and modular arithmetic.',
      },
    ],
    proTips: [
      'For two numbers where one is a multiple of the other, the GCF is the smaller number. For example, GCF(12, 36) = 12. No calculation needed.',
      'The Euclidean algorithm is lightning-fast even for numbers with hundreds of digits. In fact, its efficiency is why it underpins the RSA encryption algorithm.',
      'If both numbers are even, the GCF is at least 2. Divide both by 2 repeatedly until at least one is odd — this shortcut dramatically reduces the numbers before running the full algorithm.',
      'When simplifying a fraction by hand, the factor list approach (listing all common factors and picking the largest) works well for small numbers, but for large numbers, use the Euclidean algorithm or the GCF calculator.',
    ],
    limitations: [
      'This calculator finds the GCF of exactly two numbers. For three or more numbers, find the GCF of the first two, then find the GCF of that result with the third, and so on: GCF(a, b, c) = GCF(GCF(a, b), c).',
      'Only positive integers are supported. Negative numbers, zero, and non-integers are rejected because GCF is defined only for positive integers in standard arithmetic.',
      'The prime factorization method used in the Venn diagram becomes computationally expensive for numbers with large prime factors (e.g., numbers near 10⁹ or larger). The Euclidean algorithm result remains accurate in those cases.',
    ],
    faqs: [
      {
        question: 'What is the Euclidean algorithm?',
        answer: 'The Euclidean algorithm finds GCF/GCD by repeated division. Example for GCF(24, 36): divide 36 by 24 to get remainder 12, then divide 24 by 12 to get remainder 0. The last non-zero remainder (12) is the GCF. The calculator shows each step of this process. This method is much faster than factoring for large numbers.',
      },
      {
        question: 'How does the Venn diagram help find GCF?',
        answer: 'The Venn diagram shows the prime factors of each number in overlapping circles. The shared factors (in the intersection) multiply together to give the GCF. For example, 24 = 2 × 2 × 2 × 3 and 36 = 2 × 2 × 3 × 3. The shared factors are two 2s and one 3, so GCF = 2 × 2 × 3 = 12. The visual layout makes the concept intuitive.',
      },
      {
        question: 'What is the practical use of GCF?',
        answer: 'GCF is used for simplifying fractions (divide numerator and denominator by the GCF to get lowest terms), dividing items into the largest possible equal groups, solving ratio problems, and in modular arithmetic and cryptography. In construction, GCF helps determine the largest common measurement for cutting materials.',
      },
      {
        question: 'What does it mean when GCF equals 1?',
        answer: 'When GCF(a, b) = 1, the two numbers are called co-prime or relatively prime — they share no common prime factors. For example, 14 and 15 are co-prime. This has important implications: the fraction a/b is already in its simplest form, and the Chinese Remainder Theorem guarantees unique solutions modulo a×b in modular arithmetic.',
      },
      {
        question: 'How is GCF related to LCM?',
        answer: 'The fundamental relationship is: LCM(a, b) × GCF(a, b) = a × b. This means you can find either one from the other. For example, for a=24, b=36, GCF=12, so LCM = (24×36)/12 = 864/12 = 72. This formula is why you only need to compute one of them — the other follows immediately.',
      },
      {
        question: 'Can the Euclidean algorithm handle very large numbers?',
        answer: 'Yes — the Euclidean algorithm runs in O(log min(a,b)) time, meaning it takes only a few dozen steps even for numbers with hundreds of digits. For example, finding the GCF of two 100-digit numbers takes fewer than 700 iterations. This makes it one of the most efficient algorithms in all of computer science and a cornerstone of modern cryptography.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Greatest Common Divisor', url: 'https://en.wikipedia.org/wiki/Greatest_common_divisor' },
      { source: 'Wolfram MathWorld - Greatest Common Divisor', url: 'https://mathworld.wolfram.com/GreatestCommonDivisor.html' },
    ],
  },
};

export default gcfConfig;
