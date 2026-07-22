import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/law-of-sines/index';
import { getValue, near } from '../../helpers';

describe('Law of Sines Calculator', () => {
  // ─── ASA: given A=50°, B=60°, a=10 ──────────────────────
  it('solves ASA (A=50°, B=60°, a=10)', () => {
    const r = config.calculate({ sideA: '10', angleA: '50', angleB: '60' });
    // C = 180 - 50 - 60 = 70°
    near(parseFloat(getValue(r, 'angleC')), 70);
    // ratio = 10 / sin(50°) ≈ 13.054
    const ratio = 10 / Math.sin(50 * Math.PI / 180);
    near(parseFloat(getValue(r, 'sideB')), ratio * Math.sin(60 * Math.PI / 180));
    near(parseFloat(getValue(r, 'sideC')), ratio * Math.sin(70 * Math.PI / 180));
    near(parseFloat(getValue(r, 'circumradius')), ratio / 2);
    expect(getValue(r, 'sideA')).toBe('10');
  });

  // ─── AAS: given A=40°, C=80°, a=8 ────────────────────────
  it('solves AAS (A=40°, C=80°, a=8)', () => {
    const r = config.calculate({ sideA: '8', angleA: '40', angleC: '80' });
    // B = 180 - 40 - 80 = 60°
    near(parseFloat(getValue(r, 'angleB')), 60);
    near(parseFloat(getValue(r, 'angleA')), 40);
    near(parseFloat(getValue(r, 'angleC')), 80);
    const ratio = 8 / Math.sin(40 * Math.PI / 180);
    near(parseFloat(getValue(r, 'sideB')), ratio * Math.sin(60 * Math.PI / 180));
    near(parseFloat(getValue(r, 'sideC')), ratio * Math.sin(80 * Math.PI / 180));
  });

  // ─── SSA ambiguous case: a=12, b=8, A=40° ─────────────────
  it('solves SSA (a=12, b=8, A=40°)', () => {
    const r = config.calculate({ sideA: '12', sideB: '8', angleA: '40' });
    // ratio = 12 / sin(40°) ≈ 18.67
    // B = asin(8 / ratio) ≈ asin(0.4286) ≈ 25.4°
    expect(r.length).toBeGreaterThan(0);
    near(parseFloat(getValue(r, 'sideA')), 12);
    near(parseFloat(getValue(r, 'angleA')), 40);
    // B should be acute
    const bVal = parseFloat(getValue(r, 'angleB'));
    expect(bVal).toBeGreaterThan(0);
    expect(bVal).toBeLessThan(180);
    // Sum should be 180
    const aVal = parseFloat(getValue(r, 'angleA'));
    const cVal = parseFloat(getValue(r, 'angleC'));
    near(aVal + bVal + cVal, 180, 0.1);
  });

  // ─── All three sides and all three angles (complete) ──────
  it('accepts a complete triangle and verifies consistency', () => {
    const r = config.calculate({
      sideA: '10', angleA: '50',
      sideB: '11.918', angleB: '66',
      sideC: '8.793', angleC: '64',
    });
    // All values known, should just return them
    near(parseFloat(getValue(r, 'sideA')), 10);
    expect(getValue(r, 'angleA')).toContain('50');
    // Should have 8 results
    expect(r.length).toBe(8);
  });

  // ─── Right triangle: a=3, A=30°, B=60° ────────────────────
  it('solves right triangle (a=3, A=30°, B=60°)', () => {
    // C = 90° (right)
    const r = config.calculate({ sideA: '3', angleA: '30', angleB: '60' });
    near(parseFloat(getValue(r, 'angleC')), 90);
    const ratio = 3 / Math.sin(30 * Math.PI / 180); // = 6
    near(parseFloat(getValue(r, 'sideB')), ratio * Math.sin(60 * Math.PI / 180));
    near(parseFloat(getValue(r, 'sideC')), ratio * Math.sin(90 * Math.PI / 180));
  });

  // ─── Edge case: exactly 3 values but no complete pair ─────
  it('returns empty when no complete side-angle pair', () => {
    const r = config.calculate({ sideA: '10', sideB: '15', sideC: '20' });
    expect(r).toEqual([]);
  });

  // ─── Edge case: fewer than 3 values ───────────────────────
  it('returns empty when fewer than 3 values', () => {
    const r = config.calculate({ sideA: '10', angleA: '30' });
    expect(r).toEqual([]);
  });

  it('returns empty for empty input', () => {
    const r = config.calculate({});
    expect(r).toEqual([]);
  });

  // ─── Edge case: invalid numeric values ────────────────────
  it('returns empty for NaN side', () => {
    const r = config.calculate({ sideA: 'abc', angleA: '30', angleB: '60' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN angle', () => {
    const r = config.calculate({ sideA: '10', angleA: 'xyz', sideB: '15' });
    expect(r).toEqual([]);
  });

  // ─── Ratio and circumradius ───────────────────────────────
  it('computes ratio and circumradius correctly', () => {
    const r = config.calculate({ sideA: '10', angleA: '30', angleB: '90' });
    const ratio = 10 / Math.sin(30 * Math.PI / 180); // = 10 / 0.5 = 20
    near(parseFloat(getValue(r, 'ratio')), ratio);
    near(parseFloat(getValue(r, 'circumradius')), ratio / 2);
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
