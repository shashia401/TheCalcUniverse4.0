import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/macro/index';
import { getValue } from '../../helpers';

describe('Macro calculator', () => {
  it('calculates macros for standard diet maintaining weight', () => {
    const r = config.calculate({
      unit: 'metric',
      sex: 'male',
      age: '30',
      weight: '80',
      heightFt: '',
      heightIn: '',
      heightCm: '180',
      activityLevel: '1.55',
      goal: 'maintain',
      diet: 'standard',
      bodyFatPct: '',
    });
    expect(getValue(r, 'dailyCalories')).toContain('kcal');
    expect(getValue(r, 'proteinGrams')).toContain('g');
    expect(getValue(r, 'carbGrams')).toContain('g');
    expect(getValue(r, 'fatGrams')).toContain('g');
  });

  it('adjusts calories for weight loss goal', () => {
    const rMaintain = config.calculate({
      unit: 'metric', sex: 'male', age: '30', weight: '80',
      heightCm: '180', heightFt: '', heightIn: '',
      activityLevel: '1.55', goal: 'maintain', diet: 'standard', bodyFatPct: '',
    });
    const rLoss = config.calculate({
      unit: 'metric', sex: 'male', age: '30', weight: '80',
      heightCm: '180', heightFt: '', heightIn: '',
      activityLevel: '1.55', goal: 'moderateLoss', diet: 'standard', bodyFatPct: '',
    });
    const maintainCals = parseInt(getValue(rMaintain, 'dailyCalories').replace(/,/g, ''));
    const lossCals = parseInt(getValue(rLoss, 'dailyCalories').replace(/,/g, ''));
    expect(lossCals).toBeLessThan(maintainCals);
  });

  it('changes macro split for keto diet', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'male', age: '30', weight: '80',
      heightCm: '180', heightFt: '', heightIn: '',
      activityLevel: '1.55', goal: 'maintain', diet: 'keto', bodyFatPct: '',
    });
    const fat = getValue(r, 'fatGrams');
    const fatG = parseInt(fat.match(/(\d+)/)![0]);
    const carbs = getValue(r, 'carbGrams');
    const carbG = parseInt(carbs.match(/(\d+)/)![0]);
    expect(fatG).toBeGreaterThan(carbG);
  });

  it('returns protein range recommendation', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'male', age: '30', weight: '80',
      heightCm: '180', heightFt: '', heightIn: '',
      activityLevel: '1.55', goal: 'maintain', diet: 'standard', bodyFatPct: '',
    });
    expect(getValue(r, 'proteinRange')).toContain('g');
  });

  it('returns diet label', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'male', age: '30', weight: '80',
      heightCm: '180', heightFt: '', heightIn: '',
      activityLevel: '1.55', goal: 'maintain', diet: 'mediterranean', bodyFatPct: '',
    });
    expect(getValue(r, 'dietLabel')).toContain('Mediterranean');
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      unit: 'imperial', sex: 'male', age: '30', weight: '0',
      heightFt: '0', heightIn: '0', heightCm: '',
      activityLevel: '1.55', goal: 'maintain', diet: 'standard', bodyFatPct: '',
    });
    expect(r).toEqual([]);
  });
});
