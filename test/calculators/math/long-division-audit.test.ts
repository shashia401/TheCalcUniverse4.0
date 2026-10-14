// Oracle: Python divmod / period of 1/d via multiplicative order of 10.
import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/long-division/index';
import { longDivide, quotientDigits, parseLongDivision } from '../../../src/calculators/math/long-division/longDivisionMath';
import { getValue } from '../../helpers';

describe('long division audit', () => {
  it('22 / 7 = 3 R 1 = 3.(142857), period 6', () => {
    const r = config.calculate({ dividend: '22', divisor: '7' });
    expect(getValue(r, 'quotient')).toBe('3');
    expect(getValue(r, 'remainder')).toBe('1');
    expect(getValue(r, 'expansion')).toBe('3.(142857)');
    expect(r.find((x) => x.id === 'expansion')!.label).toContain('every 6 digits');
    expect(getValue(r, 'decimalResult')).toBe('3.142857');
  });
  it('2/3 rounds to 0.666667 (the old code truncated to 0.666666)', () => {
    expect(getValue(config.calculate({ dividend: '2', divisor: '3' }), 'decimalResult')).toBe('0.666667');
  });
  it('1/6 = 0.1(6); 1/8 terminates', () => {
    expect(longDivide(1n, 6n).expansion).toBe('0.1(6)');
    expect(longDivide(1n, 8n).terminates).toBe(true);
    expect(longDivide(1n, 8n).expansion).toBe('0.125');
  });
  it('period of 1/97 is 96 and of 1/13 is 6', () => {
    expect(longDivide(1n, 97n).period).toBe(96);
    expect(longDivide(1n, 13n).period).toBe(6);
  });
  it('negative dividend: quotient truncates toward zero, remainder keeps the dividend sign (python: -7 = -3*2 + -1)', () => {
    const r = config.calculate({ dividend: '-7', divisor: '2' });
    expect(getValue(r, 'quotient')).toBe('-3');
    expect(getValue(r, 'remainder')).toBe('-1');
    expect(getValue(r, 'check')).toBe('-3 × 2 + -1 = -7');
    expect(getValue(r, 'decimalResult')).toBe('-3.5');
  });
  it('30-digit dividend is exact (python divmod(123456789012345678901234567890, 987654321))', () => {
    const r = longDivide(123456789012345678901234567890n, 987654321n);
    expect(r.quotient * 987654321n + r.remainder).toBe(123456789012345678901234567890n);
    expect(r.remainder < 987654321n).toBe(true);
  });
  it('tableau digits: 4876 / 12 = 406 R 4', () => {
    const r = longDivide(4876n, 12n);
    expect(quotientDigits(r.steps)).toBe('406');
    expect(r.steps.map((s) => s.remainder)).toEqual([4n, 0n, 7n, 4n]);
    expect(r.steps.map((s) => s.product)).toEqual([0n, 48n, 0n, 72n]);
  });
  it('rejects decimals / too long / zero divisor; blanks stay empty', () => {
    expect(parseLongDivision('12.5', '2').kind).toBe('invalid');
    expect(parseLongDivision('1'.repeat(31), '2').kind).toBe('invalid');
    expect(parseLongDivision('5', '0').kind).toBe('invalid');
    expect(parseLongDivision('', '2').kind).toBe('incomplete');
    expect(parseLongDivision('abc', '2').kind).toBe('incomplete');
  });
});
