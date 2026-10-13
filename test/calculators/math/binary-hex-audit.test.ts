import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/binary-hex/index';
import { getValue } from '../../helpers';

// Reference values: Python ints (0xB1 == 177, 2**128 wraps, ...).
const conv = (value: string, fromBase: string, toBase: string, bitWidth = '0') =>
  config.calculate({ mode: 'Convert', fromBase, toBase, value, bitWidth });
const calc = (base: string, operation: string, value1: string, value2: string, bitWidth = '0') =>
  config.calculate({ mode: 'Calculate', base, operation, value1, value2, bitWidth });

describe('binary-hex: prefixes, signs, bounds (audit)', () => {
  it('"0B1" in hex is the number 0xB1 = 177, not a binary prefix + "1" (old code returned 1)', () => {
    expect(getValue(conv('0B1', 'Hex', 'Decimal'), 'convertedResult')).toBe('177');
    expect(getValue(conv('0b1', 'Binary', 'Decimal'), 'convertedResult')).toBe('1'); // legal binary prefix
    expect(getValue(conv('0xFF', 'Hex', 'Decimal'), 'convertedResult')).toBe('255');
    expect(getValue(conv('0o17', 'Octal', 'Decimal'), 'convertedResult')).toBe('15');
  });
  it('a prefix belonging to another base is rejected: "0x10" is not a decimal number', () => {
    expect(conv('0x10', 'Decimal', 'Hex')).toEqual([]);
    expect(conv('0b101', 'Hex', 'Decimal').length).toBeGreaterThan(0); // hex 0B101 = 0xB101 = 45313
    expect(getValue(conv('0b101', 'Hex', 'Decimal'), 'convertedResult')).toBe('45313');
  });
  it('sign before prefix: -0xFF = -255', () => {
    expect(getValue(conv('-0xFF', 'Hex', 'Decimal'), 'convertedResult')).toBe('-255');
    expect(getValue(conv('+ff', 'Hex', 'Decimal'), 'convertedResult')).toBe('255');
  });
  it('positional breakdown ignores the prefix (no phantom "0 x 16^k" term)', () => {
    expect(getValue(conv('0xFF', 'Hex', 'Decimal'), 'formulaString')).toBe('(F×16¹)+(F×16⁰)=255');
  });
  it('values beyond 2^53 convert exactly', () => {
    expect(getValue(conv('FFFFFFFFFFFFFFFFFFFF', 'Hex', 'Decimal'), 'convertedResult')).toBe('1208925819614629174706175');
  });
  it('huge shifts no longer crash the page (1n << 10^9n throws RangeError)', () => {
    const r = calc('Decimal', 'Left Shift', '1', '1000000000');
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('error');
    // with a bit width the shift is clamped: shifting an 8-bit value by 100 clears it
    expect(getValue(calc('Decimal', 'Left Shift', '1', '100', '8'), 'calcResult')).toBe('0');
    expect(getValue(calc('Decimal', 'Right Shift', '200', '1000000000', '8'), 'calcResult')).toBe('0');
    expect(getValue(calc('Decimal', 'Left Shift', '1', '100'), 'calcResult')).toBe('1267650600228229401496703205376');
  });
  it('input length is capped at 2048 digits', () => {
    expect(conv('1'.repeat(2049), 'Decimal', 'Hex')).toEqual([]);
    expect(conv('1'.repeat(2048), 'Decimal', 'Hex').length).toBeGreaterThan(0);
  });
  it('128-bit wrap and carry: 0xFFFF...F + 1 = 0 with carry and signed result 0', () => {
    const r = calc('Hex', 'Add', 'F'.repeat(32), '1', '128');
    expect(getValue(r, 'calcResult')).toBe('0');
    expect(getValue(r, 'unsignedDecimal')).toBe('0');
    expect(getValue(r, 'flags')).toContain('Carry');
    // signed: 127 + 1 in 8 bits overflows to -128
    const s = calc('Decimal', 'Add', '127', '1', '8');
    expect(getValue(s, 'signedDecimal')).toBe('-128');
    expect(getValue(s, 'flags')).toContain('Signed overflow');
  });
  it('integer division reports the truncated quotient and the remainder', () => {
    const r = calc('Decimal', 'Divide', '17', '5');
    expect(getValue(r, 'calcResult')).toBe('3');
    expect(getValue(r, 'stepDetail')).toContain('remainder 2');
    expect(getValue(calc('Decimal', 'Divide', '-17', '5'), 'calcResult')).toBe('-3'); // truncates toward zero
    expect(calc('Decimal', 'Divide', '1', '0')).toEqual([]);
  });
});
