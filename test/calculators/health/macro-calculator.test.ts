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
  // ── Audit regressions (Mifflin-St Jeor / Katch-McArdle recomputed by hand) ──
  const num = (s: string) => parseInt(s.replace(/,/g, ''), 10);
  const base = { heightFt: '', heightIn: '', bodyFatPct: '', diet: 'standard', goal: 'maintain', activityLevel: '1.55' };

  it('worked example David: 28 M, 5ft10, 180 lb, 1.55, mild loss, high-protein -> 2,529 kcal; P 221 g, C 221 g, F 84 g', () => {
    // BMR = 10*81.6466 + 6.25*177.8 - 5*28 + 5 = 1792.7; TDEE = 2778.7; target 2528.7
    const r = config.calculate({ unit: 'imperial', sex: 'male', age: '28', weight: '180', heightFt: '5', heightIn: '10', heightCm: '', activityLevel: '1.55', goal: 'mildLoss', diet: 'highProtein', bodyFatPct: '' });
    expect(getValue(r, 'bmrValue')).toBe('Mifflin-St Jeor: 1,793 kcal');
    expect(getValue(r, 'tdeeForMacros')).toBe('2,779 kcal');
    expect(num(getValue(r, 'dailyCalories'))).toBe(2529);
    expect(getValue(r, 'proteinGrams')).toBe('221 g · 884 kcal');
    expect(getValue(r, 'carbGrams')).toBe('221 g · 884 kcal');
    expect(getValue(r, 'fatGrams')).toBe('84 g · 756 kcal');
    expect(getValue(r, 'calorieAdjustment')).toBe('-250 kcal');
    // insight: same calories on the standard split -> carbs 316 g, protein 126 g
    const std = config.calculate({ unit: 'imperial', sex: 'male', age: '28', weight: '180', heightFt: '5', heightIn: '10', heightCm: '', activityLevel: '1.55', goal: 'mildLoss', diet: 'standard', bodyFatPct: '' });
    expect(getValue(std, 'carbGrams')).toMatch(/^316 g/);
    expect(getValue(std, 'proteinGrams')).toMatch(/^126 g/);
  });

  it('worked example Lina: 35 F, 165 cm, 70 kg, sedentary, Mediterranean -> BMR 1,395, 1,674 kcal; P 84, C 188, F 65', () => {
    const r = config.calculate({ ...base, unit: 'metric', sex: 'female', age: '35', weight: '70', heightCm: '165', activityLevel: '1.2', diet: 'mediterranean' });
    expect(getValue(r, 'bmrValue')).toBe('Mifflin-St Jeor: 1,395 kcal');
    expect(num(getValue(r, 'dailyCalories'))).toBe(1674);
    expect(getValue(r, 'proteinGrams')).toBe('84 g · 336 kcal');
    expect(getValue(r, 'carbGrams')).toBe('188 g · 752 kcal');
    expect(getValue(r, 'fatGrams')).toBe('65 g · 585 kcal');
    // insight: switching to Light Exercise (1.375) -> TDEE 1,918 and protein 96 g
    const light = config.calculate({ ...base, unit: 'metric', sex: 'female', age: '35', weight: '70', heightCm: '165', activityLevel: '1.375', diet: 'mediterranean' });
    expect(getValue(light, 'tdeeForMacros')).toBe('1,918 kcal');
    expect(getValue(light, 'proteinGrams')).toMatch(/^96 g/);
  });

  it('explanation example: 2,200 kcal on 35/35/30 = 193 P, 193 C, 73 F; 20/50/30 = 110 P, 275 C (4/4/9 kcal per g)', () => {
    expect(Math.round(2200 * 0.35 / 4)).toBe(193);
    expect(Math.round(2200 * 0.3 / 9)).toBe(73);
    expect(Math.round(2200 * 0.2 / 4)).toBe(110);
    expect(Math.round(2200 * 0.5 / 4)).toBe(275);
  });

  it('Katch-McArdle: 80 kg at 15% fat = 370 + 21.6*68 = 1838.8 BMR, TDEE 2,850', () => {
    const r = config.calculate({ ...base, unit: 'metric', sex: 'male', age: '30', weight: '80', heightCm: '180', bodyFatPct: '15' });
    expect(getValue(r, 'bmrValue')).toBe('Katch-McArdle: 1,839 kcal');
    expect(getValue(r, 'tdeeForMacros')).toBe('2,850 kcal');
  });

  it('safety floor limits a deficit only: TDEE 1566, -500 -> held at 1,500 (adjustment -66)', () => {
    // 50 kg / 160 cm / 40 y male sedentary: BMR 1305, TDEE 1566
    const r = config.calculate({ ...base, unit: 'metric', sex: 'male', age: '40', weight: '50', heightCm: '160', activityLevel: '1.2', goal: 'moderateLoss' });
    expect(num(getValue(r, 'dailyCalories'))).toBe(1500);
    expect(getValue(r, 'calorieAdjustment')).toBe('-66 kcal (deficit limited by the 1,500 kcal safety minimum)');
  });

  it('safety floor never lifts a maintain target above TDEE (TDEE 977 stays 977, not 1,200)', () => {
    // 40 kg / 140 cm / 60 y female sedentary: BMR 814, TDEE 976.8
    const maintain = config.calculate({ ...base, unit: 'metric', sex: 'female', age: '60', weight: '40', heightCm: '140', activityLevel: '1.2' });
    expect(num(getValue(maintain, 'dailyCalories'))).toBe(977);
    const loss = config.calculate({ ...base, unit: 'metric', sex: 'female', age: '60', weight: '40', heightCm: '140', activityLevel: '1.2', goal: 'moderateLoss' });
    expect(num(getValue(loss, 'dailyCalories'))).toBe(977); // no deficit below TDEE when TDEE is already under the minimum
  });

  it('input bounds are realistic for both unit systems', () => {
    const f = (id: string) => config.inputs.find((i) => i.id === id)!;
    expect(f('weight').max).toBeGreaterThanOrEqual(1000);
    expect(f('heightCm').max).toBeLessThanOrEqual(275);
    expect(f('heightCm').min).toBeGreaterThan(0);
  });
});
