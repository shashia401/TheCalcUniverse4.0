import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/healthy-weight/index';
import { getValue } from '../../helpers';

describe('Healthy Weight calculator', () => {
  it('calculates healthy weight range with BMI and WHtR', () => {
    const r = config.calculate({
      unit: 'imperial',
      sex: 'male',
      age: '30',
      weight: '180',
      waist: '34',
      heightFt: '5',
      heightIn: '10',
      heightCm: '',
      frameSize: 'medium',
    });
    expect(getValue(r, 'healthyWeightRange')).toContain('lbs');
    expect(getValue(r, 'whtr')).toBeTruthy();
    expect(getValue(r, 'bmi')).toBeTruthy();
  });

  it('adjusts target for frame size', () => {
    const rSmall = config.calculate({
      unit: 'imperial', sex: 'male', age: '30', weight: '180',
      waist: '34', heightFt: '5', heightIn: '10', heightCm: '', frameSize: 'small',
    });
    const rLarge = config.calculate({
      unit: 'imperial', sex: 'male', age: '30', weight: '180',
      waist: '34', heightFt: '5', heightIn: '10', heightCm: '', frameSize: 'large',
    });
    const smallTarget = parseFloat(getValue(rSmall, 'adjustedTarget'));
    const largeTarget = parseFloat(getValue(rLarge, 'adjustedTarget'));
    expect(largeTarget).toBeGreaterThan(smallTarget);
  });

  it('returns WHtR health threshold', () => {
    const r = config.calculate({
      unit: 'metric',
      sex: 'female',
      age: '30',
      weight: '65',
      waist: '75',
      heightFt: '',
      heightIn: '',
      heightCm: '165',
      frameSize: 'medium',
    });
    const whtrVal = parseFloat(getValue(r, 'whtr'));
    expect(whtrVal).toBeGreaterThan(0.3);
    expect(whtrVal).toBeLessThan(0.7);
  });

  it('returns Devine ideal weight reference', () => {
    const r = config.calculate({
      unit: 'imperial', sex: 'male', age: '30', weight: '180',
      waist: '34', heightFt: '5', heightIn: '10', heightCm: '', frameSize: 'medium',
    });
    expect(getValue(r, 'devineIdeal')).toContain('lbs');
  });

  it('returns empty for invalid height', () => {
    const r = config.calculate({
      unit: 'imperial', sex: 'male', age: '30', weight: '180',
      waist: '34', heightFt: '0', heightIn: '0', heightCm: '', frameSize: 'medium',
    });
    expect(r).toEqual([]);
  });
});
