import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/weight-converter/index';

describe('Weight Converter', () => {
  it('converts 1 kg to 2.205 lb', () => {
    const r = config.calculate({ value: '1', from: 'kg', to: 'lb' });
    expect(r[0].value).toContain('2.204623');
  });

  it('converts 1 lb to 453.592 g', () => {
    const r = config.calculate({ value: '1', from: 'lb', to: 'g' });
    expect(r[0].value).toContain('453.592');
  });

  it('converts 1 oz to 28.35 g', () => {
    const r = config.calculate({ value: '1', from: 'oz', to: 'g' });
    expect(r[0].value).toContain('28.349523');
  });

  it('returns empty for missing value', () => {
    expect(config.calculate({})).toEqual([]);
  });

  it('returns empty for invalid value', () => {
    expect(config.calculate({ value: 'abc', from: 'kg', to: 'lb' })).toEqual([]);
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
