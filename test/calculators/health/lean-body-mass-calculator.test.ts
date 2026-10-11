import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/lean-body-mass/index';
import { getValue, getResult } from '../../helpers';

describe('Lean Body Mass calculator', () => {
  it('calculates all three formulas for male metric', () => {
    const r = config.calculate({
      unit: 'metric',
      sex: 'male',
      weight: '80',
      heightFt: '',
      heightIn: '',
      heightCm: '180',
    });
    expect(getValue(r, 'boer')).toContain('kg');
    expect(getValue(r, 'james')).toContain('kg');
    expect(getValue(r, 'hume')).toContain('kg');
    const avg = parseFloat(getValue(r, 'avgLBM'));
    expect(avg).toBeGreaterThan(50);
    expect(avg).toBeLessThan(75);
  });

  it('calculates for female imperial', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'female',
      weight: '140',
      heightFt: '5',
      heightIn: '5',
      heightCm: '',
    });
    const avg = parseFloat(getValue(r, 'avgLBM'));
    expect(avg).toBeGreaterThan(80);
    expect(avg).toBeLessThan(130);
  });

  it('returns lean mass percentage', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'male', weight: '80',
      heightFt: '', heightIn: '', heightCm: '180',
    });
    const pct = parseFloat(getValue(r, 'lbmPct'));
    expect(pct).toBeGreaterThan(50);
    expect(pct).toBeLessThan(90);
  });

  it('returns estimated fat mass', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'male', weight: '80',
      heightFt: '', heightIn: '', heightCm: '180',
    });
    expect(getValue(r, 'estimatedFatMass')).toContain('kg');
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'male', weight: '0',
      heightFt: '', heightIn: '', heightCm: '0',
    });
    expect(r).toEqual([]);
  });
  // ── Audit regressions: Boer 1984 / James 1976 / Hume 1966 coefficients recomputed independently ──
  const metric = (sex: string, w: string, h: string) => ({ unit: 'metric', sex, weight: w, heightCm: h, heightFt: '', heightIn: '' });

  it('male 80 kg / 180 cm: Boer 61.42, James 62.72, Hume 57.79, average 60.64 kg, fat 24.2%', () => {
    const r = config.calculate(metric('male', '80', '180'));
    expect(getValue(r, 'boer')).toBe('61.4 kg');
    expect(getValue(r, 'james')).toBe('62.7 kg');
    expect(getValue(r, 'hume')).toBe('57.8 kg');
    expect(getValue(r, 'avgLBM')).toBe('60.6 kg');
    expect(getValue(r, 'estimatedFatMass')).toBe('19.4 kg (24.2%)');
  });

  it('female 60 kg / 165 cm: Boer 44.87, James 44.63, Hume 43.44, average 44.31 kg', () => {
    const r = config.calculate(metric('female', '60', '165'));
    expect(getValue(r, 'boer')).toBe('44.9 kg');
    expect(getValue(r, 'james')).toBe('44.6 kg');
    expect(getValue(r, 'hume')).toBe('43.4 kg');
    expect(getValue(r, 'avgLBM')).toBe('44.3 kg');
  });

  it('imperial 170 lb, 5 ft 10 in: 77.11 kg / 177.8 cm -> average 58.83 kg = 129.7 lb', () => {
    const r = config.calculate({ unit: 'imperial', sex: 'male', weight: '170', heightFt: '5', heightIn: '10', heightCm: '' });
    expect(getValue(r, 'avgLBM')).toBe('129.7 lbs');
    expect(getValue(r, 'boer')).toBe('131.5 lbs');
  });

  it('James goes negative at very high BMI (300 kg / 160 cm: -120 kg raw) -> clamped to 0, average 89.6 kg', () => {
    const r = config.calculate(metric('male', '300', '160'));
    expect(getValue(r, 'james')).toBe('0.0 kg');
    expect(getValue(r, 'avgLBM')).toBe('89.6 kg'); // (145.62 + 0 + 123.18) / 3
    expect(getResult(r, 'avgLBM').interpretation).toContain('James formula is unreliable');
    // normal BMI: no warning
    expect(getResult(config.calculate(metric('male', '80', '180')), 'avgLBM').interpretation).not.toContain('James formula is unreliable');
  });

  it('worked example arithmetic: 180 lb at 15% fat = 27 lb fat, 153 lb lean; +10 lb muscle keeps 27 lb fat = 14.2% of 190', () => {
    expect(180 * 0.15).toBeCloseTo(27, 10);
    expect(27 / 190).toBeCloseTo(0.142, 3);
    expect(config.educational!.explanation).toContain('~14% body fat');
  });

  it('input bounds are realistic and imperial/metric fields are shown per unit', () => {
    const f = (id: string) => config.inputs.find((i) => i.id === id)!;
    expect(f('weight').max).toBeGreaterThanOrEqual(1000);
    expect(f('heightCm').max).toBeLessThanOrEqual(275);
    expect(f('heightCm').min).toBeGreaterThan(0);
    expect(f('heightFt').showWhen!({ unit: 'metric' })).toBe(false);
    expect(f('heightCm').showWhen!({ unit: 'metric' })).toBe(true);
  });
});
