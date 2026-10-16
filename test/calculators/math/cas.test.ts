import { describe, it, expect } from 'vitest';
import { CasError, derivativeOrder, evalNode, parse, show, simplify, taylorCoefficients } from '../../../src/calculators/math/shared/cas';
import { DERIV_ORACLE, TAYLOR_ORACLE } from './fixtures/calculus-oracle';

const rel = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));

describe('cas: parser', () => {
  const v = (s: string, x = 0) => evalNode(parse(s), x);
  it('standard precedence: -2^2 = -4, 2^3^2 = 512, 2^-1 = 0.5, -x^2 at 3 = -9', () => {
    expect(v('-2^2')).toBe(-4);
    expect(v('2^3^2')).toBe(512);
    expect(v('2^-1')).toBe(0.5);
    expect(v('-x^2', 3)).toBe(-9);
    expect(v('8/2/2')).toBe(2);
    expect(v('2-3-4')).toBe(-5);
  });
  it('implicit multiplication: 3x+2, 2(x+1), (x+1)(x-1), 2pi, x sin(x), xsin(x), 2e', () => {
    expect(v('3x+2', 2)).toBe(8);
    expect(v('2(x+1)', 2)).toBe(6);
    expect(v('(x+1)(x-1)', 3)).toBe(8);
    expect(v('2pi')).toBeCloseTo(2 * Math.PI, 12);
    expect(v('x sin(x)', 1)).toBeCloseTo(Math.sin(1), 12);
    expect(v('xsin(x)', 1)).toBeCloseTo(Math.sin(1), 12);
    expect(v('2e')).toBeCloseTo(2 * Math.E, 12);
    expect(v('2e3')).toBe(2000);
    expect(v('x^2x', 2)).toBe(8); // (x^2)*x
  });
  it('rejects unknown names, junk and code-injection attempts without executing anything', () => {
    for (const bad of [
      'constructor', 'x.constructor', '__proto__', 'this', 'process.exit()', 'alert(1)', 'sin x', 'y+1', '1+', '(1', '1)', 'x^',
      '2 3', '1;2', 'x=1', '[1]', '`1`', 'a'.repeat(450), '('.repeat(200) + 'x' + ')'.repeat(200), 'constructor("return 1")()',
    ]) {
      expect(() => parse(bad), bad.slice(0, 30)).toThrow(CasError);
    }
  });
});

describe('cas: derivative matches sympy 1.14 (numeric, 1st-3rd order)', () => {
  for (const [src, k, x, want] of DERIV_ORACLE) {
    it(`d^${k}/dx^${k} ${src} at ${x}`, () => {
      const d = derivativeOrder(parse(src), k);
      const got = evalNode(d, x);
      expect(rel(got, want), `${show(d)} -> ${got} vs ${want}`).toBe(true);
    });
  }
});

describe('cas: derivative output is readable', () => {
  const d = (s: string, k = 1) => show(derivativeOrder(parse(s), k));
  it('polynomials', () => {
    expect(d('3x^2+2x+1')).toBe('6*x + 2');
    expect(d('x^3-4x^2+5x-2')).toBe('3*x^2 - 8*x + 5');
    expect(d('5')).toBe('0');
    expect(d('x')).toBe('1');
    expect(d('3x^2+2x+1', 2)).toBe('6');
    expect(d('x^4', 3)).toBe('24*x');
  });
  it('rules', () => {
    expect(d('sin(x)')).toBe('cos(x)');
    expect(d('cos(x)')).toBe('-sin(x)');
    expect(d('exp(x)')).toBe('exp(x)');
    expect(d('ln(x)')).toBe('1/x');
    expect(d('1/x')).toBe('-1/x^2');
    expect(d('sqrt(x)')).toBe('1/(2*sqrt(x))');
    expect(d('x^3*sin(x)')).toBe('3*x^2*sin(x) + x^3*cos(x)');
    expect(d('sin(x^2)')).toBe('2*x*cos(x^2)');
  });
});

describe('cas: Taylor coefficients match sympy 1.14', () => {
  for (const [src, c, n, want] of TAYLOR_ORACLE) {
    it(`${src} about ${c}, order ${n}`, () => {
      const got = taylorCoefficients(parse(src), c, n);
      want.forEach((w, i) => expect(rel(got[i], w), `c${i}: ${got[i]} vs ${w}`).toBe(true));
    });
  }
  it('non-analytic centres are reported, not guessed', () => {
    expect(() => taylorCoefficients(parse('ln(x)'), 0, 3)).toThrow(CasError);
    expect(() => taylorCoefficients(parse('1/x'), 0, 3)).toThrow(CasError);
    expect(() => taylorCoefficients(parse('sqrt(x)'), 0, 3)).toThrow(CasError);
    expect(() => taylorCoefficients(parse('abs(x)'), 0, 3)).toThrow(CasError);
  });
});

describe('cas: simplify', () => {
  it('collects like terms and powers', () => {
    expect(show(simplify(parse('x*x+2x^2-3x^2')))).toBe('0');
    expect(show(simplify(parse('x*x^2')))).toBe('x^3');
    expect(show(simplify(parse('(x+1)/(x+1)')))).toBe('1');
  });
});
