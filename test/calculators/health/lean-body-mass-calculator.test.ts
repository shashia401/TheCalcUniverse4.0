import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/lean-body-mass/index';
import { getValue } from '../../helpers';

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
});
