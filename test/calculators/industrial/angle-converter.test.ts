import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/angle-converter';
import { getResult, near } from '../../helpers';

function getConversionValue(results: Array<{ id: string; value: string }>, id: string): number {
  const str = getResult(results, id).value;
  // Result format: "180 deg = 3.141593 rad" — extract number after "="
  const m = /= ([\d.,-]+)/.exec(str);
  if (!m) throw new Error(`Cannot parse conversion value from: "${str}"`);
  return parseFloat(m[1].replace(/,/g, ''));
}

describe('Angle Converter', () => {
  it('converts 180 degrees to pi radians', () => {
    const r = config.calculate({
      value: '180',
      from: 'deg',
      to: 'rad',
    });
    near(getConversionValue(r, 'result'), 3.1416, 0.001);
  });

  it('converts 1 radian to degrees', () => {
    const r = config.calculate({
      value: '1',
      from: 'rad',
      to: 'deg',
    });
    near(getConversionValue(r, 'result'), 57.2958, 0.01);
  });

  it('converts 90 degrees to gradians', () => {
    const r = config.calculate({
      value: '90',
      from: 'deg',
      to: 'grad',
    });
    near(getConversionValue(r, 'result'), 100, 0.01);
  });

  it('converts 360 degrees to 1 turn', () => {
    const r = config.calculate({
      value: '360',
      from: 'deg',
      to: 'turn',
    });
    near(getConversionValue(r, 'result'), 1, 0.001);
  });

  it('converts 1 degree to 60 arcminutes', () => {
    const r = config.calculate({
      value: '1',
      from: 'deg',
      to: 'arcmin',
    });
    near(getConversionValue(r, 'result'), 60, 0.01);
  });

  it('returns empty array for empty value', () => {
    const r = config.calculate({
      value: '',
      from: 'deg',
      to: 'rad',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for NaN value', () => {
    const r = config.calculate({
      value: 'abc',
      from: 'deg',
      to: 'rad',
    });
    expect(r).toEqual([]);
  });

  it('converts compass point to degrees', () => {
    const r = config.calculate({
      value: '1',
      from: 'point',
      to: 'deg',
    });
    near(getConversionValue(r, 'result'), 11.25, 0.01);
  });

  // ── Input config ──
  it('has inputMode set on the value input', () => {
    const valueInput = config.inputs.find(i => i.id === 'value');
    expect(valueInput?.inputMode).toBe('decimal');
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
