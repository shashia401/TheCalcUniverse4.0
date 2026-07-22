import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import SeriesPanel from './SeriesPanel';
import { safeEval } from '../shared/safeEval';

const seriesConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'start',
      label: 'Start (n)',
      type: 'number',
      placeholder: 'n start',
      required: true,
      step: 1,
      inputMode: 'numeric',
      helpText: 'The starting value of the summation index n',
    },
    {
      id: 'end',
      label: 'End (n)',
      type: 'number',
      placeholder: 'n end',
      required: true,
      step: 1,
      inputMode: 'numeric',
      helpText: 'The ending value of the summation index n',
    },
    {
      id: 'expression',
      label: 'Expression in terms of n',
      type: 'text',
      placeholder: 'e.g. 1/n, 1/2^n, n',
      required: true,
      helpText: 'Write the formula using n as the variable. Use ^ for exponents. Supports pi for π.',
    },
  ],
  calculate: (values) => {
    const start = parseInt(values.start, 10);
    const end = parseInt(values.end, 10);
    const expression = (values.expression || '').trim();

    if (isNaN(start) || isNaN(end) || !expression) return [];
    if (start > end) return [];

    const fmt = (n: number) => {
      if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
      return parseFloat(n.toFixed(10)).toString();
    };

    const terms: number[] = [];
    let sum = 0;

    const maxIter = 1000;
    const actualEnd = Math.min(end, start + maxIter - 1);
    for (let n = start; n <= actualEnd; n++) {
      try {
        const result = safeEval(expression, { n });
        if (!isFinite(result)) continue;
        terms.push(result);
        sum += result;
      } catch {
        return [];
      }
    }

    if (terms.length === 0) return [];

    const first20Terms = terms.slice(0, 20);

    return [
      {
        id: 'sum',
        label: 'Sum of Series',
        value: fmt(sum),
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'terms',
        label: 'First 20 Terms',
        value: first20Terms.map((t) => fmt(t)).join(', '),
        color: 'neutral' as const,
      },
      {
        id: 'termCount',
        label: 'Number of Terms',
        value: terms.length.toString(),
        color: 'neutral' as const,
      },
      {
        id: 'lastTerm',
        label: 'Last Term Value',
        value: fmt(terms[terms.length - 1]),
        color: 'neutral' as const,
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(SeriesPanel, { values, results });
  },
  educational: {
    formula: 'S = Σ_{n=start}^{end} f(n)',
    diagram: {
      svg: '<svg viewBox="0 0 480 320" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="240" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Series Summation</text><text x="240" y="70" text-anchor="middle" font-size="28" fill="var(--svg-3b82f6)" font-family="serif">S = <tspan font-size="22" baseline-shift="super">n&lt;/tspan><tspan font-size="22" baseline-shift="sub">=a</tspan>&#x2211;<tspan font-size="22" baseline-shift="super">b</tspan> f(n)</text><rect x="120" y="90" width="240" height="1" fill="var(--svg-3b82f6)" opacity="0.4"/><text x="240" y="120" text-anchor="middle" font-size="12" fill="var(--svg-666666)">(Capital Sigma = &quot;sum&quot; in Greek)</text><line x1="180" y1="150" x2="300" y2="150" stroke="var(--svg-22c55e)" stroke-width="2" stroke-linecap="round"/><circle cx="180" cy="150" r="4" fill="var(--svg-22c55e)"/><text x="170" y="142" text-anchor="end" font-size="12" font-weight="bold" fill="var(--svg-22c55e)">f(a)</text><circle cx="230" cy="150" r="4" fill="var(--svg-22c55e)"/><text x="230" y="140" text-anchor="middle" font-size="11" fill="var(--svg-22c55e)">f(a+1)</text><circle cx="280" cy="150" r="4" fill="var(--svg-22c55e)"/><text x="280" y="140" text-anchor="middle" font-size="11" fill="var(--svg-22c55e)">...</text><circle cx="300" cy="150" r="4" fill="var(--svg-22c55e)"/><text x="310" y="142" text-anchor="start" font-size="12" font-weight="bold" fill="var(--svg-22c55e)">f(b)</text><text x="240" y="190" text-anchor="middle" font-size="13" fill="var(--svg-666666)">Each term f(n) is evaluated and added to the total sum</text><rect x="140" y="212" width="200" height="50" rx="8" fill="var(--svg-f0f9ff)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="240" y="236" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-3b82f6)">S = f(a) + f(a+1) + ... + f(b)</text><text x="240" y="253" text-anchor="middle" font-size="11" fill="var(--svg-64748b)">Sum = total of all terms from n=start to n=end</text><text x="240" y="290" text-anchor="middle" font-size="11" fill="var(--svg-94a3b8)">Arithmetic, geometric, harmonic, and custom series supported</text></svg>',
      alt: 'Diagram showing a series summation: S = Σ f(n) from n=a to b, with individual terms f(a), f(a+1), ..., f(b) summed together',
      caption: 'A series sums the terms of a sequence from a starting index to an ending index',
    },
    formulaDescription:
      'The series calculator computes the sum of a mathematical sequence from a start index to an end index. For each integer value of n from start to end, the expression f(n) is evaluated and all results are added together. This is denoted by the capital Greek letter Sigma (Σ), which represents summation. The lower bound (n = start) and upper bound (end) define the range of summation.',
    variables: [
      { symbol: 'n', name: 'Summation Index', description: 'The integer variable that takes each value from start to end during summation.' },
      { symbol: 'start', name: 'Lower Bound', description: 'The first integer value of n at which the expression is evaluated.' },
      { symbol: 'end', name: 'Upper Bound', description: 'The last integer value of n at which the expression is evaluated.' },
      { symbol: 'f(n)', name: 'Expression', description: 'The mathematical formula evaluated at each n, defining the sequence terms.' },
      { symbol: 'S', name: 'Sum', description: 'The total sum of all terms from n = start to n = end.' },
    ],
    howToUse: [
      'Enter the starting value (n start) and ending value (n end) for the summation index.',
      'Write the expression using n as the variable. Use ^ for exponents (e.g., 2^n, n^2).',
      'Use pi for the mathematical constant π. The calculator supports basic arithmetic operators and parentheses.',
      'View the total sum, the first 20 terms in the series, the number of terms, and the last term value.',
      'The expression is safely evaluated for each integer n in the range. Invalid or non-finite terms are skipped.',
    ],
    quickReference: [
      { label: 'Sum of constants', value: 'Σ c = c × (b − a + 1)' },
      { label: 'Sum of n', value: 'Σ n = b(b+1)/2 − (a−1)a/2' },
      { label: 'Geometric series', value: 'Σ r^n = (r^(b+1) − r^a)/(r − 1)' },
      { label: 'Harmonic terms', value: 'Σ 1/n diverges as n → ∞' },
    ],
    commonUses: [
      'Computing the total accumulated value of a sequence, such as the sum of the first N integers or squares.',
      'Evaluating finite approximations of infinite series to estimate the value of convergent series.',
      'Calculating partial sums of arithmetic and geometric progressions in financial mathematics.',
      'Analyzing the behavior of series by examining how partial sums grow as more terms are added.',
      'Computing discrete approximations of integrals using Riemann sums where f(n) represents sampled values.',
    ],
    explanation:
      'A series is the sum of the terms of a sequence. The notation Σ_{n=a}^{b} f(n) means "evaluate the expression f(n) for each integer n starting at a, ending at b, and add all the results together." Series are fundamental in mathematics and appear throughout calculus, number theory, and applied mathematics. Finite series have a definite number of terms and always yield a finite sum. Common examples include arithmetic series (where consecutive terms differ by a constant), geometric series (where consecutive terms have a constant ratio), and harmonic series (terms of the form 1/n). The series calculator can handle any expression using standard arithmetic operations, exponents, and the constant π. By varying the expression and bounds, you can explore a wide range of mathematical series — from simple sums of consecutive integers to more complex sequences involving powers and reciprocals.',
    faqs: [
      {
        question: 'What types of expressions does the series calculator support?',
        answer: 'The calculator supports basic arithmetic operations (+, -, *, /), exponents (^), parentheses for grouping, the constant pi (π), and the variable n. Examples: 1/n, 1/2^n, n^2, 1/(n*(n+1)), n/(n+1). The expression is safely evaluated using JavaScript\'s Math functions, so large values may have floating-point precision limitations.',
      },
      {
        question: 'What happens if the start value is larger than the end value?',
        answer: 'If the start value exceeds the end value, the calculator returns an empty result. The summation requires a valid range where start ≤ end. If you need a descending sum, reverse the start and end values and negate the expression if necessary.',
      },
      {
        question: 'Does the calculator support infinite series?',
        answer: 'No, this calculator computes finite sums from a specified start to a specified end value. To approximate an infinite series, you can choose a large end value where additional terms become negligible. The calculator shows the number of terms summed, helping you gauge how close you might be to the infinite limit.',
      },
      {
        question: 'What is the difference between a sequence and a series?',
        answer: 'A sequence is an ordered list of numbers: a₁, a₂, a₃, ... A series is the sum of those numbers: a₁ + a₂ + a₃ + ... = Σ a_n. In this calculator, the sequence is defined by f(n) evaluated at each integer, and the series is the cumulative sum of those sequence values.',
      },
      {
        question: 'Why are only the first 20 terms shown in the result?',
        answer: 'For readability and performance, the calculator displays the first 20 terms of the series as a comma-separated list. All terms are still included in the total sum calculation. The "Number of Terms" result tells you exactly how many terms were summed, and the "Last Term Value" shows the final term in the range.',
      },
    ],
    workedExamples: [
      {
        scenario: 'A student calculates the sum of the first 10 natural numbers to verify the well-known formula n(n+1)/2. They use the expression "n" from n=1 to n=10.',
        inputs: { start: '1', end: '10', expression: 'n' },
        result: 'Sum = 55. First 20 terms: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10. Number of terms: 10. Last term: 10. Matches the arithmetic series formula n(a1 + an)/2 = 10(1+10)/2 = 55.',
        insight: 'The series computes 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 = 55. This matches the arithmetic series formula: sum = n(a1 + an)/2 = 10(1 + 10)/2 = 55. The sum of the first n natural numbers is a classic result that appears in combinatorics, statistics (sum of ranks), and algorithm analysis of simple nested loops.',
      },
      {
        scenario: 'A physics student computes the partial sum of the harmonic series 1/n from n=1 to n=100 to understand how slowly this series diverges, comparing it to the natural log approximation H_n ≈ ln(n) + γ.',
        inputs: { start: '1', end: '100', expression: '1/n' },
        result: 'Sum ≈ 5.1873775176 (harmonic number H_100). First 20 terms: 1, 0.5, 0.3333333333, 0.25, 0.2, 0.1666666667, 0.1428571429, 0.125, 0.1111111111, 0.1, ... Number of terms: 100. Last term ≈ 0.01. ln(100) + γ ≈ 5.182, a difference of only ~0.005.',
        insight: 'The sum of 1/n from 1 to 100 is approximately 5.187. For comparison, ln(100) + γ ≈ 4.605 + 0.577 = 5.182, a difference of only 0.005 — demonstrating the accuracy of the Euler-Mascheroni approximation even for moderate n. The harmonic series diverges, but extremely slowly: to exceed a sum of 10, you need over 12,000 terms.',
      },
    ],
    proTips: [
      'Use integer start and end values for clean results. While decimal bounds technically work in the summation loop, series notation conventionally uses integer indices.',
      'When the expression produces very large terms, watch for JavaScript floating-point overflow. The calculator handles values up to about 10^308, and terms beyond this become Infinity and are skipped.',
      'To simulate an arithmetic series with common difference d, use the expression "start + (n - start) * d" or more simply calculate manually using the closed-form formula.',
      'For alternating series, use expressions like "(-1)^n / n" for the alternating harmonic series, or "(-1)^n / (2n+1)" for the Leibniz series approximating pi/4.',
      'The calculator is capped at 1000 terms for performance. If your range exceeds this, only the first 1000 terms are summed — the actual end value used is shown in the results.',
      'To explore convergence behavior, try a series known to converge (like 1/2^n) with increasing end values and observe how the sum approaches its limit — the "Last Term Value" shows when terms become negligible.',
    ],
    limitations: [
      'Limited to 1000 terms maximum (start + 999) to ensure responsive performance. If your range exceeds this, only the first 1000 terms are summed and the actual end value used is reflected in the results.',
      'Very large numbers exceeding approximately 10^308 cause floating-point overflow and are skipped from the sum, potentially undercounting the total. If your terms involve rapid exponential growth, verify that all terms remained finite.',
      'Expressions containing discontinuities within the summation range (like 1/(n-5) when n=5) produce non-finite terms that are silently skipped, which may affect the total sum if you do not notice.',
      'Finite-precision floating-point arithmetic (IEEE 754 double) means sums of many small terms or terms with very different magnitudes may lose precision due to rounding accumulation. For high-precision summation needs, use a dedicated CAS.',
      'This calculator computes finite sums only and cannot evaluate infinite series limits or determine convergence/divergence. Use the Taylor Series calculator for series expansions and convergence analysis.',
    ],
    citations: [
      { source: 'Wikipedia - Series (mathematics)', url: 'https://en.wikipedia.org/wiki/Series_(mathematics)' },
      { source: 'Khan Academy - Series', url: 'https://www.khanacademy.org/math/ap-calculus-bc/bc-series-new' },
    ],
  },
};

export default seriesConfig;
