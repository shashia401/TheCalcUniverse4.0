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
    // NEC Table 8 stranded 8 AWG = 0.778: VD = 2 × 100 × 20 × 0.778 / 1000 = 3.112V = 2.59%
    near(parseNumber(getValue(r, 'voltageDrop')), 3.112, 0.01);
    near(parseNumber(getValue(r, 'voltageDropPercent')), 2.59, 0.05);
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
    // VD = 2 × 150 × 30 × 0.778 / 1000 = 7.002V = 2.92%
    near(parseNumber(getValue(r, 'voltageDrop')), 7.002, 0.01);
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
    // 8 AWG (0.778): VD = 1.732 × 200 × 50 × 0.778 / 1000 = 13.47V = 2.81%
    // 10 AWG (1.24): VD = 21.5V = 4.48% - too high
    // Recommended should be 8 AWG
    near(parseNumber(getValue(r, 'voltageDropPercent')), 2.81, 0.1);
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
    // NEC Table 8 aluminum: 8 AWG = 1.28 -> VD = 5.12V = 4.27% - fails 3%
    // 6 AWG = 0.808 -> VD = 3.232V = 2.69% - passes 3% (and Al 6 AWG ampacity 50A >= 20A)
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
    // 10 AWG (1.24): VD = 4.96V = 4.13% - fails
    // 8 AWG (0.778): VD = 3.112V = 2.59% - fails 2%!
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
