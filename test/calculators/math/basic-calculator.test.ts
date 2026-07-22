import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/basic-calc/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Basic Calculator', () => {
  it('evaluates 2 + 3 = 5', () => {
    const r = config.calculate({ expression: '2+3' });
    near(parseNumber(getValue(r, 'result')), 5);
  });

  it('evaluates 10 - 4 = 6', () => {
    const r = config.calculate({ expression: '10-4' });
    near(parseNumber(getValue(r, 'result')), 6);
  });

  it('evaluates 6 × 7 = 42', () => {
    const r = config.calculate({ expression: '6*7' });
    near(parseNumber(getValue(r, 'result')), 42);
  });

  it('evaluates 15 / 3 = 5', () => {
    const r = config.calculate({ expression: '15/3' });
    near(parseNumber(getValue(r, 'result')), 5);
  });

  it('respects order of operations (2+3*4 = 14)', () => {
    const r = config.calculate({ expression: '2+3*4' });
    near(parseNumber(getValue(r, 'result')), 14);
  });

  it('handles parentheses', () => {
    const r = config.calculate({ expression: '(2+3)*4' });
    near(parseNumber(getValue(r, 'result')), 20);
  });

  it('shows sanitized expression', () => {
    const r = config.calculate({ expression: '2+3' });
    expect(getValue(r, 'expression')).toBe('2+3');
  });

  it('returns error for invalid expression', () => {
    const r = config.calculate({ expression: 'abc' });
    expect(getValue(r, 'error')).toContain('Invalid');
  });

  it('returns empty for empty expression', () => {
    const r = config.calculate({ expression: '' });
    expect(r).toEqual([]);
  });
});
