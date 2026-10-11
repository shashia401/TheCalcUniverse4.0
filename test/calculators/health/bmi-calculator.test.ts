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

  // ── Audit regressions (independent derivations) ──
  it('150 lb at 5\'5\" is BMI 24.96 -> shown as 25.0 -> classified Overweight (label must agree with the number)', () => {
    // 703 x 150 / 65^2 = 105,450 / 4,225 = 24.958 ; one-decimal 25.0 is the WHO/CDC Overweight lower bound
    const r = bmiConfig.calculate({ unit: 'imperial', weight: '150', heightFt: '5', heightIn: '5', sex: 'female' });
    expect(find(r, 'bmiScore')).toBe('25.0');
    expect(find(r, 'classification')).toBe('Overweight');
  });

  it('149 lb at 5\'5\" is BMI 24.79 -> Normal weight', () => {
    // 703 x 149 / 4,225 = 24.79
    const r = bmiConfig.calculate({ unit: 'imperial', weight: '149', heightFt: '5', heightIn: '5', sex: 'female' });
    expect(find(r, 'bmiScore')).toBe('24.8');
    expect(find(r, 'classification')).toBe('Normal weight');
  });

  it('BMI 18.5 and 30.0 boundaries: 18.5 is Normal, 30.0 is Obese (WHO cut-offs are inclusive at the lower edge)', () => {
    // 1.80 m: 18.5 x 3.24 = 59.94 kg ; 30 x 3.24 = 97.2 kg
    expect(find(bmiConfig.calculate({ unit: 'metric', weight: '59.94', heightCm: '180', sex: 'male' }), 'classification')).toBe('Normal weight');
    expect(find(bmiConfig.calculate({ unit: 'metric', weight: '97.2', heightCm: '180', sex: 'male' }), 'classification')).toBe('Obese');
    expect(find(bmiConfig.calculate({ unit: 'metric', weight: '59.7', heightCm: '180', sex: 'male' }), 'classification')).toBe('Underweight');
  });

  it('declared input ranges are realistic and the smallest allowed height never yields a non-positive Devine weight', () => {
    const byId = Object.fromEntries(bmiConfig.inputs.map((i) => [i.id, i]));
    for (const id of ['weight', 'heightFt', 'heightCm']) {
      expect(byId[id].min).toBeGreaterThan(0);
      expect(byId[id].max).toBeDefined();
    }
    // 4 ft = 48 in -> male Devine = 50 + 2.3 x (48 - 60) = 22.4 kg ; female = 45.5 - 27.6 = 17.9 kg
    const m = bmiConfig.calculate({ unit: 'imperial', weight: '100', heightFt: String(byId.heightFt.min), heightIn: '0', sex: 'male' });
    expect(find(m, 'idealWeight')).toContain('49 lbs'); // 22.4 kg = 49.4 lb
    const f = bmiConfig.calculate({ unit: 'imperial', weight: '100', heightFt: '4', heightIn: '0', sex: 'female' });
    expect(find(f, 'idealWeight')).toContain('39 lbs'); // 17.9 kg = 39.5 lb
  });
});
