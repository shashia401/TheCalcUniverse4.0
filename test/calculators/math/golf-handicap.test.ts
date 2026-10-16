import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/golf-handicap/index';
import { getValue, near } from '../../helpers';

// Expected values follow the World Handicap System (Rules of Handicapping 5.1, 5.2, 6.1) and were derived
// independently in Python with Decimal arithmetic. There is no 0.96 factor and the index is rounded, not truncated.
const THREE = '85, 72.5, 130\n92, 74.0, 140\n80, 72.0, 125';
const FIVE = `${THREE}\n88, 73.0, 135\n95, 75.0, 145`;

describe('golf-handicap', () => {
  it('fewer than 3 scores cannot establish an index: explains why instead of inventing one', () => {
    const r = config.calculate({ rounds: '85, 72.5, 130' });
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('warning');
    expect(r[0].value).toContain('at least 3 scores');
  });

  it('3 scores: lowest 1 differential minus 2.0 -> 7.2 − 2.0 = 5.2', () => {
    const r = config.calculate({ rounds: THREE, numRounds: '20' });
    expect(getValue(r, 'handicapIndex')).toBe('5.2');
    expect(getValue(r, 'roundsUsed')).toBe('Lowest 1 of 3');
    expect(getValue(r, 'adjustment')).toBe('−2.0');
  });

  it('5 rounds uses lowest 1 differential, no adjustment -> 7.2', () => {
    const r = config.calculate({ rounds: FIVE, numRounds: '5' });
    expect(getValue(r, 'roundsUsed')).toBe('Lowest 1 of 5');
    expect(getValue(r, 'handicapIndex')).toBe('7.2');
    expect(r.some((x) => x.id === 'adjustment')).toBe(false);
  });

  it('20 rounds uses lowest 8 differentials -> average 8.55 rounds to 8.6', () => {
    const rounds = Array.from({ length: 20 }, (_, i) => `${80 + (i % 10)}, 72.0, 125`).join('\n');
    const r = config.calculate({ rounds, numRounds: '20' });
    expect(getValue(r, 'roundsUsed')).toBe('Lowest 8 of 20');
    expect(getValue(r, 'handicapIndex')).toBe('8.6');
    expect(getValue(r, 'averageDifferential')).toBe('8.55');
  });

  it('differentials are rounded to a tenth: (85−72.5)×113/130 = 10.865 -> 10.9', () => {
    const r = config.calculate({ rounds: THREE });
    const differentials = JSON.parse(getValue(r, '_differentials'));
    expect(differentials).toHaveLength(3);
    near(differentials[0].differential, 10.9);
    expect(differentials.filter((d: { used: boolean }) => d.used)).toHaveLength(1);
  });

  it('course handicap with no course entered is the rounded index; with a course it uses slope and CR − par', () => {
    const rounds = Array.from({ length: 5 }, () => '86, 72.5, 130').join('\n'); // every differential 11.7
    const plain = config.calculate({ rounds });
    expect(getValue(plain, 'handicapIndex')).toBe('11.7');
    expect(getValue(plain, 'courseHandicap')).toBe('12');
    const withCourse = config.calculate({ rounds, courseSlope: '125', courseRating: '71.4', coursePar: '72' });
    expect(getValue(withCourse, 'courseHandicap')).toBe('12'); // 11.7 × 125/113 − 0.6 = 12.34
    const hard = config.calculate({ rounds, courseSlope: '140', courseRating: '75.0', coursePar: '72' });
    expect(getValue(hard, 'courseHandicap')).toBe('17'); // 11.7 × 140/113 + 3.0 = 17.4956
  });

  it('skips malformed lines (a strict parse, so "88x" is not read as 88)', () => {
    const r = config.calculate({ rounds: `${THREE}\ninvalid\n88x, 73, 135` });
    const differentials = JSON.parse(getValue(r, '_differentials'));
    expect(differentials).toHaveLength(3);
  });

  it('returns empty for empty input and for all-invalid lines', () => {
    expect(config.calculate({ rounds: '' })).toEqual([]);
    expect(config.calculate({ rounds: 'abc\ndef\n' })).toEqual([]);
  });

  it('plus handicap: five rounds of −2.2 give an index of +2.2 (never "-2.2")', () => {
    const rounds = Array.from({ length: 5 }, () => '70, 72.5, 130').join('\n');
    const r = config.calculate({ rounds });
    expect(getValue(r, 'handicapIndex')).toBe('+2.2');
    expect(getValue(r, 'courseHandicap')).toBe('+2');
  });

  it('slope 113 exactly: differential equals score minus rating -> index 10.0', () => {
    const rounds = Array.from({ length: 5 }, () => '82, 72.0, 113').join('\n');
    const r = config.calculate({ rounds });
    near(parseFloat(getValue(r, 'handicapIndex')), 10.0);
  });

  it('6 rounds: lowest 2 averaged (7.2, 8.1 -> 7.65) minus 1.0 = 6.65 -> 6.7', () => {
    const rounds = Array.from({ length: 6 }, (_, i) => `${80 + i}, 72.0, 125`).join('\n');
    const r = config.calculate({ rounds, numRounds: '20' });
    expect(getValue(r, 'roundsUsed')).toBe('Lowest 2 of 6');
    expect(getValue(r, 'handicapIndex')).toBe('6.7');
    expect(getValue(r, 'adjustment')).toBe('−1.0');
  });

  it('treats 7-8 rounds as lowest 2', () => {
    const rounds = Array.from({ length: 8 }, (_, i) => `${80 + i}, 72.0, 125`).join('\n');
    const r = config.calculate({ rounds, numRounds: '20' });
    expect(getValue(r, 'roundsUsed')).toBe('Lowest 2 of 8');
  });

  it('treats 9-11 rounds as lowest 3', () => {
    const rounds = Array.from({ length: 10 }, (_, i) => `${80 + i}, 72.0, 125`).join('\n');
    const r = config.calculate({ rounds, numRounds: '20' });
    expect(getValue(r, 'roundsUsed')).toBe('Lowest 3 of 10');
  });

  it('numRounds limits to the most recent N lines', () => {
    const rounds = Array.from({ length: 12 }, (_, i) => `${80 + i}, 72.0, 125`).join('\n');
    const r = config.calculate({ rounds, numRounds: '10' });
    expect(getValue(r, 'roundsUsed')).toBe('Lowest 3 of 10');
  });

  it('PCC (4th number) lowers the differential: (85−72.5−1)×113/130 = 9.996 -> 10.0', () => {
    const r = config.calculate({ rounds: `85, 72.5, 130, 1\n${THREE}` });
    const d = JSON.parse(getValue(r, '_differentials'));
    near(d[0].differential, 10.0);
  });

  it('slope outside the WHS range 55–155 is skipped', () => {
    expect(config.calculate({ rounds: '85, 72.5, 40\n85, 72.5, 200\n85, 72.5, 0' })).toEqual([]);
  });

  it('extraPanel returns element when results exist, null when empty', () => {
    const r = config.calculate({ rounds: THREE });
    expect(config.extraPanel!({ rounds: THREE, numRounds: '20' }, r)).not.toBeNull();
    const none = config.calculate({ rounds: '' });
    expect(config.extraPanel!({ rounds: '', numRounds: '20' }, none)).toBeNull();
  });

  it('the education text no longer teaches the removed ×0.96 factor', () => {
    expect(config.educational.formula).not.toContain('0.96');
    expect(config.educational.explanation).not.toContain('0.96');
    expect(JSON.stringify(config.educational.diagram)).not.toContain('0.96');
  });
});
