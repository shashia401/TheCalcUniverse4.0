import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/pregnancy-gain/index';

describe('Pregnancy Weight Gain — projected total gain regression', () => {
  it('projects total gain by extrapolating the actual rate-so-far to week 40, not a lbs/kg-confused IOM-rate formula (previously produced 24 lbs here, which is impossible since 15 lbs were already gained)', () => {
    const r = config.calculate({
      unit: 'imperial',
      prepregnancyWeight: '140',
      currentWeight: '155',
      heightFt: '5',
      heightIn: '5',
      currentWeek: '20',
    });
    const projected = r.find((x) => x.id === 'projectedGain');
    expect(projected?.value).toBe('30 lbs');
  });

  it('matches the worked example for an underweight woman at week 30 (previously produced 53 lbs; correct extrapolation gives 29 lbs)', () => {
    const r = config.calculate({
      unit: 'imperial',
      prepregnancyWeight: '105',
      currentWeight: '127',
      heightFt: '5',
      heightIn: '4',
      currentWeek: '30',
    });
    const projected = r.find((x) => x.id === 'projectedGain');
    expect(projected?.value).toBe('29 lbs');
  });
});

describe('unit', () => {
  it('should export a valid calculator config', () => {
    expect(config).toBeDefined();
    expect(config.inputs).toBeDefined();
    expect(Array.isArray(config.inputs)).toBe(true);
    expect(typeof config.calculate).toBe('function');
  });

  it('should return empty array for empty/invalid inputs', () => {
    const emptyValues: Record<string, string> = {};
    config.inputs.forEach((inp: any) => {
      emptyValues[inp.id] = '';
    });
    const result = config.calculate(emptyValues);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return results for valid demo inputs', () => {
    const demoValues: Record<string, string> = {};
    config.inputs.forEach((inp: any) => {
      if (inp.defaultValue !== undefined) {
        demoValues[inp.id] = String(inp.defaultValue);
      } else if (inp.placeholder) {
        demoValues[inp.id] = inp.placeholder;
      } else if (inp.type === 'select' && inp.options?.length > 0) {
        demoValues[inp.id] = inp.options[0].value;
      } else if (inp.type === 'number') {
        demoValues[inp.id] = '10';
      } else {
        demoValues[inp.id] = 'test';
      }
    });
    const result = config.calculate(demoValues);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('Pregnancy Weight Gain — metric ranges and per-week status', () => {
  const v = (o: Record<string, string>) => config.calculate(o);
  const get = (r: ReturnType<typeof v>, id: string) => r.find((x) => x.id === id)?.value;

  it('metric mode converts the IOM lb ranges to kg (25-35 lbs = 11.3-15.9 kg)', () => {
    const r = v({ unit: 'metric', prepregnancyWeight: '63.5', currentWeight: '70', heightCm: '165', currentWeek: '20' });
    expect(get(r, 'totalRange')).toBe('11.3 kg–15.9 kg');
  });

  it('after week 13 compares gain with the pace (1-4.4 lbs + weekly rate x weeks since 13), not the whole-pregnancy range', () => {
    const base = { unit: 'imperial', prepregnancyWeight: '140', heightFt: '5', heightIn: '5', currentWeek: '20' };
    // normal BMI, week 20: expected 6.6-11.4 lbs
    expect(get(v({ ...base, currentWeight: '155' }), 'gainStatus')).toBe('Above Recommended Range'); // 15 lbs
    expect(get(v({ ...base, currentWeight: '149' }), 'gainStatus')).toBe('Within Recommended Range'); // 9 lbs
    expect(get(v({ ...base, currentWeight: '144' }), 'gainStatus')).toBe('Below Recommended Range'); // 4 lbs
  });

  it('underweight worked example (22 lbs at week 30, expected 18-26.5) is within range', () => {
    const r = v({ unit: 'imperial', prepregnancyWeight: '105', currentWeight: '127', heightFt: '5', heightIn: '4', currentWeek: '30' });
    expect(get(r, 'gainStatus')).toBe('Within Recommended Range');
  });
});
