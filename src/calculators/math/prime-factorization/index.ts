import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import PrimeFactorizationPanel from './PrimeFactorizationPanel';

interface FactorTreeNode {
  value: number;
  isPrime?: boolean;
  left?: FactorTreeNode;
  right?: FactorTreeNode;
}

function primeFactors(n: number): { factor: number; exponent: number }[] {
  const factors: { factor: number; exponent: number }[] = [];
  let num = n;
  for (let p = 2; p * p <= num; p++) {
    if (num % p === 0) {
      let count = 0;
      while (num % p === 0) {
        num /= p;
        count++;
      }
      factors.push({ factor: p, exponent: count });
    }
  }
  if (num > 1) factors.push({ factor: num, exponent: 1 });
  return factors;
}

function buildFactorTree(n: number): FactorTreeNode[] {
  function helper(num: number): FactorTreeNode {
    if (num <= 1) return { value: num, isPrime: true };
    for (let p = 2; p * p <= num; p++) {
      if (num % p === 0) {
        return {
          value: num,
          left: helper(p),
          right: helper(num / p),
        };
      }
    }
    return { value: num, isPrime: true };
  }
  return [helper(n)];
}

const primeFactorizationConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'number',
      label: 'Number',
      type: 'number',
      placeholder: '72',
      min: 2,
      step: 1,
      inputMode: 'numeric',
      helpText: 'Enter a positive integer ≥ 2 to find its prime factorization',
    },
  ],
  calculate: (values) => {
    const n = parseInt(values.number);
    if (isNaN(n) || n < 2 || !Number.isFinite(n) || n > 1000000) return [];

    const factors = primeFactors(n);
    const factorization = factors.map(f => f.exponent > 1 ? `${f.factor}^${f.exponent}` : `${f.factor}`).join(' × ');
    const treeData = buildFactorTree(n);

    return [
      { id: 'factorization', label: 'Prime Factorization', value: factorization, highlight: true, color: 'positive' },
      { id: 'primeFactors', label: 'Prime Factors', value: factors.map(f => f.factor).join(', ') },
      { id: 'totalPrimes', label: 'Prime Factors (with multiplicity)', value: factors.reduce((s, f) => s + f.exponent, 0).toString() },
      { id: '_treeData', label: 'Factor Tree Data', value: JSON.stringify(treeData) },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PrimeFactorizationPanel, { values, results });
  },
  educational: {
    formula: 'n = p₁ᵃ × p₂ᵇ × p₃ᶜ × ... (unique product of primes)',
    formulaDescription:
      'Every integer greater than 1 can be uniquely expressed as a product of prime numbers raised to exponents. This is the Fundamental Theorem of Arithmetic, which guarantees that every number has exactly one prime factorization (ignoring the order of factors). This uniqueness is what makes prime numbers the fundamental building blocks of all integers.',
    variables: [
      { symbol: 'p₁, p₂, p₃...', name: 'Prime Factors', description: 'Prime numbers that divide n evenly. Primes are numbers greater than 1 with exactly two factors: 1 and themselves.' },
      { symbol: 'a, b, c...', name: 'Exponents', description: 'How many times each prime factor appears in the factorization. For example, in 72 = 2 × 2 × 2 × 3 × 3, the exponent of 2 is 3 and the exponent of 3 is 2.' },
    ],
    howToUse: [
      'Enter any positive integer greater than 1 in the input field.',
      'View the prime factorization as a multiplication expression of prime numbers with exponents.',
      'See the interactive factor tree visualization that shows how the number breaks down step by step into its prime building blocks.',
      'Check the total number of prime factors (with multiplicity) to understand the number\'s "factor depth."',
    ],
    explanation:
      'Prime factorization breaks a number into its fundamental prime building blocks. The Fundamental Theorem of Arithmetic states that every integer greater than 1 has a unique prime factorization — meaning there is only one way to write it as a product of primes (ignoring the order). This uniqueness is what makes prime numbers so important: they are the atoms of the number system. To find the prime factorization, divide the number by the smallest prime (2) as many times as possible, then move to the next prime (3), and continue until the result is 1. For example, 72: divide by 2 three times to get 9, then divide by 3 twice to get 1, giving 72 = 2 × 2 × 2 × 3 × 3 = 2³ × 3². The factor tree visualization shows this process as a branching diagram. Prime factorization is essential for finding GCD and LCM (using shared and highest exponents), simplifying radicals, testing whether numbers are perfect squares or cubes, and understanding the structure of the number system. Cryptography, particularly RSA encryption, relies on the fact that factoring large numbers into primes is computationally difficult.',
    quickReference: [
      { label: 'Smallest prime', value: '2 (the only even prime)' },
      { label: 'First 10 primes', value: '2, 3, 5, 7, 11, 13, 17, 19, 23, 29' },
      { label: 'Perfect square', value: 'All exponents are even (e.g. 36 = 2²×3²)' },
      { label: 'Perfect cube', value: 'All exponents are multiples of 3' },
      { label: 'Divisibility by 2', value: 'Last digit is even' },
      { label: 'Divisibility by 3', value: 'Sum of digits divisible by 3' },
      { label: 'Divisibility by 5', value: 'Last digit is 0 or 5' },
      { label: 'Fundamental Theorem', value: 'Every integer > 1 has a unique prime factorization' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:320px;height:auto"><text x="160" y="18" text-anchor="middle" fill="var(--svg-374151)" font-size="13" font-weight="bold">Factor Tree of 72</text><text x="160" y="42" text-anchor="middle" fill="var(--svg-1e3a5f)" font-size="14" font-weight="bold">72</text><line x1="145" y1="48" x2="120" y2="65" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><line x1="175" y1="48" x2="200" y2="65" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="115" y="80" text-anchor="middle" fill="var(--svg-3b82f6)" font-size="13" font-weight="bold">8</text><text x="205" y="80" text-anchor="middle" fill="var(--svg-ef4444)" font-size="13" font-weight="bold">9</text><line x1="105" y1="85" x2="95" y2="100" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><line x1="125" y1="85" x2="135" y2="100" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><line x1="195" y1="85" x2="185" y2="100" stroke="var(--svg-ef4444)" stroke-width="1.5"/><line x1="215" y1="85" x2="225" y2="100" stroke="var(--svg-ef4444)" stroke-width="1.5"/><text x="90" y="115" text-anchor="middle" fill="var(--svg-059669)" font-size="12" font-weight="bold">2</text><text x="140" y="115" text-anchor="middle" fill="var(--svg-059669)" font-size="12" font-weight="bold">4</text><text x="180" y="115" text-anchor="middle" fill="var(--svg-059669)" font-size="12" font-weight="bold">3</text><text x="230" y="115" text-anchor="middle" fill="var(--svg-059669)" font-size="12" font-weight="bold">3</text><line x1="133" y1="120" x2="123" y2="135" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><line x1="147" y1="120" x2="157" y2="135" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="118" y="150" text-anchor="middle" fill="var(--svg-059669)" font-size="12" font-weight="bold">2</text><text x="162" y="150" text-anchor="middle" fill="var(--svg-059669)" font-size="12" font-weight="bold">2</text><text x="160" y="178" text-anchor="middle" fill="var(--svg-374151)" font-size="11">72 = 2&sup3; &times; 3&sup2;</text><text x="160" y="195" text-anchor="middle" fill="var(--svg-6b7280)" font-size="9">Every number has a unique prime factorization</text></svg>',
      alt: 'Factor tree diagram breaking 72 down into its prime factors: 2 × 2 × 2 × 3 × 3',
      caption: 'A factor tree breaks a number down step by step until all branches end at prime numbers.',
    },
    workedExamples: [
      {
        scenario: 'Find the prime factorization of 72 using a factor tree.',
        inputs: { number: '72' },
        result: '72 = 2³ × 3²',
        insight: 'Starting with 72, split into 8 × 9. Then 8 = 2 × 4 = 2 × 2 × 2, and 9 = 3 × 3. Collecting primes: three 2s and two 3s, so 72 = 2³ × 3². The exponent 3 means 2 appears three times as a factor.',
      },
      {
        scenario: 'Check if 144 is a perfect square by examining its prime factorization.',
        inputs: { number: '144' },
        result: '144 = 2⁴ × 3²',
        insight: 'All exponents (4 and 2) are even numbers. This confirms 144 is a perfect square: √144 = 2² × 3¹ = 4 × 3 = 12. If any exponent were odd, 144 would not be a perfect square.',
      },
      {
        scenario: 'Use prime factorization to find the GCD and LCM of 84 and 90.',
        inputs: { number: '84' },
        result: '84 = 2² × 3 × 7',
        insight: '84 = 2²×3×7 and 90 = 2×3²×5. For GCD: take lowest exponents of shared primes (2 and 3) → 2¹×3¹ = 6. For LCM: take highest exponents of all primes (2, 3, 5, 7) → 2²×3²×5×7 = 1260.',
      },
    ],
    proTips: [
      'To check if a number is a perfect square from its factorization: every exponent must be even. If 2 appears 4 times and 3 appears 2 times, the number is a perfect square. If any exponent is odd, it is not.',
      'Start dividing by 2 repeatedly until you get an odd number — this extracts all factors of 2 quickly. Then test odd numbers (3, 5, 7...) up to the square root. This is twice as fast as testing every integer.',
      'The number of trailing zeros in n! equals the exponent of 5 in its prime factorization (since there are always more 2s than 5s). For example, 100! ends in 24 zeros because floor(100/5) + floor(100/25) = 20 + 4 = 24.',
      'When building a factor tree by hand, start with the most obvious factor pair — even a bad split still converges to the same primes. There is no wrong path: 72 can split into 8×9 or 6×12 or 2×36, and all paths lead to 2³×3².',
    ],
    limitations: [
      'This calculator is restricted to numbers up to 1,000,000. Beyond this limit, trial division becomes too slow. Professional factoring algorithms (Pollard rho, quadratic sieve, general number field sieve) are needed for large integers — these are used in cryptography.',
      'The factor tree visualization always splits at the smallest prime factor, producing a specific tree shape. Other factor trees (splitting at different factoring choices) produce different visual shapes but the same prime leaves — the result is always identical.',
      'This calculator uses trial division, which tests all primes up to √n. For numbers near the 10⁶ limit, this is fast enough, but it does not implement probabilistic primality tests (Miller-Rabin) or advanced factoring methods.',
    ],
    faqs: [
      {
        question: 'What is a prime number?',
        answer: 'A prime number is a positive integer greater than 1 that has exactly two factors: 1 and itself. The first few primes are 2, 3, 5, 7, 11, 13, 17, 19, 23, 29... The number 2 is the only even prime — all other even numbers are divisible by 2. Primes become less frequent as numbers get larger, but there are infinitely many (proved by Euclid around 300 BCE).',
      },
      {
        question: 'Can prime factorization be used to find GCF and LCM?',
        answer: 'Yes! For GCF, take the LOWEST exponent of each shared prime factor. For LCM, take the HIGHEST exponent of each prime factor across both numbers. For example, 72 = 2³ × 3² and 108 = 2² × 3³. GCF = 2² × 3² = 4 × 9 = 36. LCM = 2³ × 3³ = 8 × 27 = 216. This is more efficient than listing factors or multiples for large numbers.',
      },
      {
        question: 'What is a factor tree and how do I use it?',
        answer: 'A factor tree is a visual diagram that breaks a number down into its prime factors step by step. Start with the number at the top. Draw two branches to a factor pair (any two numbers that multiply to the target). Continue branching each composite number until all branches end at prime numbers. The product of all leaf primes is the prime factorization.',
      },
      {
        question: 'Why is the prime factorization unique?',
        answer: 'The Fundamental Theorem of Arithmetic guarantees that every integer greater than 1 has exactly one prime factorization (ignoring order). This was proved by Euclid around 300 BCE. If factorizations were not unique, the entire edifice of number theory would collapse — divisibility, GCD, LCM, and much of modern mathematics depend on this uniqueness.',
      },
      {
        question: 'How do I know when to stop factoring?',
        answer: 'You stop when every branch of the factor tree ends at a prime number. In the trial division method, you stop when the remaining number is less than the square of the next prime to test — at that point, what remains is prime. For example, after extracting all factors of 2 from 72, you get 9. Since 3² = 9 and 3 ≤ √9, you continue. After extracting 3s, you get 1, and you are done.',
      },
      {
        question: 'How is prime factorization used in cryptography?',
        answer: 'RSA encryption, which secures most internet communication, relies on the fact that multiplying two large primes is easy, but factoring their product back into the two original primes is extremely difficult. A 2048-bit RSA key is the product of two ~300-digit primes. While our calculator handles numbers up to 10⁶ in milliseconds, factoring a 600-digit number would take the world\'s best computers billions of years using current algorithms.',
      },
    ],
    citations: [
      { source: 'Wikipedia - Prime Factorization', url: 'https://en.wikipedia.org/wiki/Prime_factorization' },
      { source: 'Wolfram MathWorld - Prime Factorization', url: 'https://mathworld.wolfram.com/PrimeFactorization.html' },
    ],
  },
};

export default primeFactorizationConfig;
