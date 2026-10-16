import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import LimitPanel from './LimitPanel';
import { CasError, type Node, evalNode, parse } from '../shared/cas';
import { parseNumberStrict } from '../../../utils/parseNumber';
import { type SideLimit, limitToString, sideLimit } from './limitMath';

const sideText = (s: SideLimit): string => {
  switch (s.kind) {
    case 'value': return limitToString(s.value, s.error);
    case 'infinity': return s.sign > 0 ? '∞' : '-∞';
    case 'oscillates': return 'Does not exist (no convergence)';
    case 'undefined': return 'Undefined (f has no values on this side)';
  }
};

// Sample table kept for display: f at a few distances from the point.
const TABLE_H = [0.1, 0.01, 0.001, 0.0001, 0.00001];

function approachTable(f: (x: number) => number, a: number, sign: -1 | 1, label: string): string {
  const rows = TABLE_H.map((h) => {
    const x = a + sign * h;
    const y = f(x);
    return `f(${Number(x.toPrecision(10))}) = ${Number.isFinite(y) ? Number(y.toPrecision(7)) : 'undefined'}`;
  });
  return `${label}: ${rows.join('  →  ')}`;
}

const limitConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'expression',
      label: 'Function f(x)',
      type: 'text',
      placeholder: 'e.g. (x^2-1)/(x-1) or sin(x)/x',
      required: true,
      helpText:
        "Use x as the variable. Supports + - * / ^, implicit products (3x, 2(x+1)), sin cos tan asin acos atan sinh cosh tanh exp ln log (base 10) sqrt abs, and the constants pi and e (Euler's number). Example: (x^2-4)/(x-2) or sin(pi*x)/x.",
    },
    {
      id: 'approachValue',
      label: 'x approaches...',
      type: 'number',
      placeholder: 'x approaches...',
      step: 0.1,
      required: true,
      helpText: 'The finite value that x approaches. The limit is estimated numerically near this point.',
    },
    {
      id: 'direction',
      label: 'Direction',
      type: 'select',
      required: true,
      options: [
        { label: 'Both sides', value: 'both' },
        { label: 'Left (x → a⁻)', value: 'left' },
        { label: 'Right (x → a⁺)', value: 'right' },
      ],
      helpText: 'Whether to approach from the left, right, or both sides. "Both sides" checks if left and right limits agree.',
    },
  ],

  calculate: (values) => {
    const expr = (values.expression || '').trim();
    const target = parseNumberStrict(values.approachValue);
    const direction = values.direction || 'both';
    if (!expr || !Number.isFinite(target)) return [];

    let tree: Node;
    try {
      tree = parse(expr);
    } catch (e) {
      if (e instanceof CasError) return [];
      throw e;
    }
    const f = (x: number) => evalNode(tree, x);

    const left = direction === 'right' ? null : sideLimit(f, target, -1);
    const right = direction === 'left' ? null : sideLimit(f, target, 1);

    // Combine into the headline limit.
    let limitText: string;
    let exists = false;
    let finiteValue: number | null = null;
    let finiteErr = 0;
    const one = left ?? right!;
    if (direction !== 'both') {
      limitText = sideText(one);
      exists = one.kind === 'value' || one.kind === 'infinity';
      if (one.kind === 'value') {
        finiteValue = one.value;
        finiteErr = one.error;
      }
    } else if (left!.kind === 'value' && right!.kind === 'value') {
      const tol = 1e-6 * Math.max(1, Math.abs(left!.value), Math.abs(right!.value)) + 10 * (left!.error + right!.error);
      if (Math.abs(left!.value - right!.value) <= tol) {
        finiteValue = (left!.value + right!.value) / 2;
        finiteErr = Math.max(left!.error, right!.error, Math.abs(left!.value - right!.value));
        limitText = limitToString(finiteValue, finiteErr);
        exists = true;
      } else {
        limitText = 'Does not exist (left ≠ right)';
      }
    } else if (left!.kind === 'infinity' && right!.kind === 'infinity') {
      if (left!.sign === right!.sign) {
        limitText = left!.sign > 0 ? '∞' : '-∞';
        exists = true;
      } else {
        limitText = 'Does not exist (the sides go to opposite infinities)';
      }
    } else if (left!.kind === 'undefined' || right!.kind === 'undefined') {
      limitText = 'Does not exist (f is not defined on both sides of the point)';
    } else {
      limitText = 'Does not exist';
    }

    const fa = f(target);
    const results: CalculatorResult[] = [
      {
        id: 'limit',
        label: `lim f(x) as x → ${Number(target.toPrecision(10))}${direction === 'left' ? '⁻' : direction === 'right' ? '⁺' : ''}`,
        value: limitText,
        highlight: true,
        color: exists ? 'positive' : 'negative',
      },
    ];
    // For a one-sided request the headline row already is that side's limit.
    if (direction === 'both') {
      results.push({ id: 'leftLimit', label: 'Left-hand limit', value: sideText(left!), color: 'neutral' });
      results.push({ id: 'rightLimit', label: 'Right-hand limit', value: sideText(right!), color: 'neutral' });
    }

    if (direction === 'both') {
      results.push({
        id: 'isContinuous',
        label: 'Continuous at this point?',
        value:
          finiteValue === null
            ? exists
              ? 'No (the limit is infinite)'
              : 'No (the limit does not exist)'
            : !Number.isFinite(fa)
              ? 'No (the limit exists but f is undefined here: removable discontinuity)'
              : Math.abs(fa - finiteValue) <= 1e-6 * Math.max(1, Math.abs(fa)) + 10 * finiteErr
                ? 'Yes (limit = f(a))'
                : 'No (limit ≠ f(a))',
        color: 'neutral',
      });
    }
    results.push({
      id: 'valueAtPoint',
      label: 'f(a) at the point itself',
      value: Number.isFinite(fa) ? String(Number(fa.toPrecision(10))) : 'Undefined',
      color: 'neutral',
    });

    const table: string[] = [];
    if (direction !== 'right') table.push(approachTable(f, target, -1, `x → ${Number(target.toPrecision(10))}⁻`));
    if (direction !== 'left') table.push(approachTable(f, target, 1, `x → ${Number(target.toPrecision(10))}⁺`));
    results.push({ id: 'approachTable', label: 'Approach values', value: table.join(' | '), color: 'neutral' });
    return results;
  },

  educational: {
    formula: 'lim_{x→a} f(x) = L  means: for any ε > 0, there exists δ > 0 such that 0 < |x − a| < δ ⇒ |f(x) − L| < ε',

    diagram: {
      svg: '<svg viewBox="0 0 440 320" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="440" height="320" fill="var(--svg-fafafa)" rx="8"/><text x="220" y="28" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--svg-333333)">Limit of a Function — Two-Sided Approach</text><g transform="translate(60,45)"><line x1="0" y1="220" x2="310" y2="220" stroke="var(--svg-a0aec0)" stroke-width="1.5"/><line x1="20" y1="0" x2="20" y2="220" stroke="var(--svg-a0aec0)" stroke-width="1.5"/><text x="310" y="238" font-size="12" fill="var(--svg-666666)">x</text><text x="10" y="10" font-size="12" fill="var(--svg-666666)">y</text><line x1="160" y1="222" x2="160" y2="248" stroke="var(--svg-ef4444)" stroke-width="2"/><text x="160" y="260" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-ef4444)">x = a</text><line x1="0" y1="60" x2="14" y2="60" stroke="var(--svg-8b5cf6)" stroke-width="2"/><text x="0" y="55" text-anchor="end" font-size="13" font-weight="bold" fill="var(--svg-8b5cf6)">L</text><line x1="160" y1="56" x2="160" y2="65" stroke="var(--svg-8b5cf6)" stroke-width="1" stroke-dasharray="3,3"/><path d="M20,180 Q60,120 100,75 Q130,60 155,63" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2.5"/><path d="M310,180 Q270,120 230,75 Q200,60 165,63" fill="none" stroke="var(--svg-3b82f6)" stroke-width="2.5"/><circle cx="160" cy="60" r="4" fill="none" stroke="var(--svg-8b5cf6)" stroke-width="2"/><text x="100" y="105" text-anchor="middle" font-size="12" fill="var(--svg-3b82f6)">Left: x → a⁻</text><path d="M130,98 L110,98 M130,98 L122,93 M130,98 L122,103" fill="none" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="230" y="105" text-anchor="middle" font-size="12" fill="var(--svg-3b82f6)">Right: x → a⁺</path><path d="M200,98 L220,98 M200,98 L208,93 M200,98 L208,103" fill="none" stroke="var(--svg-3b82f6)" stroke-width="1.5"/><text x="155" y="298" text-anchor="middle" font-size="11" fill="var(--svg-666666)">As x approaches a from either side, f(x) approaches L — if they agree, the limit exists</text></g></svg>',
      alt: 'Graph of a function with a gap at x = a, showing arrows approaching from left and right converging to the same y-value L',
      caption: 'The limit of f(x) as x approaches a exists if and only if the left-hand and right-hand limits both exist and are equal.',
    },

    formulaDescription:
      "The limit of a function describes the value that f(x) approaches as x gets arbitrarily close to a given point a. The formal ε-δ definition states that for any desired tolerance ε > 0, there exists a distance δ > 0 such that whenever x is within δ of a (but not equal to a), f(x) is within ε of L. A limit exists if and only if both the left-hand limit (x → a⁻) and right-hand limit (x → a⁺) exist and are equal.",

    variables: [
      { symbol: 'f(x)', name: 'Function', description: 'The mathematical expression whose limit is being evaluated.' },
      { symbol: 'a', name: 'Approach point', description: 'The value that the variable x approaches.' },
      { symbol: 'L', name: 'Limit value', description: 'The value that f(x) approaches as x → a, if it exists.' },
      { symbol: 'ε (epsilon)', name: 'Tolerance', description: 'An arbitrarily small positive number representing how close f(x) must get to L.' },
      { symbol: 'δ (delta)', name: 'Distance', description: 'The maximum distance from a that still guarantees f(x) is within ε of L.' },
    ],

    howToUse: [
      'Enter a function f(x) using x as the variable. Use ^ for powers, sin(), cos(), tan(), sqrt(), pi for π, and e for Euler\'s number (≈ 2.71828).',
      'Enter the approach value a — the number that x gets close to. This can be any real number.',
      'Select the direction: "Both sides" checks agreement from left and right; "Left" only approaches from below; "Right" only approaches from above.',
      'The calculator samples f at x = a ± 0.1, 0.05, 0.025, ... (down to about 10⁻⁸ from a) and extrapolates the sequence to the limit (Richardson and Aitken extrapolation), so cancellation near the point does not distort the answer. A short table of f near a is shown as well.',
      'For "Both sides", the limit exists only when the left and right limits agree (two equal finite values, or both ∞ / both −∞). The result also reports whether f is continuous at a (limit = f(a)).',
    ],

    quickReference: [
      { label: 'lim(x→0) sin(x)/x', value: '1' },
      { label: 'lim(x→2) (x²−4)/(x−2)', value: '4' },
      { label: 'lim(x→0) (cos(x)−1)/x', value: '0' },
    ],

    commonUses: [
      'Analyzing function behavior near points where the function is undefined (removable singularities)',
      'Determining continuity and differentiability of functions in calculus coursework',
      'Computing derivatives using the limit definition: f\'(x) = lim_(h→0) (f(x+h) − f(x)) / h',
      'Evaluating asymptotic behavior of functions in physics and engineering applications',
      'Understanding convergence of sequences and series in advanced mathematics',
    ],

    explanation:
      "The concept of a limit is the foundation of all calculus. Intuitively, the limit asks: what value does f(x) get close to as x gets close to a? The function need not be defined at x = a — in fact, limits are most interesting precisely when the function is undefined at that point (e.g., sin(x)/x at x = 0). This calculator uses a numerical approach: it evaluates the function at a sequence of x-values that approach a from both sides, with incrementally smaller step sizes (0.1, 0.01, 0.001, ..., down to 10⁻⁸). By observing the trend as the step size shrinks, the calculator estimates the limit. For \"removable\" discontinuities (where the function has a hole but the limit exists), the left and right approaches converge to the same value. For \"jump\" discontinuities, they converge to different values. For \"infinite\" discontinuities (vertical asymptotes), the function values diverge to ±∞. A function is continuous at a if f(a) equals the limit — meaning no hole, jump, or asymptote. The formal ε-δ definition provides the rigorous mathematical foundation: for any ε > 0 (no matter how small), there must exist a δ > 0 such that whenever x is within δ of a (but not equal to a), f(x) is within ε of L. This definition captures the idea of \"arbitrarily close\" with mathematical precision and underlies all of limit theory, including the crucial limit laws: the limit of a sum is the sum of the limits, the limit of a product is the product of the limits, and so on — provided each individual limit exists.",

    faqs: [
      {
        question: 'What is the limit of sin(x)/x as x approaches 0?',
        answer: 'The limit is 1, even though sin(x)/x is undefined at x = 0 itself (it gives 0/0). This is one of the most important limits in calculus — it\'s the basis for proving that the derivative of sin(x) is cos(x). You can verify it numerically: as x shrinks toward 0 (0.1, 0.01, 0.001, ...), sin(x)/x gets closer and closer to 1 from both sides. Try entering sin(x)/x with approach value 0 above to see the approach table converge.',
      },
      {
        question: 'What does it mean for a limit to exist?',
        answer: 'A limit exists if and only if the left-hand limit (x → a⁻) and the right-hand limit (x → a⁺) both exist and are equal. If they differ, the two-sided limit does not exist — the function has a jump discontinuity at that point. If either side diverges to infinity, the limit does not exist in the finite sense.',
      },
      {
        question: 'How is limit related to continuity?',
        answer: 'A function is continuous at x = a when three conditions hold: f(a) is defined, the limit as x → a exists, and the limit equals f(a). In other words, there is no hole, jump, or asymptote at a. All polynomial functions are continuous everywhere; rational functions are continuous everywhere except where the denominator is zero.',
      },
      {
        question: 'Why can\'t we just plug in x = a directly?',
        answer: 'Sometimes we can! If f is continuous at a, then the limit equals f(a). But many important limits involve indeterminate forms like 0/0 or ∞/∞ where direct substitution fails. For example, (x² − 1)/(x − 1) at x = 1 gives 0/0, but the limit is 2. Factoring, rationalizing, or using L\'Hôpital\'s rule resolves these cases.',
      },
      {
        question: 'How accurate is this numerical limit calculator?',
        answer: 'It is a numerical estimate, not a symbolic proof. The sample sequence is extrapolated to the limit and the answer is rounded to 10 significant digits (and snapped to 0 or a whole number when it is within the estimated error), so smooth functions are usually accurate to 7+ digits. Limits that diverge are reported as ∞ or −∞, and functions that do not settle (like sin(1/x) near 0) are reported as not existing. Functions with very sharp features closer than 0.1 to the point may need a symbolic technique.',
      },
      {
        question: 'What do the approach table values tell me?',
        answer: 'The approach table shows the sequence of f(x) values as x gets progressively closer to a. Watching this sequence converge to a stable number is the most intuitive way to understand limits. If the values bounce around erratically or diverge, the limit likely does not exist at that point.',
      },
    ],

    citations: [
      { source: 'Wikipedia — Limit of a Function', url: 'https://en.wikipedia.org/wiki/Limit_of_a_function' },
      { source: 'Wolfram MathWorld — Limit', url: 'https://mathworld.wolfram.com/Limit.html' },
    ],
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(LimitPanel, { values, results });
  },
};

export default limitConfig;
