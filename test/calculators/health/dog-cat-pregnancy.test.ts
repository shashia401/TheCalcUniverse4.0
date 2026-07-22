import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/dog-cat-pregnancy/index';
import { getValue } from '../../helpers';

describe('Dog/Cat Pregnancy Whelping Calculator', () => {
  // ── Core calculations ──────────────────────────────────────────────
  it('calculates dog pregnancy due date 63 days from breeding date', () => {
    const r = config.calculate({
      species: 'dog',
      breedingDate: '2026-01-01',
    });
    const dueDate = getValue(r, 'dueDate');
    // 63 days from Jan 1 = March 5, 2026 (Jan has 31 days, Feb has 28 in 2026)
    expect(dueDate).toContain('March');
    expect(dueDate).toContain('5');
    expect(dueDate).toContain('2026');
  });

  it('calculates cat pregnancy due date 65 days from breeding date', () => {
    const r = config.calculate({
      species: 'cat',
      breedingDate: '2026-01-01',
    });
    const dueDate = getValue(r, 'dueDate');
    // 65 days from Jan 1 = March 7, 2026
    expect(dueDate).toContain('March');
    expect(dueDate).toContain('7');
    expect(dueDate).toContain('2026');
  });

  it('returns gestation length for dog with full range', () => {
    const r = config.calculate({
      species: 'dog',
      breedingDate: '2026-04-01',
    });
    const gestation = getValue(r, 'gestationLength');
    expect(gestation).toContain('63');
    expect(gestation).toContain('58');
    expect(gestation).toContain('68');
  });

  it('returns gestation length for cat with full range', () => {
    const r = config.calculate({
      species: 'cat',
      breedingDate: '2026-04-01',
    });
    const gestation = getValue(r, 'gestationLength');
    expect(gestation).toContain('65');
    expect(gestation).toContain('63');
    expect(gestation).toContain('67');
  });

  // ── Edge cases & validation ───────────────────────────────────────
  it('returns empty array when breeding date is empty', () => {
    const r = config.calculate({
      species: 'dog',
      breedingDate: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when breeding date is missing entirely', () => {
    const r = config.calculate({
      species: 'cat',
      breedingDate: '',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when species is missing', () => {
    const r = config.calculate({
      species: '',
      breedingDate: '2026-01-01',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for invalid species value', () => {
    const r = config.calculate({
      species: 'bird',
      breedingDate: '2026-01-01',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for invalid date string', () => {
    const r = config.calculate({
      species: 'dog',
      breedingDate: 'not-a-date',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array when both inputs are missing', () => {
    const r = config.calculate({
      species: '',
      breedingDate: '',
    });
    expect(r).toEqual([]);
  });

  // ── Additional outputs ────────────────────────────────────────────
  it('returns week-by-week calendar for dog', () => {
    const r = config.calculate({
      species: 'dog',
      breedingDate: '2026-04-01',
    });
    const calendar = getValue(r, 'weekCalendar');
    expect(calendar).toContain('Week 1');
    expect(calendar).toContain('Week 9');
    expect(calendar).toContain('–');
  });

  it('returns week-by-week calendar for cat', () => {
    const r = config.calculate({
      species: 'cat',
      breedingDate: '2026-04-01',
    });
    const calendar = getValue(r, 'weekCalendar');
    expect(calendar).toContain('Week 1');
    expect(calendar).toContain('Week 10');
  });

  it('returns trimester information', () => {
    const today = new Date();
    const breedingDate = new Date(today);
    breedingDate.setDate(breedingDate.getDate() - 32); // 32 days ago -> Mid trimester
    const dateStr = breedingDate.toISOString().split('T')[0];
    const r = config.calculate({
      species: 'cat',
      breedingDate: dateStr,
    });
    const trimester = getValue(r, 'trimester');
    expect(trimester).toContain('Mid');
    expect(trimester).toContain('Days 22–42');
  });

  it('returns due date range with en-dash separator', () => {
    const r = config.calculate({
      species: 'dog',
      breedingDate: '2026-04-01',
    });
    const range = getValue(r, 'dueDateRange');
    expect(range).toContain('2026');
    expect(range).toContain('–');
  });

  it('shows correct label for dog (whelping)', () => {
    const r = config.calculate({
      species: 'dog',
      breedingDate: '2026-04-01',
    });
    const dueDate = r.find((x) => x.id === 'dueDate');
    expect(dueDate?.label).toContain('Whelping');
  });

  it('shows correct label for cat (queening)', () => {
    const r = config.calculate({
      species: 'cat',
      breedingDate: '2026-04-01',
    });
    const dueDate = r.find((x) => x.id === 'dueDate');
    expect(dueDate?.label).toContain('Queening');
  });

  it('shows days remaining as positive for future due date', () => {
    // Use a date that results in a due date in the future
    const today = new Date();
    const breedingDate = new Date(today);
    breedingDate.setDate(breedingDate.getDate() - 30); // 30 days ago
    const dateStr = breedingDate.toISOString().split('T')[0];

    const r = config.calculate({
      species: 'dog',
      breedingDate: dateStr,
    });
    const daysVal = getValue(r, 'daysRemaining');
    expect(daysVal).toContain('days');
    expect(daysVal).not.toContain('ago');
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

  it('has at least 7 FAQs based on real pet owner questions', () => {
    const faqs = config.educational.faqs;
    expect(faqs).toBeDefined();
    expect(faqs!.length).toBeGreaterThanOrEqual(7);
    // Every FAQ must have question and answer
    faqs!.forEach((faq) => {
      expect(faq.question.length).toBeGreaterThan(10);
      expect(faq.answer.length).toBeGreaterThan(50);
    });
  });

  it('has at least 3 worked examples with real scenarios', () => {
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

  it('has at least 3 variable definitions', () => {
    const vars = config.educational.variables;
    expect(vars).toBeDefined();
    expect(vars!.length).toBeGreaterThanOrEqual(3);
    vars!.forEach((v) => {
      expect(v.symbol.length).toBeGreaterThan(0);
      expect(v.name.length).toBeGreaterThan(0);
      expect(v.description.length).toBeGreaterThan(50);
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

  it('has commonUses with at least 3 entries', () => {
    const uses = config.educational.commonUses;
    expect(uses).toBeDefined();
    expect(uses!.length).toBeGreaterThanOrEqual(3);
  });

  it('has explanation covering both dog and cat gestation (350+ words)', () => {
    const explanation = config.educational.explanation;
    expect(explanation).toBeDefined();
    const wordCount = explanation!.split(/\s+/).filter(Boolean).length;
    expect(wordCount).toBeGreaterThanOrEqual(350);
    // Must cover both species
    expect(explanation!.toLowerCase()).toContain('dog');
    expect(explanation!.toLowerCase()).toContain('cat');
  });
});
