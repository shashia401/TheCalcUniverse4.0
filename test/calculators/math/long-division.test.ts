import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/long-division/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Long Division calculator', () => {
  it('divides 4876 by 12 correctly', () => {
    const r = config.calculate({ dividend: '4876', divisor: '12' });
    const quotient = parseInt(getValue(r, 'quotient'));
    expect(quotient).toBe(406);
  });

  it('shows remainder', () => {
    const r = config.calculate({ dividend: '4876', divisor: '12' });
    const remainder = parseInt(getValue(r, 'remainder'));
    expect(remainder).toBe(4);
  });

  it('divides 100 by 3 gives quotient 33', () => {
    const r = config.calculate({ dividend: '100', divisor: '3' });
    expect(parseInt(getValue(r, 'quotient'))).toBe(33);
  });

  it('shows decimal result', () => {
    const r = config.calculate({ dividend: '100', divisor: '3' });
    expect(getValue(r, 'decimalResult')).toContain('33');
  });

  it('includes division steps data', () => {
    const r = config.calculate({ dividend: '4876', divisor: '12' });
    expect(getValue(r, 'divisionData')).toContain('steps');
  });

  it('divides 10 by 2 = 5 exactly', () => {
    const r = config.calculate({ dividend: '10', divisor: '2' });
    expect(parseInt(getValue(r, 'quotient'))).toBe(5);
  });

  it('returns empty for zero divisor', () => {
    const r = config.calculate({ dividend: '5', divisor: '0' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN input', () => {
    const r = config.calculate({ dividend: 'abc', divisor: '5' });
    expect(r).toEqual([]);
  });
});
