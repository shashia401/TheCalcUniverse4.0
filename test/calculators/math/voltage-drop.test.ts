import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/voltage-drop/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Voltage Drop calculator', () => {
  it('120V single-phase 20A 100ft — recommends 8 AWG', () => {
    const r = config.calculate({
      voltage: '120',
      phase: 'single',
      wireMaterial: 'cu',
      loadCurrent: '20',
      oneWayLength: '100',
      acceptableDrop: '3',
    });
    expect(getValue(r, 'recommendedWire')).toBe('8 AWG');
    // VD = 2 × 100 × 20 × 0.764 / 1000 = 3.056V = 2.55%
    near(parseNumber(getValue(r, 'voltageDrop')), 3.056, 0.01);
    near(parseNumber(getValue(r, 'voltageDropPercent')), 2.55, 0.05);
  });

  it('240V single-phase 30A 150ft — recommends 8 AWG', () => {
    const r = config.calculate({
      voltage: '240',
      phase: 'single',
      wireMaterial: 'cu',
      loadCurrent: '30',
      oneWayLength: '150',
      acceptableDrop: '3',
    });
    expect(getValue(r, 'recommendedWire')).toBe('8 AWG');
    // VD = 2 × 150 × 30 × 0.764 / 1000 = 6.876V = 2.865%
    near(parseNumber(getValue(r, 'voltageDrop')), 6.876, 0.01);
  });

  it('480V three-phase 50A 200ft', () => {
    const r = config.calculate({
      voltage: '480',
      phase: 'three',
      wireMaterial: 'cu',
      loadCurrent: '50',
      oneWayLength: '200',
      acceptableDrop: '3',
    });
    expect(r.length).toBeGreaterThan(0);
    // VD = √3 × 200 × 50 × R / 1000
    // 6 AWG (0.491): VD = 1.732 × 200 × 50 × 0.491 / 1000 = 8.50V = 1.77%
    // 8 AWG (0.764): VD = 1.732 × 200 × 50 × 0.764 / 1000 = 13.23V = 2.76%
    // 10 AWG (1.21): VD = 20.95V = 4.36% - too high
    // Recommended should be 8 AWG
    near(parseNumber(getValue(r, 'voltageDropPercent')), 2.76, 0.1);
  });

  it('passes 3% check when VD <= 3%', () => {
    const r = config.calculate({
      voltage: '120',
      phase: 'single',
      wireMaterial: 'cu',
      loadCurrent: '15',
      oneWayLength: '50',
      acceptableDrop: '3',
    });
    const status = getValue(r, 'status');
    expect(status).toContain('✔');
    expect(status).toContain('Passes');
    expect(getValue(r, 'recommendedWire')).toBe('12 AWG');
  });

  it('fails 3% but passes 5% — 120V 100A 300ft', () => {
    // At 3% (3.6V max) even 4/0 AWG fails (VD=3.648V=3.04%)
    // The algorithm falls back to 4/0 AWG with a failure status
    const r = config.calculate({
      voltage: '120',
      phase: 'single',
      wireMaterial: 'cu',
      loadCurrent: '100',
      oneWayLength: '300',
      acceptableDrop: '3',
    });
    expect(getValue(r, 'recommendedWire')).toBe('4/0 AWG');
    expect(getValue(r, 'status')).toContain('Does not meet');
    // At 5% (6V max), 2/0 AWG passes (VD=5.802V=4.835%)
    const r2 = config.calculate({
      voltage: '120',
      phase: 'single',
      wireMaterial: 'cu',
      loadCurrent: '100',
      oneWayLength: '300',
      acceptableDrop: '5',
    });
    const status2 = getValue(r2, 'status');
    expect(status2).toContain('✔');
    expect(status2).toContain('Passes');
    expect(getValue(r2, 'recommendedWire')).toBe('2/0 AWG');
  });

  it('aluminum wire has higher VD — 120V 20A 100ft', () => {
    const r = config.calculate({
      voltage: '120',
      phase: 'single',
      wireMaterial: 'al',
      loadCurrent: '20',
      oneWayLength: '100',
      acceptableDrop: '3',
    });
    // Aluminum resistance = 1.6 × copper
    // 8 AWG copper = 0.764, aluminum = 1.2224
    // VD = 2 × 100 × 20 × 1.2224 / 1000 = 4.89V = 4.07% - fails 3%
    // 6 AWG copper = 0.491, aluminum = 0.7856
    // VD = 2 × 100 × 20 × 0.7856 / 1000 = 3.142V = 2.62% - passes 3%
    expect(getValue(r, 'recommendedWire')).toBe('6 AWG');
  });

  it('accepts custom drop percentage', () => {
    const r = config.calculate({
      voltage: '120',
      phase: 'single',
      wireMaterial: 'cu',
      loadCurrent: '20',
      oneWayLength: '100',
      acceptableDrop: 'custom',
      customDropPercent: '2',
    });
    // With 2% (2.4V at 120V):
    // 10 AWG (1.21): VD = 4.84V = 4.03% - fails
    // 8 AWG (0.764): VD = 3.056V = 2.55% - fails 2%!
    // 6 AWG (0.491): VD = 1.964V = 1.64% - passes
    expect(getValue(r, 'recommendedWire')).toBe('6 AWG');
  });

  it('returns empty for missing voltage', () => {
    const r = config.calculate({
      loadCurrent: '20',
      oneWayLength: '100',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for zero voltage', () => {
    const r = config.calculate({
      voltage: '0',
      loadCurrent: '20',
      oneWayLength: '100',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing loadCurrent', () => {
    const r = config.calculate({
      voltage: '120',
      oneWayLength: '100',
    });
    expect(r).toEqual([]);
  });

  it('recommends largest wire for high current', () => {
    const r = config.calculate({
      voltage: '120',
      phase: 'single',
      wireMaterial: 'cu',
      loadCurrent: '200',
      oneWayLength: '200',
      acceptableDrop: '3',
    });
    // At 120V, 3% = 3.6V
    // 4/0 AWG (0.0608): VD = 2 × 200 × 200 × 0.0608/1000 = 4.864V = 4.05%
    // Fails 3% — so recommend 4/0 with fail status
    expect(getValue(r, 'recommendedWire')).toBe('4/0 AWG');
    expect(getValue(r, 'status')).not.toContain('✔');
  });

  it('includes all result fields', () => {
    const r = config.calculate({
      voltage: '277',
      phase: 'three',
      wireMaterial: 'cu',
      loadCurrent: '30',
      oneWayLength: '200',
      acceptableDrop: '3',
    });
    expect(r.length).toBe(6);
    expect(getValue(r, 'recommendedWire')).toBeTruthy();
    expect(getValue(r, 'voltageDrop')).toBeTruthy();
    expect(getValue(r, 'voltageDropPercent')).toBeTruthy();
    expect(getValue(r, 'status')).toBeTruthy();
    expect(getValue(r, 'wireResistance')).toBeTruthy();
    expect(getValue(r, 'conductorSize')).toBeTruthy();
  });

  it('three-phase VD is lower than single-phase for same load', () => {
    const single = config.calculate({
      voltage: '240',
      phase: 'single',
      wireMaterial: 'cu',
      loadCurrent: '40',
      oneWayLength: '100',
      acceptableDrop: '3',
    });
    const three = config.calculate({
      voltage: '240',
      phase: 'three',
      wireMaterial: 'cu',
      loadCurrent: '40',
      oneWayLength: '100',
      acceptableDrop: '3',
    });
    // Single-phase uses factor 2, three-phase uses factor √3 ≈ 1.732
    // So three-phase VD should be lower for same wire
    // Actually, the recommended wire might differ
    expect(parseNumber(getValue(three, 'voltageDropPercent'))).toBeLessThan(
      parseNumber(getValue(single, 'voltageDropPercent')),
    );
  });
});
