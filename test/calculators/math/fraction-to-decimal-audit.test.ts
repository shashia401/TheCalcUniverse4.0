import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/fraction-to-decimal/index';
import { nearestSimpleFraction } from '../../../src/calculators/math/fraction-to-decimal/f2dMath';
import { makeFrac } from '../../../src/utils/rational';
import { getValue } from '../../helpers';

// Reference values: Python fractions.Fraction(...), Fraction.limit_denominator(1000) and long division.
const ftod = (numerator: string, denominator: string) => config.calculate({ mode: 'ftod', numerator, denominator });
const dtof = (decimal: string) => config.calculate({ mode: 'dtof', decimal });
const mixed = (wholeNumber: string, numerator: string, denominator: string) =>
  config.calculate({ mode: 'mixed', wholeNumber, numerator, denominator });

describe('fraction-to-decimal: repeating decimals and periods (audit)', () => {
  it('1/3 -> 0.(3), period 1, 33.3333%', () => {
    const r = ftod('1', '3');
    expect(getValue(r, 'decimal')).toBe('0.3333333333');
    expect(getValue(r, 'exactDecimal')).toBe('0.(3)');
    expect(getValue(r, 'decimalType')).toBe('Repeating, period 1');
    expect(getValue(r, 'percentage')).toBe('33.3333%');
  });
  it('1/7 -> period 6; 22/7 -> 3.(142857); 1/6 -> 0.1(6); 1/97 -> period 96', () => {
    expect(getValue(ftod('1', '7'), 'exactDecimal')).toBe('0.(142857)');
    expect(getValue(ftod('1', '7'), 'decimalType')).toBe('Repeating, period 6');
    expect(getValue(ftod('22', '7'), 'exactDecimal')).toBe('3.(142857)');
    expect(getValue(ftod('1', '6'), 'exactDecimal')).toBe('0.1(6)');
    expect(getValue(ftod('1', '97'), 'decimalType')).toBe('Repeating, period 96');
  });
  it('terminating fractions are labelled and have no separate exact row when short', () => {
    const r = ftod('3', '8');
    expect(getValue(r, 'decimal')).toBe('0.375');
    expect(getValue(r, 'decimalType')).toBe('Terminating');
    expect(r.find((x) => x.id === 'exactDecimal')).toBeUndefined();
    // 1/1024 = 0.0009765625 needs 10 places: still fits the 10-place rounded row
    expect(getValue(ftod('1', '1024'), 'decimal')).toBe('0.0009765625');
  });
  it('negative and decimal inputs are read exactly', () => {
    expect(getValue(ftod('-7', '12'), 'exactDecimal')).toBe('-0.58(3)');
    expect(getValue(ftod('-7', '12'), 'simplified')).toBe('-7/12');
    // 1.5/4 = 3/8 (the old code rounded the parts to integers: 2/4 -> "1/2")
    const r = ftod('1.5', '4');
    expect(getValue(r, 'decimal')).toBe('0.375');
    expect(getValue(r, 'simplified')).toBe('3/8');
  });
  it('zero denominator reports an error; blanks give nothing', () => {
    expect(ftod('1', '0')[0].id).toBe('error');
    expect(ftod('', '3')).toEqual([]);
    expect(ftod('3', '')).toEqual([]);
    expect(ftod('x', '3')[0].id).toBe('error');
  });
  it('exact for huge parts', () => {
    // 10^30 / 3 = 333333333333333333333333333333.(3)
    const r = ftod('1000000000000000000000000000000', '3');
    expect(getValue(r, 'exactDecimal')).toBe('333333333333333333333333333333.(3)');
  });
});

describe('fraction-to-decimal: decimal -> fraction is exact (audit)', () => {
  it('reads the typed digits exactly (no 1e6 rounding)', () => {
    expect(getValue(dtof('0.1234567890123456789'), 'fraction')).toBe('1234567890123456789/10000000000000000000');
    expect(getValue(dtof('-0.000125'), 'fraction')).toBe('-1/8000'); // old code: 0/1
    expect(getValue(dtof('2.5e-3'), 'fraction')).toBe('1/400');
    expect(getValue(dtof('-1.2'), 'fraction')).toBe('-6/5');
    expect(getValue(dtof('5'), 'fraction')).toBe('5/1');
    expect(getValue(dtof('0.1'), 'fraction')).toBe('1/10');
  });
  it('suggests the nearest simple fraction only when it is a close match', () => {
    expect(getValue(dtof('0.333333'), 'nearestFraction')).toBe('1/3');
    expect(getValue(dtof('3.14159'), 'nearestFraction')).toBe('355/113');
    expect(dtof('-0.000125').find((x) => x.id === 'nearestFraction')).toBeUndefined(); // 0 would not be close
    expect(dtof('0.75').find((x) => x.id === 'nearestFraction')).toBeUndefined();
  });
  it('shows a mixed number for |x| > 1 and the exact percentage', () => {
    const r = dtof('-2.75');
    expect(getValue(r, 'fraction')).toBe('-11/4');
    expect(getValue(r, 'mixedNumber')).toBe('-2 3/4');
    expect(getValue(r, 'percentage')).toBe('-275%');
  });
  it('bad decimal text', () => {
    expect(dtof('1.2.3')[0].id).toBe('error');
    expect(dtof('')).toEqual([]);
  });
});

describe('nearestSimpleFraction (continued fractions)', () => {
  it('agrees with Python limit_denominator(1000)', () => {
    const f = (n: number, d: number) => makeFrac(BigInt(n), BigInt(d));
    const show = (x: ReturnType<typeof f>) => `${x.n}/${x.d}`;
    expect(show(nearestSimpleFraction(f(333333, 1000000)))).toBe('1/3');
    expect(show(nearestSimpleFraction(f(314159, 100000)))).toBe('355/113');
    expect(show(nearestSimpleFraction(f(6172839, 5000)))).toBe('145679/118');
    expect(show(nearestSimpleFraction(f(-1, 8000)))).toBe('0/1');
    expect(show(nearestSimpleFraction(f(3, 4)))).toBe('3/4');
  });
});

describe('fraction-to-decimal: mixed numbers (audit)', () => {
  it('negative whole number means -(whole + fraction)', () => {
    // -2 3/4 = -11/4 = -2.75 (the old code computed -2*4+3 = -5 -> -5/4 = -1.25)
    const r = mixed('-2', '3', '4');
    expect(getValue(r, 'decimal')).toBe('-2.75');
    expect(getValue(r, 'improper')).toBe('-11/4');
    expect(getValue(r, 'percentage')).toBe('-275%');
  });
  it('3 1/2 = 7/2 = 3.5 and an unreduced improper fraction is shown as converted', () => {
    expect(getValue(mixed('3', '1', '2'), 'improper')).toBe('7/2');
    // 3 2/4 -> improper 14/4, simplified 7/2
    const r = mixed('3', '2', '4');
    expect(getValue(r, 'improper')).toBe('14/4');
    expect(getValue(r, 'simplified')).toBe('7/2');
    expect(getValue(r, 'decimal')).toBe('3.5');
  });
  it('blank whole number counts as 0; negative fraction part is rejected with an explanation', () => {
    expect(getValue(mixed('', '3', '4'), 'decimal')).toBe('0.75');
    expect(mixed('2', '-3', '4')[0].id).toBe('error');
    expect(mixed('2.5', '1', '4')[0].id).toBe('error');
    expect(mixed('2', '1', '0')[0].id).toBe('error');
  });
});
