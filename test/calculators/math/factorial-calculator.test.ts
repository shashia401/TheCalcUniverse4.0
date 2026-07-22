import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/factorial-calculator/index';
import { getValue } from '../../helpers';

describe('Factorial calculator', () => {
  it('computes 0! = 1', () => {
    const r = config.calculate({ n: '0' });
    expect(getValue(r, 'factorial')).toBe('1');
    expect(getValue(r, 'digitCount')).toBe('1');
    expect(getValue(r, 'trailingZeros')).toBe('0');
  });

  it('computes 1! = 1', () => {
    const r = config.calculate({ n: '1' });
    expect(getValue(r, 'factorial')).toBe('1');
    expect(getValue(r, 'digitCount')).toBe('1');
    expect(getValue(r, 'trailingZeros')).toBe('0');
  });

  it('computes 5! = 120', () => {
    const r = config.calculate({ n: '5' });
    expect(getValue(r, 'factorial')).toBe('120');
    expect(getValue(r, 'steps')).toContain('5 × 4 × 3 × 2 × 1 = 120');
    expect(getValue(r, 'digitCount')).toBe('3');
    expect(getValue(r, 'trailingZeros')).toBe('1');
  });

  it('computes 10! = 3,628,800', () => {
    const r = config.calculate({ n: '10' });
    expect(getValue(r, 'factorial')).toBe('3,628,800');
    expect(getValue(r, 'digitCount')).toBe('7');
    expect(getValue(r, 'trailingZeros')).toBe('2');
  });

  it('computes 20! correctly', () => {
    const r = config.calculate({ n: '20' });
    expect(getValue(r, 'factorial')).toBe('2,432,902,008,176,640,000');
    expect(getValue(r, 'digitCount')).toBe('19');
    expect(getValue(r, 'trailingZeros')).toBe('4');
  });

  it('computes trailing zeros for 25!', () => {
    const r = config.calculate({ n: '25' });
    expect(getValue(r, 'trailingZeros')).toBe('6');
  });

  it('computes trailing zeros for 100!', () => {
    const r = config.calculate({ n: '100' });
    expect(getValue(r, 'trailingZeros')).toBe('24');
  });

  it('computes 170! (max valid)', () => {
    const r = config.calculate({ n: '170' });
    const fact = getValue(r, 'factorial');
    expect(fact).toBeDefined();
    expect(fact).not.toBe('Infinity');
    // 170! should have many trailing zeros
    expect(parseInt(getValue(r, 'trailingZeros'), 10)).toBeGreaterThan(0);
  });

  it('shows step-by-step calculation for 4!', () => {
    const r = config.calculate({ n: '4' });
    expect(getValue(r, 'steps')).toBe('4 × 3 × 2 × 1 = 24');
  });

  it('shows step-by-step for 0!', () => {
    const r = config.calculate({ n: '0' });
    expect(getValue(r, 'steps')).toContain('0! = 1');
  });

  it('returns empty for negative n', () => {
    expect(config.calculate({ n: '-1' })).toEqual([]);
  });

  it('returns empty for n > 170', () => {
    expect(config.calculate({ n: '171' })).toEqual([]);
  });

  it('returns empty for invalid input', () => {
    expect(config.calculate({ n: 'abc' })).toEqual([]);
    expect(config.calculate({ n: '' })).toEqual([]);
  });
});
