import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/fibonacci/index';
import { getValue } from '../../helpers';

describe('Fibonacci calculator', () => {
  it('computes F(1) = 1', () => {
    const r = config.calculate({ n: '1' });
    expect(getValue(r, 'nthTerm')).toBe('1');
    expect(getValue(r, 'sequence')).toBe('1');
    expect(getValue(r, 'sum')).toBe('1');
  });

  it('computes F(2) = 1', () => {
    const r = config.calculate({ n: '2' });
    expect(getValue(r, 'nthTerm')).toBe('1');
    expect(getValue(r, 'sequence')).toBe('1, 1');
    expect(getValue(r, 'sum')).toBe('2');
  });

  it('computes F(5) = 5', () => {
    const r = config.calculate({ n: '5' });
    expect(getValue(r, 'nthTerm')).toBe('5');
    expect(getValue(r, 'sequence')).toBe('1, 1, 2, 3, 5');
    expect(getValue(r, 'sum')).toBe('12');
  });

  it('computes F(10) = 55', () => {
    const r = config.calculate({ n: '10' });
    expect(getValue(r, 'nthTerm')).toBe('55');
    expect(getValue(r, 'sequence')).toBe('1, 1, 2, 3, 5, 8, 13, 21, 34, 55');
    expect(getValue(r, 'sum')).toBe('143');
  });

  it('computes F(20) correctly', () => {
    const r = config.calculate({ n: '20' });
    expect(getValue(r, 'nthTerm')).toBe('6765');
  });

  it('computes F(30) correctly', () => {
    const r = config.calculate({ n: '30' });
    expect(getValue(r, 'nthTerm')).toBe('832040');
  });

  it('verifies Binet approximation matches F(10)', () => {
    const r = config.calculate({ n: '10' });
    expect(getValue(r, 'binetApproximation')).toBe('55');
  });

  it('verifies Binet approximation matches F(20)', () => {
    const r = config.calculate({ n: '20' });
    expect(getValue(r, 'binetApproximation')).toBe('6765');
  });

  it('shows correct sum for first 10 terms', () => {
    const r = config.calculate({ n: '10' });
    expect(getValue(r, 'sum')).toBe('143'); // 1+1+2+3+5+8+13+21+34+55 = 143
  });

  it('handles F(100) (max)', () => {
    const r = config.calculate({ n: '100' });
    const nth = getValue(r, 'nthTerm');
    expect(nth).toBeDefined();
    // JavaScript number precision limits mean F(100) is approximate
    expect(nth).toContain('354224848179');
  });

  it('returns empty for n < 1', () => {
    expect(config.calculate({ n: '0' })).toEqual([]);
    expect(config.calculate({ n: '-1' })).toEqual([]);
  });

  it('returns empty for n > 100', () => {
    expect(config.calculate({ n: '101' })).toEqual([]);
  });

  it('returns empty for invalid input', () => {
    expect(config.calculate({ n: 'abc' })).toEqual([]);
    expect(config.calculate({ n: '' })).toEqual([]);
  });
});
