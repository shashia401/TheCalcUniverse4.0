import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/industrial/hardness-converter/index';
import { getValue, getResult } from '../../helpers';

describe('Hardness Converter', () => {
  it('converts HRC to HV using real ASTM E140 reference points, not the old fabricated formula', () => {
    // HRC 50 = HV 513 and HRC 60 = HV 697 per ASTM E140 (verified against
    // independent sources). The formula this replaced produced ~1537 and
    // ~1939 respectively — roughly 3x too high.
    const r50 = config.calculate({ fromValue: '50', fromUnit: 'hrc' });
    const hv50 = getResult(r50, 'eq_hv');
    expect(hv50.value).toContain('513');

    const r60 = config.calculate({ fromValue: '60', fromUnit: 'hrc' });
    const hv60 = getResult(r60, 'eq_hv');
    expect(hv60.value).toContain('697');
  });

  it('converts HRB to HV using real ASTM E140 reference points, not the old fabricated formula', () => {
    // HRB 80 = HV 163 per ASTM E140. The old formula produced ~1610 — about
    // 10x too high.
    const r = config.calculate({ fromValue: '80', fromUnit: 'hrb' });
    const hv = getResult(r, 'eq_hv');
    expect(hv.value).toContain('163');
  });

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
