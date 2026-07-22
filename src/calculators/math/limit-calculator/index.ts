import { createElement } from 'react';
import { CalculatorConfig, CalculatorResult } from '../../../types/calculator';
import { safeEval } from '../shared/safeEval';
import LimitPanel from './LimitPanel';

// ─── Safe expression evaluator (supports trig, sqrt, pi, e) ──────────────────

function evaluateLimitExpr(expr: string, xVal: number): number {
  try {
    return safeEval(expr, { x: xVal });
  } catch {
    return NaN;
  }
}

// ─── Numerical limit computation ─────────────────────────────────────────────

const APPROACH_STEPS = [0.1, 0.01, 0.001, 0.0001, 0.00001, 0.000001, 0.0000001, 0.00000001];

interface ApproachPoint {
  x: number;
  fx: number;
}

function sampleSide(expr: string, target: number, sign: -1 | 1): ApproachPoint[] {
  const points: ApproachPoint[] = [];
  for (const step of APPROACH_STEPS) {
    const x = target + sign * step;
    const fx = evaluateLimitExpr(expr, x);
    if (!isNaN(fx) && isFinite(fx)) {
      points.push({ x, fx });
    }
  }
  return points;
}

function fmtApproachTable(points: ApproachPoint[], label: string): string {
  if (points.length === 0) return `${label}: (no data)`;
  const rows = points.map(
    (p) => `f(${p.x.toFixed(8).replace(/\.?0+$/, '')}) = ${p.fx.toFixed(6)}`,
  );
  return `${label}: ${rows.join('  →  ')}`;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const limitConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'expression',
      label: 'Function f(x)',
      type: 'text',
      placeholder: 'e.g. (x^2-1)/(x-1) or sin(x)/x',
      required: true,
      helpText: 'Enter an expression in terms of x. Supports ^ for powers, sin(), cos(), tan(), sqrt(), pi, and e (Euler\'s number). Example: (x^2-4)/(x-2) or sin(pi*x)/(x)',
    },
    {
      id: 'approachValue',
      label: 'x approaches...',
      type: 'number',
      placeholder: 'x approaches...',
      step: 0.1,
      required: true,
      helpText: 'The value that x approaches. The limit is evaluated near this point.',
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
    const target = parseFloat(values.approachValue);
    const direction = values.direction || 'both';

    // Validate inputs
    if (!expr || isNaN(target)) return [];

    // Validate expression evaluates at a near point
    const sanityCheck = evaluateLimitExpr(expr, target + 0.01);
    if (isNaN(sanityCheck) && isNaN(evaluateLimitExpr(expr, target - 0.01))) {
      return [];
    }

    // Compute approach values
    const leftPoints = sampleSide(expr, target, -1);
    const rightPoints = sampleSide(expr, target, 1);

    const leftLimit = leftPoints.length > 0 ? leftPoints[leftPoints.length - 1].fx : NaN;
    const rightLimit = rightPoints.length > 0 ? rightPoints[rightPoints.length - 1].fx : NaN;

    let limit: number;
    let isContinuous = false;

    switch (direction) {
      case 'left':
        limit = leftLimit;
        break;
      case 'right':
        limit = rightLimit;
        break;
      default: {
        // Both sides
        if (!isNaN(leftLimit) && !isNaN(rightLimit)) {
          limit = (leftLimit + rightLimit) / 2;
          isContinuous = Math.abs(leftLimit - rightLimit) < 0.0001;
        } else if (!isNaN(leftLimit)) {
          limit = leftLimit;
        } else {
          limit = rightLimit;
        }
        break;
      }
    }

    if (isNaN(limit)) return [];

    const fmt = (n: number): string => {
      if (!isFinite(n)) return n > 0 ? '∞' : '-∞';
      if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toString();
      return parseFloat(n.toPrecision(10)).toString();
    };

    const results: CalculatorResult[] = [
      {
        id: 'limit',
        label: `lim f(x) as x → ${fmt(target)}`,
        value: fmt(limit),
        highlight: true,
        color: 'positive',
      },
    ];

    if (direction !== 'left' && !isNaN(leftLimit)) {
      results.push({
        id: 'leftLimit',
        label: 'Left-hand limit',
        value: fmt(leftLimit),
        color: 'neutral',
      });
    }

    if (direction !== 'right' && !isNaN(rightLimit)) {
      results.push({
        id: 'rightLimit',
        label: 'Right-hand limit',
        value: fmt(rightLimit),
        color: 'neutral',
      });
    }

    if (direction === 'both') {
      results.push({
        id: 'isContinuous',
        label: 'Limit exists / Function continuous',
        value: isContinuous ? 'Yes (left ≈ right)' : 'No (left ≠ right)',
        color: isContinuous ? 'positive' : 'negative',
      });
    }

    // Approach table
    let tableStr = '';
    if (direction === 'both' || direction === 'left') {
      tableStr += fmtApproachTable(leftPoints, `x → ${fmt(target)}⁻`);
    }
    if (direction === 'both') {
      tableStr += ' | ';
    }
    if (direction === 'both' || direction === 'right') {
      tableStr += fmtApproachTable(rightPoints, `x → ${fmt(target)}⁺`);
    }

    if (tableStr) {
      results.push({
        id: 'approachTable',
        label: 'Approach values',
        value: tableStr,
        color: 'neutral',
      });
    }

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
      'The calculator evaluates f(x) at points increasingly close to a (steps: 0.1, 0.01, ..., 10⁻⁸), showing the approach sequence in the results.',
      'For "Both sides", the result also reports whether the limit exists (left ≈ right) and thus whether the function is continuous at a.',
    ],

    quickReference: [
      { label: 'lim(x→0) sin(x)/x', value: '1' },
      { label: 'lim(x→2) (x²−4)/(x−2)', value: '4' },
      { label: 'lim(x→0) (cos(x)−1)/x', value: '0' },
      { label: 'lim(x→∞) 1/x', value: '0 (numerical: approaches 0)' },
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
        answer: 'The calculator evaluates at step sizes down to 10⁻⁸ from the target. For well-behaved functions, the computed limit should match the true limit to at least 6 decimal places. However, functions that oscillate rapidly near the approach point (like sin(1/x) near 0) or have very steep slopes may require special analytical techniques beyond numerical sampling.',
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
