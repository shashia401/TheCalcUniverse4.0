import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/fat-intake/index';
import { getValue } from '../../helpers';

describe('Fat Intake calculator', () => {
  it('calculates total fat range for maintenance goal', () => {
    const r = config.calculate({
      unit: 'metric', weight: '70', goal: 'maintain', calories: '2200',
    });
    const total = getValue(r, 'totalFatRange');
    expect(total).toContain('g/day');
    expect(total).toContain('% of calories');
    expect(getValue(r, 'totalFatTarget')).toBeTruthy();
  });

  it('adjusts fat percentage range for keto goal (65-80%)', () => {
    const r = config.calculate({
      unit: 'imperial', weight: '170', goal: 'keto', calories: '2200',
    });
    const total = getValue(r, 'totalFatRange');
    expect(total).toContain('65');
    expect(total).toContain('80');
  });

  it('adjusts fat percentage for weight loss goal (20-25%)', () => {
    const r = config.calculate({
      unit: 'metric', weight: '80', goal: 'loss', calories: '1800',
    });
    const total = getValue(r, 'totalFatRange');
    expect(total).toContain('20');
    expect(total).toContain('25');
  });

  it('returns saturated fat AHA limit with ≤ symbol', () => {
    const r = config.calculate({
      unit: 'metric', weight: '70', goal: 'maintain', calories: '2000',
    });
    const sat = getValue(r, 'saturatedFat');
    expect(sat).toContain('g/day');
    expect(sat).toContain('≤');
  });

  it('returns monounsaturated and polyunsaturated fat breakdown', () => {
    const r = config.calculate({
      unit: 'metric', weight: '70', goal: 'heart', calories: '2000',
    });
    expect(getValue(r, 'monounsaturatedFat')).toContain('g/day');
    expect(getValue(r, 'polyunsaturatedFat')).toContain('g/day');
    expect(getValue(r, 'omega3')).toContain('g/day');
  });

  it('returns fat calorie contribution with percentage', () => {
    const r = config.calculate({
      unit: 'metric', weight: '70', goal: 'maintain', calories: '2500',
    });
    const cal = getValue(r, 'fatCalories');
    expect(cal).toContain('kcal');
    expect(cal).toContain('%');
  });

  it('handles Imperial weight correctly', () => {
    const r = config.calculate({
      unit: 'imperial', weight: '200', goal: 'maintain', calories: '2500',
    });
    expect(getValue(r, 'totalFatTarget')).toContain('g/day');
  });

  it('returns empty array for zero weight', () => {
    const r = config.calculate({
      unit: 'metric', weight: '0', goal: 'maintain', calories: '2200',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for zero calories', () => {
    const r = config.calculate({
      unit: 'metric', weight: '70', goal: 'maintain', calories: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for NaN weight', () => {
    const r = config.calculate({
      unit: 'metric', weight: 'abc', goal: 'maintain', calories: '2200',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for negative calories', () => {
    const r = config.calculate({
      unit: 'metric', weight: '70', goal: 'maintain', calories: '-500',
    });
    expect(r).toEqual([]);
  });

  it('returns empty when both weight and calories invalid', () => {
    const r = config.calculate({
      unit: 'metric', weight: '0', goal: 'maintain', calories: '0',
    });
    expect(r).toEqual([]);
  });

  it('select default maintains sensible fat target at 2200 calories', () => {
    const r = config.calculate({
      unit: 'metric', weight: '75', goal: 'maintain', calories: '2200',
    });
    const target = getValue(r, 'totalFatTarget');
    // Should be ~73g (2200 * 0.3 / 9 ≈ 73)
    expect(target).toContain('g/day');
  });
});
