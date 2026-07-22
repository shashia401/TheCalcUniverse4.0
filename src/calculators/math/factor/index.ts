import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import FactorPanel from './FactorPanel';

function getFactors(n: number): number[] {
  const factors: number[] = [];
  for (let i = 1; i <= Math.sqrt(Math.abs(n)); i++) {
    if (n % i === 0) {
      factors.push(i);
      if (i !== n / i) factors.push(n / i);
    }
  }
  return factors.sort((a, b) => a - b);
}

function getFactorPairs(n: number): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 1; i <= Math.sqrt(Math.abs(n)); i++) {
    if (n % i === 0) {
      pairs.push([i, n / i]);
    }
  }
  return pairs;
}

const factorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'number',
      label: 'Number',
      type: 'number',
      placeholder: '24',
      min: 1,
      step: 1,
      inputMode: 'numeric',
      helpText: 'Enter a positive integer to find its factors',
    },
  ],
  calculate: (values) => {
    const n = parseInt(values.number);
    if (isNaN(n) || n < 1 || !Number.isFinite(n)) return [];

    const factors = getFactors(n);
    const pairs = getFactorPairs(n);
    const pairStr = pairs.map(([a, b]) => `${a} × ${b}`).join(' | ');

    return [
      { id: 'count', label: 'Total Factors', value: factors.length.toString(), highlight: true },
      { id: 'factorList', label: 'All Factors', value: factors.join(', ') },
      { id: 'factorPairs', label: 'Factor Pairs', value: pairStr, color: 'positive' },
      { id: 'sum', label: 'Sum of Factors', value: factors.reduce((s, f) => s + f, 0).toString() },
      { id: 'isPrime', label: 'Prime?', value: factors.length === 2 ? 'Yes' : 'No' },
      { id: '_pairsData', label: 'Pairs Data', value: JSON.stringify(pairs) },
      { id: 'pairsData', label: 'Pairs Data', value: JSON.stringify(pairs) },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(FactorPanel, { values, results });
  },
  educational: {
    formula: 'n = a × b | a, b are factors of n',
    formulaDescription:
      'Factors are whole numbers that divide evenly into another number with no remainder. Every factor pair (a, b) satisfies a × b = n. Finding all factors of a number is a fundamental number theory skill with applications in simplification, division, and factorization problems.',
    variables: [
      { symbol: 'n', name: 'Number', description: 'The positive integer to find factors of. Must be a whole number greater than 0.' },
      { symbol: 'a, b', name: 'Factor Pair', description: 'Two numbers whose product equals n. Each factor pair represents one way to multiply to reach n.' },
    ],
    howToUse: [
      'Enter any positive integer in the input field.',
      'View ALL factors listed in ascending order, from smallest to largest.',
      'See the factor pairs table showing each pair multiplied together to produce the original number.',
      'Check the "Prime?" indicator to instantly determine if the number is prime (exactly two factors: 1 and itself).',
      'The sum of all factors is also displayed, which is useful for classifying numbers as deficient, perfect, or abundant.',
    ],
    explanation:
      'Finding factors is a fundamental number theory skill with applications throughout mathematics. A factor of n is any integer that divides n evenly with no remainder. Every positive integer greater than 1 has at least two factors: 1 and itself. Numbers with exactly two factors are called prime numbers, while numbers with more than two factors are called composite numbers. The number 1 is neither prime nor composite — it has exactly one factor. To find all factors efficiently, you only need to test divisors up to the square root of n: for each divisor d that divides n evenly, both d and n/d are factors. This is why the calculator can find factors of large numbers quickly. For example, for n = 36, the square root is 6, so testing divisors 1 through 6 reveals: 1 × 36, 2 × 18, 3 × 12, 4 × 9, and 6 × 6. The sum of all proper factors (excluding n itself) determines whether a number is deficient (sum < n), perfect (sum = n, like 6 = 1+2+3), or abundant (sum > n).',
    quickReference: [
      { label: 'Prime number', value: 'Exactly 2 factors (1 and itself)' },
      { label: 'Composite number', value: 'More than 2 factors' },
      { label: 'Perfect number', value: 'Sum of proper factors = n (e.g. 6, 28, 496)' },
      { label: 'Deficient number', value: 'Sum of proper factors < n (e.g. 10, 14)' },
      { label: 'Abundant number', value: 'Sum of proper factors > n (e.g. 12, 18)' },
      { label: 'Square number', value: 'One factor pair has a = b (e.g. 4×4=16)' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="25" text-anchor="middle" fill="var(--svg-374151)" font-size="14" font-weight="bold">Factors of 24</text><rect x="40" y="38" width="240" height="28" fill="var(--svg-bfdbfe)" stroke="var(--svg-3b82f6)" stroke-width="2" rx="6"/><text x="160" y="57" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="12">1, 2, 3, 4, 6, 8, 12, 24</text><text x="160" y="82" text-anchor="middle" fill="var(--svg-374151)" font-size="11" font-weight="bold">Factor Pairs</text><rect x="20" y="92" width="130" height="30" fill="var(--svg-fef3c7)" stroke="var(--svg-ef4444)" stroke-width="1.5" rx="5"/><text x="85" y="106" text-anchor="middle" fill="var(--svg-991b1b)" font-size="11">1 &amp;times; 24</text><text x="85" y="118" text-anchor="middle" fill="var(--svg-9ca3af)" font-size="9">smallest &amp;times; largest</text><rect x="170" y="92" width="130" height="30" fill="var(--svg-fef3c7)" stroke="var(--svg-ef4444)" stroke-width="1.5" rx="5"/><text x="235" y="106" text-anchor="middle" fill="var(--svg-991b1b)" font-size="11">2 &amp;times; 12</text><rect x="20" y="128" width="130" height="30" fill="var(--svg-fef3c7)" stroke="var(--svg-ef4444)" stroke-width="1.5" rx="5"/><text x="85" y="142" text-anchor="middle" fill="var(--svg-991b1b)" font-size="11">3 &amp;times; 8</text><rect x="170" y="128" width="130" height="30" fill="var(--svg-fef3c7)" stroke="var(--svg-ef4444)" stroke-width="1.5" rx="5"/><text x="235" y="142" text-anchor="middle" fill="var(--svg-991b1b)" font-size="11">4 &amp;times; 6</text><text x="160" y="182" text-anchor="middle" fill="var(--svg-6b7280)" font-size="10">Sum of factors (excl. 24): 1+2+3+4+6+8+12 = 36 (abundant)</text></svg>',
      alt: 'Factor pairs diagram showing all factor pairs of 24 arranged in a grid',
      caption: 'Factors come in pairs that multiply to the original number. Each pair represents one way to multiply to reach n.',
    },
    workedExamples: [
      {
        scenario: 'A teacher has 24 cookies to divide equally among students. How many ways can she group them?',
        inputs: { number: '24' },
        result: '8 factors: 1, 2, 3, 4, 6, 8, 12, 24 — 4 factor pairs',
        insight: 'With 8 factors, the cookies can be split into groups of 1, 2, 3, 4, 6, 8, 12, or 24. For 6 groups of 4 each, use the factor pair 4 × 6.',
      },
      {
        scenario: 'A gardener wants to plant 36 flowers in a rectangular grid. All possible row arrangements?',
        inputs: { number: '36' },
        result: '9 factors: 1, 2, 3, 4, 6, 9, 12, 18, 36 — 5 factor pairs including 6 × 6 (square)',
        insight: 'The 6 × 6 square arrangement means 36 is a perfect square. The gardener has 5 rectangular layouts: 1×36, 2×18, 3×12, 4×9, and the 6×6 square.',
      },
      {
        scenario: 'Check if 97 is a prime number (important for cryptography or quick divisibility checks).',
        inputs: { number: '97' },
        result: '2 factors: 1, 97 — Prime: Yes',
        insight: 'Since √97 ≈ 9.85, we only need to test divisibility by 2, 3, 5, 7 (primes ≤ 9). None divide 97 evenly, confirming it is indeed prime.',
      },
    ],
    proTips: [
      'To quickly check if a number is prime, find its square root and test divisibility by primes up to that root. For numbers under 100, you only need to test 2, 3, 5, and 7.',
      'When factoring for fraction simplification, look for the largest factor that both numerator and denominator share — this is the GCF. The factor calculator lists all candidates.',
      'The sum of proper factors (excluding the number itself) classifies the number: if the sum equals the number, it is perfect (6, 28, 496, 8128). If less, deficient. If more, abundant.',
      'Factor pairs are symmetric around √n. Once you pass the square root, every new divisor is just the paired partner of one you already found — no need to search beyond.',
    ],
    limitations: [
      'This calculator works only with positive integers. Negative numbers, zero, decimals, and fractions are not supported. For negative integer factors, treat the sign separately.',
      'For extremely large numbers (over 10¹²), the trial-division algorithm becomes slow. Cryptographic applications use specialized factoring algorithms (Pollard rho, quadratic sieve) instead.',
      'The prime/not-prime check only counts total factors. It does not perform a Miller-Rabin primality test or provide a certainty level — it assumes trial division is sufficient for the entered number.',
    ],
    faqs: [
      {
        question: 'What is a factor pair?',
        answer: 'A factor pair is two numbers that multiply together to give the original number. For example, 24 has factor pairs: 1 × 24, 2 × 12, 3 × 8, and 4 × 6. The pairs are listed in the table for quick reference. Each pair represents a different rectangular arrangement of objects.',
      },
      {
        question: 'How do I find factors of large numbers?',
        answer: 'Start with 1 and work up to the square root of the number. For each number that divides evenly, add both the divisor and the quotient to your list. You only need to check up to the square root because every divisor below the square root pairs with one above it. Using a calculator like this one automates the process instantly.',
      },
      {
        question: 'What is the difference between factors and multiples?',
        answer: 'Factors of n divide n evenly (e.g., factors of 12 are 1, 2, 3, 4, 6, 12). Multiples of n are what you get by multiplying n by integers (e.g., multiples of 12 are 12, 24, 36, 48...). Factors are always less than or equal to n; multiples are always greater than or equal to n. Factors are the "building blocks"; multiples are the "extensions."',
      },
      {
        question: 'How can I tell if a number is a perfect square from its factors?',
        answer: 'A number is a perfect square when one of its factor pairs has two equal numbers — like 6 × 6 = 36 or 7 × 7 = 49. Another sign: perfect squares always have an odd number of total factors (because the square root factor only counts once). For example, 36 has 9 factors (odd); 24 has 8 factors (even).',
      },
      {
        question: 'What are proper factors and why do they matter?',
        answer: 'Proper factors are all factors of a number except the number itself. For 12, proper factors are 1, 2, 3, 4, 6. The sum of proper factors determines if the number is deficient (sum < n), perfect (sum = n, e.g. 6 and 28), or abundant (sum > n). This classification was studied by ancient Greek mathematicians and connects to amicable numbers and aliquot sequences.',
      },
      {
        question: 'How do factors help with simplifying fractions?',
        answer: 'To simplify a fraction like 24/36 to its lowest terms, find the factors of both numerator and denominator, then identify the largest factor they share (the GCF). Divide both by that number: 24/36 divided by 12/12 gives 2/3. The factor calculator helps you spot common factors quickly.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Factorization', url: 'https://en.wikipedia.org/wiki/Factorization' },
      { source: 'Wolfram MathWorld - Factor', url: 'https://mathworld.wolfram.com/Factor.html' },
    ],
  },
};

export default factorConfig;
