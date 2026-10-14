// Oracle: python decimal (ROUND_HALF_UP = away from zero, ROUND_HALF_EVEN, ROUND_CEILING, ROUND_FLOOR, ROUND_DOWN).
import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/rounding/index';
import { roundExact, fmtScaled } from '../../../src/calculators/math/rounding/roundingMath';
import { getValue, getResult } from '../../helpers';

const rnd = (number: string, place: string, method = 'half-up', sigFigs = '') => config.calculate({ number, place, method, sigFigs });
const val = (number: string, place: string, method = 'half-up', sigFigs = '') => getValue(rnd(number, place, method, sigFigs), 'rounded');

describe('rounding audit', () => {
  it('decimal-exact ties: 1.005 -> 1.01 and 2.675 -> 2.68 (binary doubles say 1 and 2.67)', () => {
    expect(val('1.005', 'hundredth')).toBe('1.01');
    expect(val('2.675', 'hundredth')).toBe('2.68');
  });
  it('no float artefacts: 0.3 to the tenth stays 0.3 (3 * 0.1 = 0.30000000000000004)', () => {
    expect(val('0.3', 'tenth')).toBe('0.3');
    expect(val('1234.5678', 'tenth')).toBe('1234.6');
  });
  it('half away from zero for negatives: -3.5 -> -4, -2.5 -> -3 (JavaScript Math.round gives -3 and -2)', () => {
    expect(val('-3.5', 'unit')).toBe('-4');
    expect(val('-2.5', 'unit')).toBe('-3');
    expect(getValue(rnd('-3.5', 'unit'), 'direction')).toBe('Round Down'); // down on the number line
  });
  it('banker rounding: 2.5 -> 2, 3.5 -> 4, -2.5 -> -2; non-ties unaffected', () => {
    expect(val('2.5', 'unit', 'half-even')).toBe('2');
    expect(val('3.5', 'unit', 'half-even')).toBe('4');
    expect(val('-2.5', 'unit', 'half-even')).toBe('-2');
    expect(val('2.6', 'unit', 'half-even')).toBe('3');
    expect(val('2500000', 'million', 'half-even')).toBe('2000000');
    expect(val('1500000', 'million', 'half-even')).toBe('2000000');
  });
  it('directed rules on negatives: ceil -3.2 -> -3, floor -3.2 -> -4, trunc -3.7 -> -3', () => {
    expect(val('-3.2', 'unit', 'ceil')).toBe('-3');
    expect(val('-3.2', 'unit', 'floor')).toBe('-4');
    expect(val('-3.7', 'unit', 'trunc')).toBe('-3');
    expect(val('3.2', 'unit', 'ceil')).toBe('4');
    expect(val('3.7', 'unit', 'floor')).toBe('3');
  });
  it('worked examples: 1267 -> 1300, 3.14159 -> 3.14, 74.5 -> 75', () => {
    expect(val('1267', 'hundred')).toBe('1300');
    expect(val('3.14159', 'hundredth')).toBe('3.14');
    expect(val('74.5', 'unit')).toBe('75');
    expect(val('1250', 'hundred')).toBe('1300');
  });
  it('significant figures (python Context(prec=n))', () => {
    expect(val('123456', 'sig', 'half-up', '3')).toBe('123000');
    expect(val('0.00123456', 'sig', 'half-up', '2')).toBe('0.0012');
    expect(val('1.2', 'sig', 'half-up', '3')).toBe('1.20'); // trailing zero is significant
    expect(val('999.5', 'sig', 'half-up', '3')).toBe('1000');
    expect(val('-0.0004567', 'sig', 'half-up', '2')).toBe('-0.00046');
    expect(val('9.99', 'sig', 'half-up', '2')).toBe('10'); // carry drops a trailing zero
    expect(val('2.5', 'sig', 'half-even', '1')).toBe('2');
    expect(val('0', 'sig', 'half-up', '3')).toBe('0.00');
  });
  it('explanation uses the first DROPPED digit (the old panel quoted the digit at the target place)', () => {
    expect(getValue(rnd('1267', 'hundred'), 'explanation')).toContain('first dropped digit is 6');
    expect(getValue(rnd('-74', 'ten'), 'explanation')).toContain('first dropped digit is 4');
    expect(getValue(rnd('75', 'ten'), 'explanation')).toContain('exactly halfway');
    expect(getValue(rnd('70', 'ten'), 'direction')).toContain('Already exact');
  });
  it('large and tiny values stay exact (no 1e+21 / 1e-7 floats)', () => {
    expect(val('123456789012345678901234567890', 'million')).toBe('123456789012345678901235000000');
    expect(val('0.00000000000000000000005', 'ten-thousandth')).toBe('0');
    expect(val('1e-7', 'sig', 'half-up', '1')).toBe('0.0000001');
  });
  it('bad sig-fig input is explained or ignored; garbage number is empty', () => {
    expect(getResult(rnd('1.5', 'sig', 'half-up', '0'), 'error').color).toBe('negative');
    expect(rnd('1.5', 'sig', 'half-up', '')).toEqual([]);
    expect(rnd('abc', 'ten')).toEqual([]);
    expect(roundExact('2.5', 'unit', 'bogus' as never).kind).toBe('ok');
  });
  it('fmtScaled', () => {
    expect(fmtScaled(-5n, -1)).toBe('-0.5');
    expect(fmtScaled(120n, -2, true)).toBe('1.20');
    expect(fmtScaled(0n, -2, true)).toBe('0.00');
    expect(fmtScaled(3n, 2)).toBe('300');
  });
});
