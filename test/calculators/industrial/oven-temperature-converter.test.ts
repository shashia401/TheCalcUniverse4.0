import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/oven-temperature-converter/index';

describe('Oven Temperature Converter', () => {
  it('converts 180°C to 356°F', () => {
    const r = config.calculate({ value: '180', from: 'c', to: 'f' });
    expect(r[0].value).toContain('356');
  });

  it('converts 350°F to 176.7°C', () => {
    const r = config.calculate({ value: '350', from: 'f', to: 'c' });
    expect(r[0].value).toContain('176.7');
  });

  it('converts 0°C to 32°F', () => {
    const r = config.calculate({ value: '0', from: 'c', to: 'f' });
    expect(r[0].value).toContain('32');
  });

  it('converts 212°F to 100°C', () => {
    const r = config.calculate({ value: '212', from: 'f', to: 'c' });
    expect(r[0].value).toContain('100');
  });

  it('returns Gas Mark 4 for 180°C', () => {
    const r = config.calculate({ value: '180', from: 'c', to: 'gas' });
    const gasMark = r.find((res) => res.id === 'gasMark');
    expect(gasMark?.value).toBe('Gas Mark 4');
  });

  it('returns Gas Mark 9 for 245°C', () => {
    const r = config.calculate({ value: '245', from: 'c', to: 'gas' });
    const gasMark = r.find((res) => res.id === 'gasMark');
    expect(gasMark?.value).toBe('Gas Mark 9');
  });

  it('converts Gas Mark 4 to 180°C', () => {
    const r = config.calculate({ value: '4', from: 'gas', to: 'c' });
    expect(r[0].value).toContain('180.0');
  });

  it('converts Gas Mark 6 to 200°C', () => {
    const r = config.calculate({ value: '6', from: 'gas', to: 'c' });
    expect(r[0].value).toContain('200.0');
  });

  it('returns "Moderate" oven term for 180°C', () => {
    const r = config.calculate({ value: '180', from: 'c', to: 'f' });
    const desc = r.find((res) => res.id === 'description');
    expect(desc?.value).toContain('Moderate');
  });

  it('returns "Hot" oven term for 220°C', () => {
    const r = config.calculate({ value: '220', from: 'c', to: 'f' });
    const desc = r.find((res) => res.id === 'description');
    expect(desc?.value).toContain('Hot');
  });

  it('returns Gas Mark ¼ for 110°C', () => {
    const r = config.calculate({ value: '110', from: 'c', to: 'gas' });
    const gasMark = r.find((res) => res.id === 'gasMark');
    expect(gasMark?.value).toBe('Gas Mark ¼');
  });

  it('returns Gas Mark ½ for 130°C', () => {
    const r = config.calculate({ value: '130', from: 'c', to: 'gas' });
    const gasMark = r.find((res) => res.id === 'gasMark');
    expect(gasMark?.value).toBe('Gas Mark ½');
  });

  it('returns "N/A" for gas mark below 110°C', () => {
    const r = config.calculate({ value: '50', from: 'c', to: 'f' });
    const gasMark = r.find((res) => res.id === 'gasMark');
    expect(gasMark?.value).toBe('N/A');
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
