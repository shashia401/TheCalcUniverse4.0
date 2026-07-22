import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/overweight/index';
import { getValue } from '../../helpers';

describe('Overweight calculator', () => {
  it('calculates BMI and WHtR', () => {
    const r = config.calculate({
      unit: 'imperial', sex: 'male', age: '40', weight: '200',
      heightFt: '5', heightIn: '10', heightCm: '', waist: '38',
    });
    expect(getValue(r, 'bmiScore')).toContain('Overweight');
    expect(getValue(r, 'whtr')).toContain('Increased risk');
  });

  it('calculates metric inputs', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'female', age: '35', weight: '75',
      heightFt: '', heightIn: '', heightCm: '170', waist: '80',
    });
    const whtr = parseFloat(getValue(r, 'whtr'));
    expect(whtr).toBeGreaterThan(0.3);
    expect(whtr).toBeLessThan(0.7);
  });

  it('returns combined risk assessment', () => {
    const r = config.calculate({
      unit: 'imperial', sex: 'male', age: '50', weight: '240',
      heightFt: '5', heightIn: '10', heightCm: '', waist: '44',
    });
    expect(getValue(r, 'combinedRisk')).toBeTruthy();
  });

  it('returns waist status with threshold', () => {
    const r = config.calculate({
      unit: 'metric', sex: 'female', age: '30', weight: '65',
      heightFt: '', heightIn: '', heightCm: '165', waist: '75',
    });
    expect(getValue(r, 'waistStatus')).toContain('cm');
  });

  it('returns visceral fat context', () => {
    const r = config.calculate({
      unit: 'imperial', sex: 'male', age: '45', weight: '220',
      heightFt: '5', heightIn: '10', heightCm: '', waist: '42',
    });
    expect(getValue(r, 'visceralFatNote')).toBeTruthy();
  });

  it('returns empty for invalid height', () => {
    const r = config.calculate({
      unit: 'imperial', sex: 'male', age: '30', weight: '180',
      heightFt: '0', heightIn: '0', heightCm: '', waist: '34',
    });
    expect(r).toEqual([]);
  });
});
