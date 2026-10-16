import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/wind-chill/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Wind Chill calculator', () => {
  it('calculates wind chill for 30°F at 15 mph', () => {
    const r = config.calculate({ temperature: '30', tempUnit: 'F', windSpeed: '15', speedUnit: 'mph' });
    near(parseNumber(getValue(r, 'windChill')), 19.0, 0.2);
  });

  it('calculates wind chill for 10°F at 20 mph', () => {
    const r = config.calculate({ temperature: '10', tempUnit: 'F', windSpeed: '20', speedUnit: 'mph' });
    near(parseNumber(getValue(r, 'windChill')), -8.9, 0.2);
  });

  it('displays both °F and °C in combined result', () => {
    const r = config.calculate({ temperature: '30', tempUnit: 'F', windSpeed: '15', speedUnit: 'mph' });
    expect(getValue(r, 'windChill')).toContain('°F');
    expect(getValue(r, 'windChill')).toContain('°C');
  });

  it('converts from Celsius to Fahrenheit for the formula', () => {
    // -1°C = 30.2°F, 15 mph → wind chill ≈ 19.2°F
    const r = config.calculate({ temperature: '-1', tempUnit: 'C', windSpeed: '15', speedUnit: 'mph' });
    near(parseNumber(getValue(r, 'windChill')), 19.2, 0.3);
  });

  it('converts from km/h to mph for the formula', () => {
    // 24.14 km/h ≈ 15 mph, 30°F → wind chill ≈ 19.0°F
    const r = config.calculate({ temperature: '30', tempUnit: 'F', windSpeed: '24.14', speedUnit: 'kmh' });
    near(parseNumber(getValue(r, 'windChill')), 19.0, 0.3);
  });

  it('returns temperature when above 50°F', () => {
    const r = config.calculate({ temperature: '60', tempUnit: 'F', windSpeed: '20', speedUnit: 'mph' });
    near(parseNumber(getValue(r, 'windChill')), 60);
  });

  it('returns temperature when wind speed below 3 mph', () => {
    const r = config.calculate({ temperature: '30', tempUnit: 'F', windSpeed: '2', speedUnit: 'mph' });
    near(parseNumber(getValue(r, 'windChill')), 30);
  });

  // Frostbite bands follow Environment Canada's table in whole °C (the old code applied the same numbers to °F).
  // Wind chills below were computed independently with the NWS formula in Python.
  it('Low risk: 30°F at 5 mph -> 24.7°F (-4°C)', () => {
    const r = config.calculate({ temperature: '30', tempUnit: 'F', windSpeed: '5', speedUnit: 'mph' });
    expect(getValue(r, 'frostbiteRisk')).toBe('Low risk');
  });

  it('Moderate risk (-10 to -27 °C): 10°F at 15 mph -> -6.6°F (-21°C), no frostbite time stated', () => {
    const r = config.calculate({ temperature: '10', tempUnit: 'F', windSpeed: '15', speedUnit: 'mph' });
    expect(getValue(r, 'frostbiteRisk')).toContain('Moderate risk');
    expect(getValue(r, 'frostbiteRisk')).not.toContain('minutes');
  });

  it('High risk, 10 to 30 minutes (-28 to -39 °C): -10°F at 20 mph -> -35.1°F (-37°C)', () => {
    const r = config.calculate({ temperature: '-10', tempUnit: 'F', windSpeed: '20', speedUnit: 'mph' });
    expect(getValue(r, 'frostbiteRisk')).toContain('10 to 30 minutes');
  });

  it('Very high risk, 5 to 10 minutes (-40 to -47 °C): -20°F at 25 mph -> -50.8°F (-46°C)', () => {
    const r = config.calculate({ temperature: '-20', tempUnit: 'F', windSpeed: '25', speedUnit: 'mph' });
    expect(getValue(r, 'frostbiteRisk')).toContain('5 to 10 minutes');
  });

  it('Severe risk, 2 to 5 minutes (-48 to -54 °C): -25°F at 25 mph -> -57.5°F (-50°C)', () => {
    const r = config.calculate({ temperature: '-25', tempUnit: 'F', windSpeed: '25', speedUnit: 'mph' });
    expect(getValue(r, 'frostbiteRisk')).toContain('2 to 5 minutes');
  });

  it('Extreme risk, under 2 minutes (-55 °C or colder): -30°F at 30 mph -> -66.6°F (-55°C)', () => {
    const r = config.calculate({ temperature: '-30', tempUnit: 'F', windSpeed: '30', speedUnit: 'mph' });
    expect(getValue(r, 'frostbiteRisk')).toContain('under 2 minutes');
  });

  it('NWS example: 0°F at 15 mph is -19°F, where exposed skin can freeze in about 30 minutes', () => {
    const r = config.calculate({ temperature: '0', tempUnit: 'F', windSpeed: '15', speedUnit: 'mph' });
    expect(getValue(r, 'windChillF')).toBe('-19.4°F');
    expect(getValue(r, 'frostbiteRisk')).toContain('10 to 30 minutes');
  });

  it('the formula is defined only for wind ABOVE 3 mph: exactly 3 mph returns the air temperature', () => {
    const at3 = config.calculate({ temperature: '30', tempUnit: 'F', windSpeed: '3', speedUnit: 'mph' });
    expect(getValue(at3, 'windChillF')).toBe('30°F');
    const above = config.calculate({ temperature: '30', tempUnit: 'F', windSpeed: '3.1', speedUnit: 'mph' });
    expect(getValue(above, 'windChillF')).toBe('26.9°F');
  });

  it('Celsius/km/h agrees with the Environment Canada formula: -30 °C at 20 km/h is -43.1 °C', () => {
    // EC: 13.12 + 0.6215·T − 11.37·v^0.16 + 0.3965·T·v^0.16 = -43.10 °C
    const r = config.calculate({ temperature: '-30', tempUnit: 'C', windSpeed: '20', speedUnit: 'kmh' });
    near(parseNumber(getValue(r, 'windChillC')), -43.1, 0.1);
  });

  it('returns empty for missing temperature', () => {
    const r = config.calculate({ temperature: '', tempUnit: 'F', windSpeed: '15', speedUnit: 'mph' });
    expect(r).toEqual([]);
  });

  it('returns empty for missing wind speed', () => {
    const r = config.calculate({ temperature: '30', tempUnit: 'F', windSpeed: '', speedUnit: 'mph' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid temperature', () => {
    const r = config.calculate({ temperature: 'abc', tempUnit: 'F', windSpeed: '15', speedUnit: 'mph' });
    expect(r).toEqual([]);
  });

  it('returns empty for negative wind speed', () => {
    const r = config.calculate({ temperature: '30', tempUnit: 'F', windSpeed: '-1', speedUnit: 'mph' });
    expect(r).toEqual([]);
  });

  it('regression: 20°F at 25 mph matches explanation worked example (was wrongly stated as 3.0°F, actually 2.6°F)', () => {
    const r = config.calculate({ temperature: '20', tempUnit: 'F', windSpeed: '25', speedUnit: 'mph' });
    expect(getValue(r, 'windChillF')).toBe('2.6°F');
  });

  it('outputs chart data', () => {
    const r = config.calculate({ temperature: '30', tempUnit: 'F', windSpeed: '15', speedUnit: 'mph' });
    const chart = r.find(x => x.id === '_chartData');
    expect(chart).toBeTruthy();
    expect(chart!.value).toContain('windChillF');
  });
});
