import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/water-intake/index';
import { getValue, getResult, parseNumber, near } from '../../helpers';

describe('Water Intake calculator', () => {
  it('calculates daily intake for 170 lbs, sedentary, temperate', () => {
    const r = config.calculate({
      weight: '170',
      unit: 'lbs',
      activityLevel: 'sedentary',
      climate: 'normal',
    });
    // 170 * 0.5 = 85 oz; 85 * 0.0295735 ≈ 2.51 L
    expect(getValue(r, 'liters')).toContain('2.5 liters');
    near(parseNumber(getValue(r, 'liters')), 2.51, 0.05);

    // 85 / 8 = 10.625 → ceil = 11 cups
    expect(getValue(r, 'cups')).toContain('11 cups/day');

    // 2.5137 * 1000 ≈ 2514 mL
    expect(getValue(r, 'ml')).toContain('2514');

    // Base intake should be shown
    expect(getValue(r, 'baseIntake')).toContain('liters');
  });

  it('increases intake with higher activity level', () => {
    const rAthlete = config.calculate({
      weight: '170',
      unit: 'lbs',
      activityLevel: 'athlete',
      climate: 'normal',
    });
    const rSedentary = config.calculate({
      weight: '170',
      unit: 'lbs',
      activityLevel: 'sedentary',
      climate: 'normal',
    });
    // Athlete adds 32 oz → ~3.46 L vs sedentary ~2.51 L
    const athleteLiters = parseNumber(getValue(rAthlete, 'liters'));
    const sedentaryLiters = parseNumber(getValue(rSedentary, 'liters'));
    expect(athleteLiters).toBeGreaterThan(sedentaryLiters);
    near(athleteLiters, 3.46, 0.05);
  });

  it('accepts metric weight input (kg) and converts correctly', () => {
    const r = config.calculate({
      weight: '80',
      unit: 'kg',
      activityLevel: 'sedentary',
      climate: 'normal',
    });
    // 80 kg ≈ 176.37 lbs; 176.37 * 0.5 = 88.18 oz; 88.18 * 0.0295735 ≈ 2.61 L
    near(parseNumber(getValue(r, 'liters')), 2.61, 0.05);
    expect(getValue(r, 'liters')).toBeTruthy();
  });

  it('adds climate modifier for hot environment', () => {
    const r = config.calculate({
      weight: '170',
      unit: 'lbs',
      activityLevel: 'sedentary',
      climate: 'hot',
    });
    // Hot adds 16 oz → 101 oz total → ~2.99 L
    near(parseNumber(getValue(r, 'liters')), 2.99, 0.05);
    expect(parseNumber(getValue(r, 'liters'))).toBeGreaterThan(2.5);
  });

  it('includes all four result items', () => {
    const r = config.calculate({
      weight: '150',
      unit: 'lbs',
      activityLevel: 'light',
      climate: 'normal',
    });
    expect(getValue(r, 'liters')).toBeTruthy();
    expect(getValue(r, 'cups')).toContain('cups/day');
    expect(getValue(r, 'ml')).toContain('mL/day');
    expect(getValue(r, 'baseIntake')).toContain('liters');
    expect(r.filter((x) => !x.id.startsWith('_'))).toHaveLength(4); // underscore ids are panel data
  });

  it('returns empty for zero weight', () => {
    expect(config.calculate({
      weight: '0',
      unit: 'lbs',
      activityLevel: 'sedentary',
      climate: 'normal',
    })).toHaveLength(0);
  });

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });
  // ── Audit regressions: base 0.5 oz/lb, 1 US fl oz = 29.5735 mL, cups of 8 oz rounded up ──
  describe('Audit regressions', () => {
    const run = (o: Record<string, string>) => config.calculate({ weight: '170', unit: 'lbs', activityLevel: 'sedentary', climate: 'normal', ...o });

    it('170 lb sedentary temperate: 85 oz = 2.5 L = 2,514 mL = 11 cups (10.6 rounded up); base 2.5 L', () => {
      const r = run({});
      expect(getValue(r, 'liters')).toBe('2.5 liters (85.0 oz)');
      expect(getValue(r, 'ml')).toBe('2514 mL/day');
      expect(getValue(r, 'cups')).toBe('11 cups/day');
      expect(getValue(r, 'baseIntake')).toBe('2.5 liters');
    });

    it('170 lb, moderate (+16 oz) and hot (+16 oz): 117 oz = 3.46 L = 15 cups', () => {
      const r = run({ activityLevel: 'moderate', climate: 'hot' });
      expect(getValue(r, 'liters')).toBe('3.5 liters (117.0 oz)');
      expect(getValue(r, 'cups')).toBe('15 cups/day'); // 14.6 -> 15
    });

    it('80 kg converts to 176.4 lb: athlete (+32) in extreme heat (+24) = 144.2 oz = 4.26 L; light (+8) + altitude (+16) = 112.2 oz', () => {
      expect(getValue(run({ weight: '80', unit: 'kg', activityLevel: 'athlete', climate: 'extreme' }), 'liters')).toBe('4.3 liters (144.2 oz)');
      expect(getValue(run({ weight: '80', unit: 'kg', activityLevel: 'light', climate: 'altitude' }), 'liters')).toBe('3.3 liters (112.2 oz)');
    });

    it('the text example matches: a 170 lb person needs ~85 oz (2.5 L) at baseline, and 0.5 oz/lb is ~33 mL per kg', () => {
      expect(0.5 * 170).toBe(85);
      expect(Math.round((0.5 * 29.5735) / 0.45359237)).toBe(33);
    });

    it('panel data (_water) carries the true values rather than digits glued from "2.5 liters (85.0 oz)"', () => {
      const d = JSON.parse(getValue(run({}), '_water'));
      expect(d.liters).toBeCloseTo(2.5137, 3);
      expect(d.cups).toBe(11);
      expect(d.ml).toBe(2514);
      expect(d.oz).toBe(85);
    });

    it('weight is bounded for both units and the interpretation quotes the National Academies totals', () => {
      const w = config.inputs.find((i) => i.id === 'weight')!;
      expect(w.min).toBeGreaterThan(0);
      expect(w.max).toBeGreaterThanOrEqual(1000);
      expect(getResult(run({}), 'liters').interpretation).toContain('3.7 L');
    });
  });
});
