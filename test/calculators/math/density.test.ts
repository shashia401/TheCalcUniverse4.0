import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/density/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Density Calculator', () => {
  // ─── calcDensity mode ────────────────────────────────────
  it('calcDensity: water 1000g in 1L = 1000 kg/m³', () => {
    const r = config.calculate({ mode: 'calcDensity', mass: '1000', massUnit: 'g', volume: '1', volumeUnit: 'L' });
    near(parseNumber(getValue(r, 'result')), 1000);
    expect(getValue(r, 'result')).toContain('kg/m³');
  });

  it('calcDensity: displays g/cm³ and lbs/ft³', () => {
    const r = config.calculate({ mode: 'calcDensity', mass: '1000', massUnit: 'g', volume: '1', volumeUnit: 'L' });
    near(parseNumber(getValue(r, 'densityGcm3')), 1);
    near(parseNumber(getValue(r, 'densityLbsft3')), 62.43, 0.1);
  });

  it('calcDensity: lb and ft³ units', () => {
    const r = config.calculate({ mode: 'calcDensity', mass: '10', massUnit: 'lb', volume: '0.16', volumeUnit: 'ft3' });
    near(parseNumber(getValue(r, 'result')), 1001, 10);
  });

  it('calcDensity: shows formula ρ = m / V', () => {
    const r = config.calculate({ mode: 'calcDensity', mass: '500', massUnit: 'g', volume: '2', volumeUnit: 'L' });
    expect(getValue(r, 'formula')).toContain('ρ = m / V');
  });

  it('calcDensity: shows step-by-step', () => {
    const r = config.calculate({ mode: 'calcDensity', mass: '1000', massUnit: 'g', volume: '1', volumeUnit: 'L' });
    const steps = getValue(r, 'steps');
    expect(steps).toContain('÷');
    expect(steps).toContain('kg/m³');
  });

  it('calcDensity: returns empty for zero volume', () => {
    const r = config.calculate({ mode: 'calcDensity', mass: '10', massUnit: 'kg', volume: '0', volumeUnit: 'm3' });
    expect(r).toEqual([]);
  });

  it('calcDensity: returns empty for NaN mass', () => {
    const r = config.calculate({ mode: 'calcDensity', mass: 'abc', massUnit: 'kg', volume: '2', volumeUnit: 'm3' });
    expect(r).toEqual([]);
  });

  // ─── calcMass mode ───────────────────────────────────────
  it('calcMass: density 1000 kg/m³, volume 2 m³ = 2000 kg', () => {
    const r = config.calculate({ mode: 'calcMass', density: '1000', densityUnit: 'kg/m3', volume: '2', volumeUnit: 'm3' });
    near(parseNumber(getValue(r, 'result')), 2000);
    expect(getValue(r, 'result')).toContain('kg');
  });

  it('calcMass: shows g and lb conversions', () => {
    const r = config.calculate({ mode: 'calcMass', density: '1', densityUnit: 'g/cm3', volume: '1', volumeUnit: 'L' });
    near(parseNumber(getValue(r, 'massG')), 1000);
  });

  it('calcMass: shows formula m = ρ × V', () => {
    const r = config.calculate({ mode: 'calcMass', density: '1000', densityUnit: 'kg/m3', volume: '1', volumeUnit: 'm3' });
    expect(getValue(r, 'formula')).toContain('m = ρ × V');
  });

  it('calcMass: returns empty for NaN density', () => {
    const r = config.calculate({ mode: 'calcMass', density: 'abc', densityUnit: 'kg/m3', volume: '2', volumeUnit: 'm3' });
    expect(r).toEqual([]);
  });

  // ─── calcVolume mode ─────────────────────────────────────
  it('calcVolume: mass 2000 kg, density 1000 kg/m³ = 2 m³', () => {
    const r = config.calculate({ mode: 'calcVolume', mass: '2000', massUnit: 'kg', density: '1000', densityUnit: 'kg/m3' });
    near(parseNumber(getValue(r, 'result')), 2);
    expect(getValue(r, 'result')).toContain('m³');
  });

  it('calcVolume: shows L and mL', () => {
    const r = config.calculate({ mode: 'calcVolume', mass: '1000', massUnit: 'g', density: '1', densityUnit: 'g/cm3' });
    near(parseNumber(getValue(r, 'volumeL')), 1);
    near(parseNumber(getValue(r, 'volumeMl')), 1000);
  });

  it('calcVolume: shows formula V = m / ρ', () => {
    const r = config.calculate({ mode: 'calcVolume', mass: '1000', massUnit: 'g', density: '1', densityUnit: 'g/cm3' });
    expect(getValue(r, 'formula')).toContain('V = m / ρ');
  });

  it('calcVolume: returns empty for zero density', () => {
    const r = config.calculate({ mode: 'calcVolume', mass: '10', massUnit: 'kg', density: '0', densityUnit: 'kg/m3' });
    expect(r).toEqual([]);
  });

  it('calcVolume: returns empty for NaN mass', () => {
    const r = config.calculate({ mode: 'calcVolume', mass: '', massUnit: 'kg', density: '1000', densityUnit: 'kg/m3' });
    expect(r).toEqual([]);
  });

  it('returns empty when mode is undefined with incomplete inputs', () => {
    const r = config.calculate({});
    expect(r).toEqual([]);
  });

  // ─── New tests ───

  it('calcDensity: mixed units — mass in lb, volume in L', () => {
    const r = config.calculate({ mode: 'calcDensity', mass: '2.20462', massUnit: 'lb', volume: '1', volumeUnit: 'L' });
    // 2.20462 lb ≈ 1 kg, 1 L = 0.001 m³, ρ = 1 / 0.001 = 1000 kg/m³
    near(parseNumber(getValue(r, 'result')), 1000, 10);
  });

  it('calcDensity: gold check — 193g in 10cm³ should be ~19.3 g/cm³', () => {
    const r = config.calculate({ mode: 'calcDensity', mass: '193', massUnit: 'g', volume: '10', volumeUnit: 'cm3' });
    near(parseNumber(getValue(r, 'densityGcm3')), 19.3, 0.1);
  });

  it('calcMass: steel density with ft³ volume', () => {
    const r = config.calculate({ mode: 'calcMass', density: '7870', densityUnit: 'kg/m3', volume: '1', volumeUnit: 'ft3' });
    // 1 ft³ = 0.0283168 m³, m = 7870 * 0.0283168 ≈ 222.85 kg
    near(parseNumber(getValue(r, 'result')), 222.85, 1);
  });

  it('calcMass: lbs/ft³ density units', () => {
    const r = config.calculate({ mode: 'calcMass', density: '62.43', densityUnit: 'lbs/ft3', volume: '1', volumeUnit: 'm3' });
    // 62.43 lbs/ft³ = 1000 kg/m³, 1 m³ => 1000 kg
    near(parseNumber(getValue(r, 'result')), 1000, 5);
  });

  it('calcVolume: find volume of 1kg gold', () => {
    const r = config.calculate({ mode: 'calcVolume', mass: '1', massUnit: 'kg', density: '19.3', densityUnit: 'g/cm3' });
    // V = 1 kg / 19300 kg/m³ = 0.000051813 m³
    expect(parseNumber(getValue(r, 'result'))).toBeGreaterThan(0);
    expect(parseNumber(getValue(r, 'result'))).toBeLessThan(0.001);
  });

  it('calcVolume: ft³ output is present', () => {
    const r = config.calculate({ mode: 'calcVolume', mass: '1000', massUnit: 'kg', density: '1000', densityUnit: 'kg/m3' });
    expect(getValue(r, 'volumeFt3')).toBeDefined();
    near(parseNumber(getValue(r, 'volumeFt3')), 35.31, 0.1);
  });

  it('calcVolume: step-by-step shows division', () => {
    const r = config.calculate({ mode: 'calcVolume', mass: '4', massUnit: 'kg', density: '2', densityUnit: 'kg/m3' });
    const steps = getValue(r, 'steps');
    expect(steps).toContain('÷');
  });

  it('should handle zero mass gracefully', () => {
    const r = config.calculate({ mode: 'calcDensity', mass: '0', massUnit: 'kg', volume: '1', volumeUnit: 'm3' });
    near(parseNumber(getValue(r, 'result')), 0);
  });

  it('calcMass: default units work when unit fields missing', () => {
    const r = config.calculate({ mode: 'calcMass', density: '1000', volume: '1' });
    near(parseNumber(getValue(r, 'result')), 1000);
  });

  it('calcMass: g/cm³ to kg/m³ conversion is correct', () => {
    const r = config.calculate({ mode: 'calcMass', density: '1', densityUnit: 'g/cm3', volume: '1', volumeUnit: 'm3' });
    // 1 g/cm³ = 1000 kg/m³, m = 1000 * 1 = 1000 kg
    near(parseNumber(getValue(r, 'result')), 1000);
  });
});
