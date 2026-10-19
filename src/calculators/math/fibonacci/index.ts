import { createElement } from 'react';
import Decimal from 'decimal.js';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { hasAnswer, resultValue } from '../../../utils/explainResults';
import FibonacciPanel from './FibonacciPanel';
import { fibonacciSequenceBig } from '../../../utils/bigMath';
import { parseIntegerStrict } from '../../../utils/rational';

export const MAX_FIBONACCI_N = 100;

// 60 significant digits: phi^n / sqrt(5) for n <= 100 has 21 digits, so rounding it to an integer is exact.
const BinetDecimal = Decimal.clone({ precision: 60 });

/**
 * Binet's formula F(n) = round(phi^n / sqrt(5)), evaluated in high precision (a 64-bit double is already off at n = 71:
 * it returns F(100) as 354,224,848,179,263,100,000 instead of 354,224,848,179,261,915,075).
 */
function binetApproximation(n: number): string {
  const sqrt5 = BinetDecimal.sqrt(5);
  const phi = sqrt5.plus(1).div(2);
  return phi.pow(n).div(sqrt5).toDecimalPlaces(0).toFixed(0);
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
      max: MAX_FIBONACCI_N,
      step: 1,
      inputMode: 'numeric',
      required: true,
      helpText: 'Enter the position in the Fibonacci sequence to calculate (F(1) = F(2) = 1)',
    },
  ],
  calculate: (values): CalculatorResult[] => {
    const big = parseIntegerStrict(values.n, 6);
    if (big === null || big < 1n || big > BigInt(MAX_FIBONACCI_N)) return [];
    const n = Number(big);

    const seq = fibonacciSequenceBig(n); // exact BigInt: F(79) and beyond exceed 2^53
    const nth = seq[n - 1];
    const seqSum = seq.reduce((acc, v) => acc + v, 0n); // = F(n+2) - 1

    return [
      { id: 'nthTerm', label: `F(${n})`, value: nth.toString(), highlight: true, color: 'positive' },
      { id: 'sequence', label: `First ${n} Terms`, value: seq.join(', ') },
      { id: 'sum', label: `Sum of First ${n} Terms`, value: seqSum.toString() },
      { id: 'binetApproximation', label: `Binet's Formula Approximation`, value: binetApproximation(n) },
    ];
  },
  explainSteps: (values) => {
    const rows = fibonacciConfig.calculate(values);
    if (!hasAnswer(rows)) return [];
    const seq = resultValue(rows, 'sequence')!.split(', ');
    const n = seq.length;
    const nth = resultValue(rows, 'nthTerm')!;
    const sum = resultValue(rows, 'sum')!;
    const steps = [
      {
        label: 'Start with F(1) = 1 and F(2) = 1, then keep adding the last two terms',
        expr: seq.slice(0, 10).join(', ') + (n > 10 ? ', …' : ''),
      },
      n >= 3
        ? { label: `Each term is the sum of the two before it, so F(${n}) = F(${n - 1}) + F(${n - 2})`, expr: `F(${n}) = ${seq[n - 2]} + ${seq[n - 3]} = ${nth}` }
        : { label: `The first two terms are both 1`, expr: `F(${n}) = ${nth}` },
      {
        label: "Cross-check with Binet's formula",
        expr: `F(${n}) = round(φ^${n} ÷ √5) = ${resultValue(rows, 'binetApproximation')}`,
        note: 'φ = (1 + √5) ÷ 2 ≈ 1.618. It is evaluated in high precision, so even F(100) comes out exact.',
      },
      {
        label: `The first ${n} terms always add up to F(${n + 2}) − 1`,
        expr: `${sum} = ${BigInt(sum) + 1n} − 1`,
      },
    ];
    return steps;
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
      'Compare the iterative result with Binet\'s formula: it is evaluated in 60-digit precision here, so rounding phi^n / sqrt(5) reproduces F(n) exactly for every n up to 100.',
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
      'Art and design: The golden ratio derived from Fibonacci numbers is used in composition, architecture, and visual design for aesthetic proportions.',
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
        answer: 'This calculator supports n from 1 to 100 and computes every term exactly with arbitrary-precision integers, so no digit is rounded. F(78) = 8,944,394,323,791,464 is the last Fibonacci number below 2^53 (about 9.007 x 10^15), the largest range in which ordinary floating-point numbers are exact; F(79) = 14,472,334,024,676,221 is the first above it. Code that uses doubles therefore goes wrong from n = 79 (it prints F(100) as 354,224,848,179,262,000,000), whereas the exact value is F(100) = 354,224,848,179,261,915,075, about 3.5 x 10^20.',
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
