import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/fraction/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Fraction Calculator', () => {
  it('adds fractions: 3/4 + 1/3', () => {
    const r = config.calculate({ mode: 'add', aNum: '3', aDen: '4', bNum: '1', bDen: '3' });
    expect(getValue(r, 'result')).toBe('13/12');
  });

  it('subtracts fractions: 3/4 − 1/4', () => {
    const r = config.calculate({ mode: 'subtract', aNum: '3', aDen: '4', bNum: '1', bDen: '4' });
    expect(getValue(r, 'result')).toBe('1/2');
  });

  it('multiplies fractions: 2/3 × 3/4', () => {
    const r = config.calculate({ mode: 'multiply', aNum: '2', aDen: '3', bNum: '3', bDen: '4' });
    expect(getValue(r, 'result')).toBe('1/2');
  });

  it('divides fractions: 2/3 ÷ 3/4', () => {
    const r = config.calculate({ mode: 'divide', aNum: '2', aDen: '3', bNum: '3', bDen: '4' });
    expect(getValue(r, 'result')).toBe('8/9');
  });

  it('returns integer result when denominator simplifies to 1', () => {
    const r = config.calculate({ mode: 'add', aNum: '1', aDen: '2', bNum: '1', bDen: '2' });
    expect(getValue(r, 'result')).toBe('1');
  });

  it('returns decimal equivalent', () => {
    const r = config.calculate({ mode: 'add', aNum: '1', aDen: '2', bNum: '1', bDen: '4' });
    near(parseFloat(getValue(r, 'decimal')), 0.75);
  });

  it('returns empty for zero/negative denominator', () => {
    const r = config.calculate({ mode: 'add', aNum: '1', aDen: '0', bNum: '1', bDen: '3' });
    expect(r).toEqual([]);
  });

  it('subtracts with negative result', () => {
    const r = config.calculate({ mode: 'subtract', aNum: '1', aDen: '3', bNum: '2', bDen: '3' });
    expect(getValue(r, 'result')).toContain('-');
  });
});
