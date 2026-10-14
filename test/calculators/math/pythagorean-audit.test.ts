// Oracle: mpmath at 40 digits.
import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/pythagorean/index';
import { solveRightTriangle } from '../../../src/calculators/math/pythagorean/pythagoreanMath';
import { getValue } from '../../helpers';

describe('pythagorean audit', () => {
  it('3-4-5: area 6, perimeter 12, angles 36.8699 / 53.1301', () => {
    const r = config.calculate({ mode: 'hypotenuse', a: '3', b: '4', c: '' });
    expect(getValue(r, 'hyp')).toBe('5');
    expect(getValue(r, 'area')).toBe('6');
    expect(getValue(r, 'perimeter')).toBe('12');
    expect(getValue(r, 'angleA')).toBe('36.8699°');
    expect(getValue(r, 'angleB')).toBe('53.1301°');
    expect(getValue(r, 'sohStep')).toContain('a/c = 3/5 = 0.6000');
  });
  it('5-12-13 legs from the hypotenuse; angle A = 22.6199 for a = 5, b = 12 (mpmath)', () => {
    const r = config.calculate({ mode: 'leg_b', a: '5', b: '', c: '13' });
    expect(getValue(r, 'leg_b')).toBe('12');
    expect(getValue(r, 'angleA')).toBe('22.6199°');
    expect(getValue(config.calculate({ mode: 'leg_a', a: '', b: '12', c: '13' }), 'leg_a')).toBe('5');
  });
  it('legs avoid cancellation: c = 1 + 2^-30 (exact in binary), b = 1 -> a = 4.31583728852040803e-5 (mpmath)', () => {
    const s = solveRightTriangle('leg_a', '', '1', '1.000000000931322574615478515625');
    if (s.kind !== 'ok') throw new Error('expected ok');
    // naive sqrt(c*c - b*b) gives 4.3158372875e-5 (relative error 2e-10); sqrt((c-b)(c+b)) is exact to ~1e-16
    expect(Math.abs(s.t.a - 4.31583728852040803e-5) / 4.31583728852040803e-5).toBeLessThan(1e-14);
  });
  it('hypotenuse does not overflow for huge legs (hypot): 1e200, 1e200 -> 1.4142135624e200', () => {
    const s = solveRightTriangle('hypotenuse', '1e200', '1e200', '');
    expect(s.kind).toBe('error'); // above the supported 1e150 bound, explained instead of Infinity
    const ok = solveRightTriangle('hypotenuse', '1e140', '1e140', '');
    expect(ok.kind === 'ok' && Math.abs(ok.t.c - Math.SQRT2 * 1e140) / 1e140).toBeLessThan(1e-12);
  });
  it('hypotenuse not longer than the leg gives a message (c = b is degenerate)', () => {
    for (const [mode, a, b, c] of [['leg_a', '', '5', '5'], ['leg_a', '', '5', '3'], ['leg_b', '5', '', '4']]) {
      const r = config.calculate({ mode, a, b, c });
      expect(r[0].id).toBe('error');
      expect(r[0].value).toContain('must be longer');
    }
  });
  it('stale hidden inputs are ignored (mode leg_a with a leftover value in a)', () => {
    const r = config.calculate({ mode: 'leg_a', a: '999', b: '4', c: '5' });
    expect(getValue(r, 'leg_a')).toBe('3');
  });
  it('tiny sides keep significant digits', () => {
    expect(getValue(config.calculate({ mode: 'hypotenuse', a: '3e-9', b: '4e-9', c: '' }), 'hyp')).toBe('5e-9');
  });
});
