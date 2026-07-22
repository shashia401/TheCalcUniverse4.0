import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/nth-root/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('nth Root calculator', () => {
  it('calculates square root of 9 = 3', () => {
    const r = config.calculate({ index: '2', radicand: '9' });
    near(parseNumber(getValue(r, 'result')), 3);
  });

  it('calculates cube root of 27 = 3', () => {
    const r = config.calculate({ index: '3', radicand: '27' });
    near(parseNumber(getValue(r, 'result')), 3);
  });

  it('shows fractional exponent form', () => {
    const r = config.calculate({ index: '3', radicand: '27' });
    expect(getValue(r, 'exponentForm')).toContain('1/3');
  });

  it('shows radical expression', () => {
    const r = config.calculate({ index: '2', radicand: '9' });
    expect(getValue(r, 'radicalForm')).toContain('√');
  });

  it('calculates 4th root of 16 = 2', () => {
    const r = config.calculate({ index: '4', radicand: '16' });
    near(parseNumber(getValue(r, 'result')), 2);
  });

  it('returns empty for index = 0', () => {
    const r = config.calculate({ index: '0', radicand: '5' });
    expect(r).toEqual([]);
  });

  it('returns empty for even root of negative number', () => {
    const r = config.calculate({ index: '2', radicand: '-4' });
    expect(r).toEqual([]);
  });

  it('allows odd root of negative number', () => {
    const r = config.calculate({ index: '3', radicand: '-8' });
    near(parseNumber(getValue(r, 'result')), -2);
  });

  it('returns empty for NaN input', () => {
    const r = config.calculate({ index: 'abc', radicand: '5' });
    expect(r).toEqual([]);
  });

  it('returns value itself when index = 1', () => {
    const r = config.calculate({ index: '1', radicand: '42' });
    expect(getValue(r, 'result')).toBe('42');
  });
});
