import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/engineering/mtbf/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('MTBF Calculator', () => {
  it('calculates MTBF from operating hours and failures', () => {
    const results = config.calculate({
      mode: 'mtbf',
      operatingHours: '50000',
      numberOfFailures: '5',
      mtbf: '',
      missionTime: '',
    });
    const mtbf = parseNumber(getValue(results, 'mtbf'));
    near(mtbf, 10000); // 50000 / 5 = 10000 hours
  });

  it('calculates failure rate from MTBF', () => {
    const results = config.calculate({
      mode: 'mtbf',
      operatingHours: '50000',
      numberOfFailures: '5',
      mtbf: '',
      missionTime: '',
    });
    const rate = getValue(results, 'failureRate');
    // λ = 1/10000 = 0.0001
    expect(rate).toContain('e-4');
  });

  it('calculates 1-year reliability from MTBF', () => {
    const results = config.calculate({
      mode: 'mtbf',
      operatingHours: '100000',
      numberOfFailures: '5',
      mtbf: '',
      missionTime: '',
    });
    // MTBF = 20000, R(8760) = e^(-8760/20000) * 100 = 64.5%
    const reliability = parseNumber(getValue(results, 'reliability1yr'));
    near(reliability, 64.5, 0.5);
  });

  it('calculates reliability at a specific mission time', () => {
    const results = config.calculate({
      mode: 'reliability',
      operatingHours: '',
      numberOfFailures: '',
      mtbf: '10000',
      missionTime: '8760',
    });
    // R = e^(-8760/10000) * 100 = 41.7%
    const reliability = parseNumber(getValue(results, 'reliability'));
    near(reliability, 41.7, 0.5);
  });

  it('calculates expected failures over a time period', () => {
    const results = config.calculate({
      mode: 'failures',
      operatingHours: '',
      numberOfFailures: '',
      mtbf: '10000',
      missionTime: '8760',
    });
    const failures = parseNumber(getValue(results, 'expectedFailures'));
    near(failures, 0.876, 0.01); // 8760 / 10000
  });

  it('returns empty for missing inputs in MTBF mode', () => {
    const results = config.calculate({
      mode: 'mtbf',
      operatingHours: '',
      numberOfFailures: '',
      mtbf: '',
      missionTime: '',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for zero failures in MTBF mode', () => {
    const results = config.calculate({
      mode: 'mtbf',
      operatingHours: '50000',
      numberOfFailures: '0',
      mtbf: '',
      missionTime: '',
    });
    expect(results).toEqual([]);
  });

  // ── Input config ──
  it('has inputMode set on numeric inputs', () => {
    const hourInput = config.inputs.find(i => i.id === 'operatingHours');
    const failuresInput = config.inputs.find(i => i.id === 'numberOfFailures');
    const mtbfInput = config.inputs.find(i => i.id === 'mtbf');
    const missionInput = config.inputs.find(i => i.id === 'missionTime');
    expect(hourInput?.inputMode).toBe('decimal');
    expect(failuresInput?.inputMode).toBe('decimal');
    expect(mtbfInput?.inputMode).toBe('decimal');
    expect(missionInput?.inputMode).toBe('decimal');
  });

  it('has default value on mode select', () => {
    const modeInput = config.inputs.find(i => i.id === 'mode');
    expect(modeInput?.defaultValue).toBeTruthy();
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
