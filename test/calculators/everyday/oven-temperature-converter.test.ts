import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/oven-temperature-converter/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Oven Temperature Converter', () => {
  it('350°F → 177°C, Gas Mark 4', () => {
    const results = config.calculate({ temperature: '350', fromUnit: '°F' });
    expect(getValue(results, 'fahrenheit')).toBe('350°F');
    expect(getValue(results, 'celsius')).toBe('177°C');
    expect(getValue(results, 'gasMark')).toBe('Gas Mark 4');
    expect(getValue(results, 'cookingDescription')).toBe('Moderate / Medium');
  });

  it('200°C → 392°F, Gas Mark 6', () => {
    const results = config.calculate({ temperature: '200', fromUnit: '°C' });
    expect(getValue(results, 'fahrenheit')).toBe('392°F');
    expect(getValue(results, 'celsius')).toBe('200°C');
    expect(getValue(results, 'gasMark')).toBe('Gas Mark 6');
    expect(getValue(results, 'cookingDescription')).toBe('Moderately Hot');
  });

  it('Gas Mark 5 → 375°F, 191°C', () => {
    const results = config.calculate({ temperature: '5', fromUnit: 'Gas Mark' });
    expect(getValue(results, 'fahrenheit')).toBe('375°F');
    expect(getValue(results, 'celsius')).toBe('191°C');
    expect(getValue(results, 'gasMark')).toBe('Gas Mark 5');
    expect(getValue(results, 'cookingDescription')).toBe('Moderate / Moderately Hot');
  });

  it('225°F → Gas Mark 1/4', () => {
    const results = config.calculate({ temperature: '225', fromUnit: '°F' });
    expect(getValue(results, 'fahrenheit')).toBe('225°F');
    near(parseNumber(getValue(results, 'celsius')), 107);
    expect(getValue(results, 'gasMark')).toBe('Gas Mark 1/4');
    expect(getValue(results, 'cookingDescription')).toBe('Very Slow / Cool');
  });

  it('empty temperature returns empty array', () => {
    const results = config.calculate({ temperature: '', fromUnit: '°F' });
    expect(results).toEqual([]);
  });

  it('0°C → 32°F', () => {
    const results = config.calculate({ temperature: '0', fromUnit: '°C' });
    expect(getValue(results, 'fahrenheit')).toBe('32°F');
    expect(getValue(results, 'celsius')).toBe('0°C');
    // Gas Mark 1/4 is closest at 107°C
    expect(getValue(results, 'gasMark')).toBe('Gas Mark 1/4');
  });

  it('Gas Mark fraction "1/4" parses correctly', () => {
    const results = config.calculate({ temperature: '1/4', fromUnit: 'Gas Mark' });
    expect(getValue(results, 'fahrenheit')).toBe('225°F');
    expect(getValue(results, 'gasMark')).toBe('Gas Mark 1/4');
  });

  it('Gas Mark below table min uses closest', () => {
    const results = config.calculate({ temperature: '0.1', fromUnit: 'Gas Mark' });
    expect(getValue(results, 'fahrenheit')).toBe('225°F');
    expect(getValue(results, 'celsius')).toBe('107°C');
    expect(getValue(results, 'cookingDescription')).toBe('Very Slow / Cool');
  });

  it('interpolates non-integer gas marks within range', () => {
    const results = config.calculate({ temperature: '1.5', fromUnit: 'Gas Mark' });
    // Between Gas Mark 1 (135°C) and Gas Mark 2 (149°C): t = 0.5
    // f = 275 + 0.5 * 25 = 287.5 → 288°F
    // c = 135 + 0.5 * 14 = 142°C
    expect(getValue(results, 'fahrenheit')).toBe('288°F');
    expect(getValue(results, 'celsius')).toBe('142°C');
  });

  it('Gas Mark above table max uses closest', () => {
    const results = config.calculate({ temperature: '12', fromUnit: 'Gas Mark' });
    expect(getValue(results, 'fahrenheit')).toBe('500°F');
    expect(getValue(results, 'celsius')).toBe('260°C');
    expect(getValue(results, 'cookingDescription')).toBe('Extremely Hot');
  });

  it('non-numeric temperature returns empty array', () => {
    const results = config.calculate({ temperature: 'abc', fromUnit: '°F' });
    expect(results).toEqual([]);
  });

  it('invalid fromUnit returns empty array', () => {
    const results = config.calculate({ temperature: '350', fromUnit: '°K' });
    expect(results).toEqual([]);
  });

  it('Gas Mark invalid fraction returns empty array', () => {
    const results = config.calculate({ temperature: 'abc', fromUnit: 'Gas Mark' });
    expect(results).toEqual([]);
  });

  it('500°F → 260°C, Gas Mark 10', () => {
    const results = config.calculate({ temperature: '500', fromUnit: '°F' });
    expect(getValue(results, 'fahrenheit')).toBe('500°F');
    expect(getValue(results, 'celsius')).toBe('260°C');
    expect(getValue(results, 'gasMark')).toBe('Gas Mark 10');
    expect(getValue(results, 'cookingDescription')).toBe('Extremely Hot');
  });
});
