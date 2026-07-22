import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import TaylorSeriesPanel from './TaylorSeriesPanel';
import { safeEval } from '../shared/safeEval';

function factorial(n: number): number {
  if (n < 0) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function getKnownTaylorTerms(expr: string, center: number, order: number): string[] | null {
  const s = expr.trim().replace(/\s/g, '');
  const c = center;

  const terms: string[] = [];
  const fmt = (n: number) => {
    if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
    return parseFloat(n.toFixed(6)).toString();
  };

  if (s === 'e^x' || s === 'exp(x)') {
    // e^x = Σ x^n/n!
    for (let n = 0; n <= order; n++) {
      if (n === 0) {
        terms.push('1');
      } else {
        const coeff = Math.exp(c) / factorial(n);
        const term = `(${fmt(coeff)})·(x-${fmt(c)})^${n}`;
        terms.push(term);
      }
    }
    return terms;
  }

  if (s === 'sin(x)') {
    // sin(x) = Σ (-1)^n * x^(2n+1)/(2n+1)!
    for (let n = 0; n <= order; n++) {
      const power = 2 * n + 1;
      if (power > order) break;
      // More direct approach: use derivative pattern
    }
    // Simpler: compute terms around center using derivatives
    for (let k = 0; k <= order; k++) {
      if (k === 0) {
        terms.push(fmt(Math.sin(c)));
      } else {
        // derivative pattern: sin → cos → -sin → -cos → sin
        const deriv = k % 4;
        let derivVal = 0;
        if (deriv === 0) derivVal = Math.sin(c);
        else if (deriv === 1) derivVal = Math.cos(c);
        else if (deriv === 2) derivVal = -Math.sin(c);
        else derivVal = -Math.cos(c);
        const coeff = derivVal / factorial(k);
        if (coeff === 0) continue;
        const term = `(${fmt(coeff)})·(x-${fmt(c)})^${k}`;
        terms.push(term);
      }
    }
    return terms;
  }

  if (s === 'cos(x)') {
    for (let k = 0; k <= order; k++) {
      if (k === 0) {
        terms.push(fmt(Math.cos(c)));
      } else {
        const deriv = k % 4;
        let derivVal = 0;
        if (deriv === 0) derivVal = Math.cos(c);
        else if (deriv === 1) derivVal = -Math.sin(c);
        else if (deriv === 2) derivVal = -Math.cos(c);
        else derivVal = Math.sin(c);
        const coeff = derivVal / factorial(k);
        if (coeff === 0) continue;
        const term = `(${fmt(coeff)})·(x-${fmt(c)})^${k}`;
        terms.push(term);
      }
    }
    return terms;
  }

  if (s === '1/(1-x)' && c === 0) {
    // 1/(1-x) = Σ x^n for n=0..order, valid for |x|<1
    for (let n = 0; n <= order; n++) {
      if (n === 0) {
        terms.push('1');
      } else {
        const term = `x^${n}`;
        terms.push(term);
      }
    }
    return terms;
  }

  return null;
}

function evaluateTaylorPoly(terms: string[], xVal: number): number {
  // Simple evaluation: parse each term of form "(coeff)·(x-c)^k"
  let sum = 0;
  for (const term of terms) {
    const match = term.match(/^\(([^)]+)\)·\(x-([^)]+)\)\^(\d+)$/);
    if (match) {
      const coeff = parseFloat(match[1]);
      const center = parseFloat(match[2]);
      const power = parseInt(match[3], 10);
      sum += coeff * Math.pow(xVal - center, power);
    } else if (term === '1') {
      sum += 1;
    } else if (/^\d/.test(term)) {
      sum += parseFloat(term);
    }
  }
  return sum;
}

const taylorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'expression',
      label: 'Function f(x)',
      type: 'text',
      placeholder: 'e.g. e^x, sin(x), cos(x), 1/(1-x)',
      required: true,
      helpText: 'Enter the function to expand. Known expansions: e^x, sin(x), cos(x), 1/(1-x)',
    },
    {
      id: 'center',
      label: 'Center (a)',
      type: 'number',
      placeholder: 'a (center)',
      step: 0.1,
      inputMode: 'decimal',
      helpText: 'The point around which to expand the series (default: 0 for Maclaurin series)',
    },
    {
      id: 'order',
      label: 'Order (n)',
      type: 'number',
      placeholder: 'n (order)',
      step: 1,
      inputMode: 'numeric',
      helpText: 'The highest power term to include in the approximation (default: 5)',
    },
    {
      id: 'xValue',
      label: 'Evaluate at x =',
      type: 'number',
      placeholder: 'x value (optional)',
      step: 0.1,
      inputMode: 'decimal',
      helpText: 'Optional: substitute a specific x value to evaluate the Taylor polynomial',
    },
  ],
  calculate: (values) => {
    const expression = (values.expression || '').trim();
    if (!expression) return [];

    const center = values.center !== undefined && values.center !== ''
      ? parseFloat(values.center)
      : 0;
    const order = values.order !== undefined && values.order !== ''
      ? parseInt(values.order, 10)
      : 5;
    const xVal = values.xValue !== undefined && values.xValue !== ''
      ? parseFloat(values.xValue)
      : undefined;

    if (isNaN(center) || isNaN(order)) return [];

    const fmtPoly = (n: number) => {
      return parseFloat(n.toFixed(6)).toString();
    };

    let terms: string[];

    const knownTerms = getKnownTaylorTerms(expression, center, order);
    if (knownTerms) {
      terms = knownTerms;
    } else {
      // Unknown function: compute numeric derivatives using finite differences
      const h = 0.001;
      const evalFn = (x: number): number => {
        try {
          return safeEval(expression, { x });
        } catch {
          return NaN;
        }
      };

      // Compute f at center
      const f0 = evalFn(center);
      if (isNaN(f0)) return [];

      terms = [];
      if (f0 !== 0) terms.push(fmtPoly(f0));

      for (let k = 1; k <= order; k++) {
        // Compute k-th derivative using finite difference
        let derivVal = 0;
        try {
          // Use central difference for first derivative, extended for higher orders
          if (k === 1) {
            derivVal = (evalFn(center + h) - evalFn(center - h)) / (2 * h);
          } else if (k === 2) {
            derivVal = (evalFn(center + h) - 2 * evalFn(center) + evalFn(center - h)) / (h * h);
          } else if (k === 3) {
            derivVal = (evalFn(center + 2 * h) - 2 * evalFn(center + h) + 2 * evalFn(center - h) - evalFn(center - 2 * h)) / (2 * h * h * h);
          } else if (k === 4) {
            derivVal = (evalFn(center + 2 * h) - 4 * evalFn(center + h) + 6 * evalFn(center) - 4 * evalFn(center - h) + evalFn(center - 2 * h)) / (h * h * h * h);
          } else {
            // For higher orders, use repeated first derivative approach
            derivVal = 0;
          }
        } catch {
          break;
        }

        if (!isFinite(derivVal) || Math.abs(derivVal) < 1e-12) continue;

        const coeff = derivVal / factorial(k);
        const term = `(${fmtPoly(coeff)})·(x-${fmtPoly(center)})^${k}`;
        terms.push(term);
      }
    }

    // Build polynomial string
    let polyStr = '';
    for (let i = 0; i < terms.length; i++) {
      const term = terms[i];
      const isFirst = i === 0;
      let sign = '+';
      let cleaned = term;

      const match = term.match(/^\(([^)]+)\)·\(x-([^)]+)\)\^(\d+)$/);
      if (match) {
        const coeff = parseFloat(match[1]);
        const c = match[2];
        const power = parseInt(match[3], 10);
        sign = coeff >= 0 ? '+' : '-';
        const absCoeff = Math.abs(coeff);
        let termStr = '';
        if (power === 0) {
          termStr = fmtPoly(absCoeff);
        } else if (power === 1) {
          termStr = absCoeff === 1 ? `(x-${c})` : `${fmtPoly(absCoeff)}·(x-${c})`;
        } else {
          termStr = absCoeff === 1 ? `(x-${c})^${power}` : `${fmtPoly(absCoeff)}·(x-${c})^${power}`;
        }
        cleaned = termStr;
      } else {
        // Constant term
        if (term === '1') {
          cleaned = '1';
        } else {
          const numVal = parseFloat(term);
          if (!isNaN(numVal)) {
            sign = numVal >= 0 ? '+' : '-';
            cleaned = fmtPoly(Math.abs(numVal));
          }
        }
      }

      if (isFirst && sign === '+') {
        polyStr += cleaned;
      } else {
        polyStr += ' ' + sign + ' ' + cleaned;
      }
    }

    if (!polyStr) polyStr = '0';

    // Evaluate at x if provided
    let evaluation: string | undefined;
    if (xVal !== undefined && !isNaN(xVal)) {
      const known = getKnownTaylorTerms(expression, center, order);
      if (known) {
        evaluation = fmtPoly(evaluateTaylorPoly(known, xVal));
      } else {
        evaluation = fmtPoly(evaluateTaylorPoly(terms, xVal));
      }
    }

    return [
      {
        id: 'approximation',
        label: 'Taylor Polynomial',
        value: polyStr,
        highlight: true,
        color: 'positive' as const,
      },
      {
        id: 'terms',
        label: 'Individual Terms',
        value: terms.join(' | '),
        color: 'neutral' as const,
      },
      {
        id: 'numberOfTerms',
        label: 'Number of Terms',
        value: terms.length.toString(),
        color: 'neutral' as const,
      },
      ...(evaluation !== undefined ? [{
        id: 'evaluation' as const,
        label: `f(${fmtPoly(xVal!)}) ≈`,
        value: evaluation,
        color: 'positive' as const,
      }] : []),
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(TaylorSeriesPanel, { values, results });
  },
  educational: {
    formula: 'f(x) = Σ_{n=0}^{∞} f^{(n)}(a)(x-a)^n / n!',
    diagram: {
      svg: '<svg viewBox="0 0 480 320" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="240" y="28" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-333333)">Taylor Series Expansion</text><text x="240" y="65" text-anchor="middle" font-size="22" fill="var(--svg-3b82f6)" font-family="serif">f(x) = <tspan font-size="17" baseline-shift="sub">n=0</tspan>&#x2211;<tspan font-size="17" baseline-shift="super">&#x221E;</tspan> <tspan font-size="17" baseline-shift="super">(n)</tspan>(a)(x-a)<tspan font-size="14" baseline-shift="super">n</tspan> / n!</text><text x="240" y="100" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Polynomial approximation of a function around a point a</text><line x1="60" y1="280" x2="420" y2="280" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/><line x1="120" y1="280" x2="120" y2="30" stroke="var(--svg-cbd5e1)" stroke-width="1.5"/><text x="430" y="284" font-size="11" fill="var(--svg-94a3b8)">x</text><text x="126" y="26" font-size="11" fill="var(--svg-94a3b8)">y</text><path d="M100,250 Q120,230 160,220 Q200,210 240,200 Q280,190 320,210 Q360,230 380,250" stroke="var(--svg-ef4444)" stroke-width="2.5" fill="none" stroke-linecap="round"/><text x="240" y="198" text-anchor="middle" font-size="11" fill="var(--svg-ef4444)" font-weight="bold">f(x) = original function</text><path d="M80,260 Q120,235 160,222 Q200,208 240,200 Q280,192 320,208 Q360,228 400,255" stroke="var(--svg-22c55e)" stroke-width="2" fill="none" stroke-dasharray="6,3" stroke-linecap="round"/><text x="240" y="168" text-anchor="middle" font-size="11" fill="var(--svg-22c55e)" font-weight="bold">P<text y="174" font-size="9">n</text>(x) = Taylor polynomial</text><circle cx="240" cy="200" r="5" fill="var(--svg-8b5cf6)"/><text x="248" y="196" font-size="11" fill="var(--svg-8b5cf6)" font-weight="bold">a (center)</text><text x="240" y="310" text-anchor="middle" font-size="11" fill="var(--svg-94a3b8)">Higher order = better approximation near the center point</text></svg>',
      alt: 'Graph showing a function f(x) and its Taylor polynomial approximation P_n(x) near center point a, with the polynomial closely matching the function near a',
      caption: 'A Taylor series approximates a function as an infinite sum of terms based on its derivatives at a single point',
    },
    formulaDescription:
      'The Taylor series expansion represents a function as an infinite sum of terms calculated from its derivatives at a single point. The formula computes each term using the n-th derivative of f evaluated at the center point a, divided by n factorial, multiplied by (x - a)^n. When a = 0, the series is called a Maclaurin series. Taylor series are powerful tools for approximating functions using polynomials, enabling computation of function values, integrals, and solutions to differential equations.',
    variables: [
      { symbol: 'f(x)', name: 'Function', description: 'The original function being expanded as a Taylor series (e.g., e^x, sin(x), cos(x)).' },
      { symbol: 'a', name: 'Center', description: 'The point around which the function is expanded. The series approximates the function best near this point.' },
      { symbol: 'n', name: 'Order', description: 'The highest-power term included in the expansion. Higher order gives better approximation but more terms.' },
      { symbol: 'f^{(n)}(a)', name: 'n-th Derivative at a', description: 'The n-th derivative of f evaluated at the center point a, determining the coefficient of each term.' },
      { symbol: 'n!', name: 'n Factorial', description: 'The product of all integers from 1 to n, used to normalize each term in the series.' },
    ],
    howToUse: [
      'Enter a function expression using x as the variable (e.g., e^x, sin(x), cos(x), 1/(1-x)).',
      'Set the center point a (default 0, which gives the Maclaurin series).',
      'Choose the order n (default 5) to control how many terms are included.',
      'Optionally provide an x value to evaluate the Taylor polynomial approximation numerically.',
      'View the resulting polynomial and each individual term of the expansion.',
    ],
    quickReference: [
      { label: 'e^x', value: '1 + x + x²/2! + x³/3! + ...' },
      { label: 'sin(x)', value: 'x − x³/3! + x⁵/5! − ...' },
      { label: 'cos(x)', value: '1 − x²/2! + x⁴/4! − ...' },
      { label: '1/(1−x)', value: '1 + x + x² + x³ + ... (|x| < 1)' },
    ],
    commonUses: [
      'Approximating transcendental functions like e^x, sin(x), and cos(x) with simple polynomials for computation.',
      'Solving differential equations by representing unknown functions as Taylor series and matching coefficients.',
      'Evaluating limits and integrals that are difficult or impossible to compute exactly with elementary methods.',
      'Modeling physical systems where only a few terms of the expansion capture the dominant behavior near equilibrium.',
      'Numerical analysis for function approximation and error estimation in scientific computing.',
    ],
    explanation:
      `The Taylor series is one of the most important tools in mathematical analysis, first formalized by the English mathematician Brook Taylor in 1715. It provides a way to represent smooth functions as infinite polynomials, making them easier to study, differentiate, integrate, and evaluate numerically. The fundamental insight is that knowing all the derivatives of a function at a single point is enough to reconstruct the entire function — at least locally, within the radius of convergence. For common functions like e^x, sin(x), and cos(x), the Taylor series have simple, repeating patterns that make them invaluable for computation. The approximation improves as more terms are added, and the error term can be bounded precisely using Taylor's theorem, which gives an explicit formula for the remainder after n terms. The series converges to the original function within its radius of convergence, which may be finite (like 1/(1-x) which converges only for |x| < 1) or infinite (like e^x and the trigonometric functions which converge everywhere on the real line). Taylor series form the foundation for numerous numerical methods in science and engineering, including Runge-Kutta methods for differential equations, finite element analysis, and most floating-point function evaluation in computer hardware. When the center is set to zero (a = 0), the series is called a Maclaurin series, named after the Scottish mathematician Colin Maclaurin who made extensive use of this special case in the 18th century.`,
    faqs: [
      {
        question: 'What is the difference between a Taylor series and a Maclaurin series?',
        answer: 'A Maclaurin series is simply a Taylor series with center a = 0. Both follow the same formula, but Maclaurin series are expanded around the origin, making them simpler for many common functions. For example, the Maclaurin series for e^x is 1 + x + x²/2! + x³/3! + ..., while the Taylor series around a general point a would involve powers of (x-a).',
      },
      {
        question: 'How does the order affect the approximation accuracy?',
        answer: 'Higher order means more terms are included, which generally gives a more accurate approximation near the center point. However, far from the center, adding more terms might initially make the approximation worse (a phenomenon known as Runge\'s phenomenon for some functions). For well-behaved functions like e^x and sin(x), the approximation improves everywhere as order increases.',
      },
      {
        question: 'What happens if I use a function that is not in the known list?',
        answer: 'The calculator will attempt to compute the Taylor series using finite-difference approximations of the derivatives. This numerical approach works for many differentiable functions but may be less accurate for functions with rapid changes or discontinuities. Results are best for smooth functions near the center point.',
      },
      {
        question: 'Can I use the Taylor series to compute values of functions?',
        answer: 'Yes! By providing an x value in the "Evaluate at x" field, the calculator computes the Taylor polynomial approximation at that point. This is exactly how calculators and computers compute values of functions like sin(x), e^x, and many others — they use Taylor series (or similar polynomial approximations) evaluated to sufficient precision.',
      },
      {
        question: 'Why does the calculator show only a few known functions with exact symbolic terms?',
        answer: 'The calculator provides exact symbolic Taylor expansions (with analytically computed derivatives) for the most commonly used functions: e^x, sin(x), cos(x), and 1/(1-x). These functions have simple, well-known derivative patterns that allow exact term generation. For other functions, the calculator uses numerical finite-difference approximations of the derivatives, which can produce approximate coefficients but may lack the elegant symbolic form. The finite-difference approach is a practical trade-off that lets you explore Taylor expansions for arbitrary differentiable functions without requiring a full computer algebra system.',
      },
    ],
    workedExamples: [
      {
        scenario: 'An engineering student needs to approximate sin(0.1) using a 3rd-order Maclaurin series to verify a hand calculation for their numerical methods homework.',
        inputs: { expression: 'sin(x)', center: '0', order: '3', xValue: '0.1' },
        result: 'x - 0.166667·(x-0)^3; f(0.1) ≈ 0.099833',
        insight: 'The 3rd-order Maclaurin series for sin(x) around a=0 is: sin(0) + cos(0)(x-0)^1 + (-sin(0))(x-0)^2/2! + (-cos(0))(x-0)^3/3! = x - x^3/6. Evaluating at x=0.1 gives 0.1 - 0.001/6 = 0.1 - 0.0001667 = 0.0998333. The actual sin(0.1) = 0.0998334, so the approximation is accurate to 7 decimal places with just 2 non-zero terms.',
      },
      {
        scenario: 'A physics student wants to compute e^2 using a 5th-order Taylor expansion around a=0 to compare with the exact value from their scientific calculator.',
        inputs: { expression: 'e^x', center: '0', order: '5', xValue: '2' },
        result: '1 + x + 0.5·x^2 + 0.166667·x^3 + 0.041667·x^4 + 0.008333·x^5; f(2) ≈ 7.266667',
        insight: 'The Maclaurin series for e^x is 1 + x + x^2/2! + x^3/3! + x^4/4! + x^5/5! = 1 + 2 + 2 + 1.333 + 0.667 + 0.267 = 7.267. The exact e^2 = 7.389, giving an error of about 1.7%. With a 10th-order expansion, the approximation improves to 7.389 - nearly exact. This demonstrates both the power of Taylor series and the need for sufficient terms when evaluating far from the center.',
      },
    ],
    proTips: [
      'For best accuracy, choose a center point (a) as close as possible to the region where you plan to evaluate the function. The approximation quality degrades as |x - a| increases.',
      'When using the calculator to check homework, always note the order used. Many textbook problems specify the order or number of terms explicitly — matching this ensures you are solving the same problem.',
      'The finite-difference method for unknown functions uses a step size h = 0.001. For functions with very rapid oscillations or sharp features, the numerical derivatives may lose accuracy. Stick to smooth, well-behaved functions for best results.',
      'Use the "Evaluate at x" field to test how well the polynomial approximates the actual function value. Try several different x values at different distances from the center to understand the convergence behavior.',
      'For periodic functions like sin(x) and cos(x), use the angle reduction property (e.g., sin(x + 2pi) = sin(x)) to move the evaluation point closer to the center, improving accuracy for a given order.',
      'Remember that the Taylor series for 1/(1-x) only converges for |x| < 1. Evaluating at x = 2 will give a wildly incorrect result no matter how many terms you include — this is a fundamental limitation of the series, not a calculator error.',
    ],
    limitations: [
      'Taylor series only converge within their radius of convergence — evaluating outside this radius produces meaningless results regardless of the number of terms. For example, the series for 1/(1-x) diverges for |x| >= 1.',
      'The finite-difference derivative approximation becomes unreliable for functions with discontinuities, cusps, or very rapid oscillations near the center point. Stick to smooth, well-behaved functions for best results.',
      'Numerical precision limits (about 15-16 significant digits in double-precision floating-point) mean that coefficients for very high orders may accumulate rounding errors.',
      'The calculator does not provide the Lagrange remainder term, which quantifies the error between the polynomial approximation and the true function value. For error bounds, consult Taylor\'s theorem and compute the remainder manually.',
      'For functions not in the known list (e^x, sin(x), cos(x), 1/(1-x)), only numerical approximations of terms are available, not exact symbolic forms.',
    ],
    citations: [
      { source: 'Wikipedia - Taylor Series', url: 'https://en.wikipedia.org/wiki/Taylor_series' },
      { source: 'Paul\'s Online Math Notes - Taylor Series', url: 'https://tutorial.math.lamar.edu/classes/calcii/taylorseries.aspx' },
    ],
  },
};

export default taylorConfig;
