import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/everyday/wind-chill/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Wind Chill Calculator', () => {
  it('calculates wind chill for 30F at 15 mph', () => {
    const results = config.calculate({
      temperature: '30',
      tempUnit: 'F',
      windSpeed: '15',
      speedUnit: 'mph',
    });
    const wc = parseNumber(getValue(results, 'windChillF'));
    // WindChill = 35.74 + 0.6215(30) - 35.75(15^0.16) + 0.4275(30)(15^0.16) ≈ 21°F
    near(wc, 23, 7);
  });

  it('calculates wind chill for 20F at 25 mph', () => {
    const results = config.calculate({
      temperature: '20',
      tempUnit: 'F',
      windSpeed: '25',
      speedUnit: 'mph',
    });
    const wc = parseNumber(getValue(results, 'windChillF'));
    // WindChill ≈ 3°F for 20F at 25 mph
    near(wc, 3, 1);
  });

  it('returns empty for missing temperature', () => {
    const results = config.calculate({
      temperature: '',
      tempUnit: 'F',
      windSpeed: '15',
      speedUnit: 'mph',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for missing wind speed', () => {
    const results = config.calculate({
      temperature: '30',
      tempUnit: 'F',
      windSpeed: '',
      speedUnit: 'mph',
    });
    expect(results).toEqual([]);
  });

  it('returns empty for negative wind speed', () => {
    const results = config.calculate({
      temperature: '30',
      tempUnit: 'F',
      windSpeed: '-5',
      speedUnit: 'mph',
    });
    expect(results).toEqual([]);
  });

  it('calculates with Celsius and km/h inputs', () => {
    const results = config.calculate({
      temperature: '-5',
      tempUnit: 'C',
      windSpeed: '20',
      speedUnit: 'kmh',
    });
    const wc = parseNumber(getValue(results, 'windChillF'));
    // -5°C = 23°F, 20 km/h ≈ 12.43 mph → wind chill ≈ 11°F
    expect(wc).toBeLessThan(15);
    expect(wc).toBeGreaterThan(5);
  });

  it('returns frostbite risk category', () => {
    const results = config.calculate({
      temperature: '-10',
      tempUnit: 'F',
      windSpeed: '30',
      speedUnit: 'mph',
    });
    const frostbite = getValue(results, 'frostbiteRisk');
    expect(frostbite).toBeTruthy();
    expect(typeof frostbite).toBe('string');
  });
});
