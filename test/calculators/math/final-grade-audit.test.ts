import { describe, it, expect } from 'vitest';
import gradeConfig from '../../../src/calculators/math/grade/index';
import testScoreConfig from '../../../src/calculators/math/test-score/index';
import { finalExamNeeded } from '../../../src/utils/finalGrade';
import { getValue } from '../../helpers';

// Expected values are exact fractions.Fraction arithmetic:
//   needed = (desired - current*(100-w)/100) * 100 / w ; floor = current*(100-w)/100 ; ceiling = floor + w
const CASES: [number, number, number, number, number, number, string][] = [
  // current, desired, weight, needed, floor, ceiling, status
  [85, 90, 20, 110, 68, 88, 'impossible'],
  [85, 88, 50, 91, 42.5, 92.5, 'reachable'],
  [95, 90, 20, 70, 76, 96, 'reachable'], // BUG FIXED: grade calculator used to say "already achieved, 0%"
  [95, 70, 20, -30, 76, 96, 'secured'],
  [80, 90, 20, 130, 64, 84, 'impossible'],
  [60, 70, 40, 85, 36, 76, 'reachable'], // FAQ example (was wrongly 90% in the text)
  [87.3, 91.7, 33.3, 100.51, 58.23, 91.53, 'impossible'], // 100.5132... rounds to 100.51 -> still impossible
  [70, 70, 100, 70, 0, 100, 'reachable'],
  [100, 100, 0.1, 100, 99.9, 100, 'reachable'], // exactly 100.00 needed is reachable, no float fuzz
];

describe('finalExamNeeded (shared formula)', () => {
  for (const [c, d, w, needed, floor, ceiling, status] of CASES) {
    it(`current ${c}, desired ${d}, weight ${w}`, () => {
      const r = finalExamNeeded(c, d, w)!;
      expect(r.needed).toBe(needed);
      expect(r.floor).toBe(floor);
      expect(r.ceiling).toBe(ceiling);
      expect(r.status).toBe(status);
    });
  }
  it('rejects invalid input', () => {
    expect(finalExamNeeded(NaN, 90, 20)).toBeNull();
    expect(finalExamNeeded(85, 90, 0)).toBeNull();
    expect(finalExamNeeded(85, 90, 101)).toBeNull();
    expect(finalExamNeeded(-1, 90, 20)).toBeNull();
    expect(finalExamNeeded(85, 90, Infinity)).toBeNull();
  });
});

describe('grade and test-score (test-score-calculator) agree on identical inputs', () => {
  for (const [c, d, w, needed, , ceiling, status] of CASES) {
    it(`current ${c}, desired ${d}, weight ${w}`, () => {
      const v = { currentGrade: String(c), desiredGrade: String(d), examWeight: String(w) };
      const g = gradeConfig.calculate(v);
      const t = testScoreConfig.calculate(v);
      const gNeeded = status === 'secured' ? 0 : needed;
      expect(parseFloat(getValue(g, 'neededGrade'))).toBe(gNeeded);
      expect(parseFloat(getValue(t, 'needed'))).toBe(needed);
      expect(getValue(t, 'bestPossible')).toBe(`${ceiling}%`);
      const gData = JSON.parse(getValue(g, '_gradeData'));
      const tData = JSON.parse(getValue(t, '_examData'));
      expect(gData.status).toBe(status);
      expect(tData.status).toBe(status);
      expect(gData.needed).toBe(tData.needed);
    });
  }
  it('impossible target is never silently capped at 100% (test-score used to show 100.0%)', () => {
    const t = testScoreConfig.calculate({ currentGrade: '85', desiredGrade: '90', examWeight: '20' });
    expect(getValue(t, 'needed')).toBe('110%');
    expect(getValue(t, 'impossible')).toContain('88%');
  });
  it('95/90/20 needs 70%, not 0%', () => {
    const g = gradeConfig.calculate({ currentGrade: '95', desiredGrade: '90', examWeight: '20' });
    expect(getValue(g, 'neededGrade')).toBe('70%');
    expect(getValue(g, 'status')).toBe('Easily achievable. Study as planned.');
  });
  it('incomplete input returns []', () => {
    expect(gradeConfig.calculate({ currentGrade: '', desiredGrade: '90', examWeight: '20' })).toEqual([]);
    expect(testScoreConfig.calculate({ currentGrade: '85', desiredGrade: '90', examWeight: '0' })).toEqual([]);
    expect(testScoreConfig.calculate({ currentGrade: '85x', desiredGrade: '90', examWeight: '20' })).toEqual([]);
  });
  it('near-perfect warning and secured note on test-score', () => {
    const w = testScoreConfig.calculate({ currentGrade: '85', desiredGrade: '88', examWeight: '20' });
    // needed = (88 - 68)/0.2 = 100 -> reachable, warning
    expect(getValue(w, 'needed')).toBe('100%');
    expect(w.find((r) => r.id === 'warning')).toBeDefined();
    const s = testScoreConfig.calculate({ currentGrade: '95', desiredGrade: '70', examWeight: '20' });
    expect(getValue(s, 'needed')).toBe('-30%');
    expect(getValue(s, 'note')).toContain('already have the desired grade');
  });
});
