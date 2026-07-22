import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/length-converter/index';

describe('Length Converter', () => {
  // ── Core conversions ──
  it('converts 1 m to 3.281 ft', () => {
    const r = config.calculate({ value: '1', from: 'm', to: 'ft' });
    expect(r[0].value).toContain('3.28084');
  });

  it('converts 1 ft to 30.48 cm', () => {
    const r = config.calculate({ value: '1', from: 'ft', to: 'cm' });
    expect(r[0].value).toContain('30.48');
  });

  it('converts 1 mi to 1.609 km', () => {
    const r = config.calculate({ value: '1', from: 'mi', to: 'km' });
    expect(r[0].value).toContain('1.609');
  });

  it('converts 1 km to 0.621 mi', () => {
    const r = config.calculate({ value: '1', from: 'km', to: 'mi' });
    expect(r[0].value).toContain('0.621');
  });

  it('converts 1 nmi to 1.852 km', () => {
    const r = config.calculate({ value: '1', from: 'nmi', to: 'km' });
    expect(r[0].value).toContain('1.852');
    expect(r[0].value).toContain('km');
  });

  it('converts 2.54 cm to 1 in', () => {
    const r = config.calculate({ value: '2.54', from: 'cm', to: 'in' });
    expect(r[0].value).toContain('1');
  });

  it('converts 1000 mm to 1 m', () => {
    const r = config.calculate({ value: '1000', from: 'mm', to: 'm' });
    expect(r[0].value).toContain('1');
  });

  // ── Edge cases ──
  it('returns empty for missing value', () => {
    expect(config.calculate({})).toEqual([]);
  });

  it('returns empty for empty string value', () => {
    expect(config.calculate({ value: '', from: 'm', to: 'ft' })).toEqual([]);
  });

  it('returns empty for invalid value', () => {
    expect(config.calculate({ value: 'abc', from: 'm', to: 'ft' })).toEqual([]);
  });

  it('handles negative value (mathematically valid, physically meaningless)', () => {
    const r = config.calculate({ value: '-5', from: 'm', to: 'ft' });
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].value).toContain('-');
  });

  it('returns empty for null value', () => {
    expect(config.calculate({ value: null as unknown as string, from: 'm', to: 'ft' })).toEqual([]);
  });

  it('returns empty for undefined value', () => {
    expect(config.calculate({ value: undefined, from: 'm', to: 'ft' })).toEqual([]);
  });

  it('returns empty for NaN value', () => {
    expect(config.calculate({ value: 'NaN', from: 'm', to: 'ft' })).toEqual([]);
  });

  it('returns empty for unknown from unit', () => {
    expect(config.calculate({ value: '10', from: 'lightyear', to: 'm' })).toEqual([]);
  });

  it('returns empty for unknown to unit', () => {
    expect(config.calculate({ value: '10', from: 'm', to: 'parsec' })).toEqual([]);
  });

  // ── Identity conversions ──
  it('identity: 5 m = 5 m', () => {
    const r = config.calculate({ value: '5', from: 'm', to: 'm' });
    expect(r[0].value).toContain('5 m = 5');
  });

  it('identity: 0 ft = 0 ft', () => {
    const r = config.calculate({ value: '0', from: 'ft', to: 'ft' });
    expect(r[0].value).toContain('0 ft = 0');
  });

  // ── Result structure ──
  it('returns result and formula', () => {
    const r = config.calculate({ value: '2', from: 'm', to: 'cm' });
    expect(r).toHaveLength(2);
    expect(r[0].id).toBe('result');
    expect(r[0].highlight).toBe(true);
    expect(r[0].color).toBe('positive');
    expect(r[1].id).toBe('formula');
  });

  // ── Input config ──
  it('has three inputs with helpText', () => {
    expect(config.inputs).toHaveLength(3);
    for (const input of config.inputs) {
      expect(input.helpText).toBeTruthy();
      expect(input.helpText!.length).toBeGreaterThan(10);
    }
  });

  it('has inputMode set on the value input', () => {
    const valueInput = config.inputs.find(i => i.id === 'value');
    expect(valueInput?.inputMode).toBe('decimal');
  });

  it('has defaultValue on inputs', () => {
    const valueInput = config.inputs.find(i => i.id === 'value');
    const fromInput = config.inputs.find(i => i.id === 'from');
    const toInput = config.inputs.find(i => i.id === 'to');
    expect(valueInput?.defaultValue).toBeTruthy();
    expect(fromInput?.defaultValue).toBeTruthy();
    expect(toInput?.defaultValue).toBeTruthy();
  });

  // ── Educational content ──
  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.formulaDescription!.length).toBeGreaterThan(100);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(7);
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(2);
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
    expect(config.educational.limitations!.length).toBeGreaterThanOrEqual(3);
  });

  it('has diagram with alt text and caption', () => {
    expect(config.educational.diagram).toBeTruthy();
    expect(config.educational.diagram!.svg).toBeTruthy();
    expect(config.educational.diagram!.alt).toBeTruthy();
    expect(config.educational.diagram!.caption).toBeTruthy();
  });
});
