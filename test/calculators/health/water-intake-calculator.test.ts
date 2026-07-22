import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/water-intake/index';
import { getValue, parseNumber, near } from '../../helpers';

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
    expect(r).toHaveLength(4);
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
});
