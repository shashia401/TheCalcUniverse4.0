import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/volume-converter/index';

describe('Volume Converter', () => {
  it('converts 1 L to 0.264 gal', () => {
    const r = config.calculate({ value: '1', from: 'l', to: 'gal' });
    expect(r[0].value).toContain('0.264');
  });

  it('converts 1 gal to 3.785 L', () => {
    const r = config.calculate({ value: '1', from: 'gal', to: 'l' });
    expect(r[0].value).toContain('3.785');
  });

  it('converts 1 cup to 236.588 mL', () => {
    const r = config.calculate({ value: '1', from: 'cup', to: 'ml' });
    expect(r[0].value).toContain('236.588');
  });

  it('returns empty for missing value', () => {
    expect(config.calculate({})).toEqual([]);
  });

  it('returns empty for invalid value', () => {
    expect(config.calculate({ value: 'abc', from: 'l', to: 'gal' })).toEqual([]);
  });

  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.formulaDescription!.length).toBeGreaterThan(100);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(2);
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(1);
    expect(config.educational.explanation!.length).toBeGreaterThan(300);
  });
});
