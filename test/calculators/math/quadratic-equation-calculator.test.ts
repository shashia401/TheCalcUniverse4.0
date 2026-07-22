import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/quadratic/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Quadratic Equation Calculator', () => {
  // ── Two real roots (Δ > 0) ─────────────────────────────────────────
  it('finds two real roots when discriminant > 0', () => {
    const r = config.calculate({ a: '1', b: '-5', c: '6' });
    near(parseNumber(getValue(r, 'discriminant')), 1);
    near(parseNumber(getValue(r, 'x1')), 3);
    near(parseNumber(getValue(r, 'x2')), 2);
    expect(getValue(r, 'equation')).toContain('x²');
  });

  it('finds one repeated root when discriminant = 0', () => {
    const r = config.calculate({ a: '1', b: '-4', c: '4' });
    near(parseNumber(getValue(r, 'discriminant')), 0);
    near(parseNumber(getValue(r, 'x')), 2);
  });

  it('finds complex roots when discriminant < 0', () => {
    const r = config.calculate({ a: '1', b: '2', c: '5' });
    near(parseNumber(getValue(r, 'discriminant')), -16);
    expect(getValue(r, 'complex1')).toContain('i');
    expect(getValue(r, 'complex2')).toContain('i');
  });

  // ── Vertex and axis ───────────────────────────────────────────────
  it('computes vertex and axis of symmetry', () => {
    const r = config.calculate({ a: '1', b: '-5', c: '6' });
    expect(getValue(r, 'vertex')).toContain('2.5');
    const axisVal = parseNumber(getValue(r, 'axis'));
    near(axisVal, 2.5);
  });

  it('shows y-intercept', () => {
    const r = config.calculate({ a: '1', b: '-5', c: '6' });
    expect(getValue(r, 'yIntercept')).toBeTruthy();
    expect(getValue(r, 'yIntercept')).toContain('6');
  });

  it('shows parabola opening direction', () => {
    const r1 = config.calculate({ a: '1', b: '0', c: '0' });
    expect(getValue(r1, 'opensDirection')).toContain('Up');
    const r2 = config.calculate({ a: '-1', b: '0', c: '0' });
    expect(getValue(r2, 'opensDirection')).toContain('Down');
  });

  // ── Vieta's formulas ──────────────────────────────────────────────
  it('shows Vieta sum and product', () => {
    const r = config.calculate({ a: '1', b: '-5', c: '6' });
    expect(getValue(r, 'vietaSum')).toBeTruthy();
    expect(getValue(r, 'vietaProduct')).toBeTruthy();
    near(parseNumber(getValue(r, 'vietaSum')), 5);
    near(parseNumber(getValue(r, 'vietaProduct')), 6);
  });

  // ── Factored form ─────────────────────────────────────────────────
  it('shows factored form for real roots', () => {
    const r = config.calculate({ a: '1', b: '-5', c: '6' });
    expect(getValue(r, 'factoredForm')).toBeTruthy();
    expect(getValue(r, 'factoredForm')).toContain('x');
  });

  // ── Validation ────────────────────────────────────────────────────
  it('returns empty for zero a coefficient', () => {
    expect(config.calculate({ a: '0', b: '2', c: '3' })).toHaveLength(0);
  });

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for NaN b', () => {
    expect(config.calculate({ a: '1', b: 'abc', c: '3' })).toHaveLength(0);
  });

  it('returns empty for NaN c', () => {
    expect(config.calculate({ a: '1', b: '2', c: 'xyz' })).toHaveLength(0);
  });

  // ── Coefficient variations ─────────────────────────────────────────
  it('handles negative a coefficient', () => {
    const r = config.calculate({ a: '-1', b: '4', c: '-3' });
    near(parseNumber(getValue(r, 'discriminant')), 4);
    near(parseNumber(getValue(r, 'x1')), 1);
    near(parseNumber(getValue(r, 'x2')), 3);
  });

  it('handles decimal coefficients', () => {
    const r = config.calculate({ a: '1', b: '0.5', c: '-1.5' });
    const disc = parseNumber(getValue(r, 'discriminant'));
    expect(disc).toBeGreaterThan(0);
    expect(getValue(r, 'x1')).toBeTruthy();
    expect(getValue(r, 'x2')).toBeTruthy();
  });

  it('handles c=0 (factoring out x)', () => {
    const r = config.calculate({ a: '1', b: '-5', c: '0' });
    near(parseNumber(getValue(r, 'x1')), 5);
    near(parseNumber(getValue(r, 'x2')), 0);
  });

  it('handles b=0 (pure quadratic)', () => {
    const r = config.calculate({ a: '1', b: '0', c: '-4' });
    near(parseNumber(getValue(r, 'x1')), 2);
    near(parseNumber(getValue(r, 'x2')), -2);
  });

  it('shows root nature classification', () => {
    const r1 = config.calculate({ a: '1', b: '-5', c: '6' }); // Δ > 0
    expect(getValue(r1, 'rootNature')).toContain('Two distinct real');
    const r2 = config.calculate({ a: '1', b: '-4', c: '4' }); // Δ = 0
    expect(getValue(r2, 'rootNature')).toContain('One repeated');
    const r3 = config.calculate({ a: '1', b: '2', c: '5' }); // Δ < 0
    expect(getValue(r3, 'rootNature')).toContain('complex');
  });

  // ── Educational content ───────────────────────────────────────────
  it('includes educational content fields', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.explanation).toBeTruthy();
    expect(config.educational.workedExamples).toBeTruthy();
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.faqs).toBeTruthy();
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.proTips).toBeTruthy();
    expect(config.educational.proTips!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.quickReference).toBeTruthy();
    expect(config.educational.quickReference!.length).toBeGreaterThanOrEqual(5);
  });

  it('has limitations with real content', () => {
    expect(config.educational.limitations.length).toBeGreaterThan(0);
    expect(config.educational.limitations.every((l: string) => l.length > 20)).toBe(true);
  });

  it('all inputs have inputMode defined', () => {
    for (const input of config.inputs) {
      if (input.type === 'number') {
        expect(input.inputMode).toBeDefined();
      }
    }
  });

  it('has commonUses with real applications', () => {
    expect(config.educational.commonUses).toBeTruthy();
    expect(config.educational.commonUses!.length).toBeGreaterThanOrEqual(4);
  });
});
