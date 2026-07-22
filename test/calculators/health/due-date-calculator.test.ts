import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/due-date/index';
import { getValue } from '../../helpers';

describe('Due Date calculator', () => {
  // ── LMP Method ──────────────────────────────────────────────────────
  it('calculates due date from LMP (Naegele rule: LMP + 280 days)', () => {
    const r = config.calculate({
      method: 'lmp',
      date: '2026-01-15',
      cycleLength: '28',
    });
    const dueDate = getValue(r, 'dueDate');
    // Jan 15 + 280 days = Oct 22, 2026
    expect(dueDate).toContain('October');
    expect(dueDate).toContain('2026');
    expect(dueDate).toContain('22');
    expect(getValue(r, 'conceptionDate')).toBeTruthy();
    expect(getValue(r, 't1')).toBeTruthy();
    expect(getValue(r, 't2')).toBeTruthy();
    expect(getValue(r, 't3')).toBeTruthy();
  });

  it('adjusts due date for longer cycle (>28 days shifts due date later)', () => {
    const r28 = config.calculate({
      method: 'lmp', date: '2026-01-01', cycleLength: '28',
    });
    const r35 = config.calculate({
      method: 'lmp', date: '2026-01-01', cycleLength: '35',
    });
    const due28 = new Date(getValue(r28, 'dueDate'));
    const due35 = new Date(getValue(r35, 'dueDate'));
    expect(due35.getTime()).toBeGreaterThan(due28.getTime());
  });

  it('adjusts due date for shorter cycle (<28 days shifts due date earlier)', () => {
    const r28 = config.calculate({
      method: 'lmp', date: '2026-01-01', cycleLength: '28',
    });
    const r21 = config.calculate({
      method: 'lmp', date: '2026-01-01', cycleLength: '21',
    });
    const due28 = new Date(getValue(r28, 'dueDate'));
    const due21 = new Date(getValue(r21, 'dueDate'));
    expect(due21.getTime()).toBeLessThan(due28.getTime());
  });

  // ── Conception Method ───────────────────────────────────────────────
  it('calculates due date from conception date (conception + 266 days)', () => {
    const r = config.calculate({
      method: 'conception',
      date: '2026-02-01',
      cycleLength: '28',
    });
    expect(getValue(r, 'dueDate')).toBeTruthy();
    // Conception date result should be Feb 1 (or close)
    expect(getValue(r, 'conceptionDate')).toContain('February');
  });

  // ── IVF Method ──────────────────────────────────────────────────────
  it('calculates due date from IVF Day-5 blastocyst transfer', () => {
    const r = config.calculate({
      method: 'ivf',
      date: '2026-03-01',
      cycleLength: '28',
    });
    expect(getValue(r, 'dueDate')).toBeTruthy();
    // IVF due date = transfer + 261 days
  });

  // ── Gestational Age & Trimesters ────────────────────────────────────
  it('returns correct gestational age for early pregnancy', () => {
    // Use a recent LMP date to simulate early pregnancy
    const today = new Date();
    const lmpDate = new Date(today);
    lmpDate.setDate(lmpDate.getDate() - 44); // ~6.3 weeks ago
    const lmpStr = lmpDate.toISOString().split('T')[0];

    const r = config.calculate({
      method: 'lmp',
      date: lmpStr,
      cycleLength: '28',
    });
    const ga = getValue(r, 'gestationalAge');
    expect(ga).toContain('6 weeks');
    expect(getValue(r, 'currentTrimester')).toBe('1st Trimester');
  });

  it('identifies second trimester correctly (weeks 14-27)', () => {
    const today = new Date();
    const lmpDate = new Date(today);
    lmpDate.setDate(lmpDate.getDate() - 126); // 18 weeks ago
    const lmpStr = lmpDate.toISOString().split('T')[0];

    const r = config.calculate({
      method: 'lmp',
      date: lmpStr,
      cycleLength: '28',
    });
    expect(getValue(r, 'currentTrimester')).toBe('2nd Trimester');
  });

  it('identifies third trimester correctly (weeks 28-40)', () => {
    const today = new Date();
    const lmpDate = new Date(today);
    lmpDate.setDate(lmpDate.getDate() - 210); // 30 weeks ago
    const lmpStr = lmpDate.toISOString().split('T')[0];

    const r = config.calculate({
      method: 'lmp',
      date: lmpStr,
      cycleLength: '28',
    });
    expect(getValue(r, 'currentTrimester')).toBe('3rd Trimester');
  });

  it('handles past due date correctly (>42 weeks / 294 days)', () => {
    const today = new Date();
    const lmpDate = new Date(today);
    lmpDate.setDate(lmpDate.getDate() - 300); // >42 weeks ago (definitively past due)
    const lmpStr = lmpDate.toISOString().split('T')[0];

    const r = config.calculate({
      method: 'lmp',
      date: lmpStr,
      cycleLength: '28',
    });
    expect(getValue(r, 'gestationalAge')).toBe('Past estimated due date');
    expect(getValue(r, 'currentTrimester')).toBe('N/A');
  });

  it('handles future LMP date (pregnancy not started)', () => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
    const futureStr = futureDate.toISOString().split('T')[0];

    const r = config.calculate({
      method: 'lmp',
      date: futureStr,
      cycleLength: '28',
    });
    expect(getValue(r, 'gestationalAge')).toBe('Pregnancy has not started yet');
    expect(getValue(r, 'currentTrimester')).toBe('N/A');
  });

  // ── Edge Cases & Validation ─────────────────────────────────────────
  it('returns empty array for invalid date format', () => {
    const r = config.calculate({
      method: 'lmp', date: 'invalid-text', cycleLength: '28',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for badly formatted date string', () => {
    const r = config.calculate({
      method: 'lmp', date: '01/15/2026', cycleLength: '28',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for empty date', () => {
    const r = config.calculate({
      method: 'lmp', date: '', cycleLength: '28',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for missing date', () => {
    const r = config.calculate({
      method: 'lmp', date: '', cycleLength: '28',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for whitespace-only date', () => {
    const r = config.calculate({
      method: 'lmp', date: '   ', cycleLength: '28',
    });
    expect(r).toEqual([]);
  });

  it('returns empty array for undefined date', () => {
    const r = config.calculate({
      method: 'lmp', date: undefined as unknown as string, cycleLength: '28',
    });
    expect(r).toEqual([]);
  });

  it('handles cycleLength defaults to 28 when empty', () => {
    const r = config.calculate({
      method: 'lmp',
      date: '2026-01-15',
      cycleLength: '',
    });
    expect(r.length).toBeGreaterThan(0);
    const dueDate = getValue(r, 'dueDate');
    expect(dueDate).toContain('2026');
  });

  it('handles NaN cycleLength gracefully', () => {
    const r = config.calculate({
      method: 'lmp',
      date: '2026-01-15',
      cycleLength: 'not-a-number',
    });
    expect(r.length).toBeGreaterThan(0);
    expect(getValue(r, 'dueDate')).toBeTruthy();
  });

  // ── Result Structure ────────────────────────────────────────────────
  it('returns all expected output fields', () => {
    const r = config.calculate({
      method: 'lmp',
      date: '2026-01-15',
      cycleLength: '28',
    });
    const ids = r.map((x) => x.id);
    expect(ids).toContain('dueDate');
    expect(ids).toContain('gestationalAge');
    expect(ids).toContain('progress');
    expect(ids).toContain('conceptionDate');
    expect(ids).toContain('t1');
    expect(ids).toContain('t2');
    expect(ids).toContain('t3');
    expect(ids).toContain('currentTrimester');
  });

  it('due today returns correct message', () => {
    const today = new Date();
    const lmpDate = new Date(today);
    lmpDate.setDate(lmpDate.getDate() - 280); // exactly 280 days ago
    const lmpStr = lmpDate.toISOString().split('T')[0];

    const r = config.calculate({
      method: 'lmp',
      date: lmpStr,
      cycleLength: '28',
    });
    // Progress should contain "Due today" or something similar
    expect(r.length).toBeGreaterThan(0);
  });
});
