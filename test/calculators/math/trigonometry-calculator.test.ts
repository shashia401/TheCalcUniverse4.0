import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/trigonometry-calculator/index';
import { near } from '../../helpers';

describe('Trigonometry Calculator', () => {
  // ─── Angle → Trig Values ──────────────────────────────────

  it('Angle 30° → sin=0.5, cos=0.8660, tan=0.5774', () => {
    const r = config.calculate({ mode: 'angle-to-trig', angle: '30' });
    const sinVal = parseFloat(r.find((x) => x.id === 'sin')!.value);
    const cosVal = parseFloat(r.find((x) => x.id === 'cos')!.value);
    const tanVal = parseFloat(r.find((x) => x.id === 'tan')!.value);
    near(sinVal, 0.5);
    near(cosVal, 0.8660254);
    near(tanVal, 0.57735027);
  });

  it('Angle 45° → sin=0.7071, cos=0.7071, tan=1', () => {
    const r = config.calculate({ mode: 'angle-to-trig', angle: '45' });
    const sinVal = parseFloat(r.find((x) => x.id === 'sin')!.value);
    const cosVal = parseFloat(r.find((x) => x.id === 'cos')!.value);
    const tanVal = parseFloat(r.find((x) => x.id === 'tan')!.value);
    near(sinVal, 0.70710678);
    near(cosVal, 0.70710678);
    near(tanVal, 1);
  });

  it('Angle 60° → sin=0.8660, cos=0.5, tan=1.7321', () => {
    const r = config.calculate({ mode: 'angle-to-trig', angle: '60' });
    const sinVal = parseFloat(r.find((x) => x.id === 'sin')!.value);
    const cosVal = parseFloat(r.find((x) => x.id === 'cos')!.value);
    const tanVal = parseFloat(r.find((x) => x.id === 'tan')!.value);
    near(sinVal, 0.8660254);
    near(cosVal, 0.5);
    near(tanVal, 1.7320508);
  });

  it('Angle 0° → sin=0, cos=1, tan=0, csc=Undefined', () => {
    const r = config.calculate({ mode: 'angle-to-trig', angle: '0' });
    expect(parseFloat(r.find((x) => x.id === 'sin')!.value)).toBeCloseTo(0, 5);
    expect(parseFloat(r.find((x) => x.id === 'cos')!.value)).toBeCloseTo(1, 5);
    expect(parseFloat(r.find((x) => x.id === 'tan')!.value)).toBeCloseTo(0, 5);
    expect(r.find((x) => x.id === 'csc')!.value).toContain('Undefined');
  });

  it('Angle 90° → sin=1, cos=0, tan=infinite, sec=Undefined', () => {
    const r = config.calculate({ mode: 'angle-to-trig', angle: '90' });
    expect(parseFloat(r.find((x) => x.id === 'sin')!.value)).toBeCloseTo(1, 5);
    expect(parseFloat(r.find((x) => x.id === 'cos')!.value)).toBeCloseTo(0, 5);
    expect(r.find((x) => x.id === 'sec')!.value).toContain('Undefined');
  });

  it('Angle 90° → csc=1, cot should not crash', () => {
    const r = config.calculate({ mode: 'angle-to-trig', angle: '90' });
    const csc = r.find((x) => x.id === 'csc');
    const cot = r.find((x) => x.id === 'cot');
    expect(parseFloat(csc!.value)).toBeCloseTo(1, 5);
    expect(cot).toBeDefined();
  });

  it('Angle 180° → sin=0, cos=-1, tan=0, csc=Undefined', () => {
    const r = config.calculate({ mode: 'angle-to-trig', angle: '180' });
    expect(parseFloat(r.find((x) => x.id === 'sin')!.value)).toBeCloseTo(0, 5);
    expect(parseFloat(r.find((x) => x.id === 'cos')!.value)).toBeCloseTo(-1, 5);
    expect(parseFloat(r.find((x) => x.id === 'tan')!.value)).toBeCloseTo(0, 5);
    expect(r.find((x) => x.id === 'csc')!.value).toContain('Undefined');
  });

  it('Angle 270° → sin=-1, cos=0, csc=-1, sec=Undefined', () => {
    const r = config.calculate({ mode: 'angle-to-trig', angle: '270' });
    expect(parseFloat(r.find((x) => x.id === 'sin')!.value)).toBeCloseTo(-1, 5);
    expect(parseFloat(r.find((x) => x.id === 'cos')!.value)).toBeCloseTo(0, 5);
    expect(parseFloat(r.find((x) => x.id === 'csc')!.value)).toBeCloseTo(-1, 5);
    expect(r.find((x) => x.id === 'sec')!.value).toContain('Undefined');
  });

  it('sin result is highlighted with positive color when sin >= 0', () => {
    const r = config.calculate({ mode: 'angle-to-trig', angle: '30' });
    const sinResult = r.find((x) => x.id === 'sin');
    expect(sinResult?.highlight).toBe(true);
    expect(sinResult?.color).toBe('positive');
  });

  // ─── Trig Value → Angle ──────────────────────────────────

  it('sin⁻¹(0.5) → principal angle = 30°', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'sin', trigValue: '0.5' });
    const angle = r.find((x) => x.id === 'principalAngle')!.value;
    expect(angle).toContain('30');
  });

  it('sin⁻¹(1) → principal angle = 90°', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'sin', trigValue: '1' });
    const angle = r.find((x) => x.id === 'principalAngle')!.value;
    expect(angle).toContain('90');
  });

  it('sin⁻¹(-1) → principal angle = -90°', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'sin', trigValue: '-1' });
    const angle = r.find((x) => x.id === 'principalAngle')!.value;
    expect(angle).toContain('-90');
  });

  it('cos⁻¹(0.5) → principal angle = 60°', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'cos', trigValue: '0.5' });
    const angle = r.find((x) => x.id === 'principalAngle')!.value;
    expect(angle).toContain('60');
  });

  it('cos⁻¹(0) → principal angle = 90°', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'cos', trigValue: '0' });
    const angle = r.find((x) => x.id === 'principalAngle')!.value;
    expect(angle).toContain('90');
  });

  it('tan⁻¹(1) → principal angle = 45°', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'tan', trigValue: '1' });
    const angle = r.find((x) => x.id === 'principalAngle')!.value;
    expect(angle).toContain('45');
  });

  it('tan⁻¹(0) → principal angle = 0°', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'tan', trigValue: '0' });
    const angle = r.find((x) => x.id === 'principalAngle')!.value;
    expect(angle).toContain('0');
  });

  it('subtracts reference angle correctly for sin values', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'sin', trigValue: '0.5' });
    const ref = r.find((x) => x.id === 'referenceAngle')!.value;
    expect(ref).toContain('30');
  });

  // ─── Domain Errors ───────────────────────────────────────

  it('sin value > 1 returns error', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'sin', trigValue: '1.5' });
    const err = r.find((x) => x.id === 'error');
    expect(err).toBeDefined();
    expect(err!.value).toContain('[-1, 1]');
    expect(err!.color).toBe('negative');
  });

  it('sin value < -1 returns error', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'sin', trigValue: '-2' });
    const err = r.find((x) => x.id === 'error');
    expect(err).toBeDefined();
  });

  it('cos value > 1 returns error', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'cos', trigValue: '3' });
    const err = r.find((x) => x.id === 'error');
    expect(err).toBeDefined();
  });

  it('tan accepts any value without error', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'tan', trigValue: '1000' });
    expect(r.find((x) => x.id === 'principalAngle')).toBeDefined();
    expect(r.find((x) => x.id === 'error')).toBeUndefined();
  });

  it('csc value of 0 returns domain error', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'csc', trigValue: '0' });
    expect(r.find((x) => x.id === 'error')).toBeDefined();
  });

  it('csc value with |value| < 1 returns domain error', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'csc', trigValue: '0.5' });
    expect(r.find((x) => x.id === 'error')).toBeDefined();
  });

  it('sec value of 0 returns domain error', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'sec', trigValue: '0' });
    expect(r.find((x) => x.id === 'error')).toBeDefined();
  });

  it('sec value with |value| < 1 returns domain error', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'sec', trigValue: '0.2' });
    expect(r.find((x) => x.id === 'error')).toBeDefined();
  });

  it('cot value of 0 returns domain error', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'cot', trigValue: '0' });
    expect(r.find((x) => x.id === 'error')).toBeDefined();
  });

  // ─── Reciprocal inverse trig ─────────────────────────────

  it('csc⁻¹(2) → principal angle = 30° (since csc 30° = 2)', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'csc', trigValue: '2' });
    const angle = r.find((x) => x.id === 'principalAngle')!.value;
    expect(angle).toContain('30');
  });

  it('sec⁻¹(2) → principal angle = 60° (since sec 60° = cos⁻¹(0.5) = 60°)', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'sec', trigValue: '2' });
    const angle = r.find((x) => x.id === 'principalAngle')!.value;
    expect(angle).toContain('60');
  });

  it('cot⁻¹(1) → principal angle = 45° (since cot 45° = 1)', () => {
    const r = config.calculate({ mode: 'trig-to-angle', function: 'cot', trigValue: '1' });
    const angle = r.find((x) => x.id === 'principalAngle')!.value;
    expect(angle).toContain('45');
  });

  // ─── Validation ──────────────────────────────────────────

  it('empty mode returns empty', () => {
    expect(config.calculate({})).toEqual([]);
  });

  it('empty angle returns empty', () => {
    expect(config.calculate({ mode: 'angle-to-trig', angle: '' })).toEqual([]);
  });

  it('empty trigValue returns empty', () => {
    expect(config.calculate({ mode: 'trig-to-angle', function: 'sin', trigValue: '' })).toEqual([]);
  });

  it('missing function returns empty', () => {
    expect(config.calculate({ mode: 'trig-to-angle', function: '', trigValue: '0.5' })).toEqual([]);
  });

  it('invalid angle string returns empty', () => {
    expect(config.calculate({ mode: 'angle-to-trig', angle: 'abc' })).toEqual([]);
  });

  it('invalid trigValue string returns empty', () => {
    expect(config.calculate({ mode: 'trig-to-angle', function: 'sin', trigValue: 'abc' })).toEqual([]);
  });

  // ─── Educational Content ─────────────────────────────────

  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.formulaDescription!.length).toBeGreaterThan(100);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.explanation!.length).toBeGreaterThan(300);
  });

  it('has 1-2 citations with real URLs', () => {
    const citations = (config.educational as any).citations;
    expect(citations).toBeDefined();
    expect(citations.length).toBeGreaterThanOrEqual(1);
    expect(citations.length).toBeLessThanOrEqual(2);
    for (const c of citations) {
      expect(c.source).toBeTruthy();
      expect(c.url).toMatch(/^https?:\/\//);
    }
  });

  it('has a diagram with svg, alt, and caption', () => {
    const diagram = config.educational.diagram;
    expect(diagram).toBeDefined();
    expect(diagram!.svg).toBeTruthy();
    expect(diagram!.svg).toContain('viewBox');
    expect(diagram!.svg).toContain('max-width:100%;height:auto');
    expect(diagram!.alt).toBeTruthy();
    expect(diagram!.caption).toBeTruthy();
  });

  it('has quickReference with 2-4 entries', () => {
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.quickReference!.length).toBeLessThanOrEqual(4);
  });
});
