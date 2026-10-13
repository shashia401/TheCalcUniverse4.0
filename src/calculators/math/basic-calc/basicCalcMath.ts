import { safeEval } from '../shared/safeEval';

export type EvalOutcome = { ok: true; value: number; text: string } | { ok: false };

/**
 * Evaluate a keypad/typed expression (× ÷ − accepted) with the shared recursive-descent parser (standard precedence,
 * no eval). The value is shown to 15 significant digits, which removes binary noise (0.1 + 0.2 -> 0.3) while keeping
 * very small results (1e-12) that a fixed number of decimals would collapse to 0.
 */
export function evaluateDisplay(expr: string): EvalOutcome {
  const sanitized = expr.replace(/\s/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  if (!sanitized) return { ok: false };
  try {
    const value = safeEval(sanitized);
    if (!Number.isFinite(value)) return { ok: false };
    const text = String(parseFloat(value.toPrecision(15)));
    return { ok: true, value, text: text === '-0' ? '0' : text };
  } catch {
    return { ok: false };
  }
}
