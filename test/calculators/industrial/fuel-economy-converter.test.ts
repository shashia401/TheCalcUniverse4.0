import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/fuel-economy-converter/index';
import { getValue, getResult } from '../../helpers';

describe('Fuel Economy Converter', () => {
  it('converts US mpg to L/100km', () => {
    const r = config.calculate({
      fromValue: '23.5215',
      fromUnit: 'usmpg',
      toUnit: 'l100km',
    });
    const result = getResult(r, 'result');
    expect(result.value).toContain('10');
    expect(result.value).toContain('L/100km');
  });

  it('converts L/100km to US mpg', () => {
    const r = config.calculate({
      fromValue: '10',
      fromUnit: 'l100km',
      toUnit: 'usmpg',
    });
    const result = getResult(r, 'result');
    const val = getValue(r, 'result');
    // 235.215 / 10 = 23.5215
    expect(val).toContain('23.5215');
  });

  it('returns empty for empty value', () => {
    const r = config.calculate({
      fromValue: '',
      fromUnit: 'usmpg',
      toUnit: 'l100km',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN value', () => {
    const r = config.calculate({
      fromValue: 'abc',
      fromUnit: 'usmpg',
      toUnit: 'l100km',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for zero value', () => {
    const r = config.calculate({
      fromValue: '0',
      fromUnit: 'usmpg',
      toUnit: 'l100km',
    });
    expect(r).toEqual([]);
  });

  it('converts UK mpg to US mpg', () => {
    const r = config.calculate({
      fromValue: '24',
      fromUnit: 'ukmpg',
      toUnit: 'usmpg',
    });
    const val = getValue(r, 'result');
    // 282.481 / 24 = 11.77 L/100km, then 235.215 / 11.77 = 19.98 US mpg
    expect(parseFloat(val.split(' ')[0])).toBeCloseTo(19.98, 0);
  });

  it('converts km/L to L/100km', () => {
    const r = config.calculate({
      fromValue: '10',
      fromUnit: 'kml',
      toUnit: 'l100km',
    });
    const val = getValue(r, 'result');
    // 100/10 = 10 L/100km
    expect(val).toContain('10');
  });

  it('shows L/100km equivalent when converting between non-L/100km units', () => {
    const r = config.calculate({
      fromValue: '30',
      fromUnit: 'usmpg',
      toUnit: 'ukmpg',
    });
    const baseEq = r.find((x) => x.id === 'baseEquivalent');
    expect(baseEq).toBeTruthy();
  });

  it('has extra panel', () => {
    expect(typeof config.extraPanel).toBe('function');
  });
});
