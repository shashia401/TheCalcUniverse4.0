import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/scientific/index';
import { getValue } from '../../helpers';

describe('Scientific Calculator', () => {
  it('evaluates basic expression', () => {
    const r = config.calculate({ expression: '2 + 3' });
    expect(getValue(r, 'result')).toBe('5');
  });

  it('evaluates multiplication before addition', () => {
    const r = config.calculate({ expression: '2 + 3 × 4' });
    expect(getValue(r, 'result')).toBe('14');
  });

  it('returns empty for empty expression', () => {
    const r = config.calculate({ expression: '' });
    expect(r).toEqual([]);
  });

  it('evaluates parenthesized expressions', () => {
    const r = config.calculate({ expression: '(2 + 3) × 4' });
    expect(getValue(r, 'result')).toBe('20');
  });
});
