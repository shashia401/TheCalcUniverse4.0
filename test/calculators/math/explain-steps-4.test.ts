import { describe, it, expect } from 'vitest';
import type { CalculatorConfig, ExplainStep } from '../../../src/types/calculator';
import longDivision from '../../../src/calculators/math/long-division';
import matrix from '../../../src/calculators/math/matrix';
import mileage from '../../../src/calculators/math/mileage-reimbursement';
import molarity from '../../../src/calculators/math/molarity';
import molecularWeight from '../../../src/calculators/math/molecular-weight';
import numberSequence from '../../../src/calculators/math/number-sequence';
import pValue from '../../../src/calculators/math/p-value';
import primeNumber from '../../../src/calculators/math/prime-number';
import probability from '../../../src/calculators/math/probability';
import resistor from '../../../src/calculators/math/resistor';
import romanNumeral from '../../../src/calculators/math/roman-numeral';
import roofing from '../../../src/calculators/math/roofing';
import rounding from '../../../src/calculators/math/rounding';
import sampleSize from '../../../src/calculators/math/sample-size';
import series from '../../../src/calculators/math/series';
import sleep from '../../../src/calculators/math/sleep';
import speed from '../../../src/calculators/math/speed';
import stair from '../../../src/calculators/math/stair';
import statistics from '../../../src/calculators/math/statistics';
import systemOfEquations from '../../../src/calculators/math/system-of-equations';
import taylorSeries from '../../../src/calculators/math/taylor-series';
import testScore from '../../../src/calculators/math/test-score';
import time from '../../../src/calculators/math/time';
import timeCard from '../../../src/calculators/math/time-card';
import timeDuration from '../../../src/calculators/math/time-duration';
import trigonometry from '../../../src/calculators/math/trigonometry-calculator';
import unitCircle from '../../../src/calculators/math/unit-circle';
import vectorCalculator from '../../../src/calculators/math/vector-calculator';
import weight from '../../../src/calculators/math/weight';
import windChill from '../../../src/calculators/math/wind-chill';
import mass from '../../../src/calculators/math/mass';
import phCalculator from '../../../src/calculators/math/ph-calculator';
import tile from '../../../src/calculators/math/tile';
import derivative from '../../../src/calculators/math/derivative-calculator';
import integral from '../../../src/calculators/math/integral-calculator';
import limit from '../../../src/calculators/math/limit-calculator';
import polynomial from '../../../src/calculators/math/polynomial-calculator';
import date from '../../../src/calculators/math/date';
import dayCounter from '../../../src/calculators/math/day-counter';
import dayOfWeek from '../../../src/calculators/math/day-of-week';
import { buildDemoValues } from '../../helpers';

// Every number asserted below was computed independently in Python (math / decimal / statistics / scipy.stats / datetime),
// not by running the calculators; the strings are what the worked solution prints for those inputs.

type V = Record<string, string>;
const steps = (c: CalculatorConfig, v: V): ExplainStep[] => c.explainSteps!(v);
const exprs = (c: CalculatorConfig, v: V) => steps(c, v).map((s) => s.expr);
const demo = (c: CalculatorConfig) => buildDemoValues(c.inputs);

describe('explainSteps (batch 4) - every calculator returns steps for its demo values and [] for empty input', () => {
  const all: [string, CalculatorConfig][] = [
    ['long-division', longDivision],
    ['matrix', matrix],
    ['mileage-reimbursement', mileage],
    ['molarity', molarity],
    ['molecular-weight', molecularWeight],
    ['number-sequence', numberSequence],
    ['p-value', pValue],
    ['prime-number', primeNumber],
    ['probability', probability],
    ['resistor', resistor],
    ['roman-numeral', romanNumeral],
    ['roofing', roofing],
    ['rounding', rounding],
    ['sample-size', sampleSize],
    ['series', series],
    ['sleep', sleep],
    ['speed', speed],
    ['stair', stair],
    ['statistics', statistics],
    ['system-of-equations', systemOfEquations],
    ['taylor-series', taylorSeries],
    ['test-score', testScore],
    ['time', time],
    ['time-card', timeCard],
    ['time-duration', timeDuration],
    ['trigonometry-calculator', trigonometry],
    ['unit-circle', unitCircle],
    ['vector-calculator', vectorCalculator],
    ['weight', weight],
    ['wind-chill', windChill],
    ['mass', mass],
    ['ph-calculator', phCalculator],
    ['tile', tile],
    ['derivative-calculator', derivative],
    ['integral-calculator', integral],
    ['limit-calculator', limit],
    ['polynomial-calculator', polynomial],
    ['date', date],
    ['day-counter', dayCounter],
    ['day-of-week', dayOfWeek],
  ];
  for (const [name, c] of all) {
    it(name, () => {
      const v = demo(c);
      const rows = c.calculate(v);
      // taylor-series uses an 'error' row id for the approximation error, which is a real answer; the time-card demo
      // line is unreadable, so it has nothing to work through
      const answered = rows.length > 0 && (name === 'taylor-series' || !rows.some((r) => r.id === 'error')) && (name !== 'time-card' || rows.some((r) => r.id === 'totalHours'));
      if (answered) {
        const s = steps(c, v);
        expect(s.length).toBeGreaterThanOrEqual(1);
        expect(s.length).toBeLessThanOrEqual(12);
        for (const st of s) {
          expect(st.label.length).toBeGreaterThan(0);
          expect(st.expr.length).toBeGreaterThan(0);
          expect(`${st.label} ${st.expr} ${st.note ?? ''}`).not.toMatch(/NaN|Infinity|undefined/);
        }
      }
      expect(steps(c, {})).toEqual([]);
    });
  }
});

describe('long-division', () => {
  it('4876 ÷ 12 = 406 r 4, repeating 406.(3)', () => {
    expect(exprs(longDivision, { dividend: '4876', divisor: '12' })).toEqual([
      '4 ÷ 12 = 0 r 4 → 48 ÷ 12 = 4 r 0 → 7 ÷ 12 = 0 r 7 → 76 ÷ 12 = 6 r 4',
      '4876 ÷ 12 = 406 remainder 4',
      '406 × 12 + 4 = 4876',
      '4876 ÷ 12 = 406.(3)',
    ]);
  });
  it('1 ÷ 7 repeats every 6 digits', () => {
    expect(exprs(longDivision, { dividend: '1', divisor: '7' }).at(-1)).toBe('1 ÷ 7 = 0.(142857)');
  });
  it('10 ÷ 4 terminates at 2.5', () => {
    const s = steps(longDivision, { dividend: '10', divisor: '4' });
    expect(s.at(-1)!.expr).toBe('10 ÷ 4 = 2.5');
    expect(s.at(-1)!.note).toContain('decimal ends');
  });
  it('-17 ÷ 5 truncates toward zero: -3 remainder -2', () => {
    const s = steps(longDivision, { dividend: '-17', divisor: '5' });
    expect(s[1].expr).toBe('-17 ÷ 5 = -3 remainder -2');
    expect(s[1].note).toContain('sign of the dividend');
  });
  it('divisor 0, decimals and blanks give no steps', () => {
    expect(steps(longDivision, { dividend: '10', divisor: '0' })).toEqual([]);
    expect(steps(longDivision, { dividend: '1.5', divisor: '2' })).toEqual([]);
    expect(steps(longDivision, { dividend: '10', divisor: '' })).toEqual([]);
  });
});

describe('matrix', () => {
  it('2x2 determinant: 1·4 − 2·3 = −2', () => {
    expect(exprs(matrix, { size: '2', operation: 'determinant', matrixA: '1 2\n3 4' })).toEqual([
      'det(A) = 1×4 − 2×3 = 4 − 6 = -2',
      'det(A) = -2 ≠ 0, so A is invertible',
    ]);
  });
  it('3x3 determinant by the first-row minors: 10, 4, 1 → 24', () => {
    expect(exprs(matrix, { size: '3', operation: 'determinant', matrixA: '2 -1 0\n1 3 2\n0 1 4' })).toEqual([
      'M₁ = e·i − f·h = 10,  M₂ = d·i − f·g = 4,  M₃ = d·h − e·g = 1',
      'det(A) = 2×10 − (-1)×4 + 0×1 = 24',
      'det(A) = 24 ≠ 0, so A is invertible',
    ]);
  });
  it('4x4 determinant = 30 (numpy)', () => {
    expect(exprs(matrix, { size: '4', operation: 'determinant', matrixA: '1 0 2 -1\n3 0 0 5\n2 1 4 -3\n1 0 5 0' })[0]).toBe('det(A) = ± (product of the diagonal pivots) = 30');
  });
  it('2x2 inverse of [[4,7],[2,6]]: det 10, inverse [[0.6,−0.7],[−0.2,0.4]]', () => {
    expect(exprs(matrix, { size: '2', operation: 'inverse', matrixA: '4 7\n2 6' })).toEqual(['det(A) = 10', 'A⁻¹ = 1/10 × [6 -7 | -2 4]', '0.6 -0.7 | -0.2 0.4']);
  });
  it('3x3 diagonal inverse: 1/2, 1/4, 1/5, det 40', () => {
    expect(exprs(matrix, { size: '3', operation: 'inverse', matrixA: '2 0 0\n0 4 0\n0 0 5' })).toEqual(['det(A) = 40', 'A⁻¹ = 0.5 0 0 | 0 0.25 0 | 0 0 0.2']);
  });
  it('inverse of [[1,2],[3,4]] shows 1/(-2) and −2 1 | 1.5 −0.5', () => {
    const e = exprs(matrix, { size: '2', operation: 'inverse', matrixA: '1 2\n3 4' });
    expect(e[1]).toBe('A⁻¹ = 1/(-2) × [4 -2 | -3 1]');
    expect(e[2]).toBe('-2 1 | 1.5 -0.5');
  });
  it('singular matrix has no inverse', () => {
    expect(exprs(matrix, { size: '2', operation: 'inverse', matrixA: '1 2\n2 4' })).toEqual(['det(A) = 0', 'det(A) = 0, so A has no inverse']);
  });
  it('rank of [[1,2],[2,4]] is 1, nullity 1', () => {
    expect(exprs(matrix, { size: '2', operation: 'rank', matrixA: '1 2\n2 4' })).toEqual(['1 2 | 0 0', 'rank = 1', 'nullity = 2 − 1 = 1']);
  });
  it('wrong shape or blank gives no steps', () => {
    expect(steps(matrix, { size: '3', operation: 'determinant', matrixA: '1 2\n3 4' })).toEqual([]);
    expect(steps(matrix, { size: '2', operation: 'determinant', matrixA: '1 x\n3 4' })).toEqual([]);
    expect(steps(matrix, { size: '2', operation: 'determinant', matrixA: '' })).toEqual([]);
  });
});

describe('mileage-reimbursement', () => {
  it('100 business miles in 2025 at 0.70 plus $12.50', () => {
    expect(exprs(mileage, { miles: '100', mileageType: 'business', year: '2025', additionalExpenses: '12.50' })).toEqual([
      '2025: $0.70/mi',
      '100 mi × $0.70 = $70',
      '$70 + $12.50 = $82.50',
    ]);
  });
  it('250 charitable miles at 0.14 = $35, no extras step', () => {
    expect(exprs(mileage, { miles: '250', mileageType: 'charitable', year: '2025' })).toEqual(['2025: $0.14/mi', '250 mi × $0.14 = $35']);
  });
  it('blank or negative miles give no steps', () => {
    expect(steps(mileage, { miles: '', mileageType: 'business', year: '2025' })).toEqual([]);
    expect(steps(mileage, { miles: '-5', mileageType: 'business', year: '2025' })).toEqual([]);
  });
});

describe('molarity', () => {
  it('5.84 g NaCl in 1 L: n = 0.099932 mol, M = 0.0999 mol/L', () => {
    expect(exprs(molarity, { mode: 'calcMolarity', compound: 'NaCl', mass: '5.84', volume: '1', volumeUnit: 'L' })).toEqual([
      'n = m / MM = 5.8400 g / 58.4400 g/mol = 0.099932 mol',
      'M = n / V = 0.099932 mol / 1.000000 L = 0.0999 mol/L',
    ]);
  });
  it('0.1 M in 250 mL of NaCl: 0.025 mol and 1.4610 g', () => {
    expect(exprs(molarity, { mode: 'calcMass', compound: 'NaCl', volume: '250', volumeUnit: 'mL', molarity: '0.1' })).toEqual([
      '250 mL = 0.250000 L',
      'n = M × V = 0.1000 mol/L × 0.250000 L = 0.025000 mol',
      'm = n × MM = 0.025000 mol × 58.4400 g/mol = 1.4610 g',
    ]);
  });
  it('8 g NaOH at 0.5 M: 0.2 mol in 0.4 L', () => {
    expect(exprs(molarity, { mode: 'calcVolume', compound: 'NaOH', mass: '8', molarity: '0.5' })).toEqual([
      'n = m / MM = 8.0000 g / 40.0000 g/mol = 0.200000 mol',
      'V = n / M = 0.200000 mol / 0.5000 mol/L = 0.400000 L',
    ]);
  });
  it('typed molar mass with mL volume', () => {
    expect(exprs(molarity, { mode: 'calcMolarity', compound: '', molarMass: '58.44', mass: '11.688', volume: '500', volumeUnit: 'mL' })[2]).toBe(
      'M = n / V = 0.200000 mol / 0.500000 L = 0.4000 mol/L',
    );
  });
  it('unknown compound without a molar mass gives no steps', () => {
    expect(steps(molarity, { mode: 'calcMolarity', compound: 'Zzz9', mass: '5', volume: '1' })).toEqual([]);
  });
});

describe('molecular-weight', () => {
  it('H2O = 18.015', () => {
    expect(exprs(molecularWeight, { formula: 'H2O' })).toEqual(['H × 2,  O × 1', 'H: 2 × 1.008 = 2.016;  O: 1 × 15.999 = 15.999', '2.016 + 15.999 = 18.015 g/mol']);
  });
  it('glucose C6H12O6 = 180.156', () => {
    expect(exprs(molecularWeight, { formula: 'C6H12O6' })).toEqual([
      'C × 6,  H × 12,  O × 6',
      'C: 6 × 12.011 = 72.066;  H: 12 × 1.008 = 12.096;  O: 6 × 15.999 = 95.994',
      '72.066 + 12.096 + 95.994 = 180.156 g/mol',
    ]);
  });
  it('hydrate CuSO4·5H2O = 249.682 and mentions the added water', () => {
    const s = steps(molecularWeight, { formula: 'CuSO4·5H2O' });
    expect(s[0].expr).toBe('Cu × 1,  S × 1,  O × 9,  H × 10');
    expect(s[0].note).toContain('5 H₂O');
    expect(s[2].expr).toBe('63.546 + 32.065 + 143.991 + 10.080 = 249.682 g/mol');
  });
  it('an unknown element gives no steps', () => {
    expect(steps(molecularWeight, { formula: 'Xx2' })).toEqual([]);
  });
});

describe('number-sequence', () => {
  it('arithmetic 2, 4, 6, 8 → 10, 12, 14', () => {
    expect(exprs(numberSequence, { sequence: '2, 4, 6, 8', nextCount: '3' })).toEqual([
      'Common difference d = 4 − 2 = 2',
      'Verified: all consecutive differences equal 2.',
      'nth-term formula: a(n) = 2 + (n − 1) × 2',
      'a(n) = 2 + 2(n − 1) = 2n',
      '10, 12, 14',
    ]);
  });
  it('geometric 3, 6, 12, 24 → 48, 96', () => {
    expect(exprs(numberSequence, { sequence: '3 6 12 24', nextCount: '2' })).toEqual([
      'Common ratio r = 6 ÷ 3 = 2',
      'Verified: all consecutive ratios equal 2.',
      'nth-term formula: a(n) = 3 × 2^(n − 1)',
      '48, 96',
    ]);
  });
  it('Fibonacci-type 1 1 2 3 5 8 → 13, 21, 34', () => {
    const e = exprs(numberSequence, { sequence: '1 1 2 3 5 8', nextCount: '3' });
    expect(e.at(-1)).toBe('13, 21, 34');
    expect(e).toContain('5 + 3 = 8, confirming Fibonacci pattern.');
  });
  it('no pattern, too few terms or junk give no steps', () => {
    expect(steps(numberSequence, { sequence: '1 2 4 9', nextCount: '3' })).toEqual([]);
    expect(steps(numberSequence, { sequence: '5', nextCount: '3' })).toEqual([]);
    expect(steps(numberSequence, { sequence: '1 two 3', nextCount: '3' })).toEqual([]);
  });
});

describe('p-value', () => {
  it('z = 1.96 two-tailed: p = 0.0499958 < 0.05, critical ±1.960', () => {
    expect(exprs(pValue, { testType: 'z', score: '1.96', alpha: '0.05', tails: 'two' })).toEqual([
      'Standard Normal (Z);  statistic = 1.96;  Two-tailed (non-directional)',
      'p = 0.0499958',
      'Critical Value (two-tailed) = ±1.960',
      'p = 0.0499958 < α = 0.05  →  Reject the null hypothesis H₀',
    ]);
  });
  it('t = 2.1, df 15, upper tail: p = 0.0265276, critical 1.753', () => {
    const e = exprs(pValue, { testType: 't', score: '2.1', df: '15', alpha: '0.05', tails: 'one' });
    expect(e[1]).toBe('p = 0.0265276');
    expect(e[2]).toBe('Critical Value (one-tailed) = 1.753');
    expect(e[3]).toBe('p = 0.0265276 < α = 0.05  →  Reject the null hypothesis H₀');
  });
  it('chi-square 3.84, df 1: p = 0.0500435 ≥ 0.05 so fail to reject; critical 3.841', () => {
    const e = exprs(pValue, { testType: 'chisq', score: '3.84', df: '1', alpha: '0.05', tails: 'one' });
    expect(e[1]).toBe('p = 0.0500435');
    expect(e[2]).toBe('Critical Value (one-tailed) = 3.841');
    expect(e[3]).toBe('p = 0.0500435 ≥ α = 0.05  →  Fail to reject the null hypothesis H₀');
  });
  it('missing statistic, missing df or a negative chi-square give no steps', () => {
    expect(steps(pValue, { testType: 'z', score: '', alpha: '0.05', tails: 'two' })).toEqual([]);
    expect(steps(pValue, { testType: 't', score: '2', alpha: '0.05', tails: 'two' })).toEqual([]);
    expect(steps(pValue, { testType: 'chisq', score: '-1', df: '2', alpha: '0.05', tails: 'one' })).toEqual([]);
  });
});

describe('prime-number', () => {
  it('97 is prime: √97 ≈ 9.849, no divisor to 9, 2 divisors', () => {
    expect(exprs(primeNumber, { n: '97' })).toEqual(['√97 ≈ 9.849, so test 2 up to 9', 'No whole number from 2 to 9 divides 97, so 97 is prime', 'Only 1 and 97  →  2 divisors']);
  });
  it('360 = 2^3 × 3^2 × 5 has (3+1)(2+1)(1+1) = 24 divisors', () => {
    expect(exprs(primeNumber, { n: '360' })).toEqual([
      '√360 ≈ 18.974, so test 2 up to 18',
      '360 ÷ 2 = 180, so 360 is composite',
      '360 = 2^3 × 3^2 × 5',
      '(3+1) × (2+1) × (1+1) = 24',
    ]);
  });
  it('91 = 7 × 13 is composite with 4 divisors', () => {
    expect(exprs(primeNumber, { n: '91' })).toEqual(['√91 ≈ 9.539, so test 2 up to 9', '91 ÷ 7 = 13, so 91 is composite', '91 = 7 × 13', '(1+1) × (1+1) = 4']);
  });
  it('1 is neither prime nor composite; 2 is prime', () => {
    expect(exprs(primeNumber, { n: '1' })[0]).toContain('neither prime nor composite');
    expect(exprs(primeNumber, { n: '2' })).toEqual(['2 has no divisor other than 1 and itself, so it is prime', 'Only 1 and 2  →  2 divisors']);
  });
  it('0, negatives, decimals and text give no steps', () => {
    for (const n of ['0', '-7', '3.5', 'abc']) expect(steps(primeNumber, { n })).toEqual([]);
  });
});

describe('probability', () => {
  it('independent 0.3 and 0.4: AND 0.12, OR 0.58', () => {
    expect(exprs(probability, { pa: '0.3', pb: '0.4', type: 'Independent' })).toEqual([
      'P(A ∩ B) = P(A) × P(B) = 0.3 × 0.4 = 0.12',
      'P(A ∪ B) = P(A) + P(B) − P(A ∩ B) = 0.3 + 0.4 − 0.12 = 0.58',
      'P(¬A) = 1 − 0.3 = 0.7;  P(¬B) = 1 − 0.4 = 0.6',
      'P(A|B) = 0.12 ÷ 0.4 = 0.3;  P(B|A) = 0.12 ÷ 0.3 = 0.4',
    ]);
  });
  it('mutually exclusive 0.3 and 0.4: AND 0, OR 0.7', () => {
    const e = exprs(probability, { pa: '0.3', pb: '0.4', type: 'Mutually Exclusive' });
    expect(e[0]).toBe('P(A ∩ B) = 0');
    expect(e[1]).toBe('P(A ∪ B) = P(A) + P(B) − P(A ∩ B) = 0.3 + 0.4 − 0 = 0.7');
  });
  it('impossible mutually exclusive pair and out-of-range probabilities give no steps', () => {
    expect(steps(probability, { pa: '0.7', pb: '0.6', type: 'Mutually Exclusive' })).toEqual([]);
    expect(steps(probability, { pa: '1.2', pb: '0.5', type: 'Independent' })).toEqual([]);
  });
});

describe('resistor', () => {
  it('forward Orange-Orange-Brown-Gold = 330 Ω ±5% (313.5 to 346.5)', () => {
    expect(exprs(resistor, { mode: 'forward', bands: '4', band1: 'Orange', band2: 'Orange', multiplier: 'Brown', tolerance: 'Gold (±5%)' })).toEqual([
      'Orange = 3,  Orange = 3  →  33',
      '33 × 10^1 (Brown) = 330 Ω',
      '±5%  →  313.50 Ω to 346.50 Ω',
    ]);
  });
  it('forward 6-band Brown-Black-Black-Orange: 100 kΩ ±1% = 99 to 101 kΩ, 50 ppm/K', () => {
    expect(exprs(resistor, { mode: 'forward', bands: '6', band1: 'Brown', band2: 'Black', band3: 'Black', multiplier: 'Orange', tolerance: 'Brown (±1%)', tempCo: 'Red (50)' })).toEqual([
      'Brown = 1,  Black = 0,  Black = 0  →  100',
      '100 × 10^3 (Orange) = 100000 Ω',
      '±1%  →  99.00 kΩ to 101.00 kΩ',
      '50 ppm/K',
    ]);
  });
  it('reverse 4700 Ω is the E12 value 47 x 10^2: Yellow-Violet-Red-Silver', () => {
    expect(exprs(resistor, { mode: 'reverse', targetOhms: '4700', reverseBands: '4' })).toEqual(['4.70 kΩ → E12 series: 47 (4.70 kΩ)', 'Yellow – Violet – Red – Silver']);
  });
  it('reverse 4500 Ω snaps to 4700 Ω, 4.4% above', () => {
    const s = steps(resistor, { mode: 'reverse', targetOhms: '4500', reverseBands: '4' });
    expect(s[0].expr).toBe('4.50 kΩ → E12 series: 47 (4.70 kΩ)');
    expect(s[0].note).toBe('4.70 kΩ is 4.4% above your value');
  });
  it('missing bands, zero ohms and out-of-range ohms give no steps', () => {
    expect(steps(resistor, { mode: 'forward', bands: '4', band1: 'Red' })).toEqual([]);
    expect(steps(resistor, { mode: 'reverse', targetOhms: '0', reverseBands: '4' })).toEqual([]);
    expect(steps(resistor, { mode: 'reverse', targetOhms: '1e15', reverseBands: '4' })).toEqual([]);
  });
});

describe('roman-numeral', () => {
  it('2024 = MMXXIV', () => {
    const s = steps(romanNumeral, { mode: 'toRoman', number: '2024' });
    expect(s.map((x) => x.expr)).toEqual(['2024 = 2×1000 + 2×10 + 4', '2×1000 → MM,  2×10 → XX,  4 → IV', 'MM + XX + IV = MMXXIV']);
    expect(s[1].note).toContain('subtractive');
  });
  it('3999 = MMMCMXCIX', () => {
    expect(exprs(romanNumeral, { mode: 'toRoman', number: '3999' })).toEqual(['3999 = 3×1000 + 900 + 90 + 9', '3×1000 → MMM,  900 → CM,  90 → XC,  9 → IX', 'MMM + CM + XC + IX = MMMCMXCIX']);
  });
  it('XLII = 42 with the subtractive X before L', () => {
    expect(exprs(romanNumeral, { mode: 'fromRoman', romanInput: 'XLII' })).toEqual([
      'X = 10, L = 50, I = 1, I = 1',
      '−10 + 50 + 1 + 1 = 42',
      'Valid Roman Numeral: Yes',
    ]);
  });
  it('IIII is read as 4 but flagged, with the standard IV', () => {
    expect(exprs(romanNumeral, { mode: 'fromRoman', romanInput: 'IIII' }).at(-1)).toBe('Warning: Not a valid Roman numeral (standard form: IV)');
  });
  it('date 15 April 2024 in month.day.year order', () => {
    expect(exprs(romanNumeral, { mode: 'date', dateYear: '2024', dateMonth: '4', dateDay: '15', dateFormat: 'mdy' })).toEqual(['2024 = MMXXIV,  4 = IV,  15 = XV', 'IV.XV.MMXXIV']);
  });
  it('0, 4000, letters outside the Roman set and Feb 30 give no steps', () => {
    expect(steps(romanNumeral, { mode: 'toRoman', number: '0' })).toEqual([]);
    expect(steps(romanNumeral, { mode: 'toRoman', number: '4000' })).toEqual([]);
    expect(steps(romanNumeral, { mode: 'fromRoman', romanInput: 'ABC' })).toEqual([]);
    expect(steps(romanNumeral, { mode: 'date', dateYear: '2024', dateMonth: '2', dateDay: '30', dateFormat: 'mdy' })).toEqual([]);
  });
});

describe('roofing', () => {
  it('40 x 30 ft gable at 6/12, 1 ft overhang, 10% waste: 1344 → 1502.6 → 1652.9 sq ft, 17 squares, 51 bundles, $2,040', () => {
    expect(exprs(roofing, { length: '40', width: '30', pitch: '6', overhang: '1', roofType: 'gable', wasteFactor: '10', pricePerSquare: '120' })).toEqual([
      '(40 + 2×1) × (30 + 2×1) = 42 × 32 = 1344 sq ft',
      '1344 sq ft × 1.118 = 1502.6 sq ft',
      '1502.6 sq ft × (1 + 10%) = 1652.9 sq ft',
      '1652.9 sq ft ÷ 100 → 17 squares',
      '17 squares × 3 = 51 bundles',
      '17 × $120 = $2,040.00',
    ]);
  });
  it('hip roof adds 5% more: 15% total, 18 squares', () => {
    const e = exprs(roofing, { length: '40', width: '30', pitch: '6', overhang: '1', roofType: 'hip', wasteFactor: '10' });
    expect(e[2]).toBe('1502.6 sq ft × (1 + 15%) = 1728 sq ft');
    expect(e[4]).toBe('18 squares × 3 = 54 bundles');
    expect(e).toHaveLength(5);
  });
  it('blank or zero sizes give no steps', () => {
    expect(steps(roofing, { length: '', width: '30', pitch: '6', roofType: 'gable' })).toEqual([]);
    expect(steps(roofing, { length: '0', width: '30', pitch: '6', roofType: 'gable' })).toEqual([]);
  });
});

describe('rounding', () => {
  it('1.005 to the hundredth is exactly halfway: 1.01 (the float trap)', () => {
    expect(exprs(rounding, { number: '1.005', place: 'hundredth', method: 'half-up' })).toEqual([
      '1 ≤ 1.005 ≤ 1.01',
      '1.005 is exactly halfway between 1 and 1.01 (the first dropped digit is 5 followed by zeros), so half away from zero gives 1.01.',
      '1.005 → 1.01',
    ]);
  });
  it("2.5 to the unit with banker's rounding is 2", () => {
    expect(exprs(rounding, { number: '2.5', place: 'unit', method: 'half-even' })).toEqual([
      '2 ≤ 2.5 ≤ 3',
      '2.5 is exactly halfway between 2 and 3 (the first dropped digit is 5 followed by zeros), so half to even gives 2.',
      '2.5 → 2',
    ]);
  });
  it('1234.567 to 3 significant figures is 1230', () => {
    expect(exprs(rounding, { number: '1234.567', place: 'sig', sigFigs: '3', method: 'half-up' })).toEqual([
      '1230 ≤ 1234.567 ≤ 1240',
      'The first dropped digit is 4, less than 5, so the value is below the midpoint 1235: it rounds to 1230.',
      '1234.567 → 1230',
    ]);
  });
  it('a number that is already exact needs no rounding', () => {
    expect(exprs(rounding, { number: '12', place: 'unit', method: 'half-up' })).toEqual(['12 already has no digits beyond the nearest unit, so it stays 12.', '12 → 12']);
  });
  it('blank, text and a bad sig-fig count give no steps', () => {
    expect(steps(rounding, { number: '', place: 'unit' })).toEqual([]);
    expect(steps(rounding, { number: 'abc', place: 'unit' })).toEqual([]);
    expect(steps(rounding, { number: '5', place: 'sig', sigFigs: '0' })).toEqual([]);
  });
});

describe('sample-size', () => {
  it('N = 10000, 95%, ±5%: n0 = 384.15 → 385, corrected 369.97 → 370', () => {
    expect(exprs(sampleSize, { population: '10000', confidence: '95', margin: '5', proportion: '50' })).toEqual([
      'Z = 1.9600  (95% confidence)',
      'n₀ = 1.9600² × 0.5 × 0.5 ÷ 0.05² = 384.15  →  385',
      'n = 384.15 ÷ (1 + (384.15 − 1) ÷ 10000) = 369.97  →  370 (rounded up)',
    ]);
  });
  it('N = 500, 99%, ±3%, blank proportion: Z 2.5758, n0 1843.03 → 1844, corrected 393.47 → 394', () => {
    expect(exprs(sampleSize, { population: '500', confidence: '99', margin: '3' })).toEqual([
      'Z = 2.5758  (99% confidence)',
      'n₀ = 2.5758² × 0.5 × 0.5 ÷ 0.03² = 1843.03  →  1844',
      'n = 1843.03 ÷ (1 + (1843.03 − 1) ÷ 500) = 393.47  →  394 (rounded up)',
    ]);
  });
  it('zero margin, fractional population and 100% proportion give no steps', () => {
    expect(steps(sampleSize, { population: '1000', confidence: '95', margin: '0' })).toEqual([]);
    expect(steps(sampleSize, { population: '1000.5', confidence: '95', margin: '5' })).toEqual([]);
    expect(steps(sampleSize, { population: '1000', confidence: '95', margin: '5', proportion: '100' })).toEqual([]);
  });
});

describe('series', () => {
  it('sum of n² for n = 1 to 10 is 385', () => {
    const s = steps(series, { start: '1', end: '10', expression: 'n^2' });
    expect(s.map((x) => x.expr)).toEqual(['f(1) = 1,  f(2) = 4,  f(3) = 9,  f(4) = 16,  f(5) = 25,  …', '1 + 4 + 9 + 16 + 25 + … = 385']);
    expect(s[1].note).toBe('10 terms');
  });
  it('2n − 5 for n = 1 to 3 sums to −3 with signs written out', () => {
    expect(exprs(series, { start: '1', end: '3', expression: '2*n - 5' })).toEqual(['f(1) = -3,  f(2) = -1,  f(3) = 1', '-3 − 1 + 1 = -3']);
  });
  it('start after end, junk expression and blanks give no steps', () => {
    expect(steps(series, { start: '5', end: '1', expression: 'n' })).toEqual([]);
    expect(steps(series, { start: '1', end: '3', expression: 'n +' })).toEqual([]);
    expect(steps(series, { start: '', end: '3', expression: 'n' })).toEqual([]);
  });
});

describe('sleep', () => {
  it('wake at 7:00 AM: 5 cycles + 14 min = 464 min back to 11:16 PM', () => {
    expect(exprs(sleep, { mode: 'wake', wakeupTime: '7:00 AM' })).toEqual([
      '5 × 90 min = 450 min (7.5 hours)',
      '450 + 14 = 464 min',
      '7:00 AM − 464 min = 11:16 PM',
      '6 cycles (9 h): 9:46 PM;  5 cycles (7.5 h): 11:16 PM;  4 cycles (6 h): 12:46 AM;  3 cycles (4.5 h): 2:16 AM',
    ]);
  });
  it('asleep at 10:30 PM: forward 464 min to 6:14 AM', () => {
    const e = exprs(sleep, { mode: 'sleep', bedtime: '10:30 PM' });
    expect(e[2]).toBe('10:30 PM + 464 min = 6:14 AM');
    expect(e[3]).toBe('6 cycles (9 h): 7:44 AM;  5 cycles (7.5 h): 6:14 AM;  4 cycles (6 h): 4:44 AM;  3 cycles (4.5 h): 3:14 AM');
  });
  it('an unreadable time gives no steps', () => {
    expect(steps(sleep, { mode: 'wake', wakeupTime: 'late' })).toEqual([]);
    expect(steps(sleep, { mode: 'sleep', bedtime: '' })).toEqual([]);
  });
});

describe('speed', () => {
  it('150 mi in 2.5 h = 60 mph with pace 1:00 per mile', () => {
    expect(exprs(speed, { mode: 'calcSpeed', distance: '150', distanceUnit: 'mi', time: '2.5', timeUnit: 'hr' })).toEqual([
      'S = D / T',
      'S = 241401.6 m ÷ 9000 s = 26.8224 m/s = 60 mph',
      '96.56064 km/h = 26.8224 m/s = 52.138575 kn',
      '1:00 min per mile, 0:37 min per km',
    ]);
  });
  it('60 mph for 2 h = 120 mi (193121.28 m)', () => {
    expect(exprs(speed, { mode: 'calcDistance', speed: '60', speedUnit: 'mph', time: '2', timeUnit: 'hr', distanceResultUnit: 'mi' })).toEqual([
      'D = S × T',
      'D = 26.8224 m/s × 7200 s = 193121.28 m = 120 mi',
    ]);
  });
  it('100 km at 50 km/h = 7200 s = 120 minutes', () => {
    expect(exprs(speed, { mode: 'calcTime', distance: '100', distanceUnit: 'km', speed: '50', speedUnit: 'kmh', timeResultUnit: 'min' })[1]).toBe(
      'T = 100000 m ÷ 13.888889 m/s = 7200 s = 120 minutes',
    );
  });
  it('zero time, zero speed and blanks give no steps', () => {
    expect(steps(speed, { mode: 'calcSpeed', distance: '10', distanceUnit: 'mi', time: '0', timeUnit: 'hr' })).toEqual([]);
    expect(steps(speed, { mode: 'calcTime', distance: '10', distanceUnit: 'mi', speed: '0', speedUnit: 'mph', timeResultUnit: 'hr' })).toEqual([]);
    expect(steps(speed, { mode: 'calcSpeed', distance: '', time: '2' })).toEqual([]);
  });
});

describe('stair', () => {
  it('108 in rise, 7 in riser, 10 in tread: 16 risers of 6.75", run 150", stringer 184.84", 35.8°', () => {
    expect(exprs(stair, { totalRise: '108', targetRiserHeight: '7', treadDepth: '10', unitSystem: 'in' })).toEqual([
      '108 ÷ 7 → 16 risers',
      '108 ÷ 16 = 6.75" per riser',
      '15 × 10.00" = 150.00"',
      '√(108² + 150²) = 184.84"',
      'arctan(108 ÷ 150) = 35.8°',
      '2 × 6.75" + 10.00" = 23.5" (24-25" feels natural)',
    ]);
  });
  it('blank or zero rise gives no steps', () => {
    expect(steps(stair, { totalRise: '', targetRiserHeight: '7', treadDepth: '10' })).toEqual([]);
    expect(steps(stair, { totalRise: '0', targetRiserHeight: '7', treadDepth: '10' })).toEqual([]);
  });
});

describe('statistics', () => {
  it('population data 2 4 4 4 5 5 7 9: mean 5, σ² 4, σ 2, Q1 4, Q3 6', () => {
    expect(exprs(statistics, { data: '2 4 4 4 5 5 7 9', type: 'population', quartileMethod: 'halves' })).toEqual([
      '2, 4, 4, 4, 5, 5, 7, 9  (n = 8)',
      'x̄ = 40 ÷ 8 = 5',
      'Σ(x − x̄)² = 32',
      'σ² = 32 ÷ 8 = 4;  σ = √4 = 2',
      'Q1 = 4,  median = 4.5,  Q3 = 6,  IQR = Q3 − Q1 = 2',
      'Lower = 1,  Upper = 9;  outliers: none',
    ]);
  });
  it('sample data with a 40: mean 8.8888889, s² 140.11111, s 11.836854, inclusive quartiles 4/5/7, fences −0.5 and 11.5, outlier 40', () => {
    expect(exprs(statistics, { data: '2 4 4 4 5 5 7 9 40', type: 'sample', quartileMethod: 'inclusive' })).toEqual([
      '2, 4, 4, 4, 5, 5, 7, 9, 40  (n = 9)',
      'x̄ = 80 ÷ 9 = 8.8888889',
      'Σ(x − x̄)² = 1120.8888888888888889',
      's² = 1120.8888888888888889 ÷ 8 = 140.11111;  s = √140.11111 = 11.836854',
      'Q1 = 4,  median = 5,  Q3 = 7,  IQR = Q3 − Q1 = 3',
      'Lower = -0.5,  Upper = 11.5;  outliers: 40',
    ]);
  });
  it('fewer than 3 numbers or only text gives no steps', () => {
    expect(steps(statistics, { data: '1 2', type: 'sample' })).toEqual([]);
    expect(steps(statistics, { data: 'a b c', type: 'sample' })).toEqual([]);
  });
});

describe('system-of-equations', () => {
  it('2x + 3y = 7 and x − y = 1: D = −5, Dx = −10, Dy = −5, x = 2, y = 1', () => {
    expect(exprs(systemOfEquations, { a1: '2', b1: '3', c1: '7', a2: '1', b2: '-1', c2: '1' })).toEqual([
      '2x + 3y = 7   and   x − y = 1',
      'Determinant D = a₁·b₂ − a₂·b₁ = 2·-1 − 1·3 = -5',
      'Dx = c₁·b₂ − c₂·b₁ = 7·-1 − 1·3 = -10',
      'Dy = a₁·c₂ − a₂·c₁ = 2·1 − 1·7 = -5',
      'D = -5 ≠ 0 → unique solution',
      'x = Dx / D = -10 / -5 = 2',
      'y = Dy / D = -5 / -5 = 1',
    ]);
  });
  it('parallel lines, same equation: D = 0, infinitely many', () => {
    const e = exprs(systemOfEquations, { a1: '1', b1: '2', c1: '3', a2: '2', b2: '4', c2: '6' });
    expect(e).toHaveLength(3);
    expect(e[2]).toContain('infinite solutions');
  });
  it('parallel lines, different constants: no solution', () => {
    expect(exprs(systemOfEquations, { a1: '1', b1: '2', c1: '3', a2: '2', b2: '4', c2: '7' }).at(-1)).toContain('no solution');
  });
  it('a blank coefficient gives no steps', () => {
    expect(steps(systemOfEquations, { a1: '2', b1: '3', c1: '', a2: '1', b2: '-1', c2: '1' })).toEqual([]);
  });
});

describe('taylor-series', () => {
  it('sin(x) around 0 to order 5, evaluated at 1: 0.8416667 vs 0.84147098, error 0.000195682', () => {
    expect(exprs(taylorSeries, { expression: 'sin(x)', center: '0', order: '5', xValue: '1' })).toEqual([
      'P5(x) = Σ f⁽ᵏ⁾(0) ÷ k! × xᵏ,  k = 0 … 5',
      'x,  -x^3/6,  x^5/120',
      'P5(x) = x - x^3/6 + x^5/120',
      'P5(1) ≈ 0.8416666667;  f = 0.8414709848;  |f − P| = 0.0001956818588',
    ]);
  });
  it('1/(1 − x) around 0 has all coefficients 1', () => {
    expect(exprs(taylorSeries, { expression: '1/(1-x)', center: '0', order: '3' }).slice(1)).toEqual(['1,  x,  x^2,  x^3', 'P3(x) = 1 + x + x^2 + x^3']);
  });
  it('exp(x) around 1 uses powers of (x − 1) with e and e/2 coefficients', () => {
    const e = exprs(taylorSeries, { expression: 'exp(x)', center: '1', order: '3' });
    expect(e[0]).toBe('P3(x) = Σ f⁽ᵏ⁾(1) ÷ k! × (x − 1)ᵏ,  k = 0 … 3');
    expect(e[1]).toBe('2.71828,  2.71828*(x - 1),  1.35914*(x - 1)^2,  0.453047*(x - 1)^3');
  });
  it('blank or unparseable function gives no steps', () => {
    expect(steps(taylorSeries, { expression: '', center: '0', order: '3' })).toEqual([]);
    expect(steps(taylorSeries, { expression: 'sin(', center: '0', order: '3' })).toEqual([]);
  });
});

describe('test-score', () => {
  it('90% now, want 85%, final worth 20%: (85 − 72) ÷ 0.2 = 65%', () => {
    expect(exprs(testScore, { currentGrade: '90', desiredGrade: '85', examWeight: '20' })).toEqual([
      '85% = 90% × 0.8 + final × 0.2',
      'final = (85% − 90% × 0.8) ÷ 0.2 = 65%',
      '72% (0% on the final) to 92% (100% on the final)',
    ]);
  });
  it('85% now, want 90%: needs 110%, which is out of reach (best case 88%)', () => {
    const s = steps(testScore, { currentGrade: '85', desiredGrade: '90', examWeight: '20' });
    expect(s[1].expr).toBe('final = (90% − 85% × 0.8) ÷ 0.2 = 110%');
    expect(s[2].expr).toBe('100% on the final gives 88% < 90%');
  });
  it('95% now, want 80%: needs only 20%', () => {
    expect(exprs(testScore, { currentGrade: '95', desiredGrade: '80', examWeight: '20' })[1]).toBe('final = (80% − 95% × 0.8) ÷ 0.2 = 20%');
  });
  it('zero exam weight and blanks give no steps', () => {
    expect(steps(testScore, { currentGrade: '90', desiredGrade: '85', examWeight: '0' })).toEqual([]);
    expect(steps(testScore, { currentGrade: '', desiredGrade: '85', examWeight: '20' })).toEqual([]);
  });
});

describe('time', () => {
  it('9:00 AM to 5:30 PM less a 30 min break at $20/h = 480 min = $160', () => {
    expect(exprs(time, { startTime: '9:00 AM', endTime: '5:30 PM', breakMinutes: '30', hourlyRate: '20' })).toEqual([
      '9:00 AM = 540 min,  5:30 PM = 1050 min',
      '1050 − 540 = 510 min',
      '510 − 30 = 480 min',
      '480 min = 8 hours 0 minutes = 8.00 decimal hours',
      '480 ÷ 60 × $20.00/hr = $160.00',
    ]);
  });
  it('10 PM to 6 AM crosses midnight: 360 + 1440 − 1320 = 480', () => {
    expect(exprs(time, { startTime: '10:00 PM', endTime: '6:00 AM' })[1]).toBe('360 + 1440 − 1320 = 480 min');
  });
  it('an unreadable time or a break longer than the shift gives no steps', () => {
    expect(steps(time, { startTime: 'soon', endTime: '5:00 PM' })).toEqual([]);
    expect(steps(time, { startTime: '9:00 AM', endTime: '10:00 AM', breakMinutes: '90' })).toEqual([]);
  });
});

describe('time-card', () => {
  it('five days = 2415 min = 40.25 h, 0.25 h overtime: $800 + $7.50 = $807.50', () => {
    expect(
      exprs(timeCard, {
        weekStart: '2025-01-06',
        paySettings: 'enter',
        regularRate: '20',
        overtimeRate: '1.5',
        entries: 'Mon, 9:00, 17:30, 0:30\nTue, 9:00, 17:00, 0:30\nWed, 8:00, 18:00, 1:00\nThu, 9:00, 17:00, 0:30\nFri, 8:30, 17:30, 0:45',
        overtimeThreshold: '40',
      }),
    ).toEqual([
      'Monday 8h 00m + Tuesday 7h 30m + Wednesday 9h 00m + Thursday 7h 30m + Friday 8h 15m',
      '2415 min = 40h 15m = 40.25 hours',
      'Regular 40.00 hours + overtime 0.25 hours',
      '$800.00 + $7.50 = $807.50',
    ]);
  });
  it('daily overtime after 8 h: 9.5 h + 7.5 h gives 15.5 regular and 1.5 overtime', () => {
    const s = steps(timeCard, { paySettings: 'skip', entries: 'Mon, 8:00, 18:00, 0:30\nTue, 9:00, 17:00, 0:30', overtimeThreshold: '8' });
    expect(s.map((x) => x.expr)).toEqual(['Monday 9h 30m + Tuesday 7h 30m', '1020 min = 17h 00m = 17.00 hours', 'Regular 15.50 hours + overtime 1.50 hours']);
    expect(s[2].label).toBe('Hours over 8 in a single day are overtime');
  });
  it('unreadable lines are reported, valid ones still counted', () => {
    const s = steps(timeCard, { paySettings: 'skip', entries: 'Mon, 8:00, 16:00\nbad line\nTue, 25:00, 17:00', overtimeThreshold: '40' });
    expect(s[0].expr).toBe('Monday 8h 00m');
    expect(s[0].note).toContain('line 2');
  });
  it('blank entries or only unreadable lines give no steps', () => {
    expect(steps(timeCard, { entries: '', paySettings: 'skip' })).toEqual([]);
    expect(steps(timeCard, { entries: 'nonsense', paySettings: 'skip' })).toEqual([]);
  });
});

describe('time-duration', () => {
  it('Jan 1 9:00 AM to Jan 3 5:30 PM = 3390 min = 56.5 h = 2d 8h 30m', () => {
    expect(exprs(timeDuration, { startDate: '2025-01-01', startTime: '9:00 AM', endDate: '2025-01-03', endTime: '5:30 PM', businessDays: 'no' })).toEqual([
      '2 × 1440 + 510 = 3390 min',
      '3390 min = 2d 8h 30m',
      '3390 ÷ 60 = 56.50 hours',
      '0w 2d 8h',
    ]);
  });
  it('Jan 3 9 PM to Jan 8 8 AM = 6420 min = 107 h, with 4 weekdays', () => {
    const e = exprs(timeDuration, { startDate: '2025-01-03', startTime: '9:00 PM', endDate: '2025-01-08', endTime: '8:00 AM', businessDays: 'yes' });
    expect(e[0]).toBe('5 × 1440 − 780 = 6420 min');
    expect(e[2]).toBe('6420 ÷ 60 = 107.00 hours');
    expect(e[4]).toBe('2025-01-03 … 2025-01-08 = 4 weekdays');
  });
  it('end before start and impossible dates give no steps', () => {
    expect(steps(timeDuration, { startDate: '2025-01-03', startTime: '9:00 AM', endDate: '2025-01-01', endTime: '9:00 AM' })).toEqual([]);
    expect(steps(timeDuration, { startDate: '2025-02-31', startTime: '9:00 AM', endDate: '2025-03-05', endTime: '9:00 AM' })).toEqual([]);
  });
});

describe('trigonometry-calculator', () => {
  it('150° is in quadrant II with reference angle 30°: sin 0.5, cos −0.8660254, tan −0.57735027', () => {
    expect(exprs(trigonometry, { mode: 'angle-to-trig', angleUnit: 'deg', angle: '150' })).toEqual([
      '150° ≡ 150°',
      'Quadrant II;  reference angle = 30°',
      'sin = 0.5,  cos = -0.8660254,  tan = -0.57735027',
      'csc = 2,  sec = -1.15470054,  cot = -1.73205081',
      'sin = 1/2, cos = -√3/2, tan = -√3/3',
    ]);
  });
  it('−45° reduces to 315° in quadrant IV', () => {
    const e = exprs(trigonometry, { mode: 'angle-to-trig', angleUnit: 'deg', angle: '-45' });
    expect(e[0]).toBe('-45° ≡ 315°');
    expect(e[1]).toBe('Quadrant IV;  reference angle = 45°');
    expect(e[2]).toBe('sin = -0.70710678,  cos = 0.70710678,  tan = -1');
  });
  it('sin θ = 0.5 gives 30° and 150°', () => {
    expect(exprs(trigonometry, { mode: 'trig-to-angle', angleUnit: 'deg', function: 'sin', trigValue: '0.5' })).toEqual([
      'θ = sin⁻¹(0.5)  →  30°',
      '30°',
      'θ = 30° or 150°  (0° ≤ θ < 360°)',
      'π/6 rad = 30°',
    ]);
  });
  it('sec θ = 2 gives 60° and 300° through the reciprocal', () => {
    const s = steps(trigonometry, { mode: 'trig-to-angle', angleUnit: 'deg', function: 'sec', trigValue: '2' });
    expect(s[0].expr).toBe('θ = sec⁻¹(2)  →  60°');
    expect(s[0].note).toContain('reciprocals');
    expect(s[2].expr).toBe('θ = 60° or 300°  (0° ≤ θ < 360°)');
  });
  it('a value outside the domain, a blank angle and no mode give no steps', () => {
    expect(steps(trigonometry, { mode: 'trig-to-angle', angleUnit: 'deg', function: 'sin', trigValue: '2' })).toEqual([]);
    expect(steps(trigonometry, { mode: 'angle-to-trig', angleUnit: 'deg', angle: '' })).toEqual([]);
    expect(steps(trigonometry, { angle: '30' })).toEqual([]);
  });
});

describe('unit-circle', () => {
  it('150° = 5π/6 with (−0.8660254, 0.5)', () => {
    expect(exprs(unitCircle, { angle: '150' })).toEqual([
      '150° ≡ 150° = 5π/6',
      'Quadrant: II;  reference angle: 30°',
      '(-0.8660254, 0.5)',
      'sin = 1/2, cos = -√3/2, tan = -√3/3',
      'sin | cos | tan = 0.5  |  -0.8660254  |  -0.57735027;  csc | sec | cot = 2  |  -1.15470054  |  -1.73205081',
    ]);
  });
  it('−30° reduces to 330° = 11π/6 in quadrant IV', () => {
    const e = exprs(unitCircle, { angle: '-30' });
    expect(e[0]).toBe('-30° ≡ 330° = 11π/6');
    expect(e[2]).toBe('(0.8660254, -0.5)');
  });
  it('blank or non-numeric angle gives no steps', () => {
    expect(steps(unitCircle, { angle: '' })).toEqual([]);
    expect(steps(unitCircle, { angle: 'abc' })).toEqual([]);
  });
});

describe('vector-calculator', () => {
  it('(2, 3) and (5, 6): sum (7, 9), dot 28, |v1| 3.605551, |v2| 7.81025, angle 6.115504°, cross z = −3', () => {
    expect(exprs(vectorCalculator, { v1x: '2', v1y: '3', v2x: '5', v2y: '6' })).toEqual([
      'v₁ + v₂ = (2, 3) + (5, 6) = (7, 9);  v₁ − v₂ = (-3, -3)',
      'v₁·v₂ = 2×5 + 3×6 = 28',
      '|v₁| = √(2² + 3²) = 3.605551;  |v₂| = √(5² + 6²) = 7.81025',
      'θ = arccos(28 ÷ (3.605551 × 7.81025)) = 6.115504°',
      'v₁ × v₂ = (0, 0, -3)',
    ]);
  });
  it('3D (1, −2, 2) and (3, 0, −4): dot −5, magnitudes 3 and 5, angle 109.471221°, cross (8, 10, 6)', () => {
    expect(exprs(vectorCalculator, { v1x: '1', v1y: '-2', v1z: '2', v2x: '3', v2y: '0', v2z: '-4' })).toEqual([
      'v₁ + v₂ = (1, -2, 2) + (3, 0, -4) = (4, -2, -2);  v₁ − v₂ = (-2, -2, 6)',
      'v₁·v₂ = 1×3 + (-2)×0 + 2×(-4) = -5',
      '|v₁| = √(1² + (-2)² + 2²) = 3;  |v₂| = √(3² + 0² + (-4)²) = 5',
      'θ = arccos(-5 ÷ (3 × 5)) = 109.471221°',
      'v₁ × v₂ = (8, 10, 6)',
    ]);
  });
  it('a missing component gives no steps', () => {
    expect(steps(vectorCalculator, { v1x: '2', v1y: '', v2x: '5', v2y: '6' })).toEqual([]);
  });
});

describe('weight', () => {
  it('70 kg on Earth = 686.7 N (154.3763 lbf)', () => {
    expect(exprs(weight, { mode: 'calcWeight', mass: '70', massUnit: 'kg', gravitySelect: 'Earth' })).toEqual([
      'W = m × g',
      'Earth (9.81 m/s²)',
      'W = 70 kg × 9.81 m/s² = 686.7 N',
      '154.3763012 lbf',
    ]);
  });
  it('686.7 N on Earth = 70 kg', () => {
    expect(exprs(weight, { mode: 'calcMass', weight: '686.7', gravitySelect: 'Earth' })).toEqual(['m = W / g', 'Earth (9.81 m/s²)', 'm = 686.7 N ÷ 9.81 m/s² = 70 kg']);
  });
  it('98.1 N on 10 kg gives g = 9.81 m/s²', () => {
    expect(exprs(weight, { mode: 'calcGravity', mass: '10', massUnit: 'kg', weight: '98.1' })).toEqual(['g = W / m', 'g = 98.1 N ÷ 10 kg = 9.81 m/s²']);
  });
  it('zero mass for gravity and blanks give no steps', () => {
    expect(steps(weight, { mode: 'calcGravity', mass: '0', massUnit: 'kg', weight: '98.1' })).toEqual([]);
    expect(steps(weight, { mode: 'calcWeight', mass: '', massUnit: 'kg', gravitySelect: 'Earth' })).toEqual([]);
  });
});

describe('mass (density)', () => {
  it('1000 kg/m³ × 2 m³ = 2000 kg', () => {
    expect(exprs(mass, { mode: 'calcMass', density: '1000', densityUnit: 'kg/m3', volume: '2', volumeUnit: 'm3' })).toEqual(['m = ρ × V', 'm = 1000 kg/m³ × 2 m³ = 2000 kg']);
  });
  it('500 g in 100 cm³ = 0.5 kg ÷ 0.0001 m³ = 5000 kg/m³', () => {
    expect(exprs(mass, { mode: 'calcDensity', mass: '500', massUnit: 'g', volume: '100', volumeUnit: 'cm3' })[1]).toBe('ρ = 0.5 kg ÷ 0.0001 m³ = 5000 kg/m³');
  });
  it('zero volume for density and blanks give no steps', () => {
    expect(steps(mass, { mode: 'calcDensity', mass: '500', massUnit: 'g', volume: '0', volumeUnit: 'cm3' })).toEqual([]);
    expect(steps(mass, { mode: 'calcMass', density: '', volume: '2' })).toEqual([]);
  });
});

describe('wind-chill', () => {
  it('20°F at 15 mph: v = 1.5423, wind chill 6.2°F = -14.3°C', () => {
    expect(exprs(windChill, { temperature: '20', tempUnit: 'F', windSpeed: '15', speedUnit: 'mph' })).toEqual([
      'v = 15^0.16 = 1.5423',
      'WC = 35.74 + 0.6215×20 − 35.75×1.5423 + 0.4275×20×1.5423 = 6.2°F',
      '6.2°F = -14.3°C',
      'Moderate risk (frostbite possible after long unprotected exposure)',
    ]);
  });
  it('-15°C at 20 km/h: v = 1.615, wind chill -24.2°C = -11.5°F', () => {
    const e = exprs(windChill, { temperature: '-15', tempUnit: 'C', windSpeed: '20', speedUnit: 'kmh' });
    expect(e[0]).toBe('v = 20^0.16 = 1.615');
    expect(e[1]).toBe('WC = 13.12 + 0.6215×(-15) − 11.37×1.615 + 0.3965×(-15)×1.615 = -24.2°C');
    expect(e[2]).toBe('-11.5°F = -24.2°C');
  });
  it('60°F is outside the formula range: wind chill equals the air temperature', () => {
    const e = exprs(windChill, { temperature: '60', tempUnit: 'F', windSpeed: '10', speedUnit: 'mph' });
    expect(e[0]).toBe('Wind chill = air temperature = 60°F');
    expect(e[1]).toBe('60°F = 15.6°C');
  });
  it('blank temperature and negative wind give no steps', () => {
    expect(steps(windChill, { temperature: '', tempUnit: 'F', windSpeed: '10', speedUnit: 'mph' })).toEqual([]);
    expect(steps(windChill, { temperature: '20', tempUnit: 'F', windSpeed: '-3', speedUnit: 'mph' })).toEqual([]);
  });
});

describe('ph-calculator', () => {
  it('[H+] = 0.001 gives pH 3, pOH 11', () => {
    expect(exprs(phCalculator, { mode: 'h-to-ph', hconcentration: '0.001' })).toEqual([
      'pH = −log₁₀[H⁺] = −log₁₀(0.001) = 3.00',
      'pOH = 14 − 3.00 = 11.00',
      'pH 3.00 → Acidic (indicator colour: Orange/Yellow)',
    ]);
  });
  it('pH 8.5 gives [H+] = 3.1623e-9 and pOH 5.5', () => {
    const e = exprs(phCalculator, { mode: 'ph-to-h', phInput: '8.5' });
    expect(e[0]).toBe('[H⁺] = 10^(−8.50) = 3.1623e-9 mol/L');
    expect(e[1]).toBe('pOH = 14 − 8.50 = 5.50');
  });
  it('pOH 4 gives pH 10 and [H+] = 1e-10', () => {
    const e = exprs(phCalculator, { mode: 'poh-to-ph', pohInput: '4' });
    expect(e[0]).toBe('pH = 14 − 4.00 = 10.00');
    expect(e[1]).toBe('[H⁺] = 10^(−10.00) = 1.0000e-10 mol/L');
  });
  it('pH 2 gives pOH 12', () => {
    expect(exprs(phCalculator, { mode: 'ph-to-poh', phInput: '2' })[0]).toBe('pOH = 14 − 2.00 = 12.00');
  });
  it('zero concentration, pH above 14 and blanks give no steps', () => {
    expect(steps(phCalculator, { mode: 'h-to-ph', hconcentration: '0' })).toEqual([]);
    expect(steps(phCalculator, { mode: 'ph-to-h', phInput: '15' })).toEqual([]);
    expect(steps(phCalculator, { mode: 'ph-to-poh', phInput: '' })).toEqual([]);
  });
});

describe('tile', () => {
  it('12 x 10 ft room, 12" tile, 1/8" grout, grid: 118 base, 130 with waste, 9 boxes, $390', () => {
    expect(exprs(tile, { areaLength: '12', areaWidth: '10', tileLength: '12', tileWidth: '12', groutWidth: '0.125', layout: 'grid', pricePerTile: '3' })).toEqual([
      '12 ft × 10 ft = 120.0 sq ft',
      '(12" + 0.125") × (12" + 0.125") ÷ 144 = 1.0209 sq ft',
      '120.0 ÷ 1.0209 = 118 tiles (rounded up)',
      '118 × (1 + 10%) = 130 tiles (12 extra)',
      '130 ÷ 16 tiles per box = 9 boxes (rounded up)',
      '130 × $3 = $390.00',
    ]);
  });
  it('blank or zero dimensions give no steps', () => {
    expect(steps(tile, { areaLength: '', areaWidth: '10', tileLength: '12', tileWidth: '12', layout: 'grid' })).toEqual([]);
    expect(steps(tile, { areaLength: '12', areaWidth: '10', tileLength: '0', tileWidth: '12', layout: 'grid' })).toEqual([]);
  });
});

describe('derivative-calculator', () => {
  it('second derivative of x³ + 2x is 6x, which is 12 at x = 2', () => {
    expect(exprs(derivative, { expression: 'x^3 + 2x', order: '2', xValue: '2' })).toEqual([
      'sum rule, power rule, constant multiple rule',
      "f'(x) = 3*x^2 + 2",
      "f''(x) = 6*x",
      "f''(2) = 12",
    ]);
  });
  it('a bad expression or blank gives no steps', () => {
    expect(steps(derivative, { expression: 'x +', order: '1' })).toEqual([]);
    expect(steps(derivative, { expression: '', order: '1' })).toEqual([]);
  });
});

describe('integral-calculator', () => {
  it("x² from 0 to 3 by Simpson's rule: h 0.03, odd sum 149.985, even sum 145.53, result 9 (trapezoid 9.00045)", () => {
    const s = steps(integral, { expression: 'x^2', lowerBound: '0', upperBound: '3', n: '100' });
    expect(s.map((x) => x.expr)).toEqual([
      'Step size: h = (b − a) / n = (3 − 0) / 100 = 0.03',
      'f(a) = 0, f(b) = 9',
      'Sum of odd-indexed f(x) (coefficient 4): 149.985',
      'Sum of even-indexed f(x) (coefficient 2): 145.53',
      'S = (h / 3) × [f(a) + f(b) + 4×odd + 2×even] = 9',
      '∫ x^2 dx ≈ 9',
    ]);
    expect(s[5].note).toContain('9.00045');
  });
  it('equal bounds is zero area; a bad expression gives no steps', () => {
    expect(exprs(integral, { expression: 'x^2', lowerBound: '2', upperBound: '2' })).toEqual(['∫ x^2 dx = 0']);
    expect(steps(integral, { expression: 'x^', lowerBound: '0', upperBound: '1' })).toEqual([]);
  });
});

describe('limit-calculator', () => {
  it('(x² − 4)/(x − 2) as x → 2 approaches 4 from both sides, f(2) undefined', () => {
    const s = steps(limit, { expression: '(x^2-4)/(x-2)', approachValue: '2', direction: 'both' });
    expect(s.map((x) => x.expr)).toEqual([
      'x → 2⁻: f(1.9) = 3.9  →  f(1.99) = 3.99  →  f(1.999) = 3.999  →  f(1.9999) = 3.9999  →  f(1.99999) = 3.99999',
      'x → 2⁺: f(2.1) = 4.1  →  f(2.01) = 4.01  →  f(2.001) = 4.001  →  f(2.0001) = 4.0001  →  f(2.00001) = 4.00001',
      'left: 4;  right: 4',
      'lim f(x) as x → 2 = 4',
      'f(a) = Undefined',
    ]);
    expect(s[4].note).toContain('removable discontinuity');
  });
  it('1/x from the right grows without bound', () => {
    const e = exprs(limit, { expression: '1/x', approachValue: '0', direction: 'right' });
    expect(e).toHaveLength(3);
    expect(e[1]).toBe('lim f(x) as x → 0⁺ = ∞');
  });
  it('a bad expression or a blank point gives no steps', () => {
    expect(steps(limit, { expression: '(x', approachValue: '2', direction: 'both' })).toEqual([]);
    expect(steps(limit, { expression: 'x', approachValue: '', direction: 'both' })).toEqual([]);
  });
});

describe('polynomial-calculator', () => {
  it('2x² − 3x + 1 at x = 3: 18 − 9 + 1 = 10, slope 4x − 3 = 9', () => {
    expect(exprs(polynomial, { coefficients: '2 -3 1', x: '3' })).toEqual([
      'P(3) =2x² − 3x + 1',
      '=2 × 3² − 3 × 3 + 1',
      '=18 − 9 + 1',
      '= 10',
      "P'(3) (slope at x) = 9",
    ]);
  });
  it('junk coefficients or a blank x give no steps', () => {
    expect(steps(polynomial, { coefficients: '2 a 1', x: '3' })).toEqual([]);
    expect(steps(polynomial, { coefficients: '2 -3 1', x: '' })).toEqual([]);
  });
});

describe('date', () => {
  it('31 Jan 2024 + 1 month + 1 week + 2 days: clamps to 29 Feb, then 9 days → Saturday 9 Mar 2024', () => {
    const s = steps(date, { startDate: '2024-01-31', action: 'add', years: '0', months: '1', weeks: '1', days: '2', businessDays: 'all' });
    expect(s.map((x) => x.expr)).toEqual([
      'Jan 31, 2024',
      'Jan 31, 2024 + 1 month = Feb 29, 2024',
      'Feb 29, 2024 + 9 days = Mar 9, 2024',
      'Mar 9, 2024 (Saturday)',
    ]);
    expect(s[1].note).toContain('last day (29)');
    expect(s[3].note).toBe('38 calendar days after the start date.');
  });
  it('15 Mar 2025 − 1 year − 10 business days → Friday 1 Mar 2024 (379 days before)', () => {
    const s = steps(date, { startDate: '2025-03-15', action: 'subtract', years: '1', months: '0', weeks: '0', days: '10', businessDays: 'business' });
    expect(s.map((x) => x.expr)).toEqual(['Mar 15, 2025', 'Mar 15, 2025 − 1 year = Mar 15, 2024', 'Mar 15, 2024 − 10 business days = Mar 1, 2024', 'Mar 1, 2024 (Friday)']);
    expect(s[3].note).toBe('379 calendar days before the start date.');
  });
  it('adding nothing returns the start date', () => {
    expect(exprs(date, { startDate: '2025-03-15', action: 'add', years: '0', months: '0', weeks: '0', days: '0', businessDays: 'all' })).toEqual(['Mar 15, 2025', 'Mar 15, 2025 (Saturday)']);
  });
  it('an impossible date and a decimal count give no steps', () => {
    expect(steps(date, { startDate: '2025-02-31', action: 'add', days: '1' })).toEqual([]);
    expect(steps(date, { startDate: '2025-03-15', action: 'add', days: '1.5' })).toEqual([]);
  });
});

describe('day-counter', () => {
  it('1 Jan to 1 Mar 2025 with the end date included = 60 days, 43 weekdays', () => {
    expect(exprs(dayCounter, { startDate: '2025-01-01', endDate: '2025-03-01', includeEndDate: 'yes', countBusinessDays: 'yes' })).toEqual([
      '2025-01-01 → 2025-03-01 + 1 day = 60 days',
      '0 years, 2 months, 1 day',
      '60 ÷ 7 = 8 weeks and 4 days',
      '60 × 24 = 1440 hours;  60 × 1440 = 86400 minutes',
      '43 weekdays in that range',
    ]);
  });
  it('without the end date it is 59 days', () => {
    expect(exprs(dayCounter, { startDate: '2025-01-01', endDate: '2025-03-01', includeEndDate: 'no', countBusinessDays: 'no' })[0]).toBe('2025-01-01 → 2025-03-01 = 59 days');
  });
  it('end before start and a missing date give no steps', () => {
    expect(steps(dayCounter, { startDate: '2025-03-01', endDate: '2025-01-01' })).toEqual([]);
    expect(steps(dayCounter, { startDate: '2025-03-01', endDate: '' })).toEqual([]);
  });
});

describe('day-of-week', () => {
  it("4 July 2024 by Zeller's congruence: h = 19 mod 7 = 5 = Thursday", () => {
    expect(exprs(dayOfWeek, { month: '7', day: '4', year: '2024' })).toEqual([
      'h = (q + ⌊13(m+1)/5⌋ + K + ⌊K/4⌋ + ⌊J/4⌋ − 2J) mod 7',
      'q=4, m=7, K=24, J=20 → h = (4 + 20 + 24 + 6 + 5 − 40) mod 7 = 19 mod 7 = 5',
      '5 → Thursday',
      'Thursday, July 4, 2024',
    ]);
  });
  it('January counts as month 13 of the year before; pre-1582 dates carry the calendar note', () => {
    const s = steps(dayOfWeek, { month: '1', day: '1', year: '1500' });
    expect(s[1].expr).toBe('q=1, m=13, K=99, J=14 → h = (1 + 36 + 99 + 24 + 3 − 28) mod 7 = 135 mod 7 = 2');
    expect(s[3].note).toContain('proleptic Gregorian');
  });
  it('Feb 30 and blanks give no steps', () => {
    expect(steps(dayOfWeek, { month: '2', day: '30', year: '2024' })).toEqual([]);
    expect(steps(dayOfWeek, { month: '', day: '4', year: '2024' })).toEqual([]);
  });
});
