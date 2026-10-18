import { describe, it, expect } from 'vitest';
import type { CalculatorConfig, ExplainStep } from '../../../src/types/calculator';
import bmr from '../../../src/calculators/health/bmr';
import idealWeight from '../../../src/calculators/health/ideal-weight';
import protein from '../../../src/calculators/health/protein';
import leanBodyMass from '../../../src/calculators/health/lean-body-mass';
import heartRateZones from '../../../src/calculators/health/heart-rate-zones';
import oneRepMax from '../../../src/calculators/health/one-rep-max';
import bsa from '../../../src/calculators/health/bsa';
import waterIntake from '../../../src/calculators/health/water-intake';
import bodyFat from '../../../src/calculators/health/body-fat';
import healthyWeight from '../../../src/calculators/health/healthy-weight';
import { buildDemoValues, getValue } from '../../helpers';

// Intermediate numbers below were computed independently with Python's decimal module (60-digit precision,
// ROUND_HALF_UP), not by running the calculators.

type V = Record<string, string>;
const steps = (c: CalculatorConfig, v: V): ExplainStep[] => c.explainSteps!(v);
// Strip thousands separators so the assertions do not depend on the runner's locale.
const exprs = (c: CalculatorConfig, v: V) => steps(c, v).map((s) => s.expr.replace(/(\d),(?=\d{3})/g, '$1'));

describe('explainSteps - last step equals the displayed result (demo values)', () => {
  const cases: [string, CalculatorConfig, (r: ReturnType<CalculatorConfig['calculate']>) => string[]][] = [
    ['bmr', bmr, (r) => [getValue(r, 'primaryBMR')]],
    ['ideal-weight', idealWeight, (r) => [getValue(r, 'avgIdeal')]],
    ['protein', protein, (r) => [`${getValue(r, 'dailyTarget').split('·')[1].trim()}`]],
    ['lean-body-mass', leanBodyMass, (r) => [getValue(r, 'avgLBM')]],
    ['heart-rate-zones', heartRateZones, (r) => [1, 2, 3, 4, 5].map((n) => getValue(r, `zone${n}`).split(' bpm')[0])],
    ['one-rep-max', oneRepMax, (r) => [getValue(r, 'oneRepMax')]],
    ['bsa', bsa, (r) => [getValue(r, 'avgBsa')]],
    ['water-intake', waterIntake, (r) => [getValue(r, 'liters').split(' liters')[0] + ' liters']],
    ['body-fat', bodyFat, (r) => [getValue(r, 'bodyFatPct')]],
    ['healthy-weight', healthyWeight, (r) => [getValue(r, 'adjustedTarget')]],
  ];
  for (const [name, config, expected] of cases) {
    it(name, () => {
      const v = buildDemoValues(config.inputs);
      const results = config.calculate(v);
      expect(results.length).toBeGreaterThan(0);
      const s = steps(config, v);
      expect(s.length).toBeGreaterThanOrEqual(3);
      expect(s.length).toBeLessThanOrEqual(6);
      const last = s[s.length - 1].expr;
      for (const e of expected(results)) expect(last).toContain(e);
    });
  }

  it('bsa also ends step 2 on the headline Mosteller value', () => {
    const v = buildDemoValues(bsa.inputs);
    expect(steps(bsa, v)[1].expr.endsWith(getValue(bsa.calculate(v), 'bsaMosteller'))).toBe(true);
  });
});

describe('explainSteps - blank, invalid and runaway input never print NaN/Infinity', () => {
  const all: [string, CalculatorConfig][] = [
    ['bmr', bmr], ['ideal-weight', idealWeight], ['protein', protein], ['lean-body-mass', leanBodyMass],
    ['heart-rate-zones', heartRateZones], ['one-rep-max', oneRepMax], ['bsa', bsa], ['water-intake', waterIntake],
    ['body-fat', bodyFat], ['healthy-weight', healthyWeight],
  ];
  for (const [name, config] of all) {
    it(`${name}: empty values -> []`, () => {
      expect(steps(config, {})).toEqual([]);
    });
    it(`${name}: every number field junk -> [] or clean`, () => {
      for (const junk of ['', 'abc', '-1', '0', '1e999']) {
        const v = buildDemoValues(config.inputs);
        for (const i of config.inputs) if (i.type === 'number') v[i.id] = junk;
        const s = steps(config, v);
        if (junk === '' || junk === 'abc' || junk === '0' || junk === '-1') {
          // calculate() rejects these, so there must be no worked solution either
          if (config.calculate(v).length === 0) expect(s).toEqual([]);
        }
        for (const st of s) expect(`${st.label} ${st.expr} ${st.note ?? ''}`).not.toMatch(/NaN|Infinity|undefined/);
      }
    });
    it(`${name}: runaway weight (1e999) -> no NaN/Infinity`, () => {
      const v = buildDemoValues(config.inputs);
      v.weight = '1e999';
      for (const st of steps(config, v)) expect(st.expr).not.toMatch(/NaN|Infinity/);
    });
  }
});

describe('bmr explainSteps', () => {
  const base = { unit: 'imperial', formula: 'mifflin', sex: 'male', age: '30', weight: '170', heightFt: '5', heightIn: '10', heightCm: '', bodyFatPct: '' };
  it('Mifflin-St Jeor, imperial male', () => {
    const e = exprs(bmr, base);
    expect(e).toHaveLength(3);
    expect(e[0]).toContain('170 lb × 0.45359237 = 77.1 kg');
    expect(e[0]).toContain('(5 ft × 12 + 10 in) × 2.54 = 177.8 cm');
    expect(e[1]).toBe('10 × 77.1 + 6.25 × 177.8 − 5 × 30 + 5');
    expect(e[2]).toBe('771.1 + 1111.3 − 150.0 + 5 = 1737 kcal/day');
  });
  it('Harris-Benedict, metric female', () => {
    const e = exprs(bmr, { ...base, unit: 'metric', formula: 'harris', sex: 'female', weight: '65', heightCm: '165', heightFt: '', heightIn: '' });
    expect(e[1]).toBe('447.593 + 9.247 × 65.0 + 3.098 × 165.0 − 4.330 × 30');
    expect(e[2]).toBe('447.593 + 601.1 + 511.2 − 129.9 = 1430 kcal/day');
  });
  it('Katch-McArdle, metric male with body fat', () => {
    const e = exprs(bmr, { ...base, unit: 'metric', formula: 'katch', weight: '80', heightCm: '180', bodyFatPct: '20', heightFt: '', heightIn: '' });
    expect(e[1]).toBe('80.0 kg × (1 − 20/100) = 64.0 kg');
    expect(e[3]).toBe('370 + 1382.4 = 1752 kcal/day');
  });
  it('invalid: Katch without body fat, blank or negative weight', () => {
    expect(steps(bmr, { ...base, formula: 'katch' })).toEqual([]);
    expect(steps(bmr, { ...base, weight: '' })).toEqual([]);
    expect(steps(bmr, { ...base, weight: '-5' })).toEqual([]);
    expect(steps(bmr, { ...base, age: '' })).toEqual([]);
  });
});

describe('ideal-weight explainSteps', () => {
  const base = { unit: 'imperial', sex: 'male', heightFt: '5', heightIn: '10', heightCm: '', weight: '' };
  it('imperial male 5 ft 10 in', () => {
    const e = exprs(idealWeight, base);
    expect(e).toHaveLength(6);
    expect(e[0]).toBe('5 ft 10 in = 70 in → max(0, 70 − 60) = 10 in');
    expect(e[1]).toBe('50 + 2.3 × 10 = 73.0 kg → 161 lbs');
    expect(e[2]).toBe('52 + 1.9 × 10 = 71.0 kg → 157 lbs');
    expect(e[3]).toBe('56.2 + 1.41 × 10 = 70.3 kg → 155 lbs');
    expect(e[4]).toBe('106 + 6 × 10 = 166.0 lb × 0.45359237 = 75.3 kg → 166 lbs');
    expect(e[5]).toBe('(73.0 + 71.0 + 70.3 + 75.3) ÷ 4 = 72.4 kg → 160 lbs');
  });
  it('metric female 165 cm', () => {
    const e = exprs(idealWeight, { unit: 'metric', sex: 'female', heightFt: '', heightIn: '', heightCm: '165', weight: '' });
    expect(e[0]).toBe('165 cm ÷ 2.54 = 64.96 in → max(0, 64.96 − 60) = 4.96 in');
    expect(e[1]).toBe('45.5 + 2.3 × 4.96 = 56.9 kg');
    expect(e[4]).toBe('100 + 5 × 4.96 = 124.8 lb × 0.45359237 = 56.6 kg');
    expect(e[5]).toBe('(56.9 + 57.4 + 59.8 + 56.6) ÷ 4 = 57.7 kg');
  });
  it('below 5 ft holds the formulas at their 5 ft value and says so', () => {
    const s = steps(idealWeight, { ...base, heightFt: '4', heightIn: '11' });
    expect(s[0].note).toMatch(/held at their 5 ft value/);
    expect(s[0].expr).toContain('max(0, 59 − 60) = 0 in');
    expect(s[5].expr).toBe('(50.0 + 52.0 + 56.2 + 48.1) ÷ 4 = 51.6 kg → 114 lbs');
  });
  it('invalid: no height', () => {
    expect(steps(idealWeight, { ...base, heightFt: '', heightIn: '' })).toEqual([]);
    expect(steps(idealWeight, { unit: 'metric', sex: 'male', heightCm: '0' })).toEqual([]);
  });
});

describe('protein explainSteps', () => {
  it('imperial, cut, 3-4 days training', () => {
    const e = exprs(protein, { unit: 'imperial', weight: '170', goal: 'cut', trainingFrequency: 'moderate' });
    expect(e).toHaveLength(5);
    expect(e[0]).toBe('170 lb × 0.45359237 = 77.11 kg');
    expect(e[1]).toBe('77.11 kg × 1.6 = 123 g · 77.11 kg × 2.2 = 170 g');
    expect(e[2]).toBe('1.6 + 0.6 × (0.3 + 0.3 × 0.4) = 1.85 g/kg');
    expect(e[3]).toBe('77.11 kg × 1.85 g/kg ≈ 143 g/day');
    expect(e[4]).toBe('143 g × 4 kcal/g = 572 kcal');
  });
  it('metric, maintain, no training', () => {
    const e = exprs(protein, { unit: 'metric', weight: '70', goal: 'maintain', trainingFrequency: 'none' });
    expect(e[0]).toBe('70 kg');
    expect(e[1]).toBe('70.00 kg × 0.8 = 56 g · 70.00 kg × 1.2 = 84 g');
    expect(e[2]).toBe('0.8 + 0.4 × (0.3 + 0 × 0.4) = 0.92 g/kg');
    expect(e[4]).toBe('64 g × 4 kcal/g = 256 kcal');
  });
  it('invalid: blank, or under the calculator\'s 2.5 kg floor', () => {
    expect(steps(protein, { unit: 'metric', weight: '' })).toEqual([]);
    expect(steps(protein, { unit: 'metric', weight: '2' })).toEqual([]);
  });
});

describe('lean-body-mass explainSteps', () => {
  it('imperial male', () => {
    const v = { unit: 'imperial', sex: 'male', weight: '170', heightFt: '5', heightIn: '10', heightCm: '' };
    const e = exprs(leanBodyMass, v);
    expect(e).toHaveLength(5);
    expect(e[0]).toContain('170 lb × 0.45359237 = 77.1 kg');
    expect(e[0]).toContain('= 177.8 cm');
    expect(e[1]).toContain('0.407 × 77.1 + 0.267 × 177.8 − 19.2 = 59.7 kg = ');
    expect(e[2]).toContain('1.1 × 77.1 − 128 × 0.4337² = 60.7 kg = ');
    expect(e[3]).toContain('0.32810 × 77.1 + 0.33929 × 177.8 − 29.5336 = 56.1 kg = ');
    expect(e[4]).toContain('(59.7 + 60.7 + 56.1) ÷ 3 = 58.8 kg = 129.7 lbs');
  });
  it('metric female', () => {
    const e = exprs(leanBodyMass, { unit: 'metric', sex: 'female', weight: '60', heightCm: '165' });
    expect(e[1]).toBe('0.252 × 60.0 + 0.473 × 165.0 − 48.3 = 44.9 kg');
    expect(e[2]).toContain('148 × 0.3636² = 44.6 kg');
    expect(e[3]).toBe('0.29569 × 60.0 + 0.41813 × 165.0 − 43.2933 = 43.4 kg');
    expect(e[4]).toBe('(44.9 + 44.6 + 43.4) ÷ 3 = 44.3 kg');
  });
  it('James is clamped at very high BMI and the step says so', () => {
    const s = steps(leanBodyMass, { unit: 'metric', sex: 'male', weight: '400', heightCm: '170' });
    expect(s[2].expr).toContain('(limited to 0.0 kg)');
    expect(s[2].note).toMatch(/unreliable/);
  });
  it('invalid: no weight or height', () => {
    expect(steps(leanBodyMass, { unit: 'metric', sex: 'male', weight: '', heightCm: '170' })).toEqual([]);
    expect(steps(leanBodyMass, { unit: 'metric', sex: 'male', weight: '70', heightCm: '' })).toEqual([]);
  });
});

describe('heart-rate-zones explainSteps', () => {
  it('Karvonen with resting heart rate', () => {
    const e = exprs(heartRateZones, { age: '40', restingHR: '60', method: 'karvonen' });
    expect(e).toEqual([
      '220 − 40 = 180 bpm',
      '180 − 60 = 120 bpm',
      'Zone 2 (60–70% HRR): 0.6 × 120 + 60 = 132 · 0.7 × 120 + 60 = 144 → 132–144 bpm',
      'Z1 120–132 · Z2 132–144 · Z3 144–156 · Z4 156–168 · Z5 168–180 bpm',
    ]);
  });
  it('% of max heart rate has no HRR step', () => {
    const e = exprs(heartRateZones, { age: '40', restingHR: '', method: 'maxpct' });
    expect(e).toEqual([
      '220 − 40 = 180 bpm',
      'Zone 2 (60–70% max HR): 0.6 × 180 = 108 · 0.7 × 180 = 126 → 108–126 bpm',
      'Z1 90–108 · Z2 108–126 · Z3 126–144 · Z4 144–162 · Z5 162–180 bpm',
    ]);
  });
  it('Karvonen without a resting rate assumes 60 bpm and says so', () => {
    const s = steps(heartRateZones, { age: '35', restingHR: '', method: 'karvonen' });
    expect(s[1].label).toMatch(/assuming a resting rate of 60 bpm/);
    expect(s[1].expr).toBe('185 − 60 = 125 bpm');
    expect(s[3].expr).toBe('Z1 123–135 · Z2 135–148 · Z3 148–160 · Z4 160–173 · Z5 173–185 bpm');
  });
  it('invalid: no age, or resting rate at/above max', () => {
    expect(steps(heartRateZones, { age: '', method: 'karvonen' })).toEqual([]);
    expect(steps(heartRateZones, { age: '40', restingHR: '200', method: 'karvonen' })).toEqual([]);
  });
});

describe('one-rep-max explainSteps', () => {
  it('Epley 185 lbs x 5', () => {
    const e = exprs(oneRepMax, { unit: 'lbs', weight: '185', reps: '5', formula: 'epley' });
    expect(e).toEqual(['185 lbs × 5 reps', '185 × (1 + 5 ÷ 30) = 185 × 1.1667 = 215.83 lbs', '215.83 → 216 lbs']);
  });
  it('Brzycki 100 kg x 8', () => {
    const e = exprs(oneRepMax, { unit: 'kg', weight: '100', reps: '8', formula: 'brzycki' });
    expect(e[1]).toBe('100 × 36 ÷ (37 − 8) = 100 × 36 ÷ 29 = 124.14 kg');
    expect(e[2]).toBe('124.14 → 124 kg');
  });
  it('Lombardi 225 lbs x 10', () => {
    const e = exprs(oneRepMax, { unit: 'lbs', weight: '225', reps: '10', formula: 'lombardi' });
    expect(e[1]).toBe('225 × 10^0.10 = 225 × 1.2589 = 283.26 lbs');
    expect(e[2]).toBe('283.26 → 283 lbs');
  });
  it('a 1-rep set is the 1RM; sets above 15 reps are capped and noted', () => {
    const one = exprs(oneRepMax, { unit: 'lbs', weight: '200', reps: '1', formula: 'epley' });
    expect(one[1]).toBe('1 rep: the weight lifted is the 1RM = 200 lbs');
    expect(one[2]).toBe('200.00 → 200 lbs');
    const capped = steps(oneRepMax, { unit: 'lbs', weight: '100', reps: '20', formula: 'epley' });
    expect(capped[0].expr).toBe('100 lbs × 15 reps');
    expect(capped[0].note).toMatch(/caps/);
  });
  it('invalid: zero reps or blank weight', () => {
    expect(steps(oneRepMax, { unit: 'lbs', weight: '185', reps: '0', formula: 'epley' })).toEqual([]);
    expect(steps(oneRepMax, { unit: 'lbs', weight: '', reps: '5', formula: 'epley' })).toEqual([]);
  });
});

describe('bsa explainSteps', () => {
  it('imperial 170 lb, 5 ft 10 in', () => {
    const e = exprs(bsa, { unit: 'imperial', weight: '170', heightFt: '5', heightIn: '10', heightCm: '' });
    expect(e).toEqual([
      '170 lb × 0.45359237 = 77.11 kg · (5 ft × 12 + 10 in) × 2.54 = 177.8 cm',
      '√(177.8 × 77.11 ÷ 3600) = √3.8084 = 1.95 m²',
      '0.007184 × 77.11^0.425 × 177.8^0.725 = 0.007184 × 6.339 × 42.776 = 1.95 m²',
      '0.024265 × 77.11^0.5378 × 177.8^0.3964 = 0.024265 × 10.349 × 7.796 = 1.96 m²',
      '(1.9515 + 1.9480 + 1.9577) ÷ 3 = 1.95 m²',
    ]);
  });
  it('metric 70 kg, 175 cm', () => {
    const e = exprs(bsa, { unit: 'metric', weight: '70', heightFt: '', heightIn: '', heightCm: '175' });
    expect(e[0]).toBe('70.00 kg · 175.0 cm');
    expect(e[1]).toBe('√(175.0 × 70.00 ÷ 3600) = √3.4028 = 1.84 m²');
    expect(e[2]).toContain('0.007184 × 6.084 × 42.287 = 1.85 m²');
    expect(e[3]).toContain('0.024265 × 9.824 × 7.747 = 1.85 m²');
    expect(e[4]).toBe('(1.8447 + 1.8481 + 1.8468) ÷ 3 = 1.85 m²');
  });
  it('carries the educational-only caveat the calculator already shows', () => {
    const s = steps(bsa, { unit: 'metric', weight: '70', heightCm: '175' });
    expect(s[4].note).toMatch(/Educational reference only/);
  });
  it('invalid', () => {
    expect(steps(bsa, { unit: 'imperial', weight: '170', heightFt: '', heightIn: '' })).toEqual([]);
    expect(steps(bsa, { unit: 'metric', weight: '', heightCm: '175' })).toEqual([]);
  });
});

describe('water-intake explainSteps', () => {
  it('pounds, moderate activity, hot climate', () => {
    expect(exprs(waterIntake, { weight: '150', unit: 'lbs', activityLevel: 'moderate', climate: 'hot' })).toEqual([
      '150 lb',
      '150.0 lb × 0.5 = 75.0 oz',
      '75.0 + 16 (activity) + 16 (climate) = 107.0 oz',
      '107.0 oz × 0.0295735 = 3.2 liters',
    ]);
  });
  it('kilograms, athlete, very hot climate', () => {
    expect(exprs(waterIntake, { weight: '70', unit: 'kg', activityLevel: 'athlete', climate: 'extreme' })).toEqual([
      '70 kg ÷ 0.45359237 = 154.3 lb',
      '154.3 lb × 0.5 = 77.2 oz',
      '77.2 + 32 (activity) + 24 (climate) = 133.2 oz',
      '133.2 oz × 0.0295735 = 3.9 liters',
    ]);
  });
  it('defaults match calculate(): missing climate/activity add nothing', () => {
    const e = exprs(waterIntake, { weight: '150', unit: 'lbs' });
    expect(e[2]).toBe('75.0 + 0 (activity) + 0 (climate) = 75.0 oz');
  });
  it('invalid', () => {
    expect(steps(waterIntake, { weight: '', unit: 'lbs' })).toEqual([]);
    expect(steps(waterIntake, { weight: '-3', unit: 'kg' })).toEqual([]);
  });
});

describe('body-fat explainSteps (U.S. Navy)', () => {
  it('imperial male', () => {
    const e = exprs(bodyFat, { unit: 'imperial', sex: 'male', age: '30', weight: '180', heightFt: '5', heightIn: '10', heightCm: '', neck: '15', abdomen: '34' });
    expect(e).toEqual([
      '5 ft 10 in = 70 in',
      '34 − 15 = 19 in',
      'log10(19) = 1.2788 · log10(70) = 1.8451',
      '86.010 × 1.2788 − 70.041 × 1.8451 + 36.76 = 17.5%',
    ]);
  });
  it('metric female', () => {
    const e = exprs(bodyFat, { unit: 'metric', sex: 'female', age: '30', weight: '62', heightCm: '165', neck: '32', waist: '75', hip: '98' });
    expect(e).toEqual([
      '165 cm ÷ 2.54 = 64.96 in',
      '(75 + 98 − 32) cm ÷ 2.54 = 55.51 in',
      'log10(55.51) = 1.7444 · log10(64.96) = 1.8127',
      '163.205 × 1.7444 − 97.684 × 1.8127 − 78.387 = 29.2%',
    ]);
  });
  it('a result clamped to the 2% floor is shown as such', () => {
    const s = steps(bodyFat, { unit: 'imperial', sex: 'male', age: '30', weight: '150', heightFt: '5', heightIn: '10', neck: '17', abdomen: '28' });
    expect(s[3].expr).toContain('kept within 2%–70% = 2.0%');
  });
  it('invalid: blank measurement, or abdomen not larger than neck (log domain)', () => {
    const v = { unit: 'imperial', sex: 'male', age: '30', weight: '180', heightFt: '5', heightIn: '10', neck: '15', abdomen: '34' };
    expect(steps(bodyFat, { ...v, abdomen: '' })).toEqual([]);
    expect(steps(bodyFat, { ...v, abdomen: '15' })).toEqual([]);
    expect(steps(bodyFat, { ...v, heightFt: '', heightIn: '' })).toEqual([]);
  });
});

describe('healthy-weight explainSteps', () => {
  it('imperial female, 5 ft 5 in, 150 lb, large frame (BMI lands on 25.0 -> Overweight)', () => {
    const e = exprs(healthyWeight, { unit: 'imperial', sex: 'female', age: '30', weight: '150', waist: '32', heightFt: '5', heightIn: '5', heightCm: '', frameSize: 'large' });
    expect(e).toEqual([
      '(5 ft × 12 + 5 in) × 2.54 ÷ 100 = 1.651 m',
      '1.651 m × 1.651 m = 2.726 m²',
      '150 lb × 0.45359237 = 68.0 kg ÷ 2.726 m² = 25.0 (Overweight)',
      '18.5 × 2.726 = 50.4 kg · 24.9 × 2.726 = 67.9 kg → 111 lbs – 150 lbs',
      '50.4 + (67.9 − 50.4) × 0.55 = 60.0 kg → 132 lbs',
    ]);
  });
  it('metric male, 180 cm, 80 kg, default frame', () => {
    const e = exprs(healthyWeight, { unit: 'metric', sex: 'male', age: '40', weight: '80', waist: '85', heightFt: '', heightIn: '', heightCm: '180' });
    expect(e).toEqual([
      '180 cm ÷ 100 = 1.800 m',
      '1.800 m × 1.800 m = 3.240 m²',
      '80.0 kg ÷ 3.240 m² = 24.7 (Normal weight)',
      '18.5 × 3.240 = 59.9 kg · 24.9 × 3.240 = 80.7 kg → 59.9 kg – 80.7 kg',
      '59.9 + (80.7 − 59.9) × 0.5 = 70.3 kg',
    ]);
  });
  it('invalid: missing waist, weight or height', () => {
    const v = { unit: 'metric', sex: 'male', age: '40', weight: '80', waist: '85', heightCm: '180' };
    expect(steps(healthyWeight, { ...v, waist: '' })).toEqual([]);
    expect(steps(healthyWeight, { ...v, weight: '' })).toEqual([]);
    expect(steps(healthyWeight, { ...v, heightCm: '' })).toEqual([]);
  });
});
