import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/calories-burned/index';
import { getValue } from '../../helpers';

describe('Calories Burned (MET) calculator', () => {
  it('calculates calories for running', () => {
    const r = config.calculate({
      unit: 'imperial',
      weight: '170',
      activity: 'run_6mph',
      duration: '30',
    });
    const cals = parseInt(getValue(r, 'caloriesBurned'));
    expect(cals).toBeGreaterThan(200);
    expect(cals).toBeLessThan(500);
  });

  it('shows MET value', () => {
    const r = config.calculate({
      unit: 'metric',
      weight: '70',
      activity: 'walk_fast',
      duration: '30',
    });
    expect(getValue(r, 'metValue')).toContain('MET');
  });

  it('shows formula line', () => {
    const r = config.calculate({
      unit: 'metric',
      weight: '70',
      activity: 'cycle_mod',
      duration: '45',
    });
    expect(getValue(r, 'formulaLine')).toContain('MET');
  });

  it('shows activity label', () => {
    const r = config.calculate({
      unit: 'imperial',
      weight: '150',
      activity: 'swim_vig',
      duration: '20',
    });
    expect(getValue(r, 'activityLabel')).toBeTruthy();
  });

  it('returns calories per minute', () => {
    const r = config.calculate({
      unit: 'metric',
      weight: '80',
      activity: 'run_7mph',
      duration: '60',
    });
    expect(getValue(r, 'calPerMin')).toContain('kcal/min');
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      unit: 'metric', weight: '0', activity: 'run_6mph', duration: '30',
    });
    expect(r).toEqual([]);
  });
});
