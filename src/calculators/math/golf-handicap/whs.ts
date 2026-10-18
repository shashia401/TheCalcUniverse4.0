/**
 * World Handicap System (WHS) arithmetic, as published in the Rules of Handicapping (USGA / R&A):
 *
 *  Rule 5.1  Score Differential = (113 / Slope Rating) × (Adjusted Gross Score − Course Rating − PCC),
 *            rounded to the nearest tenth (0.05 rounds up).
 *  Rule 5.2  Handicap Index = average of the lowest N of the most recent 20 Score Differentials (+ adjustment for
 *            fewer than 20 scores), rounded to the nearest tenth, maximum 54.0:
 *              scores in record   lowest used   adjustment
 *                3                 1            −2.0
 *                4                 1            −1.0
 *                5                 1             0
 *                6                 2            −1.0
 *                7–8               2             0
 *                9–11              3             0
 *                12–14             4             0
 *                15–16             5             0
 *                17–18             6             0
 *                19                7             0
 *                20                8             0
 *            The table was checked row by row against the primary text, Rule 5.2a of the 2024 Rules of Handicapping
 *            (USGA / R&A, USGA-published PDF as hosted by SCGA, p.54), and against the Malta Golf Association copy of the
 *            Rules (R&A territory). Rows 3 to 20 agree in both. The Malta copy also lists 1 and 2 scores at -2.0; the USGA
 *            copy starts at 3, and this calculator requires 3 scores (54 holes).
 *  Rule 6.1  Course Handicap = Handicap Index × (Slope / 113) + (Course Rating − Par), rounded to a whole number
 *            (0.5 rounds up, so −1.5 becomes −1).
 *  Rule 6.2  Playing Handicap = Course Handicap × Handicap Allowance (e.g. 95% individual stroke play, 100% individual
 *            match play), rounded to a whole number.
 *
 * Not modelled (they need your history, not just these scores): the soft/hard cap against your Low Handicap Index
 * (Rule 5.8), Exceptional Score Reduction (Rule 5.9), and nine-hole score conversion.
 * The old pre-2020 USGA "× 0.96" bonus of excellence does NOT exist in WHS.
 */
import { D, type Dec } from '../../../utils/stats';

export const MAX_HANDICAP_INDEX = 54;

const roundHalfUp = (d: Dec, dp: number): Dec => d.toDecimalPlaces(dp, D.ROUND_HALF_CEIL);

/** Rule 5.1. All inputs plain numbers; result rounded to one decimal. */
export function scoreDifferential(adjustedGross: number, courseRating: number, slope: number, pcc = 0): number {
  const diff = new D(113).div(slope).times(new D(adjustedGross).minus(courseRating).minus(pcc));
  return roundHalfUp(diff, 1).toNumber();
}

/** Rule 5.2 table. Returns null below the 3-score (54-hole) minimum. */
export function whsTable(scores: number): { count: number; adjustment: number } | null {
  if (scores < 3) return null;
  if (scores === 3) return { count: 1, adjustment: -2 };
  if (scores === 4) return { count: 1, adjustment: -1 };
  if (scores === 5) return { count: 1, adjustment: 0 };
  if (scores === 6) return { count: 2, adjustment: -1 };
  if (scores <= 8) return { count: 2, adjustment: 0 };
  if (scores <= 11) return { count: 3, adjustment: 0 };
  if (scores <= 14) return { count: 4, adjustment: 0 };
  if (scores <= 16) return { count: 5, adjustment: 0 };
  if (scores <= 18) return { count: 6, adjustment: 0 };
  if (scores === 19) return { count: 7, adjustment: 0 };
  return { count: 8, adjustment: 0 };
}

export interface IndexResult {
  index: number;
  /** Average of the selected differentials before the adjustment, unrounded to 2 dp for display. */
  average: number;
  adjustment: number;
  count: number;
  scoresUsed: number;
  /** Indices (into the provided array) of the differentials that were selected. */
  usedIndices: number[];
}

/**
 * `differentials` are most-recent first; only the first 20 are considered. Ties are broken by recency
 * (the more recent score is the one used), which makes the selection deterministic.
 */
export function handicapIndex(differentials: number[]): IndexResult | null {
  const recent = differentials.slice(0, 20);
  const table = whsTable(recent.length);
  if (!table) return null;
  const order = recent.map((d, i) => ({ d, i })).sort((a, b) => a.d - b.d || a.i - b.i).slice(0, table.count);
  const sum = order.reduce((s, x) => s.plus(x.d), new D(0));
  const avg = sum.div(table.count);
  let index = roundHalfUp(avg.plus(table.adjustment), 1);
  if (index.greaterThan(MAX_HANDICAP_INDEX)) index = new D(MAX_HANDICAP_INDEX);
  return {
    index: index.toNumber(),
    average: avg.toDecimalPlaces(2, D.ROUND_HALF_CEIL).toNumber(),
    adjustment: table.adjustment,
    count: table.count,
    scoresUsed: recent.length,
    usedIndices: order.map((x) => x.i),
  };
}

/** Rule 6.1. */
export function courseHandicap(index: number, slope: number, courseRating: number, par: number): number {
  const ch = new D(index).times(slope).div(113).plus(new D(courseRating).minus(par));
  return roundHalfUp(ch, 0).toNumber();
}

/** Rule 6.2 (allowance as a percentage, e.g. 95). */
export function playingHandicap(courseHcp: number, allowancePct: number): number {
  return roundHalfUp(new D(courseHcp).times(allowancePct).div(100), 0).toNumber();
}

/** Plus handicaps (better than scratch) are written "+1.2", never "-1.2". */
export function formatIndex(index: number): string {
  return index < 0 ? `+${Math.abs(index).toFixed(1)}` : index.toFixed(1);
}

export function formatCourseHandicap(n: number): string {
  return n < 0 ? `+${Math.abs(n)}` : String(n);
}
