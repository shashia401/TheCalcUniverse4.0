import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/tdee/index';
import { getValue } from '../../helpers';

describe('TDEE / Calorie calculator', () => {
  it('calculates TDEE for male metric', () => {
    const r = config.calculate({
      unit: 'metric',
      sex: 'male',
      age: '30',
      weight: '80',
      heightCm: '180',
      heightFt: '',
      heightIn: '',
      activityLevel: '1.55',
      bodyFatPct: '',
    });
    const tdee = parseInt(getValue(r, 'tdee').replace(/,/g, ''));
    expect(tdee).toBeGreaterThan(2000);
    expect(tdee).toBeLessThan(3500);
  });

  it('calculates TDEE for female imperial', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'female',
      age: '30',
      weight: '150',
      heightFt: '5',
      heightIn: '5',
      heightCm: '',
      activityLevel: '1.375',
      bodyFatPct: '',
    });
    const tdee = parseInt(getValue(r, 'tdee').replace(/,/g, ''));
    expect(tdee).toBeGreaterThan(1500);
    expect(tdee).toBeLessThan(2800);
  });

  it('uses Katch-McArdle when body fat is provided', () => {
    const r = config.calculate({
      unit: 'metric',
      sex: 'male',
      age: '30',
      weight: '80',
      heightCm: '180',
      heightFt: '',
      heightIn: '',
      activityLevel: '1.55',
      bodyFatPct: '15',
    });
    const tdee = parseInt(getValue(r, 'tdee').replace(/,/g, ''));
    expect(tdee).toBeGreaterThan(2000);
  });

  it('shows safe minimum warning for extreme loss', () => {
    const r = config.calculate({
      unit: 'metric',
      sex: 'female',
      age: '30',
      weight: '55',
      heightCm: '165',
      heightFt: '',
      heightIn: '',
      activityLevel: '1.2',
      bodyFatPct: '',
    });
    const warning = getValue(r, 'safeMinWarning');
    expect(warning.toLowerCase()).toContain('never go below');
  });

  it('returns all goal matrix results', () => {
    const r = config.calculate({
      unit: 'metric',
      sex: 'male',
      age: '30',
      weight: '80',
      heightCm: '180',
      heightFt: '',
      heightIn: '',
      activityLevel: '1.55',
      bodyFatPct: '',
    });
    const targets = getValue(r, 'calorieTargets');
    expect(targets).toContain('Maintain');
    expect(targets).toContain('Cut');
    expect(targets).toContain('Bulk');
  });

  it('returns macronutrient results', () => {
    const r = config.calculate({
      unit: 'metric',
      sex: 'male',
      age: '30',
      weight: '80',
      heightCm: '180',
      heightFt: '',
      heightIn: '',
      activityLevel: '1.55',
      bodyFatPct: '',
    });
    const macros = getValue(r, 'macrosCombined');
    expect(macros).toContain('g');
  });

  // ─── Formula comparison tests ─────────────────────────────────
  it('returns Mifflin BMR in expected range for male', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'male', age: '30',
      weight: '80', heightCm: '180',
      heightFt: '', heightIn: '',
      activityLevel: '1.55', bodyFatPct: '',
    });
    const val = parseInt(getValue(r, 'mifflinBMR').replace(/,/g, ''));
    expect(val).toBeGreaterThan(1700);
    expect(val).toBeLessThan(1900);
  });

  it('returns Harris-Benedict BMR in expected range for male', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'male', age: '30',
      weight: '80', heightCm: '180',
      heightFt: '', heightIn: '',
      activityLevel: '1.55', bodyFatPct: '',
    });
    const val = parseInt(getValue(r, 'harrisBMR').replace(/,/g, ''));
    expect(val).toBeGreaterThan(1800);
    expect(val).toBeLessThan(2000);
  });

  it('returns Mifflin and Harris with different values', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'male', age: '30',
      weight: '80', heightCm: '180',
      heightFt: '', heightIn: '',
      activityLevel: '1.55', bodyFatPct: '',
    });
    const mifflin = getValue(r, 'mifflinBMR');
    const harris = getValue(r, 'harrisBMR');
    expect(mifflin).not.toBe(harris);
  });

  it('returns Katch-McArdle BMR when body fat provided', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'male', age: '30',
      weight: '80', heightCm: '180',
      heightFt: '', heightIn: '',
      activityLevel: '1.55', bodyFatPct: '15',
    });
    const val = parseInt(getValue(r, 'katchBMR').replace(/,/g, ''));
    expect(val).toBeGreaterThan(1600);
    expect(val).toBeLessThan(2000);
  });

  it('marks formula label as Katch-McArdle when body fat provided', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'male', age: '30',
      weight: '80', heightCm: '180',
      heightFt: '', heightIn: '',
      activityLevel: '1.55', bodyFatPct: '15',
    });
    const label = getValue(r, 'formulaLabel');
    expect(label).toBe('Katch-McArdle');
  });

  it('returns formulaLabel Mifflin-St Jeor by default', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'female', age: '30',
      weight: '65', heightCm: '165',
      heightFt: '', heightIn: '',
      activityLevel: '1.375', bodyFatPct: '',
    });
    const label = getValue(r, 'formulaLabel');
    expect(label).toBe('Mifflin-St Jeor');
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      unit: 'metric',
      sex: 'male',
      age: '30',
      weight: '0',
      heightCm: '0',
      heightFt: '',
      heightIn: '',
      activityLevel: '1.55',
      bodyFatPct: '',
    });
    expect(r).toEqual([]);
  });
});
