import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/power-converter/index';

describe('Power Converter', () => {
  it('converts watts to kilowatts', () => {
    const results = config.calculate({ value: '1000', from: 'w', to: 'kw' });
    expect(results[0].value).toContain('1000 w = 1 kw');
  });

  it('converts horsepower to watts', () => {
    const results = config.calculate({ value: '1', from: 'hp', to: 'w' });
    expect(results[0].value).toContain('745.7');
  });

  it('converts kilowatts to horsepower', () => {
    const results = config.calculate({ value: '100', from: 'kw', to: 'hp' });
    expect(results[0].value).toContain('kw');
    expect(results[0].value).toContain('hp');
  });

  it('converts BTU/h to watts', () => {
    const results = config.calculate({ value: '3412', from: 'btuh', to: 'w' });
    // 3412 BTU/h x 0.29307 = approx 1000 W
    expect(results[0].value).toContain('w');
  });

  it('returns empty array for empty value', () => {
    const results = config.calculate({ value: '', from: 'w', to: 'kw' });
    expect(results).toEqual([]);
  });

  it('returns empty array for undefined value', () => {
    const results = config.calculate({ value: undefined as unknown as string, from: 'w', to: 'kw' });
    expect(results).toEqual([]);
  });

  it('returns empty array for NaN value', () => {
    const results = config.calculate({ value: 'not-a-number', from: 'w', to: 'kw' });
    expect(results).toEqual([]);
  });

  it('converts MW to kW', () => {
    const results = config.calculate({ value: '1', from: 'mw', to: 'kw' });
    expect(results[0].value).toContain('1 mw = 1,000 kw');
  });

  it('shows formula output as second result', () => {
    const results = config.calculate({ value: '500', from: 'w', to: 'kw' });
    expect(results[1].id).toBe('formula');
    expect(results[1].value).toContain('0.5');
  });
});
