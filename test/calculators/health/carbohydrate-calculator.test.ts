import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/carbohydrate/index';
import { getValue } from '../../helpers';

describe('Carbohydrate calculator', () => {
  it('calculates carb range for moderate exercise (metric)', () => {
    const r = config.calculate({
      unit: 'metric',
      weight: '80',
      bodyFatPct: '',
      goal: 'moderate',
      eventDate: '',
    });
    const range = getValue(r, 'dailyCarbRange');
    expect(range).toContain('g/day');
    // 80 kg × 5 g/kg = 400g min
    expect(range).toContain('400');
    expect(getValue(r, 'goalLabel')).toContain('Moderate');
  });

  it('calculates higher range for endurance goal compared to moderate', () => {
    const rMod = config.calculate({
      unit: 'metric', weight: '80', bodyFatPct: '', goal: 'moderate', eventDate: '',
    });
    const rEnd = config.calculate({
      unit: 'metric', weight: '80', bodyFatPct: '', goal: 'endurance', eventDate: '',
    });
    const modMin = parseInt(getValue(rMod, 'dailyCarbRange').match(/(\d+)/)![0]);
    const endMin = parseInt(getValue(rEnd, 'dailyCarbRange').match(/(\d+)/)![0]);
    expect(endMin).toBeGreaterThan(modMin);
  });

  it('calculates lower range for ketosis', () => {
    const r = config.calculate({
      unit: 'metric', weight: '80', bodyFatPct: '', goal: 'ketosis', eventDate: '',
    });
    const range = getValue(r, 'dailyCarbRange');
    const min = parseInt(range.match(/(\d+)/)![0]);
    expect(min).toBeLessThan(150);
    // 80 kg × 0.5 g/kg = 40g min
    expect(min).toBe(40);
  });

  it('calculates muscle gain range', () => {
    const r = config.calculate({
      unit: 'metric', weight: '80', bodyFatPct: '', goal: 'muscle', eventDate: '',
    });
    const range = getValue(r, 'dailyCarbRange');
    // 80 kg × 4 g/kg = 320g min
    expect(range).toContain('320');
    expect(getValue(r, 'goalLabel')).toContain('Muscle Gain');
  });

  it('calculates fat loss range', () => {
    const r = config.calculate({
      unit: 'metric', weight: '80', bodyFatPct: '', goal: 'fatLoss', eventDate: '',
    });
    const range = getValue(r, 'dailyCarbRange');
    // 80 kg × 2 g/kg = 160g min
    expect(range).toContain('160');
    expect(getValue(r, 'goalLabel')).toContain('Fat Loss');
  });

  it('converts imperial weight correctly', () => {
    const r = config.calculate({
      unit: 'imperial',
      weight: '176', // 176 lbs ≈ 79.8 kg → ~80 kg
      bodyFatPct: '',
      goal: 'moderate',
      eventDate: '',
    });
    const avgVal = getValue(r, 'dailyAvg');
    // 80 kg × 6 g/kg ≈ 480 g/day
    expect(avgVal).toContain('g/day');
  });

  it('uses lean mass when body fat % is provided', () => {
    const rNoBF = config.calculate({
      unit: 'metric', weight: '100', bodyFatPct: '', goal: 'moderate', eventDate: '',
    });
    const rWithBF = config.calculate({
      unit: 'metric', weight: '100', bodyFatPct: '20', goal: 'moderate', eventDate: '',
    });
    // With 20% body fat, lean mass = 80 kg → lower carb target than 100 kg
    const noBFMin = parseInt(getValue(rNoBF, 'dailyCarbRange').match(/(\d+)/)![0]);
    const withBFMin = parseInt(getValue(rWithBF, 'dailyCarbRange').match(/(\d+)/)![0]);
    expect(withBFMin).toBeLessThan(noBFMin);
    // The range label (not value) should mention lean mass
    expect(rWithBF.find((x) => x.id === 'dailyCarbRange')?.label).toContain('lean mass');
  });

  it('shows glycogen loading with event date', () => {
    const r = config.calculate({
      unit: 'imperial',
      weight: '176',
      bodyFatPct: '',
      goal: 'endurance',
      eventDate: '2026-09-15',
    });
    expect(getValue(r, 'glycogenLoading')).toContain('Consume');
  });

  it('does not show glycogen loading with invalid event date', () => {
    const r = config.calculate({
      unit: 'metric',
      weight: '80',
      bodyFatPct: '',
      goal: 'endurance',
      eventDate: 'not-a-date',
    });
    expect(r.find((x) => x.id === 'glycogenLoading')).toBeUndefined();
  });

  it('returns food equivalents', () => {
    const r = config.calculate({
      unit: 'metric', weight: '70', bodyFatPct: '', goal: 'moderate', eventDate: '',
    });
    const food = getValue(r, 'foodEquivalents');
    expect(food).toContain('cups');
    expect(food).toContain('bread');
    expect(food).toContain('bananas');
    expect(food).toContain('pasta');
  });

  it('returns empty array for zero weight', () => {
    const r = config.calculate({
      unit: 'metric', weight: '0', bodyFatPct: '', goal: 'moderate', eventDate: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for negative weight', () => {
    const r = config.calculate({
      unit: 'metric', weight: '-10', bodyFatPct: '', goal: 'moderate', eventDate: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for NaN weight', () => {
    const r = config.calculate({
      unit: 'metric', weight: 'abc', bodyFatPct: '', goal: 'moderate', eventDate: '',
    });
    expect(r).toEqual([]);
  });

  it('returns results with default goal when goal is missing', () => {
    const r = config.calculate({
      unit: 'metric', weight: '80', bodyFatPct: '', goal: '', eventDate: '',
    });
    expect(r.length).toBeGreaterThan(0);
    expect(getValue(r, 'goalLabel')).toContain('Moderate');
  });

  it('returns average daily target with kcal', () => {
    const r = config.calculate({
      unit: 'metric', weight: '70', bodyFatPct: '', goal: 'moderate', eventDate: '',
    });
    const avg = getValue(r, 'dailyAvg');
    expect(avg).toContain('g/day');
    expect(avg).toContain('kcal');
  });

  it('calculates correct carb calories (4 kcal per gram)', () => {
    const r = config.calculate({
      unit: 'metric', weight: '100', bodyFatPct: '', goal: 'moderate', eventDate: '',
    });
    // 100 kg × 6 g/kg ≈ 600 g/day avg → 2400 kcal
    const avg = getValue(r, 'dailyAvg');
    expect(avg).toContain('2,400 kcal');
  });

  it('handles body fat of zero', () => {
    const r = config.calculate({
      unit: 'metric', weight: '80', bodyFatPct: '0', goal: 'moderate', eventDate: '',
    });
    // Body fat 0 shouldn't use lean mass calculation (it means not provided)
    expect(getValue(r, 'dailyCarbRange')).not.toContain('lean mass');
  });

  it('handles very high body weight', () => {
    const r = config.calculate({
      unit: 'metric', weight: '200', bodyFatPct: '', goal: 'endurance', eventDate: '',
    });
    // 200 kg × 7 g/kg = 1400g min (formatted as "1,400")
    const range = getValue(r, 'dailyCarbRange');
    const min = parseInt(range.replace(/,/g, '').match(/(\d+)/)![0]);
    expect(min).toBeGreaterThanOrEqual(1400);
  });
});
