import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/macro/index';
import { getValue } from '../../helpers';

describe('Macro calculator', () => {
  it('calculates macros for standard diet maintaining weight (metric)', () => {
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
    expect(getValue(r, 'dietLabel')).toContain('Standard');
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

  it('changes macro split for keto diet (fat > carbs)', () => {
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

  it('handles imperial unit conversion', () => {
    const r = config.calculate({
      unit: 'imperial', sex: 'female', age: '25', weight: '150',
      heightFt: '5', heightIn: '6', heightCm: '',
      activityLevel: '1.375', goal: 'mildLoss', diet: 'standard', bodyFatPct: '',
    });
    expect(getValue(r, 'dailyCalories')).toContain('kcal');
    expect(getValue(r, 'proteinGrams')).toContain('g');
  });

  it('handles lean muscle gain goal', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'male', age: '25', weight: '75',
      heightCm: '175', heightFt: '', heightIn: '',
      activityLevel: '1.725', goal: 'leanGain', diet: 'highProtein', bodyFatPct: '',
    });
    const cals = parseInt(getValue(r, 'dailyCalories').replace(/,/g, ''));
    // BMR ~1777, TDEE ~3065, +250 gain = ~3315 (above 3000)
    expect(cals).toBeGreaterThan(2500);
    expect(getValue(r, 'proteinGrams')).toContain('g');
  });

  it('returns empty array for zero weight', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'male', age: '30', weight: '0',
      heightCm: '180', heightFt: '', heightIn: '',
      activityLevel: '1.55', goal: 'maintain', diet: 'standard', bodyFatPct: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for zero height', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'female', age: '25', weight: '60',
      heightCm: '0', heightFt: '', heightIn: '',
      activityLevel: '1.55', goal: 'maintain', diet: 'standard', bodyFatPct: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for empty weight', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'male', age: '30', weight: '',
      heightCm: '180', heightFt: '', heightIn: '',
      activityLevel: '1.55', goal: 'maintain', diet: 'standard', bodyFatPct: '',
    });
    expect(r).toEqual([]);
  });

  it('enforces minimum calorie floor for women', () => {
    // A very light, sedentary, short woman should hit the 1200 kcal floor
    const r = config.calculate({
      unit: 'metric', sex: 'female', age: '20', weight: '45',
      heightCm: '150', heightFt: '', heightIn: '',
      activityLevel: '1.2', goal: 'moderateLoss', diet: 'standard', bodyFatPct: '',
    });
    const cals = parseInt(getValue(r, 'dailyCalories').replace(/,/g, ''));
    expect(cals).toBeGreaterThanOrEqual(1200);
  });

  it('enforces minimum calorie floor for men', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'male', age: '20', weight: '50',
      heightCm: '160', heightFt: '', heightIn: '',
      activityLevel: '1.2', goal: 'moderateLoss', diet: 'standard', bodyFatPct: '',
    });
    const cals = parseInt(getValue(r, 'dailyCalories').replace(/,/g, ''));
    expect(cals).toBeGreaterThanOrEqual(1500);
  });

  it('uses Katch-McArdle when body fat % is provided', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'male', age: '30', weight: '80',
      heightCm: '180', heightFt: '', heightIn: '',
      activityLevel: '1.55', goal: 'maintain', diet: 'standard', bodyFatPct: '15',
    });
    expect(getValue(r, 'bmrValue')).toContain('Katch-McArdle');
  });

  it('uses Mifflin-St Jeor when body fat % is empty', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'male', age: '30', weight: '80',
      heightCm: '180', heightFt: '', heightIn: '',
      activityLevel: '1.55', goal: 'maintain', diet: 'standard', bodyFatPct: '',
    });
    expect(getValue(r, 'bmrValue')).toContain('Mifflin-St Jeor');
  });

  it('includes carbohydrate range result', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'male', age: '30', weight: '80',
      heightCm: '180', heightFt: '', heightIn: '',
      activityLevel: '1.55', goal: 'maintain', diet: 'standard', bodyFatPct: '',
    });
    expect(getValue(r, 'carbRange')).toContain('g');
  });

  it('includes calorie adjustment result', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'male', age: '30', weight: '80',
      heightCm: '180', heightFt: '', heightIn: '',
      activityLevel: '1.55', goal: 'moderateLoss', diet: 'standard', bodyFatPct: '',
    });
    expect(getValue(r, 'calorieAdjustment')).toContain('-500');
  });

  it('returns all five diet presets correctly', () => {
    const base = { unit: 'metric', sex: 'male', age: '30', weight: '80', heightCm: '180', heightFt: '', heightIn: '', activityLevel: '1.55', goal: 'maintain', bodyFatPct: '' };
    const diets = ['standard', 'lowCarb', 'keto', 'highProtein', 'mediterranean'];
    for (const diet of diets) {
      const r = config.calculate({ ...base, diet });
      // Keto should have minimal carbs, standard/highProtein have significant carbs
      const carbVal = getValue(r, 'carbGrams');
      const carbG = parseInt(carbVal.match(/(\d+)/)![0]);
      const fatVal = getValue(r, 'fatGrams');
      const fatG = parseInt(fatVal.match(/(\d+)/)![0]);
      if (diet === 'keto') {
        expect(fatG).toBeGreaterThan(carbG * 2); // fat should be dramatically higher than carbs
      }
      if (diet === 'standard') {
        expect(carbG).toBeGreaterThan(fatG); // carbs > fat
      }
      expect(carbG).toBeGreaterThan(0);
      expect(parseInt(fatVal.match(/(\d+)/)![0])).toBeGreaterThan(0);
    }
  });
});
