import { describe, it, expect } from 'vitest';
import eng from '../../../src/calculators/engineering/voltage-drop';
import twin from '../../../src/calculators/math/voltage-drop';
import { getResult, getValue, parseNumber, near } from '../../helpers';

const e = (v: Record<string, string>) =>
  eng.calculate({ voltage: '120', current: '15', wireLength: '100', wireGauge: '14', conductorMaterial: 'copper', ...v });
const m = (v: Record<string, string>) =>
  twin.calculate({ voltage: '120', phase: 'single', wireMaterial: 'cu', loadCurrent: '15', oneWayLength: '100', acceptableDrop: '3', ...v });

// VD = 2 I R L / 1000 (single phase), R from NEC Chapter 9 Table 8 (stranded, 75 C). Hand-derived.
describe('voltage-drop audit', () => {
  it('shed example: 14 AWG Cu, 100 ft, 15 A, 120 V -> 0.628 ohm, 9.42 V (7.85%), 141.3 W lost', () => {
    const r = e({});
    expect(getValue(r, 'voltageDrop')).toBe('9.420 V (7.85%)');
    expect(getValue(r, 'wireResistance')).toBe('0.6280 Ω');
    expect(getValue(r, 'wattsLost')).toContain('141.30 W');
    expect(getValue(r, 'voltageAtLoad')).toBe('110.58 V');
  });
  it('10 AWG on the shed: 3.72 V (3.1%)', () => {
    expect(getValue(e({ wireGauge: '10' }), 'voltageDrop')).toBe('3.720 V (3.10%)');
  });
  it('well pump: 240 V, 10 A, 300 ft, 10 AWG -> 7.44 V (3.1%); 8 AWG -> 4.668 V (1.9%)', () => {
    expect(getValue(e({ voltage: '240', current: '10', wireLength: '300', wireGauge: '10' }), 'voltageDrop')).toBe('7.440 V (3.10%)');
    expect(getValue(e({ voltage: '240', current: '10', wireLength: '300', wireGauge: '8' }), 'voltageDrop')).toBe('4.668 V (1.95%)');
  });
  it('EV charger: 240 V, 48 A, 50 ft, 6 AWG -> 2.357 V (0.98%); 100 ft one way doubles it', () => {
    expect(getValue(e({ voltage: '240', current: '48', wireLength: '50', wireGauge: '6' }), 'voltageDrop')).toBe('2.357 V (0.98%)');
    near(parseNumber(getValue(e({ voltage: '240', current: '48', wireLength: '100', wireGauge: '6' }), 'voltageDrop')), 4.714, 1e-3);
  });
  it('energy-cost tip: 50 W continuous at $0.15/kWh = $65.7 a year', () => {
    expect(0.05 * 8760 * 0.15).toBeCloseTo(65.7, 1);
  });
  it('aluminum is ~64% more resistive (12 AWG 3.25 vs 1.98); 14 AWG Al is flagged as hypothetical', () => {
    const cu = parseNumber(getValue(e({ wireGauge: '12' }), 'wireResistance'));
    const al = parseNumber(getValue(e({ wireGauge: '12', conductorMaterial: 'aluminum' }), 'wireResistance'));
    near(al / cu, 3.25 / 1.98, 1e-3);
    expect(getResult(e({ conductorMaterial: 'aluminum' }), 'voltageDrop').warning).toMatch(/14 AWG/);
    expect(getResult(e({}), 'voltageDrop').warning).toBeUndefined();
  });
  it('guideline wording is informational; classification on the displayed percentage (3.004% -> 3.00 -> pass)', () => {
    expect(getResult(e({ wireGauge: '10' }), 'nec').label).toMatch(/informational/);
    // 12 AWG, 120 V, 15 A, L chosen so drop is 3.004%: 2*15*1.98*L/1000 = 3.6048 -> L = 60.69
    expect(getValue(e({ wireGauge: '12', wireLength: '60.69' }), 'nec')).toMatch(/^Pass/);
  });
  it('larger sizes exist (4/0 AWG, 0.0608 ohm/kft)', () => {
    expect(getValue(e({ wireGauge: '4/0', current: '100', wireLength: '100' }), 'voltageDrop')).toBe('1.216 V (1.01%)');
  });
  it('TWIN AGREEMENT: math/voltage-drop and engineering report the same volts for the wire the twin selects', () => {
    const cases = [
      { voltage: '120', loadCurrent: '20', oneWayLength: '100', material: 'cu' },
      { voltage: '240', loadCurrent: '30', oneWayLength: '150', material: 'cu' },
      { voltage: '120', loadCurrent: '20', oneWayLength: '100', material: 'al' },
      { voltage: '240', loadCurrent: '60', oneWayLength: '120', material: 'cu' },
    ];
    for (const c of cases) {
      const t = m({ voltage: c.voltage, loadCurrent: c.loadCurrent, oneWayLength: c.oneWayLength, wireMaterial: c.material });
      const awg = getValue(t, 'recommendedWire').replace(' AWG', '');
      const r = e({ voltage: c.voltage, current: c.loadCurrent, wireLength: c.oneWayLength, wireGauge: awg, conductorMaterial: c.material === 'al' ? 'aluminum' : 'copper' });
      near(parseNumber(getValue(t, 'voltageDrop')), parseNumber(getValue(r, 'voltageDrop')), 0.006);
      near(parseNumber(getValue(t, 'wireResistance')), parseNumber(getValue(r, 'wireResistance')) / (2 * parseFloat(c.oneWayLength) / 1000), 1e-3);
    }
  });
  it('twin uses aluminium ampacity: a 40 A load on Al cannot use 8 AWG... 8 AWG Al is 40 A so it can; 45 A needs 6 AWG', () => {
    expect(getValue(m({ loadCurrent: '45', oneWayLength: '1', wireMaterial: 'al' }), 'recommendedWire')).toBe('6 AWG');
    expect(getValue(m({ loadCurrent: '45', oneWayLength: '1', wireMaterial: 'cu' }), 'recommendedWire')).toBe('8 AWG');
  });
  it('invalid input returns []', () => {
    expect(e({ current: '0' })).toEqual([]);
    expect(e({ voltage: '' })).toEqual([]);
  });
});
