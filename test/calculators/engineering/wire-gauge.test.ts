import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/wire-gauge/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Wire Gauge Calculator', () => {
  it('recommends 12 AWG for 25A at 75°C copper, 1-3 conductors', () => {
    const results = config.calculate({
      current: '25',
      conductorMaterial: 'copper',
      insulationType: '75',
      numConductors: '1',
    });
    // derating = 1.0, adj = 25A
    // 14 AWG = 20A < 25, 12 AWG = 25A >= 25
    const gauge = getValue(results, 'recommended');
    expect(gauge).toContain('12 AWG');
    expect(gauge).toContain('copper');
  });

  it('applies derating for 4-6 conductors in conduit', () => {
    const results = config.calculate({
      current: '30',
      conductorMaterial: 'copper',
      insulationType: '75',
      numConductors: '4',
    });
    // derating = 0.8, adj = 30/0.8 = 37.5A
    // 12 AWG = 25A < 37.5, 10 AWG = 35A < 37.5, 8 AWG = 50A >= 37.5
    expect(getValue(results, 'recommended')).toContain('8 AWG');
    // Design current should show 37.5
    const designCurrent = parseNumber(getValue(results, 'designCurrent'));
    near(designCurrent, 37.5, 0.1);
  });

  it('shows 80% derating for 4-6 conductors', () => {
    const results = config.calculate({
      current: '20',
      conductorMaterial: 'copper',
      insulationType: '75',
      numConductors: '4',
    });
    expect(getValue(results, 'derating')).toContain('80');
  });

  it('uses 90°C column when selected', () => {
    const results = config.calculate({
      current: '30',
      conductorMaterial: 'copper',
      insulationType: '90',
      numConductors: '1',
    });
    // 90°C copper: 14 AWG = 25A < 30, 12 AWG = 30A >= 30
    expect(getValue(results, 'recommended')).toContain('12 AWG');
  });

  it('returns empty for zero current', () => {
    const results = config.calculate({
      current: '0',
      conductorMaterial: 'copper',
      insulationType: '75',
      numConductors: '1',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for missing current', () => {
    const results = config.calculate({
      current: '',
      conductorMaterial: 'copper',
      insulationType: '75',
      numConductors: '1',
    });
    expect(results).toEqual([]);
  });

  // ── Input config ──
  it('has inputMode set on the current input', () => {
    const currentInput = config.inputs.find(i => i.id === 'current');
    expect(currentInput?.inputMode).toBe('decimal');
  });

  // ── Educational content ──
  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.formulaDescription!.length).toBeGreaterThan(100);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(4);
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(1);
    expect(config.educational.explanation!.length).toBeGreaterThan(300);
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
  });

  it('has worked examples', () => {
    expect(config.educational.workedExamples).toBeTruthy();
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(3);
    for (const we of config.educational.workedExamples!) {
      expect(we.scenario).toBeTruthy();
      expect(we.scenario.length).toBeGreaterThan(50);
      expect(we.insight).toBeTruthy();
      expect(we.inputs).toBeTruthy();
    }
  });

  it('has pro tips', () => {
    expect(config.educational.proTips).toBeTruthy();
    expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(4);
  });

  it('has limitations', () => {
    expect(config.educational.limitations).toBeTruthy();
    expect((config.educational.limitations as unknown[]).length).toBeGreaterThanOrEqual(3);
  });
});
