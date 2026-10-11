import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/protein/index';
import { getValue } from '../../helpers';

describe('Protein calculator', () => {
  it('calculates protein range for muscle gain', () => {
    const r = config.calculate({
      unit: 'metric',
      weight: '80',
      age: '30',
      heightFt: '',
      heightIn: '',
      heightCm: '180',
      goal: 'bulk',
      trainingFrequency: 'moderate',
    });
    const range = getValue(r, 'dailyProteinRange');
    expect(range).toContain('g/day');
    expect(parseInt(getValue(r, 'dailyTarget'))).toBeGreaterThan(100);
  });

  it('calculates lower range for maintenance', () => {
    const r = config.calculate({
      unit: 'imperial',
      weight: '170',
      age: '30',
      heightFt: '5',
      heightIn: '10',
      heightCm: '',
      goal: 'maintain',
      trainingFrequency: 'none',
    });
    const target = parseInt(getValue(r, 'dailyTarget'));
    expect(target).toBeGreaterThan(70);
    expect(target).toBeLessThan(180);
  });

  it('returns per-meal breakdown', () => {
    const r = config.calculate({
      unit: 'metric', weight: '80', age: '30',
      heightFt: '', heightIn: '', heightCm: '180',
      goal: 'bulk', trainingFrequency: 'heavy',
    });
    expect(getValue(r, 'perMeal')).toContain('g');
  });

  it('returns MPS optimal schedule', () => {
    const r = config.calculate({
      unit: 'metric', weight: '80', age: '30',
      heightFt: '', heightIn: '', heightCm: '180',
      goal: 'bulk', trainingFrequency: 'moderate',
    });
    expect(getValue(r, 'mpsOptimal')).toContain('meals');
  });

  it('returns food equivalents', () => {
    const r = config.calculate({
      unit: 'imperial', weight: '176', age: '30',
      heightFt: '5', heightIn: '10', heightCm: '',
      goal: 'cut', trainingFrequency: 'moderate',
    });
    expect(getValue(r, 'foodEquivalents')).toContain('chicken');
  });

  it('returns empty for invalid inputs', () => {
    const r = config.calculate({
      unit: 'metric', weight: '0', age: '30',
      heightFt: '', heightIn: '', heightCm: '',
      goal: 'maintain', trainingFrequency: 'none',
    });
    expect(r).toEqual([]);
  });
});

// ── Edge-input regression: no NaN / Infinity / ∞ in any output ──
const noGarbage = (r: unknown) => expect(JSON.stringify(r)).not.toMatch(/NaN|Infinity|∞/);

describe('edge inputs: tiny body weight', () => {
  it.each(['metric', 'imperial'])('%s 0.0001 returns [] (no 0-0 g/day)', (unit) => {
    expect(config.calculate({ unit, weight: '0.0001', goal: 'maintain', trainingFrequency: 'moderate' })).toEqual([]);
  });
  it('normal weight unchanged', () => {
    const r = config.calculate({ unit: 'metric', weight: '70', goal: 'maintain', trainingFrequency: 'moderate' });
    noGarbage(r);
    expect(getValue(r, 'dailyProteinRange')).not.toMatch(/^0–0/);
  });
});
