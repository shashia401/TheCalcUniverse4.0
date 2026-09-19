import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/scientific-notation/index';
import { getValue } from '../../helpers';

describe('Scientific Notation calculator', () => {
  it('converts 0.0045 to scientific notation (4.5 × 10^-3)', () => {
    const r = config.calculate({ mode: 'toScientific', decimal: '0.0045' });
    expect(getValue(r, 'scientific')).toContain('4.5');
    expect(getValue(r, 'scientific')).toContain('10');
    expect(getValue(r, 'exponent')).toBe('-3');
  });

  it('converts 4500 to scientific notation (4.5 × 10^3)', () => {
    const r = config.calculate({ mode: 'toScientific', decimal: '4500' });
    expect(getValue(r, 'scientific')).toContain('10');
    expect(getValue(r, 'exponent')).toBe('3');
  });

  it('shows decimal moves count', () => {
    const r = config.calculate({ mode: 'toScientific', decimal: '0.0045' });
    expect(getValue(r, 'moves')).toBe('3');
  });

  it('shows E notation', () => {
    const r = config.calculate({ mode: 'toScientific', decimal: '0.0045' });
    expect(getValue(r, 'eNotation')).toContain('e');
  });

  it('converts scientific notation to decimal', () => {
    const r = config.calculate({ mode: 'toDecimal', coefficient: '4.5', exponent: '-3' });
    expect(getValue(r, 'decimal')).toContain('0.0045');
  });

  it('converts 4.5e3 to 4500', () => {
    const r = config.calculate({ mode: 'toDecimal', coefficient: '4.5', exponent: '3' });
    expect(getValue(r, 'decimal')).toContain('4500');
  });

  it('shows animation data for panel', () => {
    const r = config.calculate({ mode: 'toScientific', decimal: '0.0045' });
    expect(getValue(r, '_animationData')).toContain('moves');
  });

  it('handles zero correctly', () => {
    const r = config.calculate({ mode: 'toScientific', decimal: '0' });
    expect(getValue(r, 'scientific')).toBeTruthy();
  });

  it('returns empty for NaN input in decimal mode', () => {
    const r = config.calculate({ mode: 'toScientific', decimal: 'abc' });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN in toDecimal mode', () => {
    const r = config.calculate({ mode: 'toDecimal', coefficient: 'abc', exponent: '3' });
    expect(r).toEqual([]);
  });
});
