import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import EquationSolverPanel from './EquationSolverPanel';
import { solveQuadratic, equationText, fmtF, fmtN } from '../quadratic/quadraticMath';
import { polyString } from '../polynomial-calculator/polyMath';
import { polyRoots, type Root } from '../shared/polyRoots';
import { divFrac, fracToNumber, makeFrac, parseDecimalExact, type Frac } from '../../../utils/rational';

const DEGREE: Record<string, number> = { linear: 1, quadratic: 2, cubic: 3, quartic: 4 };

const fmtComplex = (re: number, im: number): string => {
  const r = fmtN(re);
  const m = fmtN(Math.abs(im));
  const i = m === '1' ? 'i' : `${m}i`;
  if (r === '0') return `${im < 0 ? '-' : ''}${i}`;
  return `${r} ${im < 0 ? '-' : '+'} ${i}`;
};

const rootText = (re: number, im: number) => (im === 0 ? fmtN(re) : fmtComplex(re, im));
const mult = (m: number) => (m === 1 ? '' : m === 2 ? ' (double root)' : m === 3 ? ' (triple root)' : ` (multiplicity ${m})`);

const equationSolverConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'equationType',
      label: 'Equation Type',
      type: 'select',
      options: [
        { label: 'Linear (ax + b = 0)', value: 'linear' },
        { label: 'Quadratic (ax² + bx + c = 0)', value: 'quadratic' },
        { label: 'Cubic (ax³ + bx² + cx + d = 0)', value: 'cubic' },
        { label: 'Quartic (ax⁴ + bx³ + cx² + dx + e = 0)', value: 'quartic' },
      ],
      required: true,
    },
    {
      id: 'a',
      label: 'Coefficient a',
      type: 'number',
      placeholder: '2',
      step: 0.001,
      required: true,
      helpText: 'The leading coefficient (of x, x², x³ or x⁴). If it is 0 the equation drops to a lower degree.',
    },
    {
      id: 'b',
      label: 'Coefficient b',
      type: 'number',
      placeholder: '-8',
      step: 0.001,
      required: true,
      helpText: 'The next coefficient: the constant for linear, the x coefficient for quadratic, the x² coefficient for cubic.',
    },
    {
      id: 'c',
      label: 'Coefficient c',
      type: 'number',
      placeholder: '6',
      step: 0.001,
      required: true,
      showWhen: (values) => values.equationType !== 'linear',
      helpText: 'The constant term for quadratic equations; the x coefficient for cubic and quartic.',
    },
    {
      id: 'd',
      label: 'Coefficient d',
      type: 'number',
      placeholder: '-1',
      step: 0.001,
      required: true,
      showWhen: (values) => values.equationType === 'cubic' || values.equationType === 'quartic',
      helpText: 'The constant term for cubic equations; the x coefficient for quartic.',
    },
    {
      id: 'e',
      label: 'Coefficient e',
      type: 'number',
      placeholder: '2',
      step: 0.001,
      required: true,
      showWhen: (values) => values.equationType === 'quartic',
      helpText: 'The constant term of the quartic.',
    },
  ],

  calculate: (values) => {
    const type = values.equationType;
    if (!type || !(type in DEGREE)) return [];
    const degree = DEGREE[type];
    const keys = ['a', 'b', 'c', 'd', 'e'].slice(0, degree + 1);
    const coeffs = keys.map((k) => parseDecimalExact(values[k], 60));
    if (coeffs.some((c) => c === null)) return [];
    const cs = coeffs as Frac[];
    const hide = (id: string, value: string): CalculatorResult => ({ id, label: id, value });

    // ── Linear: ax + b = 0 (exact) ──
    if (type === 'linear') {
      const [a, b] = cs;
      const eq = `${polyString([a, b])} = 0`;
      if (a.n === 0n) {
        return b.n === 0n
          ? [
              { id: 'equation', label: 'Equation', value: '0 = 0', highlight: true, color: 'neutral' },
              { id: 'nature', label: 'Nature', value: 'Infinitely many solutions (every x satisfies 0 = 0)', color: 'neutral' },
            ]
          : [
              { id: 'equation', label: 'Equation', value: `${fmtF(b)} = 0`, highlight: true, color: 'neutral' },
              { id: 'nature', label: 'Nature', value: 'No solution (a constant cannot equal 0)', color: 'negative' },
            ];
      }
      const x = divFrac(makeFrac(-b.n, b.d), a);
      return [
        { id: 'equation', label: 'Equation', value: eq, highlight: true, color: 'neutral' },
        { id: 'root1', label: 'Solution (x)', value: fmtF(x), highlight: true, color: 'positive' },
        { id: 'nature', label: 'Nature', value: 'One real root (linear)', color: 'neutral' },
        hide('_kind', 'linear'),
        hide('_realRoots', JSON.stringify([fracToNumber(x)])),
      ];
    }

    // ── Quadratic: exact discriminant, stable roots ──
    if (type === 'quadratic') {
      const res = solveQuadratic(values.a, values.b, values.c);
      if (res.kind === 'incomplete') return [];
      if (res.kind === 'linear') {
        return [
          { id: 'equation', label: 'Equation', value: `${polyString(cs)} = 0`, highlight: true, color: 'neutral' },
          { id: 'nature', label: 'Nature', value: res.message, color: 'neutral' },
        ];
      }
      const q = res.q;
      const out: CalculatorResult[] = [
        { id: 'equation', label: 'Equation', value: equationText(q), highlight: true, color: 'neutral' },
        {
          id: 'discriminant',
          label: 'Discriminant (b² − 4ac)',
          value: fmtF(q.disc),
          color: q.kind === 'two-real' ? 'positive' : q.kind === 'repeated' ? 'neutral' : 'negative',
        },
      ];
      if (q.kind === 'two-real') {
        out.push({ id: 'root1', label: 'Root x₁', value: q.exact ? fmtF(q.exact.x1) : fmtN(q.x1!), color: 'positive' });
        out.push({ id: 'root2', label: 'Root x₂', value: q.exact ? fmtF(q.exact.x2) : fmtN(q.x2!), color: 'positive' });
        out.push({ id: 'nature', label: 'Nature', value: 'Two distinct real roots', color: 'positive' });
      } else if (q.kind === 'repeated') {
        out.push({ id: 'root1', label: 'Root (repeated)', value: fmtF(q.exact!.x1), color: 'neutral' });
        out.push({ id: 'nature', label: 'Nature', value: 'One repeated real root', color: 'neutral' });
      } else {
        out.push({ id: 'root1', label: 'Root x₁ (complex)', value: fmtComplex(q.re!, q.im!), color: 'negative' });
        out.push({ id: 'root2', label: 'Root x₂ (complex)', value: fmtComplex(q.re!, -q.im!), color: 'negative' });
        out.push({ id: 'nature', label: 'Nature', value: 'Two complex conjugate roots', color: 'negative' });
      }
      if (q.surd) out.push({ id: 'exactForm', label: 'Exact form', value: `x = ${q.surd}`, color: 'neutral' });
      out.push(hide('_kind', q.kind));
      out.push(hide('_realRoots', JSON.stringify(q.kind === 'complex' ? [] : q.kind === 'repeated' ? [q.x1] : [q.x1, q.x2])));
      return out;
    }

    // ── Cubic / quartic: exact square-free factorisation + Aberth iteration ──
    const lead = cs[0];
    if (lead.n === 0n) {
      // Leading coefficient 0: report that the degree drops (the lower-degree equation is solved in its own mode).
      return [
        { id: 'equation', label: 'Equation', value: `${polyString(cs)} = 0`, highlight: true, color: 'neutral' },
        { id: 'nature', label: 'Nature', value: `a = 0, so this is not a ${type} equation: choose a lower degree and enter the remaining coefficients.`, color: 'neutral' },
      ];
    }
    if (cs.some((c) => !Number.isFinite(fracToNumber(c)))) return [];
    const roots: Root[] = polyRoots(cs);
    if (!roots.length) return [];

    const out: CalculatorResult[] = [{ id: 'equation', label: 'Equation', value: `${polyString(cs)} = 0`, highlight: true, color: 'neutral' }];
    let k = 0;
    let reals = 0;
    let complexPairs = 0;
    let repeated = false;
    const sub = (n: number) => '₀₁₂₃₄₅₆₇₈₉'[n] ?? String(n);
    for (const r of roots) {
      if (r.multiplicity > 1) repeated = true;
      if (r.im === 0) {
        reals += r.multiplicity;
        k++;
        out.push({ id: `root${k}`, label: `Root x${sub(k)}`, value: `${fmtN(r.re)}${mult(r.multiplicity)}`, color: 'positive' });
      } else {
        complexPairs += r.multiplicity;
        k++;
        out.push({ id: `root${k}`, label: `Root x${sub(k)} (complex)`, value: `${fmtComplex(r.re, r.im)}${mult(r.multiplicity)}`, color: 'negative' });
        k++;
        out.push({ id: `root${k}`, label: `Root x${sub(k)} (complex)`, value: `${fmtComplex(r.re, -r.im)}${mult(r.multiplicity)}`, color: 'negative' });
      }
    }
    const natureParts = [
      reals ? `${reals} real root${reals > 1 ? 's' : ''}${repeated ? ' (counted with multiplicity)' : ''}` : '',
      complexPairs ? `${2 * complexPairs} complex root${'s'} (${complexPairs} conjugate pair${complexPairs > 1 ? 's' : ''})` : '',
    ].filter(Boolean);
    out.push({ id: 'nature', label: 'Nature', value: natureParts.join(' + '), color: complexPairs ? 'negative' : 'positive' });
    out.push(hide('_kind', type));
    out.push(hide('_realRoots', JSON.stringify(roots.filter((r) => r.im === 0).map((r) => r.re))));
    return out;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(EquationSolverPanel, { values, results });
  },

  educational: {
    formula: 'Linear: x = −b/a | Quadratic: x = (−b ± √(b² − 4ac)) / 2a | Cubic and quartic: all real and complex roots (multiple roots detected exactly)',
    formulaDescription:
      'For linear equations in the form ax + b = 0, the solution is simply x = −b/a, representing the point where the line crosses the x-axis. For quadratic equations in the form ax² + bx + c = 0, the quadratic formula provides the universal solution. The discriminant (Δ = b² − 4ac) classifies the roots before computation: Δ > 0 yields two distinct real roots, Δ = 0 yields one repeated real root, and Δ < 0 yields two complex conjugate roots involving the imaginary unit i.',
    variables: [
      { symbol: 'a', name: 'Leading Coefficient', description: 'The coefficient of x (linear) or x² (quadratic). For linear equations, a is the slope. For quadratics, a determines the parabola\'s opening direction and width. Must be non-zero in both cases.' },
      { symbol: 'b', name: 'Linear Coefficient', description: 'The coefficient of the x term. In linear equations, b is the constant term shifted to the right side. In quadratics, b influences the vertex position and root symmetry around the axis of symmetry.' },
      { symbol: 'c', name: 'Constant Term', description: 'The constant term in quadratic equations (not used in linear form ax + b = 0). Determines the parabola\'s y-intercept at (0, c).' },
      { symbol: 'Discriminant (Δ)', name: 'b² − 4ac', description: 'The discriminant determines the nature and number of roots in a quadratic equation. A positive discriminant (Δ > 0) means two distinct real solutions, a zero discriminant (Δ = 0) means one repeated solution, and a negative discriminant (Δ < 0) means two complex conjugate solutions.' },
    ],
    howToUse: [
      'Select the equation type — Linear (ax + b = 0), Quadratic (ax² + bx + c = 0), Cubic (ax³ + bx² + cx + d = 0) or Quartic (ax⁴ + bx³ + cx² + dx + e = 0) — from the dropdown menu.',
      'Enter the coefficient a (required): the leading coefficient. If a = 0 the equation drops to a lower degree (a linear equation with a = 0 has no solution, or infinitely many when b = 0 as well).',
      'Enter the remaining coefficients in order of decreasing power (b, then c, d, e as the chosen type needs). Fields appear automatically.',
      'The calculator displays the equation in standard form, the discriminant (for quadratics), the roots, and the nature of the roots — real distinct, real repeated, or complex conjugates.',
    ],
    quickReference: [
      { label: 'Linear: ax + b = 0', value: 'x = −b/a (a ≠ 0)' },
      { label: 'Quadratic: ax² + bx + c = 0', value: 'x = (−b ± √(b²−4ac)) / 2a (a ≠ 0)' },
      { label: 'Δ > 0', value: 'Two distinct real roots' },
      { label: 'Δ = 0', value: 'One repeated real root' },
      { label: 'Δ < 0', value: 'Two complex conjugate roots' },
    ],
    commonUses: [
      'Physics: Solve projectile motion equations where height = −½gt² + v₀t + h₀ to find time of flight, max height, and landing time.',
      'Engineering: Calculate break-even points, stress-strain relationships, and circuit analysis where equations arise from Ohm\'s law and Kirchhoff\'s rules.',
      'Economics: Find equilibrium points where supply equals demand, or profit maximization where marginal revenue equals marginal cost.',
      'Computer Graphics: Solve ray-surface intersection problems, collision detection, and curve parameterization in game development and 3D rendering.',
      'Education: Learn fundamental algebra concepts, practice solving equations, and verify homework or exam answers step by step.',
    ],
    explanation:
      'Equation solving is one of the most fundamental operations in algebra and appears across virtually every technical field. Linear equations (ax + b = 0) are the simplest — they represent a straight line crossing the x-axis at exactly one point. Solving them requires only basic algebraic manipulation: subtract b from both sides and divide by a. Quadratic equations (ax² + bx + c = 0) are more nuanced. Their solutions are given by the quadratic formula x = (−b ± √(b² − 4ac)) / 2a, which has been known since at least 2000 BCE when Babylonian mathematicians solved quadratic-like problems. The formula was refined over centuries by Greek, Indian, and Persian mathematicians including al-Khwarizmi, whose 9th-century work "The Compendious Book on Calculation by Completion and Balancing" gave us the word "algebra." The key to understanding quadratics is the discriminant (Δ = b² − 4ac). When Δ > 0, the parabola crosses the x-axis twice, giving two real roots. When Δ = 0, the vertex sits exactly on the x-axis, producing a single repeated root. When Δ < 0, the parabola never touches the x-axis, and the roots are complex numbers of the form p ± qi, where i² = −1. This pattern reveals a deep connection between algebraic formulas and geometric graphs — the discriminant is not just a computational shortcut but a window into the behavior of the entire system. Understanding these relationships is essential for higher mathematics including calculus, differential equations, and linear algebra, where the same discriminant-like concepts reappear in more abstract forms.',
    faqs: [
      {
        question: 'What happens if a = 0 in a quadratic equation?',
        answer: 'If a = 0 the equation is no longer quadratic: it becomes linear (bx + c = 0), and the calculator says so and gives that linear solution. For a linear equation with a = 0, there is no solution when b is not 0 (the equation reads b = 0) and infinitely many solutions when b = 0 as well (0 = 0).',
      },
      {
        question: 'Can the quadratic formula solve all quadratic equations?',
        answer: 'Yes, the quadratic formula is a universal solver for every quadratic equation regardless of whether the coefficients are integers, fractions, decimals, or irrational numbers. Unlike factoring (which only works for special cases) or completing the square (which is more labor-intensive), the quadratic formula always works. It is derived directly from completing the square on the general form ax² + bx + c = 0.',
      },
      {
        question: 'How do I interpret complex roots?',
        answer: 'Complex roots come in conjugate pairs: p + qi and p − qi. The real part p = −b/(2a) is the x-coordinate of the parabola\'s vertex. The imaginary part is q = √(−Δ)/(2|a|). Complex roots mean the parabola never crosses the x-axis — it either stays entirely above (if a > 0) or entirely below (if a < 0).',
      },
      {
        question: 'What is the geometric meaning of the discriminant?',
        answer: 'The discriminant Δ = b² − 4ac has a direct geometric interpretation for the parabola y = ax² + bx + c. If Δ > 0, the parabola intersects the x-axis at two distinct points. If Δ = 0, the parabola is tangent to the x-axis at the vertex. If Δ < 0, the parabola does not intersect the x-axis at all. The magnitude of Δ relates to how far apart the two intersection points are.',
      },
    ],
    citations: [
      { source: 'Wolfram MathWorld — Quadratic Equation', url: 'https://mathworld.wolfram.com/QuadraticEquation.html' },
      { source: 'Khan Academy — Solving Quadratic Equations', url: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:quadratic-functions-equations' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 480 360" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="240" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="currentColor">Equation Solving Overview</text><rect x="30" y="48" width="200" height="130" rx="12" fill="var(--svg-e0f2fe)" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="130" y="72" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-1e40af)">Linear: ax + b = 0</text><line x1="60" y1="84" x2="200" y2="84" stroke="var(--svg-93c5fd)" stroke-width="1"/><text x="130" y="102" text-anchor="middle" font-size="13" fill="var(--svg-1e40af)">x = &minus;b / a</text><text x="130" y="124" text-anchor="middle" font-size="12" fill="var(--svg-2563eb)">a &ne; 0</text><line x1="60" y1="136" x2="200" y2="136" stroke="var(--svg-93c5fd)" stroke-width="0.5"/><text x="130" y="155" text-anchor="middle" font-size="11" fill="var(--svg-475569)">One real root</text><text x="130" y="170" text-anchor="middle" font-size="11" fill="var(--svg-475569)">Line crosses x-axis once</text><rect x="250" y="48" width="200" height="130" rx="12" fill="var(--svg-fef3c7)" stroke="var(--svg-f59e0b)" stroke-width="1.5"/><text x="350" y="72" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-92400e)">Quadratic: ax&sup2; + bx + c = 0</text><line x1="280" y1="84" x2="420" y2="84" stroke="var(--svg-fcd34d)" stroke-width="1"/><text x="350" y="104" text-anchor="middle" font-size="13" fill="var(--svg-92400e)">x = (&minus;b &plusmn; &radic;&Delta;) / 2a</text><text x="350" y="124" text-anchor="middle" font-size="12" fill="var(--svg-b45309)">&Delta; = b&sup2; &minus; 4ac</text><line x1="280" y1="136" x2="420" y2="136" stroke="var(--svg-fcd34d)" stroke-width="0.5"/><text x="350" y="152" text-anchor="middle" font-size="11" fill="var(--svg-475569)">&Delta; &gt; 0: Two real roots</text><text x="350" y="165" text-anchor="middle" font-size="11" fill="var(--svg-475569)">&Delta; = 0: One repeated root</text><text x="350" y="178" text-anchor="middle" font-size="11" fill="var(--svg-475569)">&Delta; &lt; 0: Complex roots</text><text x="240" y="205" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--svg-6b7280)">Discriminant &Delta; = b&sup2; &minus; 4ac Classifies the Roots</text><rect x="60" y="222" width="100" height="50" rx="8" fill="var(--svg-dcfce7)" stroke="var(--svg-22c55e)" stroke-width="1.5"/><text x="110" y="248" text-anchor="middle" font-size="20" font-weight="bold" fill="var(--svg-15803d)">&Delta; &gt; 0</text><text x="110" y="264" text-anchor="middle" font-size="11" fill="var(--svg-166534)">Two distinct real</text><rect x="190" y="222" width="100" height="50" rx="8" fill="var(--svg-fef9c3)" stroke="var(--svg-eab308)" stroke-width="1.5"/><text x="240" y="248" text-anchor="middle" font-size="20" font-weight="bold" fill="var(--svg-854d0e)">&Delta; = 0</text><text x="240" y="264" text-anchor="middle" font-size="11" fill="var(--svg-713f12)">One repeated real</text><rect x="320" y="222" width="100" height="50" rx="8" fill="var(--svg-fce7f3)" stroke="var(--svg-ec4899)" stroke-width="1.5"/><text x="370" y="248" text-anchor="middle" font-size="20" font-weight="bold" fill="var(--svg-be185d)">&Delta; &lt; 0</text><text x="370" y="264" text-anchor="middle" font-size="11" fill="var(--svg-9d174d)">Two complex conjugates</text><text x="240" y="308" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-6366f1)">The Quadratic Formula</text><text x="240" y="330" text-anchor="middle" font-size="15" fill="var(--svg-4f46e5)">x = (&minus;b &plusmn; &radic;(b&sup2; &minus; 4ac)) / 2a</text><text x="240" y="350" text-anchor="middle" font-size="11" fill="var(--svg-6b7280)">Universal solver: works for every quadratic equation</text></svg>',
      alt: 'Diagram comparing linear and quadratic equations showing how coefficients and discriminant determine the nature of roots',
      caption: 'Left: linear equation solution where x = -b/a gives one real root. Right: quadratic equation solution using the quadratic formula, with discriminant determining three possible root types.',
    },
  },
};

export default equationSolverConfig;
