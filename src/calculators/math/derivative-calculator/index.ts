import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import DerivativePanel from './DerivativePanel';

/**
 * Interface representing a parsed polynomial term:
 * coefficient * x^exponent
 * e.g. "3x^2" → { coeff: 3, exp: 2 }
 *      "5x"   → { coeff: 5, exp: 1 }
 *      "7"    → { coeff: 7, exp: 0 }
 */
interface Term {
  coeff: number;
  exp: number;
}

/**
 * Format a term as a string for display.
 * Handles special formatting for exponent 0, 1, and > 1.
 */
function formatTerm(coeff: number, exp: number, isFirst: boolean): string {
  if (coeff === 0) return '';

  const sign = coeff < 0 ? '-' : (isFirst ? '' : '+');
  const absCoeff = Math.abs(coeff);

  if (exp === 0) {
    return `${sign}${absCoeff}`;
  }
  if (exp === 1) {
    if (absCoeff === 1) return `${sign}x`;
    return `${sign}${absCoeff}x`;
  }
  if (absCoeff === 1) return `${sign}x^${exp}`;
  return `${sign}${absCoeff}x^${exp}`;
}

/**
 * Format a polynomial from an array of terms (sorted descending by exponent).
 */
function formatPolynomial(terms: Term[], showZero = false): string {
  const filtered = terms.filter((t) => t.coeff !== 0 || showZero);
  if (filtered.length === 0) return '0';

  let result = '';
  for (let i = 0; i < filtered.length; i++) {
    const { coeff, exp } = filtered[i];
    result += formatTerm(coeff, exp, i === 0);
  }
  return result || '0';
}

/**
 * Parse a polynomial expression string like "3x^2 + 2x + 1" into an array
 * of Term objects.
 *
 * Supported formats:
 *   - Standard: 3x^2, 2x, 5
 *   - Implicit coefficient 1: x^3, x
 *   - Negative: -x^2, -3x
 *   - Decimal coefficients: 1.5x^2
 */
function parsePolynomial(expr: string): Term[] | null {
  // Remove all whitespace
  const cleaned = expr.replace(/\s+/g, '');

  if (!cleaned) return null;

  // Insert a '+' before leading '-' if present to make splitting consistent
  // e.g. "-3x^2+2x+1" → "0-3x^2+2x+1" so the split works uniformly
  const normalized = cleaned.startsWith('-') ? '0' + cleaned : cleaned;

  // Split on + or - but keep the delimiters
  // Regex: match optional sign followed by term parts
  const termPattern = /[+-]?\d*\.?\d*x?(?:\^\d+)?/g;
  const parts = normalized.match(termPattern);

  if (!parts) return null;

  const terms: Term[] = [];

  for (const part of parts) {
    if (!part || part === '+' || part === '-') continue;

    const trimmedPart = part; // already cleaned

    // Determine sign
    let sign = 1;
    let body = trimmedPart;
    if (body.startsWith('-')) {
      sign = -1;
      body = body.slice(1);
    } else if (body.startsWith('+')) {
      body = body.slice(1);
    }

    if (!body) continue;

    // Check if this is a variable term (contains 'x') or constant
    if (body.includes('x')) {
      const xIndex = body.indexOf('x');

      // Extract coefficient (everything before 'x')
      const coeffStr = body.slice(0, xIndex);
      let exponent = 1; // default if no ^

      // Extract exponent if present (after '^')
      if (body.includes('^')) {
        const expStr = body.slice(body.indexOf('^') + 1);
        const parsedExp = parseInt(expStr, 10);
        if (isNaN(parsedExp) || parsedExp < 0) return null;
        exponent = parsedExp;
      }

      // If coefficient string is empty or just '.', it's implicitly 1 or -1
      let coefficient: number;
      if (coeffStr === '' || coeffStr === '.') {
        coefficient = 1;
      } else {
        coefficient = parseFloat(coeffStr);
        if (isNaN(coefficient)) return null;
      }

      terms.push({ coeff: sign * coefficient, exp: exponent });
    } else {
      // Constant term
      const constant = parseFloat(body);
      if (isNaN(constant)) return null;
      terms.push({ coeff: sign * constant, exp: 0 });
    }
  }

  if (terms.length === 0) return null;

  // Combine like terms (same exponent)
  const combined = new Map<number, number>();
  for (const t of terms) {
    combined.set(t.exp, (combined.get(t.exp) || 0) + t.coeff);
  }

  // Convert back to array sorted descending by exponent
  const result: Term[] = [];
  for (const [exp, coeff] of combined) {
    result.push({ coeff, exp });
  }
  result.sort((a, b) => b.exp - a.exp);

  return result;
}

/**
 * Differentiate a polynomial using the power rule:
 * d/dx(ax^n) = a*n*x^(n-1)
 * - If n = 1, derivative is constant a
 * - If n = 0, derivative is 0
 * - Special case: if term is "x", treat as 1*x^1
 */
function differentiate(terms: Term[]): Term[] {
  const result: Term[] = [];

  for (const { coeff, exp } of terms) {
    if (exp === 0) continue; // constant differentiates to 0 (dropped)

    const newCoeff = coeff * exp;
    const newExp = exp - 1;

    // If n became 0, it's a constant (x^0 = 1) — keep it
    // If coefficient happens to be 0, skip it
    if (newCoeff === 0) continue;

    result.push({ coeff: newCoeff, exp: newExp });
  }

  // Sort descending by exponent
  result.sort((a, b) => b.exp - a.exp);

  return result;
}

/**
 * Generate step-by-step explanation for differentiating each term.
 */
function generateSteps(terms: Term[]): string {
  const steps: string[] = [];

  for (const { coeff, exp } of terms) {
    if (exp === 0) {
      steps.push(`d/dx(${formatTerm(coeff, 0, true)}) = 0 (constant rule)`);
    } else if (exp === 1) {
      if (coeff === 1) {
        steps.push(`d/dx(x) = 1 (power rule: exponent becomes 0, coefficient = 1)`);
      } else {
        steps.push(`d/dx(${formatTerm(coeff, 1, true)}) = ${coeff} (power rule: drop the x)`);
      }
    } else {
      const newCoeff = coeff * exp;
      const newExp = exp - 1;
      if (newExp === 0) {
        steps.push(
          `d/dx(${formatTerm(coeff, exp, true)}) = ${newCoeff} (power rule: ${coeff}×${exp}×x^0 = ${newCoeff})`
        );
      } else {
        steps.push(
          `d/dx(${formatTerm(coeff, exp, true)}) = ${formatTerm(newCoeff, newExp, true)} (power rule: ${coeff}×${exp}×x^${newExp})`
        );
      }
    }
  }

  return steps.join('\n');
}

/**
 * Evaluate a polynomial at a given x value.
 */
function evaluatePolynomial(terms: Term[], x: number): number {
  let result = 0;
  for (const { coeff, exp } of terms) {
    result += coeff * Math.pow(x, exp);
  }
  return result;
}

const derivativeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'expression',
      label: 'Polynomial Expression f(x)',
      type: 'text',
      placeholder: 'e.g. 3x^2 + 2x + 1',
      required: true,
      helpText: 'Enter a polynomial in standard form. Use ^ for exponents: 3x^2 + 2x + 1 or x^3 - 4x^2 + 5x - 2.',
    },
    {
      id: 'xValue',
      label: 'Evaluate at x = (optional)',
      type: 'number',
      placeholder: 'Leave blank for symbolic only',
      required: false,
      helpText: 'Optionally provide an x value to evaluate the derivative numerically.',
    },
  ],

  calculate: (values) => {
    const expression = (values.expression || '').trim();
    const xValueRaw = values.xValue || '';

    if (!expression) return [];

    // Parse the polynomial
    const terms = parsePolynomial(expression);
    if (!terms || terms.length === 0) return [];

    // Format the original polynomial
    const original = formatPolynomial(terms);

    // Differentiate
    const derivativeTerms = differentiate(terms);
    if (derivativeTerms.length === 0) {
      // If all terms were constants, derivative is 0
      const derivative = '0';
      const steps = generateSteps(terms);

      const results: CalculatorResult[] = [
        { id: 'derivative', label: "f'(x)", value: derivative, highlight: true, color: 'positive' },
        { id: 'original', label: 'f(x)', value: original },
        { id: 'steps', label: 'Step-by-Step', value: steps || 'All terms were constants, derivative is 0.' },
      ];

      // Evaluate at x if provided
      if (xValueRaw) {
        const xVal = parseFloat(xValueRaw);
        if (!isNaN(xVal)) {
          results.push({ id: 'evaluated', label: `f'(${xVal})`, value: '0' });
        }
      }

      return results;
    }

    const derivative = formatPolynomial(derivativeTerms);
    const steps = generateSteps(terms);

    const results: CalculatorResult[] = [
      { id: 'derivative', label: "f'(x)", value: derivative, highlight: true, color: 'positive' },
      { id: 'original', label: 'f(x)', value: original },
      { id: 'steps', label: 'Step-by-Step', value: steps },
    ];

    // Evaluate at x if provided
    if (xValueRaw) {
      const xVal = parseFloat(xValueRaw);
      if (!isNaN(xVal)) {
        const evaluated = evaluatePolynomial(derivativeTerms, xVal);
        results.push({ id: 'evaluated', label: `f'(${xVal})`, value: evaluated.toString() });
      }
    }

    return results;
  },

  educational: {
    formula: "f'(x) = d/dx(ax^n) = a · n · x^{n-1}",
    formulaDescription:
      'The power rule is one of the most fundamental differentiation rules in calculus. It states that the derivative of a term ax^n is a·n·x^(n-1), where a is any real coefficient and n is any real exponent. This calculator implements the power rule for polynomials with real number coefficients and integer exponents, handling terms like 3x^2 (becomes 6x^1 = 6x), 5x (becomes 5), and constants (become 0). The derivative of a sum is the sum of the derivatives, so each term is differentiated independently.',
    variables: [
      {
        symbol: 'a',
        name: 'Coefficient',
        description: 'The numerical factor multiplying the variable term. In 3x^2, a = 3. In -5x, a = -5. The coefficient scales the rate of change: a larger coefficient means a steeper slope. The coefficient carries through the differentiation: d/dx(ax^n) = a·n·x^(n-1).',
      },
      {
        symbol: 'n',
        name: 'Exponent (Power)',
        description: 'The power to which the variable x is raised. In x^2, n = 2 (parabolic growth). In x^1 (just x), n = 1 (linear growth). Constants have n = 0 (x^0 = 1). The power rule brings down the exponent as a multiplier: a·n·x^(n-1).',
      },
      {
        symbol: "f'(x)",
        name: 'Derivative (Rate of Change)',
        description: "The derivative represents the instantaneous rate of change of the function at any point x. Geometrically, it is the slope of the tangent line to the curve at that point. A positive derivative means the function is increasing, negative means decreasing, and zero means a local extremum (flat tangent).",
      },
      {
        symbol: 'd/dx',
        name: 'Differentiation Operator',
        description: "The notation d/dx means \"take the derivative with respect to x.\" It is an operator that transforms a function into its derivative function. The process of differentiation finds the rate at which the output of a function changes as its input changes. Leibniz notation (dy/dx) and Lagrange notation (f'(x)) are the two most common ways to represent derivatives.",
      },
    ],
    howToUse: [
      'Enter a polynomial expression in standard form using the caret symbol (^) for exponents. Examples: "3x^2 + 2x + 1" for a quadratic, "x^3 - 4x^2 + 5x - 2" for a cubic, or "5x" for a linear term.',
      'The calculator differentiates each term using the power rule: multiply the coefficient by the exponent, then decrease the exponent by one. Constants (terms without x) differentiate to zero and are dropped.',
      'Review the step-by-step breakdown to see exactly how each term was differentiated. Each step shows the original term, the power rule applied, and the result.',
      'Optionally enter a numeric x-value to evaluate the derivative at that point. This gives you the slope of the tangent line to the original function at that x-coordinate.',
      'The result shows the derivative function f\'(x), the original function f(x) for reference, the step-by-step work, and the evaluated value if an x-value was provided.',
    ],
    quickReference: [
      { label: 'd/dx(x^n)', value: 'n·x^(n-1)' },
      { label: 'd/dx(constant)', value: '0' },
      { label: 'd/dx(x)', value: '1' },
      { label: 'd/dx(ax^n)', value: 'a·n·x^(n-1)' },
    ],
    commonUses: [
      'Physics and engineering — calculating velocity (derivative of position) and acceleration (derivative of velocity) from motion equations, finding rates of change in electrical circuits, fluid dynamics, and thermodynamics.',
      'Economics and finance — determining marginal cost, marginal revenue, and marginal profit from total functions. The derivative tells a business how much their cost or revenue changes with each additional unit produced.',
      'Optimization problems — finding maximum and minimum values of functions by setting the derivative to zero. Used in optimizing manufacturing processes, portfolio allocation, route planning, and machine learning (gradient descent).',
      'Data science and machine learning — computing gradients for training neural networks (backpropagation relies on the chain rule), optimizing loss functions, and performing sensitivity analysis on model parameters.',
      'Curve sketching and analysis — determining where a function is increasing or decreasing (first derivative test), finding inflection points (second derivative test), and understanding the shape and behavior of graphs.',
    ],
    explanation:
      'The derivative is one of the two central concepts in calculus (the other being integration). It measures the instantaneous rate of change of a function with respect to its variable. The power rule — d/dx(x^n) = n·x^(n-1) — is the first differentiation rule most students learn, and it handles polynomials efficiently. For a term like 3x^4, the derivative is 3·4·x^(4-1) = 12x^3. The coefficient (3) carries through, the exponent (4) drops down as a multiplier, and the new exponent is one less (3). This works for any real number exponent, though this calculator focuses on integer exponents. The derivative of a sum is the sum of the derivatives, so we can differentiate term by term. The constant rule states that the derivative of a constant is zero — constants do not change, so their rate of change is zero. Geometrically, the derivative at a point gives the slope of the tangent line to the curve at that point. If f\'(x) > 0, the function is increasing (going up) at x. If f\'(x) < 0, the function is decreasing (going down). If f\'(x) = 0, the function has a horizontal tangent, which may indicate a local maximum, local minimum, or saddle point (inflection). The second derivative, f"\'(x), measures the rate of change of the rate of change — it tells us about concavity. If f"\'(x) > 0, the graph is concave up (like a cup, holding water). If f"\'(x) < 0, it is concave down (like a frown). The power rule is the foundation for polynomial calculus. Combined with the product rule, quotient rule, chain rule, and trigonometric/exponential rules, it enables differentiation of almost any function encountered in applied mathematics.',
    diagram: {
      svg: '<svg viewBox="0 0 600 280" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">' +
        '<text x="300" y="22" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="var(--svg-1e293b)" text-anchor="middle">Geometric Meaning of the Derivative — Slope of the Tangent Line</text>' +
        '<rect x="20" y="30" width="560" height="240" rx="8" fill="var(--svg-f8fafc)" stroke="var(--svg-cbd5e1)" stroke-width="1"/>' +
        '<line x1="40" y1="200" x2="560" y2="200" stroke="var(--svg-94a3b8)" stroke-width="1.5"/>' +
        '<text x="565" y="204" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)">x</text>' +
        '<line x1="300" y1="200" x2="300" y2="40" stroke="var(--svg-94a3b8)" stroke-width="1.5"/>' +
        '<text x="306" y="38" font-family="system-ui,sans-serif" font-size="10" fill="var(--svg-64748b)">y</text>' +
        '<path d="M60,190 C120,160 180,100 240,70 C270,55 300,50 330,55 C360,60 390,80 420,110 C450,145 510,175 540,185" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2.5" stroke-linecap="round"/>' +
        '<line x1="290" y1="100" x2="370" y2="140" stroke="var(--svg-ef4444)" stroke-width="2" stroke-linecap="round"/>' +
        '<circle cx="300" cy="102" r="5" fill="var(--svg-ef4444)"/>' +
        '<text x="305" y="96" font-family="system-ui,sans-serif" font-size="9" font-weight="600" fill="var(--svg-ef4444)">P (x, f(x))</text>' +
        '<rect x="380" y="155" width="180" height="70" rx="6" fill="var(--svg-ffffff)" stroke="var(--svg-e2e8f0)" stroke-width="1"/>' +
        '<text x="470" y="172" font-family="system-ui,sans-serif" font-size="10" font-weight="600" fill="var(--svg-1e293b)" text-anchor="middle">Key Relationship</text>' +
        '<text x="470" y="188" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-475569)" text-anchor="middle">Slope of tangent = f\'(x)</text>' +
        '<text x="470" y="203" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-475569)" text-anchor="middle">f\'(x) &gt; 0 → increasing</text>' +
        '<text x="470" y="218" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-475569)" text-anchor="middle">f\'(x) &lt; 0 → decreasing</text>' +
        '<text x="300" y="258" font-family="system-ui,sans-serif" font-size="9" fill="var(--svg-64748b)" text-anchor="middle">At each point on the curve, the derivative gives the slope of the uniquely defined tangent line at that point</text>' +
        '</svg>',
      alt: 'Graph of a polynomial curve with a tangent line drawn at a point, illustrating that the derivative gives the slope of the tangent line at any point on the curve',
      caption: 'The derivative f\'(x) at any point x is the slope of the line tangent to the curve at that point. Positive derivatives indicate increasing functions; negative derivatives indicate decreasing functions.',
    },
    faqs: [
      {
        question: 'What does the derivative actually tell me?',
        answer: 'The derivative f\'(x) gives the instantaneous rate of change of the function at any point x. In practical terms, if f(x) represents position, f\'(x) is velocity. If f(x) represents cost, f\'(x) is marginal cost. If f(x) represents profit, f\'(x) tells you how profit changes with production. A derivative of 6x means the slope of the original function at x=2 is 12 — the function is steeply increasing at that point. A derivative of 0 at a point means the tangent is horizontal, indicating a potential maximum or minimum.',
      },
      {
        question: 'Can this calculator handle more complex functions like trigonometry or exponentials?',
        answer: 'This calculator implements the power rule for standard polynomial forms only. It can handle terms like 3x^2, -5x^3, 7, and 2x. It does not support trigonometric functions (sin, cos, tan), exponential functions (e^x), logarithmic functions, product rule, quotient rule, chain rule, or implicit differentiation. For those, you would need a full Computer Algebra System (CAS) like Wolfram Alpha or SymPy. This calculator is designed to be educational and practical for introductory calculus students working with polynomials.',
      },
      {
        question: 'Why do constants differentiate to zero?',
        answer: 'A constant does not change, so its rate of change is zero. Graphically, y = c (a constant function) is a horizontal line — its slope is zero everywhere. The power rule confirms this: a constant is ax^0, and using the power rule, d/dx(ax^0) = a·0·x^(-1) = 0. This makes intuitive sense — if you have $5 and time passes, you still have $5 (ignoring interest). The constant term in a polynomial shifts the graph up or down but does not affect the shape or slope.',
      },
      {
        question: 'What is the difference between the first derivative and the second derivative?',
        answer: 'The first derivative f\'(x) tells you the slope of the function — whether it is increasing or decreasing. The second derivative f\'\'(x) (the derivative of the derivative) tells you about concavity — whether the slope itself is increasing or decreasing. If f\'\'(x) > 0, the function is concave up (curving upward like a cup), and if f\'\'(x) < 0, it is concave down (curving downward like a frown). The second derivative can also indicate acceleration if the original function represents position. Inflection points occur where f\'\'(x) = 0 and the concavity changes.',
      },
      {
        question: 'Can I use this for implicit differentiation or partial derivatives?',
        answer: 'No, this calculator handles explicit differentiation of polynomials in a single variable x using the power rule. Implicit differentiation (where y is defined implicitly by an equation like x^2 + y^2 = 25) and partial derivatives (where a function has multiple variables like f(x, y, z)) require more advanced techniques. The power rule only applies directly when you have an explicit function f(x) = polynomial in x. However, the underlying principle — multiply by the exponent and reduce by one — is the same in both cases.',
      },
    ],
    citations: [
      { source: 'Wolfram MathWorld — Power Rule', url: 'https://mathworld.wolfram.com/PowerRule.html' },
      { source: 'Khan Academy — Derivative Rules', url: 'https://www.khanacademy.org/math/differential-calculus/dc-diff-intro/dc-basic-diff-rules/a/basic-differentiation-rules-review' },
    ],
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DerivativePanel, { values, results });
  },
};

export default derivativeConfig;
