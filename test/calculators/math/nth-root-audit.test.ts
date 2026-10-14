// Oracle: exact integer arithmetic (python: 4**3 == 64, 48 = 2**4 * 3, 360 = 2**3*3**2*5 ...).
import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/nth-root/index';
import { simplifyRadical, radicalSymbol, fmtRoot, parseNthRoot } from '../../../src/calculators/math/nth-root/nthRootMath';
import { getValue } from '../../helpers';

describe('nth root audit', () => {
  it('cube root of 64 is exactly 4 (Math.pow gave 3.9999999999999996 and "2∛8")', () => {
    const r = config.calculate({ index: '3', radicand: '64' });
    expect(getValue(r, 'result')).toBe('4');
    expect(getValue(r, 'simplifiedRadical')).toBe('4');
  });
  it('simplified radicals are exact for every index', () => {
    expect(simplifyRadical(2, 12)).toBe('2√3'); // 12 = 4·3
    expect(simplifyRadical(3, 54)).toBe('3∛2'); // 54 = 27·2
    expect(simplifyRadical(4, 48)).toBe('2∜3'); // 48 = 16·3 (old code printed 2∛3)
    expect(simplifyRadical(5, 96)).toBe('2⁵√3'); // 96 = 32·3
    expect(simplifyRadical(3, -24)).toBe('-2∛3');
    expect(simplifyRadical(2, 1000000007 * 4)).toBe('2√1000000007');
    expect(simplifyRadical(2, 360)).toBe('6√10'); // 360 = 36·10
    expect(simplifyRadical(3, 10)).toBe('');
    expect(simplifyRadical(2, 144)).toBe('12');
    expect(simplifyRadical(2, 1.5)).toBe('');
  });
  it('radical symbols', () => {
    expect([2, 3, 4, 5, 12].map(radicalSymbol)).toEqual(['√', '∛', '∜', '⁵√', '¹²√']);
    expect(getValue(config.calculate({ index: '4', radicand: '48' }), 'radicalForm')).toBe('∜(48)');
  });
  it('odd roots of negatives are real; even roots give the principal complex value', () => {
    expect(getValue(config.calculate({ index: '3', radicand: '-8' }), 'result')).toBe('-2');
    expect(getValue(config.calculate({ index: '5', radicand: '-32' }), 'result')).toBe('-2');
    const e = config.calculate({ index: '4', radicand: '-16' });
    // python: 16**.25 * (cos(pi/4) + i sin(pi/4)) = 1.4142135624 + 1.4142135624i
    expect(e[0].value).toContain('1.4142135624 + 1.4142135624i');
  });
  it('tiny and huge radicands keep significant digits', () => {
    expect(getValue(config.calculate({ index: '2', radicand: '1e-30' }), 'result')).toBe('1e-15');
    expect(getValue(config.calculate({ index: '2', radicand: '1e300' }), 'result')).toBe('1e+150');
    expect(fmtRoot(0.00001)).toBe('0.00001');
  });
  it('non-integer index is rejected rather than truncated; index capped', () => {
    expect(config.calculate({ index: '2.5', radicand: '9' })).toEqual([]);
    expect(config.calculate({ index: '1001', radicand: '9' })[0].id).toBe('error');
    expect(parseNthRoot('3', '8abc').kind).toBe('incomplete');
  });
  it('irrational root to 10 decimals (python: 2**0.5 = 1.4142135623730951)', () => {
    expect(getValue(config.calculate({ index: '2', radicand: '2' }), 'result')).toBe('1.4142135624');
  });
});
