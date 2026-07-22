import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/density-converter/index';
import { getValue, getResult } from '../../helpers';

describe('Density Converter', () => {
  it('converts kg/m³ to g/cm³', () => {
    const r = config.calculate({
      value: '1000',
      from: 'kgm3',
      to: 'gcm3',
    });
    const val = getValue(r, 'result');
    expect(val).toContain('1');
    expect(val).toContain('g/cm');
  });

  it('converts g/cm³ to kg/m³', () => {
    const r = config.calculate({
      value: '1',
      from: 'gcm3',
      to: 'kgm3',
    });
    const val = getValue(r, 'result');
    expect(val).toContain('1,000');
  });

  it('returns empty for empty value', () => {
    const r = config.calculate({
      value: '',
      from: 'kgm3',
      to: 'gcm3',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN value', () => {
    const r = config.calculate({
      value: 'abc',
      from: 'kgm3',
      to: 'gcm3',
    });
    expect(r).toEqual([]);
  });

  it('converts lb/ft³ to kg/m³', () => {
    const r = config.calculate({
      value: '1',
      from: 'lbft3',
      to: 'kgm3',
    });
    const val = getValue(r, 'result');
    const num = parseFloat(val.split('=')[1]);
    expect(num).toBeCloseTo(16.0185, 1);
  });

  it('converts SG to kg/m³', () => {
    const r = config.calculate({
      value: '1',
      from: 'sg',
      to: 'kgm3',
    });
    const val = getValue(r, 'result');
    expect(val).toContain('1,000');
  });

  it('converts lb/in³ to kg/m³', () => {
    const r = config.calculate({
      value: '0.0361',
      from: 'lbin3',
      to: 'kgm3',
    });
    const val = getValue(r, 'result');
    const num = parseFloat(val.split('=')[1]);
    // 0.0361 * 27679.9 / 1 ≈ 999.2
    expect(num).toBeGreaterThan(990);
    expect(num).toBeLessThan(1010);
  });

  it('has extra panel', () => {
    expect(typeof config.extraPanel).toBe('function');
  });
});
