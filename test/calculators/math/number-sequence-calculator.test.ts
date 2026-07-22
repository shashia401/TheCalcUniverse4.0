import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/number-sequence/index';
import { getValue } from '../../helpers';

describe('Number Sequence Calculator', () => {
  it('identifies arithmetic sequence', () => {
    const r = config.calculate({ sequence: '2, 4, 6, 8, 10', nextCount: '3' });
    expect(getValue(r, 'sequenceType')).toBe('Arithmetic');
    expect(getValue(r, 'nthTerm')).toContain('n');
  });

  it('identifies geometric sequence', () => {
    const r = config.calculate({ sequence: '3, 6, 12, 24, 48', nextCount: '3' });
    expect(getValue(r, 'sequenceType')).toBe('Geometric');
  });

  it('identifies Fibonacci sequence', () => {
    const r = config.calculate({ sequence: '1, 1, 2, 3, 5, 8, 13', nextCount: '3' });
    expect(getValue(r, 'sequenceType')).toBe('Fibonacci');
  });

  it('returns unknown for unrecognized pattern', () => {
    const r = config.calculate({ sequence: '1, 4, 9, 16, 25', nextCount: '3' });
    expect(getValue(r, 'sequenceType')).toBe('Unknown');
  });

  it('computes next terms for arithmetic', () => {
    const r = config.calculate({ sequence: '1, 3, 5, 7', nextCount: '3' });
    expect(getValue(r, 'nextTerms')).toBe('9, 11, 13');
  });

  it('returns nth-term formula for arithmetic', () => {
    const r = config.calculate({ sequence: '5, 10, 15, 20', nextCount: '2' });
    expect(getValue(r, 'nthTerm')).toBeTruthy();
  });

  it('returns empty for fewer than 2 terms', () => {
    const r = config.calculate({ sequence: '5', nextCount: '3' });
    expect(r).toEqual([]);
  });

  it('returns full extended sequence', () => {
    const r = config.calculate({ sequence: '2, 4, 6', nextCount: '2' });
    expect(getValue(r, 'fullSequence')).toBe('2, 4, 6, 8, 10');
  });
});
