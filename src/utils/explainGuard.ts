import type { ExplainStep } from '../types/calculator';

/** A worked solution must never print NaN / Infinity / undefined (runaway or odd input): drop it instead. */
export function finiteSteps(steps: ExplainStep[]): ExplainStep[] {
  return steps.some((s) => /NaN|Infinity|∞|undefined/.test(`${s.label} ${s.expr} ${s.note ?? ''}`)) ? [] : steps;
}
