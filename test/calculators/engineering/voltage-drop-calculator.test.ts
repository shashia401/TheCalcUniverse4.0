import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/voltage-drop/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Voltage Drop Calculator', () => {
  it('calculates voltage drop for 120V 15A 50ft 12AWG copper', () => {
    const results = config.calculate({
      voltage: '120',
      current: '15',
      wireLength: '50',
      wireGauge: '12',
      conductorMaterial: 'copper',
    });
    // R/1000ft = 1.98 (12 AWG copper), total length = 100ft
    // wireResistance = 1.98/1000 * 100 = 0.198 Ω
    // drop = 15 * 0.198 = 2.97V
    const drop = parseNumber(getValue(results, 'voltageDrop'));
    near(drop, 2.97, 0.01);
    // Voltage at load = 120 - 2.97 = 117.03V
    const atLoad = parseNumber(getValue(results, 'voltageAtLoad'));
    near(atLoad, 117.03, 0.1);
  });

  it('shows NEC compliance pass when drop under 3%', () => {
    const results = config.calculate({
      voltage: '120',
      current: '15',
      wireLength: '50',
      wireGauge: '12',
      conductorMaterial: 'copper',
    });
    // 2.97/120 * 100 = 2.475% — under 3%
    const nec = getValue(results, 'nec');
    expect(nec).toContain('Pass');
  });

  it('shows NEC compliance fail when drop over 5%', () => {
    const results = config.calculate({
      voltage: '120',
      current: '15',
      wireLength: '200',
      wireGauge: '14',
      conductorMaterial: 'copper',
    });
    // 14 AWG copper: 3.14 Ω/1000ft, total length = 400ft
    // wireResistance = 3.14/1000 * 400 = 1.256 Ω
    // drop = 15 * 1.256 = 18.84V, % = 15.7% — over 5%
    const nec = getValue(results, 'nec');
    expect(nec).toContain('Fail');
  });

  it('calculates wire resistance correctly', () => {
    const results = config.calculate({
      voltage: '120',
      current: '15',
      wireLength: '50',
      wireGauge: '12',
      conductorMaterial: 'copper',
    });
    const resistance = parseNumber(getValue(results, 'wireResistance'));
    near(resistance, 0.198, 0.001); // 1.98/1000 * 100 = 0.198
  });

  it('returns empty for invalid inputs', () => {
    const results = config.calculate({
      voltage: '',
      current: '',
      wireLength: '',
      wireGauge: '12',
      conductorMaterial: 'copper',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for zero voltage', () => {
    const results = config.calculate({
      voltage: '0',
      current: '15',
      wireLength: '50',
      wireGauge: '12',
      conductorMaterial: 'copper',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for NaN source voltage', () => {
    const results = config.calculate({
      voltage: 'abc',
      current: '15',
      wireLength: '50',
      wireGauge: '12',
      conductorMaterial: 'copper',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for negative current', () => {
    const results = config.calculate({
      voltage: '120',
      current: '-5',
      wireLength: '50',
      wireGauge: '12',
      conductorMaterial: 'copper',
    });
    expect(results).toEqual([]);
  });

  it('calculates power lost in wires', () => {
    const results = config.calculate({
      voltage: '120',
      current: '15',
      wireLength: '50',
      wireGauge: '12',
      conductorMaterial: 'copper',
    });
    // I²R = 15² * 0.198 = 225 * 0.198 = 44.55W
    const watts = getValue(results, 'wattsLost');
    expect(watts).toContain('W');
    const wattsNum = parseNumber(watts);
    near(wattsNum, 44.55, 0.1);
  });

  it('handles aluminum conductor for 8 AWG', () => {
    const results = config.calculate({
      voltage: '240',
      current: '30',
      wireLength: '75',
      wireGauge: '8',
      conductorMaterial: 'aluminum',
    });
    // 8 AWG aluminum: 1.28 Ω/1000ft, total length = 150ft
    // wireResistance = 1.28/1000 * 150 = 0.192 Ω
    // drop = 30 * 0.192 = 5.76V, % = 5.76/240 * 100 = 2.4%
    const resistance = parseNumber(getValue(results, 'wireResistance'));
    near(resistance, 0.192, 0.001);
    const drop = parseNumber(getValue(results, 'voltageDrop'));
    near(drop, 5.76, 0.01);
    const nec = getValue(results, 'nec');
    expect(nec).toContain('Pass');
  });

  it('calculates voltage with 1/0 AWG copper for heavy load', () => {
    const results = config.calculate({
      voltage: '480',
      current: '100',
      wireLength: '150',
      wireGauge: '1/0',
      conductorMaterial: 'copper',
    });
    // 1/0 AWG copper: 0.122 Ω/1000ft, total length = 300ft
    // wireResistance = 0.122/1000 * 300 = 0.0366 Ω
    // drop = 100 * 0.0366 = 3.66V, % = 3.66/480 * 100 = 0.7625%
    const resistance = parseNumber(getValue(results, 'wireResistance'));
    near(resistance, 0.0366, 0.001);
    const drop = parseNumber(getValue(results, 'voltageDrop'));
    near(drop, 3.66, 0.01);
    const nec = getValue(results, 'nec');
    expect(nec).toContain('Pass');
  });

  // ─── Educational content ───

  it('has inputMode on number inputs', () => {
    const voltageInput = config.inputs.find((i) => i.id === 'voltage');
    const currentInput = config.inputs.find((i) => i.id === 'current');
    const lengthInput = config.inputs.find((i) => i.id === 'wireLength');
    expect(voltageInput?.inputMode).toBe('decimal');
    expect(currentInput?.inputMode).toBe('decimal');
    expect(lengthInput?.inputMode).toBe('decimal');
  });

  it('has at least 5 FAQs', () => {
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
  });

  it('has workedExamples with scenarios and insights', () => {
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(3);
    config.educational.workedExamples!.forEach((ex) => {
      expect(ex.scenario).toBeTruthy();
      expect(ex.inputs).toBeTruthy();
      expect(ex.insight.length).toBeGreaterThan(100);
    });
  });

  it('has proTips', () => {
    expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(4);
    config.educational.proTips!.forEach((tip) => {
      expect(tip.length).toBeGreaterThan(50);
    });
  });

  it('has limitations with real content', () => {
    expect(config.educational.limitations).toBeTruthy();
    expect(config.educational.limitations.length).toBeGreaterThan(0);
    expect(config.educational.limitations.every((l: string) => l.length > 20)).toBe(true);
  });

  it('has quickReference', () => {
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(4);
  });

  it('has all required educational sections', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.formulaDescription!.length).toBeGreaterThan(100);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.explanation!.length).toBeGreaterThan(300);
    expect(config.educational.diagram).toBeTruthy();
    expect(config.educational.diagram!.svg).toBeTruthy();
    expect(config.educational.diagram!.alt).toBeTruthy();
  });
});
