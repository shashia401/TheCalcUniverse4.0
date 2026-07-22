import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import FactorialPanel from './FactorialPanel';

/**
 * Compute n! using regular multiplication.
 * Returns 0 for out-of-range inputs.
 */
function computeFactorial(n: number): number {
  if (n === 0) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * Build the step-by-step multiplication string: n × (n-1) × ... × 1 = result.
 */
function buildSteps(n: number): string {
  if (n === 0) return '0! = 1 (by definition)';
  const terms: string[] = [];
  for (let i = n; i >= 1; i--) {
    terms.push(i.toString());
  }
  return terms.join(' × ') + ' = ' + computeFactorial(n).toLocaleString(undefined);
}

/**
 * Count the number of digits in n! using logarithms.
 * digits = floor(log10(n!)) + 1
 */
function countDigits(n: number): number {
  if (n === 0 || n === 1) return 1;
  let logSum = 0;
  for (let i = 2; i <= n; i++) {
    logSum += Math.log10(i);
  }
  return Math.floor(logSum) + 1;
}

/**
 * Count trailing zeros in n!.
 * Trailing zeros come from factors of 10 = 2 × 5.
 * Since there are always more factors of 2 than 5, count factors of 5:
 * floor(n/5) + floor(n/25) + floor(n/125) + ...
 */
function countTrailingZeros(n: number): number {
  let count = 0;
  let power = 5;
  while (power <= n) {
    count += Math.floor(n / power);
    power *= 5;
  }
  return count;
}

const factorialConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'n',
      label: 'Number (n)',
      type: 'number',
      placeholder: 'Enter n',
      defaultValue: '5',
      min: 0,
      max: 170,
      required: true,
      helpText: 'Enter a non-negative integer to calculate its factorial (0-170)',
    },
  ],
  calculate: (values) => {
    const n = parseInt(values.n, 10);
    if (isNaN(n) || n < 0 || n > 170 || !Number.isFinite(n)) return [];

    const fact = computeFactorial(n);
    const steps = buildSteps(n);
    const digits = countDigits(n);
    const zeros = countTrailingZeros(n);

    return [
      {
        id: 'factorial',
        label: `Factorial (${n}!)`,
        value: fact.toLocaleString(undefined),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'steps',
        label: 'Step-by-Step Calculation',
        value: steps,
      },
      {
        id: 'digitCount',
        label: 'Number of Digits',
        value: digits.toString(),
      },
      {
        id: 'trailingZeros',
        label: 'Trailing Zeros',
        value: zeros.toString(),
      },
    ];
  },
  educational: {
    formula: 'n! = n x (n-1) x (n-2) x ... x 1',
    formulaDescription:
      'The factorial of a non-negative integer n, denoted n!, is the product of all positive integers less than or equal to n. By definition, 0! = 1. Factorials grow extremely fast — 10! = 3,628,800 and 20! is already over 2.4 quintillion. The factorial function is defined recursively as n! = n x (n-1)! with the base case 0! = 1. For n = 0, the empty product is defined as 1, which is consistent with combinatorial formulas and infinite series.',
    variables: [
      {
        symbol: 'n!',
        name: 'Factorial of n',
        description: 'The product of all positive integers from 1 to n. Pronounced "n factorial." For n = 0, the result is defined as 1.',
      },
      {
        symbol: 'n',
        name: 'Input Number',
        description: 'A non-negative integer whose factorial is being computed. Must be between 0 and 170 for JavaScript to maintain precision.',
      },
      {
        symbol: 'd',
        name: 'Digit Count',
        description: 'The number of decimal digits in n!. For large n, this can be computed approximately using Kamenetsky\'s formula: d = floor(n * log10(n/e) + log10(2*pi*n)/2) + 1.',
      },
      {
        symbol: 'z',
        name: 'Trailing Zeros',
        description: 'The number of zeros at the end of n! in decimal representation. Determined by counting factors of 5 in the prime factorization of n!.',
      },
    ],
    howToUse: [
      'Enter a non-negative integer n (from 0 to 170) in the input field.',
      'View the factorial result displayed with comma separators for readability.',
      'Read the step-by-step multiplication showing how each term contributes to the final product.',
      'Check the digit count to understand how large the factorial result is.',
      'See the trailing zeros count, which reveals how many times 10 divides the factorial.',
    ],
    quickReference: [
      { label: '0!', value: '1 (by definition)' },
      { label: '1!', value: '1' },
      { label: '5!', value: '120' },
      { label: '10!', value: '3,628,800' },
    ],
    commonUses: [
      'Permutations and combinations: n! is the number of ways to arrange n distinct objects, and appears in nPr and nCr formulas.',
      'Probability and statistics: factorial appears in binomial coefficients, Poisson distributions, and Bayesian inference.',
      'Calculus: factorials appear in Taylor series expansions for e^x, sin(x), cos(x), and many other functions.',
      'Number theory: factorials are used in Wilson\'s theorem for primality testing and studying prime distributions.',
      'Computer science: factorial growth models the worst-case complexity of certain algorithms and appears in asymptotic analysis.',
    ],
    explanation:
      'The factorial function is one of the most important functions in mathematics, appearing throughout combinatorics, algebra, analysis, and number theory. For a non-negative integer n, the factorial n! is defined as the product of all positive integers from 1 to n: n! = n x (n-1) x (n-2) x ... x 2 x 1. The special case 0! = 1 is defined for consistency — it makes combinatorial formulas work (there is exactly one way to arrange zero objects, and the binomial coefficient (0 choose 0) = 1). Factorials grow at an astonishing rate. While 5! = 120 is modest, 10! = 3,628,800, 15! = 1,307,674,368,000, and 20! = 2,432,902,008,176,640,000. By 170!, the value exceeds 10^306, which is the limit of JavaScript\'s 64-bit floating-point precision (Number.MAX_VALUE is about 1.79 x 10^308). Beyond 170, the factorial overflows to Infinity. The number of trailing zeros in n! can be found without computing the full factorial: count how many factors of 5 appear in the numbers 1 through n (since factors of 2 are always more abundant). This is computed as floor(n/5) + floor(n/25) + floor(n/125) + ... For example, 25! has 6 trailing zeros: floor(25/5) = 5 from multiples of 5, plus floor(25/25) = 1 from the extra factor of 5 in 25 itself. The digit count of n! can be approximated using Stirling\'s approximation: n! ~ sqrt(2*pi*n) x (n/e)^n, which gives ln(n!) ~ n*ln(n) - n + 0.5*ln(2*pi*n). Taking log10 gives the number of decimal digits.',
    faqs: [
      {
        question: 'Why is 0! defined as 1?',
        answer: '0! = 1 by definition, and there are several good reasons for this. Mathematically, n! = n x (n-1)!, so for n = 1, we have 1! = 1 x 0!, which gives 1 = 1 x 0!, so 0! must equal 1. Combinatorially, there is exactly one way to arrange zero objects (the empty arrangement). The binomial coefficient formula n choose k = n! / (k! x (n-k)!) also works when k = 0 or k = n only if 0! = 1.',
      },
      {
        question: 'What is the largest factorial my calculator can compute?',
        answer: 'This calculator can compute factorials up to 170! using JavaScript\'s 64-bit floating-point numbers. 170! is approximately 7.26 x 10^306, just below the maximum representable value of about 1.79 x 10^308. For n > 170, the result overflows to Infinity and cannot be displayed accurately. For exact arithmetic on larger numbers, you would need arbitrary-precision libraries or specialized software.',
      },
      {
        question: 'How do you calculate trailing zeros without computing the whole factorial?',
        answer: 'Trailing zeros come from factors of 10, which are produced by pairs of factors 2 and 5. Since factors of 2 are much more common than factors of 5, the number of trailing zeros equals the total number of factors of 5 in the numbers from 1 to n. This is computed as floor(n/5) + floor(n/25) + floor(n/125) + ... because each multiple of 5 contributes one factor of 5, each multiple of 25 contributes an additional factor, and so on. For 100!, this gives floor(100/5) + floor(100/25) + floor(100/125) = 20 + 4 + 0 = 24 trailing zeros.',
      },
      {
        question: 'What is Stirling\'s approximation?',
        answer: 'Stirling\'s approximation is a formula for estimating factorials: n! ~ sqrt(2*pi*n) x (n/e)^n. It becomes more accurate as n increases. The relative error is about 1/(12n). For n = 10, the approximation gives about 3,598,695 compared to the exact 3,628,800 (about 0.8% error). For n = 100, the error drops to about 0.08%. Stirling\'s approximation is widely used in statistical mechanics, probability theory, and asymptotic analysis.',
      },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="600" height="300" fill="transparent"/><text x="300" y="25" text-anchor="middle" font-size="16" font-weight="bold" fill="currentColor">Factorial Growth: n! for n = 0 through 10</text><text x="300" y="45" text-anchor="middle" font-size="11" fill="var(--svg-6b7280)">Bars show the rapid growth of factorial values on a logarithmic scale</text><!-- Y-axis --><line x1="60" y1="60" x2="60" y2="260" stroke="currentColor" stroke-width="2"/><!-- X-axis --><line x1="60" y1="260" x2="560" y2="260" stroke="currentColor" stroke-width="2"/><!-- Bars --><rect x="75" y="255" width="18" height="5" fill="var(--svg-22c55e)" rx="1"/><text x="84" y="275" text-anchor="middle" font-size="9" fill="currentColor">0</text><rect x="105" y="255" width="18" height="5" fill="var(--svg-22c55e)" rx="1"/><text x="114" y="275" text-anchor="middle" font-size="9" fill="currentColor">1</text><rect x="140" y="250" width="18" height="10" fill="var(--svg-3b82f6)" rx="1"/><text x="149" y="275" text-anchor="middle" font-size="9" fill="currentColor">2</text><rect x="175" y="235" width="18" height="25" fill="var(--svg-3b82f6)" rx="1"/><text x="184" y="275" text-anchor="middle" font-size="9" fill="currentColor">3</text><rect x="210" y="218" width="18" height="42" fill="var(--svg-8b5cf6)" rx="1"/><text x="219" y="275" text-anchor="middle" font-size="9" fill="currentColor">4</text><rect x="245" y="190" width="18" height="70" fill="var(--svg-8b5cf6)" rx="1"/><text x="254" y="275" text-anchor="middle" font-size="9" fill="currentColor">5</text><rect x="280" y="145" width="18" height="115" fill="var(--svg-f59e0b)" rx="1"/><text x="289" y="275" text-anchor="middle" font-size="9" fill="currentColor">6</text><rect x="315" y="100" width="18" height="160" fill="var(--svg-f59e0b)" rx="1"/><text x="324" y="275" text-anchor="middle" font-size="9" fill="currentColor">7</text><rect x="350" y="40" width="18" height="220" fill="var(--svg-ef4444)" rx="1"/><text x="359" y="275" text-anchor="middle" font-size="9" fill="currentColor">8</text><rect x="385" y="0" width="18" height="260" fill="var(--svg-ef4444)" rx="1"/><text x="394" y="275" text-anchor="middle" font-size="9" fill="currentColor">9</text><rect x="420" y="0" width="18" height="260" fill="var(--svg-ef4444)" rx="1"/><text x="429" y="275" text-anchor="middle" font-size="9" fill="currentColor">10</text><!-- Y-axis labels --><text x="52" y="265" text-anchor="end" font-size="9" fill="currentColor">0</text><text x="52" y="215" text-anchor="end" font-size="9" fill="currentColor">~10^2</text><text x="52" y="165" text-anchor="end" font-size="9" fill="currentColor">~10^3</text><text x="52" y="115" text-anchor="end" font-size="9" fill="currentColor">~10^4</text><text x="52" y="65" text-anchor="end" font-size="9" fill="currentColor">~10^5</text><!-- Values at bar tops --><text x="84" y="252" text-anchor="middle" font-size="8" fill="currentColor">1</text><text x="114" y="252" text-anchor="middle" font-size="8" fill="currentColor">1</text><text x="149" y="247" text-anchor="middle" font-size="8" fill="currentColor">2</text><text x="184" y="232" text-anchor="middle" font-size="8" fill="currentColor">6</text><text x="219" y="215" text-anchor="middle" font-size="8" fill="currentColor">24</text><text x="254" y="187" text-anchor="middle" font-size="8" fill="currentColor">120</text><text x="289" y="142" text-anchor="middle" font-size="8" fill="currentColor">720</text><text x="324" y="97" text-anchor="middle" font-size="8" fill="currentColor">5,040</text><text x="359" y="37" text-anchor="middle" font-size="8" fill="currentColor">40,320</text><text x="394" y="-3" text-anchor="middle" font-size="8" fill="currentColor">362,880</text><text x="429" y="-3" text-anchor="middle" font-size="8" fill="currentColor">3.6M</text><text x="300" y="295" text-anchor="middle" font-size="10" fill="var(--svg-6b7280)">Values: 0! = 1, 1! = 1, 2! = 2, 3! = 6, 4! = 24, 5! = 120, 6! = 720, 7! = 5,040, 8! = 40,320, 9! = 362,880, 10! = 3,628,800</text></svg>',
      alt: 'Bar chart showing factorial growth from 0! to 10! with values annotated above each bar, demonstrating the super-exponential growth of the factorial function.',
      caption: 'Factorial values from 0! to 10!. Note how quickly the values grow: 0! and 1! are 1, but 10! is already 3,628,800.',
    },
    citations: [
      { source: 'Wikipedia — Factorial', url: 'https://en.wikipedia.org/wiki/Factorial' },
      { source: 'Wolfram MathWorld — Factorial', url: 'https://mathworld.wolfram.com/Factorial.html' },
    ],
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(FactorialPanel, { values, results });
  },
};

export default factorialConfig;
