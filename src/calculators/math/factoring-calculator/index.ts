import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import FactoringPanel from './FactoringPanel';

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

const SUPER_TWO = '²';

interface FactorResult {
  r: number;
  s: number;
  t: number;
  u: number;
}

function findIntegerFactors(a: number, b: number, c: number): FactorResult | null {
  const ac = a * c;
  let p = 0;
  let q = 0;
  let found = false;

  const absAc = Math.abs(ac);
  for (let i = 1; i <= Math.sqrt(absAc); i++) {
    if (ac % i !== 0) continue;
    const j = ac / i;

    const candidates: [number, number][] = [
      [i, j], [-i, -j],
    ];
    if (i !== j) {
      candidates.push([j, i], [-j, -i]);
    }

    for (const [pi, qi] of candidates) {
      if (pi + qi === b) {
        p = pi;
        q = qi;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  if (!found) return null;

  // From p = r*u and q = s*t, find r,s,t,u such that:
  //   r*t = a, r*u = p, s*t = q, s*u = c
  const absA = Math.abs(a);
  for (let r = 1; r <= absA; r++) {
    if (a % r !== 0) continue;
    const t = a / r;
    if (p % r !== 0) continue;
    const u = p / r;
    if (q % t !== 0) continue;
    const s = q / t;
    if (s * u === c) {
      return { r, s, t, u };
    }
  }

  return null;
}

function formatTerm(coeff: number, power: number, isFirst: boolean): string {
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
    result += SUPER_TWO;
  }
  return result;
}

function polyString(a: number, b: number, c: number): string {
  let s = formatTerm(a, 2, true);
  s += formatTerm(b, 1, s === '');
  s += formatTerm(c, 0, s === '');
  return s;
}

function formatFactor(coeff: number, constant: number): string {
  if (coeff === 0) return `(${constant})`;
  let inner = '';
  if (coeff === 1) inner = 'x';
  else if (coeff === -1) inner = '-x';
  else inner = `${coeff}x`;

  if (constant > 0) inner += ` + ${constant}`;
  else if (constant < 0) inner += ` − ${Math.abs(constant)}`;

  return `(${inner})`;
}

function formatRoot(root: number): string {
  if (Number.isInteger(root)) return root.toString();
  return parseFloat(root.toFixed(6)).toString();
}

const factoringConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'a',
      label: 'Coefficient a (x²)',
      type: 'number',
      placeholder: 'x² coefficient',
      required: true,
      helpText: 'The coefficient of the x² term (non-zero)',
    },
    {
      id: 'b',
      label: 'Coefficient b (x)',
      type: 'number',
      placeholder: 'x coefficient',
      required: true,
      helpText: 'The coefficient of the x term',
    },
    {
      id: 'c',
      label: 'Constant c',
      type: 'number',
      placeholder: 'constant',
      required: true,
      helpText: 'The constant term',
    },
  ],
  calculate: (values) => {
    const a = parseFloat(values.a);
    const b = parseFloat(values.b);
    const c = parseFloat(values.c);

    if (isNaN(a) || isNaN(b) || isNaN(c) || a === 0) return [];

    const discriminant = b * b - 4 * a * c;
    const ac = a * c;
    const factors = findIntegerFactors(a, b, c);
    const fmt = (n: number) => parseFloat(n.toFixed(6)).toString();

    const results: CalculatorResult[] = [];

    // Original polynomial
    results.push({
      id: 'original',
      label: 'Original Polynomial',
      value: polyString(a, b, c),
      highlight: true,
      color: 'neutral',
    });

    // Discriminant
    results.push({
      id: 'discriminant',
      label: 'Discriminant (b² − 4ac)',
      value: fmt(discriminant),
      color: discriminant > 0 ? 'positive' : discriminant === 0 ? 'neutral' : 'negative',
    });

    // Determine p and q for step display
    let pVal = 0;
    let qVal = 0;
    if (factors) {
      // Re-derive p,q from r,s,t,u
      pVal = factors.r * factors.u;
      qVal = factors.s * factors.t;
    } else {
      // Find p,q anyway for step display even if not factorable
      const absAc = Math.abs(ac);
      for (let i = 1; i <= Math.sqrt(absAc); i++) {
        if (ac % i !== 0) continue;
        const j = ac / i;
        const candidates: [number, number][] = [[i, j], [-i, -j]];
        if (i !== j) candidates.push([j, i], [-j, -i]);
        for (const [pi, qi] of candidates) {
          if (pi + qi === b) {
            pVal = pi;
            qVal = qi;
            break;
          }
        }
        if (pVal !== 0 || qVal !== 0) break;
      }
    }

    // Build steps
    const steps: string[] = [];
    steps.push(`Step 1: Identify coefficients — a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)}`);
    steps.push(`Step 2: Multiply a × c = ${fmt(a)} × ${fmt(c)} = ${fmt(ac)}`);
    steps.push(`Step 3: Find two numbers p and q such that p + q = b = ${fmt(b)} and p × q = a × c = ${fmt(ac)}`);
    steps.push(`  p = ${fmt(pVal)}, q = ${fmt(qVal)} (since ${fmt(pVal)} + ${fmt(qVal)} = ${fmt(pVal + qVal)} and ${fmt(pVal)} × ${fmt(qVal)} = ${fmt(pVal * qVal)})`);

    if (factors) {
      const { r, s, t, u } = factors;
      // Step 4: Rewrite middle term
      steps.push(`Step 4: Rewrite ${fmt(a)}x² + ${fmt(b)}x + ${fmt(c)} as ${fmt(a)}x² + ${fmt(pVal)}x + ${fmt(qVal)}x + ${fmt(c)}`);

      // Step 5: Group and factor
      const g1 = gcd(a, pVal);
      const g2 = gcd(qVal, c);
      const g1Str = g1 === 1 ? '' : g1;
      const g2Str = g2 === 1 ? '' : g2;
      steps.push(`Step 5: Group the terms — (${fmt(a)}x² + ${fmt(pVal)}x) + (${fmt(qVal)}x + ${fmt(c)})`);
      steps.push(`  Factor out the GCF from each group:`);
      steps.push(`    Group 1: ${fmt(a)}x² + ${fmt(pVal)}x = ${g1Str === '' ? '' : g1}x(${fmt(a / g1)}x + ${fmt(pVal / g1)})`.replace('=  ', '= '));
      steps.push(`    Group 2: ${fmt(qVal)}x + ${fmt(c)} = ${g2Str === '' ? '' : g2}(${fmt(qVal / g2)}x + ${fmt(c / g2)})`.replace('=  ', '= '));
      steps.push(`Step 6: Factor out the common binomial — ${formatFactor(r, s)}${formatFactor(t, u)}`);
      steps.push(`  Final factored form: ${formatFactor(r, s)} × ${formatFactor(t, u)}`);

      results.push({
        id: 'factored',
        label: 'Factored Form',
        value: `${formatFactor(r, s)}${formatFactor(t, u)}`,
        highlight: true,
        color: 'positive',
      });

      // Roots
      const root1 = -s / r;
      const root2 = -u / t;
      results.push({
        id: 'roots',
        label: 'Roots (Zeros)',
        value: `x = ${formatRoot(root1)}, x = ${formatRoot(root2)}`,
        color: 'neutral',
      });
      results.push({
        id: 'root1',
        label: 'Root x₁',
        value: formatRoot(root1),
        color: 'positive',
      });
      results.push({
        id: 'root2',
        label: 'Root x₂',
        value: formatRoot(root2),
        color: 'positive',
      });
    } else if (discriminant >= 0) {
      // Factorable using quadratic formula (may not have integer factors)
      const root1 = (-b + Math.sqrt(discriminant)) / (2 * a);
      const root2 = (-b - Math.sqrt(discriminant)) / (2 * a);

      steps.push(`Step 4: No integer factor pairs found — using the quadratic formula`);
      steps.push(`  x = (−b ± √(b² − 4ac)) / (2a)`);
      steps.push(`  x = (−(${fmt(b)}) ± √(${fmt(discriminant)})) / (2 × ${fmt(a)})`);
      steps.push(`  x₁ = ${fmt(root1)}, x₂ = ${fmt(root2)}`);
      steps.push(`Step 5: Write the factored form using roots`);
      steps.push(`  ${fmt(a)}(x − ${fmt(root1)})(x − ${fmt(root2)})`);

      results.push({
        id: 'factored',
        label: 'Factored Form',
        value: `${fmt(a)}(x − ${fmt(root1)})(x − ${fmt(root2)})`,
        highlight: true,
        color: 'positive',
      });

      results.push({
        id: 'roots',
        label: 'Roots (Zeros)',
        value: `x = ${fmt(root1)}, x = ${fmt(root2)}`,
        color: 'neutral',
      });
      results.push({
        id: 'root1',
        label: 'Root x₁',
        value: fmt(root1),
        color: 'positive',
      });
      results.push({
        id: 'root2',
        label: 'Root x₂',
        value: fmt(root2),
        color: 'positive',
      });
    } else {
      // Complex roots
      const realPart = -b / (2 * a);
      const imagPart = Math.sqrt(-discriminant) / (2 * a);

      steps.push(`Step 4: The discriminant is negative — roots are complex`);
      steps.push(`  x = (−b ± √(b² − 4ac)) / (2a)`);
      steps.push(`  x = (−(${fmt(b)}) ± √(${fmt(discriminant)})) / (2 × ${fmt(a)})`);
      steps.push(`  The square root of a negative number involves the imaginary unit i`);
      steps.push(`  x₁ = ${fmt(realPart)} + ${fmt(imagPart)}i`);
      steps.push(`  x₂ = ${fmt(realPart)} − ${fmt(imagPart)}i`);

      results.push({
        id: 'factored',
        label: 'Factored Form',
        value: 'Does not factor over the reals (complex roots)',
        color: 'negative',
      });

      results.push({
        id: 'roots',
        label: 'Roots (Complex)',
        value: `x = ${fmt(realPart)} ± ${fmt(imagPart)}i`,
        color: 'negative',
      });
    }

    // Steps as a single result
    results.push({
      id: 'steps',
      label: 'Step-by-Step Solution',
      value: steps.join('\n'),
    });

    return results;
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(FactoringPanel, { values, results });
  },
  educational: {
    formula: 'ax² + bx + c = a(x − r₁)(x − r₂) | where r₁, r₂ are the roots',
    formulaDescription:
      'Factoring a quadratic polynomial reverses the FOIL (First, Outer, Inner, Last) multiplication process. The factoring by grouping method finds two numbers p and q that add to b and multiply to a × c, then splits the middle term and factors common binomials. This calculator handles integer factoring when possible and falls back to the quadratic formula for non-integer or complex roots.',
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
        answer: 'Some quadratic polynomials have no integer factor pairs — this happens when no two integers p and q satisfy both p + q = b and p × q = a × c. The polynomial may still factor over the rational numbers, or it may require the quadratic formula. In all cases, every quadratic can be solved using the quadratic formula, which always produces roots (real or complex).',
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
