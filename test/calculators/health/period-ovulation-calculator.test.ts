import { describe, it, expect, vi } from 'vitest';
import config from '../../../src/calculators/health/period-ovulation/index';
import { getValue } from '../../helpers';

describe('Period & Ovulation Calculator', () => {
  it('calculates current cycle day and phase from LMP', () => {
    const r = config.calculate({
      lmpDate: '2026-04-01',
      cycleLength: '28',
      periodLength: '5',
      lutealPhase: '14',
    });
    const cycleDay = getValue(r, 'cycleDay');
    expect(cycleDay).toContain('Day');
    expect(cycleDay).toContain('28');
    const phase = getValue(r, 'currentPhase');
    expect(phase).toBeTruthy();
    expect(typeof phase).toBe('string');
  });

  it('predicts next period and period frequency correctly', () => {
    const r = config.calculate({
      lmpDate: '2026-04-01',
      cycleLength: '28',
      periodLength: '5',
    });
    const nextPeriod = getValue(r, 'predictedPeriod');
    expect(nextPeriod).toContain('in');
    expect(nextPeriod).toContain('days');
    const frequency = getValue(r, 'periodFrequency');
    expect(frequency).toContain('28 days');
    expect(frequency).toContain('periods per year');
  });

  it('returns ovulation date and fertile window with arrow separator', () => {
    const r = config.calculate({
      lmpDate: '2026-04-01',
      cycleLength: '28',
      periodLength: '5',
      lutealPhase: '14',
    });
    const ovulation = getValue(r, 'ovulationDate');
    expect(ovulation).toBeTruthy();
    const fertileWindow = getValue(r, 'fertileWindow');
    expect(fertileWindow).toContain('→'); // arrow character
  });

  it('calculates ovulation correctly for 33-day cycle with 14-day luteal phase', () => {
    const r = config.calculate({
      lmpDate: '2026-03-10',
      cycleLength: '33',
      periodLength: '4',
      lutealPhase: '14',
    });
    // Ovulation should be ~Day 19 in a 33-day cycle (33-14=19)
    const ovulation = getValue(r, 'ovulationDate');
    expect(ovulation).toBeTruthy();
    const cycleDay = getValue(r, 'cycleDay');
    expect(cycleDay).toContain('33');
  });

  it('returns 3-month outlook with en-dash separator', () => {
    const r = config.calculate({
      lmpDate: '2026-04-01',
      cycleLength: '30',
      periodLength: '5',
    });
    const outlook = getValue(r, 'monthsPredictions');
    expect(outlook).toContain('–');
  });

  it('returns empty array for empty LMP date', () => {
    const r = config.calculate({
      lmpDate: '',
      cycleLength: '28',
      periodLength: '5',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for invalid date format', () => {
    const r = config.calculate({
      lmpDate: 'not-a-date',
      cycleLength: '28',
      periodLength: '5',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for cycle length below minimum (under 20)', () => {
    const r = config.calculate({
      lmpDate: '2026-04-01',
      cycleLength: '10',
      periodLength: '5',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for cycle length above maximum (over 45)', () => {
    const r = config.calculate({
      lmpDate: '2026-04-01',
      cycleLength: '50',
      periodLength: '5',
    });
    expect(r).toEqual([]);
  });

  it('handles all results having truthy values with only required fields', () => {
    const r = config.calculate({
      lmpDate: '2026-01-15',
      cycleLength: '28',
      periodLength: '5',
    });
    expect(r.length).toBeGreaterThanOrEqual(7);
    r.forEach((item) => {
      expect(item.value).toBeTruthy();
    });
  });

  it('works correctly with custom luteal phase (no default fallback needed)', () => {
    const r = config.calculate({
      lmpDate: '2026-05-01',
      cycleLength: '30',
      periodLength: '4',
      lutealPhase: '12',
    });
    // With 12-day luteal phase, ovulation should be around Day 18 (30-12=18)
    const cycleDay = getValue(r, 'cycleDay');
    expect(cycleDay).toContain('30');
    expect(getValue(r, 'ovulationDate')).toBeTruthy();
    expect(getValue(r, 'fertileWindow')).toBeTruthy();
  });

  // ── Educational content presence ─────────────────────────────────────
  it('has educational section with all required fields', () => {
    const edu = config.educational;
    expect(edu).toBeDefined();
    expect(edu.formula).toBeTruthy();
    expect(edu.formulaDescription).toBeTruthy();
    expect(edu.variables).toBeDefined();
    expect(edu.variables!.length).toBeGreaterThanOrEqual(3);
    expect(edu.howToUse).toBeDefined();
    expect(edu.howToUse!.length).toBeGreaterThanOrEqual(3);
    expect(edu.explanation).toBeTruthy();
    expect(edu.explanation.length).toBeGreaterThan(500);
    expect(edu.faqs).toBeDefined();
    expect(edu.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(edu.workedExamples).toBeDefined();
    expect(edu.workedExamples!.length).toBeGreaterThanOrEqual(3);
    expect(edu.proTips).toBeDefined();
    expect(edu.proTips!.length).toBeGreaterThanOrEqual(4);
    expect(edu.limitations).toBeDefined();
    expect(edu.limitations!.length).toBeGreaterThanOrEqual(3);
    expect(edu.commonUses).toBeDefined();
    expect(edu.commonUses!.length).toBeGreaterThanOrEqual(2);
    expect(edu.quickReference).toBeDefined();
    expect(edu.quickReference!.length).toBeGreaterThanOrEqual(5);
    expect(edu.citations).toBeDefined();
    expect(edu.citations!.length).toBeGreaterThanOrEqual(2);
  });

  it('includes privacy information in privacy FAQ', () => {
    const edu = config.educational;
    const privacyFaq = edu.faqs!.find(f => f.question.toLowerCase().includes('private') || f.question.toLowerCase().includes('privacy'));
    expect(privacyFaq).toBeDefined();
    expect(privacyFaq!.answer.toLowerCase()).toContain('browser');
  });

  it('includes OPK and BBT guidance in educational content', () => {
    const edu = config.educational;
    const combined = (edu.faqs ?? []).map(f => f.answer).join(' ') +
      (edu.proTips ?? []).join(' ') +
      (edu.explanation ?? '');
    expect(combined.toLowerCase()).toContain('opk');
    expect(combined.toLowerCase()).toContain('bbt');
  });
  // ── Audit regressions (dates counted by hand; clock frozen so "today" is deterministic) ──
  describe('Audit regressions', () => {
    const at = (iso: string, fn: () => void) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(`${iso}T12:00:00`));
      try { fn(); } finally { vi.useRealTimers(); }
    };
    const calc = (lmpDate: string, cycleLength = '28', periodLength = '5', lutealPhase = '14') =>
      config.calculate({ lmpDate, cycleLength, periodLength, lutealPhase });

    it('Sarah: LMP 1 Mar, 28/5/14 -> ovulation Sun 15 Mar, fertile Tue 10 -> Sun 15 Mar, next period Sun 29 Mar', () => {
      at('2026-03-20', () => {
        const r = calc('2026-03-01');
        expect(getValue(r, 'cycleDay')).toBe('Day 20 of 28');
        expect(getValue(r, 'ovulationDate')).toBe('Sunday, March 15, 2026 (5 days ago)');
        expect(getValue(r, 'fertileWindow')).toBe('Tuesday, March 10, 2026 → Sunday, March 15, 2026');
        expect(getValue(r, 'predictedPeriod')).toBe('Sunday, March 29, 2026 (in 9 days)');
        expect(getValue(r, 'currentPhase')).toMatch(/^Luteal/);
      });
    });

    it('Maria: LMP 5 Apr, 33/6/14 -> ovulation Fri 24 Apr (19 days after LMP), fertile 19-24 Apr, next period 8 May', () => {
      at('2026-04-10', () => {
        const r = calc('2026-04-05', '33', '6');
        expect(getValue(r, 'ovulationDate')).toBe('Friday, April 24, 2026 (in 14 days)');
        expect(getValue(r, 'fertileWindow')).toBe('Sunday, April 19, 2026 → Friday, April 24, 2026');
        expect(getValue(r, 'predictedPeriod')).toContain('Friday, May 8, 2026');
        expect(getValue(r, 'periodFrequency')).toBe('Every 33 days · ~11 periods per year');
      });
    });

    it('Priya: LMP 2 May, 30/5/14 -> ovulation Mon 18 May, fertile 13-18 May, next period Mon 1 Jun', () => {
      at('2026-05-10', () => {
        const r = calc('2026-05-02', '30');
        expect(getValue(r, 'ovulationDate')).toContain('Monday, May 18, 2026');
        expect(getValue(r, 'fertileWindow')).toBe('Wednesday, May 13, 2026 → Monday, May 18, 2026');
        expect(getValue(r, 'predictedPeriod')).toContain('Monday, June 1, 2026');
        expect(getValue(r, 'periodFrequency')).toContain('~12 periods per year');
      });
    });

    it('phase follows the dates: LMP+2 menstruation, +8 follicular, +10 fertile (window opens 5 days before ovulation), +16 luteal', () => {
      const phase = (today: string) => { let p = ''; at(today, () => { p = getValue(calc('2026-03-01'), 'currentPhase'); }); return p; };
      expect(phase('2026-03-03')).toMatch(/^Menstruation \(Day 3/);
      expect(phase('2026-03-09')).toMatch(/^Follicular/);
      expect(phase('2026-03-11')).toMatch(/^Fertile/);
      expect(phase('2026-03-17')).toMatch(/^Luteal/);
    });

    it('anchors to the cycle that contains today: LMP 1 Jan seen on 20 Mar is cycle day 23 of a cycle starting 26 Feb', () => {
      at('2026-03-20', () => {
        const r = calc('2026-01-01');
        expect(getValue(r, 'cycleDay')).toBe('Day 23 of 28'); // 78 days since LMP = 2 full cycles + 22
        const cycles = JSON.parse(getValue(r, '_cycles'));
        expect(cycles[0].periodStart).toBe('2026-02-26');
        expect(cycles[0].ovulation).toBe('2026-03-12');
        expect(cycles).toHaveLength(3);
      });
    });

    it('rejects calendar-invalid dates instead of rolling 31 Feb over to March, and future LMPs', () => {
      at('2026-03-20', () => {
        expect(calc('2025-02-31')).toEqual([]);
        expect(calc('2026-04-31')).toEqual([]);
        expect(calc('2026-03-25')).toEqual([]); // last period cannot start in the future
        expect(calc('2026-03-20').length).toBeGreaterThan(0); // today itself is fine (cycle day 1)
      });
    });
  });
});
