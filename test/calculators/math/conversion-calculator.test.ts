import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/conversion/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Conversion Calculator', () => {
  // ── Weight ──

  it('converts 1 kg = 1000 g', () => {
    const r = config.calculate({ category: 'weight', fromValue: '1', [`fromUnit_weight`]: 'kilogram', [`toUnit_weight`]: 'gram' });
    near(parseNumber(getValue(r, 'result')), 1000);
    expect(getValue(r, 'category')).toBe('Weight & Mass');
  });

  it('converts 16 oz = 1 lb', () => {
    const r = config.calculate({ category: 'weight', fromValue: '16', [`fromUnit_weight`]: 'ounce', [`toUnit_weight`]: 'pound' });
    near(parseNumber(getValue(r, 'result')), 1);
  });

  // ── Length ──

  it('converts 1 ft = 12 in', () => {
    const r = config.calculate({ category: 'length', fromValue: '1', [`fromUnit_length`]: 'foot', [`toUnit_length`]: 'inch' });
    near(parseNumber(getValue(r, 'result')), 12);
  });

  it('converts 1 km = 0.621371 mi', () => {
    const r = config.calculate({ category: 'length', fromValue: '1', [`fromUnit_length`]: 'kilometer', [`toUnit_length`]: 'mile' });
    near(parseNumber(getValue(r, 'result')), 0.621371, 0.001);
  });

  // ── Temperature ──

  it('converts 0°C = 32°F', () => {
    const r = config.calculate({ category: 'temperature', fromValue: '0', [`fromUnit_temperature`]: 'celsius', [`toUnit_temperature`]: 'fahrenheit' });
    near(parseNumber(getValue(r, 'result')), 32);
  });

  it('converts 100°C = 212°F', () => {
    const r = config.calculate({ category: 'temperature', fromValue: '100', [`fromUnit_temperature`]: 'celsius', [`toUnit_temperature`]: 'fahrenheit' });
    near(parseNumber(getValue(r, 'result')), 212);
  });

  it('converts 32°F = 0°C', () => {
    const r = config.calculate({ category: 'temperature', fromValue: '32', [`fromUnit_temperature`]: 'fahrenheit', [`toUnit_temperature`]: 'celsius' });
    near(parseNumber(getValue(r, 'result')), 0);
  });

  it('converts 0 K = -273.15°C', () => {
    const r = config.calculate({ category: 'temperature', fromValue: '0', [`fromUnit_temperature`]: 'kelvin', [`toUnit_temperature`]: 'celsius' });
    near(parseNumber(getValue(r, 'result')), -273.15, 0.01);
  });

  // ── Volume ──

  it('converts 1 L = 1000 mL', () => {
    const r = config.calculate({ category: 'volume', fromValue: '1', [`fromUnit_volume`]: 'liter', [`toUnit_volume`]: 'milliliter' });
    near(parseNumber(getValue(r, 'result')), 1000);
  });

  it('converts 1 gal = 3.78541 L', () => {
    const r = config.calculate({ category: 'volume', fromValue: '1', [`fromUnit_volume`]: 'gallon-us', [`toUnit_volume`]: 'liter' });
    near(parseNumber(getValue(r, 'result')), 3.78541, 0.001);
  });

  // ── Data ──

  it('converts 1 MB = 1000 KB', () => {
    const r = config.calculate({ category: 'data', fromValue: '1', [`fromUnit_data`]: 'megabyte', [`toUnit_data`]: 'kilobyte' });
    near(parseNumber(getValue(r, 'result')), 1000);
  });

  it('converts 1 GB = 1000 MB', () => {
    const r = config.calculate({ category: 'data', fromValue: '1', [`fromUnit_data`]: 'gigabyte', [`toUnit_data`]: 'megabyte' });
    near(parseNumber(getValue(r, 'result')), 1000);
  });

  // ── Speed ──

  it('converts 1 m/s = 3.6 km/h', () => {
    const r = config.calculate({ category: 'speed', fromValue: '1', [`fromUnit_speed`]: 'mps', [`toUnit_speed`]: 'kmph' });
    near(parseNumber(getValue(r, 'result')), 3.6, 0.01);
  });

  it('converts 60 mph ≈ 96.56 km/h', () => {
    const r = config.calculate({ category: 'speed', fromValue: '60', [`fromUnit_speed`]: 'mph', [`toUnit_speed`]: 'kmph' });
    near(parseNumber(getValue(r, 'result')), 96.56, 0.1);
  });

  // ── Area ──

  it('converts 1 sq m = 10.7639 sq ft', () => {
    const r = config.calculate({ category: 'area', fromValue: '1', [`fromUnit_area`]: 'sq-m', [`toUnit_area`]: 'sq-ft' });
    near(parseNumber(getValue(r, 'result')), 10.7639, 0.01);
  });

  it('converts 1 acre = 43560 sq ft', () => {
    const r = config.calculate({ category: 'area', fromValue: '1', [`fromUnit_area`]: 'acre', [`toUnit_area`]: 'sq-ft' });
    near(parseNumber(getValue(r, 'result')), 43560, 1);
  });

  // ── Currency ──

  it('converts 1 EUR = 1.08 USD', () => {
    const r = config.calculate({ category: 'currency', fromValue: '1', [`fromUnit_currency`]: 'eur', [`toUnit_currency`]: 'usd' });
    near(parseNumber(getValue(r, 'result')), 1.08, 0.01);
  });

  it('converts 100 JPY ≈ 0.67 USD', () => {
    const r = config.calculate({ category: 'currency', fromValue: '100', [`fromUnit_currency`]: 'jpy', [`toUnit_currency`]: 'usd' });
    near(parseNumber(getValue(r, 'result')), 0.67, 0.01);
  });

  // ── Edge cases ──

  it('returns empty for NaN value', () => {
    const r = config.calculate({ category: 'weight', fromValue: 'abc', [`fromUnit_weight`]: 'kilogram', [`toUnit_weight`]: 'gram' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid unit', () => {
    const r = config.calculate({ category: 'weight', fromValue: '1', [`fromUnit_weight`]: 'meter', [`toUnit_weight`]: 'gram' });
    expect(r).toEqual([]);
  });

  it('converts same unit to itself', () => {
    const r = config.calculate({ category: 'length', fromValue: '42', [`fromUnit_length`]: 'foot', [`toUnit_length`]: 'foot' });
    near(parseNumber(getValue(r, 'result')), 42);
  });

  it('converts 0 value', () => {
    const r = config.calculate({ category: 'length', fromValue: '0', [`fromUnit_length`]: 'meter', [`toUnit_length`]: 'foot' });
    near(parseNumber(getValue(r, 'result')), 0);
  });

  it('handles invalid category gracefully', () => {
    const r = config.calculate({ category: 'nonexistent', fromValue: '1', [`fromUnit_nonexistent`]: 'gram', [`toUnit_nonexistent`]: 'kilogram' });
    expect(r).toEqual([]);
  });
});
