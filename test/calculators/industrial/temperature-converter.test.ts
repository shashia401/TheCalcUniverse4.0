import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/temperature-converter/index';

describe('Temperature Converter', () => {
  it('converts 100°C to 212°F', () => {
    const r = config.calculate({ value: '100', from: 'c', to: 'f' });
    expect(r[0].value).toContain('212');
  });

  it('converts 32°F to 0°C', () => {
    const r = config.calculate({ value: '32', from: 'f', to: 'c' });
    expect(r[0].value).toContain('0');
  });

  it('converts 0°C to 273.15 K', () => {
    const r = config.calculate({ value: '0', from: 'c', to: 'k' });
    expect(r[0].value).toContain('273.15');
  });

  it('converts 273.15 K to 0°C', () => {
    const r = config.calculate({ value: '273.15', from: 'k', to: 'c' });
    expect(r[0].value).toContain('0');
  });

  it('converts 0 K to −459.67°F', () => {
    const r = config.calculate({ value: '0', from: 'k', to: 'f' });
    expect(r[0].value).toContain('-459');
  });

  it('converts 32°F to 273.15 K', () => {
    const r = config.calculate({ value: '32', from: 'f', to: 'k' });
    expect(r[0].value).toContain('273.15');
  });

  it('converts 491.67 °R to 32°F', () => {
    const r = config.calculate({ value: '491.67', from: 'r', to: 'f' });
    expect(r[0].value).toContain('32');
  });

  it('returns empty for missing value', () => {
    expect(config.calculate({})).toEqual([]);
  });

  it('returns empty for invalid value', () => {
    expect(config.calculate({ value: 'abc', from: 'c', to: 'f' })).toEqual([]);
  });

  it('returns empty for NaN', () => {
    expect(config.calculate({ value: 'NaN', from: 'c', to: 'f' })).toEqual([]);
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
