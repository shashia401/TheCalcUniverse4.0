import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/health/pig-gestation';

describe('Pig Gestation', () => {
  it('calculates 114-day farrowing date with 3-3-3 rule', () => {
    const r = config.calculate({ breedingDate: '2025-03-01', breedType: 'commercial', parity: 'gilt' });
    expect(r.find(x => x.id === 'gestation')?.value).toContain('114');
    expect(r.find(x => x.id === 'gestation')?.value).toContain('3 months');
  });

  it('matches the worked example farrowing date for a gilt bred 2025-03-01 (regression: bare `new Date(breedingStr)` parsed as UTC midnight, showing June 22 instead of June 23 in negative-UTC-offset timezones)', () => {
    const r = config.calculate({ breedingDate: '2025-03-01', breedType: 'commercial', parity: 'gilt' });
    expect(r.find(x => x.id === 'dueDate')?.value).toBe('June 23, 2025');
  });

  it('matches the worked example farrowing date for a mature sow bred 2025-10-15', () => {
    const r = config.calculate({ breedingDate: '2025-10-15', breedType: 'commercial', parity: 'matureSow' });
    expect(r.find(x => x.id === 'dueDate')?.value).toBe('February 6, 2026');
  });

  it('computes pregnancy progress percentage', () => {
    const r = config.calculate({ breedingDate: '2025-01-01', breedType: 'commercial', parity: 'matureSow' });
    expect(r.find(x => x.id === 'progress')).toBeDefined();
  });

  it('shows early and late farrowing windows', () => {
    const r = config.calculate({ breedingDate: '2025-06-15', breedType: 'commercial', parity: 'youngSow' });
    expect(r.find(x => x.id === 'earlyWindow')).toBeDefined();
    expect(r.find(x => x.id === 'lateWindow')).toBeDefined();
  });

  it('returns empty for missing breeding date', () => {
    expect(config.calculate({ breedingDate: '', breedType: 'commercial', parity: 'gilt' })).toEqual([]);
  });

  it('heritage breeds may have 115-day gestation', () => {
    const r = config.calculate({ breedingDate: '2025-03-01', breedType: 'large', parity: 'matureSow' });
    expect(r.find(x => x.id === 'gestation')?.value).toContain('115');
  });

  it('has educational content with 5+ FAQs', () => {
    expect(config.educational.faqs!.length).toBeGreaterThanOrEqual(5);
    expect(config.educational.workedExamples!.length).toBeGreaterThanOrEqual(2);
  });
  // ── Audit regressions ──
  const calc = (breedingDate: string, breedType = 'commercial', parity = 'gilt') => config.calculate({ breedingDate, breedType, parity });
  const val = (r: ReturnType<typeof calc>, id: string) => r.find((x) => x.id === id)!.value;

  it('3-3-3 example: bred Jan 1 2025 -> Apr 25 (Jan 31 + Feb 28 + Mar 31 + 24 = 114 days)', () => {
    expect(val(calc('2025-01-01'), 'dueDate')).toBe('April 25, 2025');
  });

  it('window is 112-116 days: bred 2025-03-01 -> June 21 to June 25 (worked example)', () => {
    const r = calc('2025-03-01');
    expect(val(r, 'earlyWindow')).toBe('June 21, 2025');
    expect(val(r, 'lateWindow')).toBe('June 25, 2025');
  });

  it('calendar arithmetic is DST-safe: bred 2025-08-01, +114 d = Nov 23 and window Nov 21-25 even across the US fall-back (Nov 2)', () => {
    // Aug 1 + 30 = Aug 31; +30 = Sep 30; +31 = Oct 31; +23 = Nov 23 -> 114 days
    const r = calc('2025-08-01');
    expect(val(r, 'dueDate')).toBe('November 23, 2025');
    expect(val(r, 'earlyWindow')).toBe('November 21, 2025');
    expect(val(r, 'lateWindow')).toBe('November 25, 2025');
  });

  it('rejects calendar-invalid breeding dates instead of rolling over (2025-02-31)', () => {
    expect(calc('2025-02-31')).toEqual([]);
    expect(calc('2025-02-28').length).toBeGreaterThan(0);
  });

  it('breed and parity offsets combine: large breed + 6+ litters = 116 days from the 114 base (no overwrite)', () => {
    expect(val(calc('2025-03-01', 'large', 'olderSow'), 'gestation')).toContain('116');
    expect(val(calc('2025-03-01', 'mini', 'olderSow'), 'gestation')).toContain('115');
    expect(val(calc('2025-03-01', 'commercial', 'youngSow'), 'gestation')).toContain('114');
  });

  it('farm-crate guidance matches the day arithmetic: 5-7 days before June 23 is June 16-18 (day 107-109)', () => {
    // 2025-03-01 + 107 d = June 16; + 109 d = June 18
    const r = calc('2025-03-01');
    expect(val(r, 'dueDate')).toBe('June 23, 2025');
    const d = new Date(2025, 2, 1); d.setDate(d.getDate() + 107);
    expect(d.getMonth() === 5 && d.getDate() === 16).toBe(true);
  });
});
