import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/pregnancy-gain/index';
import { getValue, getResult } from '../../helpers';

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
  // ── Audit regressions: IOM 2009 singleton table (Institute of Medicine, Weight Gain During Pregnancy) ──
  describe('Audit regressions (IOM 2009)', () => {
    const imp = (pre: string, cur: string, ft: string, inch: string, week: string) =>
      config.calculate({ unit: 'imperial', prepregnancyWeight: pre, currentWeight: cur, heightFt: ft, heightIn: inch, heightCm: '', currentWeek: week });

    it('table: totals 28-40 / 25-35 / 15-25 / 11-20 lb and weekly 1-1.3 / 0.8-1 / 0.5-0.7 / 0.4-0.6 lb; first trimester 1.1-4.4 lb (0.5-2 kg)', () => {
      // heights chosen so BMI lands in each class: 5ft4 -> 105 lb = 18.0, 140 lb = 24.0, 165 lb = 28.3, 200 lb = 34.3
      const rows: [string, string, string][] = [['105', '28–40 lbs', '1–1.3 lbs/week'], ['140', '25–35 lbs', '0.8–1 lbs/week'], ['165', '15–25 lbs', '0.5–0.7 lbs/week'], ['200', '11–20 lbs', '0.4–0.6 lbs/week']];
      for (const [w, total, weekly] of rows) {
        const r = imp(w, String(Number(w) + 10), '5', '4', '20');
        expect(getValue(r, 'totalRange')).toBe(total);
        expect(getValue(r, 'weeklyGain')).toBe(weekly);
        expect(getValue(r, 't1Gain')).toBe('1.1–4.4 lbs total');
      }
      const m = config.calculate({ unit: 'metric', prepregnancyWeight: '60', currentWeight: '65', heightFt: '', heightIn: '', heightCm: '165', currentWeek: '20' });
      expect(getValue(m, 't1Gain')).toBe('0.5–2.0 kg total');
      expect(getValue(m, 'totalRange')).toBe('11.3 kg–15.9 kg'); // 25-35 lb
    });

    it('BMI class follows the displayed value: 72.13 kg @ 170 cm = 24.9585 -> "25.0" -> Overweight (not Normal)', () => {
      const run = (kg: string) => config.calculate({ unit: 'metric', prepregnancyWeight: kg, currentWeight: String(Number(kg) + 5), heightFt: '', heightIn: '', heightCm: '170', currentWeek: '20' });
      expect(getValue(run('72.13'), 'bmiCategory')).toBe('BMI 25.0 — Overweight (25–29.9)');
      expect(getValue(run('72'), 'bmiCategory')).toBe('BMI 24.9 — Normal (18.5–24.9)');
      expect(getValue(run('72.13'), '_category')).toBe('overweight');
    });

    it('worked example 1: 140 lb, 5ft5, week 20, now 155 -> BMI 23.3, above range (expected 6.7-11.4 lb), projected 30 lb', () => {
      const r = imp('140', '155', '5', '5', '20');
      expect(getValue(r, 'bmiCategory')).toBe('BMI 23.3 — Normal (18.5–24.9)');
      expect(getValue(r, 'gainStatus')).toBe('Above Recommended Range');
      expect(getValue(r, 'projectedGain')).toBe('30 lbs'); // 15 / 20 * 40
    });

    it('worked example 2: 105 lb, 5ft4, week 30, now 127 -> BMI 18.0, within range (expected 18.1-26.5 lb), projected 29 lb', () => {
      const r = imp('105', '127', '5', '4', '30');
      expect(getValue(r, 'bmiCategory')).toBe('BMI 18.0 — Underweight (< 18.5)');
      expect(getValue(r, 'gainStatus')).toBe('Within Recommended Range');
      expect(getValue(r, 'projectedGain')).toBe('29 lbs'); // 22 / 30 * 40 = 29.3
    });

    it('worked example 3: 220 lb, 5ft7, week 16, now 223 -> BMI 34.5, within range (2.3-6.2 lb expected), weekly 0.4-0.6', () => {
      const r = imp('220', '223', '5', '7', '16');
      expect(getValue(r, 'bmiCategory')).toBe('BMI 34.5 — Obese (≥ 30)');
      expect(getValue(r, 'gainStatus')).toBe('Within Recommended Range');
      expect(getValue(r, 'weeklyGain')).toBe('0.4–0.6 lbs/week');
    });

    it('status bounds at week 20, normal BMI: expected 1.1 + 7*0.8 = 6.7 to 4.4 + 7*1.0 = 11.4 lb', () => {
      const st = (gain: number) => getValue(imp('140', String(140 + gain), '5', '5', '20'), 'gainStatus');
      expect(st(6.5)).toBe('Below Recommended Range');
      expect(st(6.8)).toBe('Within Recommended Range');
      expect(st(11.3)).toBe('Within Recommended Range');
      expect(st(11.5)).toBe('Above Recommended Range');
    });

    it('first-trimester rule through week 13: 4.3 lb within, 4.5 lb above, 1.0 lb below (IOM 1.1-4.4)', () => {
      const st = (gain: number) => getValue(imp('140', String(140 + gain), '5', '5', '13'), 'gainStatus');
      expect(st(4.3)).toBe('Within Recommended Range');
      expect(st(4.5)).toBe('Above Recommended Range');
      expect(st(1.0)).toBe('Below Recommended Range');
    });

    it('projection at/after week 40 is the gain so far (week 42 used to project below it); early weeks carry a caveat', () => {
      const r = imp('140', '170', '5', '5', '42');
      expect(getValue(r, 'projectedGain')).toBe('30 lbs');
      expect(getResult(imp('140', '143', '5', '5', '8'), 'projectedGain').interpretation).toContain('before week 14');
      expect(getResult(imp('140', '155', '5', '5', '20'), 'projectedGain').interpretation).not.toContain('before week 14');
    });

    it('twin figures quoted in the text match IOM (37-54 normal, 31-50 overweight, 25-42 obese; none for underweight)', () => {
      const text = JSON.stringify(config.educational);
      expect(text).toContain('37–54');
      expect(text).toContain('31–50');
      expect(text).toContain('25–42');
      expect(text).not.toContain('Underweight/Normal BMI: 37–54');
    });

    it('bounds are realistic for both unit systems and height fields follow the unit', () => {
      const f = (id: string) => config.inputs.find((i) => i.id === id)!;
      expect(f('prepregnancyWeight').max).toBeGreaterThanOrEqual(1000);
      expect(f('currentWeight').min).toBeGreaterThan(0);
      expect(f('heightCm').max).toBeLessThanOrEqual(275);
      expect(f('heightFt').showWhen!({ unit: 'metric' })).toBe(false);
      expect(f('heightCm').showWhen!({ unit: 'imperial' })).toBe(false);
    });
  });
});
