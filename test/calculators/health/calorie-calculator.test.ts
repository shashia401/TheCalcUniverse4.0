import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/calorie-calculator/index';
import { getResult, getValue, parseNumber } from '../../helpers';

describe('Calorie Calculator', () => {
  // ── Golden path ──────────────────────────────────────────────────────────

  it('calculates BMR, TDEE, and BMI for valid metric male inputs', () => {
    const r = config.calculate({
      unit: 'metric',
      gender: 'male',
      age: '30',
      weight: '80',
      heightCm: '180',
      heightFt: '',
      heightIn: '',
      activityLevel: '1.55',
      dailyIntake: '',
    });

    // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    const bmr = parseNumber(getValue(r, 'bmr'));
    expect(bmr).toBeCloseTo(1780, -1); // within ~10

    // TDEE = 1780 * 1.55 = 2759
    const tdee = parseNumber(getValue(r, 'tdee'));
    expect(tdee).toBeCloseTo(2759, -1);

    // BMI = 80 / (1.8^2) = 80 / 3.24 = 24.69
    const bmi = parseNumber(getValue(r, 'bmi'));
    expect(bmi).toBeCloseTo(24.69, 0);

    expect(getValue(r, 'maintenance')).toContain('kcal');
  });

  // ── BMR male / female ────────────────────────────────────────────────────

  it('calculates correct male BMR using Mifflin-St Jeor', () => {
    const r = config.calculate({
      unit: 'metric',
      gender: 'male',
      age: '25',
      weight: '70',
      heightCm: '175',
      heightFt: '',
      heightIn: '',
      activityLevel: '1.2',
      dailyIntake: '',
    });

    // BMR = 10*70 + 6.25*175 - 5*25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75
    const bmr = parseNumber(getValue(r, 'bmr'));
    expect(bmr).toBeCloseTo(1674, -1);
  });

  it('calculates correct female BMR using Mifflin-St Jeor', () => {
    const r = config.calculate({
      unit: 'metric',
      gender: 'female',
      age: '25',
      weight: '60',
      heightCm: '165',
      heightFt: '',
      heightIn: '',
      activityLevel: '1.2',
      dailyIntake: '',
    });

    // BMR = 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
    const bmr = parseNumber(getValue(r, 'bmr'));
    expect(bmr).toBeCloseTo(1345, -1);
  });

  it('calculates BMR with imperial units', () => {
    const r = config.calculate({
      unit: 'imperial',
      gender: 'male',
      age: '30',
      weight: '176', // ~80 kg
      heightFt: '5',
      heightIn: '11', // ~180 cm
      heightCm: '',
      activityLevel: '1.2',
      dailyIntake: '',
    });

    const bmr = parseNumber(getValue(r, 'bmr'));
    // 80 kg * 0.453592 = 79.8; (5*12+11)*2.54 = 180.3
    // BMR ≈ 10*79.8 + 6.25*180.3 - 5*30 + 5 ≈ 798 + 1127 - 150 + 5 ≈ 1780
    expect(bmr).toBeGreaterThan(1500);
    expect(bmr).toBeLessThan(2500);
  });

  // ── Different activity levels ──────────────────────────────────────────────

  it('produces higher TDEE for higher activity levels', () => {
    const baseValues = {
      unit: 'metric',
      gender: 'male',
      age: '30',
      weight: '80',
      heightCm: '180',
      heightFt: '',
      heightIn: '',
      dailyIntake: '',
    };

    const sedentary = config.calculate({ ...baseValues, activityLevel: '1.2' });
    const active = config.calculate({ ...baseValues, activityLevel: '1.725' });

    const tdeeSedentary = parseNumber(getValue(sedentary, 'tdee'));
    const tdeeActive = parseNumber(getValue(active, 'tdee'));

    expect(tdeeActive).toBeGreaterThan(tdeeSedentary);
    // 1.725 / 1.2 = 1.4375x
    expect(tdeeActive / tdeeSedentary).toBeCloseTo(1.4375, 0);
  });

  // ── Daily intake → deficit / surplus ─────────────────────────────────────

  it('shows deficit when intake is below TDEE', () => {
    const r = config.calculate({
      unit: 'metric',
      gender: 'male',
      age: '30',
      weight: '80',
      heightCm: '180',
      heightFt: '',
      heightIn: '',
      activityLevel: '1.55',
      dailyIntake: '2000',
    });

    const tdee = parseNumber(getValue(r, 'tdee'));
    const diff = parseNumber(getValue(r, 'calorieDifference'));
    expect(tdee).toBeGreaterThan(2000);
    expect(diff).toBeGreaterThan(0); // deficit = 2000 - tdee is negative, but we show absolute
    // Weekly weight change should be negative (deficit)
    expect(getValue(r, 'weeklyWeightChange')).toContain('-');
    expect(getValue(r, 'calorieDifference')).toContain('kcal');
  });

  it('shows surplus when intake is above TDEE', () => {
    const r = config.calculate({
      unit: 'metric',
      gender: 'male',
      age: '30',
      weight: '80',
      heightCm: '180',
      heightFt: '',
      heightIn: '',
      activityLevel: '1.2',
      dailyIntake: '3000',
    });

    // TDEE ≈ 1780 * 1.2 = 2136
    const tdee = parseNumber(getValue(r, 'tdee'));
    expect(tdee).toBeLessThan(3000);
    const diffResult = getResult(r, 'calorieDifference');
    expect(diffResult.label).toContain('Surplus');
    expect(getValue(r, 'weeklyWeightChange')).toContain('+');
  });

  it('does not include deficit/surplus results when intake is empty', () => {
    const r = config.calculate({
      unit: 'metric',
      gender: 'male',
      age: '30',
      weight: '80',
      heightCm: '180',
      heightFt: '',
      heightIn: '',
      activityLevel: '1.55',
      dailyIntake: '',
    });

    const ids = r.map((x) => x.id);
    expect(ids).not.toContain('calorieDifference');
    expect(ids).not.toContain('weeklyWeightChange');
  });

  // ── Invalid inputs ──────────────────────────────────────────────────────

  it('returns empty array for missing required fields', () => {
    const r = config.calculate({});
    expect(r).toEqual([]);
  });

  it('returns empty array for zero weight', () => {
    const r = config.calculate({
      unit: 'metric',
      gender: 'male',
      age: '30',
      weight: '0',
      heightCm: '180',
      heightFt: '',
      heightIn: '',
      activityLevel: '1.55',
      dailyIntake: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for zero height', () => {
    const r = config.calculate({
      unit: 'metric',
      gender: 'male',
      age: '30',
      weight: '80',
      heightCm: '0',
      heightFt: '',
      heightIn: '',
      activityLevel: '1.55',
      dailyIntake: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for non-numeric age', () => {
    const r = config.calculate({
      unit: 'metric',
      gender: 'male',
      age: 'abc',
      weight: '80',
      heightCm: '180',
      heightFt: '',
      heightIn: '',
      activityLevel: '1.55',
      dailyIntake: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for missing imperial height fields', () => {
    const r = config.calculate({
      unit: 'imperial',
      gender: 'male',
      age: '30',
      weight: '176',
      heightFt: '',
      heightIn: '',
      heightCm: '',
      activityLevel: '1.55',
      dailyIntake: '',
    });
    expect(r).toEqual([]);
  });

  // ── Educational content ──────────────────────────────────────────────────

  it('has a formula string', () => {
    expect(config.educational.formula).toBeTruthy();
    expect(config.educational.formula!.length).toBeGreaterThan(0);
  });

  it('has formulaDescription of at least 100 characters', () => {
    expect(config.educational.formulaDescription).toBeTruthy();
    expect(config.educational.formulaDescription!.length).toBeGreaterThanOrEqual(100);
  });

  it('has exactly 4 variables', () => {
    expect(config.educational.variables).toHaveLength(4);
    for (const v of config.educational.variables!) {
      expect(v.symbol).toBeTruthy();
      expect(v.name).toBeTruthy();
      expect(v.description).toBeTruthy();
    }
  });

  it('has exactly 5 how-to-use steps', () => {
    expect(config.educational.howToUse).toHaveLength(5);
    for (const step of config.educational.howToUse!) {
      expect(step.length).toBeGreaterThan(0);
    }
  });

  it('has explanation of at least 300 characters', () => {
    expect(config.educational.explanation).toBeTruthy();
    expect(config.educational.explanation!.length).toBeGreaterThanOrEqual(300);
  });

  it('has exactly 7 FAQs', () => {
    expect(config.educational.faqs).toHaveLength(7);
    for (const faq of config.educational.faqs!) {
      expect(faq.question).toBeTruthy();
      expect(faq.answer).toBeTruthy();
    }
  });

  it('has 4 citations (CDC, NIH, Mifflin, AND)', () => {
    expect(config.educational.citations).toHaveLength(4);
    expect(config.educational.citations![0].source).toBeTruthy();
    expect(config.educational.citations![0].url).toBeTruthy();
  });

  it('has an SVG diagram with viewBox 440 340', () => {
    expect(config.educational.diagram).toBeTruthy();
    expect(config.educational.diagram!.svg).toContain('viewBox="0 0 440 340"');
    expect(config.educational.diagram!.alt).toBeTruthy();
    expect(config.educational.diagram!.caption).toBeTruthy();
  });

  it('has quickReference with 7 reference items', () => {
    expect(config.educational.quickReference).toHaveLength(7);
  });

  it('has 4 common uses', () => {
    expect(config.educational.commonUses).toHaveLength(4);
  });

  it('has 3 worked examples with real scenarios', () => {
    expect(config.educational.workedExamples).toHaveLength(3);
    for (const we of config.educational.workedExamples!) {
      expect(we.scenario).toBeTruthy();
      expect(we.inputs).toBeDefined();
      expect(Object.keys(we.inputs).length).toBeGreaterThanOrEqual(1);
      expect(we.result).toBeTruthy();
      expect(we.insight).toBeTruthy();
    }
  });

  it('has 6 pro tips', () => {
    expect(config.educational.proTips).toHaveLength(6);
    for (const tip of config.educational.proTips!) {
      expect(tip.length).toBeGreaterThan(0);
    }
  });

  it('has limitations with real content', () => {
    expect(config.educational.limitations.length).toBeGreaterThan(0);
    expect(config.educational.limitations.every((l: string) => l.length > 20)).toBe(true);
  });

  it('has historical context in explanation', () => {
    const explanation = config.educational.explanation || '';
    // Should mention historical events, dates, or researchers
    const hasHistory = /\b(19th|20th|1919|1990|Benedict|Harris|Mifflin|St Jeor|Carnegie)\b/.test(explanation);
    expect(hasHistory).toBe(true);
  });

  it('has BLUF definition in first sentence of explanation', () => {
    const explanation = config.educational.explanation || '';
    const firstSentence = explanation.split(/[.!?]\s/)[0] || '';
    expect(firstSentence.length).toBeGreaterThanOrEqual(20);
    expect(firstSentence).toMatch(/\b(is|are|refers to|measures|calculates|defined as)\b/i);
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  it('handles age 18', () => {
    const r = config.calculate({
      unit: 'metric',
      gender: 'female',
      age: '18',
      weight: '55',
      heightCm: '163',
      heightFt: '',
      heightIn: '',
      activityLevel: '1.375',
      dailyIntake: '',
    });
    expect(r.length).toBeGreaterThan(0);
    const bmr = parseNumber(getValue(r, 'bmr'));
    // BMR = 10*55 + 6.25*163 - 5*18 - 161 = 550 + 1018.75 - 90 - 161 = 1317.75
    expect(bmr).toBeCloseTo(1318, -1);
  });

  it('handles age 100', () => {
    const r = config.calculate({
      unit: 'metric',
      gender: 'male',
      age: '100',
      weight: '65',
      heightCm: '170',
      heightFt: '',
      heightIn: '',
      activityLevel: '1.2',
      dailyIntake: '',
    });
    expect(r.length).toBeGreaterThan(0);
    const bmr = parseNumber(getValue(r, 'bmr'));
    expect(bmr).toBeGreaterThan(0);
  });

  it('handles extreme weight', () => {
    const r = config.calculate({
      unit: 'metric',
      gender: 'male',
      age: '30',
      weight: '200',
      heightCm: '190',
      heightFt: '',
      heightIn: '',
      activityLevel: '1.55',
      dailyIntake: '',
    });
    expect(r.length).toBeGreaterThan(0);
    const tdee = parseNumber(getValue(r, 'tdee'));
    expect(tdee).toBeGreaterThan(3000);
  });
});
