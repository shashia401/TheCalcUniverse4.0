import { safeEval } from '../shared/safeEval';

export type AngleMode = 'rad' | 'deg';

export type EvalOutcome = { ok: true; value: number } | { ok: false; error: string; /** a mathematical error (as opposed to a half-typed expression) */ domain: boolean };

/**
 * Evaluates the text of the display / input field with the shared recursive-descent parser (no eval, no Function).
 * The keypad writes × ÷ π and the true minus sign (U+2212); the parser only knows ASCII, so they are mapped here.
 * (Before this mapping every subtraction typed on the keypad ended in "Error".)
 */
export function evaluateExpression(expr: string, angle: AngleMode = 'rad'): EvalOutcome {
  const text = expr
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/[−–—]/g, '-')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt');
  if (!text.trim()) return { ok: false, error: 'Empty expression', domain: false };
  try {
    const value = safeEval(text, {}, { angle });
    if (Number.isNaN(value)) return { ok: false, error: 'Undefined result (outside the domain of a function)', domain: true };
    if (!Number.isFinite(value)) return { ok: false, error: value > 0 ? 'Result too large (Infinity)' : 'Result too large (-Infinity)', domain: true };
    return { ok: true, value };
  } catch (e) {
    const msg = (e as Error).message || 'Error';
    const domain = /Division by zero|Negative base|Factorial/.test(msg);
    return { ok: false, error: msg, domain };
  }
}

/** 12 significant digits; exponent form beyond 1e15 / below 1e-6 so nothing is silently rounded to 0 (the old 1e-10 rounding turned 3e-11 into 0). */
export function fmtResult(n: number): string {
  if (n === 0) return '0';
  const s = parseFloat(n.toPrecision(12));
  const a = Math.abs(s);
  if (a >= 1e15 || a < 1e-6) return s.toExponential(11).replace(/\.?0+e/, 'e');
  return s.toString();
}
