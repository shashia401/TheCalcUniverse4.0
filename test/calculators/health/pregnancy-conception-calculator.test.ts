import { describe, it, expect, vi } from 'vitest';
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
  // ── Audit regressions (dates counted by hand; clock frozen) ──
  describe('Audit regressions', () => {
    const at = (iso: string, fn: () => void) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(`${iso}T12:00:00`));
      try { fn(); } finally { vi.useRealTimers(); }
    };

    it('worked example 1: LMP 1 Jan 2026, 28-day cycle -> ovulation Thu 15 Jan, fertile 10-15 Jan, peak from Tue 13 Jan, implantation 21-27 Jan, due Thu 8 Oct', () => {
      at('2026-01-05', () => {
        const r = config.calculate({ method: 'lmp', lmpDate: '2026-01-01', cycleLength: '28' });
        expect(getValue(r, 'ovulationDate')).toBe('Thursday, January 15, 2026');
        expect(getValue(r, 'fertileWindow')).toBe('Saturday, January 10, 2026 → Thursday, January 15, 2026');
        expect(getValue(r, 'peakFertility')).toBe('Tuesday, January 13, 2026 → Thursday, January 15, 2026');
        expect(getValue(r, 'implantationWindow')).toBe('Wednesday, January 21, 2026 → Tuesday, January 27, 2026');
        expect(getValue(r, 'estDueDate')).toBe('Thursday, October 8, 2026');
        expect(getValue(r, 'daysUntilOvulation')).toBe('10 days');
      });
    });

    it('35-day cycle moves ovulation to LMP + 21 days (22 Jan); next-period method uses next period - 14', () => {
      at('2026-01-05', () => {
        expect(getValue(config.calculate({ method: 'lmp', lmpDate: '2026-01-01', cycleLength: '35' }), 'ovulationDate')).toBe('Thursday, January 22, 2026');
        expect(getValue(config.calculate({ method: 'nextPeriod', nextPeriodDate: '2026-01-29' }), 'ovulationDate')).toBe('Thursday, January 15, 2026');
      });
    });

    it('cycle-length method is anchored on today as cycle day 1 (used to always say ovulation was 14 days ago)', () => {
      at('2026-03-10', () => {
        const r = config.calculate({ method: 'cycle', cycleLength: '30' });
        expect(getValue(r, 'ovulationDate')).toBe('Thursday, March 26, 2026'); // 10 Mar + 30 - 14
        expect(getValue(r, 'daysUntilOvulation')).toBe('16 days');
        expect(getValue(r, 'fertileDays')).toContain('opens in 11 days'); // window opens 21 Mar
      });
    });

    it('fertile-today message points at the real peak days instead of "today and the next 2 days"', () => {
      at('2026-01-10', () => {
        const msg = getValue(config.calculate({ method: 'lmp', lmpDate: '2026-01-01', cycleLength: '28' }), 'fertileDays');
        expect(msg).toContain('2 days before ovulation');
        expect(msg).not.toContain('next 2 days');
      });
    });

    it('worked example 3 (IVF): Day-5 transfer 15 Mar 2026 -> due Tue 1 Dec (+261), test Tue 24 Mar (+9), retrieval Tue 10 Mar; Day-3 -> +263 = Thu 3 Dec', () => {
      at('2026-03-20', () => {
        const d5 = config.calculate({ method: 'ivf', ivfDate: '2026-03-15', embryoType: 'day5' });
        expect(getValue(d5, 'ivfDueDate')).toBe('Tuesday, December 1, 2026');
        expect(getValue(d5, 'ivfPregnancyTest')).toBe('Tuesday, March 24, 2026');
        expect(getValue(d5, 'ivfRetrieval')).toBe('Tuesday, March 10, 2026');
        // 5 days after a Day-5 transfer the pregnancy is 19 + 5 = 24 days = 3w3d from the LMP equivalent
        expect(getValue(d5, 'ivfWeeksProgress')).toBe('3 weeks 3 days (gestational age)');
        const d3 = config.calculate({ method: 'ivf', ivfDate: '2026-03-15', embryoType: 'day3' });
        expect(getValue(d3, 'ivfDueDate')).toBe('Thursday, December 3, 2026');
        expect(getValue(d3, 'ivfWeeksProgress')).toBe('3 weeks 1 day (gestational age)'); // 17 + 5 = 22 days
      });
      at('2026-03-01', () => {
        expect(getValue(config.calculate({ method: 'ivf', ivfDate: '2026-03-15', embryoType: 'day5' }), 'ivfWeeksProgress')).toBe('Prior to transfer');
      });
    });

    it('worked example 2 (target due date): 1 Sep 2026 -> conception Tue 9 Dec 2025 (-266), window 4-9 Dec, LMP Tue 25 Nov', () => {
      at('2026-01-01', () => {
        const r = config.calculate({ method: 'dueDate', targetDueDate: '2026-09-01' });
        expect(getValue(r, 'conceptionDate')).toBe('Tuesday, December 9, 2025');
        expect(getValue(r, 'fertileWindow')).toBe('Thursday, December 4, 2025 → Tuesday, December 9, 2025');
        expect(getValue(r, 'lmpEstimated')).toBe('Tuesday, November 25, 2025');
        expect(getValue(r, 'weeksPregnant')).toBe('~5 weeks pregnant · 243 days remaining'); // 37 days since LMP
      });
      at('2025-11-01', () => {
        // days until the window opens (4 Dec), not days until the LMP
        expect(getValue(config.calculate({ method: 'dueDate', targetDueDate: '2026-09-01' }), 'weeksPregnant')).toBe('Conception window opens in 33 days');
      });
      at('2026-10-01', () => {
        expect(getValue(config.calculate({ method: 'dueDate', targetDueDate: '2026-09-01' }), 'weeksPregnant')).toBe('The target due date has already passed');
      });
    });

    it('rejects calendar-invalid dates for every date input and out-of-range cycle lengths', () => {
      expect(config.calculate({ method: 'lmp', lmpDate: '2025-02-31', cycleLength: '28' })).toEqual([]);
      expect(config.calculate({ method: 'nextPeriod', nextPeriodDate: '2026-04-31' })).toEqual([]);
      expect(config.calculate({ method: 'ivf', ivfDate: '2026-02-30', embryoType: 'day5' })).toEqual([]);
      expect(config.calculate({ method: 'dueDate', targetDueDate: '2026-09-31' })).toEqual([]);
      expect(config.calculate({ method: 'lmp', lmpDate: '2026-01-01', cycleLength: '60' })).toEqual([]);
    });

    it('the unused period-length input is gone and no Wilcox per-day figures other than the verified 10% / 33% are quoted', () => {
      expect(config.inputs.some((i) => i.id === 'periodLength')).toBe(false);
      const faq = JSON.stringify(config.educational!.faqs);
      expect(faq).not.toContain('~24%');
      expect(faq).toContain('about 33%');
    });
  });
});
