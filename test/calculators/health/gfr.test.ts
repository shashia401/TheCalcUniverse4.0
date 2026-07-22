import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/gfr/index';
import { getValue } from '../../helpers';

describe('GFR calculator', () => {
  it('calculates eGFR for male using 2021 CKD-EPI', () => {
    const r = config.calculate({
      sex: 'male', age: '50', creatinine: '1.2', creatinineUnit: 'mgdl',
    });
    const egfr = parseFloat(getValue(r, 'egfr'));
    expect(egfr).toBeGreaterThan(50);
    expect(egfr).toBeLessThan(90);
    expect(getValue(r, 'egfr')).toContain('mL/min/1.73m²');
  });

  it('calculates eGFR for female', () => {
    const r = config.calculate({
      sex: 'female', age: '40', creatinine: '0.9', creatinineUnit: 'mgdl',
    });
    const egfr = parseFloat(getValue(r, 'egfr'));
    expect(egfr).toBeGreaterThan(60);
  });

  it('returns CKD stage', () => {
    const r = config.calculate({
      sex: 'male', age: '60', creatinine: '2.0', creatinineUnit: 'mgdl',
    });
    expect(getValue(r, 'ckdStage')).toContain('Stage');
  });

  it('converts umol/L to mg/dL', () => {
    const rMgdl = config.calculate({
      sex: 'male', age: '50', creatinine: '1.2', creatinineUnit: 'mgdl',
    });
    const rUmol = config.calculate({
      sex: 'male', age: '50', creatinine: '106.1', creatinineUnit: 'umol',
    });
    const egfrMgdl = parseFloat(getValue(rMgdl, 'egfr'));
    const egfrUmol = parseFloat(getValue(rUmol, 'egfr'));
    expect(Math.abs(egfrMgdl - egfrUmol)).toBeLessThan(3);
  });

  it('returns formula reference and disclaimer', () => {
    const r = config.calculate({
      sex: 'female', age: '30', creatinine: '0.8', creatinineUnit: 'mgdl',
    });
    expect(getValue(r, 'formulaUsed')).toContain('2021 CKD-EPI');
    expect(getValue(r, 'medicalDisclaimer')).toContain('estimate');
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      sex: 'male', age: '50', creatinine: '-1', creatinineUnit: 'mgdl',
    });
    expect(r).toEqual([]);
  });
});
