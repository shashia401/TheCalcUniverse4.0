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

  it('returns "Low risk" for above -18°F wind chill', () => {
    const r = config.calculate({ temperature: '30', tempUnit: 'F', windSpeed: '5', speedUnit: 'mph' });
    const frostbite = getValue(r, 'frostbiteRisk');
    expect(frostbite).toBe('Low risk');
  });

  it('returns "30 min" risk in -18°F to -27°F range', () => {
    // temp=-5°F, wind=15 mph → wind chill ≈ -22.9°F
    const r = config.calculate({ temperature: '-5', tempUnit: 'F', windSpeed: '15', speedUnit: 'mph' });
    const frostbite = getValue(r, 'frostbiteRisk');
    expect(frostbite).toContain('30 min');
  });

  it('returns "10 min" risk in -28°F to -39°F range', () => {
    // temp=-10°F, wind=25 mph → wind chill ≈ -32.3°F
    const r = config.calculate({ temperature: '-10', tempUnit: 'F', windSpeed: '25', speedUnit: 'mph' });
    const frostbite = getValue(r, 'frostbiteRisk');
    expect(frostbite).toContain('10 min');
  });

  it('returns "5 min" risk in -40°F to -60°F range', () => {
    // temp=-25°F, wind=30 mph → wind chill ≈ -50.2°F
    const r = config.calculate({ temperature: '-25', tempUnit: 'F', windSpeed: '30', speedUnit: 'mph' });
    const frostbite = getValue(r, 'frostbiteRisk');
    expect(frostbite).toContain('5 min');
  });

  it('returns "under 2 min" risk below -60°F', () => {
    // temp=-40°F, wind=40 mph → wind chill ≈ -67.3°F
    const r = config.calculate({ temperature: '-40', tempUnit: 'F', windSpeed: '40', speedUnit: 'mph' });
    const frostbite = getValue(r, 'frostbiteRisk');
    expect(frostbite).toContain('under 2 min');
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

  it('outputs chart data', () => {
    const r = config.calculate({ temperature: '30', tempUnit: 'F', windSpeed: '15', speedUnit: 'mph' });
    const chart = r.find(x => x.id === 'chartData');
    expect(chart).toBeTruthy();
    expect(chart!.value).toContain('windChillF');
  });
});
