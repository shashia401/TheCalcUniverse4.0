import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import FibonacciPanel from './FibonacciPanel';

/**
 * Generate the first n Fibonacci numbers iteratively.
 * F(0) = 0, F(1) = 1, F(2) = 1, F(n) = F(n-1) + F(n-2)
 * Returns an array of length n (1-indexed positions).
 */
function generateFibonacciSequence(n: number): number[] {
  const seq: number[] = [];
  let a = 0; // F(0)
  let b = 1; // F(1)
  for (let i = 1; i <= n; i++) {
    if (i === 1) {
      seq.push(1); // F(1) = 1
    } else {
      const next = a + b;
      seq.push(next);
      a = b;
      b = next;
    }
  }
  return seq;
}

/**
 * Compute the nth Fibonacci number using iteration.
 * F(1) = 1, F(2) = 1, F(n) = F(n-1) + F(n-2)
 */
function fibonacciNth(n: number): number {
  if (n <= 0) return 0;
  if (n === 1 || n === 2) return 1;
  let a = 1; // F(1)
  let b = 1; // F(2)
  for (let i = 3; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }
  return b;
}

/**
 * Compute Binet's approximation of the nth Fibonacci number.
 * F(n) ≈ φⁿ / √5, where φ = (1 + √5) / 2
 * Returns a rounded number.
 */
function binetApproximation(n: number): number {
  const phi = (1 + Math.sqrt(5)) / 2;
  const sqrt5 = Math.sqrt(5);
  return Math.round(Math.pow(phi, n) / sqrt5);
}

const fibonacciConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'n',
      label: 'Position (n)',
      type: 'number',
      placeholder: 'Enter position n',
      defaultValue: '10',
      min: 1,
      max: 100,
      required: true,
      helpText: 'Enter the position in the Fibonacci sequence to calculate',
    },
  ],
  calculate: (values) => {
    const n = parseInt(values.n, 10);
    if (isNaN(n) || n < 1 || n > 100 || !Number.isFinite(n)) return [];

    const nth = fibonacciNth(n);
    const seq = generateFibonacciSequence(n);
    const seqSum = seq.reduce((acc, val) => acc + val, 0);
    const binet = binetApproximation(n);

    return [
      {
        id: 'nthTerm',
        label: `F(${n})`,
        value: nth.toString(),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'sequence',
        label: `First ${n} Terms`,
        value: seq.join(', '),
      },
      {
        id: 'sum',
        label: `Sum of First ${n} Terms`,
        value: seqSum.toString(),
      },
      {
        id: 'binetApproximation',
        label: `Binet's Formula Approximation`,
        value: binet.toString(),
      },
    ];
  },
  educational: {
    formula: 'F(n) = F(n-1) + F(n-2)',
    formulaDescription:
      'The Fibonacci sequence is a series of numbers where each number (after the first two) is the sum of the two preceding ones. Defined by the recurrence relation F(n) = F(n-1) + F(n-2) with seed values F(0) = 0 and F(1) = 1, the sequence begins: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144... The ratio of consecutive Fibonacci numbers converges to the golden ratio phi = (1 + sqrt(5))/2 ≈ 1.618, which appears throughout art, architecture, and nature.',
    variables: [
      {
        symbol: 'F(n)',
        name: 'nth Fibonacci Number',
        description: 'The value of the Fibonacci sequence at position n. F(1) = 1, F(2) = 1, and each subsequent term is the sum of the previous two terms.',
      },
      {
        symbol: 'F(n-1)',
        name: 'Previous Fibonacci Number',
        description: 'The Fibonacci number immediately before F(n). Used in the recurrence relation to compute the next term in the sequence.',
      },
      {
        symbol: 'F(n-2)',
        name: 'Second Previous Fibonacci Number',
        description: 'The Fibonacci number two positions before F(n). Together with F(n-1), it defines the next term in the sequence.',
      },
      {
        symbol: 'phi',
        name: 'Golden Ratio',
        description: 'The golden ratio phi = (1 + sqrt(5))/2 ≈ 1.6180339887. The ratio F(n+1)/F(n) approaches phi as n increases. Binet\'s formula uses phi to compute F(n) directly without iteration.',
      },
    ],
    howToUse: [
      'Enter the position n (from 1 to 100) to find the nth Fibonacci number.',
      'View the exact value of F(n) displayed prominently.',
      'Scroll through the complete sequence of the first n terms, comma-separated.',
      'Check the sum of the first n Fibonacci numbers for patterns and relationships.',
      'Compare the iterative result with Binet\'s formula approximation, which becomes increasingly accurate for larger n.',
    ],
    quickReference: [
      { label: 'F(1)', value: '1' },
      { label: 'F(5)', value: '5' },
      { label: 'F(10)', value: '55' },
      { label: 'Golden Ratio', value: 'phi = (1 + sqrt(5))/2 ≈ 1.618' },
    ],
    commonUses: [
      'Algorithm analysis: Fibonacci numbers measure the worst-case time complexity of Euclid\'s algorithm for GCD and appear in the analysis of Fibonacci heaps.',
      'Nature: Fibonacci numbers appear in plant phyllotaxis (leaf arrangement), pinecone spirals, sunflower seed heads, and nautilus shell growth patterns.',
      'Art and design: The golden ratio derived from Fibonacci numbers is used in composition, architecture (Parthenon), and visual design for aesthetic proportions.',
      'Financial markets: Some traders use Fibonacci retracement levels (23.6%, 38.2%, 61.8%) derived from the golden ratio for technical analysis.',
      'Computer science: Fibonacci numbers are used in data structures like Fibonacci heaps, in pseudorandom number generation, and as a test case for recursion and dynamic programming.',
    ],
    explanation:
      'The Fibonacci sequence is one of the most famous and widely observed sequences in mathematics. Named after Leonardo of Pisa (Fibonacci), who introduced it in his 1202 book Liber Abaci, the sequence starts with F(0) = 0 and F(1) = 1, and each subsequent term is the sum of the two preceding ones. This seemingly simple recurrence generates numbers with remarkable properties. One of the most fascinating is the relationship to the golden ratio phi = (1 + sqrt(5))/2. As n grows large, the ratio of consecutive Fibonacci numbers F(n+1)/F(n) approaches phi. This connection is captured exactly by Binet\'s formula: F(n) = (phi^n - (-phi)^(-n)) / sqrt(5), which gives a closed-form expression for the nth Fibonacci number without iteration. For large n, the second term becomes negligible, giving the approximation F(n) = round(phi^n / sqrt(5)). The sum of the first n Fibonacci numbers has a simple closed form: sum of F(1) through F(n) = F(n+2) - 1. Fibonacci numbers also satisfy Cassini\'s identity: F(n-1) x F(n+1) - F(n)^2 = (-1)^n, which is useful for proving properties of the sequence. In nature, Fibonacci numbers appear in the spiral arrangements of leaves, the branching of trees, the fruitlets of pineapples, and the scales of pinecones, where they optimize packing efficiency. The sequence is also deeply connected to the Euclidean algorithm: the worst-case number of steps occurs when the inputs are consecutive Fibonacci numbers.',
    faqs: [
      {
        question: 'Where does the Fibonacci sequence appear in nature?',
        answer: 'Fibonacci numbers are surprisingly common in nature. Sunflower seed heads typically have 55 and 89 spirals in opposite directions (both Fibonacci numbers). Pinecones show 8 and 13 spirals. The arrangement of leaves on a stem (phyllotaxis) often follows Fibonacci angles to maximize sunlight exposure. Pineapple scales have 5, 8, 13, or 21 spirals. Even the branching of trees and family trees of honeybees follow Fibonacci patterns. This occurs because Fibonacci-based growth patterns optimize space and resource usage.',
      },
      {
        question: 'What is Binet\'s formula?',
        answer: 'Binet\'s formula is a closed-form expression for the nth Fibonacci number: F(n) = (phi^n - psi^n) / sqrt(5), where phi = (1 + sqrt(5))/2 is the golden ratio and psi = (1 - sqrt(5))/2 = -1/phi. Since |psi| < 1, the psi^n term approaches 0 for large n, giving the approximation F(n) = round(phi^n / sqrt(5)). Binet\'s formula was discovered by Jacques Binet in 1843, though it was known to Euler, Bernoulli, and de Moivre earlier.',
      },
      {
        question: 'What is the relationship between Fibonacci numbers and the golden ratio?',
        answer: 'The ratio of consecutive Fibonacci numbers F(n+1)/F(n) converges to the golden ratio phi = (1 + sqrt(5))/2 ≈ 1.618 as n increases. For example, F(10)/F(9) = 55/34 ≈ 1.6176, and F(20)/F(19) = 6765/4181 ≈ 1.6180. This convergence is rapid and alternates above and below phi. The golden ratio appears in many natural and artistic contexts and is considered aesthetically pleasing in design and architecture.',
      },
      {
        question: 'Does F(0) = 0 or F(0) = 1?',
        answer: 'The modern convention sets F(0) = 0 and F(1) = 1, a convention popularized by the mathematician Edouard Lucas in the 19th century. However, some older texts start with F(1) = 1 and F(2) = 1, which is equivalent. This calculator uses the modern convention: F(0) = 0, F(1) = 1, F(2) = 1, F(3) = 2, etc. When you request position n, you get F(n) where F(1) = 1 and F(2) = 1.',
      },
      {
        question: 'How large can n be before the numbers overflow?',
        answer: 'This calculator supports n from 1 to 100. F(78) = 894,439,432,379,146 is the last Fibonacci number below 10^16 (safe integer precision). F(79) = 1,446,773,453,678,131,541 begins to exceed JavaScript\'s safe integer range of 2^53 - 1 (about 9 quadrillion). For n up to 100, the values still fit within JavaScript\'s 64-bit floating point range (F(100) = 354,224,848,179,261,915,075 which is about 3.5 x 10^20), so results are approximate beyond n = 78 due to floating-point rounding.',
      },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="600" height="320" fill="transparent"/><text x="300" y="25" text-anchor="middle" font-size="16" font-weight="bold" fill="currentColor">Fibonacci Spiral from Squares</text><text x="300" y="45" text-anchor="middle" font-size="11" fill="var(--svg-6b7280)">Each square side length is a Fibonacci number: 1, 1, 2, 3, 5, 8</text><g transform="translate(200, 75)"><!-- F(1)=1 square --><rect x="0" y="0" width="10" height="10" fill="var(--svg-3b82f6)" stroke="currentColor" stroke-width="0.5" opacity="0.4"/><text x="5" y="7" text-anchor="middle" font-size="5" fill="currentColor">1</text><!-- F(2)=1 square (to the right) --><rect x="10" y="0" width="10" height="10" fill="var(--svg-3b82f6)" stroke="currentColor" stroke-width="0.5" opacity="0.4"/><text x="15" y="7" text-anchor="middle" font-size="5" fill="currentColor">1</text><!-- F(3)=2 square (above) --><rect x="0" y="-20" width="20" height="20" fill="var(--svg-8b5cf6)" stroke="currentColor" stroke-width="0.5" opacity="0.4"/><text x="10" y="-7" text-anchor="middle" font-size="6" fill="currentColor">2</text><!-- F(4)=3 square (to the left) --><rect x="-30" y="-20" width="30" height="30" fill="var(--svg-f59e0b)" stroke="currentColor" stroke-width="0.5" opacity="0.4"/><text x="-15" y="-3" text-anchor="middle" font-size="7" fill="currentColor">3</text><!-- F(5)=5 square (below) --><rect x="-30" y="10" width="50" height="50" fill="var(--svg-22c55e)" stroke="currentColor" stroke-width="0.5" opacity="0.4"/><text x="-5" y="38" text-anchor="middle" font-size="9" fill="currentColor">5</text><!-- F(6)=8 square (to the right) --><rect x="20" y="-20" width="80" height="80" fill="var(--svg-ef4444)" stroke="currentColor" stroke-width="0.5" opacity="0.4"/><text x="60" y="25" text-anchor="middle" font-size="10" fill="currentColor">8</text><!-- Spiral arc --><path d="M 10 10 Q 15 10 15 5 Q 15 0 10 0 Q 5 0 5 -5 Q 5 -10 10 -10 Q 20 -10 20 -20 Q 20 -30 10 -30 Q -5 -30 -5 -20 Q -5 -5 -20 -5 Q -30 -5 -30 10 Q -30 30 -10 30 Q 15 30 20 10 Q 25 -5 30 0 Q 40 10 40 20 Q 40 35 30 40 Q 10 50 0 30" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 2"/></g><text x="300" y="250" text-anchor="middle" font-size="11" fill="currentColor">Fibonacci spiral constructed from adjacent squares</text><text x="300" y="270" text-anchor="middle" font-size="11" fill="var(--svg-6b7280)">F(1)=1, F(2)=1, F(3)=2, F(4)=3, F(5)=5, F(6)=8</text><text x="300" y="290" text-anchor="middle" font-size="11" fill="var(--svg-6b7280)">Each new square has side length = sum of previous two squares\' sides</text><text x="300" y="312" text-anchor="middle" font-size="10" fill="var(--svg-9ca3af)">This construction also approximates the golden spiral, a logarithmic spiral found in nautilus shells and galaxies</text></svg>',
      alt: 'Visualization of the Fibonacci spiral constructed from adjacent squares whose side lengths are consecutive Fibonacci numbers (1, 1, 2, 3, 5, 8), with a spiral curve passing through the squares.',
      caption: 'The Fibonacci spiral is constructed by placing squares with Fibonacci side lengths adjacent to each other and drawing a quarter-circle through each square.',
    },
    citations: [
      { source: 'Wikipedia — Fibonacci Number', url: 'https://en.wikipedia.org/wiki/Fibonacci_number' },
      { source: 'Wolfram MathWorld — Fibonacci Number', url: 'https://mathworld.wolfram.com/FibonacciNumber.html' },
    ],
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(FibonacciPanel, { values, results });
  },
};

export default fibonacciConfig;
