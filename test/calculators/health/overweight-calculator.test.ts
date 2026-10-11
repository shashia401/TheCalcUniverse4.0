import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/overweight/index';
import { getValue } from '../../helpers';

describe('Overweight calculator', () => {
  it('calculates BMI and WHtR', () => {
    const r = config.calculate({
      unit: 'imperial', sex: 'male', age: '40', weight: '200',
      heightFt: '5', heightIn: '10', heightCm: '', waist: '38',
    });
    expect(getValue(r, 'bmiScore')).toContain('Overweight');
    expect(getValue(r, 'whtr')).toContain('Increased risk');
  });

  it('calculates metric inputs', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'female', age: '35', weight: '75',
      heightFt: '', heightIn: '', heightCm: '170', waist: '80',
    });
    const whtr = parseFloat(getValue(r, 'whtr'));
    expect(whtr).toBeGreaterThan(0.3);
    expect(whtr).toBeLessThan(0.7);
  });

  it('returns combined risk assessment', () => {
    const r = config.calculate({
      unit: 'imperial', sex: 'male', age: '50', weight: '240',
      heightFt: '5', heightIn: '10', heightCm: '', waist: '44',
    });
    expect(getValue(r, 'combinedRisk')).toBeTruthy();
  });

  it('returns waist status with threshold', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'female', age: '30', weight: '65',
      heightFt: '', heightIn: '', heightCm: '165', waist: '75',
    });
    expect(getValue(r, 'waistStatus')).toContain('cm');
  });

  it('returns visceral fat context', () => {
    const r = config.calculate({
      unit: 'imperial', sex: 'male', age: '45', weight: '220',
      heightFt: '5', heightIn: '10', heightCm: '', waist: '42',
    });
    expect(getValue(r, 'visceralFatNote')).toBeTruthy();
  });

  it('returns empty for invalid height', () => {
    const r = config.calculate({
      unit: 'imperial', sex: 'male', age: '30', weight: '180',
      heightFt: '0', heightIn: '0', heightCm: '', waist: '34',
    });
    expect(r).toEqual([]);
  });
  // ── Audit regressions (independently derived) ──
  const metric = (weight: string, heightCm: string, waist: string, sex = 'male') => ({ unit: 'metric', sex, age: '40', weight, heightFt: '', heightIn: '', heightCm, waist });

  it('BMI category follows the DISPLAYED value: 72.13 kg @ 170 cm = 24.9585 -> "25.0 — Overweight"', () => {
    expect(getValue(config.calculate(metric('72.13', '170', '80')), 'bmiScore')).toBe('25.0 — Overweight');
    expect(getValue(config.calculate(metric('72', '170', '80')), 'bmiScore')).toBe('24.9 — Normal Weight'); // 72/2.89 = 24.913
  });

  it('BMI class cut-offs 18.5 / 25 / 30 / 35 / 40 (WHO)', () => {
    const cat = (kg: string) => getValue(config.calculate(metric(kg, '100', '40')), 'bmiScore').split(' — ').slice(1).join(' — '); // 100 cm -> BMI = kg / 1
    expect(cat('18.4')).toBe('Underweight');
    expect(cat('18.5')).toBe('Normal Weight');
    expect(cat('30')).toBe('Obese (Class I)');
    expect(cat('35')).toBe('Obese (Class II)');
    expect(cat('40')).toBe('Obese (Class III — Severe)');
  });

  it('WHtR bands (Ashwell/NICE) on the displayed 2-decimal ratio: 0.38 / 0.40 / 0.49 / 0.50 / 0.60', () => {
    const w = (waist: string) => getValue(config.calculate(metric('70', '170', waist)), 'whtr');
    expect(w('64.6')).toBe('0.38 — Underweight range');
    expect(w('68')).toBe('0.40 — Healthy range');
    expect(w('84')).toBe('0.49 — Healthy range'); // 0.494
    expect(w('85')).toBe('0.50 — Increased risk'); // exactly 0.5 is NOT "less than half"
    expect(w('102')).toBe('0.60 — High risk');
  });

  it('worked example: 5ft10, 210 lb, 38 in waist -> BMI 30.1 (obese), WHtR 0.54; 34 in waist -> 0.49 healthy', () => {
    const base = { unit: 'imperial', sex: 'male', age: '40', weight: '210', heightFt: '5', heightIn: '10', heightCm: '' };
    expect(getValue(config.calculate({ ...base, waist: '38' }), 'bmiScore')).toBe('30.1 — Obese (Class I)');
    expect(getValue(config.calculate({ ...base, waist: '38' }), 'whtr')).toBe('0.54 — Increased risk');
    expect(getValue(config.calculate({ ...base, waist: '34' }), 'whtr')).toBe('0.49 — Healthy range');
  });

  it('underweight BMI is not reported as "both in the healthy range"', () => {
    const r = config.calculate(metric('50', '170', '66')); // BMI 17.3, WHtR 0.39
    expect(getValue(r, 'combinedRisk')).toMatch(/^Underweight/);
  });

  it('waist threshold (NCEP ATP III: 102 cm/40 in male, 88 cm/35 in female) is compared in the entered unit, > only', () => {
    const imp = (waist: string, sex: string) => getValue(config.calculate({ unit: 'imperial', sex, age: '40', weight: '180', heightFt: '5', heightIn: '10', heightCm: '', waist }), 'waistStatus');
    expect(imp('40', 'male')).toBe('40.0 in — At or below the 40 in metabolic syndrome threshold');
    expect(imp('40.5', 'male')).toBe('40.5 in — 0.5 in above the 40 in threshold for metabolic syndrome risk');
    expect(imp('35.25', 'female')).toBe('35.3 in — 0.3 in above the 35 in threshold for metabolic syndrome risk');
    const cm = getValue(config.calculate(metric('80', '175', '88.5', 'female')), 'waistStatus');
    expect(cm).toBe('88.5 cm — 0.5 cm above the 88 cm threshold for metabolic syndrome risk');
    expect(getValue(config.calculate(metric('80', '175', '88', 'female')), 'waistStatus')).toContain('At or below the 88 cm');
  });

  it('input bounds are realistic for both unit systems', () => {
    const f = (id: string) => config.inputs.find((i) => i.id === id)!;
    expect(f('weight').max).toBeGreaterThanOrEqual(1000);
    expect(f('heightCm').max).toBeLessThanOrEqual(275);
    expect(f('heightCm').min).toBeGreaterThan(0);
    expect(f('waist').max).toBeDefined();
  });
});
