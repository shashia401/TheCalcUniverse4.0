import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import FactoringPanel from './FactoringPanel';
import { analyzeQuadratic } from './quadratic';

const COEFF_LIMIT = 1e12;

const factoringConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'a',
      label: 'Coefficient a (x²)',
      type: 'number',
      placeholder: 'x² coefficient',
      min: -COEFF_LIMIT,
      max: COEFF_LIMIT,
      inputMode: 'decimal',
      required: true,
      helpText: 'The coefficient of the x² term (non-zero)',
    },
    {
      id: 'b',
      label: 'Coefficient b (x)',
      type: 'number',
      placeholder: 'x coefficient',
      min: -COEFF_LIMIT,
      max: COEFF_LIMIT,
      inputMode: 'decimal',
      required: true,
      helpText: 'The coefficient of the x term',
    },
    {
      id: 'c',
      label: 'Constant c',
      type: 'number',
      placeholder: 'constant',
      min: -COEFF_LIMIT,
      max: COEFF_LIMIT,
      inputMode: 'decimal',
      required: true,
      helpText: 'The constant term',
    },
  ],
  calculate: (values): CalculatorResult[] => {
    const q = analyzeQuadratic(values);
    if (!q) return [];

    const results: CalculatorResult[] = [
      { id: 'original', label: 'Original Polynomial', value: q.original, highlight: true, color: 'neutral' },
      {
        id: 'discriminant',
        label: 'Discriminant (b² − 4ac)',
        value: q.discriminant,
        color: q.discriminantSign > 0 ? 'positive' : q.discriminantSign === 0 ? 'neutral' : 'negative',
      },
    ];

    if (q.kind === 'complex') {
      results.push({ id: 'factored', label: 'Factored Form', value: q.factored, color: 'negative' });
      results.push({ id: 'roots', label: 'Roots (Complex)', value: q.rootsLine, color: 'negative' });
    } else {
      results.push({ id: 'factored', label: 'Factored Form', value: q.factored, highlight: true, color: 'positive' });
      results.push({ id: 'roots', label: 'Roots (Zeros)', value: q.rootsLine, color: 'neutral' });
      results.push({ id: 'root1', label: 'Root x₁', value: q.rootTexts[0], color: 'positive' });
      results.push({ id: 'root2', label: 'Root x₂', value: q.rootTexts[1], color: 'positive' });
    }

    results.push({ id: 'steps', label: 'Step-by-Step Solution', value: q.steps.join('\n') });
    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(FactoringPanel, { values, results });
  },

  educational: {
    formula: 'ax² + bx + c = a(x − r₁)(x − r₂) | where r₁, r₂ are the roots',
    formulaDescription:
      'Factoring a quadratic polynomial reverses the FOIL (First, Outer, Inner, Last) multiplication process. The factoring by grouping method finds two numbers p and q that add to b and multiply to a × c, then splits the middle term and factors common binomials. This calculator reads decimal coefficients exactly, factors out the GCF, factors over the integers whenever that is possible, and otherwise falls back to the quadratic formula for irrational or complex roots.',
    variables: [
      { symbol: 'a', name: 'Quadratic Coefficient', description: 'The coefficient of the x² term. Must be non-zero. Determines whether the parabola opens upward (a > 0) or downward (a < 0).' },
      { symbol: 'b', name: 'Linear Coefficient', description: 'The coefficient of the x term. Together with a and c, determines the position of the parabola and the nature of the roots.' },
      { symbol: 'c', name: 'Constant Term', description: 'The constant term. Represents the y-intercept of the parabola at the point (0, c).' },
      { symbol: 'p, q', name: 'Factor Pair', description: 'Two numbers that satisfy p + q = b and p × q = a × c. They are used to split the middle term for grouping.' },
      { symbol: 'Δ', name: 'Discriminant (b² − 4ac)', description: 'Determines the nature of roots: Δ > 0 means two distinct real roots, Δ = 0 means one repeated root, Δ < 0 means two complex conjugate roots.' },
    ],
    howToUse: [
      'Enter the coefficients a (x²), b (x), and c (constant) from your quadratic expression in standard form ax² + bx + c.',
      'The calculator attempts to find integer factors using the factoring by grouping method. If successful, the factored form and roots are displayed.',
      'If the polynomial does not factor over the integers, the calculator displays the quadratic formula solution with real or complex roots.',
      'The discriminant value indicates the nature of the roots — positive means two real roots, zero means one root, negative means complex roots.',
      'Use the step-by-step panel to follow the factoring process from start to finish, including grouping and GCF extraction.',
    ],
    commonUses: [
      'Solving quadratic equations in algebra and pre-calculus coursework',
      'Finding x-intercepts (zeros) of parabolic functions for graphing',
      'Simplifying rational expressions by canceling common factors in numerator and denominator',
      'Optimization problems where the vertex of a parabola represents a maximum or minimum value',
      'Physics problems involving projectile motion, where height follows a quadratic function of time',
    ],
    quickReference: [
      { label: 'Standard Form', value: 'ax² + bx + c' },
      { label: 'Factored Form', value: '(rx + s)(tx + u)' },
      { label: 'Discriminant', value: 'Δ = b² − 4ac' },
      { label: 'Quadratic Formula', value: 'x = (−b ± √Δ) / 2a' },
    ],
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><text x="220" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--svg-333333)">Factoring a Quadratic</text><line x1="40" y1="280" x2="400" y2="280" stroke="var(--svg-999999)" stroke-width="1.5"/><text x="410" y="284" font-size="12" fill="var(--svg-666666)">x</text><line x1="220" y1="280" x2="220" y2="30" stroke="var(--svg-999999)" stroke-width="1.5"/><text x="226" y="28" font-size="12" fill="var(--svg-666666)">y</text><path d="M60,250 C100,130 140,50 220,50 C300,50 340,130 380,250" fill="none" stroke="var(--svg-3b82f6)" stroke-width="3" stroke-linecap="round"/><circle cx="100" cy="178" r="5" fill="var(--svg-ef4444)"/><text x="85" y="170" text-anchor="end" font-size="13" font-weight="bold" fill="var(--svg-ef4444)">Root 1</text><circle cx="340" cy="178" r="5" fill="var(--svg-ef4444)"/><text x="355" y="170" text-anchor="start" font-size="13" font-weight="bold" fill="var(--svg-ef4444)">Root 2</text><line x1="220" y1="50" x2="220" y2="290" stroke="var(--svg-22c55e)" stroke-width="1.5" stroke-dasharray="5,3"/><text x="220" y="305" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-22c55e)">Axis of Symmetry</text><circle cx="220" cy="50" r="5" fill="var(--svg-8b5cf6)"/><text x="235" y="45" font-size="13" font-weight="bold" fill="var(--svg-8b5cf6)">Vertex</text><text x="220" y="238" text-anchor="middle" font-size="13" fill="var(--svg-555555)">Factoring by grouping:</text><text x="220" y="258" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--svg-8b5cf6)">ax&sup2; + bx + c = (rx + s)(tx + u)</text><text x="220" y="285" text-anchor="middle" font-size="12" fill="var(--svg-666666)">Find p+q=b, p&times;q=a&times;c, then split and group</text></svg>',
      alt: 'Parabola graph with two x-intercepts labeled as Root 1 and Root 2, showing axis of symmetry and vertex',
      caption: 'Factoring a quadratic finds the x-intercepts by expressing the polynomial as a product of linear factors',
    },
    explanation:
      'Factoring quadratic polynomials is a fundamental algebra skill that transforms a quadratic expression from standard form (ax² + bx + c) into a product of simpler linear expressions. The factoring by grouping method is the most systematic approach and works reliably for any quadratic whose coefficients are integers. The process begins by identifying the coefficients a, b, and c, then computing the product a × c. The key insight is to find two numbers p and q that simultaneously satisfy two conditions: their sum equals b and their product equals a × c. Once p and q are found, the middle term bx is split into px + qx, creating a four-term polynomial that can be grouped into two pairs. Each pair is factored by extracting its greatest common factor (GCF), and if the binomial factors match, the expression can be written as a product of two linear factors. For example, factoring 2x² + 7x + 3 requires finding numbers that add to 7 and multiply to 6 — these are 1 and 6. Splitting gives 2x² + x + 6x + 3, grouping gives (2x² + x) + (6x + 3) = x(2x + 1) + 3(2x + 1) = (x + 3)(2x + 1). The roots of the polynomial are the x-values that make each factor equal to zero. If the discriminant (b² − 4ac) is negative, the roots are complex numbers involving the imaginary unit i.',
    faqs: [
      {
        question: 'What does it mean if a polynomial "does not factor"?',
        answer: 'Some quadratic polynomials have no integer factor pairs — this happens when no two integers p and q satisfy both p + q = b and p × q = a × c. For a polynomial with integer coefficients this means it cannot be factored over the rational numbers either (Gauss\'s lemma), although it may still have real irrational roots such as x² − 2. Every quadratic can be solved with the quadratic formula, which always produces roots (real or complex).',
      },
      {
        question: 'How is factoring by grouping different from simple factoring?',
        answer: 'Simple factoring (also called the "product-sum method") works directly when a = 1 by finding factors of c that add to b. Factoring by grouping extends this to cases where a ≠ 1 by first multiplying a and c, then splitting the middle term into four terms. This method works for any quadratic with integer coefficients, including those where a > 1 or a is negative.',
      },
      {
        question: 'What is the discriminant and why does it matter?',
        answer: 'The discriminant (Δ = b² − 4ac) is a value computed from the coefficients that tells you the nature of the roots without solving the equation. If Δ > 0, there are two distinct real roots and the parabola crosses the x-axis twice. If Δ = 0, there is one repeated root (a double root) and the parabola touches the x-axis at one point. If Δ < 0, there are two complex conjugate roots and the parabola does not cross the x-axis at all.',
      },
      {
        question: 'Can I factor a quadratic where a is negative?',
        answer: 'Yes. If a is negative, you can factor out -1 first, then factor the remaining positive quadratic. The calculator handles negative a automatically and will correctly find the factors regardless of the sign of any coefficient. The factored form will reflect the correct signs in each factor.',
      },
    ],
    citations: [
      { source: 'Wolfram MathWorld — Quadratic Equation', url: 'https://mathworld.wolfram.com/QuadraticEquation.html' },
      { source: 'Wikipedia — Factorization', url: 'https://en.wikipedia.org/wiki/Factorization' },
    ],
  },
};

export default factoringConfig;
