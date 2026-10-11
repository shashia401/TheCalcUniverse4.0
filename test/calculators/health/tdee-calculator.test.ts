import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/tdee/index';
import { getValue, getResult } from '../../helpers';

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
  // ── Audit regressions (BMR equations and multipliers recomputed by hand) ──
  describe('Audit regressions', () => {
    const run = (o: Record<string, string>) =>
      config.calculate({ unit: 'metric', sex: 'male', age: '30', weight: '80', heightCm: '180', heightFt: '', heightIn: '', activityLevel: '1.55', bodyFatPct: '', ...o });

    it('30 y male, 180 lb, 5ft10, x1.55: Mifflin 1,783, Harris-Benedict (1984) 1,865, TDEE 2,763; TEF 276, EAT 276, NEAT 428', () => {
      const r = config.calculate({ unit: 'imperial', sex: 'male', age: '30', weight: '180', heightFt: '5', heightIn: '10', heightCm: '', activityLevel: '1.55', bodyFatPct: '' });
      expect(getValue(r, 'mifflinBMR')).toBe('1,783 kcal/day');
      expect(getValue(r, 'harrisBMR')).toBe('1,865 kcal/day');
      expect(getValue(r, 'tdee')).toBe('2,763 kcal/day');
      expect(getValue(r, 'bmrBreakdown')).toBe('BMR: 1,783 · TEF: 276 · EAT: 276 · NEAT: 428 kcal/day');
      // macros: protein 1 g/lb (2.2 g/kg) = 180 g, fat 25% of TDEE = 77 g, carbs = remainder = 338 g
      expect(getValue(r, 'macrosCombined')).toBe('Protein: 180g · Fat: 77g · Carbs: 338g');
    });

    it('Harris-Benedict female constants (447.593 / 9.247 / 3.098 / 4.330): 65 kg, 165 cm, 30 y = 1,430; Mifflin = 1,370', () => {
      const r = run({ sex: 'female', weight: '65', heightCm: '165' });
      expect(getValue(r, 'harrisBMR')).toBe('1,430 kcal/day');
      expect(getValue(r, 'mifflinBMR')).toBe('1,370 kcal/day');
    });

    it('activity factors 1.2 / 1.375 / 1.55 / 1.725 / 1.9 multiply a 1,780 kcal BMR (80 kg, 180 cm, 30 y male)', () => {
      const tdee = (f: string) => getValue(run({ activityLevel: f }), 'tdee');
      expect(tdee('1.2')).toBe('2,136 kcal/day');
      expect(tdee('1.375')).toBe('2,448 kcal/day'); // 2447.5
      expect(tdee('1.55')).toBe('2,759 kcal/day');
      expect(tdee('1.725')).toBe('3,071 kcal/day'); // 3070.5
      expect(tdee('1.9')).toBe('3,382 kcal/day');
    });

    it('Katch-McArdle: 80 kg at 15% fat = 370 + 21.6 x 68 = 1,839; TDEE x1.55 = 2,850, and it is the formula used', () => {
      const r = run({ bodyFatPct: '15' });
      expect(getValue(r, 'formulaLabel')).toBe('Katch-McArdle');
      expect(getValue(r, 'katchBMR')).toBe('1,839 kcal/day');
      expect(getValue(r, 'tdee')).toBe('2,850 kcal/day');
    });

    it('worked examples: Sarah BMR 1,370 x 1.55 = 2,124 (cut 1,624); Mark 1,730 x 1.375 = 2,379 and x 1.55 = 2,682 (+303)', () => {
      const sarah = run({ sex: 'female', weight: '65', heightCm: '165', activityLevel: '1.55' }); // BMR 1370.25
      expect(getValue(sarah, 'tdee')).toBe('2,124 kcal/day');
      expect(getValue(sarah, 'calorieTargets')).toContain('Cut (-500 deficit, ~1 lb/wk): 1,624');
      expect(Math.round(1730 * 1.375)).toBe(2379);
      expect(Math.round(1730 * 1.55)).toBe(2682);
      expect(Math.round(1730 * 1.55) - Math.round(1730 * 1.375)).toBe(303);
    });

    it('a 500 kcal deficit below the safe minimum is flagged (TDEE 1,112 -> cut 612 < 1,200 for women)', () => {
      const r = run({ sex: 'female', age: '50', weight: '40', heightCm: '150', activityLevel: '1.2' }); // BMR 926.5
      expect(getValue(r, 'tdee')).toBe('1,112 kcal/day');
      expect(getValue(r, 'calorieTargets')).toContain('(below safe minimum)');
      expect(getResult(r, 'tdee').interpretation).toContain('below the 1,200 kcal safe minimum');
      expect(getValue(r, '_extremeLoss')).toMatch(/^Not recommended/);
    });

    it('a normal cut is not flagged', () => {
      expect(getValue(run({}), 'calorieTargets')).not.toContain('below safe minimum');
    });

    it('explanation example: BMR 1,783 x 1.55 = 2,763 ("about 2,760")', () => {
      expect(Math.round(1782.72 * 1.55)).toBe(2763);
      expect(config.educational!.explanation).toContain('about 2,760 calories');
    });

    it('activity-factor BMR share quoted in the text is 1/factor: 83% sedentary to 53% athlete', () => {
      expect(Math.round(100 / 1.2)).toBe(83);
      expect(Math.round(100 / 1.9)).toBe(53);
    });

    it('explainSteps and calculate agree, and bounds are realistic for both unit systems', () => {
      const v = { unit: 'imperial', sex: 'male', age: '30', weight: '180', heightFt: '5', heightIn: '10', heightCm: '', activityLevel: '1.55', bodyFatPct: '' };
      const steps = config.explainSteps!(v);
      expect(steps[steps.length - 1].expr).toContain('2,763');
      const f = (id: string) => config.inputs.find((i) => i.id === id)!;
      expect(f('weight').max).toBeGreaterThanOrEqual(1000);
      expect(f('heightCm').max).toBeLessThanOrEqual(275);
      expect(f('heightCm').min).toBeGreaterThan(0);
    });
  });
});
