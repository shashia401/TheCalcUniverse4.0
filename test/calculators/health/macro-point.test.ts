import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/macro-point/index';
import { getValue } from '../../helpers';

describe('Macro Point calculator', () => {
  it('calculates points for a food', () => {
    const r = config.calculate({
      foodName: 'Chicken Salad',
      calories: '350',
      satFat: '5',
      sugar: '8',
      protein: '30',
    });
    const pts = parseFloat(getValue(r, 'macroPoints'));
    expect(pts).toBeGreaterThan(0);
    expect(pts).toBeLessThan(20);
  });

  it('returns higher points for high-sugar food', () => {
    const r = config.calculate({
      calories: '500', satFat: '10', sugar: '30', protein: '5',
    });
    const pts = parseFloat(getValue(r, 'macroPoints'));
    expect(pts).toBeGreaterThan(10);
  });

  it('returns points category', () => {
    const r = config.calculate({
      calories: '150', satFat: '1', sugar: '5', protein: '20',
    });
    expect(getValue(r, 'pointsCategory')).toBeTruthy();
  });

  it('returns macro breakdown components', () => {
    const r = config.calculate({
      calories: '400', satFat: '8', sugar: '12', protein: '25',
    });
    expect(getValue(r, 'caloriePoints')).toContain('pts');
    expect(getValue(r, 'satFatPoints')).toContain('pts');
    expect(getValue(r, 'sugarPoints')).toContain('pts');
    expect(getValue(r, 'proteinCredit')).toContain('pts');
  });

  it('returns daily allowance guide', () => {
    const r = config.calculate({
      calories: '350', satFat: '5', sugar: '10', protein: '20',
    });
    expect(getValue(r, 'dailyAllowance')).toContain('budget');
  });

  it('returns empty for missing inputs', () => {
    const r = config.calculate({
      calories: '-1', satFat: '0', sugar: '0', protein: '0',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for NaN inputs', () => {
    const r = config.calculate({
      calories: '', satFat: '', sugar: '', protein: '',
    });
    expect(r).toEqual([]);
  });

  it('shows food name in result when provided', () => {
    const r = config.calculate({
      foodName: 'Greek Yogurt',
      calories: '100', satFat: '0', sugar: '4', protein: '18',
    });
    const pts = r.find((x) => x.id === 'macroPoints');
    expect(pts?.label).toContain('Greek Yogurt');
  });

  it('shows generic label when food name not provided', () => {
    const r = config.calculate({
      calories: '100', satFat: '0', sugar: '4', protein: '18',
    });
    const pts = r.find((x) => x.id === 'macroPoints');
    expect(pts?.label).toContain('Macro Points');
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
});
