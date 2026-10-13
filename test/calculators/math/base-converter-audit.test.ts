import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/base-converter/index';
import { getValue } from '../../helpers';

// Reference values: Python int(s, base) and Fraction long-division in each base.
const conv = (input: string, fromBase: string, toBase: string) => config.calculate({ input, fromBase, toBase });

describe('base-converter: exact for any size, signs and fractions (audit)', () => {
  it('values beyond 2^53 stay exact (parseInt/Number.toString lose digits)', () => {
    const r = conv('FFFFFFFFFFFFFFFFFFFF', '16', '10');
    expect(getValue(r, 'result')).toBe('1208925819614629174706175');
    expect(getValue(r, 'decimalValue')).toBe('1208925819614629174706175');
    expect(getValue(conv('FFFFFFFFFFFFFFFFFFFF', '16', '2'), 'result')).toBe('1'.repeat(80));
    expect(getValue(conv('1267650600228229401496703205377', '10', '36'), 'result')).toBe('3EWFDNCA0N6LD1GGVFGH');
  });
  it('negative numbers keep their sign; -0 is 0', () => {
    expect(getValue(conv('-255', '10', '16'), 'result')).toBe('-FF');
    expect(getValue(conv('-1010', '2', '10'), 'result')).toBe('-10');
    expect(getValue(conv('-0', '10', '2'), 'result')).toBe('0');
    expect(getValue(conv('+17', '8', '10'), 'result')).toBe('15');
  });
  it('fractional digits are converted exactly', () => {
    expect(getValue(conv('10.5', '10', '2'), 'result')).toBe('1010.1');
    expect(getValue(conv('A.8', '16', '10'), 'result')).toBe('10.5');
    expect(getValue(conv('0.1', '3', '10'), 'decimalValue')).toBe('0.(3)'); // 1/3
    expect(getValue(conv('.5', '10', '2'), 'result')).toBe('0.1');
  });
  it('non-terminating fractions are cut after 24 digits and say so', () => {
    const r = conv('0.1', '10', '2'); // 0.1 = 0.0001100110011... in binary
    expect(getValue(r, 'result')).toBe('0.000110011001100110011001');
    expect(getValue(r, 'precisionNote')).toMatch(/cut .* after 24 digits/);
    expect(getValue(r, 'length')).toBe('25'); // "0" + 24 fractional digits
    expect(conv('0.5', '10', '2').find((x) => x.id === 'precisionNote')).toBeUndefined();
  });
  it('lower-case digits, base 36 and repeating intermediate decimals', () => {
    expect(getValue(conv('hello', '36', '10'), 'result')).toBe('29234652');
    expect(getValue(conv('1z', '36', '10'), 'result')).toBe('71');
    expect(getValue(conv('1', '7', '10'), 'decimalValue')).toBe('1');
  });
  it('rejects bad digits, stray points, huge input and non-integer bases', () => {
    expect(conv('1.2.3', '10', '2')).toEqual([]);
    expect(conv('.', '10', '2')).toEqual([]);
    expect(conv('12', '2', '10')).toEqual([]);
    expect(conv('1'.repeat(1001), '10', '2')).toEqual([]);
    expect(getValue(conv('1'.repeat(1000), '10', '16'), 'length')).toBeTruthy();
    expect(conv('10', '10.5', '2')).toEqual([]);
    expect(conv('10', '1e1', '2')).toEqual([]);
  });
});
