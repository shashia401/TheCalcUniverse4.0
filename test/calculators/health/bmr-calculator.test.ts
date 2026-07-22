import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/bmr/index';
import { getValue } from '../../helpers';

describe('BMR calculator', () => {
  it('calculates Mifflin-St Jeor BMR for male', () => {
    const r = config.calculate({
      unit: 'metric',
      formula: 'mifflin',
      sex: 'male',
      age: '30',
      weight: '80',
      heightFt: '',
      heightIn: '',
      heightCm: '180',
      bodyFatPct: '',
    });
    const bmr = parseInt(getValue(r, 'primaryBMR').replace(/,/g, ''));
    expect(bmr).toBeGreaterThan(1500);
    expect(bmr).toBeLessThan(2500);
    expect(getValue(r, 'mifflinLine')).toContain('kcal');
    expect(getValue(r, 'harrisLine')).toContain('kcal');
  });

  it('calculates Harris-Benedict BMR for female', () => {
    const r = config.calculate({
      unit: 'imperial',
      formula: 'harris',
      sex: 'female',
      age: '30',
      weight: '140',
      heightFt: '5',
      heightIn: '5',
      heightCm: '',
      bodyFatPct: '',
    });
    const bmr = parseInt(getValue(r, 'primaryBMR').replace(/,/g, ''));
    expect(bmr).toBeGreaterThan(1200);
    expect(bmr).toBeLessThan(2200);
  });

  it('calculates Katch-McArdle when body fat is provided', () => {
    const r = config.calculate({
      unit: 'metric',
      formula: 'katch',
      sex: 'male',
      age: '30',
      weight: '80',
      heightFt: '',
      heightIn: '',
      heightCm: '180',
      bodyFatPct: '15',
    });
    const bmr = parseInt(getValue(r, 'primaryBMR').replace(/,/g, ''));
    expect(bmr).toBeGreaterThan(1500);
    expect(getValue(r, 'katchLine')).toContain('kcal');
  });

  it('shows formula line with actual numbers', () => {
    const r = config.calculate({
      unit: 'metric',
      formula: 'mifflin',
      sex: 'male',
      age: '30',
      weight: '80',
      heightFt: '',
      heightIn: '',
      heightCm: '180',
      bodyFatPct: '',
    });
    const formulaLine = getValue(r, 'formulaLine');
    expect(formulaLine).toContain('10 ×');
    expect(formulaLine).toContain('=');
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      unit: 'metric',
      formula: 'mifflin',
      sex: 'male',
      age: '0',
      weight: '0',
      heightFt: '',
      heightIn: '',
      heightCm: '0',
      bodyFatPct: '',
    });
    expect(r).toEqual([]);
  });

  it('returns hourly burn rate', () => {
    const r = config.calculate({
      unit: 'metric',
      formula: 'mifflin',
      sex: 'male',
      age: '30',
      weight: '80',
      heightFt: '',
      heightIn: '',
      heightCm: '180',
      bodyFatPct: '',
    });
    expect(getValue(r, 'hourlyBurn')).toContain('kcal/hour');
  });
});
