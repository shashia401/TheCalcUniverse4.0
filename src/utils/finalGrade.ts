/**
 * "What do I need on the final?" — the single formula behind the grade and test-score (registered as
 * test-score-calculator) calculators, so the two can never disagree:
 *
 *   overall = current x (1 - w) + final x w     =>     final needed = (target - current x (1 - w)) / w
 *
 * where w = exam weight / 100 and `current` is the percentage earned on the graded (non-final) part of the course.
 * Computed with decimal arithmetic so (90 - 85 x 0.8) / 0.2 is exactly 110, never 110.00000000000001, and the
 * possible / impossible decision is made on the value rounded to the 0.01% that is displayed.
 */
import { D } from './stats';

export type FinalStatus = 'secured' | 'reachable' | 'impossible';

export interface FinalExamNeed {
  /** Exam score (%) required to land exactly on the target, rounded to 0.01. May be < 0 (secured) or > 100 (impossible). */
  needed: number;
  /** Overall grade if the final scores 0% — if this is already >= target the grade is secured. */
  floor: number;
  /** Overall grade if the final scores 100%. */
  ceiling: number;
  status: FinalStatus;
}

export function finalExamNeeded(current: number, desired: number, weightPct: number): FinalExamNeed | null {
  if (![current, desired, weightPct].every(Number.isFinite)) return null;
  if (current < 0 || desired < 0 || weightPct <= 0 || weightPct > 100) return null;
  const w = new D(weightPct);
  const banked = new D(current).times(new D(100).minus(w)).div(100);
  const needed = new D(desired).minus(banked).times(100).div(w).toDecimalPlaces(2, D.ROUND_HALF_UP);
  const status: FinalStatus = needed.lte(0) ? 'secured' : needed.gt(100) ? 'impossible' : 'reachable';
  return {
    needed: needed.toNumber(),
    floor: banked.toDecimalPlaces(2, D.ROUND_HALF_UP).toNumber(),
    ceiling: banked.plus(w).toDecimalPlaces(2, D.ROUND_HALF_UP).toNumber(),
    status,
  };
}

/** Whole-number-friendly percent string: 90 -> "90%", 84.5 -> "84.5%", 84.567 -> "84.57%". */
export function fmtPct(n: number): string {
  return `${parseFloat(n.toFixed(2))}%`;
}
