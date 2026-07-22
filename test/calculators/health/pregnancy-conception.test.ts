import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/pregnancy-conception/index';
import { getValue } from '../../helpers';

describe('Conception / Fertile Window calculator', () => {
  it('calculates fertile window from LMP', () => {
    const r = config.calculate({
      method: 'lmp',
      lmpDate: '2026-01-01',
      nextPeriodDate: '',
      cycleLength: '28',
      periodLength: '5',
    });
    expect(getValue(r, 'ovulationDate')).toContain('2026');
    expect(getValue(r, 'fertileWindow')).toContain('→');
    expect(getValue(r, 'peakFertility')).toContain('→');
  });

  it('calculates from next expected period', () => {
    const r = config.calculate({
      method: 'nextPeriod',
      lmpDate: '',
      nextPeriodDate: '2026-02-01',
      cycleLength: '28',
      periodLength: '5',
    });
    expect(getValue(r, 'ovulationDate')).toContain('2026');
    expect(getValue(r, 'fertileWindow')).toContain('→');
  });

  it('calculates implantation window', () => {
    const r = config.calculate({
      method: 'lmp',
      lmpDate: '2026-01-15',
      nextPeriodDate: '',
      cycleLength: '28',
      periodLength: '5',
    });
    expect(getValue(r, 'implantationWindow')).toContain('→');
  });

  it('returns estimated due date if conceived', () => {
    const r = config.calculate({
      method: 'lmp',
      lmpDate: '2026-01-15',
      nextPeriodDate: '',
      cycleLength: '28',
      periodLength: '5',
    });
    expect(getValue(r, 'estDueDate')).toContain('2026');
  });

  it('returns empty for missing LMP date', () => {
    const r = config.calculate({
      method: 'lmp',
      lmpDate: '',
      nextPeriodDate: '',
      cycleLength: '28',
      periodLength: '5',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid date', () => {
    const r = config.calculate({
      method: 'lmp',
      lmpDate: 'invalid',
      nextPeriodDate: '',
      cycleLength: '28',
      periodLength: '5',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing IVF date', () => {
    const r = config.calculate({
      method: 'ivf',
      lmpDate: '',
      nextPeriodDate: '',
      ivfDate: '',
      embryoType: 'day5',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid IVF date', () => {
    const r = config.calculate({
      method: 'ivf',
      lmpDate: '',
      nextPeriodDate: '',
      ivfDate: 'not-a-date',
      embryoType: 'day5',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing target due date', () => {
    const r = config.calculate({
      method: 'dueDate',
      lmpDate: '',
      nextPeriodDate: '',
      targetDueDate: '',
    });
    expect(r).toEqual([]);
  });

  it('calculates IVF day 5 due date correctly', () => {
    const r = config.calculate({
      method: 'ivf',
      lmpDate: '',
      nextPeriodDate: '',
      ivfDate: '2026-03-15',
      embryoType: 'day5',
    });
    expect(getValue(r, 'ivfDueDate')).toContain('2026');
    const dueDate = r.find((x) => x.id === 'ivfDueDate');
    // Transfer March 15 + 261 days = December 1, 2026
    expect(dueDate?.value).toContain('December');
    expect(dueDate?.value).toContain('2026');
  });

  it('calculates IVF day 3 due date correctly', () => {
    const r = config.calculate({
      method: 'ivf',
      lmpDate: '',
      nextPeriodDate: '',
      ivfDate: '2026-03-15',
      embryoType: 'day3',
    });
    const dueDate = r.find((x) => x.id === 'ivfDueDate');
    // Transfer March 15 + 263 days = December 3, 2026
    expect(dueDate?.value).toContain('December');
  });

  it('shows fertile days status when in fertile window', () => {
    // Calculate based on recent LMP to test fertile window logic
    const today = new Date();
    const lmpDate = new Date(today);
    lmpDate.setDate(lmpDate.getDate() - 10); // 10 days ago ~ near ovulation
    const dateStr = lmpDate.toISOString().split('T')[0];

    const r = config.calculate({
      method: 'lmp',
      lmpDate: dateStr,
      nextPeriodDate: '',
      cycleLength: '28',
      periodLength: '5',
    });
    const fertileDays = getValue(r, 'fertileDays');
    expect(fertileDays).toBeTruthy();
    expect(typeof fertileDays).toBe('string');
  });

  it('shows days until ovulation countdown', () => {
    const r = config.calculate({
      method: 'lmp',
      lmpDate: '2026-01-01',
      nextPeriodDate: '',
      cycleLength: '28',
      periodLength: '5',
    });
    const daysUntil = getValue(r, 'daysUntilOvulation');
    expect(daysUntil).toContain('days');
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
