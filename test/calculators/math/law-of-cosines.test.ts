import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/law-of-cosines/index';
import { getValue, near } from '../../helpers';

describe('Law of Cosines Calculator', () => {
  // ─── SSS mode ────────────────────────────────────────────

  it('SSS: 3-4-5 triangle returns angleC = 90°', () => {
    const r = config.calculate({ mode: 'sss', a: '3', b: '4', c: '5' });
    near(parseFloat(getValue(r, 'angleC')), 90, 0.01);
    near(parseFloat(getValue(r, 'angleA')), 36.87, 0.1);
    near(parseFloat(getValue(r, 'angleB')), 53.13, 0.1);
    near(parseFloat(getValue(r, 'a')), 3);
    near(parseFloat(getValue(r, 'b')), 4);
    near(parseFloat(getValue(r, 'c')), 5);
  });

  it('SSS: 5-5-5 equilateral triangle returns 60° for all angles', () => {
    const r = config.calculate({ mode: 'sss', a: '5', b: '5', c: '5' });
    near(parseFloat(getValue(r, 'angleA')), 60, 0.01);
    near(parseFloat(getValue(r, 'angleB')), 60, 0.01);
    near(parseFloat(getValue(r, 'angleC')), 60, 0.01);
  });

  it('SSS: 6-7-8 triangle', () => {
    const r = config.calculate({ mode: 'sss', a: '6', b: '7', c: '8' });
    // cos(C) = (36 + 49 - 64)/(2*6*7) = 21/84 = 0.25
    // C = arccos(0.25) ≈ 75.52°
    near(parseFloat(getValue(r, 'angleC')), 75.52, 0.1);
    near(parseFloat(getValue(r, 'angleA')), 46.57, 0.1);
    near(parseFloat(getValue(r, 'angleB')), 57.91, 0.1);
    // Sum should be 180
    const sum = parseFloat(getValue(r, 'angleA')) + parseFloat(getValue(r, 'angleB')) + parseFloat(getValue(r, 'angleC'));
    near(sum, 180, 0.1);
  });

  it('SSS: has work steps', () => {
    const r = config.calculate({ mode: 'sss', a: '3', b: '4', c: '5' });
    const steps = getValue(r, 'steps');
    expect(steps).toContain('cos(C)');
    expect(steps).toContain('cos⁻¹');
    expect(steps).toContain('180');
  });

  // ─── SAS mode ────────────────────────────────────────────

  it('SAS: a=5, b=6, C=60° finds c ≈ 5.568', () => {
    const r = config.calculate({ mode: 'sas', a: '5', b: '6', angleC: '60' });
    // c² = 25 + 36 - 2*5*6*cos(60°) = 61 - 60*0.5 = 61 - 30 = 31
    // c = sqrt(31) ≈ 5.568
    near(parseFloat(getValue(r, 'c')), 5.568, 0.01);
    near(parseFloat(getValue(r, 'angleC')), 60);
    near(parseFloat(getValue(r, 'a')), 5);
    near(parseFloat(getValue(r, 'b')), 6);
    // Should have angles A and B too
    expect(parseFloat(getValue(r, 'angleA'))).toBeGreaterThan(0);
    expect(parseFloat(getValue(r, 'angleB'))).toBeGreaterThan(0);
    // Sum should be 180
    const sum = parseFloat(getValue(r, 'angleA')) + parseFloat(getValue(r, 'angleB')) + parseFloat(getValue(r, 'angleC'));
    near(sum, 180, 0.1);
  });

  it('SAS: a=3, b=4, C=90° (right triangle) finds c=5', () => {
    const r = config.calculate({ mode: 'sas', a: '3', b: '4', angleC: '90' });
    near(parseFloat(getValue(r, 'c')), 5, 0.01);
    near(parseFloat(getValue(r, 'angleC')), 90);
  });

  it('SAS: has work steps', () => {
    const r = config.calculate({ mode: 'sas', a: '3', b: '4', angleC: '90' });
    const steps = getValue(r, 'steps');
    expect(steps).toContain('c²');
    expect(steps).toContain('cos⁻¹');
  });

  // ─── Edge cases: invalid inputs ──────────────────────────

  it('returns empty when a is NaN', () => {
    const r = config.calculate({ mode: 'sss', a: 'abc', b: '4', c: '5' });
    expect(r).toEqual([]);
  });

  it('returns empty when b is NaN', () => {
    const r = config.calculate({ mode: 'sas', a: '3', b: 'xyz', angleC: '60' });
    expect(r).toEqual([]);
  });

  it('returns empty when c is missing in SSS mode', () => {
    const r = config.calculate({ mode: 'sss', a: '3', b: '4' });
    expect(r).toEqual([]);
  });

  it('returns empty when angleC is missing in SAS mode', () => {
    const r = config.calculate({ mode: 'sas', a: '3', b: '4' });
    expect(r).toEqual([]);
  });

  it('returns empty for empty input', () => {
    const r = config.calculate({});
    expect(r).toEqual([]);
  });

  it('returns empty when triangle inequality is violated in SSS', () => {
    const r = config.calculate({ mode: 'sss', a: '1', b: '2', c: '10' });
    expect(r).toEqual([]);
  });

  it('returns empty for negative sides', () => {
    const r = config.calculate({ mode: 'sss', a: '-3', b: '4', c: '5' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid angle in SAS (angle >= 180)', () => {
    const r = config.calculate({ mode: 'sas', a: '3', b: '4', angleC: '200' });
    expect(r).toEqual([]);
  });

  // ─── Educational content ──────────────────────────────────

  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.formulaDescription!.length).toBeGreaterThan(100);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.explanation!.length).toBeGreaterThan(300);
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(1);
    expect(config.educational.diagram).toBeTruthy();
    expect(config.educational.diagram!.svg).toBeTruthy();
    expect(config.educational.diagram!.alt).toBeTruthy();
  });
});
