import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/permutation-combination/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Permutation and Combination calculator', () => {
  it('calculates P(5,3) = 60', () => {
    const r = config.calculate({ n: '5', r: '3', orderMatters: 'permutation' });
    near(parseNumber(getValue(r, 'result')), 60);
  });

  it('calculates C(5,3) = 10', () => {
    const r = config.calculate({ n: '5', r: '3', orderMatters: 'combination' });
    near(parseNumber(getValue(r, 'result')), 10);
  });

  it('shows type as Permutation', () => {
    const r = config.calculate({ n: '5', r: '3', orderMatters: 'permutation' });
    expect(getValue(r, 'type')).toBe('Permutation');
  });

  it('shows type as Combination', () => {
    const r = config.calculate({ n: '5', r: '3', orderMatters: 'combination' });
    expect(getValue(r, 'type')).toBe('Combination');
  });

  it('shows formula', () => {
    const r = config.calculate({ n: '5', r: '3', orderMatters: 'permutation' });
    expect(getValue(r, 'formula')).toContain('P');
  });

  it('shows step-by-step formula applied', () => {
    const r = config.calculate({ n: '5', r: '3', orderMatters: 'combination' });
    expect(getValue(r, 'formulaApplied')).toContain('5!');
  });

  it('returns n! value', () => {
    const r = config.calculate({ n: '5', r: '3', orderMatters: 'permutation' });
    expect(getValue(r, 'nFactorial')).toBe('120');
  });

  it('C(n,0) = 1', () => {
    const r = config.calculate({ n: '5', r: '0', orderMatters: 'combination' });
    near(parseNumber(getValue(r, 'result')), 1);
  });

  it('P(n,n) = n!', () => {
    const r = config.calculate({ n: '5', r: '5', orderMatters: 'permutation' });
    near(parseNumber(getValue(r, 'result')), 120);
  });

  it('returns empty for r > n', () => {
    const r = config.calculate({ n: '3', r: '5', orderMatters: 'permutation' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN input', () => {
    const r = config.calculate({ n: 'abc', r: '3', orderMatters: 'permutation' });
    expect(r).toEqual([]);
  });
});
