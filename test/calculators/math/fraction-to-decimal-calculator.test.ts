import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/fraction-to-decimal/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('fraction-to-decimal-calculator', () => {
  it('converts proper fraction to decimal', () => {
    const r = config.calculate({ mode: 'ftod', numerator: '3', denominator: '4' });
    near(parseNumber(getValue(r, 'decimal')), 0.75);
    expect(getValue(r, 'percentage')).toBe('75%');
    expect(getValue(r, 'simplified')).toBe('3/4');
  });

  it('converts improper fraction to decimal', () => {
    const r = config.calculate({ mode: 'ftod', numerator: '7', denominator: '3' });
    near(parseNumber(getValue(r, 'decimal')), 2.33333, 0.01);
    expect(getValue(r, 'simplified')).toBe('7/3');
  });

  it('converts decimal to fraction', () => {
    const r = config.calculate({ mode: 'dtof', decimal: '0.75' });
    expect(getValue(r, 'fraction')).toBe('3/4');
    expect(getValue(r, 'percentage')).toBe('75%');
  });

  it('converts mixed number to decimal', () => {
    const r = config.calculate({ mode: 'mixed', wholeNumber: '3', numerator: '1', denominator: '2' });
    near(parseNumber(getValue(r, 'decimal')), 3.5);
    expect(getValue(r, 'improper')).toBe('7/2');
  });

  it('returns empty for missing inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
    expect(config.calculate({ mode: 'ftod', denominator: '4' })).toHaveLength(0);
    expect(config.calculate({ mode: 'dtof' })).toHaveLength(0);
  });

  it('handles zero numerator', () => {
    const r = config.calculate({ mode: 'ftod', numerator: '0', denominator: '5' });
    near(parseNumber(getValue(r, 'decimal')), 0);
  });

  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(1);
    expect(config.educational.diagram).toBeTruthy();
  });
});
