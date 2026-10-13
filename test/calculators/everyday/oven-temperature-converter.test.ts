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

  it('Gas Mark 5 → 375°F, 190°C', () => {
    const results = config.calculate({ temperature: '5', fromUnit: 'Gas Mark' });
    expect(getValue(results, 'fahrenheit')).toBe('375°F');
    expect(getValue(results, 'celsius')).toBe('190°C');
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

  it('educational diagram Celsius values match the gasMarkTable, not a straight F-to-C conversion of the Fahrenheit column (regression: the diagram previously showed (F-32)*5/9 values like 245/230/220... instead of the table\'s 245/230/220 — verified against every gas mark)', () => {
    const svg = config.educational.diagram!.svg;
    const marks = ['0.25', '0.5', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    for (const gm of marks) {
      const results = config.calculate({ temperature: gm, fromUnit: 'Gas Mark' });
      const celsius = getValue(results, 'celsius');
      const celsiusValue = celsius.replace('°C', '');
      expect(svg).toContain(`>${celsiusValue}</text>`);
    }
  });

  it('empty temperature returns empty array', () => {
    const results = config.calculate({ temperature: '', fromUnit: '°F' });
    expect(results).toEqual([]);
  });

  it('0°C → 32°F', () => {
    const results = config.calculate({ temperature: '0', fromUnit: '°C' });
    expect(getValue(results, 'fahrenheit')).toBe('32°F');
    expect(getValue(results, 'celsius')).toBe('0°C');
    // Freezing point is far below the gas mark scale (1/4 = 110°C): no gas mark is claimed
    expect(getValue(results, 'gasMark')).toBe('Outside the gas mark range');
  });

  it('Gas Mark fraction "1/4" parses correctly', () => {
    const results = config.calculate({ temperature: '1/4', fromUnit: 'Gas Mark' });
    expect(getValue(results, 'fahrenheit')).toBe('225°F');
    expect(getValue(results, 'gasMark')).toBe('Gas Mark 1/4');
  });

  it('Gas Mark below the 1/4 minimum is flagged, not clamped (it used to show 225°F)', () => {
    const results = config.calculate({ temperature: '0.1', fromUnit: 'Gas Mark' });
    expect(results).toHaveLength(1);
    expect(results[0].warning).toMatch(/outside the scale/);
  });

  it('interpolates non-integer gas marks within range', () => {
    const results = config.calculate({ temperature: '1.5', fromUnit: 'Gas Mark' });
    // Between Gas Mark 1 (140°C) and Gas Mark 2 (150°C): t = 0.5
    // f = 275 + 0.5 * 25 = 287.5 → 288°F
    // c = 140 + 0.5 * 10 = 145°C
    expect(getValue(results, 'fahrenheit')).toBe('288°F');
    expect(getValue(results, 'celsius')).toBe('145°C');
  });

  it('Gas Mark above 10 is flagged, not clamped (it used to show "Gas Mark 12" with 500°F)', () => {
    const results = config.calculate({ temperature: '12', fromUnit: 'Gas Mark' });
    expect(results).toHaveLength(1);
    expect(results[0].warning).toMatch(/outside the scale/);
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
