import { describe, it, expect } from 'vitest';
import type { CalculatorConfig, ExplainStep } from '../../../src/types/calculator';
import average from '../../../src/calculators/math/average';
import standardDeviation from '../../../src/calculators/math/standard-deviation';
import quadratic from '../../../src/calculators/math/quadratic';
import pythagorean from '../../../src/calculators/math/pythagorean';
import ratio from '../../../src/calculators/math/ratio';
import proportion from '../../../src/calculators/math/proportion-calculator';
import gcf from '../../../src/calculators/math/gcf';
import lcm from '../../../src/calculators/math/lcm';
import slope from '../../../src/calculators/math/slope';
import permComb from '../../../src/calculators/math/permutation-combination';
import percentError from '../../../src/calculators/math/percent-error';
import zScore from '../../../src/calculators/math/z-score';
import tip from '../../../src/calculators/everyday/tip-splitter';
import { buildDemoValues, getValue } from '../../helpers';

// Intermediate numbers below were computed independently in Python (fractions / decimal at 50 digits, math.erfc for the
// normal CDF, math.perm / comb / gcd / lcm), not by running the calculators.

type V = Record<string, string>;
const steps = (c: CalculatorConfig, v: V): ExplainStep[] => c.explainSteps!(v);
// Strip thousands separators so assertions do not depend on digit grouping.
const exprs = (c: CalculatorConfig, v: V) => steps(c, v).map((s) => s.expr.replace(/(\d),(?=\d{3})/g, '$1'));
const last = (c: CalculatorConfig, v: V) => exprs(c, v).at(-1)!;
const demo = (c: CalculatorConfig) => buildDemoValues(c.inputs);

describe('explainSteps - last step equals the displayed result (default / demo values)', () => {
  const cases: [string, CalculatorConfig, (v: V) => string][] = [
    ['average', average, () => `= ${getValue(average.calculate(demo(average)), 'mean')}`],
    ['standard-deviation', standardDeviation, () => `= ${getValue(standardDeviation.calculate(demo(standardDeviation)), 'stdDev')}`],
    ['quadratic', quadratic, () => {
      const r = quadratic.calculate(demo(quadratic));
      return `x₁ = ${getValue(r, 'x1')}, x₂ = ${getValue(r, 'x2')}`;
    }],
    ['pythagorean', pythagorean, () => `= ${getValue(pythagorean.calculate(demo(pythagorean)), 'hyp')}`],
    ['gcf', gcf, () => `= ${getValue(gcf.calculate(demo(gcf)), 'gcf')}`],
    ['lcm', lcm, () => `= ${getValue(lcm.calculate(demo(lcm)), 'result')}`],
    ['slope', slope, () => `= ${getValue(slope.calculate(demo(slope)), 'slope')}`],
    ['permutation-combination', permComb, () => `= ${getValue(permComb.calculate(demo(permComb)), 'result')}`],
    ['percent-error', percentError, () => `= ${getValue(percentError.calculate(demo(percentError)), 'percentError')}`],
    ['z-score', zScore, () => `→  ${getValue(zScore.calculate(demo(zScore)), 'percentile')}`],
    ['tip-splitter', tip, () => getValue(tip.calculate(demo(tip)), 'perPersonTotal')],
  ];
  for (const [name, config, expected] of cases) {
    it(name, () => {
      const v = demo(config);
      expect(config.calculate(v).length).toBeGreaterThan(0);
      const s = steps(config, v);
      expect(s.length).toBeGreaterThanOrEqual(3);
      expect(s.length).toBeLessThanOrEqual(6);
      expect(last(config, v)).toContain(expected(v));
    });
  }

  it('z-score step 2 ends on the headline z value', () => {
    const v = demo(zScore);
    expect(exprs(zScore, v)[1].endsWith(`= ${getValue(zScore.calculate(v), 'zscore')}`)).toBe(true);
  });

  it('ratio: demo values give a proportion CHECK whose verdict matches the result', () => {
    const v = demo(ratio);
    const res = getValue(ratio.calculate(v), 'proportionResult');
    expect(res.startsWith('Not proportional')).toBe(true);
    expect(last(ratio, v)).toContain('not proportional');
    expect(exprs(ratio, v)[2]).toContain(`= ${getValue(ratio.calculate(v), 'simplified')}`);
  });

  it('ratio: solving for D ends on the displayed missing value', () => {
    const v = { a: '16', b: '9', c: '32', d: '' };
    expect(last(ratio, v).endsWith(`= ${getValue(ratio.calculate(v), 'proportionResult')}`)).toBe(true);
  });

  it('proportion: demo values give a CHECK that agrees with the verification row', () => {
    const v = demo(proportion);
    expect(getValue(proportion.calculate(v), 'verification')).toContain('≠');
    expect(last(proportion, v)).toContain('≠');
  });

  it('proportion: solving ends on the displayed missing value', () => {
    const v = { a: '1', b: '2', c: '3', d: '' };
    expect(last(proportion, v).endsWith(`= ${getValue(proportion.calculate(v), 'result')}`)).toBe(true);
  });
});

describe('average explainSteps', () => {
  it('sum and mean of 85, 92, 78, 95, 88', () => {
    expect(exprs(average, { data: '85, 92, 78, 95, 88' })).toEqual(['85 + 92 + 78 + 95 + 88 = 438', 'n = 5', '438 ÷ 5 = 87.6']);
  });
  it('exact decimals: 0.1 + 0.2 + 0.3 = 0.6, mean 0.2', () => {
    expect(exprs(average, { data: '0.1, 0.2, 0.3' })).toEqual(['0.1 + 0.2 + 0.3 = 0.6', 'n = 3', '0.6 ÷ 3 = 0.2']);
  });
  it('negatives are bracketed', () => {
    expect(exprs(average, { data: '-3, 5, 10' })[0]).toBe('(-3) + 5 + 10 = 12');
  });
  it('long lists are abbreviated but keep the exact sum', () => {
    expect(exprs(average, { data: '1,2,3,4,5,6,7,8,9,10' })[0]).toBe('1 + 2 + 3 + … + 10 = 55');
  });
  it('blank / non-numeric input returns []', () => {
    expect(steps(average, { data: '' })).toEqual([]);
    expect(steps(average, { data: 'abc' })).toEqual([]);
  });
});

describe('standard-deviation explainSteps', () => {
  it('sample SD of 12, 15, 18, 22, 14, 19, 16, 21', () => {
    const e = exprs(standardDeviation, { dataSet: '12, 15, 18, 22, 14, 19, 16, 21', population: 'sample' });
    expect(e[0]).toBe('x̄ = 137 ÷ 8 = 17.125');
    expect(e[1]).toBe('(12 − 17.125)² + (15 − 17.125)² + … + (21 − 17.125)² = 84.875');
    expect(e[2]).toBe('84.875 ÷ 7 = 12.125');
    expect(e[3]).toBe('s = √12.125 = 3.482097069');
  });
  it('population SD of 2, 4, 4, 4, 5, 5, 7, 9 is exactly 2', () => {
    const e = exprs(standardDeviation, { dataSet: '2, 4, 4, 4, 5, 5, 7, 9', population: 'population' });
    expect(e[0]).toBe('x̄ = 40 ÷ 8 = 5');
    expect(e[1].endsWith('= 32')).toBe(true);
    expect(e[2]).toBe('32 ÷ 8 = 4');
    expect(e[3]).toBe('σ = √4 = 2');
  });
  it('fewer than two numbers returns []', () => {
    expect(steps(standardDeviation, { dataSet: '5', population: 'sample' })).toEqual([]);
    expect(steps(standardDeviation, { dataSet: '', population: 'sample' })).toEqual([]);
  });
});

describe('quadratic explainSteps', () => {
  const q = (a: string, b: string, c: string) => exprs(quadratic, { a, b, c });
  it('x² − 5x + 6: two rational roots', () => {
    expect(q('1', '-5', '6')).toEqual([
      'x² - 5x + 6 = 0  →  a = 1, b = -5, c = 6',
      'Δ = b² − 4ac = (-5)² − 4(1)(6) = 25 − 24 = 1',
      'x = (−b ± √Δ) ÷ 2a = (5 ± √1) ÷ 2',
      'x₁ = 3, x₂ = 2',
    ]);
  });
  it('2x² + 3x − 2: negative 4ac is bracketed, roots 0.5 and −2', () => {
    const e = q('2', '3', '-2');
    expect(e[1]).toBe('Δ = b² − 4ac = 3² − 4(2)(-2) = 9 − (-16) = 25');
    expect(e[2]).toBe('x = (−b ± √Δ) ÷ 2a = (-3 ± √25) ÷ 4');
    expect(e[3]).toBe('x₁ = 0.5, x₂ = -2');
  });
  it('x² + 2x + 1: repeated root', () => {
    const e = q('1', '2', '1');
    expect(e[1]).toBe('Δ = b² − 4ac = 2² − 4(1)(1) = 4 − 4 = 0');
    expect(e[2]).toBe('x = −b ÷ 2a = -2 ÷ 2');
    expect(e[3]).toBe('x = -1');
  });
  it('x² + 2x + 5: complex roots −1 ± 2i', () => {
    const e = q('1', '2', '5');
    expect(e[1]).toBe('Δ = b² − 4ac = 2² − 4(1)(5) = 4 − 20 = -16');
    expect(e[2]).toBe('x = (−b ± √Δ) ÷ 2a = (-2 ± √(-16)) ÷ 2');
    expect(e[3]).toBe('x₁ = -1 + 2i, x₂ = -1 − 2i');
  });
  it('x² − 2: irrational roots to 8 decimals', () => {
    const e = q('1', '0', '-2');
    expect(e[1]).toBe('Δ = b² − 4ac = 0² − 4(1)(-2) = 0 − (-8) = 8');
    expect(e[3]).toBe('x₁ = 1.41421356, x₂ = -1.41421356');
  });
  it('blank coefficients and a = 0 (not a quadratic) return []', () => {
    expect(q('', '2', '3')).toEqual([]);
    expect(q('1', 'x', '3')).toEqual([]);
    expect(q('0', '2', '3')).toEqual([]);
  });
});

describe('pythagorean explainSteps', () => {
  const p = (mode: string, a: string, b: string, c: string) => exprs(pythagorean, { mode, a, b, c });
  it('3-4-5 hypotenuse', () => {
    expect(p('hypotenuse', '3', '4', '')).toEqual(['a² + b² = 3² + 4² = 9 + 16', 'c² = 9 + 16 = 25', 'c = √25 = 5']);
  });
  it('decimal legs 1.5 and 2 give 2.5', () => {
    expect(p('hypotenuse', '1.5', '2', '')).toEqual(['a² + b² = 1.5² + 2² = 2.25 + 4', 'c² = 2.25 + 4 = 6.25', 'c = √6.25 = 2.5']);
  });
  it('leg a from c = 13, b = 5 is 12', () => {
    expect(p('leg_a', '', '5', '13')).toEqual(['a² = c² − b² = 13² − 5² = (13 − 5)(13 + 5)', 'a² = 8 × 18 = 144', 'a = √144 = 12']);
  });
  it('leg b from c = 13, a = 5 is 12', () => {
    expect(p('leg_b', '5', '', '13')[2]).toBe('b = √144 = 12');
  });
  it('blank input and a hypotenuse shorter than the leg return []', () => {
    expect(p('hypotenuse', '3', '', '')).toEqual([]);
    expect(p('leg_a', '', '5', '4')).toEqual([]);
    expect(p('hypotenuse', '0', '4', '')).toEqual([]);
  });
});

describe('ratio explainSteps', () => {
  const r = (v: V) => exprs(ratio, v);
  it('16 : 9 with C = 32 solves D = 18', () => {
    expect(r({ a: '16', b: '9', c: '32', d: '' })).toEqual([
      '16 : 9',
      'GCD(16, 9) = 1',
      '16 ÷ 1 : 9 ÷ 1 = 16 : 9',
      '16 / 9 = 32 / D',
      'D = (B × C) ÷ A = (9 × 32) ÷ 16 = 18',
    ]);
  });
  it('solving for C: 16 : 9 = C : 18 gives 32', () => {
    expect(r({ a: '16', b: '9', c: '', d: '18' }).at(-1)).toBe('C = (A × D) ÷ B = (16 × 18) ÷ 9 = 32');
  });
  it('decimals are scaled to whole numbers first: 1.5 : 2.5 -> 3 : 5', () => {
    expect(r({ a: '1.5', b: '2.5', c: '', d: '' })).toEqual(['1.5 : 2.5  ×  2  =  3 : 5', 'GCD(3, 5) = 1', '3 ÷ 1 : 5 ÷ 1 = 3 : 5']);
  });
  it('4 : 6 reduces by GCD 2 to 2 : 3', () => {
    expect(r({ a: '4', b: '6', c: '', d: '' }).slice(1)).toEqual(['GCD(4, 6) = 2', '4 ÷ 2 : 6 ÷ 2 = 2 : 3']);
  });
  it('2 : 3 = 4 : 6 is confirmed by equal cross products', () => {
    expect(r({ a: '2', b: '3', c: '4', d: '6' }).slice(3)).toEqual([
      'A × D = 2 × 6 = 12   and   B × C = 3 × 4 = 12',
      '12 = 12, so the ratios are proportional',
    ]);
  });
  it('an aspect-ratio preset fills A and B when both are blank', () => {
    expect(r({ a: '', b: '', c: '', d: '', preset: '16:9' })[0]).toBe('16 : 9');
  });
  it('blank, zero or garbage A / B return []', () => {
    expect(steps(ratio, { a: '', b: '', c: '', d: '', preset: 'none' })).toEqual([]);
    expect(steps(ratio, { a: '0', b: '5' })).toEqual([]);
    expect(steps(ratio, { a: '3abc', b: '5' })).toEqual([]);
  });
});

describe('proportion explainSteps', () => {
  const p = (a: string, b: string, c: string, d: string) => exprs(proportion, { a, b, c, d });
  it('1/2 = 3/d gives d = 6', () => {
    expect(p('1', '2', '3', '')).toEqual([
      'a/b = c/d  →  1/2 = 3/d',
      'a × d = b × c  →  1 × d = 2 × 3',
      'd = (2 × 3) ÷ 1 = 6',
    ]);
  });
  it('a/4 = 6/8 gives a = 3', () => {
    expect(p('', '4', '6', '8')).toEqual([
      'a/b = c/d  →  a/4 = 6/8',
      'a × d = b × c  →  a × 8 = 4 × 6',
      'a = (4 × 6) ÷ 8 = 3',
    ]);
  });
  it('2/4 = 3/6 is confirmed (12 = 12)', () => {
    expect(p('2', '4', '3', '6').slice(1)).toEqual([
      'a × d = 2 × 6 = 12  and  b × c = 4 × 3 = 12',
      '12 = 12, so the two ratios are equal (a proportion)',
    ]);
  });
  it('fewer than three values, zero, or garbage return []', () => {
    expect(steps(proportion, { a: '1', b: '2', c: '', d: '' })).toEqual([]);
    expect(steps(proportion, { a: '0', b: '2', c: '3', d: '' })).toEqual([]);
    expect(steps(proportion, { a: '1x', b: '2', c: '3', d: '' })).toEqual([]);
  });
});

describe('gcf explainSteps', () => {
  const g = (a: string, b: string) => exprs(gcf, { a, b });
  it('GCF(24, 36) = 12', () => {
    expect(g('24', '36')).toEqual(['24 = 2^3 × 3  and  36 = 2^2 × 3^2', '2^2 × 3', '2^2 × 3 = 12']);
  });
  it('GCF(100, 75) = 25', () => {
    expect(g('100', '75')).toEqual(['100 = 2^2 × 5^2  and  75 = 3 × 5^2', '5^2', '5^2 = 25']);
  });
  it('co-prime numbers have GCF 1', () => {
    expect(g('17', '5')).toEqual(['17 = 17  and  5 = 5', 'no prime appears in both numbers', 'No shared primes, so GCF = 1']);
  });
  it('1 has no prime factors', () => {
    expect(g('1', '12')[0]).toBe('1 = 1  and  12 = 2^2 × 3');
  });
  it('blank, zero, negative and decimal input return []', () => {
    expect(steps(gcf, { a: '', b: '36' })).toEqual([]);
    expect(steps(gcf, { a: '0', b: '36' })).toEqual([]);
    expect(steps(gcf, { a: '-4', b: '36' })).toEqual([]);
    expect(steps(gcf, { a: '2.5', b: '36' })).toEqual([]);
  });
});

describe('lcm explainSteps', () => {
  const l = (numbers: string) => exprs(lcm, { numbers });
  it('LCM(12, 18) = 36 via GCD 6', () => {
    expect(l('12, 18')).toEqual(['LCM(12, 18)', 'GCD(12, 18) = 6', 'LCM(12, 18) = (12 × 18) ÷ 6 = 36']);
  });
  it('LCM(4, 6, 10) chains to 60', () => {
    expect(l('4, 6, 10')).toEqual(['LCM(4, 6, 10)', 'LCM(4, 6) = (4 × 6) ÷ 2 = 12', 'LCM(12, 10) = (12 × 10) ÷ 2 = 60']);
  });
  it('a long chain is abbreviated and ends on the exact LCM 840', () => {
    expect(l('2, 3, 4, 5, 6, 7, 8')).toEqual([
      'LCM(2, 3, 4, 5, 6, 7, …)',
      'LCM(2, 3) = (2 × 3) ÷ 1 = 6',
      '… 4 more pairwise steps …',
      'LCM(420, 8) = (420 × 8) ÷ 4 = 840',
    ]);
  });
  it('a single number, zero, negative or text return []', () => {
    expect(steps(lcm, { numbers: '12' })).toEqual([]);
    expect(steps(lcm, { numbers: '0, 5' })).toEqual([]);
    expect(steps(lcm, { numbers: '-3, 5' })).toEqual([]);
    expect(steps(lcm, { numbers: 'x, 5' })).toEqual([]);
    expect(steps(lcm, { numbers: '' })).toEqual([]);
  });
});

describe('slope explainSteps', () => {
  const s = (x1: string, y1: string, x2: string, y2: string) => exprs(slope, { x1, y1, x2, y2, outputFormat: 'standard' });
  it('(2, 3) to (5, 7) has slope 4/3', () => {
    expect(s('2', '3', '5', '7')).toEqual(['y₂ − y₁ = 7 − 3 = 4', 'x₂ − x₁ = 5 − 2 = 3', 'm = 4 ÷ 3 = 1.3333']);
  });
  it('negative coordinates are bracketed: (−1, −2) to (3, 6) has slope 2', () => {
    expect(s('-1', '-2', '3', '6')).toEqual(['y₂ − y₁ = 6 − (-2) = 8', 'x₂ − x₁ = 3 − (-1) = 4', 'm = 8 ÷ 4 = 2']);
  });
  it('exact decimals: (0.1, 0.2) to (0.4, 0.5) is exactly 1', () => {
    expect(s('0.1', '0.2', '0.4', '0.5')).toEqual(['y₂ − y₁ = 0.5 − 0.2 = 0.3', 'x₂ − x₁ = 0.4 − 0.1 = 0.3', 'm = 0.3 ÷ 0.3 = 1']);
  });
  it('vertical line: undefined, never Infinity', () => {
    expect(s('2', '1', '2', '5')).toEqual(['y₂ − y₁ = 5 − 1 = 4', 'x₂ − x₁ = 2 − 2 = 0', 'm = 4 ÷ 0 is undefined (vertical line)']);
  });
  it('horizontal line has slope 0', () => {
    expect(s('0', '5', '4', '5')[2]).toBe('m = 0 ÷ 4 = 0');
  });
  it('identical points and blank input return []', () => {
    expect(s('2', '3', '2', '3')).toEqual([]);
    expect(s('', '3', '5', '7')).toEqual([]);
    expect(s('2', '3', '5', 'abc')).toEqual([]);
  });
});

describe('permutation-combination explainSteps', () => {
  const pc = (n: string, r: string, orderMatters: string, repetition = 'no') => exprs(permComb, { n, r, orderMatters, repetition });
  it('5P3 = 60', () => {
    expect(pc('5', '3', 'permutation')).toEqual([
      'P(5,3) = 5! / (5 − 3)!',
      'n = 5, r = 3  →  n − r = 2',
      '5! = 120,  2! = 2',
      '5! / 2! = 120 / 2 = 60',
    ]);
  });
  it('10C3 = 120', () => {
    expect(pc('10', '3', 'combination')).toEqual([
      'C(10,3) = 10! / (3! × (10 − 3)!)',
      'n = 10, r = 3  →  n − r = 7',
      '10! = 3628800,  3! = 6,  7! = 5040',
      '10! / (3! × 7!) = 3628800 / (6 × 5040) = 120',
    ]);
  });
  it('permutation with repetition: 5^3 = 125', () => {
    expect(pc('5', '3', 'permutation', 'yes')).toEqual(['P(n,r) with repetition = n^r', 'n = 5, r = 3', '5^3 = 125']);
  });
  it('combination with repetition: C(7,3) = 35', () => {
    expect(pc('5', '3', 'combination', 'yes')).toEqual([
      'C(n+r−1, r) = (n+r−1)! / (r! × (n−1)!)',
      'n = 5, r = 3  →  n + r − 1 = 7',
      '(5+3−1)! / (3! × 4!) = 35',
    ]);
  });
  it('blank, decimal and over-limit input return []', () => {
    expect(steps(permComb, { n: '', r: '3', orderMatters: 'permutation', repetition: 'no' })).toEqual([]);
    expect(steps(permComb, { n: '5.5', r: '3', orderMatters: 'permutation', repetition: 'no' })).toEqual([]);
    expect(steps(permComb, { n: '5000', r: '3', orderMatters: 'permutation', repetition: 'no' })).toEqual([]);
  });
});

describe('percent-error explainSteps', () => {
  const pe = (accepted: string, experimental: string) => exprs(percentError, { accepted, experimental });
  it('95 against 100 is 5%', () => {
    expect(pe('100', '95')).toEqual(['|vE − vA| = |95 − 100| = 5', '5 ÷ |100| = 0.05', '0.05 × 100 = 5%']);
  });
  it('9.81 against 9.8: relative error to 8 significant digits, percent to 4 decimals', () => {
    expect(pe('9.8', '9.81')).toEqual(['|vE − vA| = |9.81 − 9.8| = 0.01', '0.01 ÷ |9.8| = 0.0010204082', '0.0010204082 × 100 = 0.102%']);
  });
  it('negative values are bracketed and divided by |accepted|', () => {
    expect(pe('-50', '-40')).toEqual(['|vE − vA| = |(-40) − (-50)| = 10', '10 ÷ |-50| = 0.2', '0.2 × 100 = 20%']);
  });
  it('a zero accepted value and blank input return []', () => {
    expect(pe('0', '5')).toEqual([]);
    expect(pe('', '5')).toEqual([]);
    expect(pe('100', 'abc')).toEqual([]);
  });
});

describe('z-score explainSteps', () => {
  const z = (rawScore: string, mean: string, stddev: string) => exprs(zScore, { rawScore, mean, stddev });
  it('x = 85, mu = 70, sigma = 10: z = 1.5, Phi = 0.9331927987', () => {
    expect(z('85', '70', '10')).toEqual(['x − μ = 85 − 70 = 15', 'z = 15 ÷ 10 = 1.5', 'P(Z ≤ 1.5) = 0.9331927987  →  93.31927987%']);
  });
  it('x = 60: z = -1, Phi = 0.1586552539', () => {
    expect(z('60', '70', '10')).toEqual(['x − μ = 60 − 70 = -10', 'z = -10 ÷ 10 = -1', 'P(Z ≤ -1) = 0.1586552539  →  15.86552539%']);
  });
  it('negative mean is bracketed: x = 5, mu = -3, sigma = 2 gives z = 4', () => {
    expect(z('5', '-3', '2')).toEqual(['x − μ = 5 − (-3) = 8', 'z = 8 ÷ 2 = 4', 'P(Z ≤ 4) = 0.9999683288  →  99.99683288%']);
  });
  it('sigma <= 0, blank and garbage return []', () => {
    expect(z('85', '70', '0')).toEqual([]);
    expect(z('85', '70', '-2')).toEqual([]);
    expect(z('', '70', '10')).toEqual([]);
    expect(z('85', '70x', '10')).toEqual([]);
  });
});

describe('tip-splitter (tip-calculator) explainSteps', () => {
  const t = (v: V) => exprs(tip, v);
  it('$100, 20%, 4 people, no tax: splits evenly', () => {
    expect(t({ billAmount: '100', tipPercent: '20', numPeople: '4', taxAmount: '' })).toEqual([
      '$100.00  (no tax entered, so the tip is on the whole bill)',
      '$100.00 × 20% = $20.00',
      '$100.00 + $20.00 = $120.00',
      '$120.00 ÷ 4 = $30.00',
    ]);
  });
  it('$85.50 with $7.20 tax, 18%, 4 people: tip on the pre-tax $78.30, leftover cent goes to one person', () => {
    expect(t({ billAmount: '85.50', tipPercent: '18', numPeople: '4', taxAmount: '7.20' })).toEqual([
      '$85.50 − $7.20 = $78.30',
      '$78.30 × 18% = $14.09',
      '$85.50 + $14.09 = $99.59',
      '$99.59 ÷ 4: 3 pay $24.90, 1 pays $24.89',
    ]);
  });
  it('one person has no split step', () => {
    expect(t({ billAmount: '85.50', tipPercent: '18', numPeople: '1', taxAmount: '' })).toEqual([
      '$85.50  (no tax entered, so the tip is on the whole bill)',
      '$85.50 × 18% = $15.39',
      '$85.50 + $15.39 = $100.89',
    ]);
  });
  it('blank people defaults to 1, matching calculate()', () => {
    expect(t({ billAmount: '85.50', tipPercent: '18', numPeople: '', taxAmount: '' })).toHaveLength(3);
  });
  it('blank or invalid bill, zero people and tax >= bill return []', () => {
    expect(steps(tip, { billAmount: '', tipPercent: '18', numPeople: '2', taxAmount: '' })).toEqual([]);
    expect(steps(tip, { billAmount: '0', tipPercent: '18', numPeople: '2', taxAmount: '' })).toEqual([]);
    expect(steps(tip, { billAmount: '50', tipPercent: '18', numPeople: '0', taxAmount: '' })).toEqual([]);
    expect(steps(tip, { billAmount: '50', tipPercent: '18', numPeople: '2', taxAmount: '50' })).toEqual([]);
  });
});

describe('explainSteps never print NaN / Infinity, even for extreme input', () => {
  const junk = ['', 'abc', '0', '-1', '0.0000001'];
  const fields: [string, CalculatorConfig, string[], V?][] = [
    ['average', average, ['data']],
    ['standard-deviation', standardDeviation, ['dataSet'], { population: 'sample' }],
    ['quadratic', quadratic, ['a', 'b', 'c']],
    ['pythagorean', pythagorean, ['a', 'b', 'c'], { mode: 'hypotenuse' }],
    ['ratio', ratio, ['a', 'b', 'c', 'd']],
    ['proportion', proportion, ['a', 'b', 'c', 'd']],
    ['gcf', gcf, ['a', 'b']],
    ['lcm', lcm, ['numbers']],
    ['slope', slope, ['x1', 'y1', 'x2', 'y2']],
    ['permutation-combination', permComb, ['n', 'r'], { orderMatters: 'combination', repetition: 'no' }],
    ['percent-error', percentError, ['accepted', 'experimental']],
    ['z-score', zScore, ['rawScore', 'mean', 'stddev']],
    ['tip-splitter', tip, ['billAmount', 'numPeople', 'taxAmount'], { tipPercent: '18' }],
  ];
  for (const [name, config, ids, extra] of fields) {
    it(name, () => {
      // solveQuadratic itself is very slow for ~1e300 or ~1e-300 coefficients (pre-existing, in quadraticMath), so keep those out of its fuzz.
      const extreme = name === 'quadratic' ? [] : ['1e-300', '1e308', '99999999999999999999'];
      for (const j of [...junk, ...extreme]) {
        for (const other of name === 'quadratic' ? ['5', ''] : ['5', '1e300', '']) {
          // Put junk in each field in turn, a second value in the rest.
          for (const target of ids) {
            const v: V = { ...extra };
            for (const id of ids) v[id] = id === target ? j : other;
            const out = steps(config, v);
            for (const st of out) {
              expect(`${st.label} ${st.expr} ${st.note ?? ''}`).not.toMatch(/NaN|Infinity|\[object/);
            }
          }
        }
      }
    });
  }
});
