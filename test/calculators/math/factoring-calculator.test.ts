import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/factoring-calculator/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('factoring calculator', () => {
  it('factors x² - 5x + 6 correctly', () => {
    const r = config.calculate({ a: '1', b: '-5', c: '6' });
    expect(getValue(r, 'original')).toContain('x²');
    expect(getValue(r, 'original')).toContain('5x');
    expect(getValue(r, 'factored')).toContain('(x − 2)');
    expect(getValue(r, 'factored')).toContain('(x − 3)');
    expect(getValue(r, 'roots')).toContain('2');
    expect(getValue(r, 'roots')).toContain('3');
    near(parseNumber(getValue(r, 'discriminant')), 1);
    expect(getValue(r, 'steps')).toContain('Step 1');
    expect(getValue(r, 'steps')).toContain('Step 6');
  });

  it('factors 2x² + 7x + 3 correctly (a != 1)', () => {
    const r = config.calculate({ a: '2', b: '7', c: '3' });
    expect(getValue(r, 'factored')).toContain('2x + 1');
    expect(getValue(r, 'factored')).toContain('x + 3');
    near(parseNumber(getValue(r, 'discriminant')), 25);
    const root1 = parseNumber(getValue(r, 'root1'));
    const root2 = parseNumber(getValue(r, 'root2'));
    expect(root1 === -0.5 || root2 === -0.5).toBe(true);
    expect(root1 === -3 || root2 === -3).toBe(true);
  });

  it('factors x² + 6x + 9 as perfect square', () => {
    const r = config.calculate({ a: '1', b: '6', c: '9' });
    expect(getValue(r, 'factored')).toContain('x + 3');
    near(parseNumber(getValue(r, 'discriminant')), 0);
  });

  it('factors x² - 4 (difference of squares)', () => {
    const r = config.calculate({ a: '1', b: '0', c: '-4' });
    expect(getValue(r, 'factored')).toContain('x − 2');
    expect(getValue(r, 'factored')).toContain('x + 2');
    near(parseNumber(getValue(r, 'discriminant')), 16);
  });

  it('handles negative a coefficient', () => {
    const r = config.calculate({ a: '-1', b: '5', c: '-6' });
    expect(getValue(r, 'original')).toContain('-x²');
    near(parseNumber(getValue(r, 'discriminant')), 1);
    expect(getValue(r, 'roots')).toContain('2');
    expect(getValue(r, 'roots')).toContain('3');
  });

  it('returns complex roots for negative discriminant', () => {
    const r = config.calculate({ a: '1', b: '2', c: '5' });
    near(parseNumber(getValue(r, 'discriminant')), -16);
    expect(getValue(r, 'roots')).toContain('i');
    expect(getValue(r, 'factored')).toContain('complex');
  });

  it('returns empty for zero a coefficient', () => {
    expect(config.calculate({ a: '0', b: '2', c: '3' })).toHaveLength(0);
  });

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for NaN inputs', () => {
    expect(config.calculate({ a: 'abc', b: '2', c: '3' })).toHaveLength(0);
    expect(config.calculate({ a: '1', b: 'xyz', c: '3' })).toHaveLength(0);
    expect(config.calculate({ a: '1', b: '2', c: 'xyz' })).toHaveLength(0);
  });

  it('handles large coefficients', () => {
    const r = config.calculate({ a: '6', b: '-7', c: '-3' });
    near(parseNumber(getValue(r, 'discriminant')), 121);
    expect(getValue(r, 'factored')).toContain('2x − 3');
    expect(getValue(r, 'factored')).toContain('3x + 1');
  });

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
    expect(config.educational.diagram).toBeDefined();
    expect(config.educational.diagram!.svg).toContain('viewBox');
    expect(config.educational.diagram!.svg).toContain('max-width:100%;height:auto');
    expect(config.educational.diagram!.alt).toBeTruthy();
    expect(config.educational.diagram!.caption).toBeTruthy();
  });
});
