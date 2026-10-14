// Oracle: python math (sin/cos/tan/log/factorial) and standard precedence (python: -2**2 == -4).
import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/scientific/index';
import { evaluateExpression, fmtResult } from '../../../src/calculators/math/scientific/scientificMath';
import { safeEval } from '../../../src/calculators/math/shared/safeEval';
import { getValue, getResult } from '../../helpers';

const ev = (e: string, angle: 'rad' | 'deg' = 'rad') => {
  const r = evaluateExpression(e, angle);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};
const calc = (expression: string, angleMode = 'rad') => config.calculate({ expression, angleMode });

describe('scientific calculator audit', () => {
  it('precedence: unary minus binds looser than ^ (python -2**2 = -4), ^ is right-associative', () => {
    expect(ev('-2^2')).toBe(-4);
    expect(ev('(-2)^2')).toBe(4);
    expect(ev('2^-2')).toBe(0.25);
    expect(ev('2^3^2')).toBe(512);
    expect(ev('-2^-2')).toBe(-0.25);
    expect(ev('2+3*4')).toBe(14);
    expect(ev('(2+3)*4')).toBe(20);
    expect(ev('8/2/2')).toBe(2);
    expect(ev('2*-3')).toBe(-6);
    expect(ev('10-2-3')).toBe(5);
  });
  it('factorial: postfix, binds tighter than ^, bounded (no 1e9-iteration loop)', () => {
    expect(ev('5!')).toBe(120);
    expect(ev('(2+3)!')).toBe(120);
    expect(ev('0!')).toBe(1);
    expect(ev('2^3!')).toBe(64);
    expect(ev('-3!')).toBe(-6);
    expect(ev('170!')).toBeGreaterThan(7e306);
    const t = Date.now();
    expect(evaluateExpression('1000000000!').ok).toBe(false);
    expect(Date.now() - t).toBeLessThan(200);
    expect(evaluateExpression('2.5!').ok).toBe(false); // the old regexp turned 5.5! into 5.120
    expect(evaluateExpression('(-1)!').ok).toBe(false);
  });
  it('E-notation and constants', () => {
    expect(ev('1e3')).toBe(1000);
    expect(ev('2.5E-3')).toBe(0.0025);
    expect(ev('2*e')).toBeCloseTo(5.43656365691809, 12);
    expect(ev('pi')).toBeCloseTo(Math.PI, 15);
    expect(ev('π')).toBeCloseTo(Math.PI, 15);
  });
  it('keypad glyphs: the true minus sign U+2212, × and ÷ evaluate (every keypad subtraction used to fail)', () => {
    expect(ev('9 − 4')).toBe(5);
    expect(ev('6 × 7 ÷ 2')).toBe(21);
    expect(ev('√(16)')).toBe(4);
  });
  it('degrees vs radians (python: sin(pi/6) = 0.49999999999999994, exact 0.5)', () => {
    expect(ev('sin(30)', 'deg')).toBe(0.5);
    expect(ev('sin(180)', 'deg')).toBe(0);
    expect(ev('cos(90)', 'deg')).toBe(0);
    expect(ev('cos(60)', 'deg')).toBeCloseTo(0.5, 15);
    expect(ev('tan(45)', 'deg')).toBe(1);
    expect(ev('sin(-90)', 'deg')).toBe(-1);
    expect(ev('asin(1)', 'deg')).toBeCloseTo(90, 12);
    expect(ev('atan(1)', 'deg')).toBeCloseTo(45, 12);
    expect(evaluateExpression('tan(90)', 'deg').ok).toBe(false);
    expect(ev('sin(pi/2)', 'rad')).toBe(1);
    expect(getValue(calc('sin(30)', 'deg'), 'result')).toBe('0.5');
    expect(getValue(calc('sin(30)', 'rad'), 'result')).toBe('-0.988031624093');
  });
  it('logs and roots match python (log10(1000) = 3, ln(e^2) = 2, sqrt(3400) = 58.3095189485)', () => {
    expect(ev('log(1000)')).toBeCloseTo(3, 12);
    expect(ev('ln(exp(2))')).toBeCloseTo(2, 12);
    expect(getValue(calc('sqrt(50^2 + 30^2)'), 'result')).toBe('58.3095189485');
    expect(getValue(calc('-log(3.5*10^(-5))'), 'result')).toBe('4.45593195565');
    expect(getValue(calc('ln(27000/10000)/8'), 'result')).toBe('0.124156471626');
  });
  it('error handling: domain errors are explained, half-typed input is empty', () => {
    expect(getResult(calc('1/0'), 'error').color).toBe('negative');
    expect(getResult(calc('sqrt(-1)'), 'error').value).toContain('Undefined');
    expect(getResult(calc('log(0)'), 'error').value).toContain('Infinity');
    expect(calc('2 +')).toEqual([]);
    expect(calc('(2+3')).toEqual([]);
    expect(calc('')).toEqual([]);
    expect(calc('foo(2)')).toEqual([]);
  });
  it('results keep small and large magnitudes (the old 1e-10 rounding turned 3e-11 into 0)', () => {
    expect(getValue(calc('3e-11'), 'result')).toBe('3e-11');
    expect(getValue(calc('0.1+0.2'), 'result')).toBe('0.3');
    expect(getValue(calc('2^100'), 'result')).toBe('1.26765060023e+30');
    expect(fmtResult(1000000)).toBe('1000000');
    expect(fmtResult(0)).toBe('0');
  });
  it('is not eval(): code-like input is rejected by the tokenizer, never executed', () => {
    const g = globalThis as unknown as Record<string, unknown>;
    g.__pwned = false;
    for (const bad of ["globalThis.__pwned = true", "constructor.constructor('globalThis.__pwned=true')()", 'process.exit(1)', 'alert(1)', '__proto__', '"a"+"b"', '1;2']) {
      expect(evaluateExpression(bad).ok).toBe(false);
    }
    expect(g.__pwned).toBe(false);
    expect(() => safeEval('this')).toThrow();
  });
  it('E-notation does not break names: 2e is 2 times the constant e only with an explicit *', () => {
    expect(() => safeEval('2e')).toThrow(); // no implicit multiplication
    expect(safeEval('2*e')).toBeCloseTo(5.43656365691809, 12);
  });
});
