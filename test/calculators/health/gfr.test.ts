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

  // ── Audit regressions: values recomputed independently from the published CKD-EPI 2021 equation ──
  // eGFR = 142 x min(Scr/k,1)^a x max(Scr/k,1)^-1.200 x 0.9938^age x 1.012 [female]; k 0.7/0.9, a -0.241/-0.302
  const egfrOf = (v: Record<string, string>) => getValue(config.calculate(v), 'egfr');
  it.each([
    ['male', '50', '1.2', '73.7'], ['female', '40', '0.9', '82.9'], ['female', '45', '0.8', '92.5'],
    ['male', '70', '1.3', '59.1'], ['male', '60', '2.0', '37.5'],
    ['female', '25', '0.5', '133.4'], // Scr/k < 1 branch (exponent -0.241)
    ['male', '25', '0.7', '131.1'],   // Scr/k < 1 branch (exponent -0.302)
  ])('%s age %s creatinine %s mg/dL -> %s', (sex, age, creatinine, expected) => {
    expect(egfrOf({ sex, age, creatinine, creatinineUnit: 'mgdl' })).toBe(`${expected} mL/min/1.73m²`);
  });

  it('μmol/L entry is possible: the creatinine field accepts 80 μmol/L and 80 μmol/L = 0.905 mg/dL -> 103.4', () => {
    const f = config.inputs.find((i) => i.id === 'creatinine')!;
    expect(f.max!).toBeGreaterThanOrEqual(1768); // 20 mg/dL x 88.4 — the old max of 20 blocked every real μmol/L value
    expect(egfrOf({ sex: 'male', age: '50', creatinine: '80', creatinineUnit: 'umol' })).toBe('103.4 mL/min/1.73m²');
  });

  it('rejects physiologically impossible creatinine in either unit instead of returning a meaningless eGFR', () => {
    expect(config.calculate({ sex: 'male', age: '50', creatinine: '106', creatinineUnit: 'mgdl' })).toEqual([]); // μmol value typed as mg/dL
    expect(config.calculate({ sex: 'male', age: '50', creatinine: '1.2', creatinineUnit: 'umol' })).toEqual([]); // mg/dL value typed as μmol/L
  });

  it('stage boundaries: 90 -> Stage 1, 60 -> Stage 2, 45 -> 3a, 30 -> 3b, 15 -> Stage 4, below 15 -> Stage 5 (KDIGO)', () => {
    const stage = (creatinine: string, age = '50', sex = 'male') => getValue(config.calculate({ sex, age, creatinine, creatinineUnit: 'mgdl' }), 'ckdStage');
    expect(stage('0.9', '30')).toContain('Stage 1');   // eGFR 117.8
    expect(stage('1.3', '50')).toContain('Stage 2');   // eGFR 66.9
    expect(stage('1.7', '60')).toContain('Stage 3a');  // eGFR 45.6
    expect(stage('2.3', '60')).toContain('Stage 3b');  // eGFR 31.7
    expect(stage('3.5', '60')).toContain('Stage 4');   // eGFR 19.2
    expect(stage('7', '60')).toContain('Stage 5');     // eGFR 8.3
  });
});
