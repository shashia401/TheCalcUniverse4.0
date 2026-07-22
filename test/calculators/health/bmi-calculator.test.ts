import { describe, it, expect } from 'vitest';
import bmiConfig from '../../../src/calculators/health/bmi/index';

describe('BMI Calculator', () => {
  const find = (r: ReturnType<typeof bmiConfig.calculate>, id: string) => r.find(x => x.id === id)?.value ?? '';

  it('calculates BMI for imperial units', () => {
    const r = bmiConfig.calculate({ unit: 'imperial', weight: '170', heightFt: '5', heightIn: '10', sex: 'male' });
    expect(find(r, 'bmiScore')).toBeTruthy();
  });

  it('calculates BMI for metric units', () => {
    const r = bmiConfig.calculate({ unit: 'metric', weight: '70', heightCm: '175', sex: 'female' });
    expect(parseFloat(find(r, 'bmiScore'))).toBeCloseTo(22.86, 1);
  });

  it('shows BMI category', () => {
    const r = bmiConfig.calculate({ unit: 'metric', weight: '70', heightCm: '175', sex: 'female' });
    expect(find(r, 'classification')).toBe('Normal weight');
  });

  it('returns empty for zero height', () => {
    const r = bmiConfig.calculate({ unit: 'metric', weight: '70', heightCm: '0', sex: 'female' });
    expect(r).toEqual([]);
  });
});
