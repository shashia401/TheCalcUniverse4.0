import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import { safeEval } from '../shared/safeEval';
import IntegralPanel from './IntegralPanel';

// ─── Safe expression evaluator ───────────────────────────────────────────────

function evaluateIntegrand(expr: string, xVal: number): number {
  try {
    return safeEval(expr, { x: xVal });
  } catch {
    return NaN;
  }
}

// ─── Simpson's 1/3 rule ─────────────────────────────────────────────────────

function simpsonRule(
  expr: string,
  a: number,
  b: number,
  n: number,
): { result: number; workSteps: string[] } {
  const workSteps: string[] = [];
  const h = (b - a) / n;

  workSteps.push(`Step size: h = (b − a) / n = (${b.toFixed(4)} − ${a.toFixed(4)}) / ${n} = ${h.toFixed(6)}`);

  const fA = evaluateIntegrand(expr, a);
  const fB = evaluateIntegrand(expr, b);
  if (isNaN(fA) || isNaN(fB)) return { result: NaN, workSteps: [] };

  let sumEven = 0;
  let sumOdd = 0;

  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    const fx = evaluateIntegrand(expr, x);
    if (isNaN(fx) || !isFinite(fx)) {
      return { result: NaN, workSteps: [] };
    }
    if (i % 2 === 0) {
      sumEven += fx;
    } else {
      sumOdd += fx;
    }
  }

  const result = (h / 3) * (fA + fB + 4 * sumOdd + 2 * sumEven);

  workSteps.push(`f(a) = f(${a.toFixed(4)}) = ${fA.toFixed(6)}`);
  workSteps.push(`f(b) = f(${b.toFixed(4)}) = ${fB.toFixed(6)}`);
  workSteps.push(`Sum of odd-indexed f(x) (coefficient 4): ${sumOdd.toFixed(6)}`);
  workSteps.push(`Sum of even-indexed f(x) (coefficient 2): ${sumEven.toFixed(6)}`);
  workSteps.push(
    `S = (${h.toFixed(6)} / 3) × [${fA.toFixed(6)} + ${fB.toFixed(6)} + 4×${sumOdd.toFixed(6)} + 2×${sumEven.toFixed(6)}]`,
  );
  workSteps.push(`S = ${result.toFixed(6)}`);

  return { result, workSteps };
}

// ─── Trapezoidal rule (for comparison) ──────────────────────────────────────

function trapezoidalRule(expr: string, a: number, b: number, n: number): number {
  const h = (b - a) / n;
  const fA = evaluateIntegrand(expr, a);
  const fB = evaluateIntegrand(expr, b);
  if (isNaN(fA) || isNaN(fB)) return NaN;

  let sum = (fA + fB) / 2;
  for (let i = 1; i < n; i++) {
    const fx = evaluateIntegrand(expr, a + i * h);
    if (isNaN(fx) || !isFinite(fx)) return NaN;
    sum += fx;
  }
  return h * sum;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (!isFinite(n)) return n > 0 ? '∞' : '-∞';
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
  return parseFloat(n.toPrecision(10)).toString();
}

// ─── Config ──────────────────────────────────────────────────────────────────

const integralConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'expression',
      label: 'Function f(x)',
      type: 'text',
      placeholder: 'e.g. x^2 or 3x+2',
      required: true,
      helpText: 'Enter an expression in terms of x. Use ^ for powers, * for multiplication, / for division. Example: x^2 - 4*x + 3',
    },
    {
      id: 'lowerBound',
      label: 'Lower bound (a)',
      type: 'number',
      placeholder: 'Lower bound a',
      step: 0.1,
      required: true,
      helpText: 'The starting limit of the definite integral.',
    },
    {
      id: 'upperBound',
      label: 'Upper bound (b)',
      type: 'number',
      placeholder: 'Upper bound b',
      step: 0.1,
      required: true,
      helpText: 'The ending limit of the definite integral.',
    },
    {
      id: 'n',
      label: 'Subdivisions (n)',
      type: 'number',
      placeholder: '100',
      step: 2,
      min: 2,
      helpText: 'Number of subintervals. Higher values give more accurate results. Must be even for Simpson\'s rule (odd values are auto-incremented).',
    },
  ],

  calculate: (values) => {
    const expr = (values.expression || '').trim();
    const a = parseFloat(values.lowerBound);
    const b = parseFloat(values.upperBound);
    const rawN = parseInt(values.n, 10);
    const n = !isNaN(rawN) && rawN >= 2 ? rawN : 100;

    // Validate required inputs
    if (!expr || isNaN(a) || isNaN(b) || a === b) return [];

    // Validate expression at a sample point
    const midpoint = (a + b) / 2;
    if (isNaN(evaluateIntegrand(expr, midpoint)) || !isFinite(evaluateIntegrand(expr, midpoint))) return [];

    // Ensure n is even for Simpson's rule
    const actualN = n % 2 === 0 ? n : n + 1;
    const sign = a < b ? 1 : -1;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);

    const simpson = simpsonRule(expr, lo, hi, actualN);
    if (isNaN(simpson.result)) return [];

    const trap = trapezoidalRule(expr, lo, hi, actualN);

    const signedSimpson = simpson.result * sign;
    const signedTrap = trap * sign;

    return [
      {
        id: 'result',
        label: `∫ ${expr} dx`,
        value: fmt(signedSimpson),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'method',
        label: 'Method',
        value: "Simpson's 1/3 Rule",
        color: 'neutral',
      },
      {
        id: 'subdivisions',
        label: 'Subdivisions',
        value: actualN.toString(),
        color: 'neutral',
      },
      {
        id: 'trapResult',
        label: 'Trapezoidal Result',
        value: fmt(signedTrap),
        color: 'neutral',
      },
      {
        id: 'discrepancy',
        label: 'Method Discrepancy',
        value: `~${fmt(Math.abs(signedSimpson - signedTrap))}`,
        color: 'neutral',
      },
      {
        id: 'work',
        label: 'Step-by-Step Work',
        value: simpson.workSteps.join(' | '),
        color: 'neutral',
      },
    ];
  },

  educational: {
    formula: '∫ₐᵇ f(x)dx ≈ (h/3)[f(a) + f(b) + 4 Σ f(x_odd) + 2 Σ f(x_even)], h = (b−a)/n, n even',

    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="340" fill="var(--svg-fafafa)" rx="8"/><text x="220" y="28" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-333333)">Definite Integral — Area Under the Curve</text><g transform="translate(50,50)"><line x1="0" y1="220" x2="340" y2="220" stroke="var(--svg-a0aec0)" stroke-width="1.5"/><line x1="20" y1="0" x2="20" y2="220" stroke="var(--svg-a0aec0)" stroke-width="1.5"/><text x="340" y="238" text-anchor="end" font-size="12" fill="var(--svg-666666)">x</text><text x="10" y="10" font-size="12" fill="var(--svg-666666)">f(x)</text><path d="M20,220 L20,195 Q40,140 80,95 Q120,55 160,38 Q200,25 240,38 Q280,55 320,95 L320,220 Z" fill="var(--svg-3b82f6)" fill-opacity="0.12" stroke="none"/><path d="M20,195 Q40,140 80,95 Q120,55 160,38 Q200,25 240,38 Q280,55 320,95" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2.5"/><line x1="50" y1="222" x2="50" y2="250" stroke="var(--svg-ef4444)" stroke-width="2"/><text x="50" y="264" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-ef4444)">a</text><line x1="290" y1="222" x2="290" y2="250" stroke="var(--svg-ef4444)" stroke-width="2"/><text x="290" y="264" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-ef4444)">b</text><line x1="50" y1="222" x2="290" y2="222" stroke="var(--svg-ef4444)" stroke-width="1" stroke-dasharray="4,3"/><text x="170" y="170" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-3b82f6)">Area = ∫ₐᵇ f(x) dx</text><text x="170" y="200" text-anchor="middle" font-size="11" fill="var(--svg-666666)">Approximated using Simpson&#39;s rule</text></g></svg>',
      alt: 'Graph of a function curve with the area under the curve shaded between vertical dashed lines at x = a and x = b',
      caption: 'The definite integral from a to b equals the signed area between the function curve and the x-axis.',
    },

    formulaDescription:
      "Simpson's 1/3 rule is a numerical integration method that approximates the definite integral by fitting quadratic (parabolic) arcs through every three consecutive points on the function. The interval [a, b] is divided into an even number n of equally-spaced subintervals of width h = (b − a) / n. Interior points are weighted alternately by 4 (odd indices) and 2 (even indices), reflecting the underlying quadratic interpolation. This method achieves O(h⁴) accuracy — significantly better than the trapezoidal rule's O(h²) — making it exact for polynomials up to degree 3.",

    variables: [
      { symbol: 'f(x)', name: 'Integrand', description: 'The function to be integrated, expressed in terms of the variable x.' },
      { symbol: 'a', name: 'Lower limit', description: 'The starting point of the integration interval.' },
      { symbol: 'b', name: 'Upper limit', description: 'The ending point of the integration interval.' },
      { symbol: 'n', name: 'Subdivisions', description: 'The number of subintervals used for the numerical approximation. Must be even for Simpson\'s rule.' },
      { symbol: 'h', name: 'Step size', description: 'The width of each subinterval, computed as h = (b − a) / n.' },
    ],

    howToUse: [
      'Enter the function f(x) using x as the variable. Use ^ for powers (e.g., x^2 for x squared), * for explicit multiplication, and parentheses for grouping (e.g., (x^2 + 1) / (x - 1)).',
      'Enter the lower bound a and upper bound b to define the integration interval. The calculator automatically sorts a and b so lower ≤ upper.',
      'Optionally adjust the number of subdivisions n (default 100). Use higher values (e.g., 500–1000) for greater accuracy, especially for oscillatory functions.',
      'The result shows the approximate integral using Simpson\'s rule, along with the trapezoidal rule result for comparison. A small discrepancy between the two methods indicates high confidence in the result.',
      'The step-by-step work panel breaks down the computation: step size h, endpoint values, sums of odd/even terms, and the final Simpson formula application.',
    ],

    quickReference: [
      { label: '∫ x² dx from 0 to 1', value: '1/3 ≈ 0.33333' },
      { label: '∫ 1 dx from 0 to 5', value: '5' },
      { label: '∫ x dx from 0 to 2', value: '2' },
      { label: '∫ (3x² + 2x) dx from 0 to 3', value: '36' },
    ],

    commonUses: [
      'Computing areas under curves in physics (e.g., work from force–distance graph, displacement from velocity)',
      'Calculating probabilities and cumulative distribution functions in statistics',
      'Determining total accumulated quantities in engineering (charge, energy, fluid volume)',
      'Verifying analytic integration done by hand in calculus coursework',
      'Computing arc lengths, volumes of revolution, and centroids in geometry',
    ],

    explanation:
      "Numerical integration is essential when a function has no elementary antiderivative (e.g., e^(−x²), sin(x)/x) or when only discrete data points from experiments or sensors are available. Simpson's 1/3 rule is one of the most widely used Newton–Cotes formulas for numerical integration. It works by dividing the interval [a, b] into an even number n of subintervals of equal width h = (b − a) / n. Over each pair of adjacent subintervals (three points: x_{i−1}, x_i, x_{i+1}), the function is approximated by a quadratic (degree-2) Lagrange interpolating polynomial. The area under each quadratic segment is then computed exactly via analytical integration and summed to produce the total approximation. The error term for Simpson's rule is −(b − a)h⁴ / 180 × f⁽⁴⁾(ξ) for some ξ in (a, b), provided f is four times continuously differentiable. This means the method is exact for polynomials up to degree 3 (cubic), and doubling n reduces error by roughly a factor of 16 — much faster than the trapezoidal rule (factor of 4). However, Simpson's rule can produce poor results for functions with sharp peaks, discontinuities, or rapid oscillations within the interval. In such cases, adaptive quadrature methods (which concentrate subdivisions where the function varies most) may be preferred. The calculator provides both Simpson and trapezoidal results so you can assess the reliability of the approximation: a large discrepancy between the two suggests the result should be treated with caution, or that more subdivisions are needed.",

    faqs: [
      {
        question: 'Why must the number of subdivisions be even?',
        answer: "Simpson's 1/3 rule fits a quadratic polynomial through every three consecutive sample points (two adjacent subintervals). This requires an even total number of subintervals. If you enter an odd value, the calculator automatically increments it by 1 to make it even.",
      },
      {
        question: 'How does Simpson\'s rule compare to the trapezoidal rule?',
        answer: "Simpson's rule is significantly more accurate for smooth functions. The trapezoidal rule uses straight-line segments (linear interpolation) between points, giving error O(h²). Simpson's rule uses parabolic arcs (quadratic interpolation), giving error O(h⁴). For most smooth functions, Simpson's rule achieves the same accuracy with far fewer subdivisions.",
      },
      {
        question: 'What does the method discrepancy tell me?',
        answer: 'The discrepancy between Simpson and trapezoidal results gives a rough error estimate. If the two methods agree closely (discrepancy < 0.001), you can have high confidence. A large discrepancy suggests the function has high curvature or irregularities — try increasing n or breaking the interval at points of rapid change.',
      },
      {
        question: 'What happens if my function has a singularity inside the interval?',
        answer: 'Numerical integration methods including Simpson\'s rule assume the function is finite and well-behaved throughout [a, b]. If your function has a division by zero, vertical asymptote, or discontinuity within the interval, the result will be inaccurate or NaN. Consider splitting the interval at the singularity or using an improper integral technique.',
      },
      {
        question: 'Can I integrate exponential or trigonometric functions?',
        answer: 'Yes — the basic expression parser supports standard arithmetic operators (+, -, *, /, ^) and parentheses. For example, you can integrate e^x by entering e^x if your expression uses Euler\'s number... wait, the basic parser does not support the constant "e" or "sin"/"cos". For those, see the Limit Calculator which supports trigonometric and exponential functions.',
      },
    ],

    citations: [
      { source: 'Wikipedia — Simpson\'s Rule', url: 'https://en.wikipedia.org/wiki/Simpson%27s_rule' },
      { source: 'Wolfram MathWorld — Numerical Integration', url: 'https://mathworld.wolfram.com/NumericalIntegration.html' },
    ],
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(IntegralPanel, { values, results });
  },
};

export default integralConfig;
