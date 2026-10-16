/**
 * GPA math, kept free of UI so it can be tested against hand calculation.
 *
 * Scales (institutions differ; A+ is where they disagree):
 *  - standard: A+ = A = 4.0, A- 3.7, B+ 3.3, B 3.0, B- 2.7, C+ 2.3, C 2.0, C- 1.7, D+ 1.3, D 1.0, D- 0.7, F 0
 *    (e.g. Duke's transcript guide; the most common US plus/minus table).
 *  - thirds:   A+ 4.33, A 4.0, A- 3.67, B+ 3.33, B 3.0, B- 2.67, ... D- 0.67 (e.g. Arizona State, University of Iowa).
 *
 * Weighted GPA adds a bonus per course grade point — Honors +0.5, AP/IB +1.0, the common scheme where an A in an
 * AP class is 5.0 — and never to an F. (Older versions of this calculator multiplied by 1.05 / 1.1, which turned a
 * 4.0 AP "A" into 4.4 instead of 5.0.)
 */
import { D, type Dec } from '../../../utils/stats';

export type ScaleId = 'standard' | 'thirds';

/** Ascending order, so "lowest grade that reaches X" is the first match. */
export const GRADES = ['F', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+'] as const;
export type Grade = (typeof GRADES)[number];

const STANDARD: Record<Grade, string> = {
  F: '0', 'D-': '0.7', D: '1', 'D+': '1.3', 'C-': '1.7', C: '2', 'C+': '2.3', 'B-': '2.7', B: '3', 'B+': '3.3', 'A-': '3.7', A: '4', 'A+': '4',
};
const THIRDS: Record<Grade, string> = {
  F: '0', 'D-': '0.67', D: '1', 'D+': '1.33', 'C-': '1.67', C: '2', 'C+': '2.33', 'B-': '2.67', B: '3', 'B+': '3.33', 'A-': '3.67', A: '4', 'A+': '4.33',
};

export const SCALES: Record<ScaleId, Record<Grade, string>> = { standard: STANDARD, thirds: THIRDS };

export function scaleMax(scale: ScaleId): number {
  return Number(SCALES[scale]['A+']);
}

export function pointsFor(grade: string, scale: ScaleId): Dec | null {
  const table = SCALES[scale];
  return Object.prototype.hasOwnProperty.call(table, grade) ? new D(table[grade as Grade]) : null;
}

/** Honors +0.5, AP/IB +1.0 (case-insensitive, accepts "AP / IB"); anything else is Regular. */
export function weightBonus(raw: string | undefined): Dec {
  const key = (raw ?? '').trim().toLowerCase().replace(/\s+/g, '');
  if (key === 'ap' || key === 'ib' || key === 'ap/ib') return new D(1);
  if (key === 'honors' || key === 'honours' || key === 'honor') return new D('0.5');
  return new D(0);
}

export interface CourseInput {
  name: string;
  grade: string;
  credits: number;
  weight: string;
}

export interface GpaResult {
  gpa: Dec;
  unweightedGpa: Dec;
  totalCredits: Dec;
  totalWeightedPoints: Dec;
  rows: { name: string; grade: string; credits: number; points: number }[];
}

/** Credit-weighted GPA: Σ(points × credits) / Σ(credits). Returns null for an unknown grade or no credits. */
export function calcGpa(courses: CourseInput[], scale: ScaleId): GpaResult | null {
  let weighted = new D(0);
  let unweighted = new D(0);
  let credits = new D(0);
  const rows: GpaResult['rows'] = [];
  for (const c of courses) {
    const base = pointsFor(c.grade, scale);
    if (!base || !(c.credits > 0)) return null;
    const bonus = c.grade === 'F' ? new D(0) : weightBonus(c.weight);
    const cr = new D(c.credits);
    weighted = weighted.plus(base.plus(bonus).times(cr));
    unweighted = unweighted.plus(base.times(cr));
    credits = credits.plus(cr);
    rows.push({ name: c.name, grade: c.grade, credits: c.credits, points: base.plus(bonus).times(cr).toNumber() });
  }
  if (credits.isZero()) return null;
  return { gpa: weighted.div(credits), unweightedGpa: unweighted.div(credits), totalCredits: credits, totalWeightedPoints: weighted, rows };
}

export interface NeededGpa {
  needed: Dec;
  /** True when even straight A+ (the scale maximum) in every remaining credit cannot reach the target. */
  impossible: boolean;
  /** Lowest letter grade whose points reach `needed`, or null when impossible. */
  letter: Grade | null;
  /** Even an F in every remaining credit keeps the target (needed <= 0). */
  secured: boolean;
}

/** GPA needed on the remaining credits: (target × (done + left) − current × done) / left. */
export function neededGpa(current: number, creditsDone: number, target: number, creditsLeft: number, scale: ScaleId): NeededGpa {
  const needed = new D(target).times(new D(creditsDone).plus(creditsLeft)).minus(new D(current).times(creditsDone)).div(creditsLeft);
  const max = new D(SCALES[scale]['A+']);
  const impossible = needed.greaterThan(max);
  const letter = impossible ? null : GRADES.find((g) => new D(SCALES[scale][g]).greaterThanOrEqualTo(needed)) ?? null;
  return { needed, impossible, letter, secured: needed.lessThanOrEqualTo(0) };
}
