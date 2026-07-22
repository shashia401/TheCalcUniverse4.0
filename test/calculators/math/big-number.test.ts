import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/big-number/index';
import { getValue } from '../../helpers';

describe('Big Number calculator', () => {
  it('adds two large numbers exactly', () => {
    const r = config.calculate({ a: '12345678901234567890', b: '9876543210987654321', op: 'add' });
    expect(getValue(r, 'result')).toBe('22222222112222222211');
  });

  it('subtracts large numbers', () => {
    const r = config.calculate({ a: '10000000000000000000', b: '1', op: 'subtract' });
    expect(getValue(r, 'result')).toBe('9999999999999999999');
  });

  it('multiplies large numbers', () => {
    const r = config.calculate({ a: '123456789', b: '987654321', op: 'multiply' });
    expect(getValue(r, 'result')).toBe('121932631112635269');
  });

  it('divides large numbers', () => {
    const r = config.calculate({ a: '10000000000000000000', b: '3', op: 'divide' });
    expect(getValue(r, 'result')).toContain('3333333333333333333');
  });

  it('shows digit count for result', () => {
    const r = config.calculate({ a: '12345678901234567890', b: '1', op: 'add' });
    expect(getValue(r, 'digitCount')).toBe('20');
  });

  it('returns empty for division by zero', () => {
    const r = config.calculate({ a: '5', b: '0', op: 'divide' });
    expect(r).toEqual([]);
  });

  it('returns empty for non-integer input', () => {
    const r = config.calculate({ a: 'abc', b: '5', op: 'add' });
    expect(r).toEqual([]);
  });

  it('computes power with small exponent', () => {
    const r = config.calculate({ a: '2', b: '10', op: 'power' });
    expect(getValue(r, 'result')).toBe('1024');
  });

  it('returns empty for empty inputs', () => {
    const r = config.calculate({ a: '', b: '', op: 'add' });
    expect(r).toEqual([]);
  });
});
