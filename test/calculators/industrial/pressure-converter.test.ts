import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/pressure-converter/index';

describe('Pressure Converter', () => {
  it('converts 1 bar to 14.504 PSI', () => {
    const r = config.calculate({ value: '1', from: 'bar', to: 'psi' });
    expect(r[0].value).toContain('14.5037');
  });

  it('converts 14.7 PSI to 1.013 bar', () => {
    const r = config.calculate({ value: '14.7', from: 'psi', to: 'bar' });
    expect(r[0].value).toContain('1.013');
  });

  it('converts 1 atm to 101.325 kPa', () => {
    const r = config.calculate({ value: '1', from: 'atm', to: 'kpa' });
    expect(r[0].value).toContain('101.325');
  });

  it('converts 760 mmHg to 1 atm', () => {
    const r = config.calculate({ value: '760', from: 'mmhg', to: 'atm' });
    expect(r[0].value).toContain('0.999');
  });

  it('converts 1 MPa to 145 PSI', () => {
    const r = config.calculate({ value: '1', from: 'mpa', to: 'psi' });
    expect(r[0].value).toContain('145.037');
  });

  it('converts 29.92 inHg to 1013.25 hPa', () => {
    const r = config.calculate({ value: '29.92', from: 'inhg', to: 'hpa' });
    // toLocaleString adds comma: "1,013.207888"
    expect(r[0].value).toContain('013');
  });

  it('returns empty for missing value', () => {
    expect(config.calculate({})).toEqual([]);
  });

  it('returns empty for invalid value', () => {
    expect(config.calculate({ value: 'abc', from: 'psi', to: 'bar' })).toEqual([]);
  });

  it('returns empty for NaN', () => {
    expect(config.calculate({ value: 'NaN', from: 'psi', to: 'bar' })).toEqual([]);
  });

  it('returns empty for negative value', () => {
    expect(config.calculate({ value: '-5', from: 'psi', to: 'bar' })).toEqual([]);
  });

  it('has educational content', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.formulaDescription!.length).toBeGreaterThan(100);
    expect(config.educational.variables!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.citations!.length).toBeGreaterThanOrEqual(1);
    expect(config.educational.explanation!.length).toBeGreaterThan(300);
  });
});
