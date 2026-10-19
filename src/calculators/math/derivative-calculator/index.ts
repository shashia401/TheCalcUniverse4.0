import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import DerivativePanel from './DerivativePanel';
import { CasError, type Node, derivativeOrder, evalNode, hasVar, parse, show, simplify } from '../shared/cas';
import { parseNumberStrict } from '../../../utils/parseNumber';
import type { ExplainStep } from '../../../types/calculator';
import { hasAnswer, resultValue } from '../../../utils/explainResults';

/** Plain-language list of the differentiation rules the expression needs (shown as the "steps"). */
function rulesUsed(n: Node, out = new Set<string>()): Set<string> {
  switch (n.t) {
    case 'add':
      out.add('sum rule');
      n.a.forEach((m) => rulesUsed(m, out));
      break;
    case 'mul': {
      const dep = n.a.filter(hasVar);
      const isDiv = n.a.some((m) => m.t === 'pow' && hasVar(m.b) && m.e.t === 'num' && m.e.v < 0);
      if (isDiv && dep.length > 1) out.add('quotient rule');
      else if (dep.length > 1) out.add('product rule');
      else if (dep.length === 1) out.add('constant multiple rule');
      n.a.forEach((m) => rulesUsed(m, out));
      break;
    }
    case 'pow':
      if (hasVar(n.e)) out.add('exponential/logarithmic differentiation (u^v)');
      else if (n.b.t === 'var') out.add('power rule');
      else if (hasVar(n.b)) {
        out.add('power rule');
        out.add('chain rule');
      }
      rulesUsed(n.b, out);
      rulesUsed(n.e, out);
      break;
    case 'fn':
      out.add(`${n.name} rule`);
      if (n.arg.t !== 'var') out.add('chain rule');
      rulesUsed(n.arg, out);
      break;
    default:
  }
  return out;
}

const numStr = (v: number): string => String(Number(v.toPrecision(12)));
const primes = (k: number) => `f${"'".repeat(k)}(x)`;

const derivativeConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'expression',
      label: 'Function f(x)',
      type: 'text',
      placeholder: 'e.g. 3x^2 + 2x + 1 or x^2*sin(x)',
      required: true,
      helpText:
        'Use x as the variable. Supports + - * / ^, implicit products (3x, 2(x+1)), sin cos tan asin acos atan sinh cosh tanh exp ln log (base 10) sqrt abs, and the constants pi and e. Example: x^3 - 4x^2 + 5x - 2 or e^(-x^2).',
    },
    {
      id: 'order',
      label: 'Derivative order',
      type: 'select',
      defaultValue: '1',
      options: [
        { label: "First derivative f'(x)", value: '1' },
        { label: "Second derivative f''(x)", value: '2' },
        { label: "Third derivative f'''(x)", value: '3' },
        { label: 'Fourth derivative', value: '4' },
      ],
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
    if (!expression) return [];
    const order = Math.min(4, Math.max(1, Number(values.order) || 1));

    let tree: Node;
    let d: Node;
    try {
      tree = parse(expression);
      d = derivativeOrder(tree, order);
    } catch (e) {
      if (e instanceof CasError) return [];
      throw e;
    }

    const results: CalculatorResult[] = [
      { id: 'derivative', label: primes(order), value: show(d), highlight: true, color: 'positive' },
      { id: 'original', label: 'f(x)', value: show(simplify(tree)) },
    ];

    // Step-by-step: rules needed, then each successive derivative.
    const rules = [...rulesUsed(simplify(tree))];
    const steps = [`Rules used: ${rules.length ? rules.join(', ') : 'constant rule (f is constant)'}`];
    for (let k = 1; k <= order; k++) steps.push(`${primes(k)} = ${show(derivativeOrder(tree, k))}`);
    results.push({ id: 'steps', label: 'Step-by-Step', value: steps.join('\n') });

    if ((values.xValue ?? '').trim() !== '') {
      const xv = parseNumberStrict(values.xValue);
      if (Number.isFinite(xv)) {
        // f itself must be defined at x (1/x -> -1 at x = -1 would otherwise be reported for ln(x), which has no value there).
        const y = Number.isFinite(evalNode(tree, xv)) ? evalNode(d, xv) : NaN;
        results.push({
          id: 'evaluated',
          label: primes(order).replace('(x)', `(${numStr(xv)})`),
          value: Number.isFinite(y) ? numStr(y) : 'Undefined at this x (outside the domain or no finite slope)',
        });
      }
    }
    return results;
  },

  educational: {
    formula: "f'(x) = d/dx(a·x^n) = a·n·x^(n−1);  (uv)' = u'v + uv';  (u/v)' = (u'v − uv')/v²;  (f∘g)' = f'(g)·g'",
    formulaDescription:
      'The derivative is computed exactly (symbolically), not numerically. The sum, constant-multiple, power, product, quotient and chain rules are applied together with the standard derivatives of sin, cos, tan, asin, acos, atan, sinh, cosh, tanh, e^u, ln and log10, sqrt and abs. For polynomials this reduces to the power rule: the derivative of a·x^n is a·n·x^(n−1). The result is then simplified (like terms and powers are combined). Higher orders repeat the process.',
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
      'Enter f(x) using x as the variable and ^ for powers. Examples: "3x^2 + 2x + 1", "x^2*sin(x)", "(x^2+1)/(x-3)", "e^(-x^2)", "ln(x^2+1)". Products like 3x and 2(x+1) may omit the * sign.',
      'The calculator differentiates with the sum, constant-multiple, product, quotient, power and chain rules plus the derivatives of trigonometric, exponential and logarithmic functions, then simplifies the result. Choose the derivative order (1 to 4) to repeat the process.',
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
      'The derivative is one of the two central concepts in calculus (the other being integration). It measures the instantaneous rate of change of a function with respect to its variable. The power rule — d/dx(x^n) = n·x^(n-1) — is the first differentiation rule most students learn, and it handles polynomials efficiently. For a term like 3x^4, the derivative is 3·4·x^(4-1) = 12x^3. The coefficient (3) carries through, the exponent (4) drops down as a multiplier, and the new exponent is one less (3). This works for any real exponent, including fractions and negatives (x^(1/2), x^(-3)). The derivative of a sum is the sum of the derivatives, so we can differentiate term by term. The constant rule states that the derivative of a constant is zero — constants do not change, so their rate of change is zero. Geometrically, the derivative at a point gives the slope of the tangent line to the curve at that point. If f\'(x) > 0, the function is increasing (going up) at x. If f\'(x) < 0, the function is decreasing (going down). If f\'(x) = 0, the function has a horizontal tangent, which may indicate a local maximum, local minimum, or saddle point (inflection). The second derivative, f"\'(x), measures the rate of change of the rate of change — it tells us about concavity. If f"\'(x) > 0, the graph is concave up (like a cup, holding water). If f"\'(x) < 0, it is concave down (like a frown). The power rule is the foundation for polynomial calculus. Combined with the product rule, quotient rule, chain rule, and trigonometric/exponential rules (all implemented here), it enables differentiation of almost any function encountered in applied mathematics.',
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
        answer: 'Yes. Trigonometric (sin, cos, tan and inverses), hyperbolic, exponential (e^x, a^x), logarithmic (ln, log base 10), sqrt, abs, products, quotients, powers and compositions are all supported, e.g. x^2*sin(x), (x^2+1)/(x-3), e^(-x^2), x^x. The answer is a closed-form expression, checked against SymPy. Implicit differentiation, partial derivatives and piecewise functions are not supported.',
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
        answer: 'No. This calculator differentiates explicit functions of a single variable x. Implicit differentiation (where y is defined implicitly by an equation like x^2 + y^2 = 25) and partial derivatives (functions of several variables) require other techniques.',
      },
    ],
    citations: [
      { source: 'Wolfram MathWorld — Power Rule', url: 'https://mathworld.wolfram.com/PowerRule.html' },
      { source: 'Khan Academy — Derivative Rules', url: 'https://www.khanacademy.org/math/differential-calculus/dc-diff-intro/dc-basic-diff-rules/a/basic-differentiation-rules-review' },
    ],
  },
  explainSteps: (values) => {
    const rows = derivativeConfig.calculate(values);
    if (!hasAnswer(rows)) return [];
    const lines = (resultValue(rows, 'steps') ?? '').split('\n').filter(Boolean);
    if (lines.length < 2) return [];
    const [rules, ...ders] = lines;
    const out: ExplainStep[] = [{ label: 'Pick the differentiation rules the function needs', expr: rules.replace(/^Rules used:\s*/, '') }];
    ders.forEach((l, i) => out.push({ label: ders.length > 1 ? `Differentiate (derivative number ${i + 1})` : 'Differentiate', expr: l }));
    const ev = rows.find((r) => r.id === 'evaluated');
    if (ev) out.push({ label: 'Evaluate at the chosen x', expr: `${ev.label} = ${ev.value}` });
    return out;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(DerivativePanel, { values, results });
  },
};

export default derivativeConfig;
