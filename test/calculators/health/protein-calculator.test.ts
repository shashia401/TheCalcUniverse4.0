import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/protein/index';
import { getValue } from '../../helpers';

describe('Protein calculator', () => {
  it('calculates protein range for muscle gain', () => {
    const r = config.calculate({
      unit: 'metric',
      weight: '80',
      age: '30',
      heightFt: '',
      heightIn: '',
      heightCm: '180',
      goal: 'bulk',
      trainingFrequency: 'moderate',
    });
    const range = getValue(r, 'dailyProteinRange');
    expect(range).toContain('g/day');
    expect(parseInt(getValue(r, 'dailyTarget'))).toBeGreaterThan(100);
  });

  it('calculates lower range for maintenance', () => {
    const r = config.calculate({
      unit: 'imperial',
      weight: '170',
      age: '30',
      heightFt: '5',
      heightIn: '10',
      heightCm: '',
      goal: 'maintain',
      trainingFrequency: 'none',
    });
    const target = parseInt(getValue(r, 'dailyTarget'));
    expect(target).toBeGreaterThan(70);
    expect(target).toBeLessThan(180);
  });

  it('returns per-meal breakdown', () => {
    const r = config.calculate({
      unit: 'metric', weight: '80', age: '30',
      heightFt: '', heightIn: '', heightCm: '180',
      goal: 'bulk', trainingFrequency: 'heavy',
    });
    expect(getValue(r, 'perMeal')).toContain('g');
  });

  it('returns MPS optimal schedule', () => {
    const r = config.calculate({
      unit: 'metric', weight: '80', age: '30',
      heightFt: '', heightIn: '', heightCm: '180',
      goal: 'bulk', trainingFrequency: 'moderate',
    });
    expect(getValue(r, 'mpsOptimal')).toContain('meals');
  });

  it('returns food equivalents', () => {
    const r = config.calculate({
      unit: 'imperial', weight: '176', age: '30',
      heightFt: '5', heightIn: '10', heightCm: '',
      goal: 'cut', trainingFrequency: 'moderate',
    });
    expect(getValue(r, 'foodEquivalents')).toContain('chicken');
  });

  it('divides chicken-breast equivalents by 26g (the documented protein content of a 3 oz breast), not 31g (regression)', () => {
    const r = config.calculate({
      unit: 'metric', weight: '100', age: '30',
      heightFt: '', heightIn: '', heightCm: '180',
      goal: 'maintain', trainingFrequency: 'none',
    });
    const dailyTarget = parseFloat(getValue(r, 'dailyTarget'));
    const equivalents = getValue(r, 'foodEquivalents');
    const expectedBreasts = Math.round(dailyTarget / 26).toString();
    expect(equivalents).toContain(`~${expectedBreasts} chicken breasts`);
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      unit: 'metric', weight: '0', age: '30',
      heightFt: '', heightIn: '', heightCm: '',
      goal: 'maintain', trainingFrequency: 'none',
    });
    expect(r).toEqual([]);
  });
  // ── Audit regressions: grams = kg x g/kg (rounded), target fraction = 0.3 + adjust*0.4 of the range ──
  describe('Audit regressions', () => {
    const run = (weight: string, goal: string, trainingFrequency: string, unit = 'metric') => config.calculate({ unit, weight, goal, trainingFrequency });

    it('80 kg, bulk 1.6-2.2, moderate training (fraction 0.42): range 128-176, target 1.852 g/kg = 148 g, 592 kcal', () => {
      const r = run('80', 'bulk', 'moderate');
      expect(getValue(r, 'dailyProteinRange')).toBe('128–176 g/day · 592 kcal');
      expect(getValue(r, 'dailyTarget')).toBe('148 g/day · 592 kcal · 1.85 g/kg');
      expect(getValue(r, 'perMeal')).toBe('30 g × 5 meals · 37 g × 4 meals · 49 g × 3 meals');
      expect(getValue(r, 'mpsOptimal')).toBe('5 meals/day at ~32 g per meal (max 0.4 g/kg/meal)');
    });

    it('food equivalents are counts of the stated serving: 148 g -> 6 breasts (26 g), 25 eggs (6 g), 6 scoops (25 g), 9 yogurt servings (17 g), 7 salmon (22 g)', () => {
      expect(getValue(run('80', 'bulk', 'moderate'), 'foodEquivalents')).toBe(
        '~6 chicken breasts (3 oz) · 25 eggs · 6 whey scoops · 9 servings Greek yogurt (3/4 cup) · 7 servings salmon (3 oz)',
      );
    });

    it('Maintain follows the RDA floor: 100 kg, no training -> 0.8-1.2 g/kg = 80-120 g, target 0.92 g/kg = 92 g', () => {
      const r = run('100', 'maintain', 'none');
      expect(getValue(r, 'dailyProteinRange')).toBe('80–120 g/day · 368 kcal');
      expect(getValue(r, 'dailyTarget')).toBe('92 g/day · 368 kcal · 0.92 g/kg');
    });

    it('imperial input converts lb -> kg: 170 lb = 77.11 kg, maintain/none -> range 62-93, target 71', () => {
      const r = run('170', 'maintain', 'none', 'imperial');
      expect(getValue(r, 'dailyProteinRange')).toBe('62–93 g/day · 284 kcal');
      expect(getValue(r, 'dailyTarget')).toContain('71 g/day');
    });

    it('endurance athlete, heavy training (fraction 0.5): 50 kg -> 70-90 g, target 1.6 g/kg = 80 g', () => {
      const r = run('50', 'athlete', 'heavy');
      expect(getValue(r, 'dailyProteinRange')).toBe('70–90 g/day · 320 kcal');
      expect(getValue(r, 'dailyTarget')).toBe('80 g/day · 320 kcal · 1.60 g/kg');
    });

    it('panel data (_protein) carries the real numbers, not the digits glued together from display strings', () => {
      const d = JSON.parse(getValue(run('80', 'bulk', 'moderate'), '_protein'));
      expect(d).toEqual({ min: 128, max: 176, target: 148, meals: [{ n: 5, g: 30 }, { n: 4, g: 37 }, { n: 3, g: 49 }] });
    });

    it('weights under 2.5 kg return [], 2.5 kg is accepted', () => {
      expect(run('2.4', 'cut', 'moderate')).toEqual([]);
      expect(run('2.5', 'cut', 'moderate').length).toBeGreaterThan(0);
    });

    it('unused age/height inputs are gone and weight is bounded', () => {
      const ids = config.inputs.map((i) => i.id);
      expect(ids).not.toContain('age');
      expect(ids).not.toContain('heightCm');
      const w = config.inputs.find((i) => i.id === 'weight')!;
      expect(w.min).toBeGreaterThan(0);
      expect(w.max).toBeGreaterThanOrEqual(1000);
    });
  });
});
