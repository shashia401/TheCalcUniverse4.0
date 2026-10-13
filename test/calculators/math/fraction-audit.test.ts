import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/fraction/index';
import { getValue } from '../../helpers';

// Expected values derived independently with Python fractions.Fraction (see audit notes).
const calc = (mode: string, aNum: string, aDen: string, bNum: string, bDen: string) =>
  config.calculate({ mode, aNum, aDen, bNum, bDen });

describe('fraction: exact rational arithmetic (audit)', () => {
  it('keeps the sign on "simplified" (the old row showed |n|/|d|)', () => {
    // -1/2 - (-1/3) = -1/6
    const r = calc('subtract', '-1', '2', '-1', '3');
    expect(getValue(r, 'result')).toBe('-1/6');
    expect(getValue(r, 'simplified')).toBe('-1/6');
  });
  it('stays exact beyond 2^53 (doubles would lose digits)', () => {
    const r = calc('add', '12345678901234567890', '9876543210987654321', '1', '3');
    expect(getValue(r, 'result')).toBe('521261999/329218107'); // Python Fraction
    const m = calc('multiply', '1000000000000000000000000000001', '1000000000000000', '1000000000000001', '1000000000000000000000000000000');
    expect(getValue(m, 'result')).toBe('1000000000000001000000000000001000000000000001/1000000000000000000000000000000000000000000000');
  });
  it('divides by a negative fraction and moves the sign to the numerator', () => {
    // (2/3) / (-4/5) = -5/6
    expect(getValue(calc('divide', '2', '3', '-4', '5'), 'result')).toBe('-5/6');
    // (-7/5) / (-14/10) = 1
    expect(getValue(calc('divide', '-7', '5', '-14', '10'), 'result')).toBe('1');
  });
  it('division by a zero fraction explains itself instead of returning nothing', () => {
    const r = calc('divide', '1', '2', '0', '3');
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('error');
    expect(r[0].value).toMatch(/divide by zero/i);
  });
  it('rejects decimals / garbage instead of silently truncating with parseInt (1.9 -> 1)', () => {
    expect(calc('add', '1.9', '2', '1', '2')[0].id).toBe('error');
    expect(calc('add', 'abc', '4', '1', '3')[0].id).toBe('error');
    expect(calc('add', '1e3', '4', '1', '3')[0].id).toBe('error');
  });
  it('blank fields are incomplete (no result), zero/negative denominators too', () => {
    expect(calc('add', '', '4', '1', '3')).toEqual([]);
    expect(calc('add', '1', '4', '1', '')).toEqual([]);
    expect(calc('add', '1', '0', '1', '3')).toEqual([]);
    expect(calc('add', '1', '-4', '1', '3')).toEqual([]);
  });
  it('shows the exact repeating decimal and a mixed number', () => {
    // 5/3 - 1/3 = 4/3 = 1.(3) = 1 1/3
    const r = calc('subtract', '5', '3', '1', '3');
    expect(getValue(r, 'result')).toBe('4/3');
    expect(getValue(r, 'decimal')).toBe('1.33333333');
    expect(getValue(r, 'exactDecimal')).toBe('1.(3)');
    expect(getValue(r, 'mixedNumber')).toBe('1 1/3');
    // -22/7 -> -3 1/7, -3.(142857)
    const n = calc('multiply', '-22', '7', '1', '1');
    expect(getValue(n, 'mixedNumber')).toBe('-3 1/7');
    expect(getValue(n, 'exactDecimal')).toBe('-3.(142857)');
  });
  it('terminating decimals need no exact row; proper fractions no mixed row', () => {
    const r = calc('add', '1', '4', '1', '2'); // 3/4
    expect(getValue(r, 'decimal')).toBe('0.75');
    expect(r.find((x) => x.id === 'exactDecimal')).toBeUndefined();
    expect(r.find((x) => x.id === 'mixedNumber')).toBeUndefined();
    // 1/1024 has 10 decimals: the rounded row differs from the exact one
    const s = calc('divide', '1', '1', '1024', '1');
    expect(getValue(s, 'decimal')).toBe('0.00097656');
    expect(getValue(s, 'exactDecimal')).toBe('0.0009765625');
  });
  it('explainSteps matches the result for every operation', () => {
    for (const mode of ['add', 'subtract', 'multiply', 'divide']) {
      const steps = config.explainSteps!({ mode, aNum: '3', aDen: '4', bNum: '1', bDen: '3' });
      expect(steps.length).toBeGreaterThanOrEqual(2);
      const last = steps[steps.length - 1].expr;
      expect(last.endsWith(getValue(calc(mode, '3', '4', '1', '3'), 'result'))).toBe(true);
    }
    expect(config.explainSteps!({ mode: 'divide', aNum: '1', aDen: '2', bNum: '0', bDen: '3' })).toEqual([]);
  });
});
