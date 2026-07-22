import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/conversion/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Conversion Calculator', () => {
  // ── Weight ──

  it('converts 1 kg = 1000 g', () => {
    const r = config.calculate({ category: 'weight', fromValue: '1', fromUnit: 'kilogram', toUnit: 'gram' });
    near(parseNumber(getValue(r, 'result')), 1000);
    expect(getValue(r, 'category')).toBe('Weight & Mass');
  });

  it('converts 16 oz = 1 lb', () => {
    const r = config.calculate({ category: 'weight', fromValue: '16', fromUnit: 'ounce', toUnit: 'pound' });
    near(parseNumber(getValue(r, 'result')), 1);
  });

  // ── Length ──

  it('converts 1 ft = 12 in', () => {
    const r = config.calculate({ category: 'length', fromValue: '1', fromUnit: 'foot', toUnit: 'inch' });
    near(parseNumber(getValue(r, 'result')), 12);
  });

  it('converts 1 km = 0.621371 mi', () => {
    const r = config.calculate({ category: 'length', fromValue: '1', fromUnit: 'kilometer', toUnit: 'mile' });
    near(parseNumber(getValue(r, 'result')), 0.621371, 0.001);
  });

  // ── Temperature ──

  it('converts 0°C = 32°F', () => {
    const r = config.calculate({ category: 'temperature', fromValue: '0', fromUnit: 'celsius', toUnit: 'fahrenheit' });
    near(parseNumber(getValue(r, 'result')), 32);
  });

  it('converts 100°C = 212°F', () => {
    const r = config.calculate({ category: 'temperature', fromValue: '100', fromUnit: 'celsius', toUnit: 'fahrenheit' });
    near(parseNumber(getValue(r, 'result')), 212);
  });

  it('converts 32°F = 0°C', () => {
    const r = config.calculate({ category: 'temperature', fromValue: '32', fromUnit: 'fahrenheit', toUnit: 'celsius' });
    near(parseNumber(getValue(r, 'result')), 0);
  });

  it('converts 0 K = -273.15°C', () => {
    const r = config.calculate({ category: 'temperature', fromValue: '0', fromUnit: 'kelvin', toUnit: 'celsius' });
    near(parseNumber(getValue(r, 'result')), -273.15, 0.01);
  });

  // ── Volume ──

  it('converts 1 L = 1000 mL', () => {
    const r = config.calculate({ category: 'volume', fromValue: '1', fromUnit: 'liter', toUnit: 'milliliter' });
    near(parseNumber(getValue(r, 'result')), 1000);
  });

  it('converts 1 gal = 3.78541 L', () => {
    const r = config.calculate({ category: 'volume', fromValue: '1', fromUnit: 'gallon-us', toUnit: 'liter' });
    near(parseNumber(getValue(r, 'result')), 3.78541, 0.001);
  });

  // ── Data ──

  it('converts 1 MB = 1000 KB', () => {
    const r = config.calculate({ category: 'data', fromValue: '1', fromUnit: 'megabyte', toUnit: 'kilobyte' });
    near(parseNumber(getValue(r, 'result')), 1000);
  });

  it('converts 1 GB = 1000 MB', () => {
    const r = config.calculate({ category: 'data', fromValue: '1', fromUnit: 'gigabyte', toUnit: 'megabyte' });
    near(parseNumber(getValue(r, 'result')), 1000);
  });

  // ── Speed ──

  it('converts 1 m/s = 3.6 km/h', () => {
    const r = config.calculate({ category: 'speed', fromValue: '1', fromUnit: 'mps', toUnit: 'kmph' });
    near(parseNumber(getValue(r, 'result')), 3.6, 0.01);
  });

  it('converts 60 mph ≈ 96.56 km/h', () => {
    const r = config.calculate({ category: 'speed', fromValue: '60', fromUnit: 'mph', toUnit: 'kmph' });
    near(parseNumber(getValue(r, 'result')), 96.56, 0.1);
  });

  // ── Area ──

  it('converts 1 sq m = 10.7639 sq ft', () => {
    const r = config.calculate({ category: 'area', fromValue: '1', fromUnit: 'sq-m', toUnit: 'sq-ft' });
    near(parseNumber(getValue(r, 'result')), 10.7639, 0.01);
  });

  it('converts 1 acre = 43560 sq ft', () => {
    const r = config.calculate({ category: 'area', fromValue: '1', fromUnit: 'acre', toUnit: 'sq-ft' });
    near(parseNumber(getValue(r, 'result')), 43560, 1);
  });

  // ── Currency ──

  it('converts 1 EUR = 1.08 USD', () => {
    const r = config.calculate({ category: 'currency', fromValue: '1', fromUnit: 'eur', toUnit: 'usd' });
    near(parseNumber(getValue(r, 'result')), 1.08, 0.01);
  });

  it('converts 100 JPY ≈ 0.67 USD', () => {
    const r = config.calculate({ category: 'currency', fromValue: '100', fromUnit: 'jpy', toUnit: 'usd' });
    near(parseNumber(getValue(r, 'result')), 0.67, 0.01);
  });

  // ── Edge cases ──

  it('returns empty for NaN value', () => {
    const r = config.calculate({ category: 'weight', fromValue: 'abc', fromUnit: 'kilogram', toUnit: 'gram' });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid unit', () => {
    const r = config.calculate({ category: 'weight', fromValue: '1', fromUnit: 'meter', toUnit: 'gram' });
    expect(r).toEqual([]);
  });

  it('converts same unit to itself', () => {
    const r = config.calculate({ category: 'length', fromValue: '42', fromUnit: 'foot', toUnit: 'foot' });
    near(parseNumber(getValue(r, 'result')), 42);
  });

  it('converts 0 value', () => {
    const r = config.calculate({ category: 'length', fromValue: '0', fromUnit: 'meter', toUnit: 'foot' });
    near(parseNumber(getValue(r, 'result')), 0);
  });

  it('handles invalid category gracefully', () => {
    const r = config.calculate({ category: 'nonexistent', fromValue: '1', fromUnit: 'gram', toUnit: 'kilogram' });
    expect(r).toEqual([]);
  });
});
