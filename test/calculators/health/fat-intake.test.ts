import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/fat-intake/index';
import { getValue } from '../../helpers';

describe('Fat Intake calculator', () => {
  it('calculates total fat range for maintenance', () => {
    const r = config.calculate({
      unit: 'metric', weight: '70', goal: 'maintain', calories: '2200',
    });
    expect(getValue(r, 'totalFatRange')).toContain('g/day');
    expect(getValue(r, 'totalFatTarget')).toBeTruthy();
  });

  it('adjusts fat percentage for keto goal', () => {
    const r = config.calculate({
      unit: 'imperial', weight: '170', goal: 'keto', calories: '2200',
    });
    const total = getValue(r, 'totalFatRange');
    expect(total).toContain('65');
    expect(total).toContain('80');
  });

  it('returns saturated fat AHA limit', () => {
    const r = config.calculate({
      unit: 'metric', weight: '70', goal: 'maintain', calories: '2000',
    });
    const sat = getValue(r, 'saturatedFat');
    expect(sat).toContain('g/day');
    expect(sat).toContain('≤');
  });

  it('returns mono and poly breakdown', () => {
    const r = config.calculate({
      unit: 'metric', weight: '70', goal: 'heart', calories: '2000',
    });
    expect(getValue(r, 'monounsaturatedFat')).toContain('g/day');
    expect(getValue(r, 'polyunsaturatedFat')).toContain('g/day');
    expect(getValue(r, 'omega3')).toContain('g/day');
  });

  it('returns fat calorie contribution', () => {
    const r = config.calculate({
      unit: 'metric', weight: '70', goal: 'maintain', calories: '2500',
    });
    expect(getValue(r, 'fatCalories')).toContain('kcal');
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      unit: 'metric', weight: '0', goal: 'maintain', calories: '0',
    });
    expect(r).toEqual([]);
  });
});
