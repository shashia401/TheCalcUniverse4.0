import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/due-date/index';
import { getValue } from '../../helpers';

describe('Due Date calculator', () => {
  it('calculates due date from LMP', () => {
    const r = config.calculate({
      method: 'lmp',
      date: '2026-01-15',
      cycleLength: '28',
    });
    expect(getValue(r, 'dueDate')).toContain('2026');
    expect(getValue(r, 'conceptionDate')).toBeTruthy();
    expect(getValue(r, 't1')).toBeTruthy();
    expect(getValue(r, 't2')).toBeTruthy();
    expect(getValue(r, 't3')).toBeTruthy();
  });

  it('adjusts due date for longer cycle', () => {
    const r28 = config.calculate({
      method: 'lmp', date: '2026-01-01', cycleLength: '28',
    });
    const r35 = config.calculate({
      method: 'lmp', date: '2026-01-01', cycleLength: '35',
    });
    // 35-day cycle should have later due date
    const due28 = new Date(getValue(r28, 'dueDate'));
    const due35 = new Date(getValue(r35, 'dueDate'));
    expect(due35.getTime()).toBeGreaterThan(due28.getTime());
  });

  it('calculates from conception date', () => {
    const r = config.calculate({
      method: 'conception',
      date: '2026-01-15',
      cycleLength: '28',
    });
    expect(getValue(r, 'dueDate')).toBeTruthy();
  });

  it('calculates from IVF transfer date', () => {
    const r = config.calculate({
      method: 'ivf',
      date: '2026-01-15',
      cycleLength: '28',
    });
    expect(getValue(r, 'dueDate')).toBeTruthy();
  });

  it('returns gestational age', () => {
    const r = config.calculate({
      method: 'lmp',
      date: '2026-01-15',
      cycleLength: '28',
    });
    expect(getValue(r, 'gestationalAge')).toBeTruthy();
    expect(getValue(r, 'currentTrimester')).toBeTruthy();
  });

  it('returns empty for invalid date format', () => {
    const r = config.calculate({
      method: 'lmp', date: 'invalid', cycleLength: '28',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for bad date string', () => {
    const r = config.calculate({
      method: 'lmp', date: 'not-a-date', cycleLength: '28',
    });
    expect(r).toEqual([]);
  });

  // ── Audit regressions: expected dates from python datetime.date arithmetic (independent calendar) ──
  const due = (method: string, date: string, cycleLength = '28') =>
    getValue(config.calculate({ method, date, cycleLength }), 'dueDate');

  it('LMP 2025-06-01 + 280 days = Sunday, March 8, 2026 (Naegele)', () => {
    expect(due('lmp', '2025-06-01')).toBe('Sunday, March 8, 2026');
  });

  it('cycle length adjusts the EDD by (cycle - 28) days: 35-day cycle -> Mar 15, 24-day cycle -> Mar 4', () => {
    expect(due('lmp', '2025-06-01', '35')).toBe('Sunday, March 15, 2026');
    expect(due('lmp', '2025-06-01', '24')).toBe('Wednesday, March 4, 2026');
  });

  it('conception date + 266 days: 2025-06-15 -> March 8, 2026; cycle length must NOT shift it', () => {
    expect(due('conception', '2025-06-15')).toBe('Sunday, March 8, 2026');
    expect(due('conception', '2025-06-15', '35')).toBe('Sunday, March 8, 2026');
  });

  it('IVF Day-5 blastocyst transfer + 261 days: 2025-04-20 -> January 6, 2026', () => {
    expect(due('ivf', '2025-04-20')).toBe('Tuesday, January 6, 2026');
  });

  it('IVF Day-3 embryo transfer + 263 days: 2025-04-20 -> January 8, 2026', () => {
    expect(due('ivf3', '2025-04-20')).toBe('Thursday, January 8, 2026');
  });

  it('leap year: LMP 2023-06-01 + 280 days = March 7, 2024', () => {
    expect(due('lmp', '2023-06-01')).toBe('Thursday, March 7, 2024');
  });

  it('trimester boundaries (ACOG): LMP 2025-06-01 -> T1 ends Sep 6 (day 97), T2 Sep 7 - Dec 13, T3 starts Dec 14', () => {
    const r = config.calculate({ method: 'lmp', date: '2025-06-01', cycleLength: '28' });
    expect(getValue(r, 't1')).toContain('September 6, 2025');
    expect(getValue(r, 't2')).toContain('September 7, 2025 → December 13, 2025');
    expect(getValue(r, 't3')).toContain('December 14, 2025');
  });

  it('rejects calendar-invalid dates instead of rolling over (2025-02-31 would otherwise become Mar 3)', () => {
    expect(config.calculate({ method: 'lmp', date: '2025-02-31', cycleLength: '28' })).toEqual([]);
    expect(config.calculate({ method: 'lmp', date: '2025-13-01', cycleLength: '28' })).toEqual([]);
  });
});
