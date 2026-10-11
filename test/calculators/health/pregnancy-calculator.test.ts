import { describe, it, expect, vi } from 'vitest';
import config from '../../../src/calculators/health/pregnancy-calculator/index';
import { getValue, getResult } from '../../helpers';

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
    expect(trimester).toBe('2nd Trimester (Weeks 14-27)');
  });

  it('detects 3rd trimester correctly (LMP ~30 weeks ago)', () => {
    const thirtyWeeksAgo = new Date();
    thirtyWeeksAgo.setDate(thirtyWeeksAgo.getDate() - 210);
    const lmpStr = toLocalDateStr(thirtyWeeksAgo);

    const r = config.calculate({ lmpDate: lmpStr, cycleLength: '28' });
    const trimester = getValue(r, 'currentTrimester');
    expect(trimester).toBe('3rd Trimester (Weeks 28-40)');
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
    expect(getValue(r, 'currentTrimester')).toBe('2nd Trimester (Weeks 14-27)');
  });

  it('correctly classifies exactly at 28 weeks (3rd tri start, ACOG 28w0d)', () => {
    const boundary = new Date();
    boundary.setDate(boundary.getDate() - 196);
    const lmpStr = toLocalDateStr(boundary);

    const r = config.calculate({ lmpDate: lmpStr, cycleLength: '28' });
    expect(getValue(r, 'currentTrimester')).toBe('3rd Trimester (Weeks 28-40)');
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
  // ── Audit regressions (hand-counted dates; clock frozen) ──
  describe('Audit regressions', () => {
    const at = (iso: string, fn: () => void) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(`${iso}T12:00:00`));
      try { fn(); } finally { vi.useRealTimers(); }
    };
    const calc = (lmpDate: string, cycleLength = '28') => config.calculate({ lmpDate, cycleLength });

    it('worked examples: LMP 1 Mar 2026 -> Sun 6 Dec 2026; LMP 15 Jan, 35-day cycle -> Thu 29 Oct (22 Oct + 7); LMP 1 Jun -> Mon 8 Mar 2027', () => {
      at('2026-05-24', () => {
        expect(getValue(calc('2026-03-01'), 'dueDate')).toBe('Sunday, December 6, 2026');
        expect(getValue(calc('2026-01-15', '35'), 'dueDate')).toBe('Thursday, October 29, 2026');
        expect(getValue(calc('2026-01-15', '28'), 'dueDate')).toBe('Thursday, October 22, 2026');
        expect(getValue(calc('2026-06-01'), 'dueDate')).toBe('Monday, March 8, 2027');
        // Sarah on 24 May 2026 = 84 days = exactly 12 weeks
        expect(getValue(calc('2026-03-01'), 'gestationalAge')).toBe('12 weeks pregnant');
      });
    });

    it('Jessica: LMP 1 Jun 2026 seen on 15 Sep = 106 days = 15 w 1 d, 2nd trimester', () => {
      at('2026-09-15', () => {
        const r = calc('2026-06-01');
        expect(getValue(r, 'gestationalAge')).toBe('15 weeks and 1 day pregnant');
        expect(getValue(r, 'currentTrimester')).toBe('2nd Trimester (Weeks 14-27)');
      });
    });

    it('trimester boundaries follow ACOG: 13w6d is 1st, 14w0d is 2nd, 27w6d is 2nd, 28w0d is 3rd', () => {
      const tri = (daysAgo: number) => {
        let v = '';
        at('2026-09-15', () => {
          const d = new Date(2026, 8, 15); d.setDate(d.getDate() - daysAgo);
          v = getValue(calc(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`), 'currentTrimester');
        });
        return v;
      };
      expect(tri(97)).toMatch(/^1st/); // 13w6d
      expect(tri(98)).toMatch(/^2nd/); // 14w0d
      expect(tri(195)).toMatch(/^2nd/); // 27w6d
      expect(tri(196)).toMatch(/^3rd/); // 28w0d
    });

    it('cycle length shifts everything consistently: 35-day cycle moves due date, gestational age and milestones by 7 days', () => {
      at('2026-05-24', () => {
        const r35 = calc('2026-03-01', '35');
        // adjusted LMP = 8 Mar -> 77 days = exactly 11 weeks (not 12)
        expect(getValue(r35, 'gestationalAge')).toBe('11 weeks pregnant');
        expect(getValue(r35, 'conceptionDate')).toBe('March 22, 2026'); // 8 Mar + 14
        expect(getValue(r35, 'endFirstTrimester')).toBe('June 7, 2026'); // 8 Mar + 91 d
      });
    });

    it('due today / past due labels use the (adjusted) due date, never a negative or reversed count', () => {
      at('2026-12-06', () => {
        expect(getValue(calc('2026-03-01'), 'gestationalAge')).toBe('40 weeks pregnant — due today');
        expect(getValue(calc('2026-03-01'), 'progressSummary')).toBe('Due today!');
      });
      at('2026-12-10', () => {
        expect(getValue(calc('2026-03-01'), 'gestationalAge')).toBe('4 days past due date');
        // 35-day cycle: due 13 Dec, so on 10 Dec she is NOT past due (used to say "past due")
        expect(getValue(calc('2026-03-01', '35'), 'progressSummary')).toBe('3 days to go');
      });
    });

    it('37 weeks is labelled early term (full term starts at 39)', () => {
      at('2026-05-24', () => {
        const r = calc('2026-03-01');
        expect(getResult(r, 'fullTermDate').label).toBe('Early Term Begins (37 weeks)');
        expect(getValue(r, 'fullTermDate')).toContain('full term starts at 39 weeks');
        expect(getValue(r, 'fullTermDate')).toContain('November 15, 2026'); // 1 Mar + 259 d
      });
    });

    it('rejects calendar-invalid LMPs and LMPs far past the due date', () => {
      at('2026-05-24', () => {
        expect(calc('2026-02-31')).toEqual([]);
        expect(calc('2024-01-01')).toEqual([]); // ~2.4 years ago
      });
    });
  });
});
