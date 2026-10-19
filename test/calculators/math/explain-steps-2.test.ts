import { describe, it, expect } from 'vitest';
import type { CalculatorConfig, ExplainStep } from '../../../src/types/calculator';
import circle from '../../../src/calculators/math/circle';
import areaPerimeter from '../../../src/calculators/math/area-perimeter';
import distance from '../../../src/calculators/math/distance';
import exponent from '../../../src/calculators/math/exponent';
import factorial from '../../../src/calculators/math/factorial-calculator';
import primeFactorization from '../../../src/calculators/math/prime-factorization';
import scientificNotation from '../../../src/calculators/math/scientific-notation';
import nthRoot from '../../../src/calculators/math/nth-root';
import commonFactor from '../../../src/calculators/math/common-factor';
import meanMedianMode from '../../../src/calculators/math/mean-median-mode';
import descriptiveStats from '../../../src/calculators/math/descriptive-stats';
import lawOfCosines from '../../../src/calculators/math/law-of-cosines';
import dotProduct from '../../../src/calculators/math/dot-product';
import crossProduct from '../../../src/calculators/math/cross-product';
import log from '../../../src/calculators/math/log';
import fractionToDecimal from '../../../src/calculators/math/fraction-to-decimal';
import volumeSurface from '../../../src/calculators/math/volume-surface';
import triangle from '../../../src/calculators/math/triangle';
import { buildDemoValues } from '../../helpers';

// Every number asserted below was computed independently in Python (math / fractions / decimal at 40 digits,
// math.factorial for the factorial rows), not by running the calculators.

type V = Record<string, string>;
const steps = (c: CalculatorConfig, v: V): ExplainStep[] => c.explainSteps!(v);
const exprs = (c: CalculatorConfig, v: V) => steps(c, v).map((s) => s.expr);
const demo = (c: CalculatorConfig) => buildDemoValues(c.inputs);

describe('explainSteps (batch 2) - every calculator returns steps for its demo values and [] for empty input', () => {
  const all: [string, CalculatorConfig][] = [
    ['circle', circle],
    ['area-perimeter', areaPerimeter],
    ['distance', distance],
    ['exponent', exponent],
    ['factorial-calculator', factorial],
    ['prime-factorization', primeFactorization],
    ['scientific-notation', scientificNotation],
    ['nth-root', nthRoot],
    ['common-factor', commonFactor],
    ['mean-median-mode', meanMedianMode],
    ['descriptive-stats', descriptiveStats],
    ['law-of-cosines', lawOfCosines],
    ['dot-product', dotProduct],
    ['cross-product', crossProduct],
    ['log', log],
    ['fraction-to-decimal', fractionToDecimal],
    ['volume-surface', volumeSurface],
    ['triangle', triangle],
  ];
  for (const [name, c] of all) {
    it(name, () => {
      const v = demo(c);
      if (c.calculate(v).length > 0 && !c.calculate(v).some((r) => r.id === 'error' || r.id === 'triangleError')) {
        const s = steps(c, v);
        expect(s.length).toBeGreaterThanOrEqual(1);
        expect(s.length).toBeLessThanOrEqual(6);
        for (const st of s) {
          expect(st.label.length).toBeGreaterThan(0);
          expect(st.expr).not.toMatch(/NaN|Infinity|undefined/);
        }
      }
      expect(steps(c, {})).toEqual([]);
    });
  }
});

describe('circle', () => {
  it('radius 5: C = 31.41592654, A = 78.53981634', () => {
    expect(exprs(circle, { inputType: 'radius', value: '5' })).toEqual([
      'r = 5',
      'd = 2r = 2 × 5 = 10',
      'C = 2πr = 2 × π × 5 = 31.41592654',
      'A = πr² = π × 5² = 78.53981634',
    ]);
  });
  it('area 50: r = √(50 ÷ π) = 3.9894228, d = 7.97884561, C = 25.06628275', () => {
    expect(exprs(circle, { inputType: 'area', value: '50' })).toEqual([
      'r = √(A ÷ π) = √(50 ÷ π) = 3.9894228',
      'd = 2r = 2 × 3.9894228 = 7.97884561',
      'C = 2πr = 2 × π × 3.9894228 = 25.06628275',
      'A = πr² = π × 3.9894228² = 50',
    ]);
  });
  it('diameter 10 gives r = 5 and circumference from circumference 31.4159 gives r = 4.99999578', () => {
    expect(exprs(circle, { inputType: 'diameter', value: '10' })[0]).toBe('r = d ÷ 2 = 10 ÷ 2 = 5');
    expect(exprs(circle, { inputType: 'circumference', value: '31.4159' })[0]).toBe('r = C ÷ (2π) = 31.4159 ÷ (2 × π) = 4.99999578');
  });
  it('zero, negative and blank input return []', () => {
    expect(steps(circle, { inputType: 'radius', value: '0' })).toEqual([]);
    expect(steps(circle, { inputType: 'radius', value: '-3' })).toEqual([]);
    expect(steps(circle, { inputType: 'radius', value: '' })).toEqual([]);
  });
});

describe('area-perimeter', () => {
  it('rectangle 10 x 5: area 50, perimeter 30, diagonal 11.18034', () => {
    expect(exprs(areaPerimeter, { shape: 'rectangle', rectLength: '10', rectWidth: '5' })).toEqual([
      'A = l × w = 10 × 5 = 50',
      'P = 2(l + w) = 2 × (10 + 5) = 30',
      'd = √(l² + w²) = √(10² + 5²) = 11.18034',
    ]);
  });
  it('rectangle + semicircle R = 2: 50 + 6.283185 = 56.283185, outline 32.283185', () => {
    const e = exprs(areaPerimeter, { shape: 'rectangle', rectLength: '10', rectWidth: '5', compound: 'rectSemi', compRadius: '2' });
    expect(e[1]).toBe('A = ½πR² = ½ × π × 2² = 6.283185');
    expect(e[2]).toBe('A = 50 + 6.283185 = 56.283185');
    expect(e[3]).toBe('P = 2(l + w) − 2R + πR = 2(10 + 5) − 2 × 2 + π × 2 = 32.283185');
  });
  it('circle r = 5', () => {
    expect(exprs(areaPerimeter, { shape: 'circle', circleRadius: '5' })).toEqual([
      'A = πr² = π × 5² = 78.539816',
      'C = 2πr = 2 × π × 5 = 31.415927',
      'd = 2r = 2 × 5 = 10',
    ]);
  });
  it('hexagon side 5: A = 64.951905, P = 30, apothem 4.330127', () => {
    const e = exprs(areaPerimeter, { shape: 'hexagon', hexSide: '5' });
    expect(e[0]).toBe('A = (3√3 ÷ 2) × s² = (3√3 ÷ 2) × 5² = 64.951905');
    expect(e[1]).toBe('P = 6s = 6 × 5 = 30');
    expect(e[2]).toBe('a = s√3 ÷ 2 = 5 × √3 ÷ 2 = 4.330127');
  });
  it('trapezoid 10 and 6, height 4: midsegment 8, area 32', () => {
    expect(exprs(areaPerimeter, { shape: 'trapezoid', trapBase1: '10', trapBase2: '6', trapHeight: '4' })).toEqual([
      'm = (a + b) ÷ 2 = (10 + 6) ÷ 2 = 8',
      'A = ½(a + b) × h = ½ × (10 + 6) × 4 = 32',
    ]);
  });
  it('triangle: area alone, then with both sides the perimeter joins in', () => {
    expect(exprs(areaPerimeter, { shape: 'triangle', triBase: '8', triHeight: '3' })).toEqual(['A = ½ × b × h = ½ × 8 × 3 = 12']);
    expect(exprs(areaPerimeter, { shape: 'triangle', triBase: '8', triHeight: '3', triSide: '5', triSide3: '5' })[1]).toBe('P = b + a + c = 8 + 5 + 5 = 18');
  });
  it('square and parallelogram', () => {
    expect(exprs(areaPerimeter, { shape: 'square', squareSide: '6' })[0]).toBe('A = s² = 6² = 36');
    expect(exprs(areaPerimeter, { shape: 'parallelogram', paraBase: '10', paraSide: '5', paraHeight: '4' })).toEqual([
      'A = b × h = 10 × 4 = 40',
      'P = 2(b + a) = 2 × (10 + 5) = 30',
    ]);
  });
  it('impossible shapes (sloping side shorter than the height; non-triangle sides) and blank input return []', () => {
    expect(steps(areaPerimeter, { shape: 'parallelogram', paraBase: '10', paraSide: '3', paraHeight: '4' })).toEqual([]);
    expect(steps(areaPerimeter, { shape: 'triangle', triBase: '8', triHeight: '3', triSide: '1', triSide3: '2' })).toEqual([]);
    expect(steps(areaPerimeter, { shape: 'square', squareSide: '' })).toEqual([]);
  });
});

describe('distance', () => {
  it('1D: 3 to -4 is 7', () => {
    expect(exprs(distance, { mode: '1d', x1_1d: '3', x2_1d: '-4' })).toEqual(['x₂ − x₁ = -4 − 3 = -7', 'd = |-7| = 7']);
  });
  it('2D: (2, 3) to (5, 7) is 5', () => {
    expect(exprs(distance, { mode: '2d', x1: '2', y1: '3', x2: '5', y2: '7' })).toEqual([
      'Δx = 5 − 2 = 3,  Δy = 7 − 3 = 4',
      '3² + 4² = 9 + 16 = 25',
      'd = √25 = 5',
    ]);
  });
  it('2D with negatives: (-1, -2) to (2, 2) is 5', () => {
    expect(exprs(distance, { mode: '2d', x1: '-1', y1: '-2', x2: '2', y2: '2' })[0]).toBe('Δx = 2 − (-1) = 3,  Δy = 2 − (-2) = 4');
  });
  it('3D: (1, 2, 3) to (4, 6, 15) is 13', () => {
    const e = exprs(distance, { mode: '3d', x1: '1', y1: '2', z1: '3', x2: '4', y2: '6', z2: '15' });
    expect(e[1]).toBe('3² + 4² + 12² = 9 + 16 + 144 = 169');
    expect(e[2]).toBe('d = √169 = 13');
  });
  it('irrational distance: (0, 0) to (1, 1) is 1.414214', () => {
    expect(exprs(distance, { mode: '2d', x1: '0', y1: '0', x2: '1', y2: '1' }).at(-1)).toBe('d = √2 = 1.414214');
  });
  it('blank input returns []', () => {
    expect(steps(distance, { mode: '2d', x1: '1', y1: '', x2: '2', y2: '3' })).toEqual([]);
  });
});

describe('exponent', () => {
  const e = (base: string, exp: string) => exprs(exponent, { base, exponent: exp });
  it('2^5 = 32', () => {
    expect(e('2', '5')).toEqual([
      'b = 2, n = 5  →  2^5',
      '2 × 2 × 2 × 2 × 2 = 32',
      '2^5 = 2^2 × 2^2 × 2^1 = 4 × 4 × 2 = 32',
    ]);
  });
  it('2^-3 = 0.125', () => {
    expect(e('2', '-3')).toEqual(['b = 2, n = -3  →  2^-3', '2^-3 = 1 / 2^3', '1 / (2 × 2 × 2) = 0.125']);
  });
  it('(-2)^3 = -8 keeps its brackets', () => {
    expect(e('-2', '3')[1]).toBe('(-2) × (-2) × (-2) = -8');
  });
  it('anything to the power 0 is 1', () => {
    expect(e('7', '0')[1]).toBe('7^0 = 1');
  });
  it('8^(1/3) = 2 and (-8)^(1/3) = -2 (odd root keeps the sign)', () => {
    expect(e('8', '0.3333333333333333')[1]).toBe('8^(1/3) = (cube root of 8)^1');
    expect(e('8', '0.3333333333333333').at(-1)).toBe('8^0.333333333333 = 2');
    expect(e('-8', '0.3333333333333333').at(-1)).toBe('(-8)^0.333333333333 = -2');
  });
  it('2^0.5 = 1.41421356237 via the exponential form', () => {
    expect(e('2', '0.5')).toEqual(['b = 2, n = 0.5  →  2^0.5', '2^(1/2) = (square root of 2)^1', '2^0.5 = 1.41421356237']);
  });
  it('2^30 = 1073741824 and a long exponent falls back to the factor description', () => {
    expect(e('2', '30').at(-1)).toContain('1073741824');
    const big = e('2', '25');
    expect(big[1]).toBe('2^25 = 2 × 2 × … × 2  (25 factors)');
    expect(big.at(-1)).toBe('2^25 = 33554432 ≈ 3.355443e+7');
  });
  it('undefined / complex / overflow cases return []', () => {
    expect(e('0', '0')).toEqual([]);
    expect(e('0', '-2')).toEqual([]);
    expect(e('-4', '0.5')).toEqual([]);
    expect(e('10', '400')).toEqual([]);
    expect(e('', '2')).toEqual([]);
  });
});

describe('factorial', () => {
  it('5! = 120 with one trailing zero', () => {
    expect(exprs(factorial, { n: '5' })).toEqual(['5! = 5 × 4 × 3 × 2 × 1', '5 × 4 × 3 × 2 × 1 = 120', '⌊5/5⌋ = 1 = 1']);
  });
  it('10! = 3,628,800 with two trailing zeros', () => {
    const e = exprs(factorial, { n: '10' });
    expect(e[0]).toBe('10! = 10 × 9 × 8 × … × 2 × 1');
    expect(e[1]).toBe('10 × 9 × 8 × 7 × 6 × 5 × 4 × 3 × 2 × 1 = 3,628,800');
    expect(e[2]).toBe('⌊10/5⌋ = 2 = 2');
  });
  it('25! has 26 digits and 6 trailing zeros (5 + 1)', () => {
    const e = exprs(factorial, { n: '25' });
    expect(e[1]).toContain('25! ≈ 1.551121e+25');
    expect(e[1]).toContain('(26 digits)');
    expect(e[2]).toBe('⌊25/5⌋ + ⌊25/25⌋ = 5 + 1 = 6');
  });
  it('100! has 24 trailing zeros (20 + 4)', () => {
    expect(exprs(factorial, { n: '100' }).at(-1)).toBe('⌊100/5⌋ + ⌊100/25⌋ = 20 + 4 = 24');
  });
  it('0! = 1 by definition; 3! has no trailing-zero step', () => {
    expect(exprs(factorial, { n: '0' })).toEqual(['0! = 1']);
    expect(steps(factorial, { n: '3' })).toHaveLength(2);
  });
  it('negative, fractional, too big and blank input return []', () => {
    expect(steps(factorial, { n: '-1' })).toEqual([]);
    expect(steps(factorial, { n: '2.5' })).toEqual([]);
    expect(steps(factorial, { n: '1001' })).toEqual([]);
    expect(steps(factorial, { n: '' })).toEqual([]);
  });
});

describe('prime-factorization', () => {
  it('72 = 2^3 x 3^2', () => {
    expect(exprs(primeFactorization, { number: '72' })).toEqual([
      '72 ÷ 2 = 36,  36 ÷ 2 = 18,  18 ÷ 2 = 9,  9 ÷ 3 = 3,  3 ÷ 3 = 1',
      '72 = 2^3 × 3^2',
      '8 × 9 = 72',
    ]);
  });
  it('360 = 2^3 x 3^2 x 5', () => {
    const e = exprs(primeFactorization, { number: '360' });
    expect(e[1]).toBe('360 = 2^3 × 3^2 × 5');
    expect(e[2]).toBe('8 × 9 × 5 = 360');
  });
  it('a long chain is abbreviated: 2^20 = 1048576', () => {
    const e = exprs(primeFactorization, { number: '1048576' });
    expect(e[0]).toBe('1048576 ÷ 2 = 524288,  524288 ÷ 2 = 262144,  262144 ÷ 2 = 131072,  131072 ÷ 2 = 65536,  …,  4 ÷ 2 = 2,  2 ÷ 2 = 1');
    expect(e[2]).toBe('1048576 = 1048576');
  });
  it('a prime says so: 97', () => {
    expect(exprs(primeFactorization, { number: '97' })).toEqual(['No smaller prime divides 97 evenly', '97 = 97']);
  });
  it('a large semiprime: 600851475143 = 71 x 839 x 1471 x 6857', () => {
    expect(exprs(primeFactorization, { number: '600851475143' })[1]).toBe('600851475143 = 71 × 839 × 1471 × 6857');
  });
  it('1, 0, decimals and blank return []', () => {
    expect(steps(primeFactorization, { number: '1' })).toEqual([]);
    expect(steps(primeFactorization, { number: '0' })).toEqual([]);
    expect(steps(primeFactorization, { number: '12.5' })).toEqual([]);
    expect(steps(primeFactorization, { number: '' })).toEqual([]);
  });
});

describe('scientific-notation', () => {
  const toSci = (decimal: string) => exprs(scientificNotation, { mode: 'toScientific', decimal });
  it('0.0045 = 4.5 x 10^-3', () => {
    expect(toSci('0.0045')).toEqual([
      '0.0045  →  4.5',
      'The point moved 3 places to the right  →  exponent = −3',
      '4.5 × 10^-3',
    ]);
  });
  it('45000 = 4.5 x 10^4', () => {
    expect(toSci('45000')).toEqual(['45000  →  4.5', 'The point moved 4 places to the left  →  exponent = 4', '4.5 × 10^4']);
  });
  it('a number already between 1 and 10 does not move', () => {
    expect(toSci('7.25')[1]).toBe('The point did not move, so the exponent is 0');
  });
  it('negative numbers keep their sign: -602000 = -6.02 x 10^5', () => {
    expect(toSci('-602000').at(-1)).toBe('-6.02 × 10^5');
  });
  it('zero, typed e-notation and text return []', () => {
    expect(toSci('0')).toEqual([]);
    expect(toSci('4.5e-3')).toEqual([]);
    expect(toSci('abc')).toEqual([]);
  });
  it('4.5 x 10^-3 = 0.0045 and 6.02 x 10^23 = 602 followed by 21 zeros', () => {
    expect(exprs(scientificNotation, { mode: 'toDecimal', coefficient: '4.5', exponent: '-3' })).toEqual([
      '4.5 × 10^-3  →  move the point 3 places to the left',
      '4.5 × 10^-3 = 0.0045',
    ]);
    expect(exprs(scientificNotation, { mode: 'toDecimal', coefficient: '6.02', exponent: '23' })[1]).toBe('6.02 × 10^23 = 602000000000000000000000');
  });
  it('exponent 0 and missing fields', () => {
    expect(exprs(scientificNotation, { mode: 'toDecimal', coefficient: '3.2', exponent: '0' })[0]).toBe('3.2 × 10^0  →  no movement');
    expect(steps(scientificNotation, { mode: 'toDecimal', coefficient: '3.2', exponent: '' })).toEqual([]);
  });
});

describe('nth-root', () => {
  const r = (index: string, radicand: string) => exprs(nthRoot, { index, radicand });
  it('cube root of 27 = 3', () => {
    expect(r('3', '27')).toEqual(['∛(27) = 27^(1/3)', '3^3 = 27', '∛(27) = 3']);
  });
  it('square root of 12 = 2 root 3 = 3.4641016151', () => {
    expect(r('2', '12')).toEqual(['√(12) = 12^(1/2)', '√(12) = 2√3', '√(12) = 3.4641016151']);
  });
  it('cube root of -8 = -2 keeps the sign', () => {
    const s = steps(nthRoot, { index: '3', radicand: '-8' });
    expect(s[1].expr).toBe('(-2)^3 = -8');
    expect(s.at(-1)!.expr).toBe('∛(-8) = -2');
    expect(s.at(-1)!.note).toContain('negative');
  });
  it('fourth root of 48 = 2 fourth-root 3', () => {
    expect(r('4', '48')[1]).toBe('∜(48) = 2∜3');
  });
  it('a non-simplifiable root has just two steps: square root of 7', () => {
    expect(r('2', '7')).toEqual(['√(7) = 7^(1/2)', '√(7) = 2.6457513111']);
  });
  it('even root of a negative, index 1 and blanks return []', () => {
    expect(r('2', '-4')).toEqual([]);
    expect(r('1', '5')).toEqual([]);
    expect(r('', '5')).toEqual([]);
  });
});

describe('common-factor', () => {
  it('24 and 36: GCF 12', () => {
    expect(exprs(commonFactor, { a: '24', b: '36' })).toEqual([
      '1, 2, 3, 4, 6, 8, 12, 24',
      '1, 2, 3, 4, 6, 9, 12, 18, 36',
      '1, 2, 3, 4, 6, 12',
      'GCF(24, 36) = 12',
    ]);
  });
  it('co-prime numbers share only 1: 8 and 15', () => {
    const e = exprs(commonFactor, { a: '8', b: '15' });
    expect(e[2]).toBe('1');
    expect(e[3]).toBe('GCF(8, 15) = 1');
  });
  it('a highly composite number is capped: 720720 has 240 factors', () => {
    expect(exprs(commonFactor, { a: '720720', b: '12' })[0]).toContain('… (216 more)');
  });
  it('invalid input returns []', () => {
    expect(steps(commonFactor, { a: '24', b: '' })).toEqual([]);
    expect(steps(commonFactor, { a: '0', b: '5' })).toEqual([]);
    expect(steps(commonFactor, { a: '2.5', b: '5' })).toEqual([]);
  });
});

describe('mean-median-mode', () => {
  it('12, 15, 18, 20, 22, 25, 30: odd count, no mode', () => {
    expect(exprs(meanMedianMode, { data: '12, 15, 18, 20, 22, 25, 30' })).toEqual([
      '12, 15, 18, 20, 22, 25, 30',
      '142 ÷ 7 = 20.28571429',
      'value number 4 of 7 = 20',
      'No value repeats, so there is no mode',
      '30 − 12 = 18',
    ]);
  });
  it('3, 5, 5, 7, 9, 10: even count averages the middle pair, mode 5', () => {
    const s = steps(meanMedianMode, { data: '10, 5, 3, 9, 5, 7' });
    expect(s.map((x) => x.expr)).toEqual([
      '3, 5, 5, 7, 9, 10',
      '39 ÷ 6 = 6.5',
      '(5 + 7) ÷ 2 = 6',
      '5 (each appears 2 times)',
      '10 − 3 = 7',
    ]);
    expect(s[2].note).toBe('They are values number 3 and 4 in the sorted list.');
  });
  it('several modes, negatives and a long list', () => {
    expect(exprs(meanMedianMode, { data: '1, 1, 2, 2, 3' })[3]).toBe('1, 2 (each appears 2 times)');
    expect(exprs(meanMedianMode, { data: '-3, -1, 4' }).at(-1)).toBe('4 − (-3) = 7');
    expect(exprs(meanMedianMode, { data: '1,2,3,4,5,6,7,8,9,10,11,12' })[0]).toBe('1, 2, 3, 4, …, 11, 12');
  });
  it('fewer than two numbers returns []', () => {
    expect(steps(meanMedianMode, { data: '5' })).toEqual([]);
    expect(steps(meanMedianMode, { data: '' })).toEqual([]);
  });
});

describe('descriptive-stats', () => {
  const data = '2, 4, 4, 4, 5, 5, 7, 9';
  it('population: mean 5, SS 32, variance 4, SD 2, quartiles 4 / 6', () => {
    expect(exprs(descriptiveStats, { data, type: 'population' })).toEqual([
      'x̄ = 40 ÷ 8 = 5',
      'Σ(x − x̄)² = 32',
      'σ² = 32 ÷ 8 = 4',
      'σ = √4 = 2',
      'Median = 4.5,  Q1 = 4,  Q3 = 6,  IQR = Q3 − Q1 = 2',
    ]);
  });
  it('sample divides by n - 1: s² = 32 / 7 = 4.571428571, s = 2.138089935', () => {
    const e = exprs(descriptiveStats, { data, type: 'sample' });
    expect(e[2]).toBe('s² = 32 ÷ 7 = 4.571428571');
    expect(e[3]).toBe('s = √4.571428571 = 2.138089935');
  });
  it('fewer than two numbers returns []', () => {
    expect(steps(descriptiveStats, { data: '5', type: 'sample' })).toEqual([]);
  });
});

describe('law-of-cosines', () => {
  it('SSS 3-4-5 gives the angles 90, 36.87 and 53.13 degrees', () => {
    const e = exprs(lawOfCosines, { mode: 'sss', angleUnit: 'deg', a: '3', b: '4', c: '5' });
    expect(e[0]).toBe('C = cos⁻¹((a² + b² − c²) ÷ 2ab) = cos⁻¹((9 + 16 − 25) ÷ 24) = 90°');
    expect(e[1]).toBe('A = cos⁻¹((b² + c² − a²) ÷ 2bc) = cos⁻¹((16 + 25 − 9) ÷ 40) = 36.86989765°');
    expect(e[2]).toBe('B = cos⁻¹((a² + c² − b²) ÷ 2ac) = cos⁻¹((9 + 25 − 16) ÷ 30) = 53.13010235°');
    expect(e[3]).toBe('A + B + C = 36.86989765° + 53.13010235° + 90° ≈ 180°');
  });
  it('SAS a = 5, b = 6, C = 60 gives c = 5.56776436, A = 51.05172444, B = 68.94827556', () => {
    const e = exprs(lawOfCosines, { mode: 'sas', angleUnit: 'deg', a: '5', b: '6', angleC: '60' });
    expect(e[0]).toBe('c² = a² + b² − 2ab·cos(C) = 5² + 6² − 2(5)(6)·cos(60°)');
    expect(e[1]).toBe('c = √(a² + b² − 2ab·cos C) = 5.56776436');
    expect(e[2]).toBe('A = 51.05172444°,  B = 68.94827556°');
  });
  it('radians are labelled as radians', () => {
    expect(exprs(lawOfCosines, { mode: 'sas', angleUnit: 'rad', a: '5', b: '6', angleC: '1.0471975511965976' })[0]).toContain('cos(1.047198 rad)');
  });
  it('lengths that cannot form a triangle, and blank input, return []', () => {
    expect(steps(lawOfCosines, { mode: 'sss', angleUnit: 'deg', a: '1', b: '2', c: '10' })).toEqual([]);
    expect(steps(lawOfCosines, { mode: 'sas', angleUnit: 'deg', a: '5', b: '6', angleC: '200' })).toEqual([]);
    expect(steps(lawOfCosines, { mode: 'sss', angleUnit: 'deg', a: '3', b: '4', c: '' })).toEqual([]);
  });
});

describe('dot-product', () => {
  it('(2, 3) . (5, 6) = 28, |a| = 3.605551, |b| = 7.81025, angle 6.115504 degrees', () => {
    expect(exprs(dotProduct, { v1x: '2', v1y: '3', v1z: '', v2x: '5', v2y: '6', v2z: '' })).toEqual([
      'a·b = (2)(5) + (3)(6) = 10 + 18 = 28',
      '|a| = √((2)² + (3)²) = √13 = 3.605551',
      '|b| = √((5)² + (6)²) = √61 = 7.81025',
      'cos θ = 28 ÷ (3.605551 × 7.81025) = 0.994309  →  θ = 6.115504°',
    ]);
  });
  it('3D (1, 2, 3) . (4, -5, 6) = 12, cos = 0.365487, angle 68.562447', () => {
    const e = exprs(dotProduct, { v1x: '1', v1y: '2', v1z: '3', v2x: '4', v2y: '-5', v2z: '6' });
    expect(e[0]).toBe('a·b = (1)(4) + (2)(-5) + (3)(6) = 4 + -10 + 18 = 12');
    expect(e[1]).toBe('|a| = √((1)² + (2)² + (3)²) = √14 = 3.741657');
    expect(e[2]).toBe('|b| = √((4)² + (-5)² + (6)²) = √77 = 8.774964');
    expect(e[3]).toBe('cos θ = 12 ÷ (3.741657 × 8.774964) = 0.365487  →  θ = 68.562447°');
  });
  it('perpendicular vectors add a note', () => {
    const s = steps(dotProduct, { v1x: '1', v1y: '0', v1z: '', v2x: '0', v2y: '1', v2z: '' });
    expect(s[0].expr).toBe('a·b = (1)(0) + (0)(1) = 0 + 0 = 0');
    expect(s[0].note).toContain('perpendicular');
  });
  it('a zero vector has no angle step', () => {
    expect(steps(dotProduct, { v1x: '0', v1y: '0', v1z: '', v2x: '5', v2y: '6', v2z: '' })).toHaveLength(3);
  });
  it('blank components return []', () => {
    expect(steps(dotProduct, { v1x: '', v1y: '3', v1z: '', v2x: '5', v2y: '6', v2z: '' })).toEqual([]);
  });
});

describe('cross-product', () => {
  it('(1, 2, 3) x (4, 5, 6) = (-3, 6, -3), length 7.348469', () => {
    expect(exprs(crossProduct, { v1x: '1', v1y: '2', v1z: '3', v2x: '4', v2y: '5', v2z: '6' })).toEqual([
      'c₁ = (2)(6) − (3)(5) = -3',
      'c₂ = (3)(4) − (1)(6) = 6',
      'c₃ = (1)(5) − (2)(4) = -3',
      'a × b = (-3, 6, -3),  |a × b| = 7.348469',
    ]);
  });
  it('parallel vectors give the zero vector and say so', () => {
    const s = steps(crossProduct, { v1x: '1', v1y: '2', v1z: '3', v2x: '2', v2y: '4', v2z: '6' });
    expect(s.at(-1)!.expr).toBe('a × b = (0, 0, 0),  |a × b| = 0');
    expect(s.at(-1)!.note).toContain('parallel');
  });
  it('unit vectors: i x j = k', () => {
    expect(exprs(crossProduct, { v1x: '1', v1y: '0', v1z: '0', v2x: '0', v2y: '1', v2z: '0' }).at(-1)).toBe('a × b = (0, 0, 1),  |a × b| = 1');
  });
  it('blank components return []', () => {
    expect(steps(crossProduct, { v1x: '1', v1y: '2', v1z: '', v2x: '4', v2y: '5', v2z: '6' })).toEqual([]);
  });
});

describe('log', () => {
  const l = (base: string, value: string) => exprs(log, { base, value });
  it('log2(8) = 3 is an exact power', () => {
    expect(l('2', '8')).toEqual(['log_2(8) = ?   means   2^? = 8', '2^3 = 8', 'log_2(8) = 3']);
  });
  it('log10(1000) = 3 and log2(0.5) = -1', () => {
    expect(l('10', '1000').at(-1)).toBe('log_10(1000) = 3');
    expect(l('2', '0.5').at(-1)).toBe('log_2(0.5) = -1');
  });
  it('log10(2) = 0.30103 by change of base: ln 2 = 0.6931471806, ln 10 = 2.302585093', () => {
    expect(l('10', '2')).toEqual([
      'log_10(2) = ?   means   10^? = 2',
      'log_10(2) = ln(2) ÷ ln(10) = 0.6931471806 ÷ 2.302585093',
      'log_10(2) = 0.3010299957',
    ]);
  });
  it('log2(10) = 3.321928095', () => {
    expect(l('2', '10').at(-1)).toBe('log_2(10) = 3.321928095');
  });
  it('invalid bases and non-positive numbers return []', () => {
    expect(l('1', '5')).toEqual([]);
    expect(l('-2', '5')).toEqual([]);
    expect(l('2', '0')).toEqual([]);
    expect(l('2', '-8')).toEqual([]);
    expect(l('', '8')).toEqual([]);
  });
});

describe('fraction-to-decimal', () => {
  it('3/8 = 0.375 = 37.5%', () => {
    expect(exprs(fractionToDecimal, { mode: 'ftod', numerator: '3', denominator: '8' })).toEqual([
      '3 ÷ 8 = 0.375',
      '0.375 × 100 = 37.5%',
    ]);
  });
  it('1/3 repeats with period 1', () => {
    const s = steps(fractionToDecimal, { mode: 'ftod', numerator: '1', denominator: '3' });
    expect(s[0].expr).toBe('1 ÷ 3 = 0.(3)');
    expect(s[0].note).toBe('Repeating, period 1.');
    expect(s[1].expr).toBe('0.3333333333 × 100 = 33.3333%');
  });
  it('1/7 repeats with period 6', () => {
    const s = steps(fractionToDecimal, { mode: 'ftod', numerator: '1', denominator: '7' });
    expect(s[0].expr).toBe('1 ÷ 7 = 0.(142857)');
    expect(s[0].note).toBe('Repeating, period 6.');
  });
  it('mixed 2 3/4 = 11/4 = 2.75', () => {
    expect(exprs(fractionToDecimal, { mode: 'mixed', wholeNumber: '2', numerator: '3', denominator: '4' })).toEqual([
      '2 3/4 = (2 × 4 + 3) ÷ 4 = 11/4',
      '11 ÷ 4 = 2.75',
      '2.75 × 100 = 275%',
    ]);
  });
  it('mixed with a negative whole number keeps the sign outside', () => {
    expect(exprs(fractionToDecimal, { mode: 'mixed', wholeNumber: '-2', numerator: '3', denominator: '4' })[0]).toBe('-2 3/4 = −(2 × 4 + 3) ÷ 4 = -11/4');
  });
  it('decimal 0.75 = 75/100 = 3/4 and -0.125 = -1/8', () => {
    expect(exprs(fractionToDecimal, { mode: 'dtof', decimal: '0.75' })).toEqual([
      '0.75 = 75/100',
      '75/100 = 3/4',
    ]);
    expect(exprs(fractionToDecimal, { mode: 'dtof', decimal: '-0.125' })).toEqual(['-0.125 = -125/1000', '-125/1000 = -1/8']);
  });
  it('decimal 2.5 adds the mixed number', () => {
    const e = exprs(fractionToDecimal, { mode: 'dtof', decimal: '2.5' });
    expect(e[1]).toBe('25/10 = 5/2');
    expect(e[2]).toBe('5/2 = 2 1/2');
  });
  it('zero denominator, whole-number decimals and blanks return []', () => {
    expect(steps(fractionToDecimal, { mode: 'ftod', numerator: '1', denominator: '0' })).toEqual([]);
    expect(steps(fractionToDecimal, { mode: 'dtof', decimal: '5' })).toEqual([]);
    expect(steps(fractionToDecimal, { mode: 'ftod', numerator: '', denominator: '3' })).toEqual([]);
  });
});

describe('volume-surface', () => {
  it('sphere r = 5: V = 523.598776, SA = 314.159265', () => {
    expect(exprs(volumeSurface, { shape: 'sphere', dim1: '5' })).toEqual([
      'V = 4/3 × π × r³ = 4/3 × π × 5³ = 523.598776',
      'SA = 4 × π × r² = 4 × π × 5² = 314.159265',
      'd = 2r = 2 × 5 = 10',
    ]);
  });
  it('cube s = 3: V = 27, SA = 54, diagonal 5.196152', () => {
    expect(exprs(volumeSurface, { shape: 'cube', dim1: '3' })).toEqual([
      'V = s³ = 3³ = 27',
      'SA = 6s² = 6 × 3² = 54',
      'd = s√3 = 3 × √3 = 5.196152',
    ]);
  });
  it('cylinder r = 3, h = 5: V = 141.371669, lateral 94.24778, total 150.796447', () => {
    expect(exprs(volumeSurface, { shape: 'cylinder', dim1: '3', dim2: '5' })).toEqual([
      'V = πr²h = π × 3² × 5 = 141.371669',
      '2πrh = 2 × π × 3 × 5 = 94.24778',
      'SA = 2πr² + 2πrh = 2 × π × 3² + 94.24778 = 150.796447',
    ]);
  });
  it('cone r = 3, h = 4: slant 5, V = 37.699112, SA = 75.398224', () => {
    expect(exprs(volumeSurface, { shape: 'cone', dim1: '3', dim2: '4' })).toEqual([
      's = √(r² + h²) = √(3² + 4²) = 5',
      'V = ⅓πr²h = ⅓ × π × 3² × 4 = 37.699112',
      'SA = πr² + πrs = π × 3² + π × 3 × 5 = 75.398224',
    ]);
  });
  it('box 2 x 3 x 4: V = 24, SA = 52, diagonal 5.385165', () => {
    expect(exprs(volumeSurface, { shape: 'box', dim1: '2', dim2: '3', dim3: '4' })).toEqual([
      'V = l × w × h = 2 × 3 × 4 = 24',
      'SA = 2(lw + lh + wh) = 2 × (2×3 + 2×4 + 3×4) = 52',
      'd = √(l² + w² + h²) = √(2² + 3² + 4²) = 5.385165',
    ]);
  });
  it('pyramid b = 6, h = 4: slant 5, V = 48, SA = 96', () => {
    expect(exprs(volumeSurface, { shape: 'pyramid', dim1: '6', dim2: '4' })).toEqual([
      's = √((b/2)² + h²) = √((6/2)² + 4²) = 5',
      'V = ⅓b²h = ⅓ × 6² × 4 = 48',
      'SA = b² + 2bs = 6² + 2 × 6 × 5 = 96',
    ]);
  });
  it('zero, negative and blank dimensions return []', () => {
    expect(steps(volumeSurface, { shape: 'sphere', dim1: '0' })).toEqual([]);
    expect(steps(volumeSurface, { shape: 'cylinder', dim1: '3', dim2: '' })).toEqual([]);
    expect(steps(volumeSurface, { shape: 'cube', dim1: '-2' })).toEqual([]);
  });
});

describe('triangle', () => {
  it('SSS 3-4-5: right scalene, perimeter 12, area 6', () => {
    const e = exprs(triangle, { mode: 'sss', angleUnit: 'deg', sideA: '3', sideB: '4', sideC: '5' });
    expect(e[0]).toBe('a = 3,  b = 4,  c = 5;  A = 36.86989765°,  B = 53.13010235°,  C = 90°');
    expect(e[1]).toBe('A + B + C = 36.86989765° + 53.13010235° + 90° ≈ 180°');
    expect(e[2]).toBe('P = a + b + c = 3 + 4 + 5 = 12');
    expect(e[3]).toBe('Area = ½ × b × c × sin A = ½ × 4 × 5 × sin(36.86989765°) = 6 sq units');
    expect(e[4]).toBe('Scalene Right');
  });
  it('SAS 5, 60 degrees, 6 uses the Law of Cosines for the third side', () => {
    const s = steps(triangle, { mode: 'sas', angleUnit: 'deg', sasSideB: '6', sasAngleA: '60', sasSideC: '5' });
    expect(s[0].label).toBe('Law of Cosines for the third side, then the remaining angles');
    expect(s[0].expr).toContain('a = 5.56776436');
    expect(s[0].expr).toContain('A = 60°');
  });
  it('ASA 45 / 7 / 60 degrees: third angle 75', () => {
    const s = steps(triangle, { mode: 'asa', angleUnit: 'deg', asaAngleA: '45', asaSideC: '7', asaAngleB: '60' });
    expect(s[0].label).toContain('Third angle = 180° − A − B');
    expect(s[0].expr).toContain('C = 75°');
  });
  it('impossible triangles and blank input return []', () => {
    expect(steps(triangle, { mode: 'sss', angleUnit: 'deg', sideA: '1', sideB: '2', sideC: '10' })).toEqual([]);
    expect(steps(triangle, { mode: 'asa', angleUnit: 'deg', asaAngleA: '100', asaSideC: '7', asaAngleB: '90' })).toEqual([]);
    expect(steps(triangle, { mode: 'sss', angleUnit: 'deg', sideA: '3', sideB: '', sideC: '5' })).toEqual([]);
  });
});
