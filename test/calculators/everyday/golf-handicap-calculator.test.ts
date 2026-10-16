import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/golf-handicap/index';
import { getValue, near } from '../../helpers';

// The registry serves slug "golf-handicap-calculator" (everyday category) from math/golf-handicap. This is a smoke
// test of that slug; the full World Handicap System coverage lives in test/calculators/math/golf-handicap.test.ts
// and golf-whs.test.ts. (These tests used to assert the pre-2020 ×0.96 rule, which the WHS removed.)
const THREE = '85, 72.5, 130\n92, 74.0, 140\n80, 72.0, 125';

describe('golf-handicap-calculator (everyday slug)', () => {
  it('three rounds produce a WHS index: lowest differential 7.2 − 2.0 = 5.2', () => {
    const r = config.calculate({ rounds: THREE });
    near(parseFloat(getValue(r, 'handicapIndex')), 5.2);
    expect(getValue(r, 'roundsUsed')).toBe('Lowest 1 of 3');
  });

  it('a single round cannot establish an index', () => {
    const r = config.calculate({ rounds: '85, 72.5, 130' });
    expect(r.map((x) => x.id)).toEqual(['warning']);
  });

  it('20 rounds use the lowest 8 differentials', () => {
    const rounds = Array.from({ length: 20 }, (_, i) => `${80 + (i % 10)}, 72.0, 125`).join('\n');
    const r = config.calculate({ rounds, numRounds: '20' });
    expect(getValue(r, 'roundsUsed')).toBe('Lowest 8 of 20');
  });

  it('empty and invalid input give no results', () => {
    expect(config.calculate({ rounds: '' })).toEqual([]);
    expect(config.calculate({ rounds: 'abc\ndef\n' })).toEqual([]);
  });
});
