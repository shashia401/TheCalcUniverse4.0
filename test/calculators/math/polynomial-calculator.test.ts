import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/polynomial-calculator/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('polynomial calculator', () => {
  it('evaluates x² - 3x + 2 at x = 4', () => {
    const r = config.calculate({ coefficients: '1, -3, 2', x: '4' });
    expect(getValue(r, 'polynomial')).toBe('x² − 3x + 2');
    expect(getValue(r, 'degree')).toBe('2');
    near(parseNumber(getValue(r, 'evaluated')), 6);
    expect(getValue(r, 'work')).toContain('= 6');
  });

  it('evaluates 2x² - 4x + 1 at x = 3', () => {
    const r = config.calculate({ coefficients: '2, -4, 1', x: '3' });
    expect(getValue(r, 'polynomial')).toContain('2x²');
    near(parseNumber(getValue(r, 'evaluated')), 7);
  });

  it('handles cubic polynomial: x³ - 2x² + 0x + 1 at x = 2', () => {
    const r = config.calculate({ coefficients: '1, -2, 0, 1', x: '2' });
    expect(getValue(r, 'polynomial')).toContain('x³');
    expect(getValue(r, 'degree')).toBe('3');
    near(parseNumber(getValue(r, 'evaluated')), 1);
  });

  it('handles constant polynomial', () => {
    const r = config.calculate({ coefficients: '42', x: '10' });
    expect(getValue(r, 'degree')).toBe('0');
    near(parseNumber(getValue(r, 'evaluated')), 42);
  });

  it('handles linear polynomial: 3x + 5 at x = -2', () => {
    const r = config.calculate({ coefficients: '3, 5', x: '-2' });
    expect(getValue(r, 'degree')).toBe('1');
    near(parseNumber(getValue(r, 'evaluated')), -1);
  });

  it('handles negative coefficients correctly', () => {
    const r = config.calculate({ coefficients: '-2, 3, -4', x: '1' });
    expect(getValue(r, 'polynomial')).toContain('-2x²');
    near(parseNumber(getValue(r, 'evaluated')), -3);
  });

  it('handles all positive coefficients', () => {
    const r = config.calculate({ coefficients: '1, 2, 3, 4, 5', x: '1' });
    expect(getValue(r, 'degree')).toBe('4');
    near(parseNumber(getValue(r, 'evaluated')), 15);
  });

  it('evaluates at x = 0 correctly', () => {
    const r = config.calculate({ coefficients: '1, -3, 2', x: '0' });
    near(parseNumber(getValue(r, 'evaluated')), 2);
  });

  it('returns empty for empty coefficients input', () => {
    expect(config.calculate({ coefficients: '', x: '2' })).toHaveLength(0);
  });

  it('returns empty for missing coefficients', () => {
    expect(config.calculate({ x: '2' })).toHaveLength(0);
  });

  it('returns empty for NaN x', () => {
    expect(config.calculate({ coefficients: '1, 2', x: 'abc' })).toHaveLength(0);
  });

  it('returns empty for NaN in coefficients', () => {
    expect(config.calculate({ coefficients: '1, abc, 2', x: '2' })).toHaveLength(0);
  });

  it('shows leading coefficient in results', () => {
    const r = config.calculate({ coefficients: '4, -3, 2, 1', x: '1' });
    expect(getValue(r, 'leadingCoeff')).toBe('4');
  });

  it('has work steps showing substitution', () => {
    const r = config.calculate({ coefficients: '1, -3, 2', x: '4' });
    const work = getValue(r, 'work');
    expect(work).toContain('P(');
    expect(work).toContain('×');
    expect(work).toContain('=');
  });

  it('shows degree classification label in extraPanel results check', () => {
    const r = config.calculate({ coefficients: '1, 0, 0, 0, 0, 1', x: '0' });
    expect(getValue(r, 'degree')).toBe('5');
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
