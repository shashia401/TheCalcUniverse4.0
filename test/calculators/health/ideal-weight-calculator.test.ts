import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/ideal-weight/index';
import { getValue } from '../../helpers';

describe('Ideal Weight calculator', () => {
  it('returns all four formulas for male', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'male',
      heightFt: '5',
      heightIn: '10',
      heightCm: '',
      weight: '',
    });
    expect(getValue(r, 'devine')).toContain('lbs');
    expect(getValue(r, 'robinson')).toContain('lbs');
    expect(getValue(r, 'miller')).toContain('lbs');
    expect(getValue(r, 'hamwi')).toContain('lbs');
    expect(getValue(r, 'avgIdeal')).toContain('lbs');
  });

  it('returns all four formulas for female', () => {
    const r = config.calculate({
      unit: 'metric',
      sex: 'female',
      heightFt: '',
      heightIn: '',
      heightCm: '165',
      weight: '',
    });
    expect(getValue(r, 'devine')).toContain('kg');
    expect(getValue(r, 'robinson')).toContain('kg');
    expect(getValue(r, 'miller')).toContain('kg');
    expect(getValue(r, 'hamwi')).toContain('kg');
  });

  it('shows weight comparison when current weight is provided', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'male',
      heightFt: '5',
      heightIn: '10',
      heightCm: '',
      weight: '180',
    });
    expect(getValue(r, 'weightDiff')).toBeTruthy();
  });

  it('returns healthy BMI range', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'female',
      heightFt: '5',
      heightIn: '5',
      heightCm: '',
      weight: '',
    });
    expect(getValue(r, 'bmiRange')).toContain('lbs');
  });

  it('returns ideal weight range', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'male',
      heightFt: '5',
      heightIn: '10',
      heightCm: '',
      weight: '',
    });
    const range = getValue(r, 'rangeIdeal');
    expect(range).toContain('–');
    expect(range).toContain('lbs');
  });

  it('returns empty for zero height', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'male',
      heightFt: '0',
      heightIn: '0',
      heightCm: '',
      weight: '',
    });
    expect(r).toEqual([]);
  });
});
