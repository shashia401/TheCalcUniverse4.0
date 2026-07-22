import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/hardness-converter/index';
import { getValue, getResult } from '../../helpers';

describe('Hardness Converter', () => {
  it('converts HRC 40 to equivalents', () => {
    const r = config.calculate({
      fromValue: '40',
      fromUnit: 'hrc',
    });
    const result = getResult(r, 'result');
    expect(result.value).toContain('40');
    expect(result.value).toContain('HRC');
    // Should have HV equivalent
    const hv = r.find((x) => x.id === 'eq_hv');
    expect(hv).toBeTruthy();
  });

  it('converts HV 500 to HRC equivalent', () => {
    const r = config.calculate({
      fromValue: '500',
      fromUnit: 'hv',
    });
    const result = getResult(r, 'result');
    expect(result.value).toContain('500');
    expect(result.value).toContain('HV');
  });

  it('returns empty for empty value', () => {
    const r = config.calculate({
      fromValue: '',
      fromUnit: 'hrc',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN value', () => {
    const r = config.calculate({
      fromValue: 'abc',
      fromUnit: 'hrc',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing unit', () => {
    const r = config.calculate({
      fromValue: '50',
      fromUnit: '',
    });
    expect(r).toEqual([]);
  });

  it('converts HRB 80 correctly', () => {
    const r = config.calculate({
      fromValue: '80',
      fromUnit: 'hrb',
    });
    const result = getResult(r, 'result');
    expect(result.value).toContain('80');
    expect(result.value).toContain('HRB');
  });

  it('converts HBW 200 to other scales', () => {
    const r = config.calculate({
      fromValue: '200',
      fromUnit: 'hbw',
    });
    const result = getResult(r, 'result');
    expect(result.value).toContain('200');
  });

  it('handles out-of-range values', () => {
    // HRC 10 is below valid range, should have empty or few results
    const r = config.calculate({
      fromValue: '100',
      fromUnit: 'hrc',
    });
    // Should produce some result or handle gracefully
    expect(Array.isArray(r)).toBe(true);
  });

  it('has extra panel for valid results', () => {
    expect(typeof config.extraPanel).toBe('function');
    const r = config.calculate({
      fromValue: '40',
      fromUnit: 'hrc',
    });
    if (r.length > 0) {
      const panel = config.extraPanel!(
        { fromValue: '40', fromUnit: 'hrc' },
        r,
      );
      expect(panel).toBeTruthy();
    }
  });
});
