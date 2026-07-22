import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/pregnancy-gain/index';
import { getValue } from '../../helpers';

describe('Pregnancy Weight Gain calculator', () => {
  it('calculates IOM category for normal BMI', () => {
    const r = config.calculate({
      unit: 'imperial',
      prepregnancyWeight: '140',
      currentWeight: '155',
      heightFt: '5',
      heightIn: '5',
      heightCm: '',
      currentWeek: '20',
    });
    expect(getValue(r, 'bmiCategory')).toContain('Normal');
    expect(getValue(r, 'totalRange')).toContain('lbs');
  });

  it('classifies underweight BMI correctly', () => {
    const r = config.calculate({
      unit: 'metric',
      prepregnancyWeight: '50',
      currentWeight: '55',
      heightFt: '',
      heightIn: '',
      heightCm: '170',
      currentWeek: '20',
    });
    expect(getValue(r, 'bmiCategory')).toContain('Underweight');
  });

  it('classifies obese BMI correctly', () => {
    const r = config.calculate({
      unit: 'imperial',
      prepregnancyWeight: '220',
      currentWeight: '225',
      heightFt: '5',
      heightIn: '4',
      heightCm: '',
      currentWeek: '16',
    });
    expect(getValue(r, 'bmiCategory')).toContain('Obese');
  });

  it('shows gain so far and status', () => {
    const r = config.calculate({
      unit: 'imperial',
      prepregnancyWeight: '150',
      currentWeight: '170',
      heightFt: '5',
      heightIn: '6',
      heightCm: '',
      currentWeek: '30',
    });
    expect(getValue(r, 'gainSoFar')).toContain('lbs');
    expect(getValue(r, 'gainStatus')).toBeTruthy();
  });

  it('returns weekly gain target', () => {
    const r = config.calculate({
      unit: 'metric',
      prepregnancyWeight: '65',
      currentWeight: '70',
      heightFt: '',
      heightIn: '',
      heightCm: '165',
      currentWeek: '25',
    });
    expect(getValue(r, 'weeklyGain')).toBeTruthy();
  });

  it('returns projected total gain', () => {
    const r = config.calculate({
      unit: 'imperial',
      prepregnancyWeight: '140',
      currentWeight: '155',
      heightFt: '5',
      heightIn: '5',
      heightCm: '',
      currentWeek: '20',
    });
    expect(getValue(r, 'projectedGain')).toContain('lbs');
  });

  it('returns empty for invalid height', () => {
    const r = config.calculate({
      unit: 'imperial',
      prepregnancyWeight: '140',
      currentWeight: '155',
      heightFt: '0',
      heightIn: '0',
      heightCm: '',
      currentWeek: '20',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for metric with zero height', () => {
    const r = config.calculate({
      unit: 'metric',
      prepregnancyWeight: '65',
      currentWeight: '70',
      heightFt: '',
      heightIn: '',
      heightCm: '0',
      currentWeek: '20',
    });
    expect(r).toEqual([]);
  });

  it('classifies overweight BMI correctly', () => {
    const r = config.calculate({
      unit: 'imperial',
      prepregnancyWeight: '165',
      currentWeight: '175',
      heightFt: '5',
      heightIn: '4',
      heightCm: '',
      currentWeek: '20',
    });
    expect(getValue(r, 'bmiCategory')).toContain('Overweight');
  });

  it('returns first trimester target', () => {
    const r = config.calculate({
      unit: 'imperial',
      prepregnancyWeight: '140',
      currentWeight: '142',
      heightFt: '5',
      heightIn: '5',
      heightCm: '',
      currentWeek: '8',
    });
    expect(getValue(r, 't1Gain')).toContain('lbs');
  });

  // ── Educational content ───────────────────────────────────────────
  it('has all required educational sections', () => {
    const edu = config.educational;
    expect(edu.formula).toBeTruthy();
    expect(edu.formulaDescription).toBeTruthy();
    expect(edu.howToUse).toBeTruthy();
    expect(edu.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(edu.explanation).toBeTruthy();
    expect(edu.diagram).toBeTruthy();
    expect(edu.diagram!.svg).toBeTruthy();
  });

  it('has at least 5 FAQs', () => {
    const faqs = config.educational.faqs;
    expect(faqs).toBeDefined();
    expect(faqs!.length).toBeGreaterThanOrEqual(5);
    faqs!.forEach((faq) => {
      expect(faq.question.length).toBeGreaterThan(10);
      expect(faq.answer.length).toBeGreaterThan(50);
    });
  });

  it('has at least 3 worked examples', () => {
    const examples = config.educational.workedExamples;
    expect(examples).toBeDefined();
    expect(examples!.length).toBeGreaterThanOrEqual(3);
    examples!.forEach((ex) => {
      expect(ex.scenario.length).toBeGreaterThan(20);
      expect(Object.keys(ex.inputs).length).toBeGreaterThanOrEqual(2);
      expect(ex.result.length).toBeGreaterThan(10);
      expect(ex.insight.length).toBeGreaterThan(50);
    });
  });

  it('has at least 4 pro tips', () => {
    const tips = config.educational.proTips;
    expect(tips).toBeDefined();
    expect(tips!.length).toBeGreaterThanOrEqual(4);
    tips!.forEach((tip) => {
      expect(tip.length).toBeGreaterThan(50);
    });
  });

  it('has limitations section with at least 4 items', () => {
    const lims = config.educational.limitations;
    expect(lims).toBeDefined();
    expect(lims!.length).toBeGreaterThanOrEqual(4);
    lims!.forEach((lim) => {
      expect(lim.length).toBeGreaterThan(20);
    });
  });

  it('has quickReference with at least 3 entries', () => {
    const qref = config.educational.quickReference;
    expect(qref).toBeDefined();
    expect(qref!.length).toBeGreaterThanOrEqual(3);
    qref!.forEach((entry) => {
      expect(entry.label.length).toBeGreaterThan(0);
      expect(entry.value.length).toBeGreaterThan(0);
    });
  });

  it('has at least 3 citations with valid URLs', () => {
    const cites = config.educational.citations;
    expect(cites).toBeDefined();
    expect(cites!.length).toBeGreaterThanOrEqual(3);
    cites!.forEach((c) => {
      expect(c.url).toMatch(/^https?:\/\//);
    });
  });

  it('has inputMode set on number fields', () => {
    const numInputs = config.inputs.filter((i) => i.type === 'number');
    expect(numInputs.length).toBeGreaterThanOrEqual(1);
    numInputs.forEach((input) => {
      expect(input.inputMode).toBe('decimal');
    });
  });

  it('has commonUses with at least 3 entries', () => {
    const uses = config.educational.commonUses;
    expect(uses).toBeDefined();
    expect(uses!.length).toBeGreaterThanOrEqual(3);
  });
});
