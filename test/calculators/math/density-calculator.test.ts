import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/density';
import { getValue, parseNumber, near } from '../../helpers';

describe('density-calculator', () => {
  it('calculate density: mass=10kg, volume=5m3 → density=2 kg/m3', () => {
    const r = config.calculate({
      mode: 'calcDensity',
      mass: '10',
      massUnit: 'kg',
      volume: '5',
      volumeUnit: 'm3',
    });
    near(parseNumber(getValue(r, 'result')), 2);
    expect(getValue(r, 'formula')).toBe('ρ = m / V');
  });

  it('calculate density with unit conversion: 1000g, 1L → 1000 kg/m3 (water)', () => {
    const r = config.calculate({
      mode: 'calcDensity',
      mass: '1000',
      massUnit: 'g',
      volume: '1',
      volumeUnit: 'L',
    });
    near(parseNumber(getValue(r, 'result')), 1000);
  });

  it('calculate density in g/cm3: 2700g, 1000cm3 → 2.7 g/cm3 (aluminum)', () => {
    const r = config.calculate({
      mode: 'calcDensity',
      mass: '2700',
      massUnit: 'g',
      volume: '1000',
      volumeUnit: 'cm3',
    });
    const gcm3 = parseNumber(getValue(r, 'densityGcm3'));
    near(gcm3, 2.7);
  });

  it('calculate mass: density=1000kg/m3, volume=5m3 → mass=5000kg', () => {
    const r = config.calculate({
      mode: 'calcMass',
      density: '1000',
      densityUnit: 'kg/m3',
      volume: '5',
      volumeUnit: 'm3',
    });
    near(parseNumber(getValue(r, 'result')), 5000);
  });

  it('calculate mass with lb: density=1g/cm3, 1000cm3 → 2.205 lb', () => {
    const r = config.calculate({
      mode: 'calcMass',
      density: '1',
      densityUnit: 'g/cm3',
      volume: '1000',
      volumeUnit: 'cm3',
    });
    const lb = parseNumber(getValue(r, 'massLb'));
    near(lb, 2.2046, 0.01);
  });

  it('calculate volume: mass=10kg, density=2kg/m3 → volume=5m3', () => {
    const r = config.calculate({
      mode: 'calcVolume',
      mass: '10',
      massUnit: 'kg',
      density: '2',
      densityUnit: 'kg/m3',
    });
    near(parseNumber(getValue(r, 'result')), 5);
  });

  it('calculate volume with units: 100g, 1g/cm3 → 100cm3', () => {
    const r = config.calculate({
      mode: 'calcVolume',
      mass: '100',
      massUnit: 'g',
      density: '1',
      densityUnit: 'g/cm3',
    });
    const cm3 = parseNumber(getValue(r, 'volumeMl'));
    near(cm3, 100);
  });

  it('rejects volume=0 for density (division by zero)', () => {
    const r = config.calculate({
      mode: 'calcDensity',
      mass: '10',
      massUnit: 'kg',
      volume: '0',
      volumeUnit: 'm3',
    });
    expect(r).toEqual([]);
  });

  it('rejects density=0 for volume (division by zero)', () => {
    const r = config.calculate({
      mode: 'calcVolume',
      mass: '10',
      massUnit: 'kg',
      density: '0',
      densityUnit: 'kg/m3',
    });
    expect(r).toEqual([]);
  });

  it('rejects NaN mass', () => {
    const r = config.calculate({
      mode: 'calcDensity',
      mass: 'abc',
      massUnit: 'kg',
      volume: '5',
      volumeUnit: 'm3',
    });
    expect(r).toEqual([]);
  });

  it('rejects NaN volume', () => {
    const r = config.calculate({
      mode: 'calcDensity',
      mass: '10',
      massUnit: 'kg',
      volume: '',
      volumeUnit: 'm3',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing mode', () => {
    const r = config.calculate({});
    expect(r).toEqual([]);
  });

  it('lbs/ft3 density conversion: 1000kg/m3 → ~62.4 lbs/ft3', () => {
    const r = config.calculate({
      mode: 'calcDensity',
      mass: '1000',
      massUnit: 'kg',
      volume: '1',
      volumeUnit: 'm3',
    });
    const lbsft3 = parseNumber(getValue(r, 'densityLbsft3'));
    near(lbsft3, 62.4, 0.2);
  });
});
