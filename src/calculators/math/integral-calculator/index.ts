import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import IntegralPanel from './IntegralPanel';
import { CasError, type Node, evalNode, parse } from '../shared/cas';
import { parseNumberStrict } from '../../../utils/parseNumber';
import type { ExplainStep } from '../../../types/calculator';
import { hasAnswer, resultValue } from '../../../utils/explainResults';

const MAX_N = 100000;

// ─── Composite rules on a pre-parsed expression (parse once, evaluate n+1 times) ──────

/** Simpson's 1/3 rule on [a, b] with an even n; null when f is not finite at a node. */
function simpson(f: (x: number) => number, a: number, b: number, n: number) {
  const h = (b - a) / n;
  const fA = f(a);
  const fB = f(b);
  if (!Number.isFinite(fA) || !Number.isFinite(fB)) return null;
  let odd = 0;
  let even = 0;
  for (let i = 1; i < n; i++) {
    const fx = f(a + i * h);
    if (!Number.isFinite(fx)) return null;
    if (i % 2 === 0) even += fx;
    else odd += fx;
  }
  return { value: (h / 3) * (fA + fB + 4 * odd + 2 * even), h, fA, fB, odd, even };
}

function trapezoid(f: (x: number) => number, a: number, b: number, n: number): number | null {
  const h = (b - a) / n;
  let sum = (f(a) + f(b)) / 2;
  for (let i = 1; i < n; i++) sum += f(a + i * h);
  return Number.isFinite(sum) ? h * sum : null;
}

const fmt = (n: number): string => {
  if (Object.is(n, -0) || n === 0) return '0';
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
  return String(Number(n.toPrecision(10)));
};

// ─── Config ──────────────────────────────────────────────────────────────────

const integralConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'expression',
      label: 'Function f(x)',
      type: 'text',
      placeholder: 'e.g. x^2 or 3x+2',
      required: true,
      helpText:
        'Use x as the variable. Supports + - * / ^, implicit products (3x, 2(x+1)), sin cos tan asin acos atan sinh cosh tanh exp ln log (base 10) sqrt abs, and the constants pi and e. Example: x^2 - 4*x + 3 or sin(x)*e^(-x).',
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
      max: MAX_N,
      helpText: `Number of subintervals (2 to ${MAX_N}). Higher values give more accurate results. Must be even for Simpson's rule (odd values are auto-incremented).`,
    },
  ],

  calculate: (values) => {
    const expr = (values.expression || '').trim();
    const a = parseNumberStrict(values.lowerBound);
    const b = parseNumberStrict(values.upperBound);
    if (!expr || !Number.isFinite(a) || !Number.isFinite(b)) return [];

    // n: blank -> 100; otherwise a whole number >= 2 (text like "50abc" is rejected, not truncated).
    const rawN = (values.n ?? '').trim();
    let n = 100;
    if (rawN !== '') {
      const parsed = parseNumberStrict(rawN);
      if (!Number.isInteger(parsed) || parsed < 2) n = 100;
      else n = Math.min(parsed, MAX_N);
    }
    const actualN = n % 2 === 0 ? n : n + 1;

    let tree: Node;
    try {
      tree = parse(expr);
    } catch (e) {
      if (e instanceof CasError) return [];
      throw e;
    }
    const f = (x: number) => evalNode(tree, x);

    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const sign = a < b ? 1 : -1;

    // Empty interval: the integral is exactly 0 (checked only for a valid expression).
    if (a === b) {
      return [
        { id: 'result', label: `∫ ${expr} dx`, value: '0', highlight: true, color: 'positive' },
        { id: 'method', label: 'Method', value: 'Empty interval (a = b)', color: 'neutral' },
      ];
    }

    const s = simpson(f, lo, hi, actualN);
    if (!s) return [];
    const trap = trapezoid(f, lo, hi, actualN);
    if (trap === null) return [];
    // Error estimate from Simpson at 2n and 4n: the observed convergence order p = log2(|S2n - Sn| / |S4n - S2n|)
    // (4 for smooth f, lower near endpoint singularities like sqrt(x)) gives err(Sn) ~ |S2n - Sn| * 2^p / (2^p - 1).
    const s2 = simpson(f, lo, hi, 2 * actualN);
    const s4 = simpson(f, lo, hi, 4 * actualN);
    let errEst = NaN;
    if (s2 && s4) {
      const d1 = Math.abs(s2.value - s.value);
      const d2 = Math.abs(s4.value - s2.value);
      const p = d1 > 0 && d2 > 0 ? Math.min(6, Math.max(1, Math.log2(d1 / d2))) : 4;
      errEst = (d1 * 2 ** p) / (2 ** p - 1);
    }

    const signedSimpson = s.value * sign;
    const signedTrap = trap * sign;
    if (!Number.isFinite(signedSimpson) || !Number.isFinite(signedTrap)) return [];

    const workSteps = [
      `Step size: h = (b − a) / n = (${fmt(hi)} − ${fmt(lo)}) / ${actualN} = ${fmt(s.h)}`,
      `f(a) = ${fmt(s.fA)}, f(b) = ${fmt(s.fB)}`,
      `Sum of odd-indexed f(x) (coefficient 4): ${fmt(s.odd)}`,
      `Sum of even-indexed f(x) (coefficient 2): ${fmt(s.even)}`,
      `S = (h / 3) × [f(a) + f(b) + 4×odd + 2×even] = ${fmt(s.value)}`,
    ];
    if (sign < 0) workSteps.push('Bounds were reversed (a > b), so the sign is flipped: ∫ₐᵇ = −∫ᵇₐ');

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
      ...(Number.isFinite(errEst)
        ? [{ id: 'errorEstimate', label: 'Estimated error (Simpson)', value: `~${errEst < 1e-15 ? '0' : errEst.toExponential(1)}`, color: 'neutral' as const }]
        : []),
      {
        id: 'work',
        label: 'Step-by-Step Work',
        value: workSteps.join(' | '),
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
      'Enter the function f(x) using x as the variable. Use ^ for powers (e.g., x^2 for x squared), parentheses for grouping (e.g., (x^2 + 1) / (x - 1)); products such as 3x or 2(x+1) may omit the * sign.',
      'Enter the lower bound a and upper bound b to define the integration interval. The calculator automatically sorts a and b so lower ≤ upper.',
      'Optionally adjust the number of subdivisions n (default 100). Use higher values (e.g., 500–1000) for greater accuracy, especially for oscillatory functions.',
      'The result shows the approximate integral using Simpson\'s rule, along with the trapezoidal rule result for comparison and an estimated error (from the change when n is doubled). A small discrepancy between the methods indicates high confidence in the result.',
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
        answer: 'The trapezoidal rule converges more slowly than Simpson\'s rule, so the discrepancy mostly measures the trapezoidal error. If the two agree closely you can be confident; a large discrepancy suggests high curvature or irregularities. For Simpson\'s own accuracy use the "Estimated error" row (the change when n is doubled and quadrupled, scaled by the observed convergence order). Increase n or split the interval at points of rapid change.',
      },
      {
        question: 'What happens if my function has a singularity inside the interval?',
        answer: 'Numerical integration methods including Simpson\'s rule assume the function is finite and well-behaved throughout [a, b]. If your function has a division by zero, vertical asymptote, or discontinuity within the interval, the result will be inaccurate or NaN. Consider splitting the interval at the singularity or using an improper integral technique.',
      },
      {
        question: 'Can I integrate exponential or trigonometric functions?',
        answer: 'Yes. Trigonometric (sin, cos, tan and inverses), hyperbolic, exponential (e^x, a^x), logarithmic (ln, log base 10), sqrt and abs are all supported, along with the constants pi and e, e.g. sin(x)*e^(-x) or 1/(1+x^2). The calculator is numerical: it gives a decimal value, not an antiderivative.',
      },
    ],

    citations: [
      { source: 'Wikipedia — Simpson\'s Rule', url: 'https://en.wikipedia.org/wiki/Simpson%27s_rule' },
      { source: 'Wolfram MathWorld — Numerical Integration', url: 'https://mathworld.wolfram.com/NumericalIntegration.html' },
    ],
  },
  explainSteps: (values) => {
    const rows = integralConfig.calculate(values);
    if (!hasAnswer(rows)) return [];
    const work = resultValue(rows, 'work');
    const res = rows.find((r) => r.id === 'result');
    if (!res) return [];
    if (!work) return [{ label: 'The lower and upper bounds are the same point, so there is no area', expr: `${res.label} = ${res.value}` }];
    const labelFor = (l: string): string =>
      /^Step size/.test(l) ? 'Step size: the interval cut into n equal slices'
      : /^f\(a\)/.test(l) ? 'Function values at the two ends'
      : /^Sum of odd/.test(l) ? 'Add the odd-numbered points (weight 4)'
      : /^Sum of even/.test(l) ? 'Add the even-numbered interior points (weight 2)'
      : /^S =/.test(l) ? "Combine them with Simpson's 1/3 rule"
      : /^Bounds/.test(l) ? 'The bounds were reversed'
      : 'Next step';
    const trap = resultValue(rows, 'trapResult');
    const err = resultValue(rows, 'errorEstimate');
    const out: ExplainStep[] = work.split(' | ').map((l) => ({ label: labelFor(l), expr: l }));
    out.push({
      label: 'The integral',
      expr: `${res.label} ≈ ${res.value}`,
      note: `Numerical result. The trapezoid rule gives ${trap}${err ? `; estimated error ${err}` : ''}.`,
    });
    return out;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(IntegralPanel, { values, results });
  },
};

export default integralConfig;
