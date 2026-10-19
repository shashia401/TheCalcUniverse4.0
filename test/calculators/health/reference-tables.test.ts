// B6e: every number in the BMI and TDEE reference tables is pinned to an independent Python
// (fractions.Fraction, exact rational arithmetic, round-half-up) calculation.
import { describe, it, expect } from 'vitest';
import bmi from '../../../src/calculators/health/bmi';
import tdee from '../../../src/calculators/health/tdee';
import { healthyRangeRows } from '../../../src/calculators/health/bmi/weightRanges';
import { activityRows } from '../../../src/calculators/health/tdee/activityTable';
import { getValue } from '../../helpers';

const D = '–'; // en dash
const DOT = '·'; // middle dot

describe('BMI healthy-weight-by-height reference table', () => {
  const python: [string, string][] = [
    ['Healthy weight at 4\'10" (147 cm)', `89 ${D} 119 lb ${DOT} 40.2 ${D} 54.0 kg`],
    ['Healthy weight at 5\'0" (152 cm)', `95 ${D} 127 lb ${DOT} 43.0 ${D} 57.8 kg`],
    ['Healthy weight at 5\'2" (157 cm)', `101 ${D} 136 lb ${DOT} 45.9 ${D} 61.8 kg`],
    ['Healthy weight at 5\'4" (163 cm)', `108 ${D} 145 lb ${DOT} 48.9 ${D} 65.8 kg`],
    ['Healthy weight at 5\'6" (168 cm)', `115 ${D} 154 lb ${DOT} 52.0 ${D} 70.0 kg`],
    ['Healthy weight at 5\'8" (173 cm)', `122 ${D} 164 lb ${DOT} 55.2 ${D} 74.3 kg`],
    ['Healthy weight at 5\'10" (178 cm)', `129 ${D} 174 lb ${DOT} 58.5 ${D} 78.7 kg`],
    ['Healthy weight at 6\'0" (183 cm)', `136 ${D} 184 lb ${DOT} 61.9 ${D} 83.3 kg`],
    ['Healthy weight at 6\'2" (188 cm)', `144 ${D} 194 lb ${DOT} 65.4 ${D} 88.0 kg`],
    ['Healthy weight at 6\'4" (193 cm)', `152 ${D} 205 lb ${DOT} 68.9 ${D} 92.8 kg`],
  ];

  it('matches the Python reference for all ten heights', () => {
    expect(healthyRangeRows().map((r) => [r.label, r.value])).toEqual(python);
  });

  it('is published in the educational quick reference', () => {
    const labels = bmi.educational!.quickReference!.map((r) => r.label);
    for (const [label] of python) expect(labels).toContain(label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('agrees with the calculator itself at 5\'10" (imperial 170 lb, metric 177.8 cm)', () => {
    const r = bmi.calculate({ unit: 'imperial', sex: 'male', weight: '170', heightFt: '5', heightIn: '10' });
    expect(getValue(r, 'normalRange')).toBe(`129 ${D} 174 lbs`);
    const m = bmi.calculate({ unit: 'metric', sex: 'male', weight: '70', heightCm: '177.8' });
    expect(getValue(m, 'normalRange')).toBe(`58.5 ${D} 78.7 kg`);
  });
});

describe('TDEE activity-multiplier reference table', () => {
  // Python: BMR = 10*(170*0.45359237) + 6.25*(70*2.54) - 5*30 + 5 = 1737.357029 -> 1,737
  const python: [string, string][] = [
    ['Sedentary (desk job)', 'TDEE = BMR × 1.2 = 2,085 kcal/day'],
    ['Light Exercise (1-2 days/wk)', 'TDEE = BMR × 1.375 = 2,389 kcal/day'],
    ['Moderate Exercise (3-5 days/wk)', 'TDEE = BMR × 1.55 = 2,693 kcal/day'],
    ['Heavy Exercise (6-7 days/wk)', 'TDEE = BMR × 1.725 = 2,997 kcal/day'],
    ['Athlete (2x/day)', 'TDEE = BMR × 1.9 = 3,301 kcal/day'],
    ['Example person (the calculator defaults)', '30-year-old man, 170 lb, 5\'10" — Mifflin-St Jeor BMR 1,737 kcal/day'],
  ];

  it('matches the Python reference', () => {
    expect(activityRows().map((r) => [r.label, r.value])).toEqual(python);
  });

  it('is published in the educational quick reference', () => {
    const rows = tdee.educational!.quickReference!;
    for (const [label, value] of python) expect(rows).toContainEqual({ label, value });
  });

  it('uses the same multipliers as the activity-level input', () => {
    const select = tdee.inputs.find((i) => i.id === 'activityLevel')!;
    expect(select.options!.map((o) => o.value)).toEqual(['1.2', '1.375', '1.55', '1.725', '1.9']);
  });

  it('agrees with the calculator itself for the example person', () => {
    const base = { unit: 'imperial', sex: 'male', age: '30', weight: '170', heightFt: '5', heightIn: '10' };
    const expected: Record<string, string> = { '1.2': '2,085', '1.375': '2,389', '1.55': '2,693', '1.725': '2,997', '1.9': '3,301' };
    for (const [factor, kcal] of Object.entries(expected)) {
      const r = tdee.calculate({ ...base, activityLevel: factor });
      expect(getValue(r, 'tdee')).toBe(`${kcal} kcal/day`);
    }
  });
});
