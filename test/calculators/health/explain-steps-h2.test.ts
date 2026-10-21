import { describe, it, expect } from 'vitest';
import type { CalculatorConfig, ExplainStep } from '../../../src/types/calculator';
import bloodType from '../../../src/calculators/health/blood-type';
import bodyType from '../../../src/calculators/health/body-type';
import carb from '../../../src/calculators/health/carbohydrate';
import choc from '../../../src/calculators/health/chocolate-toxicity';
import dogCatAge from '../../../src/calculators/health/dog-cat-age';
import dogCatPregnancy from '../../../src/calculators/health/dog-cat-pregnancy';
import fatIntake from '../../../src/calculators/health/fat-intake';
import macro from '../../../src/calculators/health/macro';
import macroPoint from '../../../src/calculators/health/macro-point';
import periodOvulation from '../../../src/calculators/health/period-ovulation';
import pigGestation from '../../../src/calculators/health/pig-gestation';
import pregnancyCalculator from '../../../src/calculators/health/pregnancy-calculator';
import pregnancyConception from '../../../src/calculators/health/pregnancy-conception';
import pregnancyGain from '../../../src/calculators/health/pregnancy-gain';
import { buildDemoValues, getValue } from '../../helpers';

// Every expected string below was computed independently in Python (decimal module at 60-digit precision with
// ROUND_HALF_UP for the arithmetic, datetime for the calendar dates), not by running the calculators.

type V = Record<string, string>;
const steps = (c: CalculatorConfig, v: V): ExplainStep[] => c.explainSteps!(v);
// Strip thousands separators so the assertions do not depend on the runner's locale.
const strip = (s: string) => s.replace(/(\d),(?=\d{3})/g, '$1');
const exprs = (c: CalculatorConfig, v: V) => steps(c, v).map((s) => strip(s.expr));
const clean = (st: ExplainStep[]) => st.forEach((s) => expect(`${s.label} ${s.expr} ${s.note ?? ''}`).not.toMatch(/NaN|Infinity|undefined/));

const ALL: [string, CalculatorConfig][] = [
  ['blood-type', bloodType], ['body-type', bodyType], ['carbohydrate', carb], ['chocolate-toxicity', choc],
  ['dog-cat-age', dogCatAge], ['dog-cat-pregnancy', dogCatPregnancy], ['fat-intake', fatIntake], ['macro', macro],
  ['macro-point', macroPoint], ['period-ovulation', periodOvulation], ['pig-gestation', pigGestation],
  ['pregnancy-calculator', pregnancyCalculator], ['pregnancy-conception', pregnancyConception], ['pregnancy-gain', pregnancyGain],
];

describe('B6d health explainSteps - demo values', () => {
  for (const [name, config] of ALL) {
    it(`${name}: a worked solution exactly when the calculator answers`, () => {
      const v = buildDemoValues(config.inputs);
      const rows = config.calculate(v);
      const s = steps(config, v);
      expect(s.length > 0).toBe(rows.length > 0);
      if (s.length) {
        expect(s.length).toBeGreaterThanOrEqual(3);
        expect(s.length).toBeLessThanOrEqual(6);
        clean(s);
      }
    });
  }

  // The last step ends on (or quotes) the calculator's own displayed answer.
  it('blood-type: ends on the most likely combination, equal to the first sorted combined value', () => {
    const v = buildDemoValues(bloodType.inputs);
    const combined = getValue(bloodType.calculate(v), 'combinedHeader').split(' · ')[0].replace('Type ', '');
    const [label, pct] = combined.split(': ');
    const last = steps(bloodType, v).at(-1)!.expr;
    expect(last).toContain(`Type ${label}`);
    expect(last.endsWith(pct)).toBe(true);
  });
  it('carbohydrate: quotes the displayed daily range and average', () => {
    const v = buildDemoValues(carb.inputs);
    const r = carb.calculate(v);
    const e = exprs(carb, v);
    const [lo, hi] = getValue(r, 'dailyCarbRange').split(' g/day')[0].replace(/,/g, '').split('–');
    expect(e[2]).toContain(`${lo} g`);
    expect(e[2]).toContain(`${hi} g`);
    expect(e[3].endsWith(`${getValue(r, 'dailyAvg').split(' g/day')[0].replace(/,/g, '')} g/day`)).toBe(true);
  });
  it('chocolate-toxicity: last step is the displayed mg/kg', () => {
    const v = buildDemoValues(choc.inputs);
    expect(strip(steps(choc, v).at(-1)!.expr).endsWith(strip(getValue(choc.calculate(v), 'mgPerKg')))).toBe(true);
  });
  it('fat-intake: quotes the displayed gram range, target and per-kg line', () => {
    const v = buildDemoValues(fatIntake.inputs);
    const r = fatIntake.calculate(v);
    const e = exprs(fatIntake, v);
    expect(e[4].endsWith(strip(getValue(r, 'fatPerKg')))).toBe(true);
    expect(e[3].endsWith(strip(getValue(r, 'totalFatTarget')))).toBe(true);
  });
  it('macro: step 4 ends on the displayed daily calories and the last one on the displayed grams', () => {
    const v = buildDemoValues(macro.inputs);
    const r = macro.calculate(v);
    const e = exprs(macro, v);
    expect(e[e.length - 2].endsWith(strip(getValue(r, 'dailyCalories')))).toBe(true);
    const last = e[e.length - 1];
    expect(last).toContain(`= ${getValue(r, 'proteinGrams').split(' g')[0]} g`);
    expect(last).toContain(`= ${getValue(r, 'carbGrams').split(' g')[0]} g`);
    expect(last).toContain(`= ${getValue(r, 'fatGrams').split(' g')[0]} g`);
  });
  it('macro-point: last step ends on the displayed score', () => {
    const v = buildDemoValues(macroPoint.inputs);
    expect(steps(macroPoint, v).at(-1)!.expr.endsWith(`→ ${getValue(macroPoint.calculate(v), 'macroPoints')}`)).toBe(true);
  });
  it('pregnancy-gain: quotes the displayed category, gain so far and projection', () => {
    const v = buildDemoValues(pregnancyGain.inputs);
    const r = pregnancyGain.calculate(v);
    const e = exprs(pregnancyGain, v);
    expect(e[1].endsWith(getValue(r, 'bmiCategory'))).toBe(true);
    expect(e[3].endsWith(getValue(r, 'gainSoFar'))).toBe(true);
    expect(e[4].endsWith(getValue(r, 'projectedGain'))).toBe(true);
  });
  it('dog-cat-age: quotes the displayed human-year answers', () => {
    const v = buildDemoValues(dogCatAge.inputs);
    const r = dogCatAge.calculate(v);
    const e = exprs(dogCatAge, v);
    expect(e[1].endsWith(getValue(r, 'traditionalAge'))).toBe(true);
    expect(e[2].endsWith(getValue(r, 'epigeneticAge'))).toBe(true);
  });
  it('body-type: quotes the displayed shape and ratios', () => {
    const v = buildDemoValues(bodyType.inputs);
    const r = bodyType.calculate(v);
    const e = exprs(bodyType, v);
    expect(e[2].endsWith(getValue(r, 'bodyShape'))).toBe(true);
    expect(e[1]).toBe(`${v.waist} ÷ ${v.hip} = ${getValue(r, 'waistHipRatio')} · ${v.waist} ÷ ${v.bust} = ${getValue(r, 'waistBustRatio')}`);
  });
  it('dog-cat-pregnancy and pig-gestation: quote the displayed due date', () => {
    const d = buildDemoValues(dogCatPregnancy.inputs);
    expect(steps(dogCatPregnancy, d)[1].expr.endsWith(getValue(dogCatPregnancy.calculate(d), 'dueDate'))).toBe(true);
    const p = buildDemoValues(pigGestation.inputs);
    expect(steps(pigGestation, p)[1].expr.endsWith(getValue(pigGestation.calculate(p), 'dueDate'))).toBe(true);
  });
});

describe('B6d health explainSteps - blank, invalid and runaway input never print NaN/Infinity', () => {
  for (const [name, config] of ALL) {
    it(`${name}: empty values -> []`, () => {
      expect(steps(config, {})).toEqual([]);
      expect(steps(config, Object.fromEntries(config.inputs.map((i) => [i.id, ''])))).toEqual([]);
    });
    it(`${name}: junk in every number field is either empty or clean`, () => {
      for (const junk of ['', 'abc', '-1', '0', '1e999', '1e308']) {
        const v = buildDemoValues(config.inputs);
        for (const i of config.inputs) if (i.type === 'number') v[i.id] = junk;
        const s = steps(config, v);
        if (junk === '' || junk === 'abc') {
          if (config.calculate(v).length === 0) expect(s, `junk "${junk}"`).toEqual([]);
        }
        clean(s);
      }
    });
    it(`${name}: one runaway field at a time stays clean`, () => {
      for (const field of config.inputs.filter((i) => i.type === 'number')) {
        const v = buildDemoValues(config.inputs);
        v[field.id] = '1e999';
        clean(steps(config, v));
        v[field.id] = '1e308';
        clean(steps(config, v));
      }
    });
  }
});

// [id, calculator, values, expected `expr` of every step, in order]
const PINNED: [string, CalculatorConfig, V, string[]][] = [
  ['bt1', bloodType, { parent1Blood: 'A', parent1Rh: '+', parent2Blood: 'B', parent2Rh: '+' }, [
      'Parent 1 (A+): AA or AO · RR or Rr   Parent 2 (B+): BB or BO · RR or Rr',
      '2 × 2 genotype pairs × 4 allele pairings = 16 combinations: A 3 · B 3 · AB 9 · O 1',
      'A: 3 ÷ 16 = 18.8% · B: 3 ÷ 16 = 18.8% · AB: 9 ÷ 16 = 56.3% · O: 1 ÷ 16 = 6.3%',
      '2 × 2 × 4 = 16 combinations: Rh+ 15 ÷ 16 = 93.8% · Rh- 1 ÷ 16 = 6.3%',
      'Most likely, Type AB+: 9/16 × 15/16 × 100 = 52.7%',
  ]],
  ['bt2', bloodType, { parent1Blood: 'O', parent1Rh: '-', parent2Blood: 'AB', parent2Rh: '+' }, [
      'Parent 1 (O-): OO · rr   Parent 2 (AB+): AB · RR or Rr',
      '1 × 1 genotype pairs × 4 allele pairings = 4 combinations: A 2 · B 2',
      'A: 2 ÷ 4 = 50.0% · B: 2 ÷ 4 = 50.0%',
      '1 × 2 × 4 = 8 combinations: Rh+ 6 ÷ 8 = 75.0% · Rh- 2 ÷ 8 = 25.0%',
      'Most likely, Type A+: 2/4 × 6/8 × 100 = 37.5%',
  ]],
  ['bt3', bloodType, { parent1Blood: 'O', parent1Rh: '-', parent2Blood: 'O', parent2Rh: '-' }, [
      'Parent 1 (O-): OO · rr   Parent 2 (O-): OO · rr',
      '1 × 1 genotype pairs × 4 allele pairings = 4 combinations: O 4',
      'O: 4 ÷ 4 = 100.0%',
      '1 × 1 × 4 = 4 combinations: Rh- 4 ÷ 4 = 100.0%',
      'Most likely, Type O-: 4/4 × 4/4 × 100 = 100.0%',
  ]],
  ['bo1', bodyType, { unit: 'imperial', bust: '38', waist: '30', hip: '40' }, [
      'bust ÷ waist = 38 ÷ 30 = 1.27 · hip ÷ waist = 40 ÷ 30 = 1.33',
      '30 ÷ 40 = 0.75 · 30 ÷ 38 = 0.79',
      'bust ÷ waist = 1.27 and hip ÷ waist = 1.33, both at least 1.15 → Hourglass',
  ]],
  ['bo2', bodyType, { unit: 'imperial', bust: '34', waist: '32', hip: '42' }, [
      'bust ÷ waist = 34 ÷ 32 = 1.06 · hip ÷ waist = 42 ÷ 32 = 1.31',
      '32 ÷ 42 = 0.76 · 32 ÷ 34 = 0.94',
      'hip ÷ waist = 1.31 (at least 1.15) and bust ÷ waist = 1.06 (under 1.15) → Pear (Triangle)',
  ]],
  ['bo3', bodyType, { unit: 'imperial', bust: '42', waist: '30', hip: '34' }, [
      'bust ÷ waist = 42 ÷ 30 = 1.40 · hip ÷ waist = 34 ÷ 30 = 1.13',
      '30 ÷ 34 = 0.88 · 30 ÷ 42 = 0.71',
      'bust ÷ waist = 1.40 (at least 1.15), hip ÷ waist = 1.13 (under 1.15) and bust − hip = 8 in (more than 5 in) → Inverted Triangle',
  ]],
  ['bo4', bodyType, { unit: 'imperial', bust: '36', waist: '34', hip: '38' }, [
      'bust ÷ waist = 36 ÷ 34 = 1.06 · hip ÷ waist = 38 ÷ 34 = 1.12',
      '34 ÷ 38 = 0.89 · 34 ÷ 36 = 0.94',
      'waist (34) is at least 90% of bust (32.4) or of hip (34.2) → Apple (Round)',
  ]],
  ['bo5', bodyType, { unit: 'imperial', bust: '35', waist: '31', hip: '35' }, [
      'bust ÷ waist = 35 ÷ 31 = 1.13 · hip ÷ waist = 35 ÷ 31 = 1.13',
      '31 ÷ 35 = 0.89 · 31 ÷ 35 = 0.89',
      'none of the Pear, Inverted Triangle, Hourglass or Apple tests matched → Rectangle (Straight)',
  ]],
  ['bo6', bodyType, { unit: 'metric', bust: '100', waist: '70', hip: '78' }, [
      'bust ÷ waist = 100 ÷ 70 = 1.43 · hip ÷ waist = 78 ÷ 70 = 1.11',
      '70 ÷ 78 = 0.90 · 70 ÷ 100 = 0.70',
      'bust ÷ waist = 1.43 (at least 1.15), hip ÷ waist = 1.11 (under 1.15) and bust − hip = 22 cm (more than 12.7 cm) → Inverted Triangle',
  ]],
  ['ca1', carb, { unit: 'imperial', weight: '170', bodyFatPct: '', goal: 'moderate', eventDate: '' }, [
      '170 lb × 0.45359237 = 77.11 kg',
      '77.11 kg × 5 = 386 g · 77.11 kg × 7 = 540 g',
      '(386 + 540) ÷ 2 = 463 g/day',
      '463 g × 4 kcal/g = 1852 kcal',
  ]],
  ['ca2', carb, { unit: 'metric', weight: '80', bodyFatPct: '20', goal: 'muscle', eventDate: '2026-12-05' }, [
      '80 kg',
      '80.00 kg × (1 − 20/100) = 64.00 kg',
      '64.00 kg × 4 = 256 g · 64.00 kg × 6 = 384 g',
      '(256 + 384) ÷ 2 = 320 g/day',
      '320 g × 4 kcal/g = 1280 kcal',
      '80.00 kg × 8 g/kg = 640 g/day · 640 g × 4 = 2560 kcal',
  ]],
  ['ch1', choc, { dogWeight: '25', weightUnit: 'lbs', chocolateType: 'Milk', amountEaten: '50', amountUnit: 'g' }, [
      '25 lb ÷ 2.20462 = 11.34 kg',
      '50 g',
      '50 g × 2.4 mg/g = 120.0 mg · 50 g × 0.2 mg/g = 10.0 mg',
      '120.0 mg + 10.0 mg = 130.0 mg',
      '130.0 mg ÷ 11.34 kg = 11.46 mg/kg',
  ]],
  ['ch2', choc, { dogWeight: '10', weightUnit: 'kg', chocolateType: 'Dark', amountEaten: '3', amountUnit: 'oz' }, [
      '10 kg',
      '3 oz × 28.3495 = 85.05 g',
      '85.05 g × 5.5 mg/g = 467.77 mg · 85.05 g × 0.7 mg/g = 59.53 mg',
      '467.77 mg + 59.53 mg = 527.3 mg',
      '527.3 mg ÷ 10 kg = 52.73 mg/kg',
  ]],
  ['ag1', dogCatAge, { species: 'dog', dogSize: 'medium', petAgeYears: '5' }, [
      '24 + (5 − 2) × 5 = 39',
      '39 rounds to 39 human years',
      '16 × ln(5) + 31 = 56.8 human years',
  ]],
  ['ag2', dogCatAge, { species: 'dog', dogSize: 'medium', petAgeYears: '0.5' }, [
      '0.5 × 15 = 7.5',
      '7.5 rounds to 8 human years',
  ]],
  ['ag3', dogCatAge, { species: 'dog', dogSize: 'medium', petAgeYears: '1.5' }, [
      '15 + (1.5 − 1) × 9 = 19.5',
      '19.5 rounds to 20 human years',
      '16 × ln(1.5) + 31 = 37.5 human years',
  ]],
  ['ag4', dogCatAge, { species: 'cat', petAgeYears: '5' }, [
      '24 + (5 − 2) × 4 = 36',
      '36 rounds to 36 human years',
      '5 × 7 = 35, which rounds to 35 human years',
  ]],
  ['ag5', dogCatAge, { species: 'cat', petAgeYears: '1.5' }, [
      '15 + (1.5 − 1) × 9 = 19.5',
      '19.5 rounds to 20 human years',
      '1.5 × 7 = 10.5, which rounds to 11 human years',
  ]],
  ['dp1', dogCatPregnancy, { species: 'dog', breedingDate: '2026-03-01' }, [
      '63 days (typical range 58–68 days)',
      'March 1, 2026 + 63 days = May 3, 2026',
      'March 1, 2026 + 58 to 68 days = April 28, 2026 – May 8, 2026',
  ]],
  ['dp2', dogCatPregnancy, { species: 'cat', breedingDate: '2026-01-10' }, [
      '65 days (typical range 63–67 days)',
      'January 10, 2026 + 65 days = March 16, 2026',
      'January 10, 2026 + 63 to 67 days = March 14, 2026 – March 18, 2026',
  ]],
  ['fa1', fatIntake, { unit: 'imperial', weight: '170', goal: 'maintain', calories: '2200' }, [
      '170 lb × 0.45359237 = 77.11 kg',
      '25% to 35% of 2200 kcal (midpoint 30%)',
      '2200 × 0.25 ÷ 9 = 61 g · 2200 × 0.35 ÷ 9 = 86 g',
      '2200 × 0.3 ÷ 9 = 73 g/day',
      '61 g and 86 g ÷ 77.1 kg = 0.79 – 1.12 g/kg/day (target 0.95 g/kg at 77.1 kg)',
  ]],
  ['fa2', fatIntake, { unit: 'metric', weight: '70', goal: 'keto', calories: '2000' }, [
      '70 kg',
      '65% to 80% of 2000 kcal (midpoint 72.5%)',
      '2000 × 0.65 ÷ 9 = 144 g · 2000 × 0.8 ÷ 9 = 178 g',
      '2000 × 0.725 ÷ 9 = 161 g/day',
      '144 g and 178 g ÷ 70 kg = 2.06 – 2.54 g/kg/day (target 2.30 g/kg at 70 kg)',
  ]],
  ['mp1', macroPoint, { calories: '350', satFat: '5', sugar: '12', protein: '25' }, [
      '350 × 0.0305 = 10.675',
      '5 g × 0.275 = 1.375',
      '12 g × 0.12 = 1.44',
      '25 g × 0.098 = 2.45',
      'max(0, 10.675 + 1.375 + 1.44 − 2.45) = max(0, 11.04) → 11.0 points',
  ]],
  ['mp2', macroPoint, { calories: '10', satFat: '0', sugar: '0', protein: '50' }, [
      '10 × 0.0305 = 0.305',
      '0 g × 0.275 = 0',
      '0 g × 0.12 = 0',
      '50 g × 0.098 = 4.9',
      'max(0, 0.305 + 0 + 0 − 4.9) = max(0, -4.595) → 0.0 points',
  ]],
  ['ma1', macro, { unit: 'metric', sex: 'male', age: '30', weight: '80', heightCm: '180', activityLevel: '1.55', goal: 'maintain', diet: 'standard', bodyFatPct: '' }, [
      '10×80.0 + 6.25×180.0 − 5×30 + 5 = 1780 kcal/day',
      '1780.0 × 1.55 = 2759 kcal/day',
      '2759 + 0 = 2759 → 2759 kcal/day',
      'protein 2759 × 20% ÷ 4 = 138 g · carbs 2759 × 50% ÷ 4 = 345 g · fat 2759 × 30% ÷ 9 = 92 g',
  ]],
  ['ma2', macro, { unit: 'imperial', sex: 'female', age: '35', weight: '140', heightFt: '5', heightIn: '4', activityLevel: '1.2', goal: 'moderateLoss', diet: 'keto', bodyFatPct: '30' }, [
      '140 lb × 0.45359237 = 63.5 kg · height = 162.6 cm',
      '63.5 kg × (1 − 30/100) = 44.5 kg → 370 + 21.6 × 44.5 = 1330 kcal/day',
      '1330.2 × 1.2 = 1596 kcal/day',
      '1596 − 500 = 1096 → raised to the 1200 kcal safety minimum → 1200 kcal/day',
      'protein 1200 × 25% ÷ 4 = 75 g · carbs 1200 × 5% ÷ 4 = 15 g · fat 1200 × 70% ÷ 9 = 93 g',
  ]],
  ['ma3', macro, { unit: 'imperial', sex: 'female', age: '30', weight: '110', heightFt: '5', heightIn: '2', activityLevel: '1.2', goal: 'moderateLoss', diet: 'lowCarb', bodyFatPct: '' }, [
      '110 lb × 0.45359237 = 49.9 kg · height = 157.5 cm',
      '10×49.9 + 6.25×157.5 − 5×30 − 161 = 1172 kcal/day',
      '1172.2 × 1.2 = 1407 kcal/day',
      '1407 − 500 = 907 → raised to the 1200 kcal safety minimum → 1200 kcal/day',
      'protein 1200 × 30% ÷ 4 = 90 g · carbs 1200 × 25% ÷ 4 = 75 g · fat 1200 × 45% ÷ 9 = 60 g',
  ]],
  ['po1', periodOvulation, { lmpDate: '2026-03-15', cycleLength: '28', periodLength: '5', lutealPhase: '' }, [
      '28 − 14 = 14 days after the first day of the period',
      '14 − 5 = 9 to 14 days after the first day of the period',
      '5 − 1 = 4 days after the first day',
      'ovulation Sunday, March 29, 2026 · fertile window Tuesday, March 24, 2026 → Sunday, March 29, 2026 · period ends Thursday, March 19, 2026 · next period Sunday, April 12, 2026',
  ]],
  ['po2', periodOvulation, { lmpDate: '2026-03-15', cycleLength: '32', periodLength: '4', lutealPhase: '12' }, [
      '32 − 12 = 20 days after the first day of the period',
      '20 − 5 = 15 to 20 days after the first day of the period',
      '4 − 1 = 3 days after the first day',
      'ovulation Saturday, April 4, 2026 · fertile window Monday, March 30, 2026 → Saturday, April 4, 2026 · period ends Wednesday, March 18, 2026 · next period Thursday, April 16, 2026',
  ]],
  ['pi1', pigGestation, { breedingDate: '2026-01-01', breedType: 'commercial', parity: 'gilt' }, [
      '114 + 0 (other breed types) + 0 (other parities) = 114 days',
      'January 1, 2026 + 114 days = April 25, 2026',
      'January 1, 2026 + 112 days = April 23, 2026 · + 116 days = April 27, 2026',
  ]],
  ['pi2', pigGestation, { breedingDate: '2026-01-01', breedType: 'large', parity: 'olderSow' }, [
      '114 + 1 (heritage / large breed) + 1 (sow with 6+ previous litters) = 116 days',
      'January 1, 2026 + 116 days = April 27, 2026',
      'January 1, 2026 + 112 days = April 23, 2026 · + 116 days = April 27, 2026',
  ]],
  ['pc1', pregnancyCalculator, { lmpDate: '2026-01-15', cycleLength: '28' }, [
      '28 − 28 = 0, so the adjusted LMP is January 15, 2026',
      'January 15, 2026 + 280 days = Thursday, October 22, 2026',
      'January 15, 2026 + 14 days = January 29, 2026',
      '+ 91 days (13 weeks) = April 16, 2026 · + 168 days (24 weeks) = July 2, 2026 · + 259 days (37 weeks) = October 1, 2026',
  ]],
  ['pc2', pregnancyCalculator, { lmpDate: '2026-01-15', cycleLength: '35' }, [
      '35 − 28 = 7 days: January 15, 2026 + 7 days = January 22, 2026',
      'January 22, 2026 + 280 days = Thursday, October 29, 2026',
      'January 22, 2026 + 14 days = February 5, 2026',
      '+ 91 days (13 weeks) = April 23, 2026 · + 168 days (24 weeks) = July 9, 2026 · + 259 days (37 weeks) = October 8, 2026',
  ]],
  ['pc3', pregnancyCalculator, { lmpDate: '2026-01-15', cycleLength: '24' }, [
      '24 − 28 = −4 days: January 15, 2026 − 4 days = January 11, 2026',
      'January 11, 2026 + 280 days = Sunday, October 18, 2026',
      'January 11, 2026 + 14 days = January 25, 2026',
      '+ 91 days (13 weeks) = April 12, 2026 · + 168 days (24 weeks) = June 28, 2026 · + 259 days (37 weeks) = September 27, 2026',
  ]],
  ['pn1', pregnancyConception, { method: 'lmp', lmpDate: '2026-01-10', cycleLength: '30' }, [
      'Saturday, January 10, 2026 + (30 − 14) days = Monday, January 26, 2026',
      'Wednesday, January 21, 2026 → Monday, January 26, 2026',
      'Sunday, February 1, 2026 → Saturday, February 7, 2026',
      'Monday, January 12, 2026 + 280 days = Monday, October 19, 2026',
  ]],
  ['pn2', pregnancyConception, { method: 'nextPeriod', nextPeriodDate: '2026-02-07' }, [
      'Saturday, February 7, 2026 − 14 days = Saturday, January 24, 2026',
      'Monday, January 19, 2026 → Saturday, January 24, 2026',
      'Friday, January 30, 2026 → Thursday, February 5, 2026',
      'Saturday, January 10, 2026 + 280 days = Saturday, October 17, 2026',
  ]],
  ['pn3', pregnancyConception, { method: 'ivf', ivfDate: '2026-03-01', embryoType: 'day5' }, [
      '266 − 5 = 261 days',
      'Sunday, March 1, 2026 + 261 days = Tuesday, November 17, 2026',
      'Sunday, March 1, 2026 − 5 days = Tuesday, February 24, 2026',
  ]],
  ['pn4', pregnancyConception, { method: 'ivf', ivfDate: '2026-03-01', embryoType: 'day3' }, [
      '266 − 3 = 263 days',
      'Sunday, March 1, 2026 + 263 days = Thursday, November 19, 2026',
      'Sunday, March 1, 2026 − 3 days = Thursday, February 26, 2026',
  ]],
  ['pn5', pregnancyConception, { method: 'dueDate', targetDueDate: '2026-12-01' }, [
      'Tuesday, December 1, 2026 − 266 days = Tuesday, March 10, 2026',
      'Tuesday, March 10, 2026 − 5 days = Thursday, March 5, 2026 → Tuesday, March 10, 2026',
      'Tuesday, March 10, 2026 − 14 days = Tuesday, February 24, 2026',
  ]],
  ['pn6', pregnancyConception, { method: 'cycle', cycleLength: '30' }, [
      'today + (30 − 14) days = today + 16 days',
      'today + 11 days → today + 16 days',
      'today + 22 days → today + 28 days',
      'today + 2 days + 280 days = today + 282 days',
  ]],
  ['pg1', pregnancyGain, { unit: 'imperial', prepregnancyWeight: '150', currentWeight: '165', heightFt: '5', heightIn: '5', currentWeek: '20' }, [
      '150 lb × 0.45359237 = 68.04 kg · 165 lb × 0.45359237 = 74.84 kg · 65 in × 0.0254 = 1.651 m',
      '68.04 kg ÷ 1.651 m² = 24.96 → BMI 25.0 — Overweight (25–29.9)',
      'Overweight (25–29.9) → 15–25 lbs',
      '165 lb − 150 lb = 15.0 lbs',
      '15.0 lbs ÷ 20 weeks × 40 = 30 lbs',
  ]],
  ['pg2', pregnancyGain, { unit: 'metric', prepregnancyWeight: '70', currentWeight: '74', heightCm: '170', currentWeek: '10' }, [
      '170 cm ÷ 100 = 1.7 m',
      '70 kg ÷ 1.7 m² = 24.22 → BMI 24.2 — Normal (18.5–24.9)',
      'Normal (18.5–24.9) → 11.3 kg–15.9 kg',
      '74 kg − 70 kg = 4.0 kg',
      '4.0 kg ÷ 10 weeks × 40 = 16.0 kg',
  ]],
  ['pg3', pregnancyGain, { unit: 'metric', prepregnancyWeight: '60', currentWeight: '72', heightCm: '165', currentWeek: '40' }, [
      '165 cm ÷ 100 = 1.65 m',
      '60 kg ÷ 1.65 m² = 22.04 → BMI 22.0 — Normal (18.5–24.9)',
      'Normal (18.5–24.9) → 11.3 kg–15.9 kg',
      '72 kg − 60 kg = 12.0 kg',
      'gain so far = 12.0 kg',
  ]],
  ['pg4', pregnancyGain, { unit: 'metric', prepregnancyWeight: '60', currentWeight: '60', heightCm: '165', currentWeek: '0' }, [
      '165 cm ÷ 100 = 1.65 m',
      '60 kg ÷ 1.65 m² = 22.04 → BMI 22.0 — Normal (18.5–24.9)',
      'Normal (18.5–24.9) → 11.3 kg–15.9 kg',
      '60 kg − 60 kg = 0.0 kg',
      '(25 + 35) ÷ 2 = 30 lb = 13.6 kg',
  ]],
];

describe('B6d health explainSteps - pinned worked solutions', () => {
  for (const [id, config, values, expected] of PINNED) {
    it(id, () => {
      expect(exprs(config, values)).toEqual(expected);
      clean(steps(config, values));
    });
  }
});

describe('B6d health explainSteps - calculator-specific behaviour', () => {
  it('blood-type: unknown blood type or missing Rh gives no steps', () => {
    expect(steps(bloodType, { parent1Blood: 'X', parent1Rh: '+', parent2Blood: 'A', parent2Rh: '+' })).toEqual([]);
    expect(steps(bloodType, { parent1Blood: 'A', parent1Rh: '', parent2Blood: 'A', parent2Rh: '+' })).toEqual([]);
  });
  it('blood-type: genotype counts agree with the displayed probabilities for every parent pairing', () => {
    for (const a of ['A', 'B', 'AB', 'O']) {
      for (const b of ['A', 'B', 'AB', 'O']) {
        const v = { parent1Blood: a, parent1Rh: '+', parent2Blood: b, parent2Rh: '-' };
        const r = bloodType.calculate(v);
        const e = exprs(bloodType, v);
        for (const row of r.filter((x) => /^abo[A-Z]+$/.test(x.id))) expect(e[2]).toContain(`${row.id.slice(3)}: `);
        for (const row of r.filter((x) => /^abo/.test(x.id))) expect(e[2]).toContain(`= ${row.value}`);
        clean(steps(bloodType, v));
      }
    }
  });
  it('body-type: ratio text never rounds across a rule threshold', () => {
    // hip/waist = 40.12 / 34.9 = 1.14957 prints as 1.15 at 2 dp but is below the 1.15 threshold: the rule text widens to 4 dp.
    const e = exprs(bodyType, { unit: 'imperial', bust: '50', waist: '34.9', hip: '40.12' });
    expect(e[2]).toContain('hip ÷ waist = 1.1496 (under 1.15)');
    expect(e[2].endsWith('Inverted Triangle')).toBe(true);
  });
  it('body-type: invalid measurements give no steps', () => {
    expect(steps(bodyType, { unit: 'imperial', bust: '0', waist: '30', hip: '40' })).toEqual([]);
    expect(steps(bodyType, { unit: 'imperial', bust: '38', waist: 'abc', hip: '40' })).toEqual([]);
    expect(steps(bodyType, { unit: 'imperial', bust: '38', waist: '-30', hip: '40' })).toEqual([]);
  });
  it('carbohydrate: invalid weight gives no steps, a bad event date drops only the loading step', () => {
    expect(steps(carb, { unit: 'metric', weight: '0', goal: 'moderate' })).toEqual([]);
    expect(steps(carb, { unit: 'metric', weight: '-70', goal: 'moderate' })).toEqual([]);
    expect(steps(carb, { unit: 'metric', weight: '70', goal: 'moderate', eventDate: '2026-02-31' })).toHaveLength(4);
    expect(steps(carb, { unit: 'metric', weight: '70', goal: 'moderate', eventDate: '2026-12-05' })).toHaveLength(5);
  });
  it('chocolate-toxicity: keeps the disclaimer and shows no severity or threshold claim', () => {
    const s = steps(choc, { dogWeight: '25', weightUnit: 'lbs', chocolateType: 'Milk', amountEaten: '50', amountUnit: 'g' });
    expect(s.at(-1)!.note).toMatch(/not a substitute for veterinary advice/);
    const all = s.map((x) => `${x.label} ${x.expr} ${x.note ?? ''}`).join(' ');
    expect(all).not.toMatch(/EMERGENCY|SERIOUS|LOW RISK|MILD|seizure|vomiting|safe|toxic/i);
  });
  it('chocolate-toxicity: every chocolate type uses the calculator per-gram figures', () => {
    const rate: Record<string, [string, string]> = { White: ['0.01', '0.03'], Milk: ['2.4', '0.2'], Dark: ['5.5', '0.7'], 'Cocoa Powder': ['26', '2.5'], 'Baking Chocolate': ['14', '1.5'] };
    for (const [type, [t, c]] of Object.entries(rate)) {
      const e = exprs(choc, { dogWeight: '10', weightUnit: 'kg', chocolateType: type, amountEaten: '100', amountUnit: 'g' });
      expect(e[2]).toContain(`100 g × ${t} mg/g`);
      expect(e[2]).toContain(`100 g × ${c} mg/g`);
    }
  });
  it('chocolate-toxicity: invalid weight or amount gives no steps', () => {
    expect(steps(choc, { dogWeight: '0', weightUnit: 'kg', chocolateType: 'Milk', amountEaten: '5', amountUnit: 'g' })).toEqual([]);
    expect(steps(choc, { dogWeight: '10', weightUnit: 'kg', chocolateType: 'Milk', amountEaten: '0', amountUnit: 'g' })).toEqual([]);
    expect(steps(choc, { dogWeight: '10', weightUnit: 'kg', chocolateType: 'Milk', amountEaten: '-3', amountUnit: 'g' })).toEqual([]);
  });
  it('dog-cat-age: invalid or zero age gives no steps; puppies get one traditional line and no epigenetic line', () => {
    expect(steps(dogCatAge, { species: 'dog', petAgeYears: '0' })).toEqual([]);
    expect(steps(dogCatAge, { species: 'dog', petAgeYears: '-2' })).toEqual([]);
    expect(steps(dogCatAge, { species: 'dog', petAgeYears: 'x' })).toEqual([]);
    expect(steps(dogCatAge, { species: 'dog', petAgeYears: '0.5' })).toHaveLength(2);
  });
  it('dog-cat-pregnancy: bad species or date gives no steps; no step depends on today', () => {
    expect(steps(dogCatPregnancy, { species: 'horse', breedingDate: '2026-03-01' })).toEqual([]);
    expect(steps(dogCatPregnancy, { species: 'dog', breedingDate: '' })).toEqual([]);
    expect(steps(dogCatPregnancy, { species: 'dog', breedingDate: 'nope' })).toEqual([]);
    const s = steps(dogCatPregnancy, { species: 'cat', breedingDate: '2026-01-10' });
    expect(s.map((x) => x.label).join(' ')).not.toMatch(/trimester|remaining|today/i);
  });
  it('fat-intake: invalid weight or calories gives no steps', () => {
    expect(steps(fatIntake, { unit: 'metric', weight: '0', goal: 'loss', calories: '2000' })).toEqual([]);
    expect(steps(fatIntake, { unit: 'metric', weight: '70', goal: 'loss', calories: '-5' })).toEqual([]);
    expect(steps(fatIntake, { unit: 'metric', weight: '70', goal: 'loss', calories: '' })).toEqual([]);
  });
  it('fat-intake: the four goals use their own fat shares', () => {
    const share = (goal: string) => exprs(fatIntake, { unit: 'metric', weight: '70', goal, calories: '2000' })[1];
    expect(share('loss')).toBe('20% to 25% of 2000 kcal (midpoint 22.5%)');
    expect(share('maintain')).toBe('25% to 35% of 2000 kcal (midpoint 30%)');
    expect(share('keto')).toBe('65% to 80% of 2000 kcal (midpoint 72.5%)');
    expect(share('heart')).toBe('25% to 30% of 2000 kcal (midpoint 27.5%)');
  });
  it('macro-point: quotes the calculator coefficients without saying what the formula is based on', () => {
    const s = steps(macroPoint, { calories: '350', satFat: '5', sugar: '12', protein: '25' });
    const all = s.map((x) => `${x.label} ${x.expr} ${x.note ?? ''}`).join(' ');
    expect(all).toMatch(/0\.0305/);
    expect(all).toMatch(/0\.275/);
    expect(all).toMatch(/0\.12/);
    expect(all).toMatch(/0\.098/);
    expect(all).not.toMatch(/Weight Watchers|SmartPoints|based on|official|standard|USDA|evidence/i);
  });
  it('macro-point: zero values are fine, negatives and blanks give no steps', () => {
    expect(steps(macroPoint, { calories: '0', satFat: '0', sugar: '0', protein: '0' })).toHaveLength(5);
    expect(steps(macroPoint, { calories: '-1', satFat: '0', sugar: '0', protein: '0' })).toEqual([]);
    expect(steps(macroPoint, { calories: '100', satFat: '', sugar: '0', protein: '0' })).toEqual([]);
  });
  it('macro: a goal that does not hit the safety minimum has no "raised to" text', () => {
    const e = exprs(macro, { unit: 'metric', sex: 'male', age: '30', weight: '80', heightCm: '180', activityLevel: '1.55', goal: 'moderateLoss', diet: 'standard', bodyFatPct: '' });
    expect(e[2]).toBe('2759 − 500 = 2259 → 2259 kcal/day');
  });
  it('macro: invalid body measurements give no steps', () => {
    expect(steps(macro, { unit: 'metric', sex: 'male', age: '30', weight: '0', heightCm: '180', activityLevel: '1.55', goal: 'maintain', diet: 'standard' })).toEqual([]);
    expect(steps(macro, { unit: 'metric', sex: 'male', age: '30', weight: '80', heightCm: '', activityLevel: '1.55', goal: 'maintain', diet: 'standard' })).toEqual([]);
    expect(steps(macro, { unit: 'metric', sex: 'male', age: '', weight: '80', heightCm: '180', activityLevel: '1.55', goal: 'maintain', diet: 'standard' })).toEqual([]);
  });
  it('period-ovulation: invalid dates and out-of-range cycles give no steps, defaults are stated', () => {
    expect(steps(periodOvulation, { lmpDate: '2026-02-31', cycleLength: '28', periodLength: '5' })).toEqual([]);
    expect(steps(periodOvulation, { lmpDate: '', cycleLength: '28', periodLength: '5' })).toEqual([]);
    expect(steps(periodOvulation, { lmpDate: '2026-03-15', cycleLength: '12', periodLength: '5' })).toEqual([]);
    expect(steps(periodOvulation, { lmpDate: '2026-03-15', cycleLength: '99', periodLength: '5' })).toEqual([]);
    const s = steps(periodOvulation, { lmpDate: '2026-03-15', cycleLength: '', periodLength: '', lutealPhase: '' });
    expect(s[0].expr).toBe('28 − 14 = 14 days after the first day of the period');
    expect(s[0].note).toMatch(/default of 14/);
    expect(strip(s[2].expr)).toBe('5 − 1 = 4 days after the first day');
  });
  it('period-ovulation: steps match the displayed ovulation date when the entered cycle is the current one', () => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    const p = (n: number) => String(n).padStart(2, '0');
    const v = { lmpDate: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, cycleLength: '30', periodLength: '5', lutealPhase: '13' };
    const row = getValue(periodOvulation.calculate(v), 'ovulationDate').split(' (')[0];
    expect(steps(periodOvulation, v)[3].expr).toContain(`ovulation ${row}`);
  });
  it('pig-gestation: breed and parity adjustments combine, invalid dates give no steps', () => {
    expect(exprs(pigGestation, { breedingDate: '2026-01-01', breedType: 'large', parity: 'gilt' })[0]).toBe('114 + 1 (heritage / large breed) + 0 (other parities) = 115 days');
    expect(exprs(pigGestation, { breedingDate: '2026-01-01', breedType: 'mini', parity: 'olderSow' })[0]).toBe('114 + 0 (other breed types) + 1 (sow with 6+ previous litters) = 115 days');
    expect(steps(pigGestation, { breedingDate: '2026-02-31' })).toEqual([]);
    expect(steps(pigGestation, { breedingDate: '' })).toEqual([]);
    const s = steps(pigGestation, { breedingDate: '2026-01-01' });
    expect(s.map((x) => x.label).join(' ')).not.toMatch(/progress|remaining|today/i);
  });
  it('pregnancy-calculator: matches the displayed due date and milestone rows', () => {
    const d = new Date();
    d.setDate(d.getDate() - 100);
    const p = (n: number) => String(n).padStart(2, '0');
    const v = { lmpDate: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, cycleLength: '33' };
    const r = pregnancyCalculator.calculate(v);
    const s = steps(pregnancyCalculator, v);
    expect(s[1].expr.endsWith(getValue(r, 'dueDate'))).toBe(true);
    expect(s[2].expr.endsWith(getValue(r, 'conceptionDate'))).toBe(true);
    expect(s[3].expr).toContain(getValue(r, 'endFirstTrimester'));
    expect(s[3].expr).toContain(getValue(r, 'viabilityDate').split(' — ')[0]);
    expect(s[3].expr).toContain(getValue(r, 'fullTermDate').split(' — ')[0]);
  });
  it('pregnancy-calculator: invalid dates, bad or fractional cycles give no steps; blank cycle means 28', () => {
    expect(steps(pregnancyCalculator, { lmpDate: '', cycleLength: '28' })).toEqual([]);
    expect(steps(pregnancyCalculator, { lmpDate: '2026-02-30', cycleLength: '28' })).toEqual([]);
    expect(steps(pregnancyCalculator, { lmpDate: '2026-01-15', cycleLength: '19' })).toEqual([]);
    expect(steps(pregnancyCalculator, { lmpDate: '2026-01-15', cycleLength: '46' })).toEqual([]);
    expect(steps(pregnancyCalculator, { lmpDate: '2026-01-15', cycleLength: 'abc' })).toEqual([]);
    expect(steps(pregnancyCalculator, { lmpDate: '2026-01-15', cycleLength: '28.5' })).toEqual([]);
    expect(exprs(pregnancyCalculator, { lmpDate: '2026-01-15', cycleLength: '' })[1]).toBe('January 15, 2026 + 280 days = Thursday, October 22, 2026');
  });
  it('pregnancy-calculator: no step names today, a trimester or gestational age', () => {
    const s = steps(pregnancyCalculator, { lmpDate: '2026-01-15', cycleLength: '28' });
    expect(s.map((x) => `${x.label} ${x.expr}`).join(' ')).not.toMatch(/today|trimester|weeks pregnant|to go|past due/i);
  });
  it('pregnancy-conception: the entered-date methods match the displayed rows', () => {
    const lmp = { method: 'lmp', lmpDate: '2026-01-10', cycleLength: '30' };
    const r = pregnancyConception.calculate(lmp);
    const e = steps(pregnancyConception, lmp);
    expect(e[0].expr.endsWith(getValue(r, 'ovulationDate'))).toBe(true);
    expect(e[1].expr).toBe(getValue(r, 'fertileWindow'));
    expect(e[2].expr).toBe(getValue(r, 'implantationWindow'));
    expect(e[3].expr.endsWith(getValue(r, 'estDueDate'))).toBe(true);
    const ivf = { method: 'ivf', ivfDate: '2026-03-01', embryoType: 'day5' };
    expect(steps(pregnancyConception, ivf)[1].expr.endsWith(getValue(pregnancyConception.calculate(ivf), 'ivfDueDate'))).toBe(true);
    expect(steps(pregnancyConception, ivf)[2].expr.endsWith(getValue(pregnancyConception.calculate(ivf), 'ivfRetrieval'))).toBe(true);
    const due = { method: 'dueDate', targetDueDate: '2026-12-01' };
    const dr = pregnancyConception.calculate(due);
    expect(steps(pregnancyConception, due)[0].expr.endsWith(getValue(dr, 'conceptionDate'))).toBe(true);
    expect(steps(pregnancyConception, due)[1].expr.endsWith(getValue(dr, 'ovulationDate'))).toBe(true);
    expect(steps(pregnancyConception, due)[2].expr.endsWith(getValue(dr, 'lmpEstimated'))).toBe(true);
  });
  it('pregnancy-conception: the cycle method uses offsets from today and never prints a date', () => {
    const s = steps(pregnancyConception, { method: 'cycle', cycleLength: '28' });
    expect(s).toHaveLength(4);
    expect(s.map((x) => `${x.expr} ${x.note ?? ''}`).join(' ')).not.toMatch(/\d{4}/);
    expect(s[0].expr).toBe('today + (28 − 14) days = today + 14 days');
    expect(s[3].expr).toBe('today + 280 days');
  });
  it('pregnancy-conception: missing or invalid dates and out-of-range cycles give no steps', () => {
    expect(steps(pregnancyConception, { method: 'lmp', lmpDate: '', cycleLength: '28' })).toEqual([]);
    expect(steps(pregnancyConception, { method: 'lmp', lmpDate: '2026-04-31', cycleLength: '28' })).toEqual([]);
    expect(steps(pregnancyConception, { method: 'lmp', lmpDate: '2026-01-10', cycleLength: '50' })).toEqual([]);
    expect(steps(pregnancyConception, { method: 'nextPeriod', nextPeriodDate: 'x' })).toEqual([]);
    expect(steps(pregnancyConception, { method: 'ivf', ivfDate: '' })).toEqual([]);
    expect(steps(pregnancyConception, { method: 'dueDate', targetDueDate: '2026-13-01' })).toEqual([]);
  });
  it('pregnancy-gain: all four BMI categories and the week-0 / week-40 projections', () => {
    const base = { unit: 'metric', prepregnancyWeight: '50', currentWeight: '52', heightCm: '170', currentWeek: '10' };
    expect(exprs(pregnancyGain, base)[2]).toContain('Underweight (< 18.5) → 12.7 kg–18.1 kg');
    expect(exprs(pregnancyGain, { ...base, prepregnancyWeight: '80', currentWeight: '82' })[2]).toContain('Overweight (25–29.9) → 6.8 kg–11.3 kg');
    expect(exprs(pregnancyGain, { ...base, prepregnancyWeight: '100', currentWeight: '102' })[2]).toContain('Obese (≥ 30) → 5.0 kg–9.1 kg');
    expect(steps(pregnancyGain, { ...base, currentWeek: '12' })[4].note).toMatch(/unreliable/);
    expect(steps(pregnancyGain, { ...base, currentWeek: '24' })[4].note).toMatch(/rarely linear/);
  });
  it('pregnancy-gain: invalid inputs give no steps', () => {
    const ok = { unit: 'metric', prepregnancyWeight: '60', currentWeight: '65', heightCm: '165', currentWeek: '20' };
    expect(steps(pregnancyGain, { ...ok, heightCm: '' })).toEqual([]);
    expect(steps(pregnancyGain, { ...ok, prepregnancyWeight: '0' })).toEqual([]);
    expect(steps(pregnancyGain, { ...ok, currentWeek: '-1' })).toEqual([]);
    expect(steps(pregnancyGain, { ...ok, currentWeek: '' })).toEqual([]);
    expect(steps(pregnancyGain, { unit: 'imperial', prepregnancyWeight: '150', currentWeight: '160', heightFt: '', heightIn: '', currentWeek: '10' })).toEqual([]);
  });
});

describe('dog-cat-age float noise', () => {
  it('a 2.3-year-old dog is 25.5 traditional years, which rounds up to 26', async () => {
    const cfg = (await import('../../../src/calculators/health/dog-cat-age')).default;
    const rows = cfg.calculate({ species: 'dog', dogSize: 'medium', petAgeYears: '2.3' });
    expect(rows.find((r) => r.id === 'traditionalAge')?.value).toMatch(/^26/);
  });
});
