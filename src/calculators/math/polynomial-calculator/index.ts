import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import PolynomialPanel from './PolynomialPanel';

function toSuperscript(n: number): string {
  const map: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  };
  return n.toString().split('').map((d) => map[d] || d).join('');
}

function formatCoeff(coeff: number, power: number, isFirst: boolean): string {
  if (coeff === 0) return '';
  let result = '';
  if (isFirst) {
    if (coeff < 0) result += '-';
  } else {
    result += coeff > 0 ? ' + ' : ' − ';
  }
  const absC = Math.abs(coeff);
  if (power === 0) {
    result += absC;
  } else if (absC === 1) {
    result += 'x';
  } else {
    result += `${absC}x`;
  }
  if (power > 1) {
    result += toSuperscript(power);
  }
  return result;
}

function buildPolyString(coeffs: number[]): string {
  let result = '';
  for (let i = 0; i < coeffs.length; i++) {
    const power = coeffs.length - 1 - i;
    result += formatCoeff(coeffs[i], power, result === '');
  }
  return result || '0';
}

function evaluateHorner(coeffs: number[], x: number): number {
  let result = coeffs[0];
  for (let i = 1; i < coeffs.length; i++) {
    result = result * x + coeffs[i];
  }
  return result;
}

function buildWork(coeffs: number[], x: number): { steps: string[]; result: number } {
  const fmt = (n: number) => parseFloat(n.toFixed(10)).toString();
  const steps: string[] = [];
  const degree = coeffs.length - 1;

  // Direct substitution
  const terms: string[] = [];
  for (let i = 0; i < coeffs.length; i++) {
    const power = degree - i;
    if (coeffs[i] === 0) continue;
    const sign = i === 0 ? (coeffs[i] < 0 ? '-' : '') : (coeffs[i] > 0 ? ' + ' : ' − ');
    const absCoeff = Math.abs(coeffs[i]);
    let termStr: string;
    if (power === 0) {
      termStr = `${absCoeff}`;
    } else if (absCoeff === 1) {
      termStr = power > 1 ? `x${toSuperscript(power)}` : 'x';
    } else {
      termStr = power > 1 ? `${absCoeff}x${toSuperscript(power)}` : `${absCoeff}x`;
    }
    terms.push(`${sign}${termStr}`);
  }
  const polyStr = terms.join('');

  steps.push(`P(${fmt(x)}) =${polyStr}`);

  // Substitute
  const subTerms: string[] = [];
  for (let i = 0; i < coeffs.length; i++) {
    const power = degree - i;
    if (coeffs[i] === 0) continue;
    const sign = subTerms.length === 0 && coeffs[i] >= 0 ? '' : (coeffs[i] > 0 ? ' + ' : ' − ');
    const absCoeff = Math.abs(coeffs[i]);
    let subStr: string;
    if (power === 0) {
      subStr = `${absCoeff}`;
    } else if (power === 1) {
      subStr = `${absCoeff} × ${fmt(x)}`;
    } else {
      subStr = `${absCoeff} × ${fmt(x)}${toSuperscript(power)}`;
    }
    subTerms.push(`${sign}${subStr}`);
  }
  steps.push(`  =${subTerms.join('')}`);

  // Values
  const valTerms: string[] = [];
  for (let i = 0; i < coeffs.length; i++) {
    const power = degree - i;
    const termValue = coeffs[i] * Math.pow(x, power);
    if (coeffs[i] === 0) continue;
    const sign = valTerms.length === 0 && termValue >= 0 ? '' : (termValue >= 0 ? ' + ' : ' − ');
    valTerms.push(`${sign}${fmt(Math.abs(termValue))}`);
  }
  steps.push(`  =${valTerms.join('')}`);

  // Final compute using Horner for accuracy
  const result = evaluateHorner(coeffs, x);
  steps.push(`  = ${fmt(result)}`);

  return { steps, result };
}

const polynomialConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'coefficients',
      label: 'Polynomial Coefficients',
      type: 'text',
      placeholder: 'e.g. 1, -3, 2 for x²-3x+2',
      required: true,
      helpText: 'Enter coefficients separated by commas, from highest degree to constant term',
    },
    {
      id: 'x',
      label: 'Value of x',
      type: 'number',
      placeholder: 'evaluate at x=',
      required: true,
      helpText: 'The x value to evaluate the polynomial at',
    },
  ],
  calculate: (values) => {
    const raw = values.coefficients?.trim();
    const x = parseFloat(values.x);

    if (!raw || isNaN(x)) return [];

    // Parse coefficients
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return [];

    const coeffs: number[] = [];
    for (const p of parts) {
      const n = parseFloat(p);
      if (isNaN(n)) return [];
      coeffs.push(n);
    }

    if (coeffs.length === 0) return [];
    const degree = coeffs.length - 1;

    // Build polynomial string
    const polyString = buildPolyString(coeffs);

    // Build work
    const { steps, result } = buildWork(coeffs, x);
    const fmt = (n: number) => parseFloat(n.toFixed(10)).toString();

    const results: CalculatorResult[] = [
      {
        id: 'polynomial',
        label: 'Polynomial',
        value: polyString,
        highlight: true,
        color: 'neutral',
      },
      {
        id: 'degree',
        label: 'Degree',
        value: degree.toString(),
        color: 'neutral',
      },
      {
        id: 'evaluated',
        label: `P(${fmt(x)})`,
        value: fmt(result),
        highlight: true,
        color: 'positive',
      },
      {
        id: 'work',
        label: 'Substitution Steps',
        value: steps.join('\n'),
      },
    ];

    // Add info about leading coefficient
    if (degree > 0) {
      results.push({
        id: 'leadingCoeff',
        label: 'Leading Coefficient',
        value: fmt(coeffs[0]),
        color: 'neutral',
      });
    }

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(PolynomialPanel, { values, results });
  },
  educational: {
    formula: 'P(x) = aₙxⁿ + aₙ₋₁xⁿ⁻¹ + ... + a₁x + a₀',
    formulaDescription:
      'A polynomial function is an expression of the form P(x) = aₙxⁿ + aₙ₋₁xⁿ⁻¹ + ... + a₁x + a₀, where each aᵢ is a coefficient and n is a non-negative integer (the degree). The polynomial is named by its degree: linear (n=1), quadratic (n=2), cubic (n=3), quartic (n=4), quintic (n=5), and so on. Evaluating a polynomial at a given x substitutes the value into the expression and computes the result. Horner\'s method is an efficient algorithm for evaluation that minimizes arithmetic operations.',
    variables: [
      { symbol: 'aₙ', name: 'Leading Coefficient', description: 'The coefficient of the highest-degree term. Determines the end behavior of the polynomial function as x approaches infinity or negative infinity.' },
      { symbol: 'n', name: 'Degree', description: 'The highest exponent of x in the polynomial. Determines the maximum number of roots, turning points, and the overall shape of the graph.' },
      { symbol: 'x', name: 'Independent Variable', description: 'The variable at which the polynomial is evaluated. Can be any real number.' },
      { symbol: 'P(x)', name: 'Polynomial Value', description: 'The result of evaluating the polynomial at a specific x value. Represents the y-coordinate on the polynomial graph.' },
    ],
    howToUse: [
      'Enter the coefficients of your polynomial separated by commas, from the highest degree term down to the constant term.',
      'For the polynomial x² − 3x + 2, enter: 1, -3, 2 (where 1 is the x² coefficient, -3 is the x coefficient, and 2 is the constant).',
      'Enter the x value at which you want to evaluate the polynomial.',
      'The calculator displays the formatted polynomial, its degree, and the evaluated result P(x).',
      'The step-by-step panel shows the substitution process: the polynomial with x replaced by your value, each term computed, and the final sum.',
    ],
    commonUses: [
      'Algebra homework and test preparation — verifying polynomial evaluations and understanding polynomial behavior',
      'Calculating function values for graphing polynomials over a range of x values',
      'Engineering and physics applications where polynomial models describe real-world phenomena',
      'Computer graphics and curve fitting using polynomial interpolation and approximation',
      'Economics and finance using polynomial cost, revenue, and profit functions',
    ],
    diagram: {
      svg: '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="320" height="200" fill="var(--svg-f8fafc)" rx="8"/><text x="160" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-1e293b)">Polynomial Evaluation</text><text x="160" y="34" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">P(x) = 2x² − 3x + 1 at x = 2</text><rect x="20" y="48" width="280" height="40" rx="6" fill="var(--svg-dbeafe)"/><text x="160" y="68" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e40af)">P(2) = 2(2²) − 3(2) + 1</text><rect x="20" y="96" width="280" height="40" rx="6" fill="var(--svg-d1fae5)"/><text x="160" y="116" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-065f46)">= 2(4) − 6 + 1 = 8 − 6 + 1 = 3</text><text x="160" y="155" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--svg-1e293b)">Horner: ((2·2 − 3)·2 + 1)</text><text x="160" y="172" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">= ((4 − 3)·2 + 1) = (1·2 + 1) = 3</text></svg>',
      alt: 'Polynomial evaluation showing substitution of x=2 into 2x²−3x+1 with Horner method',
      caption: 'Evaluating a polynomial substitutes each x with the given value; Horner\'s method minimizes operations for speed and numerical stability.',
    },
    explanation: 'Polynomial evaluation is one of the most fundamental operations in algebra and numerical computing. A polynomial function f(x) maps an input x to an output value by computing a weighted sum of powers of x. The standard form is a_n x^n + a_{n-1} x^{n-1} + ... + a_1 x + a_0, where each a_i is a real-number coefficient. The degree n determines the polynomial\'s complexity: degree 1 is a straight line, degree 2 is a parabola, and degree 3+ produces increasingly complex curves. Horner\'s method rewrites the polynomial as nested multiplications — for example, 2x² − 3x + 1 becomes ((2x − 3)x + 1) — which reduces the number of multiplications from O(n²) to O(n) and improves numerical stability by minimizing floating-point error accumulation. This matters for high-degree polynomials (n > 10) where repeated squaring can amplify rounding errors. Polynomials are ubiquitous: they model projectile trajectories in physics, cost and revenue functions in economics, yield curves in finance, and interpolation between data points in engineering and computer graphics. Evaluating a polynomial at specific x values is the basis for graphing functions, finding roots through iterative methods, and computing function values for further analysis like integration and differentiation. When working with real-world data, polynomials provide a smooth, continuous approximation that can be differentiated and integrated analytically — an advantage over discrete data tables. The key practical takeaway: always verify evaluation results against known test points, especially for high-degree polynomials where small coefficient errors can produce large output errors.',
    limitations: [
      'This calculator evaluates polynomials at specific x values — it does not find roots, factor polynomials, or perform symbolic operations like differentiation or integration. For finding roots, use the Quadratic Equation Solver (degree 2) or Equation Solver.',
      'The calculator uses double-precision floating-point, which may show tiny rounding errors (typically in the 15th decimal place) for some coefficient and x-value combinations.',
      'The maximum practical degree is about 100 terms before the input string becomes unwieldy.',
      'Coefficients and x-values must be real numbers — complex numbers are not supported.',
      'The polynomial string formatter uses integer rounding for coefficients that are very close to integers, which may slightly alter the displayed polynomial for coefficients with many decimal places.',
    ],
    quickReference: [
      { label: 'Standard Form', value: 'a_n x^n + a_(n-1) x^(n-1) + ... + a_1 x + a_0' },
      { label: 'Degree', value: 'Highest exponent with non-zero coefficient' },
      { label: 'Leading Coefficient', value: 'a_n (coefficient of highest-degree term)' },
      { label: 'Horner Method', value: '((...(a_n x + a_(n-1))x + ...)x + a_1)x + a_0' },
      { label: 'Degree 0', value: 'Constant function (horizontal line)' },
      { label: 'Degree 1', value: 'Linear function (straight line)' },
      { label: 'Degree 2', value: 'Quadratic function (parabola)' },
      { label: 'Degree 3', value: 'Cubic function (S-shaped curve)' },
    ],
    faqs: [
      {
        question: 'What does the degree of a polynomial tell me?',
        answer: 'The degree is the highest exponent of x and determines the polynomial\'s fundamental properties: the maximum number of roots (zeros) equals the degree, the maximum number of turning points equals degree − 1, and the end behavior (what happens as x → ±∞) depends on whether the degree is even or odd and the sign of the leading coefficient. A quadratic (degree 2) has at most 2 roots and 1 turning point; a cubic (degree 3) has at most 3 roots and 2 turning points.',
      },
      {
        question: 'How should I enter coefficients for a polynomial?',
        answer: 'Enter coefficients separated by commas, from the highest degree to the constant term. For example, for 4x³ − 2x² + 5, enter: 4, -2, 0, 5. Note the zero coefficient for the missing x term — every power from the degree down to 0 must have a coefficient. If you omit one, the degree will be wrong and the result will be incorrect.',
      },
      {
        question: 'What is Horner\'s method and why is it better?',
        answer: 'Horner\'s method rewrites the polynomial as nested multiplications: P(x) = a₀ + x(a₁ + x(a₂ + ... + x(aₙ₋₁ + xaₙ)...)). This computes the value using only n multiplications and n additions, which is both faster and numerically more stable than the direct approach of computing each xⁿ separately. For high-degree polynomials, this matters significantly.',
      },
      {
        question: 'Can I evaluate a polynomial at negative x values?',
        answer: 'Yes, absolutely. Simply enter a negative number for x. The calculator handles negative values correctly, and the step-by-step work will show the sign changes correctly. Pay attention to the signs of terms with even and odd powers — an even power of a negative number is positive, while an odd power is negative. For example, (-2)^3 = -8, but (-2)^4 = +16. The Horner method automatically handles these sign changes without any special configuration.',
      },
      {
        question: 'What is the difference between evaluating and solving a polynomial?',
        answer: 'Evaluating a polynomial means computing P(x) for a specific x value — you get a single number as the output. Solving a polynomial means finding the x values where P(x) = 0 (the roots or zeros). This calculator evaluates polynomials; it does not find roots. For solving, use our Quadratic Equation Solver for degree-2 polynomials or the Equation Solver for linear equations. The two operations are complementary: after you find a root using a solver, you can evaluate the polynomial at that root to verify that P(root) indeed equals 0 (or very close to it, within floating-point tolerance).',
      },
    ],
    citations: [
      { source: 'Wikipedia — Polynomial', url: 'https://en.wikipedia.org/wiki/Polynomial' },
      { source: 'Wolfram MathWorld — Polynomial Evaluation', url: 'https://mathworld.wolfram.com/HornersMethod.html' },
      { source: 'Wikipedia — Horner\'s Method', url: 'https://en.wikipedia.org/wiki/Horner%27s_method' },
    ],
  },
};

export default polynomialConfig;
