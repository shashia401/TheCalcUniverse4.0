// Oracle: python fractions.Fraction / math.gcd (exact).
import { describe, it, expect } from 'vitest';
import proportion from '../../../src/calculators/math/proportion-calculator/index';
import ratio from '../../../src/calculators/math/ratio/index';
import { parseSlot, solveProportion } from '../../../src/calculators/math/proportion-calculator/proportionMath';
import { simplifyRatio } from '../../../src/calculators/math/ratio/ratioMath';
import { parseDecimalExact } from '../../../src/utils/rational';
import { getValue, getResult } from '../../helpers';

const P = (a: string, b: string, c: string, d: string) => proportion.calculate({ a, b, c, d });
const R = (a: string, b: string, c = '', d = '', preset = 'none') => ratio.calculate({ a, b, c, d, preset });
const dec = (s: string) => parseDecimalExact(s)!;

describe('proportion audit', () => {
  it('solves each slot exactly', () => {
    expect(getValue(P('0.1', '0.2', '3', ''), 'result')).toBe('6');
    expect(getValue(P('', '4', '3', '8'), 'result')).toBe('1.5'); // a = b*c/d = 4*3/8
    expect(getValue(P('2', '', '6', '9'), 'result')).toBe('3');
    expect(getValue(P('1', '3', '', '9'), 'result')).toBe('3');
    expect(getValue(P('1', '3', '', '9'), 'solution')).toBe('c = (1 × 9) / 3 = 3');
  });
  it('no float drift in the steps (0.1 * 0.3 / 0.2 printed 0.15000000000000002 before)', () => {
    expect(getValue(P('', '0.1', '0.3', '0.2'), 'solution')).toBe('a = (0.1 × 0.3) / 0.2 = 0.15');
  });
  it('four values are compared exactly: 1/3 vs 0.33333/1 is NOT proportional (old tolerance said equal)', () => {
    const r = P('1', '3', '0.33333', '1');
    expect(getResult(r, 'verification').color).toBe('negative');
    expect(getValue(r, 'verification')).toContain('≠');
    const ok = P('1', '2', '3', '6');
    expect(getResult(ok, 'verification').color).toBe('positive');
    expect(getValue(ok, 'verification')).toContain('OK');
  });
  it('non-positive values give a message, junk stays empty, recurring results are rounded to 8 dp', () => {
    expect(P('0', '2', '3', '')[0].id).toBe('error');
    expect(P('-1', '2', '3', '')[0].id).toBe('error');
    expect(P('abc', '2', '3', '')).toEqual([]);
    expect(getValue(P('3', '7', '', '1'), 'result')).toBe('0.42857143'); // c = a*d/b = 3/7
  });
  it('parseSlot / solveProportion basics', () => {
    expect(parseSlot('?')).toBeNull();
    expect(parseSlot('3abc')).toBe('bad');
    expect(solveProportion({ a: dec('1'), b: dec('2'), c: null, d: null }).kind).toBe('incomplete');
  });
});

describe('ratio audit', () => {
  it('simplifies exactly, including decimals and large values (python Fraction)', () => {
    expect(getValue(R('0.1', '0.3'), 'simplified')).toBe('1 : 3');
    expect(getValue(R('1.5', '2.5'), 'simplified')).toBe('3 : 5');
    expect(getValue(R('32', '18'), 'simplified')).toBe('16 : 9');
    expect(simplifyRatio(dec('12345678901.5'), dec('9876543210.25'))).toEqual([49382715606n, 39506172841n]);
    expect(getValue(R('0.0000000001', '0.0000000003'), 'simplified')).toBe('1 : 3'); // old 1e9 scaling gave 0 : 0
  });
  it('solves C or D and checks exactly', () => {
    expect(getValue(R('16', '9', '800', ''), 'proportionResult')).toBe('450');
    expect(getValue(R('16', '9', '', '18'), 'proportionResult')).toBe('32');
    expect(getValue(R('16', '9', '32', '18'), 'proportionResult')).toBe('Proportional ✓');
    const bad = R('16', '9', '10', '10');
    expect(getValue(bad, 'proportionResult')).toContain('Not proportional');
    expect(getResult(bad, 'proportionResult').color).toBe('negative');
  });
  it('a preset fills A:B when both are blank', () => {
    expect(getValue(R('', '', '', '', '21:9'), 'simplified')).toBe('7 : 3');
    expect(getValue(R('', '', '1920', '', '16:9'), 'proportionResult')).toBe('1080');
    expect(getValue(R('5', '5', '', '', '16:9'), 'simplified')).toBe('1 : 1'); // typed values win
  });
  it('zero / negative A or B give nothing; bad C or D is explained', () => {
    expect(R('0', '0')).toEqual([]);
    expect(R('-1', '2')).toEqual([]);
    expect(getResult(R('16', '9', '0', ''), 'proportionError').color).toBe('negative');
  });
});
