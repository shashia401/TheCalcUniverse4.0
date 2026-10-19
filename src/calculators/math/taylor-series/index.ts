import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import TaylorSeriesPanel from './TaylorSeriesPanel';
import { CasError, type Node, evalNode, parse, taylorCoefficients } from '../shared/cas';
import { parseNumberStrict } from '../../../utils/parseNumber';
import { MAX_ORDER, evalTaylor, ratApprox } from './taylorFormat';
import { resultValue } from '../../../utils/explainResults';

const numStr = (v: number): string => String(Number(v.toPrecision(10)));

/** One term "c_k (x - a)^k" as text, without its sign. */
function termText(c: number, k: number, a: number): string {
  const v = a === 0 ? 'x' : a > 0 ? `(x - ${numStr(a)})` : `(x + ${numStr(-a)})`;
  const mono = k === 0 ? '' : k === 1 ? v : `${v}^${k}`;
  const r = ratApprox(Math.abs(c));
  if (!r) {
    const d = String(Number(Math.abs(c).toPrecision(6)));
    return k === 0 ? d : `${d}*${mono}`;
  }
  const [p, q] = r;
  if (k === 0) return q === 1 ? `${p}` : `${p}/${q}`;
  if (q === 1) return p === 1 ? mono : `${p}*${mono}`;
  return p === 1 ? `${mono}/${q}` : `${p}*${mono}/${q}`;
}

const taylorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'expression',
      label: 'Function f(x)',
      type: 'text',
      placeholder: 'e.g. e^x, sin(x), ln(1+x), 1/(1-x)',
      required: true,
      helpText:
        'Any function of x built from + - * / ^, sin cos tan asin acos atan sinh cosh tanh exp ln log sqrt, and the constants pi and e. Coefficients are exact derivatives f^(k)(a)/k!, not finite differences.',
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
      min: 0,
      max: MAX_ORDER,
      inputMode: 'numeric',
      helpText: `The highest power term to include in the approximation, 0 to ${MAX_ORDER} (default: 5)`,
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

    const blank = (s?: string) => (s ?? '').trim() === '';
    const center = blank(values.center) ? 0 : parseNumberStrict(values.center);
    const order = blank(values.order) ? 5 : parseNumberStrict(values.order);
    const xVal = blank(values.xValue) ? undefined : parseNumberStrict(values.xValue);
    if (!Number.isFinite(center) || !Number.isInteger(order) || order < 0) return [];
    const n = Math.min(order, MAX_ORDER);

    let tree: Node;
    try {
      tree = parse(expression);
    } catch (e) {
      if (e instanceof CasError) return [];
      throw e;
    }

    let coeffs: number[];
    try {
      coeffs = taylorCoefficients(tree, center, n);
    } catch (e) {
      if (e instanceof CasError) {
        return [{ id: 'approximation', label: 'Taylor Polynomial', value: `Not available: ${e.message}`, color: 'negative' }];
      }
      throw e;
    }

    // Rounding noise (1e-17 where the exact coefficient is 0) must not become a term: a coefficient counts as
    // zero when it is negligible next to its neighbours (relative test, so genuinely tiny ones like 1/20! survive).
    const c = coeffs.map((v, k) => {
      const near = Math.max(...[k - 2, k - 1, k + 1, k + 2].map((j) => (j >= 0 && j < coeffs.length ? Math.abs(coeffs[j]) : 0)));
      return Math.abs(v) <= 2e-15 * near ? 0 : v;
    });

    const terms: { text: string; neg: boolean }[] = [];
    c.forEach((v, k) => {
      if (v !== 0) terms.push({ text: termText(v, k, center), neg: v < 0 });
    });

    const polyStr = terms.length
      ? terms.map((t, i) => (i === 0 ? (t.neg ? `-${t.text}` : t.text) : `${t.neg ? '-' : '+'} ${t.text}`)).join(' ')
      : '0';

    const results: CalculatorResult[] = [
      { id: 'approximation', label: 'Taylor Polynomial', value: polyStr, highlight: true, color: 'positive' },
      { id: 'terms', label: 'Individual Terms', value: terms.length ? terms.map((t) => `${t.neg ? '-' : ''}${t.text}`).join(' | ') : '0', color: 'neutral' },
      { id: 'numberOfTerms', label: 'Number of Terms', value: terms.length.toString(), color: 'neutral' },
    ];

    if (xVal !== undefined && Number.isFinite(xVal)) {
      const p = evalTaylor(c, center, xVal);
      const f = evalNode(tree, xVal);
      results.push({ id: 'evaluation', label: `P${n}(${numStr(xVal)}) ≈`, value: numStr(p), color: 'positive' });
      if (Number.isFinite(f)) {
        results.push({ id: 'actual', label: `f(${numStr(xVal)}) (exact function value)`, value: numStr(f), color: 'neutral' });
        results.push({ id: 'error', label: 'Approximation error |f − P|', value: numStr(Math.abs(f - p)), color: 'neutral' });
      }
    }
    return results;
  },
  explainSteps: (values) => {
    const rows = taylorConfig.calculate(values);
    if (rows.length === 0) return []; // not hasAnswer(): this calculator's 'error' row is the approximation error, not a failure
    const g = (id: string) => resultValue(rows, id) ?? '';
    const poly = g('approximation');
    if (poly.startsWith('Not available')) return [];
    const blank = (s?: string) => (s ?? '').trim() === '';
    const a = blank(values.center) ? 0 : parseNumberStrict(values.center);
    const order = blank(values.order) ? 5 : parseNumberStrict(values.order);
    const n = Math.min(order, MAX_ORDER);
    const base = a === 0 ? 'x' : a > 0 ? `(x − ${numStr(a)})` : `(x + ${numStr(-a)})`;
    const ev = rows.find((r) => r.id === 'evaluation');
    return [
      { label: 'Each term is the k-th derivative at the centre divided by k!, times a power of the distance from the centre', expr: `P${n}(x) = Σ f⁽ᵏ⁾(${numStr(a)}) ÷ k! × ${base}ᵏ,  k = 0 … ${n}` },
      { label: 'Keep the terms whose coefficient is not zero', expr: g('terms').split(' | ').join(',  '), note: `${g('numberOfTerms')} nonzero term${g('numberOfTerms') === '1' ? '' : 's'}` },
      { label: 'Add them up', expr: `P${n}(x) = ${poly}` },
      ...(ev ? [{ label: 'Plug in x and compare with the true value of the function', expr: `${ev.label} ${ev.value};  f = ${g('actual')};  |f − P| = ${g('error')}` }] : []),
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
        question: 'Which functions are supported, and how accurate are the coefficients?',
        answer: 'Any function built from + - * / ^, sin, cos, tan, asin, acos, atan, sinh, cosh, tanh, exp, ln, log, sqrt, abs and the constants pi and e, e.g. e^x, ln(1+x), 1/(1-x), x*exp(x), tan(x), (1+x)^(1/3). The coefficients f^(k)(a)/k! are computed exactly by power-series arithmetic (not finite differences), and shown as fractions when they are rational (x - x^3/6 + x^5/120 for sin x). Expansions are refused, with a message, where the function is not analytic at the centre (for example ln(x) or sqrt(x) at 0, or 1/x at 0).',
      },
      {
        question: 'Can I use the Taylor series to compute values of functions?',
        answer: 'Yes! By providing an x value in the "Evaluate at x" field, the calculator computes the Taylor polynomial approximation at that point. This is exactly how calculators and computers compute values of functions like sin(x), e^x, and many others — they use Taylor series (or similar polynomial approximations) evaluated to sufficient precision.',
      },
      {
        question: 'Why are some coefficients decimals instead of fractions?',
        answer: 'A coefficient is printed as a fraction p/q when it equals one to 13 significant digits (denominator up to 5,000,000, enough for 1/10!). Coefficients that involve irrational numbers, such as those of e^x around a = 1 (powers of e divided by k!) or sin(x) around a = 1, are printed as decimals with 6 significant digits.',
      },
    ],
    workedExamples: [
      {
        scenario: 'An engineering student needs to approximate sin(0.1) using a 3rd-order Maclaurin series to verify a hand calculation for their numerical methods homework.',
        inputs: { expression: 'sin(x)', center: '0', order: '3', xValue: '0.1' },
        result: 'x - x^3/6; P3(0.1) ≈ 0.099833; f(0.1) = 0.099833',
        insight: 'The 3rd-order Maclaurin series for sin(x) around a=0 is: sin(0) + cos(0)(x-0)^1 + (-sin(0))(x-0)^2/2! + (-cos(0))(x-0)^3/3! = x - x^3/6. Evaluating at x=0.1 gives 0.1 - 0.001/6 = 0.1 - 0.0001667 = 0.0998333. The actual sin(0.1) = 0.0998334, so the approximation is accurate to 7 decimal places with just 2 non-zero terms.',
      },
      {
        scenario: 'A physics student wants to compute e^2 using a 5th-order Taylor expansion around a=0 to compare with the exact value from their scientific calculator.',
        inputs: { expression: 'e^x', center: '0', order: '5', xValue: '2' },
        result: '1 + x + x^2/2 + x^3/6 + x^4/24 + x^5/120; P5(2) ≈ 7.266667; f(2) = 7.389056',
        insight: 'The Maclaurin series for e^x is 1 + x + x^2/2! + x^3/3! + x^4/4! + x^5/5! = 1 + 2 + 2 + 1.333 + 0.667 + 0.267 = 7.267. The exact e^2 = 7.389, giving an error of about 1.7%. With a 10th-order expansion, the approximation improves to 7.389 - nearly exact. This demonstrates both the power of Taylor series and the need for sufficient terms when evaluating far from the center.',
      },
    ],
    proTips: [
      'For best accuracy, choose a center point (a) as close as possible to the region where you plan to evaluate the function. The approximation quality degrades as |x - a| increases.',
      'When using the calculator to check homework, always note the order used. Many textbook problems specify the order or number of terms explicitly — matching this ensures you are solving the same problem.',
      'Use the "Evaluate at x" field to test how well the polynomial approximates the actual function value. Try several different x values at different distances from the center to understand the convergence behavior.',
      'For periodic functions like sin(x) and cos(x), use the angle reduction property (e.g., sin(x + 2pi) = sin(x)) to move the evaluation point closer to the center, improving accuracy for a given order.',
      'Remember that the Taylor series for 1/(1-x) only converges for |x| < 1. Evaluating at x = 2 will give a wildly incorrect result no matter how many terms you include — this is a fundamental limitation of the series, not a calculator error.',
    ],
    limitations: [
      'Taylor series only converge within their radius of convergence — evaluating outside this radius produces meaningless results regardless of the number of terms. For example, the series for 1/(1-x) diverges for |x| >= 1.',
      'The coefficients are exact derivatives, but a Taylor polynomial is only a local approximation: far from the centre (or outside the radius of convergence) the error can be large, which is why the actual function value and the error are shown next to the polynomial value.',
      'Numerical precision limits (about 15-16 significant digits in double-precision floating-point) mean that coefficients for very high orders may accumulate rounding errors.',
      'The calculator does not provide the Lagrange remainder term, which quantifies the error between the polynomial approximation and the true function value. For error bounds, consult Taylor\'s theorem and compute the remainder manually.',
      'Only functions of the single variable x are supported, and the centre must be a point where the function is analytic (smooth with a convergent series).',
    ],
    citations: [
      { source: 'Wikipedia - Taylor Series', url: 'https://en.wikipedia.org/wiki/Taylor_series' },
      { source: 'Paul\'s Online Math Notes - Taylor Series', url: 'https://tutorial.math.lamar.edu/classes/calcii/taylorseries.aspx' },
    ],
  },
};

export default taylorConfig;
