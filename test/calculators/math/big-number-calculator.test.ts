import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/big-number/index';
import { getValue } from '../../helpers';

describe('Big Number calculator', () => {
  // ── Basic operations ────────────────────────────────────────────
  it('adds two large numbers exactly', () => {
    const r = config.calculate({ a: '12345678901234567890', b: '9876543210987654321', op: 'add' });
    expect(getValue(r, 'result')).toBe('22222222112222222211');
  });

  it('subtracts large numbers without precision loss', () => {
    const r = config.calculate({ a: '10000000000000000000', b: '1', op: 'subtract' });
    expect(getValue(r, 'result')).toBe('9999999999999999999');
  });

  it('multiplies large numbers exactly', () => {
    const r = config.calculate({ a: '123456789', b: '987654321', op: 'multiply' });
    expect(getValue(r, 'result')).toBe('121932631112635269');
  });

  it('divides large numbers with proper integer quotient', () => {
    const r = config.calculate({ a: '10000000000000000000', b: '3', op: 'divide' });
    expect(getValue(r, 'result')).toContain('3333333333333333333');
    expect(getValue(r, 'remainder')).toBe('1');
  });

  it('computes powers correctly', () => {
    const r = config.calculate({ a: '2', b: '10', op: 'power' });
    expect(getValue(r, 'result')).toBe('1024');
  });

  // ── Digit counts ────────────────────────────────────────────────
  it('shows correct digit counts for result and inputs', () => {
    const r = config.calculate({ a: '12345678901234567890', b: '1', op: 'add' });
    expect(getValue(r, 'digitCount')).toBe('20');
    expect(getValue(r, 'digitCountA')).toBe('20');
    expect(getValue(r, 'digitCountB')).toBe('1');
  });

  // ── Edge cases and validation ───────────────────────────────────
  it('returns empty array for division by zero', () => {
    const r = config.calculate({ a: '5', b: '0', op: 'divide' });
    expect(r).toEqual([]);
  });

  it('returns empty array for non-integer input', () => {
    const r = config.calculate({ a: 'abc', b: '5', op: 'add' });
    expect(r).toEqual([]);
  });

  it('returns empty array for empty inputs', () => {
    const r = config.calculate({ a: '', b: '', op: 'add' });
    expect(r).toEqual([]);
  });

  it('returns empty array for decimal inputs (BigInt is integer-only)', () => {
    const r = config.calculate({ a: '3.14', b: '2', op: 'add' });
    expect(r).toEqual([]);
  });

  it('returns empty array for inputs with special characters', () => {
    const r = config.calculate({ a: '1e10', b: '5', op: 'multiply' });
    expect(r).toEqual([]);
  });

  // ── Negative number support ─────────────────────────────────────
  it('handles negative numbers in addition', () => {
    const r = config.calculate({ a: '-100', b: '50', op: 'add' });
    expect(getValue(r, 'result')).toBe('-50');
  });

  it('handles negative numbers in multiplication', () => {
    const r = config.calculate({ a: '-123', b: '456', op: 'multiply' });
    expect(getValue(r, 'result')).toBe('-56088');
  });

  it('handles power with negative base and even exponent', () => {
    const r = config.calculate({ a: '-2', b: '4', op: 'power' });
    expect(getValue(r, 'result')).toBe('16');
  });

  it('handles power with negative base and odd exponent', () => {
    const r = config.calculate({ a: '-2', b: '3', op: 'power' });
    expect(getValue(r, 'result')).toBe('-8');
  });

  // ── Leading zeros sanitization ──────────────────────────────────
  it('strips leading zeros from inputs', () => {
    const r = config.calculate({ a: '00123', b: '00456', op: 'add' });
    expect(getValue(r, 'result')).toBe('579');
    expect(getValue(r, 'digitCountA')).toBe('3');
    expect(getValue(r, 'digitCountB')).toBe('3');
  });

  // ── Remainder in division ───────────────────────────────────────
  it('shows remainder for non-exact division', () => {
    const r = config.calculate({ a: '17', b: '5', op: 'divide' });
    expect(getValue(r, 'result')).toBe('3');
    expect(getValue(r, 'remainder')).toBe('2');
  });

  it('does not show remainder for exact division', () => {
    const r = config.calculate({ a: '100', b: '4', op: 'divide' });
    expect(getValue(r, 'result')).toBe('25');
    // Remainder key should not exist in results when division is exact
    expect(r.find((x: { id: string }) => x.id === 'remainder')).toBeUndefined();
  });

  // ── Power edge cases ────────────────────────────────────────────
  it('handles power of 0 (x^0 = 1)', () => {
    const r = config.calculate({ a: '123456789', b: '0', op: 'power' });
    expect(getValue(r, 'result')).toBe('1');
  });

  it('handles 0^0 (returns 1 per BigInt convention)', () => {
    const r = config.calculate({ a: '0', b: '0', op: 'power' });
    // In JavaScript BigInt, 0n ** 0n = 1n
    expect(getValue(r, 'result')).toBe('1');
  });

  it('returns empty for exponent > 100', () => {
    const r = config.calculate({ a: '2', b: '101', op: 'power' });
    expect(r).toEqual([]);
  });

  it('returns empty for negative exponent', () => {
    const r = config.calculate({ a: '2', b: '-1', op: 'power' });
    expect(r).toEqual([]);
  });

  // ── Very large multiplication ───────────────────────────────────
  it('handles multiplication with many-digit result', () => {
    const r = config.calculate({ a: '12345678901234567890', b: '98765432109876543210', op: 'multiply' });
    const result = getValue(r, 'result');
    // The product should be exact and have ~39 digits
    expect(result).toBeTruthy();
    expect(result!.length).toBeGreaterThanOrEqual(38);
    expect(getValue(r, 'digitCount')).toBeTruthy();
  });

  // ── Subtraction producing negative result ───────────────────────
  it('produces correct negative result from subtraction', () => {
    const r = config.calculate({ a: '5', b: '100', op: 'subtract' });
    expect(getValue(r, 'result')).toBe('-95');
  });

  // ── Default operation (add) ─────────────────────────────────────
  it('defaults to addition when no operation is specified', () => {
    const r = config.calculate({ a: '10', b: '20' });
    expect(getValue(r, 'result')).toBe('30');
  });
});
