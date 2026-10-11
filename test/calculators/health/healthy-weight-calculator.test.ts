import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/healthy-weight/index';
import { getValue, getResult } from '../../helpers';

describe('Healthy Weight calculator', () => {
  it('calculates healthy weight range with BMI and WHtR', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'male',
      age: '30',
      weight: '180',
      waist: '34',
      heightFt: '5',
      heightIn: '10',
      heightCm: '',
      frameSize: 'medium',
    });
    expect(getValue(r, 'healthyWeightRange')).toContain('lbs');
    expect(getValue(r, 'whtr')).toBeTruthy();
    expect(getValue(r, 'bmi')).toBeTruthy();
  });

  it('adjusts target for frame size', () => {
    const rSmall = config.calculate({
      unit: 'imperial', sex: 'male', age: '30', weight: '180',
      waist: '34', heightFt: '5', heightIn: '10', heightCm: '', frameSize: 'small',
    });
    const rLarge = config.calculate({
      unit: 'imperial', sex: 'male', age: '30', weight: '180',
      waist: '34', heightFt: '5', heightIn: '10', heightCm: '', frameSize: 'large',
    });
    const smallTarget = parseFloat(getValue(rSmall, 'adjustedTarget'));
    const largeTarget = parseFloat(getValue(rLarge, 'adjustedTarget'));
    expect(largeTarget).toBeGreaterThan(smallTarget);
  });

  it('returns WHtR health threshold', () => {
    const r = config.calculate({
      unit: 'metric',
      sex: 'female',
      age: '30',
      weight: '65',
      waist: '75',
      heightFt: '',
      heightIn: '',
      heightCm: '165',
      frameSize: 'medium',
    });
    const whtrVal = parseFloat(getValue(r, 'whtr'));
    expect(whtrVal).toBeGreaterThan(0.3);
    expect(whtrVal).toBeLessThan(0.7);
  });

  it('returns Devine ideal weight reference', () => {
    const r = config.calculate({
      unit: 'imperial', sex: 'male', age: '30', weight: '180',
      waist: '34', heightFt: '5', heightIn: '10', heightCm: '', frameSize: 'medium',
    });
    expect(getValue(r, 'devineIdeal')).toContain('lbs');
  });

  it('returns empty for invalid height', () => {
    const r = config.calculate({
      unit: 'imperial', sex: 'male', age: '30', weight: '180',
      waist: '34', heightFt: '0', heightIn: '0', heightCm: '', frameSize: 'medium',
    });
    expect(r).toEqual([]);
  });
  // ── Audit regressions (independently derived) ──
  const metric = { unit: 'metric', sex: 'male', age: '30', heightFt: '', heightIn: '', frameSize: 'medium' };

  it('BMI category follows the DISPLAYED value: 72.13 kg @ 170 cm = 24.9585 -> "25.0" -> Overweight', () => {
    const r = config.calculate({ ...metric, weight: '72.13', waist: '80', heightCm: '170' });
    expect(getValue(r, 'bmi')).toBe('25.0');
    expect(getResult(r, 'bmi').label).toBe('BMI — Overweight');
    const ok = config.calculate({ ...metric, weight: '72', waist: '80', heightCm: '170' });
    expect(getValue(ok, 'bmi')).toBe('24.9'); // 72 / 2.89 = 24.913
    expect(getResult(ok, 'bmi').label).toBe('BMI — Normal weight');
  });

  it('WHtR bands (Ashwell/NICE): <0.4 low, 0.4-0.49 healthy, 0.5-0.59 increased, >=0.6 high; shown to 2 decimals', () => {
    const at = (waist: string) => getValue(config.calculate({ ...metric, weight: '70', waist, heightCm: '170' }), 'whtr');
    expect(at('64.6')).toMatch(/^0\.38 — Low/); // 64.6/170 = 0.38
    expect(at('68')).toMatch(/^0\.40 — Healthy/); // 0.40 exactly
    expect(at('84')).toMatch(/^0\.49 — Healthy/); // 0.494
    expect(at('85')).toMatch(/^0\.50 — Increased/); // 0.50 exactly is NOT "< 0.5"
    expect(at('102')).toMatch(/^0\.60 — High/); // 0.60 exactly
  });

  it('worked example: 5ft 8in, 165 lb, 31 in waist -> BMI 25.1 and WHtR 31/68 = 0.456 -> 0.46', () => {
    const r = config.calculate({ unit: 'imperial', sex: 'male', age: '35', weight: '165', waist: '31', heightFt: '5', heightIn: '8', heightCm: '', frameSize: 'medium' });
    expect(getValue(r, 'bmi')).toBe('25.1');
    expect(getValue(r, 'whtr')).toMatch(/^0\.46 — Healthy/);
  });

  it('Devine: male 70 in = 50 + 2.3*10 = 73 kg = 161 lb; female 45.5 + 23 = 68.5 kg = 151 lb', () => {
    const base = { unit: 'imperial', age: '30', weight: '150', waist: '30', heightFt: '5', heightIn: '10', heightCm: '', frameSize: 'medium' };
    expect(getValue(config.calculate({ ...base, sex: 'male' }), 'devineIdeal')).toBe('161 lbs');
    expect(getValue(config.calculate({ ...base, sex: 'female' }), 'devineIdeal')).toBe('151 lbs');
  });

  it('input bounds are realistic for both unit systems', () => {
    const f = (id: string) => config.inputs.find((i) => i.id === id)!;
    expect(f('weight').max).toBeGreaterThanOrEqual(1000); // lb
    expect(f('weight').min).toBeLessThanOrEqual(40); // kg
    expect(f('heightCm').max).toBeLessThanOrEqual(275);
    expect(f('heightFt').min).toBeGreaterThan(0);
    expect(f('waist').max).toBeDefined();
  });
});
