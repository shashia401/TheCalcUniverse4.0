import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/golf-handicap/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('golf-handicap', () => {
  it('single round produces correct differential', () => {
    const r = config.calculate({ rounds: '85, 72.5, 130' });
    // diff = (85-72.5)*113/130 = 12.5*113/130 = 10.865
    near(parseNumber(getValue(r, 'handicapIndex')), 10.4); // 10.865 * 0.96 = 10.43
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

  it('calculates correct handicap index for 20 rounds', () => {
    // Generate rounds with known differentials
    const rounds = Array.from({ length: 20 }, (_, i) => {
      const score = 85 + (i % 5);
      return `${score}, 72.5, 130`;
    }).join('\n');
    const r = config.calculate({ rounds, numRounds: '20' });
    expect(parseFloat(getValue(r, 'handicapIndex'))).toBeGreaterThan(0);
    expect(getValue(r, 'roundsUsed')).toContain('Lowest');
  });

  it('parses round differentials correctly', () => {
    const r = config.calculate({ rounds: '85, 72.5, 130' });
    const differentials = JSON.parse(getValue(r, '_differentials'));
    expect(differentials).toHaveLength(1);
    near(differentials[0].differential, 10.87);
  });

  it('shows courseHandicap as rounded index', () => {
    const r = config.calculate({ rounds: '85, 72.5, 130' });
    const courseHcp = parseInt(getValue(r, 'courseHandicap'), 10);
    expect(courseHcp).toBeGreaterThanOrEqual(0);
  });

  it('skips malformed lines', () => {
    const r = config.calculate({ rounds: '85, 72.5, 130\ninvalid\n92, 74.0, 140' });
    const differentials = JSON.parse(getValue(r, '_differentials'));
    expect(differentials).toHaveLength(2);
  });

  it('returns empty for empty input', () => {
    const r = config.calculate({ rounds: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for all invalid lines', () => {
    const r = config.calculate({ rounds: 'abc\ndef\n' });
    expect(r).toEqual([]);
  });

  it('handles negative differential (below course rating)', () => {
    const r = config.calculate({ rounds: '70, 72.5, 130' });
    // diff = (70-72.5)*113/130 = -2.5*113/130 = -2.17
    near(parseNumber(getValue(r, 'handicapIndex')), -2.1); // -2.17 * 0.96 = -2.08
    expect(parseFloat(getValue(r, 'handicapIndex'))).toBeLessThan(0);
  });

  it('handles slope of 113 exactly (standard difficulty)', () => {
    const r = config.calculate({ rounds: '82, 72.0, 113' });
    // diff = (82-72)*113/113 = 10
    near(parseFloat(getValue(r, 'handicapIndex')), 9.6); // 10 * 0.96 = 9.6
  });

  it('treats 6 rounds as lowest 1', () => {
    const rounds = Array.from({ length: 6 }, (_, i) => `${80 + i}, 72.0, 125`).join('\n');
    const r = config.calculate({ rounds, numRounds: '20' });
    expect(getValue(r, 'roundsUsed')).toBe('Lowest 1 of 6');
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
    const r = config.calculate({ rounds: '85, 72.5, 130' });
    const panel = config.extraPanel({ rounds: '85, 72.5, 130', numRounds: '20' }, r);
    expect(panel).not.toBeNull();
  });

  it('extraPanel returns null when results empty', () => {
    const r = config.calculate({ rounds: '' });
    const panel = config.extraPanel({ rounds: '', numRounds: '20' }, r);
    expect(panel).toBeNull();
  });
});
