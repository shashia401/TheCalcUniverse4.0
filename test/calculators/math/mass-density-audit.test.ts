import { describe, it, expect } from 'vitest';
import density from '../../../src/calculators/math/density';
import mass from '../../../src/calculators/math/mass';
import weight from '../../../src/calculators/math/weight';
import { FT3_M3, LBFT3_KGM3, fmtNum } from '../../../src/utils/massDensity';

// Expected values recomputed independently in Python from the exact definitions
// (1 lb = 0.45359237 kg, 1 ft = 0.3048 m so 1 ft^3 = 0.028316846592 m^3).
type R = { id: string; value: string }[];
const val = (r: R, id: string) => r.find((x) => x.id === id)?.value;

describe('shared mass/density helpers', () => {
  it('uses the exact ft^3 and lb/ft^3 factors (the old code used 0.0283168 and 16.0185)', () => {
    expect(FT3_M3).toBeCloseTo(0.028316846592, 15);
    expect(LBFT3_KGM3).toBeCloseTo(16.01846337, 7);
  });

  it('fmtNum keeps tiny and huge values instead of printing 0', () => {
    expect(fmtNum(3e-10)).toBe('3e-10');
    expect(fmtNum(1e20)).toBe('1e+20');
    expect(fmtNum(0.1 + 0.2)).toBe('0.3');
    expect(fmtNum(0)).toBe('0');
    expect(fmtNum(0.0000518134715)).toBe('0.0000518134715');
  });
});

describe('density audit', () => {
  const d = (o: Record<string, string>) => density.calculate({ mode: 'calcDensity', massUnit: 'kg', volumeUnit: 'm3', ...o }) as R;

  it('10 lb in 1 ft^3 = 160.1846337 kg/m^3 = 10 lbs/ft^3', () => {
    const r = d({ mass: '10', massUnit: 'lb', volume: '1', volumeUnit: 'ft3' });
    expect(val(r, 'result')).toBe('160.1846337 kg/m³');
    expect(val(r, 'densityGcm3')).toBe('0.1601846337 g/cm³');
    expect(val(r, 'densityLbsft3')).toBe('10 lbs/ft³');
  });

  it('a tiny density is shown, not rounded to zero', () => {
    expect(val(d({ mass: '3e-10', volume: '1' }), 'result')).toBe('3e-10 kg/m³');
  });

  it('volume from 1 kg of a 19,300 kg/m^3 material (gold-like)', () => {
    const r = density.calculate({ mode: 'calcVolume', mass: '1', massUnit: 'kg', density: '19300', densityUnit: 'kg/m3' }) as R;
    expect(val(r, 'result')).toBe('0.0000518134715 m³');
    expect(val(r, 'volumeMl')).toBe('51.8134715 mL');
    expect(val(r, 'volumeFt3')).toBe('0.001829775478 ft³');
  });

  it('rejects negatives, junk and a zero volume', () => {
    expect(d({ mass: '-5', volume: '1' })).toEqual([]);
    expect(d({ mass: '5kg', volume: '1' })).toEqual([]);
    expect(d({ mass: '5', volume: '0' })).toEqual([]);
    expect(d({ mass: '5', volume: 'Infinity' })).toEqual([]);
  });
});

describe('mass audit', () => {
  it('steel beam in the text: 7,850 kg/m^3 x 0.5 m^3 = 3,925 kg; weighs 38,504.25 N on Earth, 6,358.5 N on the Moon', () => {
    const r = mass.calculate({ mode: 'calcMass', density: '7850', densityUnit: 'kg/m3', volume: '0.5', volumeUnit: 'm3' }) as R;
    expect(val(r, 'result')).toBe('3925 kg');
    expect(val(r, 'weightEarth')).toBe('38504.25 N');
    expect(val(r, 'weightMoon')).toBe('6358.5 N');
    expect(val(r, 'weightMars')).toBe('14561.75 N');
    expect(val(r, 'weightJupiter')).toBe('97300.75 N');
  });

  it('rejects negative and junk volumes', () => {
    expect(mass.calculate({ mode: 'calcMass', density: '7850', volume: '-1' })).toEqual([]);
    expect(mass.calculate({ mode: 'calcMass', density: '7850', volume: '1m' })).toEqual([]);
  });
});

describe('weight audit', () => {
  it('70 kg on Earth = 686.7 N = 154.376 lbf (true pound-force, 1 lbf = 4.4482216 N)', () => {
    const r = weight.calculate({ mode: 'calcWeight', mass: '70', massUnit: 'kg', gravitySelect: 'Earth' }) as R;
    expect(val(r, 'result')).toBe('686.7 N');
    expect(val(r, 'weightLbf')).toBe('154.3763012 lbf');
  });

  it('160 kg on the Moon = 259.2 N', () => {
    const r = weight.calculate({ mode: 'calcWeight', mass: '160', massUnit: 'kg', gravitySelect: 'Moon' }) as R;
    expect(val(r, 'result')).toBe('259.2 N');
  });

  it('solving for mass and for gravity', () => {
    const m = weight.calculate({ mode: 'calcMass', weight: '686.7', gravitySelect: 'Earth' }) as R;
    expect(val(m, 'result')).toBe('70 kg');
    expect(val(m, 'massLb')).toBe('154.3235835 lb');
    const g = weight.calculate({ mode: 'calcGravity', mass: '70', massUnit: 'kg', weight: '686.7' }) as R;
    expect(val(g, 'result')).toBe('9.81 m/s²');
  });

  it('zero mass while solving for g is an explicit error; negatives and junk are rejected', () => {
    const r = weight.calculate({ mode: 'calcGravity', mass: '0', massUnit: 'kg', weight: '10' }) as R;
    expect(val(r, 'error')).toContain('greater than 0');
    expect(weight.calculate({ mode: 'calcWeight', mass: '-70', massUnit: 'kg', gravitySelect: 'Earth' })).toEqual([]);
    expect(weight.calculate({ mode: 'calcWeight', mass: '70kg', massUnit: 'kg', gravitySelect: 'Earth' })).toEqual([]);
    expect(weight.calculate({ mode: 'calcWeight', mass: '70', massUnit: 'kg', gravitySelect: 'custom', gravityCustom: '-3' })).toEqual([]);
  });
});
