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
});
