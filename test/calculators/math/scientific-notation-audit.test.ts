// Oracle: python decimal ('{:E}'.format(Decimal(x))) which normalises exactly.
import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/scientific-notation/index';
import { parseDecimalString, toDecimal, toScientific } from '../../../src/calculators/math/scientific-notation/sciNotationMath';
import { getValue } from '../../helpers';

const sci = (decimal: string) => config.calculate({ mode: 'toScientific', decimal });
const dec = (coefficient: string, exponent: string) => config.calculate({ mode: 'toDecimal', coefficient, exponent });

describe('scientific notation audit', () => {
  it('normalises exactly (99999999 was "10 × 10^7")', () => {
    expect(getValue(sci('99999999'), 'scientific')).toBe('9.9999999 × 10^7');
    expect(getValue(sci('0.0045'), 'scientific')).toBe('4.5 × 10^-3');
    expect(getValue(sci('4500'), 'eNotation')).toBe('4.5e3');
  });
  it('keeps every typed digit: Avogadro 6.02214076e23 (the old 6-decimal rounding gave 6.022141)', () => {
    expect(getValue(sci('6.02214076e23'), 'scientific')).toBe('6.02214076 × 10^23');
    expect(getValue(sci('602214076000000000000000'), 'scientific')).toBe('6.02214076 × 10^23');
    expect(getValue(sci('123456789012345678901234567890.5'), 'coefficient')).toBe('1.234567890123456789012345678905');
  });
  it('negative numbers, thousands separators, leading plus', () => {
    expect(getValue(sci('-0.00012300'), 'scientific')).toBe('-1.23 × 10^-4');
    expect(getValue(sci('1,234.5'), 'scientific')).toBe('1.2345 × 10^3');
    expect(getValue(sci('+.5'), 'scientific')).toBe('5 × 10^-1');
  });
  it('zero and values between 1 and 10 need no movement', () => {
    expect(getValue(sci('0'), 'scientific')).toBe('0 × 10^0');
    expect(getValue(sci('7.25'), 'moves')).toBe('0');
    expect(getValue(sci('7.25'), 'direction')).toContain('No movement');
  });
  it('significant figures (trailing zeros count only with a decimal point)', () => {
    expect(getValue(sci('0.0045'), 'sigFigs')).toBe('2');
    expect(getValue(sci('4500'), 'sigFigs')).toBe('2');
    expect(getValue(sci('4500.'), 'sigFigs')).toBe('4');
    expect(getValue(sci('0.0450'), 'sigFigs')).toBe('3');
    expect(getValue(sci('100.5'), 'sigFigs')).toBe('4');
    expect(getValue(sci('4.500e3'), 'sigFigs')).toBe('4');
    expect(getValue(sci('1e-30'), 'sigFigs')).toBe('1');
  });
  it('rejects junk instead of parseFloat-ing a prefix ("12abc" used to be 12)', () => {
    expect(sci('12abc')).toEqual([]);
    expect(sci('1.2.3')).toEqual([]);
    expect(parseDecimalString('.')).toBeNull();
    expect(toScientific('')).toBeNull();
  });
  it('scientific -> decimal is exact, with huge and tiny exponents', () => {
    expect(getValue(dec('4.5', '-3'), 'decimal')).toBe('0.0045');
    expect(getValue(dec('4.5', '3'), 'decimal')).toBe('4500');
    expect(getValue(dec('1.1', '-1'), 'decimal')).toBe('0.11'); // float 1.1 * 10^-1 = 0.11000000000000001
    expect(getValue(dec('6.02214076', '23'), 'decimal')).toBe('602214076000000000000000');
    expect(getValue(dec('-2.5', '2'), 'decimal')).toBe('-250');
    expect(getValue(dec('1', '400'), 'decimal')).toContain('1e400'); // Math.pow gave "Infinity"
    expect(getValue(dec('1', '-400'), 'decimal')).toContain('1e-400');
  });
  it('non-normalised coefficients are normalised: 45 × 10^-4 = 4.5 × 10^-3', () => {
    const r = dec('45', '-4');
    expect(getValue(r, 'decimal')).toBe('0.0045');
    expect(getValue(r, 'normalized')).toBe('4.5 × 10^-3');
    expect(dec('4.5', '-3').find((x) => x.id === 'normalized')).toBeUndefined();
  });
  it('exponent must be a whole number within bounds; coefficient may not carry its own exponent', () => {
    expect(dec('4.5', '2.5')).toEqual([]);
    expect(dec('4.5', '99999')).toEqual([]);
    expect(dec('4.5e2', '3')).toEqual([]);
    expect(toDecimal('0', '5')!.plain).toBe('0');
  });
});
