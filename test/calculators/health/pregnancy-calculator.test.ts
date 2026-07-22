import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/pregnancy-calculator/index';
import { getValue } from '../../helpers';

/** Format a Date to YYYY-MM-DD using local timezone (matches how date inputs work) */
const toLocalDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

describe('Pregnancy Calculator (General Hub)', () => {
  // Helper: compute expected date using same local-midnight logic as the calculator
  const addDays = (d: Date, n: number): Date => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  };

  const fmtExpected = (d: Date): string =>
    d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // ── Golden path ────────────────────────────────────────────────
  it('calculates due date from valid LMP date (280 days later)', () => {
    const lmp = new Date('2026-01-15T00:00:00');
    const expectedDue = addDays(lmp, 280);

    const r = config.calculate({
      lmpDate: '2026-01-15',
      cycleLength: '28',
    });
    expect(getValue(r, 'dueDate')).toContain(fmtExpected(expectedDue));
  });

  it('returns gestational age result for a past LMP date', () => {
    const r = config.calculate({
      lmpDate: '2026-01-15',
      cycleLength: '28',
    });
    const ga = getValue(r, 'gestationalAge');
    expect(ga).toBeTruthy();
    expect(ga.length).toBeGreaterThan(0);
  });

  it('returns conception date 14 days after LMP', () => {
    const lmp = new Date('2026-01-01T00:00:00');
    const expectedConception = addDays(lmp, 14);

    const r = config.calculate({
      lmpDate: '2026-01-01',
      cycleLength: '28',
    });
    expect(getValue(r, 'conceptionDate')).toContain(fmtExpected(expectedConception));
  });

  // ── Trimester detection ───────────────────────────────────────
  it('detects 1st trimester correctly (LMP ~8 weeks ago)', () => {
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    const lmpStr = toLocalDateStr(eightWeeksAgo);

    const r = config.calculate({ lmpDate: lmpStr, cycleLength: '28' });
    const trimester = getValue(r, 'currentTrimester');
    expect(trimester).toBe('1st Trimester (Weeks 1-13)');
  });

  it('detects 2nd trimester correctly (LMP ~20 weeks ago)', () => {
    const twentyWeeksAgo = new Date();
    twentyWeeksAgo.setDate(twentyWeeksAgo.getDate() - 140);
    const lmpStr = toLocalDateStr(twentyWeeksAgo);

    const r = config.calculate({ lmpDate: lmpStr, cycleLength: '28' });
    const trimester = getValue(r, 'currentTrimester');
    expect(trimester).toBe('2nd Trimester (Weeks 14-26)');
  });

  it('detects 3rd trimester correctly (LMP ~30 weeks ago)', () => {
    const thirtyWeeksAgo = new Date();
    thirtyWeeksAgo.setDate(thirtyWeeksAgo.getDate() - 210);
    const lmpStr = toLocalDateStr(thirtyWeeksAgo);

    const r = config.calculate({ lmpDate: lmpStr, cycleLength: '28' });
    const trimester = getValue(r, 'currentTrimester');
    expect(trimester).toBe('3rd Trimester (Weeks 27-40)');
  });

  // ── Edge cases: trimester boundaries ──────────────────────────
  it('correctly classifies exactly at 13 weeks (1st tri boundary)', () => {
    const boundary = new Date();
    boundary.setDate(boundary.getDate() - 91);
    const lmpStr = toLocalDateStr(boundary);

    const r = config.calculate({ lmpDate: lmpStr, cycleLength: '28' });
    expect(getValue(r, 'currentTrimester')).toBe('1st Trimester (Weeks 1-13)');
  });

  it('correctly classifies exactly at 14 weeks (2nd tri start)', () => {
    const boundary = new Date();
    boundary.setDate(boundary.getDate() - 98);
    const lmpStr = toLocalDateStr(boundary);

    const r = config.calculate({ lmpDate: lmpStr, cycleLength: '28' });
    expect(getValue(r, 'currentTrimester')).toBe('2nd Trimester (Weeks 14-26)');
  });

  it('correctly classifies exactly at 27 weeks (3rd tri start)', () => {
    const boundary = new Date();
    boundary.setDate(boundary.getDate() - 189);
    const lmpStr = toLocalDateStr(boundary);

    const r = config.calculate({ lmpDate: lmpStr, cycleLength: '28' });
    expect(getValue(r, 'currentTrimester')).toBe('3rd Trimester (Weeks 27-40)');
  });

  // ── Invalid / empty dates ─────────────────────────────────────
  it('returns empty array for empty LMP date', () => {
    const r = config.calculate({ lmpDate: '', cycleLength: '28' });
    expect(r).toEqual([]);
  });

  it('returns empty array for invalid LMP date string', () => {
    const r = config.calculate({ lmpDate: 'not-a-date', cycleLength: '28' });
    expect(r).toEqual([]);
  });

  // ── Cycle length adjustment ────────────────────────────────────
  it('adjusts due date for longer cycle length', () => {
    const r28 = config.calculate({ lmpDate: '2026-01-01', cycleLength: '28' });
    const r35 = config.calculate({ lmpDate: '2026-01-01', cycleLength: '35' });

    const due28 = new Date(getValue(r28, 'dueDate'));
    const due35 = new Date(getValue(r35, 'dueDate'));
    expect(due35.getTime()).toBeGreaterThan(due28.getTime());
  });

  // ── Milestones present ────────────────────────────────────────
  it('returns all milestone results', () => {
    const r = config.calculate({ lmpDate: '2026-01-15', cycleLength: '28' });

    expect(getValue(r, 'endFirstTrimester')).toContain('2026');
    expect(getValue(r, 'viabilityDate')).toContain('2026');
    expect(getValue(r, 'fullTermDate')).toContain('2026');
    expect(getValue(r, 'progressSummary')).toBeTruthy();
  });

  // ── Educational content minimums ──────────────────────────────
  it('has educational content meeting minimum requirements', () => {
    const edu = config.educational;

    expect(edu.formula).toBeTruthy();
    expect(edu.formulaDescription.length).toBeGreaterThanOrEqual(100);

    expect(edu.variables).toBeDefined();
    expect(edu.variables!.length).toBe(5);

    expect(edu.howToUse).toBeDefined();
    expect(edu.howToUse!.length).toBe(4);

    expect(edu.explanation!.length).toBeGreaterThanOrEqual(400);

    expect(edu.faqs).toBeDefined();
    expect(edu.faqs!.length).toBeGreaterThanOrEqual(7);

    expect(edu.citations).toBeDefined();
    expect(edu.citations!.length).toBeGreaterThanOrEqual(2);

    expect(edu.diagram).toBeDefined();
    expect(edu.diagram!.svg).toContain('viewBox');
    expect(edu.diagram!.alt).toBeTruthy();

    expect(edu.quickReference).toBeDefined();
    expect(edu.quickReference!.length).toBeGreaterThanOrEqual(5);

    expect(edu.commonUses).toBeDefined();
    expect(edu.commonUses!.length).toBe(3);

    expect(edu.workedExamples).toBeDefined();
    expect(edu.workedExamples!.length).toBeGreaterThanOrEqual(3);
    expect(edu.workedExamples![0].scenario).toBeTruthy();
    expect(edu.workedExamples![0].result).toBeTruthy();
    expect(edu.workedExamples![0].insight).toBeTruthy();

    expect(edu.proTips).toBeDefined();
    expect(edu.proTips!.length).toBeGreaterThanOrEqual(4);

    expect(edu.limitations).toBeDefined();
    expect(edu.limitations!.length).toBeGreaterThanOrEqual(5);
  });
});
