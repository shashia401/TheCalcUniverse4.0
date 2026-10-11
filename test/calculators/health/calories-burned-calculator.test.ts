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

  it('matches the worked example for a 155 lb runner at 6 mph for 30 min (regression: narrative previously said 343 kcal, actual formula gives 345)', () => {
    const r = config.calculate({
      unit: 'imperial',
      weight: '155',
      activity: 'run_6mph',
      duration: '30',
    });
    const cals = parseNumber(getValue(r, 'caloriesBurned'));
    expect(cals).toBe(345);
  });

  it('calculates calories for walking 3 mph (metric, 70 kg, 60 min)', () => {
    const r = config.calculate({
      unit: 'metric',
      weight: '70',
      activity: 'walk_mod',
      duration: '60',
    });
    const cals = parseNumber(getValue(r, 'caloriesBurned'));
    // 2011 Compendium 17190 (walking 2.8-3.2 mph, level, moderate pace) = 3.5 MET: 3.5 × 70 kg × 1 hr = 245 kcal
    expect(cals).toBe(245);
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

  // ── Audit regressions: MET values checked against the 2011 Compendium of Physical Activities ──
  // [activity id, Compendium MET, code]. Expected kcal = MET × 70 kg × 1 h.
  it.each([
    ['walk_slow', 2.8, '17152'], ['walk_mod', 3.5, '17190'], ['walk_35', 4.3, '17200'], ['walk_fast', 5.0, '17220'],
    ['run_5mph', 8.3, '12030'], ['run_6mph', 9.8, '12050'], ['run_7mph', 11.0, '12070'], ['run_8mph', 11.8, '12090'],
    ['run_10mph', 14.5, '12120'], ['jogging', 7.0, '12020'],
    ['cycle_leisure', 4.0, '01010'], ['cycle_mod', 6.8, '01020'], ['cycle_fast', 8.0, '01030'], ['cycle_race', 10.0, '01040'],
    ['swim_leisure', 6.0, '18310'], ['swim_mod', 5.8, '18240'], ['swim_vig', 9.8, '18230'], ['surfing', 3.0, '18220'],
    ['basketball', 8.0, '15040'], ['soccer', 10.0, '15605'], ['tennis_singles', 8.0, '15690'], ['tennis_doubles', 6.0, '15680'],
    ['golf_cart', 3.5, '15290'], ['boxing_spar', 7.8, '15120'], ['yoga_hatha', 2.5, '02150'], ['stairmaster', 9.0, '02065'],
    ['shoveling', 5.3, '08195'], ['gardening', 3.8, '08245'], ['cleaning_heavy', 3.5, '05020'],
  ])('%s uses the Compendium MET %f (code %s)', (activity, met) => {
    const r = config.calculate({ unit: 'metric', weight: '70', activity, duration: '60' });
    expect(parseNumber(getValue(r, 'caloriesBurned'))).toBe(Math.round(met * 70));
  });

  it('worked example (Mike): 200 lb walking 3 mph 45 min = 238 kcal; vigorous swimming 20 min = 296 kcal', () => {
    // 200 lb = 90.718 kg ; 3.5 × 90.718 × 0.75 = 238.1 ; 9.8 × 90.718 × (1/3) = 296.3
    const walk = config.calculate({ unit: 'imperial', weight: '200', activity: 'walk_mod', duration: '45' });
    const swim = config.calculate({ unit: 'imperial', weight: '200', activity: 'swim_vig', duration: '20' });
    expect(getValue(walk, 'caloriesBurned')).toBe('238 kcal');
    expect(getValue(swim, 'caloriesBurned')).toBe('296 kcal');
  });

  it('weight range is bounded', () => {
    const w = config.inputs.find((i) => i.id === 'weight')!;
    expect(w.min).toBeGreaterThan(0);
    expect(w.max).toBeDefined();
  });
});
