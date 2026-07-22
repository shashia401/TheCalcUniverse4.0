import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/mass/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Mass Calculator', () => {
  // ─── calcMass mode ───────────────────────────────────────
  it('calcMass: density 1000 kg/m³, volume 2 m³ = 2000 kg', () => {
    const r = config.calculate({ mode: 'calcMass', density: '1000', densityUnit: 'kg/m3', volume: '2', volumeUnit: 'm3' });
    near(parseNumber(getValue(r, 'result')), 2000);
    expect(getValue(r, 'result')).toContain('kg');
  });

  it('calcMass: shows g and lb conversions', () => {
    const r = config.calculate({ mode: 'calcMass', density: '1', densityUnit: 'g/cm3', volume: '1', volumeUnit: 'L' });
    near(parseNumber(getValue(r, 'massG')), 1000);
    near(parseNumber(getValue(r, 'massLb')), 2.2046, 0.01);
  });

  it('calcMass: shows formula m = ρ × V', () => {
    const r = config.calculate({ mode: 'calcMass', density: '5', densityUnit: 'kg/m3', volume: '3', volumeUnit: 'm3' });
    expect(getValue(r, 'formula')).toContain('m = ρ × V');
  });

  it('calcMass: shows step-by-step', () => {
    const r = config.calculate({ mode: 'calcMass', density: '1000', densityUnit: 'kg/m3', volume: '2', volumeUnit: 'm3' });
    expect(getValue(r, 'steps')).toContain('×');
  });

  it('calcMass: returns empty for NaN density', () => {
    const r = config.calculate({ mode: 'calcMass', density: 'abc', densityUnit: 'kg/m3', volume: '2', volumeUnit: 'm3' });
    expect(r).toEqual([]);
  });

  it('calcMass: returns empty for NaN volume', () => {
    const r = config.calculate({ mode: 'calcMass', density: '1000', densityUnit: 'kg/m3', volume: '', volumeUnit: 'm3' });
    expect(r).toEqual([]);
  });

  // ─── Planet weights ──────────────────────────────────────
  it('calcMass: shows weight on Earth', () => {
    const r = config.calculate({ mode: 'calcMass', density: '1000', densityUnit: 'kg/m3', volume: '1', volumeUnit: 'm3' });
    // 1000 kg × 9.81 = 9810 N
    near(parseNumber(getValue(r, 'weightEarth')), 9810);
  });

  it('calcMass: shows weight on Moon (g=1.62)', () => {
    const r = config.calculate({ mode: 'calcMass', density: '1000', densityUnit: 'kg/m3', volume: '1', volumeUnit: 'm3' });
    // 1000 kg × 1.62 = 1620 N
    near(parseNumber(getValue(r, 'weightMoon')), 1620);
  });

  it('calcMass: shows weight on Mars (g=3.71)', () => {
    const r = config.calculate({ mode: 'calcMass', density: '1000', densityUnit: 'kg/m3', volume: '1', volumeUnit: 'm3' });
    // 1000 kg × 3.71 = 3710 N
    near(parseNumber(getValue(r, 'weightMars')), 3710);
  });

  it('calcMass: shows weight on Jupiter (g=24.79)', () => {
    const r = config.calculate({ mode: 'calcMass', density: '1000', densityUnit: 'kg/m3', volume: '1', volumeUnit: 'm3' });
    // 1000 kg × 24.79 = 24790 N
    near(parseNumber(getValue(r, 'weightJupiter')), 24790);
  });

  // ─── calcDensity mode ────────────────────────────────────
  it('calcDensity: mass 1000g, volume 1L = 1000 kg/m³', () => {
    const r = config.calculate({ mode: 'calcDensity', mass: '1000', massUnit: 'g', volume: '1', volumeUnit: 'L' });
    near(parseNumber(getValue(r, 'result')), 1000);
  });

  it('calcDensity: shows formula ρ = m / V', () => {
    const r = config.calculate({ mode: 'calcDensity', mass: '500', massUnit: 'g', volume: '2', volumeUnit: 'L' });
    expect(getValue(r, 'formula')).toContain('ρ = m / V');
  });

  it('calcDensity: returns empty for zero volume', () => {
    const r = config.calculate({ mode: 'calcDensity', mass: '10', massUnit: 'kg', volume: '0', volumeUnit: 'm3' });
    expect(r).toEqual([]);
  });

  // ─── calcVolume mode ─────────────────────────────────────
  it('calcVolume: mass 2000kg, density 1000 kg/m³ = 2 m³', () => {
    const r = config.calculate({ mode: 'calcVolume', mass: '2000', massUnit: 'kg', density: '1000', densityUnit: 'kg/m3' });
    near(parseNumber(getValue(r, 'result')), 2);
  });

  it('calcVolume: shows formula V = m / ρ', () => {
    const r = config.calculate({ mode: 'calcVolume', mass: '1000', massUnit: 'g', density: '1', densityUnit: 'g/cm3' });
    expect(getValue(r, 'formula')).toContain('V = m / ρ');
  });

  it('calcVolume: returns empty for zero density', () => {
    const r = config.calculate({ mode: 'calcVolume', mass: '10', massUnit: 'kg', density: '0', densityUnit: 'kg/m3' });
    expect(r).toEqual([]);
  });
});
