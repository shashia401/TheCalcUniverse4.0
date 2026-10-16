import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/golf-handicap/index';
import { getValue, near } from '../../helpers';

// World Handicap System expectations (no ×0.96, index rounded to a tenth, 3-score minimum); see golf-handicap.test.ts
// for the fully derived cases. These are the original smoke tests, corrected to the WHS rules.
const THREE = '85, 72.5, 130\n92, 74.0, 140\n80, 72.0, 125';

describe('golf-handicap', () => {
  it('three rounds produce an index (differential 10.865 -> 10.9, lowest 7.2 − 2.0 = 5.2)', () => {
    const r = config.calculate({ rounds: THREE });
    near(parseFloat(getValue(r, 'handicapIndex')), 5.2);
  });

  it('5 rounds uses lowest 1 differential', () => {
    const r = config.calculate({
      rounds: '85, 72.5, 130\n92, 74.0, 140\n80, 72.0, 125\n88, 73.0, 135\n95, 75.0, 145',
      numRounds: '5',
    });
    expect(getValue(r, 'roundsUsed')).toBe('Lowest 1 of 5');
  });

  it('20 rounds uses lowest 8 differentials', () => {
    const rounds = Array.from({ length: 20 }, (_, i) => {
      const score = 80 + (i % 10);
      return `${score}, 72.0, 125`;
    }).join('\n');
    const r = config.calculate({ rounds, numRounds: '20' });
    expect(getValue(r, 'roundsUsed')).toBe('Lowest 8 of 20');
  });

  it('calculates a positive handicap index for 20 rounds', () => {
    const rounds = Array.from({ length: 20 }, (_, i) => {
      const score = 85 + (i % 5);
      return `${score}, 72.5, 130`;
    }).join('\n');
    const r = config.calculate({ rounds, numRounds: '20' });
    expect(parseFloat(getValue(r, 'handicapIndex'))).toBeGreaterThan(0);
    expect(getValue(r, 'roundsUsed')).toContain('Lowest');
  });

  it('parses round differentials correctly (rounded to a tenth)', () => {
    const r = config.calculate({ rounds: THREE });
    const differentials = JSON.parse(getValue(r, '_differentials'));
    expect(differentials).toHaveLength(3);
    near(differentials[0].differential, 10.9);
  });

  it('shows courseHandicap as the rounded index when no course is entered', () => {
    const r = config.calculate({ rounds: THREE });
    expect(getValue(r, 'courseHandicap')).toBe('5');
  });

  it('skips malformed lines', () => {
    const r = config.calculate({ rounds: `${THREE}\ninvalid` });
    const differentials = JSON.parse(getValue(r, '_differentials'));
    expect(differentials).toHaveLength(3);
  });

  it('returns empty for empty input', () => {
    const r = config.calculate({ rounds: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for all invalid lines', () => {
    const r = config.calculate({ rounds: 'abc\ndef\n' });
    expect(r).toEqual([]);
  });

  it('handles a plus handicap (differentials below zero)', () => {
    const rounds = Array.from({ length: 5 }, () => '70, 72.5, 130').join('\n');
    const r = config.calculate({ rounds });
    // diff = (70−72.5)×113/130 = −2.17 -> −2.2; lowest 1 of 5, no adjustment -> index −2.2, shown as +2.2
    expect(getValue(r, 'handicapIndex')).toBe('+2.2');
  });

  it('handles slope of 113 exactly (standard difficulty)', () => {
    const rounds = Array.from({ length: 5 }, () => '82, 72.0, 113').join('\n');
    const r = config.calculate({ rounds });
    near(parseFloat(getValue(r, 'handicapIndex')), 10.0); // (82−72)×113/113 = 10, no 0.96 factor
  });

  it('treats 6 rounds as lowest 2 (minus 1.0)', () => {
    const rounds = Array.from({ length: 6 }, (_, i) => `${80 + i}, 72.0, 125`).join('\n');
    const r = config.calculate({ rounds, numRounds: '20' });
    expect(getValue(r, 'roundsUsed')).toBe('Lowest 2 of 6');
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

  it('extraPanel returns element when results exist', () => {
    const r = config.calculate({ rounds: THREE });
    const panel = config.extraPanel!({ rounds: THREE, numRounds: '20' }, r);
    expect(panel).not.toBeNull();
  });

  it('extraPanel returns null when results empty', () => {
    const r = config.calculate({ rounds: '' });
    const panel = config.extraPanel!({ rounds: '', numRounds: '20' }, r);
    expect(panel).toBeNull();
  });
});
