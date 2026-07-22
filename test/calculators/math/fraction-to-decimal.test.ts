import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/fraction-to-decimal/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('fraction-to-decimal calculator', () => {
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

  it('handles whole number fraction', () => {
    const r = config.calculate({ mode: 'ftod', numerator: '8', denominator: '1' });
    near(parseNumber(getValue(r, 'decimal')), 8);
    expect(getValue(r, 'simplified')).toBe('8/1');
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
    expect(getValue(r, 'percentage')).toBe('350%');
  });

  it('handles zero numerator in fraction', () => {
    const r = config.calculate({ mode: 'ftod', numerator: '0', denominator: '5' });
    near(parseNumber(getValue(r, 'decimal')), 0);
    expect(getValue(r, 'percentage')).toBe('0%');
    expect(getValue(r, 'simplified')).toBe('0/1');
  });

  it('converts decimal with repeating-ish pattern', () => {
    const r = config.calculate({ mode: 'dtof', decimal: '0.333333' });
    expect(getValue(r, 'fraction')).toBe('333333/1000000');
  });

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for missing numerator in ftod mode', () => {
    expect(config.calculate({ mode: 'ftod', denominator: '4' })).toHaveLength(0);
  });

  it('returns empty for missing denominator in ftod mode', () => {
    expect(config.calculate({ mode: 'ftod', numerator: '3' })).toHaveLength(0);
  });

  it('returns empty for missing numerator in mixed mode', () => {
    expect(config.calculate({ mode: 'mixed', wholeNumber: '1', denominator: '2' })).toHaveLength(0);
  });

  it('returns empty for missing decimal in dtof mode', () => {
    expect(config.calculate({ mode: 'dtof' })).toHaveLength(0);
  });
});
