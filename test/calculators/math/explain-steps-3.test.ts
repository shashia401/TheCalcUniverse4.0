import { describe, it, expect } from 'vitest';
import type { CalculatorConfig, ExplainStep } from '../../../src/types/calculator';
import bandwidth from '../../../src/calculators/math/bandwidth';
import baseConverter from '../../../src/calculators/math/base-converter';
import basicCalc from '../../../src/calculators/math/basic-calc';
import bigNumber from '../../../src/calculators/math/big-number';
import binaryHex from '../../../src/calculators/math/binary-hex';
import commonDenominator from '../../../src/calculators/math/common-denominator';
import confidenceInterval from '../../../src/calculators/math/confidence-interval';
import conversion from '../../../src/calculators/math/conversion';
import correlation from '../../../src/calculators/math/correlation-calculator';
import density from '../../../src/calculators/math/density';
import dewPoint from '../../../src/calculators/math/dew-point';
import edpi from '../../../src/calculators/math/edpi';
import electricity from '../../../src/calculators/math/electricity-cost';
import engineHp from '../../../src/calculators/math/engine-horsepower';
import equationSolver from '../../../src/calculators/math/equation-solver';
import quadratic from '../../../src/calculators/math/quadratic';
import factor from '../../../src/calculators/math/factor';
import factoring from '../../../src/calculators/math/factoring-calculator';
import fibonacci from '../../../src/calculators/math/fibonacci';
import fuelCost from '../../../src/calculators/math/fuel-cost';
import gasMileage from '../../../src/calculators/math/gas-mileage';
import gdp from '../../../src/calculators/math/gdp';
import golf from '../../../src/calculators/math/golf-handicap';
import gpa from '../../../src/calculators/math/gpa';
import grade from '../../../src/calculators/math/grade';
import gravel from '../../../src/calculators/math/gravel';
import halfLife from '../../../src/calculators/math/half-life';
import heatIndex from '../../../src/calculators/math/heat-index';
import height from '../../../src/calculators/math/height';
import horsepower from '../../../src/calculators/math/horsepower';
import inverseTrig from '../../../src/calculators/math/inverse-trig';
import { buildDemoValues } from '../../helpers';

// Every number asserted below was computed independently in Python (math / fractions / decimal / scipy for the
// t, z and p-values), not by running the calculators.

type V = Record<string, string>;
const steps = (c: CalculatorConfig, v: V): ExplainStep[] => c.explainSteps!(v);
const exprs = (c: CalculatorConfig, v: V) => steps(c, v).map((s) => s.expr);
const demo = (c: CalculatorConfig) => buildDemoValues(c.inputs);

describe('explainSteps (batch 3) - every calculator returns steps for its demo values and [] for empty input', () => {
  const all: [string, CalculatorConfig][] = [
    ['bandwidth', bandwidth],
    ['base-converter', baseConverter],
    ['basic-calc', basicCalc],
    ['big-number', bigNumber],
    ['binary-hex', binaryHex],
    ['common-denominator', commonDenominator],
    ['confidence-interval', confidenceInterval],
    ['conversion', conversion],
    ['correlation-calculator', correlation],
    ['density', density],
    ['dew-point', dewPoint],
    ['edpi', edpi],
    ['electricity-cost', electricity],
    ['engine-horsepower', engineHp],
    ['equation-solver', equationSolver],
    ['factor', factor],
    ['factoring-calculator', factoring],
    ['fibonacci', fibonacci],
    ['fuel-cost', fuelCost],
    ['gas-mileage', gasMileage],
    ['gdp', gdp],
    ['golf-handicap', golf],
    ['gpa', gpa],
    ['grade', grade],
    ['gravel', gravel],
    ['half-life', halfLife],
    ['heat-index', heatIndex],
    ['height', height],
    ['horsepower', horsepower],
    ['inverse-trig', inverseTrig],
  ];
  for (const [name, c] of all) {
    it(name, () => {
      const v = demo(c);
      const rows = c.calculate(v);
      if (rows.length > 0 && !rows.some((r) => r.id === 'error' || r.id === 'domainError')) {
        const s = steps(c, v);
        expect(s.length).toBeGreaterThanOrEqual(1);
        for (const st of s) {
          expect(st.label.length).toBeGreaterThan(0);
          expect(st.expr).not.toMatch(/NaN|Infinity|undefined/);
        }
      }
      expect(steps(c, {})).toEqual([]);
    });
  }
});

describe('bandwidth', () => {
  it('2 GB at 100 Mbps: 16,000 Mbit / 100 = 160 s = 2m 40s', () => {
    expect(exprs(bandwidth, { fileSize: '2', fileSizeUnit: 'GB', connectionSpeed: '100', speedUnit: 'Mbps', tcpOverhead: 'No' })).toEqual([
      '2 GB × 8000 Mbit/GB = 16000.00 Mbit',
      '16000.00 Mbit ÷ 100.00 Mbps = 160.00 s = 2m 40s',
    ]);
  });
  it('500 MB over 1 Gbps with 10% overhead: 4000 / 900 = 4.44 s', () => {
    expect(exprs(bandwidth, { fileSize: '500', fileSizeUnit: 'MB', connectionSpeed: '1', speedUnit: 'Gbps', tcpOverhead: 'Yes' })).toEqual([
      '500 MB × 8 Mbit/MB = 4000.00 Mbit',
      '1 Gbps × 1,000 = 1000.00 Mbps',
      '1000.00 Mbps × (1 − 10%) = 900.00 Mbps',
      '4000.00 Mbit ÷ 900.00 Mbps = 4.44 s = 4s',
    ]);
  });
  it('1 TB over 1 Gbps: 8,000 s = 2h 13m 20s', () => {
    const e = exprs(bandwidth, { fileSize: '1', fileSizeUnit: 'TB', connectionSpeed: '1', speedUnit: 'Gbps', tcpOverhead: 'No' });
    expect(e[e.length - 1]).toBe('8000000.00 Mbit ÷ 1000.00 Mbps = 8000.00 s = 2h 13m 20s');
  });
  it('zero size and blank return []', () => {
    expect(steps(bandwidth, { fileSize: '0', fileSizeUnit: 'MB', connectionSpeed: '10', speedUnit: 'Mbps', tcpOverhead: 'No' })).toEqual([]);
    expect(steps(bandwidth, { fileSize: '', connectionSpeed: '' })).toEqual([]);
  });
});

describe('base-converter', () => {
  it('2A (base 16) to binary: 2×16 + 10 = 42 = 101010', () => {
    const e = exprs(baseConverter, { input: '2A', fromBase: '16', toBase: '2' });
    expect(e[0]).toBe('2×16¹ + 10×16⁰ = 42');
    expect(e[1]).toBe('42 ÷ 2 = 21 r 0  |  21 ÷ 2 = 10 r 1  |  10 ÷ 2 = 5 r 0  |  5 ÷ 2 = 2 r 1  |  2 ÷ 2 = 1 r 0  |  1 ÷ 2 = 0 r 1');
    expect(e[2]).toBe('2A (base 16) = 101010 (base 2)');
  });
  it('255 to hex: remainders F, F', () => {
    const e = exprs(baseConverter, { input: '255', fromBase: '10', toBase: '16' });
    expect(e).toEqual(['255 ÷ 16 = 15 r F  |  15 ÷ 16 = 0 r F', '255 (base 10) = FF (base 16)']);
  });
  it('1000 to octal is 1750', () => {
    const e = exprs(baseConverter, { input: '1000', fromBase: '10', toBase: '8' });
    expect(e[0]).toBe('1000 ÷ 8 = 125 r 0  |  125 ÷ 8 = 15 r 5  |  15 ÷ 8 = 1 r 7  |  1 ÷ 8 = 0 r 1');
    expect(e[1]).toBe('1000 (base 10) = 1750 (base 8)');
  });
  it('A.8 (base 16) = 10.5', () => {
    expect(exprs(baseConverter, { input: 'A.8', fromBase: '16', toBase: '10' })).toEqual(['10×16⁰ + 8×16⁻¹ = 10.5', 'A.8 (base 16) = 10.5 (base 10)']);
  });
  it('-0.1 to binary: 0.000110011001100110011001 (24 digits, cut)', () => {
    const s = steps(baseConverter, { input: '-0.1', fromBase: '10', toBase: '2' });
    expect(s[0].expr).toBe('.000110011001100110011001');
    expect(s[0].note).toMatch(/never ends/);
    expect(s[1].expr).toBe('-0.1 (base 10) = -0.000110011001100110011001 (base 2)');
  });
  it('a digit outside the base and blank return []', () => {
    expect(steps(baseConverter, { input: '12', fromBase: '2', toBase: '10' })).toEqual([]);
    expect(steps(baseConverter, { input: '', fromBase: '2', toBase: '10' })).toEqual([]);
  });
});

describe('basic-calc', () => {
  it('uses the order of operations', () => {
    expect(exprs(basicCalc, { expression: '2 + 3 × 4' })).toEqual(['2 + 3 × 4', '= 14']);
    expect(exprs(basicCalc, { expression: '(2 + 3) × 4' })[1]).toBe('= 20');
    expect(exprs(basicCalc, { expression: '0.1 + 0.2' })[1]).toBe('= 0.3');
  });
  it('blank and malformed input return []', () => {
    expect(steps(basicCalc, { expression: '' })).toEqual([]);
    expect(steps(basicCalc, { expression: '2 +' })).toEqual([]);
  });
});

describe('big-number', () => {
  it('multiplies exactly (39-digit product)', () => {
    expect(exprs(bigNumber, { a: '123456789012345678901234567890', b: '987654321', op: 'multiply' })).toEqual([
      'Value 1 = 123456789012345678901234567890  and  Value 2 = 987654321',
      '123456789012345678901234567890 × 987654321 = 121932631124828532112482853211126352690',
      '39 digits',
    ]);
  });
  it('2^100', () => {
    const e = exprs(bigNumber, { a: '2', b: '100', op: 'power' });
    expect(e[1]).toBe('2^100 = 1267650600228229401496703205376');
    expect(e[2]).toBe('31 digits');
  });
  it('divides with truncation toward zero and checks it: -7 / 2 = -3 r -1', () => {
    const e = exprs(bigNumber, { a: '-7', b: '2', op: 'divide' });
    expect(e[1]).toBe('-7 ÷ 2 = -3 (remainder -1), truncated toward zero');
    expect(e[2]).toBe('-3 × 2 + -1 = -7');
  });
  it('division by zero, decimals and blank return []', () => {
    expect(steps(bigNumber, { a: '5', b: '0', op: 'divide' })).toEqual([]);
    expect(steps(bigNumber, { a: '5.5', b: '2', op: 'add' })).toEqual([]);
    expect(steps(bigNumber, { a: '', b: '2', op: 'add' })).toEqual([]);
  });
});

describe('binary-hex', () => {
  it('FF hex to binary at 8 bits', () => {
    const e = exprs(binaryHex, { mode: 'Convert', fromBase: 'Hex', toBase: 'Binary', value: 'FF', bitWidth: '8' });
    expect(e[0]).toBe('(F×16¹)+(F×16⁰)=255');
    expect(e[1]).toBe('255 ÷ 2 = 127 r 1  |  127 ÷ 2 = 63 r 1  |  63 ÷ 2 = 31 r 1  |  31 ÷ 2 = 15 r 1  |  15 ÷ 2 = 7 r 1  |  7 ÷ 2 = 3 r 1  |  3 ÷ 2 = 1 r 1  |  1 ÷ 2 = 0 r 1');
    expect(e[2]).toBe('FF (Hex) = 11111111 (Binary)');
    expect(e[3]).toBe('1111 1111');
  });
  it('1010 AND 0110 = 0010', () => {
    const e = exprs(binaryHex, { mode: 'Calculate', base: 'Binary', operation: 'AND', value1: '1010', value2: '0110', bitWidth: '8' });
    expect(e[1]).toBe('0000 1010₂ & 0000 0110₂ = 0000 0010₂');
    expect(e[2]).toBe('Result (8-bit Binary) = 10');
  });
  it('100 + 50 wraps to -106 at 8 bits and flags the overflow', () => {
    const s = steps(binaryHex, { mode: 'Calculate', base: 'Decimal', operation: 'Add', value1: '100', value2: '50', bitWidth: '8' });
    expect(s[1].expr).toBe('100 + 50 = 150  |  (wrapped to 8-bit: -106)');
    expect(s[2].expr).toBe('Result (8-bit Decimal) = -106');
    expect(s[2].note).toMatch(/Signed overflow/);
  });
  it('an invalid digit returns []', () => {
    expect(steps(binaryHex, { mode: 'Convert', fromBase: 'Hex', toBase: 'Binary', value: 'G1', bitWidth: '0' })).toEqual([]);
  });
});

describe('common-denominator', () => {
  it('1/2, 1/3, 1/4 over 12', () => {
    expect(exprs(commonDenominator, { numerators: '1, 1, 1', denominators: '2, 3, 4' })).toEqual([
      'Denominators: [2, 3, 4]',
      'LCM(2, 3) = 2 × 3 / GCD(2, 3) = 2 × 3 / 1 = 6',
      'LCM(6, 4) = 6 × 4 / GCD(6, 4) = 6 × 4 / 2 = 12',
      'LCD = LCM of all denominators = 12',
      '1/2 = 6/12 (× 6)  |  1/3 = 4/12 (× 4)  |  1/4 = 3/12 (× 3)',
    ]);
  });
  it('3/4 and 5/6 over 12', () => {
    expect(exprs(commonDenominator, { numerators: '3, 5', denominators: '4, 6' })).toEqual([
      'Denominators: [4, 6]',
      'LCM(4, 6) = 4 × 6 / GCD(4, 6) = 4 × 6 / 2 = 12',
      'LCD = LCM of all denominators = 12',
      '3/4 = 9/12 (× 3)  |  5/6 = 10/12 (× 2)',
    ]);
  });
  it('decimals, mismatched counts and blank return []', () => {
    expect(steps(commonDenominator, { numerators: '1.5', denominators: '2' })).toEqual([]);
    expect(steps(commonDenominator, { numerators: '1, 2', denominators: '3, 4, 5' })).toEqual([]);
    expect(steps(commonDenominator, { numerators: '', denominators: '' })).toEqual([]);
  });
});

describe('confidence-interval', () => {
  it('n = 10, s = 10, mean 50, 95% (t, df 9)', () => {
    expect(exprs(confidenceInterval, { sampleMean: '50', sampleSize: '10', stddev: '10', sdType: 'sample', confidence: '95' })).toEqual([
      '10 ÷ √10 = 3.162278',
      'Critical Value (t, df = 9) = 2.2622 (95% confidence)',
      '2.2622 × 3.162278 = 7.153569',
      '50 ± 7.153569 = [42.846431, 57.153569]',
    ]);
  });
  it('known sigma uses z = 1.9600', () => {
    expect(exprs(confidenceInterval, { sampleMean: '50', sampleSize: '100', stddev: '10', sdType: 'population', confidence: '95' })).toEqual([
      '10 ÷ √100 = 1',
      'Critical Value (Z) = 1.9600 (95% confidence)',
      '1.9600 × 1 = 1.959964',
      '50 ± 1.959964 = [48.040036, 51.959964]',
    ]);
  });
  it('n = 20, s = 15, mean 100, 99% (t, df 19)', () => {
    expect(exprs(confidenceInterval, { sampleMean: '100', sampleSize: '20', stddev: '15', sdType: 'sample', confidence: '99' })).toEqual([
      '15 ÷ √20 = 3.354102',
      'Critical Value (t, df = 19) = 2.8609 (99% confidence)',
      '2.8609 × 3.354102 = 9.595866',
      '100 ± 9.595866 = [90.404134, 109.595866]',
    ]);
  });
  it('n = 1 with a sample s, and a zero deviation, return []', () => {
    expect(steps(confidenceInterval, { sampleMean: '50', sampleSize: '1', stddev: '10', sdType: 'sample', confidence: '95' })).toEqual([]);
    expect(steps(confidenceInterval, { sampleMean: '50', sampleSize: '10', stddev: '0', sdType: 'sample', confidence: '95' })).toEqual([]);
  });
});

describe('conversion', () => {
  it('5 lb to kg through grams', () => {
    expect(exprs(conversion, { category: 'weight', fromValue: '5', fromUnit_weight: 'pound', toUnit_weight: 'kilogram' })).toEqual([
      '5 lb × 453.59237 g/lb = 2267.96185 g',
      '2267.96185 g ÷ 1000 g/kg = 2.267962 kg',
    ]);
  });
  it('1 mile to km through metres', () => {
    expect(exprs(conversion, { category: 'length', fromValue: '1', fromUnit_length: 'mile', toUnit_length: 'kilometer' })).toEqual([
      '1 mi × 1609.344 m/mi = 1609.344 m',
      '1609.344 m ÷ 1000 m/km = 1.609344 km',
    ]);
  });
  it('100 F to K goes through Celsius', () => {
    expect(exprs(conversion, { category: 'temperature', fromValue: '100', fromUnit_temperature: 'fahrenheit', toUnit_temperature: 'kelvin' })).toEqual([
      '(100 − 32) × 5 ÷ 9 = 37.77777778 °C',
      '37.77777778 + 273.15 = 310.927778 K',
    ]);
  });
  it('0 C to F needs one step; same unit needs none', () => {
    expect(exprs(conversion, { category: 'temperature', fromValue: '0', fromUnit_temperature: 'celsius', toUnit_temperature: 'fahrenheit' })).toEqual(['0 × 9 ÷ 5 + 32 = 32 °F']);
    expect(steps(conversion, { category: 'weight', fromValue: '3', fromUnit_weight: 'gram', toUnit_weight: 'gram' })[0].label).toBe('Same unit');
  });
  it('10 km/h to mph: 2.77777778 m/s, then 6.213712', () => {
    const e = exprs(conversion, { category: 'speed', fromValue: '10', fromUnit_speed: 'kmph', toUnit_speed: 'mph' });
    expect(e[0]).toBe('10 km/h × 0.2777777778 m/s/km/h = 2.77777778 m/s');
    expect(e[1]).toBe('2.77777778 m/s ÷ 0.44704 m/s/mph = 6.213712 mph');
  });
  it('currency (static indicative rates) and missing units return []', () => {
    expect(steps(conversion, { category: 'currency', fromValue: '10', fromUnit_currency: 'usd', toUnit_currency: 'eur' })).toEqual([]);
    expect(steps(conversion, { category: 'weight', fromValue: '1' })).toEqual([]);
  });
});

describe('correlation-calculator', () => {
  it('x = 1..5, y = 2,4,5,4,5: r = 6 / sqrt(60) = 0.7746, p = 0.1240', () => {
    expect(exprs(correlation, { xValues: '1,2,3,4,5', yValues: '2,4,5,4,5' })).toEqual([
      'x̄ = 3,  ȳ = 4  (n = 5)',
      'Sxy = Σ(x − x̄)(y − ȳ) = 6,  Sxx = Σ(x − x̄)² = 10,  Syy = Σ(y − ȳ)² = 6',
      'r = 6 ÷ √(10 × 6) = 0.7746',
      'r² = 0.6',
      'p-value (two-tailed t-test, df = 3) = 0.1240',
    ]);
  });
  it('six pairs: Sxy 16, Sxx 17.5, Syy 23.33, r = 0.7918, r² = 0.6269, p = 0.0605', () => {
    const e = exprs(correlation, { xValues: '1,2,3,4,5,6', yValues: '2,1,4,3,7,5' });
    expect(e[0]).toBe('x̄ = 3.5,  ȳ = 3.666666667  (n = 6)');
    expect(e[1]).toBe('Sxy = Σ(x − x̄)(y − ȳ) = 16,  Sxx = Σ(x − x̄)² = 17.5,  Syy = Σ(y − ȳ)² = 23.33333333');
    expect(e[2]).toBe('r = 16 ÷ √(17.5 × 23.33333333) = 0.7918');
    expect(e[3]).toBe('r² = 0.6269');
    expect(e[4]).toBe('p-value (two-tailed t-test, df = 4) = 0.0605');
  });
  it('a constant variable, too few pairs and mismatched lengths return []', () => {
    expect(steps(correlation, { xValues: '1,2,3', yValues: '5,5,5' })).toEqual([]);
    expect(steps(correlation, { xValues: '1,2', yValues: '3,4' })).toEqual([]);
    expect(steps(correlation, { xValues: '1,2,3', yValues: '3,4' })).toEqual([]);
  });
});

describe('density', () => {
  it('10 lb in 5 L: 907.18 kg/m3', () => {
    expect(exprs(density, { mode: 'calcDensity', mass: '10', massUnit: 'lb', volume: '5', volumeUnit: 'L' })).toEqual([
      '10 lb = 4.5359237 kg',
      '5 L = 0.005 m³',
      'ρ = 4.5359237 kg ÷ 0.005 m³ = 907.18474 kg/m³',
      '907.18474 kg/m³ = 0.90718474 g/cm³ = 56.63369318 lbs/ft³',
    ]);
  });
  it('mass of 500 cm3 at 2.7 g/cm3 = 1.35 kg', () => {
    expect(exprs(density, { mode: 'calcMass', density: '2.7', densityUnit: 'g/cm3', volume: '500', volumeUnit: 'cm3' })).toEqual([
      '500 cm3 = 0.0005 m³',
      '2.7 g/cm3 = 2700 kg/m³',
      'm = 2700 kg/m³ × 0.0005 m³ = 1.35 kg',
      '1.35 kg = 1350 g = 2.976240539 lb',
    ]);
  });
  it('volume of 1000 kg at 1000 kg/m3 = 1 m3 with no conversions', () => {
    expect(exprs(density, { mode: 'calcVolume', mass: '1000', massUnit: 'kg', density: '1000', densityUnit: 'kg/m3' })).toEqual([
      'V = 1000 kg ÷ 1000 kg/m³ = 1 m³',
      '1 m³ = 1000 L = 1000000 mL = 35.31466672 ft³',
    ]);
  });
  it('zero volume and blank return []', () => {
    expect(steps(density, { mode: 'calcDensity', mass: '10', massUnit: 'kg', volume: '0', volumeUnit: 'm3' })).toEqual([]);
  });
});

describe('dew-point', () => {
  it('75 F at 60%: dew point 15.6 C = 60.2 F', () => {
    expect(exprs(dewPoint, { temperature: '75', humidity: '60' })).toEqual([
      'T = (75 − 32) × 5 ÷ 9 = 23.8889°C',
      'γ = 17.27 × 23.8889 ÷ (237.7 + 23.8889) + ln(60 ÷ 100) = 1.0663',
      '237.7 × 1.0663 ÷ (17.27 − 1.0663) = 15.6°C',
      '15.6°C × 9 ÷ 5 + 32 = 60.2°F',
      '60.2°F → Slightly humid',
    ]);
  });
  it('86 F at 40%: 30 C, gamma 1.0191, dew point 14.9 C = 58.8 F', () => {
    const e = exprs(dewPoint, { temperature: '86', humidity: '40' });
    expect(e[0]).toBe('T = (86 − 32) × 5 ÷ 9 = 30°C');
    expect(e[1]).toBe('γ = 17.27 × 30 ÷ (237.7 + 30) + ln(40 ÷ 100) = 1.0191');
    expect(e[3]).toBe('14.9°C × 9 ÷ 5 + 32 = 58.8°F');
    expect(e[4]).toBe('58.8°F → Comfortable');
  });
  it('0% and above-100% humidity, and blank return []', () => {
    expect(steps(dewPoint, { temperature: '70', humidity: '0' })).toEqual([]);
    expect(steps(dewPoint, { temperature: '70', humidity: '101' })).toEqual([]);
  });
});

describe('edpi', () => {
  it('800 DPI x 2.0 in CS:GO: 1600 eDPI, 26.0 cm per turn', () => {
    expect(exprs(edpi, { mouseDpi: '800', sensitivity: '2', currentGame: 'CS:GO', targetGame: '' })).toEqual([
      '800 × 2 = 1600',
      '360 × 2.54 ÷ (800 × 2 × 0.022) = 26.0 cm (10.2 in)',
      '360° ÷ cm per turn = 13.86 deg/cm',
    ]);
  });
  it('Valorant 0.35 to CS:GO = 1.1136', () => {
    expect(exprs(edpi, { mouseDpi: '800', sensitivity: '0.35', currentGame: 'Valorant', targetGame: 'CS:GO' })).toEqual([
      '800 × 0.35 = 280',
      '360 × 2.54 ÷ (800 × 0.35 × 0.07) = 46.7 cm (18.4 in)',
      '360° ÷ cm per turn = 7.72 deg/cm',
      '0.35 × 1 ÷ 0.3143 = 1.1136',
    ]);
  });
  it('CS:GO 1.1 to Overwatch = 3.6667', () => {
    const e = exprs(edpi, { mouseDpi: '400', sensitivity: '1.1', currentGame: 'CS:GO', targetGame: 'Overwatch' });
    expect(e[3]).toBe('1.1 × 3.3333 ÷ 1 = 3.6667');
  });
  it('zero DPI returns []', () => {
    expect(steps(edpi, { mouseDpi: '0', sensitivity: '2', currentGame: 'CS:GO' })).toEqual([]);
  });
});

describe('electricity-cost', () => {
  it('a 65 W laptop charger, 8 h/day, 30 days at $0.2', () => {
    expect(exprs(electricity, { preset: 'laptop', wattage: '', hoursPerDay: '8', days: '30', costPerKwh: '0.2', applianceCount: '1' })).toEqual([
      '65 W × 8 h ÷ 1,000 = 0.52 kWh',
      '0.52 kWh × 30 = 15.6 kWh',
      '15.6 kWh × $0.2/kWh = $3.12',
      '0.52 kWh × 365 × $0.2/kWh = $37.96',
    ]);
  });
  it('ten 10 W bulbs, 5 h, one week at $0.15', () => {
    expect(exprs(electricity, { wattage: '10', hoursPerDay: '5', days: '7', costPerKwh: '0.15', applianceCount: '10' })).toEqual([
      '10 W × 5 h ÷ 1,000 × 10 appliances = 0.5 kWh',
      '0.5 kWh × 7 = 3.5 kWh',
      '3.5 kWh × $0.15/kWh = $0.53',
      '0.5 kWh × 365 × $0.15/kWh = $27.38',
    ]);
  });
  it('a single day is singular', () => {
    expect(steps(electricity, { wattage: '100', hoursPerDay: '1', days: '1', costPerKwh: '0.1' })[1].label).toBe('Energy over 1 day');
  });
  it('more than 24 hours a day and blank return []', () => {
    expect(steps(electricity, { wattage: '100', hoursPerDay: '25', days: '1', costPerKwh: '0.1' })).toEqual([]);
  });
});

describe('engine-horsepower', () => {
  it('350 lb-ft at 5500 rpm = 366.5 HP = 273.31 kW', () => {
    expect(exprs(engineHp, { torque: '350', rpm: '5500', unitSystem: 'imperial' })).toEqual([
      '350 × 5500 ÷ 5252.11 = 366.5 HP',
      '366.5 HP × 0.7457 = 273.31 kW',
      'Performance',
    ]);
  });
  it('400 Nm at 6000 rpm = 251.33 kW = 337.0 HP', () => {
    expect(exprs(engineHp, { torque: '400', rpm: '6000', unitSystem: 'metric' })).toEqual([
      '400 × 6000 ÷ 9549.30 = 251.33 kW',
      '251.33 kW ÷ 0.7457 = 337.0 HP',
      'Mid-Range',
    ]);
  });
  it('rpm beyond 20,000 and zero torque return []', () => {
    expect(steps(engineHp, { torque: '300', rpm: '25000', unitSystem: 'imperial' })).toEqual([]);
    expect(steps(engineHp, { torque: '0', rpm: '5000', unitSystem: 'imperial' })).toEqual([]);
  });
});

describe('equation-solver', () => {
  it('linear 3x + 9 = 0 gives x = -3', () => {
    expect(exprs(equationSolver, { equationType: 'linear', a: '3', b: '9' })).toEqual(['3x + 9 = 0  →  3x = -9', 'x = -9 ÷ 3 = -3']);
  });
  it('quadratic reuses the quadratic calculator worked solution', () => {
    const v = { equationType: 'quadratic', a: '1', b: '-5', c: '6' };
    expect(steps(equationSolver, v)).toEqual(steps(quadratic, v));
    expect(exprs(equationSolver, v)[1]).toContain('= 1');
  });
  it('cubic (x-1)(x-2)(x-3): roots 1, 2, 3', () => {
    const e = exprs(equationSolver, { equationType: 'cubic', a: '1', b: '-6', c: '11', d: '-6' });
    expect(e[0]).toBe('x³ − 6x² + 11x − 6 = 0');
    expect(e[1]).toBe('x₁ = 1,  x₂ = 2,  x₃ = 3');
    expect(e[2]).toBe('3 real roots');
  });
  it('quartic (x-1)(x+2)(x-3)(x+4): roots -4, -2, 1, 3', () => {
    const e = exprs(equationSolver, { equationType: 'quartic', a: '1', b: '2', c: '-13', d: '-14', e: '24' });
    for (const r of ['-4', '-2', '1', '3']) expect(e[1]).toContain(`= ${r}`);
    expect(e[2]).toBe('4 real roots');
  });
  it('x³ + x has one real and a complex pair', () => {
    expect(exprs(equationSolver, { equationType: 'cubic', a: '1', b: '0', c: '1', d: '0' })[2]).toBe('1 real root + 2 complex roots (1 conjugate pair)');
  });
  it('a leading zero returns []', () => {
    expect(steps(equationSolver, { equationType: 'linear', a: '0', b: '5' })).toEqual([]);
    expect(steps(equationSolver, { equationType: 'quadratic', a: '0', b: '1', c: '1' })).toEqual([]);
    expect(steps(equationSolver, { equationType: 'cubic', a: '0', b: '1', c: '1', d: '1' })).toEqual([]);
  });
});

describe('factor', () => {
  it('24 has 8 factors and sums to 60 (abundant)', () => {
    const s = steps(factor, { number: '24' });
    expect(s.map((x) => x.expr)).toEqual([
      '24 = 2^3 × 3',
      '(3 + 1) × (1 + 1) = 8',
      '1 × 24,  2 × 12,  3 × 8,  4 × 6',
      'Sum of factors = 60',
    ]);
    expect(s[3].note).toBe('The proper factors (all except 24 itself) add up to 36, so 24 is an abundant number.');
  });
  it('28 is perfect (sum 56)', () => {
    const s = steps(factor, { number: '28' });
    expect(s[0].expr).toBe('28 = 2^2 × 7');
    expect(s[1].expr).toBe('(2 + 1) × (1 + 1) = 6');
    expect(s[3].expr).toBe('Sum of factors = 56');
    expect(s[3].note).toMatch(/28 is a perfect number/);
  });
  it('97 is prime; 360 has 24 factors; 1 has no prime step', () => {
    expect(exprs(factor, { number: '97' })).toEqual(['97 = 97', '(1 + 1) = 2', '1 × 97', 'Sum of factors = 98']);
    const e = exprs(factor, { number: '360' });
    expect(e[1]).toBe('(3 + 1) × (2 + 1) × (1 + 1) = 24');
    expect(e[2].endsWith(',  …')).toBe(true);
    expect(exprs(factor, { number: '1' })).toHaveLength(3);
  });
  it('zero, decimals and blank return []', () => {
    expect(steps(factor, { number: '0' })).toEqual([]);
    expect(steps(factor, { number: '1.5' })).toEqual([]);
    expect(steps(factor, { number: '' })).toEqual([]);
  });
});

describe('factoring-calculator', () => {
  it('x² - 5x + 6 = (x - 2)(x - 3) with p = -3, q = -2', () => {
    const s = steps(factoring, { a: '1', b: '-5', c: '6' });
    expect(s[0]).toEqual({ label: 'Identify coefficients', expr: 'a = 1, b = -5, c = 6' });
    expect(s[1]).toEqual({ label: 'Multiply a by c', expr: 'a × c = 1 × 6 = 6' });
    expect(s[2].expr).toBe('p + q = -5,  p × q = 6;  p = -3, q = -2 (since -3 + -2 = -5 and -3 × -2 = 6)');
    expect(s[s.length - 1].expr).toContain('(x − 2)(x − 3)');
    expect(s[s.length - 1].expr).toContain('Roots: x = 2, x = 3');
  });
  it('6x² + 7x - 3 = (2x + 3)(3x - 1), roots -1.5 and 1/3', () => {
    const s = steps(factoring, { a: '6', b: '7', c: '-3' });
    expect(s[1].expr).toBe('a × c = 6 × -3 = -18');
    expect(s[2].expr).toContain('p = -2, q = 9');
    expect(s[s.length - 1].expr).toContain('(2x + 3)(3x − 1)');
    expect(s[s.length - 1].expr).toContain('Roots: x = -1.5, x = 1/3');
  });
  it('x² + x + 1 has complex roots -0.5 +/- 0.866025i', () => {
    const last = steps(factoring, { a: '1', b: '1', c: '1' }).pop()!;
    expect(last.expr).toContain('x₁ = -0.5 + 0.866025i');
    expect(last.expr).toContain('x₂ = -0.5 − 0.866025i');
  });
  it('x² + x - 1 does not factor over the rationals: roots -1.618034 and 0.618034', () => {
    const s = steps(factoring, { a: '1', b: '1', c: '-1' });
    expect(s[1].expr).toContain('x₁ = -1.618034, x₂ = 0.618034');
    expect(s[2].expr).toBe('(x + 1.618034)(x − 0.618034)');
  });
  it('a = 0 and blank return []', () => {
    expect(steps(factoring, { a: '0', b: '1', c: '1' })).toEqual([]);
    expect(steps(factoring, { a: '', b: '', c: '' })).toEqual([]);
  });
});

describe('fibonacci', () => {
  it('F(10) = 55 and the first ten terms sum to F(12) - 1 = 143', () => {
    expect(exprs(fibonacci, { n: '10' })).toEqual([
      '1, 1, 2, 3, 5, 8, 13, 21, 34, 55',
      'F(10) = 34 + 21 = 55',
      'F(10) = round(φ^10 ÷ √5) = 55',
      '143 = 144 − 1',
    ]);
  });
  it('F(100) = 354224848179261915075 exactly', () => {
    const e = exprs(fibonacci, { n: '100' });
    expect(e[0].endsWith(', …')).toBe(true);
    expect(e[1]).toBe('F(100) = 218922995834555169026 + 135301852344706746049 = 354224848179261915075');
    expect(e[2]).toBe('F(100) = round(φ^100 ÷ √5) = 354224848179261915075');
    expect(e[3]).toBe('927372692193078999175 = 927372692193078999176 − 1');
  });
  it('the first two terms are both 1', () => {
    expect(exprs(fibonacci, { n: '2' })).toEqual(['1, 1', 'F(2) = 1', 'F(2) = round(φ^2 ÷ √5) = 1', '2 = 3 − 1']);
    expect(exprs(fibonacci, { n: '1' })[3]).toBe('1 = 2 − 1');
  });
  it('0, 101, text and decimals return []', () => {
    for (const n of ['0', '101', 'abc', '2.5']) expect(steps(fibonacci, { n })).toEqual([]);
  });
});

describe('fuel-cost', () => {
  it('300 mi at 25 mpg, $3.50, two trips = $84', () => {
    expect(exprs(fuelCost, { distance: '300', distanceUnit: 'mi', fuelEfficiency: '25', efficiencyUnit: 'mpg', fuelPrice: '3.5', priceUnit: 'gallon', vehicleType: 'gas', roundTrips: '2' })).toEqual([
      '300 ÷ 25 = 12 gal',
      '12 gal × $3.50 = $42.00',
      '$42.00 × 2 = $84.00',
      '$84.00 (24.0 gallons, $0.140 per mile)',
    ]);
  });
  it('100 km at 8 L/100 km with $1.80 per litre = $14.40', () => {
    expect(exprs(fuelCost, { distance: '100', distanceUnit: 'km', fuelEfficiency: '8', efficiencyUnit: 'l100', fuelPrice: '1.8', priceUnit: 'liter', vehicleType: 'gas', roundTrips: '1' })).toEqual([
      '100 km ÷ 1.609344 = 62.137119 mi',
      '235.215 ÷ 8 = 29.401823 MPG',
      '1.8 × 3.785411784 = $6.81 per gallon',
      '62.137119 ÷ 29.401823 = 2.113376 gal',
      '2.113376 gal × $6.81 = $14.40',
      '$14.40 (8.0 liters, $0.232 per mile)',
    ]);
  });
  it('200 mi in an EV at 3.5 mi/kWh and $0.13 = $7.43', () => {
    const e = exprs(fuelCost, { distance: '200', distanceUnit: 'mi', vehicleType: 'ev', evEfficiency: '3.5', electricityRate: '0.13', roundTrips: '1' });
    expect(e).toEqual([
      '200 ÷ 3.5 = 57.142857 kWh',
      '57.142857 kWh × $0.13 = $7.43',
      '$7.43 (57.1 kWh, $0.037 per mile)',
    ]);
  });
  it('a 60 mi plug-in hybrid trip: 25 mi on battery, 35 mi on fuel = $4.06', () => {
    const e = exprs(fuelCost, { distance: '60', distanceUnit: 'mi', vehicleType: 'phev', evEfficiency: '3', evRange: '25', electricityRate: '0.12', fuelEfficiency: '40', efficiencyUnit: 'mpg', fuelPrice: '3.5', priceUnit: 'gallon', roundTrips: '1' });
    expect(e[0]).toBe('25 mi electric (limited by the 25 mi range), 35 mi on fuel');
    expect(e[1]).toBe('25 ÷ 3 = 8.333333 kWh');
    expect(e[2]).toBe('35 ÷ 40 = 0.875 gal');
    expect(e[3]).toBe('0.875 gal × $3.50 + 8.333333 kWh × $0.12 = $4.06');
  });
  it('zero mpg, fractional trips and blank return []', () => {
    expect(steps(fuelCost, { distance: '100', fuelEfficiency: '0', fuelPrice: '3', vehicleType: 'gas' })).toEqual([]);
    expect(steps(fuelCost, { distance: '100', fuelEfficiency: '25', fuelPrice: '3', vehicleType: 'gas', roundTrips: '1.5' })).toEqual([]);
  });
});

describe('gas-mileage', () => {
  it('odometer 50000 to 50300 on 12 gal at $3.50: 25 MPG', () => {
    expect(exprs(gasMileage, { mode: 'odometer', odometerStart: '50000', odometerEnd: '50300', distanceUnit: 'mi', fuelAdded: '12', fuelUnit: 'gal', pricePerUnit: '3.5', priceCurrency: 'USD' })).toEqual([
      '50300 − 50000 = 300 mi',
      '300 ÷ 12 = 25.0 MPG',
      '235.215 ÷ 25 = 9.4 L/100km',
      '12 × 3.5 ÷ 300 = $0.140/mile',
      'At 12,000 mi/year: $1,680.00',
    ]);
  });
  it('480 km on 36 L at EUR 1.70: 31.4 MPG, 7.5 L/100 km', () => {
    expect(exprs(gasMileage, { mode: 'distance', tripDistance: '480', distanceUnit: 'km', fuelAdded: '36', fuelUnit: 'L', pricePerUnit: '1.7', priceCurrency: 'EUR' })).toEqual([
      '480 km ÷ 1.609344 = 298.258172 mi',
      '36 L ÷ 3.785411784 = 9.510194 gal',
      '298.258172 ÷ 9.510194 = 31.4 MPG',
      '235.215 ÷ 31.361944 = 7.5 L/100km',
      '36 × 1.7 ÷ 298.258172 = €0.205/mile',
      'At 12,000 mi/year: €2,462.30',
    ]);
  });
  it('an odometer that did not move and blank fuel return []', () => {
    expect(steps(gasMileage, { mode: 'odometer', odometerStart: '500', odometerEnd: '500', fuelAdded: '10' })).toEqual([]);
    expect(steps(gasMileage, { mode: 'distance', tripDistance: '100', fuelAdded: '' })).toEqual([]);
  });
});

describe('gdp', () => {
  it('nominal: 12 + 4 + 3 + (2.5 - 3.2) = $18.30 trillion', () => {
    expect(exprs(gdp, { mode: 'nominal', consumption: '12000000000000', investment: '4000000000000', governmentSpending: '3000000000000', exports: '2500000000000', imports: '3200000000000' })).toEqual([
      '$2.50 trillion − $3.20 trillion = -$700.00 billion',
      '$12.00 trillion + $4.00 trillion + $3.00 trillion + (-$700.00 billion) = $18.30 trillion',
      'Consumption 65.6%,  investment 21.9%,  government 16.4%,  net exports -3.8%',
    ]);
  });
  it('real GDP with a deflator of 110 = $16.64 trillion', () => {
    const e = exprs(gdp, { mode: 'real', consumption: '12000000000000', investment: '4000000000000', governmentSpending: '3000000000000', exports: '2500000000000', imports: '3200000000000', gdpDeflator: '110' });
    expect(e[2]).toBe('$18.30 trillion ÷ (110 ÷ 100) = $16.64 trillion');
  });
  it('a missing component and blank return []', () => {
    expect(steps(gdp, { mode: 'nominal', consumption: '1000' })).toEqual([]);
  });
});

describe('golf-handicap', () => {
  const rounds5 = '85, 72.5, 130\n92, 74.0, 140\n80, 71.0, 125\n88, 72.0, 128\n90, 73.0, 131';
  it('five rounds: lowest 1 of 5 is 8.1, course handicap 8', () => {
    const s = steps(golf, { rounds: rounds5, numRounds: '20', courseSlope: '125', courseRating: '71.4', coursePar: '72' });
    expect(s[0].expr).toBe(
      '#1: (113 ÷ 130) × (85 − 72.5) = 10.9  |  #2: (113 ÷ 140) × (92 − 74) = 14.5  |  #3: (113 ÷ 125) × (80 − 71) = 8.1  |  #4: (113 ÷ 128) × (88 − 72) = 14.1  |  #5: (113 ÷ 131) × (90 − 73) = 14.7',
    );
    expect(s[1].label).toBe('Pick the 1 lowest of your 5 differentials');
    expect(s[1].expr).toBe('8.1');
    expect(s[2].expr).toBe('(8.1) ÷ 1 = 8.1 → Handicap Index 8.1');
    expect(s[3].expr).toBe('8.1 × (125 ÷ 113) + (71.4 − 72) = 8');
  });
  it('eight rounds: best two (8.1, 10.9) average 9.5; neutral course rounds to 10', () => {
    const r8 = `${rounds5}\n87, 71.5, 127\n95, 74.5, 138\n83, 70.5, 120`;
    const s = steps(golf, { rounds: r8, numRounds: '20' });
    expect(s[0].expr.endsWith('|  … 2 more rounds')).toBe(true);
    expect(s[1].expr).toBe('8.1, 10.9');
    expect(s[2].expr).toBe('(8.1 + 10.9) ÷ 2 = 9.5 → Handicap Index 9.5');
    expect(s[3].expr).toBe('9.5 rounds to 10');
  });
  it('three rounds take the best one and subtract 2.0', () => {
    const s = steps(golf, { rounds: '85, 72.5, 130\n92, 74.0, 140\n80, 71.0, 125', numRounds: '20' });
    expect(s[2].expr).toBe('(8.1) ÷ 1 = 8.1  − 2 → Handicap Index 6.1');
  });
  it('six rounds take the best two and subtract 1.0', () => {
    const s = steps(golf, { rounds: `${rounds5}\n87, 71.5, 127`, numRounds: '20' });
    expect(s[2].expr).toBe('(8.1 + 10.9) ÷ 2 = 9.5  − 1 → Handicap Index 8.5');
  });
  it('a PCC of 1 enters the differential: 113/130 x 11.5 = 10.0', () => {
    const s = steps(golf, { rounds: '85, 72.5, 130, 1\n92, 74.0, 140\n80, 71.0, 125', numRounds: '20' });
    expect(s[0].expr.startsWith('#1: (113 ÷ 130) × (85 − 72.5 − 1) = 10  |')).toBe(true);
  });
  it('fewer than three rounds and blank return []', () => {
    expect(steps(golf, { rounds: '85, 72.5, 130\n92, 74.0, 140', numRounds: '20' })).toEqual([]);
    expect(steps(golf, { rounds: '', numRounds: '20' })).toEqual([]);
  });
});

describe('gpa', () => {
  it('four courses: 38.9 points over 12 credits = 3.24', () => {
    expect(exprs(gpa, { mode: 'calculate', scale: 'standard', courses: 'Calc,A,4\nBio,B+,3\nHist,B,3\nArt,C,2' })).toEqual([
      'A: 4 points × 4 credits = 16  |  B+: 3.3 points × 3 credits = 9.9  |  B: 3 points × 3 credits = 9  |  C: 2 points × 2 credits = 4',
      'Grade points = 38.90,  credits = 12',
      '38.90 ÷ 12 = 3.24',
    ]);
  });
  it('thirds scale: A- 3.67 and B+ 3.33 at 3 credits = 3.50', () => {
    expect(exprs(gpa, { mode: 'calculate', scale: 'thirds', courses: 'A,A-,3\nB,B+,3' })).toEqual([
      'A-: 3.67 points × 3 credits = 11.01  |  B+: 3.33 points × 3 credits = 9.99',
      'Grade points = 21.00,  credits = 6',
      '21.00 ÷ 6 = 3.50',
    ]);
  });
  it('an AP A counts 5.0: weighted 4.00 against unweighted 3.50', () => {
    const s = steps(gpa, { mode: 'calculate', scale: 'standard', courses: 'Phys,A,4,AP\nEng,B,4' });
    expect(s[0].expr).toBe('A: 5 points × 4 credits = 20  |  B: 3 points × 4 credits = 12');
    expect(s[2].expr).toBe('32.00 ÷ 8 = 4.00');
    expect(s[2].note).toBe('Without the honors / AP bonus the GPA is 3.50.');
  });
  it('target mode: 3.2 over 60 credits to reach 3.5 with 30 left needs 4.10 (out of reach)', () => {
    const s = steps(gpa, { mode: 'target', scale: 'standard', currentGPA: '3.2', creditsCompleted: '60', targetGPA: '3.5', remainingCredits: '30' });
    expect(s.map((x) => x.expr)).toEqual(['3.5 × (60 + 30) = 315', '315 − 3.2 × 60 = 123 points still to earn', '123 ÷ 30 = 4.10']);
    expect(s[2].note).toMatch(/not enough/);
  });
  it('target mode: 3.0 over 30 credits to reach 3.4 over 60 needs 3.80', () => {
    const s = steps(gpa, { mode: 'target', scale: 'standard', currentGPA: '3', creditsCompleted: '30', targetGPA: '3.4', remainingCredits: '30' });
    expect(s.map((x) => x.expr)).toEqual(['3.4 × (30 + 30) = 204', '204 − 3 × 30 = 114 points still to earn', '114 ÷ 30 = 3.80']);
    expect(s[2].note).toBe('The lowest grade per course that gets you there is A.');
  });
  it('a secured target (3.9 over 100 credits, goal 3.0) needs -6.00', () => {
    const s = steps(gpa, { mode: 'target', scale: 'standard', currentGPA: '3.9', creditsCompleted: '100', targetGPA: '3', remainingCredits: '10' });
    expect(s[2].expr).toBe('-60 ÷ 10 = -6.00');
    expect(s[2].note).toBe('Your target is already secured.');
  });
  it('no credits left, an unknown grade and blank courses return []', () => {
    expect(steps(gpa, { mode: 'target', scale: 'standard', currentGPA: '3', creditsCompleted: '30', targetGPA: '3.4', remainingCredits: '0' })).toEqual([]);
    expect(steps(gpa, { mode: 'calculate', scale: 'standard', courses: 'X,Z,3' })).toEqual([]);
    expect(steps(gpa, { mode: 'calculate', scale: 'standard', courses: '' })).toEqual([]);
  });
});

describe('grade', () => {
  it('85% now, want 90%, final worth 20%: needs 110%', () => {
    const s = steps(grade, { currentGrade: '85', desiredGrade: '90', examWeight: '20' });
    expect(s.map((x) => x.expr)).toEqual(['85% × (100% − 20%) = 68%', '90% − 68% = 22%', '22% ÷ 20% = 110%']);
    expect(s[2].note).toBe('Over 100%: even a perfect final only reaches 88%.');
  });
  it('90 / 85 / 30: banked 63, needs 22 / 30 = 73.33%', () => {
    expect(exprs(grade, { currentGrade: '90', desiredGrade: '85', examWeight: '30' })).toEqual(['90% × (100% − 30%) = 63%', '85% − 63% = 22%', '22% ÷ 30% = 73.33%']);
  });
  it('95 / 90 / 15: banked 80.75, needs 9.25 / 0.15 = 61.67%', () => {
    expect(exprs(grade, { currentGrade: '95', desiredGrade: '90', examWeight: '15' })).toEqual(['95% × (100% − 15%) = 80.75%', '90% − 80.75% = 9.25%', '9.25% ÷ 15% = 61.67%']);
  });
  it('already secured: 100% now, want 70%, final 20% gives -50%', () => {
    const s = steps(grade, { currentGrade: '100', desiredGrade: '70', examWeight: '20' });
    expect(s[2].expr).toBe('-10% ÷ 20% = -50%');
    expect(s[2].note).toMatch(/already reached/);
  });
  it('a zero exam weight and blank return []', () => {
    expect(steps(grade, { currentGrade: '85', desiredGrade: '90', examWeight: '0' })).toEqual([]);
  });
});

describe('gravel', () => {
  it('12 x 10 ft at 3 in of crushed limestone: 1.11 yd3, 1.44 tons, with costs', () => {
    expect(exprs(gravel, { length: '12', width: '10', depth: '3', material: 'crushed-limestone', pricePerYard: '45', pricePerTon: '38' })).toEqual([
      '12 × 10 × (3 ÷ 12) = 30 ft³',
      '30 ÷ 27 = 1.11 cubic yards',
      '1.1111 × 2,600 lb/yd³ ÷ 2,000 = 1.44 tons',
      '12 × 10 = 120 sq ft',
      '1.1111 yd³ × $45 = $50.00',
      '1.44 tons × $38 = $54.89',
    ]);
  });
  it('20 x 10 ft at 4 in of pea gravel: 66.6667 ft3, 2.47 yd3, 3.33 tons', () => {
    const e = exprs(gravel, { length: '20', width: '10', depth: '4', material: 'pea-gravel' });
    expect(e.slice(0, 3)).toEqual(['20 × 10 × (4 ÷ 12) = 66.6667 ft³', '66.6667 ÷ 27 = 2.47 cubic yards', '2.4691 × 2,700 lb/yd³ ÷ 2,000 = 3.33 tons']);
    expect(e).toHaveLength(4);
  });
  it('a zero length and a missing material return []', () => {
    expect(steps(gravel, { length: '0', width: '10', depth: '4', material: 'pea-gravel' })).toEqual([]);
    expect(steps(gravel, { length: '10', width: '10', depth: '4' })).toEqual([]);
  });
});

describe('half-life', () => {
  it('remaining: 80 after 12 at a half-life of 4 is 10 (12.5%)', () => {
    expect(exprs(halfLife, { solveFor: 'remainingQuantity', initialQuantity: '80', halfLife: '4', timeElapsed: '12' })).toEqual([
      '12 ÷ 4 = 3',
      '80 × (½)^3 = 10',
      '10 ÷ 80 = 12.5%',
    ]);
  });
  it('initial: 12.5 left after 18 at a half-life of 6 means 100 at the start', () => {
    expect(exprs(halfLife, { solveFor: 'initialQuantity', remainingQuantity: '12.5', halfLife: '6', timeElapsed: '18' })).toEqual([
      '18 ÷ 6 = 3',
      '12.5 ÷ (½)^3 = 100',
    ]);
  });
  it('half-life: 200 to 50 in 14 means 7', () => {
    expect(exprs(halfLife, { solveFor: 'halfLife', initialQuantity: '200', remainingQuantity: '50', timeElapsed: '14' })).toEqual([
      '200 ÷ 50 = 4',
      '14 × 0.693147 ÷ ln(4) = 14 × 0.693147 ÷ 1.386294 = 7',
    ]);
  });
  it('time: 100 to 10 at a half-life of 5.2 takes 17.27402609 (3.321928095 half-lives)', () => {
    expect(exprs(halfLife, { solveFor: 'timeElapsed', initialQuantity: '100', remainingQuantity: '10', halfLife: '5.2' })).toEqual([
      '100 ÷ 10 = 10',
      '5.2 × ln(10) ÷ 0.693147 = 5.2 × 2.302585 ÷ 0.693147 = 17.27402609',
      '17.27402609 ÷ 5.2 = 3.321928095',
    ]);
  });
  it('a remaining amount above the start and blank return []', () => {
    expect(steps(halfLife, { solveFor: 'halfLife', initialQuantity: '50', remainingQuantity: '60', timeElapsed: '5' })).toEqual([]);
    expect(steps(halfLife, { solveFor: 'timeElapsed' })).toEqual([]);
  });
});

describe('heat-index', () => {
  it('90 F at 60%: simple 91.52, regression 99.68, Extreme Caution', () => {
    const e = exprs(heatIndex, { temperature: '90', humidity: '60' });
    expect(e[0]).toBe('HI = ½ × [T + 61 + 1.2 × (T − 68) + 0.094 × RH] = ½ × [90 + 61 + 1.2 × (90 − 68) + 0.094 × 60] = 91.52°F');
    expect(e[1]).toBe('(91.52 + 90) ÷ 2 = 90.76°F is 80°F or more, so the full regression is needed');
    expect(e[2]).toBe('HI = 99.68°F');
    expect(e[3]).toBe('99.7°F → Extreme Caution');
  });
  it('72 F at 40% stays on the simple formula: 70.78 F', () => {
    const e = exprs(heatIndex, { temperature: '72', humidity: '40' });
    expect(e[0]).toContain('= 70.78°F');
    expect(e[1]).toBe('(70.78 + 72) ÷ 2 = 71.39°F is below 80°F, so the simple value stands');
    expect(e).toHaveLength(3);
    expect(e[2]).toBe('70.8°F → Safe');
  });
  it('95 F at 10% takes the dry-air correction: 90.2 - 0.75 = 89.45', () => {
    const s = steps(heatIndex, { temperature: '95', humidity: '10' });
    expect(s[3].label).toBe('Correct for very dry air (RH under 13%)');
    expect(s[3].expr).toBe('90.2 − 0.75 = 89.45°F');
    expect(s[4].expr).toBe('89.4°F → Caution');
  });
  it('84 F at 90% takes the humid-air correction: 98.04 + 0.3 = 98.34', () => {
    const s = steps(heatIndex, { temperature: '84', humidity: '90' });
    expect(s[3].label).toBe('Correct for very humid air (RH over 85%)');
    expect(s[3].expr).toBe('98.04 + 0.3 = 98.34°F');
  });
  it('100 F at 70% reaches Extreme Danger (142.8 F)', () => {
    expect(steps(heatIndex, { temperature: '100', humidity: '70' }).pop()!.expr).toBe('142.8°F → Extreme Danger');
  });
  it('humidity above 100% and blank return []', () => {
    expect(steps(heatIndex, { temperature: '90', humidity: '101' })).toEqual([]);
  });
});

describe('height', () => {
  it("5'4\" mother, 5'10\" father, boy: 176.7 cm", () => {
    expect(exprs(height, { motherFeet: '5', motherInches: '4', fatherFeet: '5', fatherInches: '10', childGender: 'male' })).toEqual([
      '(64 + 70) in × 2.54 = 340.36 cm',
      '(340.36 + 13) ÷ 2 = 176.7 cm',
      '176.7 cm ÷ 2.54 = 69.6 in = 5\'9.6" (176.7 cm)',
      '176.7 cm ± 8.5 cm → 5\'6.2" to 6\'0.9" (168.2-185.2 cm)',
    ]);
  });
  it('same parents, girl: 163.7 cm', () => {
    const s = steps(height, { motherFeet: '5', motherInches: '4', fatherFeet: '5', fatherInches: '10', childGender: 'female' });
    expect(s[1].label).toBe('Subtract 13 cm for a girl, then take half');
    expect(s[1].expr).toBe('(340.36 − 13) ÷ 2 = 163.7 cm');
  });
  it('5\'9" mother, 6\'2" father, girl: 175.1 cm', () => {
    expect(exprs(height, { motherFeet: '5', motherInches: '9', fatherFeet: '6', fatherInches: '2', childGender: 'female' })[1]).toBe('(363.22 − 13) ÷ 2 = 175.1 cm');
  });
  it('12 inches, an implausible height and blank return []', () => {
    expect(steps(height, { motherFeet: '5', motherInches: '12', fatherFeet: '5', fatherInches: '10', childGender: 'male' })).toEqual([]);
    expect(steps(height, { motherFeet: '2', motherInches: '0', fatherFeet: '5', fatherInches: '10', childGender: 'male' })).toEqual([]);
  });
});

describe('horsepower', () => {
  it('3500 lb, 12.5 s at 110 mph, RWD: 358.9 HP, 294.3 WHP', () => {
    expect(exprs(horsepower, { mode: 'both', vehicleWeight: '3500', quarterMileET: '12.5', trapSpeed: '110', drivetrain: 'rwd' })).toEqual([
      '3500 ÷ (12.5 ÷ 5.825)³ = 354.2 HP',
      '3500 × (110 ÷ 234)³ = 363.6 HP',
      '(354.2 HP + 363.6 HP) ÷ 2 = 358.9 HP',
      '358.9 HP × (1 − 18%) = 294.3 HP',
      '3500 ÷ 358.9 HP = 9.8 lbs/hp',
    ]);
  });
  it('ET only, 3200 lb in 11.0 s, FWD: 475.2 HP', () => {
    expect(exprs(horsepower, { mode: 'et', vehicleWeight: '3200', quarterMileET: '11', drivetrain: 'fwd' })).toEqual([
      '3200 ÷ (11 ÷ 5.825)³ = 475.2 HP',
      '475.2 HP × (1 − 15%) = 403.9 HP',
      '3200 ÷ 475.2 HP = 6.7 lbs/hp',
    ]);
  });
  it('speed only, 3000 lb at 120 mph, AWD: 404.6 HP', () => {
    expect(exprs(horsepower, { mode: 'speed', vehicleWeight: '3000', trapSpeed: '120', drivetrain: 'awd' })).toEqual([
      '3000 × (120 ÷ 234)³ = 404.6 HP',
      '404.6 HP × (1 − 25%) = 303.4 HP',
      '3000 ÷ 404.6 HP = 7.4 lbs/hp',
    ]);
  });
  it('an impossible quarter-mile time and zero weight return []', () => {
    expect(steps(horsepower, { mode: 'et', vehicleWeight: '3000', quarterMileET: '2', drivetrain: 'rwd' })).toEqual([]);
    expect(steps(horsepower, { mode: 'et', vehicleWeight: '0', quarterMileET: '12', drivetrain: 'rwd' })).toEqual([]);
  });
});

describe('inverse-trig', () => {
  it('arcsin 0.5 = pi/6 = 30 degrees', () => {
    expect(exprs(inverseTrig, { function: 'arcsin', value: '0.5' })).toEqual([
      'arcsin(0.5) needs a value in [-1, 1]',
      'arcsin(0.5) = π/6 rad',
      '0.52359878 × 180 ÷ π = 30°',
      'θ = 30° + 360°·k  or  θ = 150° + 360°·k',
    ]);
  });
  it('arccos 0.5 = pi/3 = 60 degrees', () => {
    const e = exprs(inverseTrig, { function: 'arccos', value: '0.5' });
    expect(e[1]).toBe('arccos(0.5) = π/3 rad');
    expect(e[2]).toBe('1.04719755 × 180 ÷ π = 60°');
    expect(e[3]).toBe('θ = ±60° + 360°·k');
  });
  it('arctan 1 = pi/4', () => {
    expect(exprs(inverseTrig, { function: 'arctan', value: '1' })[1]).toBe('arctan(1) = π/4 rad');
  });
  it('non-standard angles show the decimal radians', () => {
    expect(exprs(inverseTrig, { function: 'arcsin', value: '0.3' }).slice(1, 3)).toEqual(['arcsin(0.3) = 0.30469265 rad', '0.30469265 × 180 ÷ π = 17.45760312°']);
    expect(exprs(inverseTrig, { function: 'arccos', value: '-0.25' }).slice(1, 3)).toEqual(['arccos(-0.25) = 1.82347658 rad', '1.82347658 × 180 ÷ π = 104.47751219°']);
    expect(exprs(inverseTrig, { function: 'arctan', value: '2' }).slice(1, 3)).toEqual(['arctan(2) = 1.10714872 rad', '1.10714872 × 180 ÷ π = 63.43494882°']);
  });
  it('a value outside the domain and blank return []', () => {
    expect(steps(inverseTrig, { function: 'arcsin', value: '2' })).toEqual([]);
    expect(steps(inverseTrig, { function: 'arccos', value: '' })).toEqual([]);
  });
});
