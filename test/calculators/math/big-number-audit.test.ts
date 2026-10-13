import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/big-number/index';
import { getValue } from '../../helpers';

// Reference values: Python ints (arbitrary precision). Python's // and % FLOOR; this calculator (like C/Java/JS) truncates toward zero.
const run = (a: string, b: string, op: string) => config.calculate({ a, b, op });

describe('big-number: exactness and bounds (audit)', () => {
  it('2^100 and 3^100 are exact', () => {
    expect(getValue(run('2', '100', 'power'), 'result')).toBe('1267650600228229401496703205376');
    expect(getValue(run('3', '100', 'power'), 'result')).toBe('515377520732011331036461129765621272702107522001');
  });
  it('multiplication / subtraction beyond 2^64', () => {
    expect(getValue(run('12345678901234567890', '9876543210987654321', 'multiply'), 'result')).toBe('121932631137021795223746380111126352690');
    expect(getValue(run('12345678901234567890', '9876543210987654321', 'subtract'), 'result')).toBe('2469135690246913569');
  });
  it('division truncates toward zero with a dividend-signed remainder', () => {
    // -7 = -3 * 2 + -1 ; 7 = -3 * -2 + 1 ; -7 = 3 * -2 + -1
    const a = run('-7', '2', 'divide');
    expect([getValue(a, 'result'), getValue(a, 'remainder')]).toEqual(['-3', '-1']);
    const b = run('7', '-2', 'divide');
    expect([getValue(b, 'result'), getValue(b, 'remainder')]).toEqual(['-3', '1']);
    const c = run('-7', '-2', 'divide');
    expect([getValue(c, 'result'), getValue(c, 'remainder')]).toEqual(['3', '-1']);
    expect(getValue(a, 'steps')).toMatch(/truncated toward zero/);
  });
  it('accepts a leading plus and strips leading zeros', () => {
    expect(getValue(run('+007', '-0003', 'add'), 'result')).toBe('4');
    expect(getValue(run('-0', '5', 'add'), 'result')).toBe('5');
  });
  it('digit counts are exact for 0 and for negative numbers', () => {
    const r = run('0', '-12345', 'add');
    expect(getValue(r, 'digitCountA')).toBe('1');
    expect(getValue(r, 'digitCountB')).toBe('5');
    expect(getValue(r, 'digitCount')).toBe('5');
  });
  it('power results are bounded to 10,000 digits before anything is computed', () => {
    expect(run('10', '100', 'power')[0].id).toBe('result'); // 101 digits
    // 100 digits ^ 100 = ~10,000 digits: allowed (9,901 digits for 10^99); 101 digits ^ 100 is refused
    const big = getValue(run('1' + '0'.repeat(99), '100', 'power'), 'digitCount');
    expect(big).toBe('9901');
    const refused = run('1' + '0'.repeat(100), '100', 'power');
    expect(refused).toHaveLength(1);
    expect(refused[0].id).toBe('error');
  });
  it('operands are limited to 10,000 digits so the tab cannot freeze', () => {
    const t = Date.now();
    const ok = run('9'.repeat(10000), '9'.repeat(10000), 'multiply');
    expect(getValue(ok, 'digitCount')).toBe('20000');
    expect(Date.now() - t).toBeLessThan(2000);
    expect(run('9'.repeat(10001), '1', 'add')[0].id).toBe('error');
    // leading zeros do not count towards the cap
    expect(getValue(run('0'.repeat(20000) + '5', '1', 'add'), 'result')).toBe('6');
  });
  it('very long numbers are abbreviated only inside the steps text', () => {
    const r = run('1' + '0'.repeat(99), '1', 'add');
    expect(getValue(r, 'result')).toBe('1' + '0'.repeat(98) + '1');
    expect(getValue(r, 'steps')).toContain('(100 digits)');
  });
  it('0^0 follows the BigInt convention of 1; 0^5 = 0', () => {
    expect(getValue(run('0', '0', 'power'), 'result')).toBe('1');
    expect(getValue(run('0', '5', 'power'), 'result')).toBe('0');
  });
});
