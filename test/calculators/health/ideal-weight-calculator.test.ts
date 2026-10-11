import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/ideal-weight/index';
import { getValue, getResult } from '../../helpers';

describe('Ideal Weight calculator', () => {
  it('returns all four formulas for male', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'male',
      heightFt: '5',
      heightIn: '10',
      heightCm: '',
      weight: '',
    });
    expect(getValue(r, 'devine')).toContain('lbs');
    expect(getValue(r, 'robinson')).toContain('lbs');
    expect(getValue(r, 'miller')).toContain('lbs');
    expect(getValue(r, 'hamwi')).toContain('lbs');
    expect(getValue(r, 'avgIdeal')).toContain('lbs');
  });

  it('returns all four formulas for female', () => {
    const r = config.calculate({
      unit: 'metric',
      sex: 'female',
      heightFt: '',
      heightIn: '',
      heightCm: '165',
      weight: '',
    });
    expect(getValue(r, 'devine')).toContain('kg');
    expect(getValue(r, 'robinson')).toContain('kg');
    expect(getValue(r, 'miller')).toContain('kg');
    expect(getValue(r, 'hamwi')).toContain('kg');
  });

  it('shows weight comparison when current weight is provided', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'male',
      heightFt: '5',
      heightIn: '10',
      heightCm: '',
      weight: '180',
    });
    expect(getValue(r, 'weightDiff')).toBeTruthy();
  });

  it('returns healthy BMI range', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'female',
      heightFt: '5',
      heightIn: '5',
      heightCm: '',
      weight: '',
    });
    expect(getValue(r, 'bmiRange')).toContain('lbs');
  });

  it('returns ideal weight range', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'male',
      heightFt: '5',
      heightIn: '10',
      heightCm: '',
      weight: '',
    });
    const range = getValue(r, 'rangeIdeal');
    expect(range).toContain('–');
    expect(range).toContain('lbs');
  });

  it('returns empty for zero height', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'male',
      heightFt: '0',
      heightIn: '0',
      heightCm: '',
      weight: '',
    });
    expect(r).toEqual([]);
  });
  // ── Audit regressions: constants checked against Devine 1974 / Robinson 1983 / Miller 1983 / Hamwi 1964 ──
  const imp = (sex: string, ft: string, inch: string) => ({ unit: 'imperial', sex, heightFt: ft, heightIn: inch, heightCm: '', weight: '' });

  it('5ft10 male: Devine 73.0, Robinson 71.0, Miller 70.3, Hamwi 166 lb -> 161/157/155/166 lb, avg 72.4 kg = 160 lb', () => {
    const r = config.calculate(imp('male', '5', '10'));
    expect(getValue(r, 'devine')).toBe('161 lbs');
    expect(getValue(r, 'robinson')).toBe('157 lbs');
    expect(getValue(r, 'miller')).toBe('155 lbs');
    expect(getValue(r, 'hamwi')).toBe('166 lbs');
    expect(getValue(r, 'avgIdeal')).toBe('160 lbs');
    expect(getValue(r, 'rangeIdeal')).toBe('155 lbs – 166 lbs');
    // BMI 18.5 / 24.9 at 1.778 m = 58.48 / 78.72 kg = 128.9 / 173.5 lb
    expect(getValue(r, 'bmiRange')).toBe('129 lbs – 174 lbs');
  });

  it('5ft4 female: Devine 54.7, Robinson 55.8, Miller 58.54 kg, Hamwi 100 + 5*4 = 120 lb', () => {
    const r = config.calculate(imp('female', '5', '4'));
    expect(getValue(r, 'devine')).toBe('121 lbs');
    expect(getValue(r, 'robinson')).toBe('123 lbs');
    expect(getValue(r, 'miller')).toBe('129 lbs');
    expect(getValue(r, 'hamwi')).toBe('120 lbs');
  });

  it('metric 175 cm male (68.898 in): Devine 70.5, Robinson 68.9, Miller 68.7, Hamwi 72.3, avg 70.1 kg', () => {
    const r = config.calculate({ unit: 'metric', sex: 'male', heightCm: '175', heightFt: '', heightIn: '', weight: '' });
    expect(getValue(r, 'devine')).toBe('70.5 kg');
    expect(getValue(r, 'robinson')).toBe('68.9 kg');
    expect(getValue(r, 'miller')).toBe('68.7 kg');
    expect(getValue(r, 'hamwi')).toBe('72.3 kg');
    expect(getValue(r, 'avgIdeal')).toBe('70.1 kg');
  });

  it('under 5 ft the formulas are held at the 5 ft value and the interpretation says so', () => {
    const r = config.calculate(imp('female', '4', '6'));
    expect(getValue(r, 'devine')).toBe('100 lbs'); // 45.5 kg
    expect(getResult(r, 'avgIdeal').interpretation).toContain('5 ft');
    expect(getResult(config.calculate(imp('female', '5', '4')), 'avgIdeal').interpretation).not.toContain('held at');
  });

  it('weight difference vs average ideal: 180 lb vs 159.6 lb = +20.4 lb', () => {
    const r = config.calculate({ ...imp('male', '5', '10'), weight: '180' });
    expect(getValue(r, 'weightDiff')).toBe('+20.4 lbs');
  });

  it('educational range example (155 lb Miller to 166 lb Hamwi) matches the formulas', () => {
    expect(config.educational!.explanation).toContain('155 lbs (Miller) to 166 lbs (Hamwi)');
  });

  it('input bounds are realistic', () => {
    const f = (id: string) => config.inputs.find((i) => i.id === id)!;
    expect(f('heightCm').max).toBeLessThanOrEqual(275);
    expect(f('heightCm').min).toBeGreaterThan(0);
    expect(f('heightFt').min).toBeGreaterThan(0);
    expect(f('weight').max).toBeGreaterThanOrEqual(1000);
  });
});
