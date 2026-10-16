import { describe, it, expect } from 'vitest';
import {
  courseHandicap,
  formatCourseHandicap,
  formatIndex,
  handicapIndex,
  playingHandicap,
  scoreDifferential,
  whsTable,
} from '../../../src/calculators/math/golf-handicap/whs';

// World Handicap System, Rules of Handicapping 5.1 / 5.2 / 6.1 / 6.2. Expected values derived independently
// (Python Decimal, rounding half up) and cross-checked with the table on https://en.wikipedia.org/wiki/World_Handicap_System.
describe('WHS arithmetic', () => {
  it('Rule 5.2 table: number of differentials used and adjustment for every score count', () => {
    const expected: Record<number, [number, number]> = {
      3: [1, -2], 4: [1, -1], 5: [1, 0], 6: [2, -1], 7: [2, 0], 8: [2, 0], 9: [3, 0], 10: [3, 0], 11: [3, 0],
      12: [4, 0], 13: [4, 0], 14: [4, 0], 15: [5, 0], 16: [5, 0], 17: [6, 0], 18: [6, 0], 19: [7, 0], 20: [8, 0],
    };
    for (const [n, [count, adjustment]] of Object.entries(expected)) {
      expect(whsTable(Number(n))).toEqual({ count, adjustment });
    }
    expect(whsTable(2)).toBeNull();
    expect(whsTable(0)).toBeNull();
  });

  it('Rule 5.1 differentials round to a tenth, with .x5 rounding up', () => {
    expect(scoreDifferential(85, 72.5, 130)).toBe(10.9); // 10.865
    expect(scoreDifferential(92, 72.5, 130)).toBe(17); // 16.95 exactly -> 17.0
    expect(scoreDifferential(90, 74.0, 140)).toBe(12.9); // 12.914
    expect(scoreDifferential(90, 69.5, 120)).toBe(19.3); // 19.304
    expect(scoreDifferential(85, 72.5, 130, 1)).toBe(10); // PCC +1: 9.996
    expect(scoreDifferential(70, 72.5, 130)).toBe(-2.2); // -2.173
  });

  it('Rule 5.2: fewer than 3 scores gives no index', () => {
    expect(handicapIndex([10.9, 12.0])).toBeNull();
    expect(handicapIndex([])).toBeNull();
  });

  it('Rule 5.2: 3 scores (10.9, 17.0, 13.5) -> lowest 10.9 − 2.0 = 8.9', () => {
    const r = handicapIndex([10.9, 17, 13.5])!;
    expect(r.index).toBe(8.9);
    expect(r.usedIndices).toEqual([0]);
    expect(r.adjustment).toBe(-2);
  });

  it('only the 20 most recent scores count, and ties go to the more recent score', () => {
    const recent20 = Array.from({ length: 20 }, () => 10);
    const r = handicapIndex([...recent20, 1, 1, 1, 1, 1])!; // older 1.0s are ignored
    expect(r.index).toBe(10);
    expect(r.scoresUsed).toBe(20);
    expect(r.usedIndices).toEqual([0, 1, 2, 3, 4, 5, 6, 7]); // ties -> most recent first
  });

  it('averages are rounded half up to a tenth: lowest 2 of 6 (7.2, 8.1) = 7.65 − 1.0 -> 6.7', () => {
    expect(handicapIndex([7.2, 8.1, 9.0, 9.9, 10.8, 11.8])!.index).toBe(6.7);
  });

  it('maximum Handicap Index is 54.0', () => {
    expect(handicapIndex(Array.from({ length: 20 }, () => 60))!.index).toBe(54);
  });

  it('Rule 6.1 Course Handicap = index × slope/113 + (rating − par), rounded to a whole number', () => {
    expect(courseHandicap(12.4, 125, 71.4, 72)).toBe(13); // 13.117
    expect(courseHandicap(11.7, 125, 71.4, 72)).toBe(12); // 12.342
    expect(courseHandicap(11.7, 140, 75.0, 72)).toBe(17); // 17.4956
    expect(courseHandicap(20, 113, 72, 72)).toBe(20); // slope 113, rating = par: the index itself
    expect(courseHandicap(-1.5, 113, 72, 72)).toBe(-1); // half rounds up: −1.5 -> −1
  });

  it('Rule 6.2 Playing Handicap = Course Handicap × allowance, rounded half up', () => {
    expect(playingHandicap(13, 95)).toBe(12); // 12.35
    expect(playingHandicap(10, 95)).toBe(10); // 9.5 -> 10
    expect(playingHandicap(20, 100)).toBe(20);
  });

  it('plus handicaps are written +1.2, never -1.2', () => {
    expect(formatIndex(-1.2)).toBe('+1.2');
    expect(formatIndex(0)).toBe('0.0');
    expect(formatIndex(54)).toBe('54.0');
    expect(formatCourseHandicap(-3)).toBe('+3');
    expect(formatCourseHandicap(7)).toBe('7');
  });
});
