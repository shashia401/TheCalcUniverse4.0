import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/bmi/index';
import { getValue } from '../../helpers';

describe('BMI calculator', () => {
  it('calculates BMI correctly for metric inputs', () => {
    const r = config.calculate({
      unit: 'metric',
      sex: 'male',
      age: '30',
      weight: '80',
      heightFt: '',
      heightIn: '',
      heightCm: '180',
    });
    const bmi = parseFloat(getValue(r, 'bmiScore'));
    expect(bmi).toBeGreaterThan(20);
    expect(bmi).toBeLessThan(28);
  });

  it('calculates BMI correctly for imperial inputs', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'female',
      age: '25',
      weight: '140',
      heightFt: '5',
      heightIn: '6',
      heightCm: '',
    });
    const bmi = parseFloat(getValue(r, 'bmiScore'));
    expect(bmi).toBeGreaterThan(20);
    expect(bmi).toBeLessThan(28);
  });

  it('returns classification result', () => {
    const r = config.calculate({
      unit: 'metric',
      sex: 'female',
      age: '30',
      weight: '70',
      heightFt: '',
      heightIn: '',
      heightCm: '170',
    });
    const classification = getValue(r, 'classification');
    expect(['Underweight', 'Normal weight', 'Normal Weight', 'Overweight', 'Obese']).toContain(classification);
  });

  it('returns ideal weight and healthy range', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'male',
      age: '35',
      weight: '200',
      heightFt: '6',
      heightIn: '0',
      heightCm: '',
    });
    expect(getValue(r, 'normalRange')).toContain('lbs');
    expect(getValue(r, 'idealWeight')).toContain('lbs');
    expect(getValue(r, 'weightDiff')).toBeTruthy();
  });

  it('returns empty array for missing height', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'male',
      age: '30',
      weight: '170',
      heightFt: '0',
      heightIn: '0',
      heightCm: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for zero weight', () => {
    const r = config.calculate({
      unit: 'metric',
      sex: 'female',
      age: '30',
      weight: '0',
      heightFt: '',
      heightIn: '',
      heightCm: '160',
    });
    expect(r).toEqual([]);
  });
});
