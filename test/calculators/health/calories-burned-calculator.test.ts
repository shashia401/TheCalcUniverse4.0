import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/calories-burned/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Calories Burned calculator', () => {
  it('calculates calories for running 6 mph (170 lbs, 30 min)', () => {
    const r = config.calculate({
      unit: 'imperial',
      weight: '170',
      activity: 'run_6mph',
      duration: '30',
    });
    const cals = parseNumber(getValue(r, 'caloriesBurned'));
    // 170 lb = 77.11 kg. 9.8 MET × 77.11 kg × 0.5 hr = 377.8 kcal
    near(cals, 378, 10);
  });

  it('calculates calories for walking 3 mph (metric, 70 kg, 60 min)', () => {
    const r = config.calculate({
      unit: 'metric',
      weight: '70',
      activity: 'walk_mod',
      duration: '60',
    });
    const cals = parseNumber(getValue(r, 'caloriesBurned'));
    // 3.3 MET × 70 kg × 1 hr = 231 kcal
    near(cals, 231, 10);
  });

  it('calculates calories for cycling 12-14 mph (imperial, 155 lbs, 45 min)', () => {
    const r = config.calculate({
      unit: 'imperial',
      weight: '155',
      activity: 'cycle_fast',
      duration: '45',
    });
    const cals = parseNumber(getValue(r, 'caloriesBurned'));
    // 155 lb = 70.3 kg. 8.0 MET × 70.3 kg × 0.75 hr = 421.8 kcal
    near(cals, 422, 10);
  });

  it('shows MET value in results', () => {
    const r = config.calculate({
      unit: 'metric',
      weight: '70',
      activity: 'walk_fast',
      duration: '30',
    });
    expect(getValue(r, 'metValue')).toContain('MET');
  });

  it('shows formula line with MET x weight x hours', () => {
    const r = config.calculate({
      unit: 'metric',
      weight: '70',
      activity: 'cycle_mod',
      duration: '45',
    });
    expect(getValue(r, 'formulaLine')).toContain('MET');
    expect(getValue(r, 'formulaLine')).toContain('kcal');
  });

  it('shows calories per minute', () => {
    const r = config.calculate({
      unit: 'metric',
      weight: '80',
      activity: 'run_7mph',
      duration: '60',
    });
    expect(getValue(r, 'calPerMin')).toContain('kcal/min');
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

  it('returns empty array for zero weight', () => {
    const r = config.calculate({
      unit: 'metric',
      weight: '0',
      activity: 'run_6mph',
      duration: '30',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for zero duration', () => {
    const r = config.calculate({
      unit: 'metric',
      weight: '70',
      activity: 'run_6mph',
      duration: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for negative weight', () => {
    const r = config.calculate({
      unit: 'metric',
      weight: '-10',
      activity: 'run_6mph',
      duration: '30',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for missing weight value', () => {
    const r = config.calculate({
      unit: 'metric',
      weight: '',
      activity: 'run_6mph',
      duration: '30',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for missing duration value', () => {
    const r = config.calculate({
      unit: 'imperial',
      weight: '170',
      activity: 'run_6mph',
      duration: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for unknown activity', () => {
    const r = config.calculate({
      unit: 'metric',
      weight: '70',
      activity: 'nonexistent_activity',
      duration: '30',
    });
    expect(r).toEqual([]);
  });

  it('handles metric weight correctly (no conversion needed)', () => {
    const r = config.calculate({
      unit: 'metric',
      weight: '100',
      activity: 'run_6mph',
      duration: '60',
    });
    const cals = parseNumber(getValue(r, 'caloriesBurned'));
    // 9.8 MET × 100 kg × 1 hr = 980 kcal
    near(cals, 980, 15);
  });

  it('handles weight with decimal values', () => {
    const r = config.calculate({
      unit: 'metric',
      weight: '70.5',
      activity: 'walk_slow',
      duration: '30',
    });
    // 2.8 MET × 70.5 kg × 0.5 hr = 98.7 kcal
    const cals = parseNumber(getValue(r, 'caloriesBurned'));
    near(cals, 99, 5);
  });

  it('swimming vigorous laps burns more than leisurely swimming', () => {
    const vigor = config.calculate({
      unit: 'metric',
      weight: '70',
      activity: 'swim_vig',
      duration: '30',
    });
    const leisure = config.calculate({
      unit: 'metric',
      weight: '70',
      activity: 'swim_leisure',
      duration: '30',
    });
    const vigCals = parseNumber(getValue(vigor, 'caloriesBurned'));
    const leisCals = parseNumber(getValue(leisure, 'caloriesBurned'));
    expect(vigCals).toBeGreaterThan(leisCals);
  });

  it('heavier person burns more calories for same activity', () => {
    const heavy = config.calculate({
      unit: 'metric',
      weight: '100',
      activity: 'run_6mph',
      duration: '30',
    });
    const light = config.calculate({
      unit: 'metric',
      weight: '50',
      activity: 'run_6mph',
      duration: '30',
    });
    const heavyCals = parseNumber(getValue(heavy, 'caloriesBurned'));
    const lightCals = parseNumber(getValue(light, 'caloriesBurned'));
    expect(heavyCals).toBeGreaterThan(lightCals);
  });

  it('calories burned is proportional to duration', () => {
    const short = config.calculate({
      unit: 'metric',
      weight: '70',
      activity: 'cycle_mod',
      duration: '30',
    });
    const long = config.calculate({
      unit: 'metric',
      weight: '70',
      activity: 'cycle_mod',
      duration: '60',
    });
    const shortCals = parseNumber(getValue(short, 'caloriesBurned'));
    const longCals = parseNumber(getValue(long, 'caloriesBurned'));
    // Double duration should roughly double calories
    const ratio = longCals / shortCals;
    expect(ratio).toBeGreaterThan(1.9);
    expect(ratio).toBeLessThan(2.1);
  });

  it('has educational content with formula', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.formula).toContain('MET');
  });

  it('has FAQ section with multiple questions', () => {
    expect(config.educational.faqs).toBeDefined();
    expect(config.educational.faqs.length).toBeGreaterThanOrEqual(5);
  });

  it('has worked examples', () => {
    expect(config.educational.workedExamples).toBeDefined();
    expect(config.educational.workedExamples.length).toBeGreaterThanOrEqual(3);
  });

  it('has pro tips', () => {
    expect(config.educational.proTips).toBeDefined();
    expect(config.educational.proTips.length).toBeGreaterThanOrEqual(4);
  });

  it('has variables defined', () => {
    expect(config.educational.variables).toBeDefined();
    expect(config.educational.variables.length).toBeGreaterThanOrEqual(3);
  });
});
