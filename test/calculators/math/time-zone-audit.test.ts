import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/time-zone';
import { calcOverlap, offsetMinutes, wallToUtc } from '../../../src/calculators/math/time-zone/tzMath';

// Expected values come from Python's zoneinfo (the IANA tz database), computed independently of the calculator.

type Vals = { fromZone: string; toZone: string; time: string; date: string; includeBusinessHours?: string };
const run = (v: Vals) => config.calculate({ includeBusinessHours: 'no', ...v });
const get = (r: ReturnType<typeof run>, id: string) => r.find((x) => x.id === id)?.value;

describe('time-zone audit: daylight saving follows the date', () => {
  const cases: [string, Vals, string, string][] = [
    ['LA -> London, summer (PDT/BST)', { fromZone: 'pst', toZone: 'bst', time: '9:00 AM', date: '2026-06-15' }, '5:00 PM', '8 hours ahead'],
    ['NY -> London, before UK clocks change (EDT/GMT)', { fromZone: 'est', toZone: 'bst', time: '9:00 AM', date: '2026-03-20' }, '1:00 PM', '4 hours ahead'],
    ['NY -> London, after UK clocks change (EDT/BST)', { fromZone: 'est', toZone: 'bst', time: '9:00 AM', date: '2026-03-31' }, '2:00 PM', '5 hours ahead'],
    ['NY -> India, winter', { fromZone: 'est', toZone: 'ist', time: '2:00 PM', date: '2026-01-20' }, '12:30 AM (next day)', '10.5 hours ahead'],
    ['NY -> India, summer', { fromZone: 'est', toZone: 'ist', time: '2:00 PM', date: '2026-07-20' }, '11:30 PM', '9.5 hours ahead'],
    ['NY -> Tokyo, winter', { fromZone: 'est', toZone: 'jst', time: '8:00 AM', date: '2026-01-12' }, '10:00 PM', '14 hours ahead'],
    ['NY -> Tokyo, summer', { fromZone: 'est', toZone: 'jst', time: '8:00 AM', date: '2026-08-10' }, '9:00 PM', '13 hours ahead'],
    ['Sydney -> London, January (AEDT/GMT)', { fromZone: 'aest', toZone: 'bst', time: '9:00 AM', date: '2026-01-15' }, '10:00 PM (previous day)', '11 hours behind'],
    ['Sydney -> London, July (AEST/BST)', { fromZone: 'aest', toZone: 'bst', time: '9:00 AM', date: '2026-07-15' }, '12:00 AM', '9 hours behind'],
    ['Adelaide -> UTC, January (+10:30)', { fromZone: 'acdt', toZone: 'gmt', time: '12:00 PM', date: '2026-01-15' }, '1:30 AM', '10.5 hours behind'],
    ['Adelaide -> UTC, July (+9:30)', { fromZone: 'acdt', toZone: 'gmt', time: '12:00 PM', date: '2026-07-15' }, '2:30 AM', '9.5 hours behind'],
    ['Auckland -> UTC, January (+13)', { fromZone: 'nzst', toZone: 'gmt', time: '12:00 PM', date: '2026-01-15' }, '11:00 PM (previous day)', '13 hours behind'],
    ['Newfoundland -> India, January (-3:30)', { fromZone: 'nst', toZone: 'ist', time: '12:00 PM', date: '2026-01-15' }, '9:00 PM', '9 hours ahead'],
    ['Newfoundland -> India, July (-2:30)', { fromZone: 'nst', toZone: 'ist', time: '12:00 PM', date: '2026-07-15' }, '8:00 PM', '8 hours ahead'],
  ];
  for (const [name, v, converted, diff] of cases) {
    it(name, () => {
      const r = run(v);
      expect(get(r, 'convertedTime')).toBe(converted);
      expect(get(r, 'timeDifference')).toBe(diff);
    });
  }

  it('same zone is "Same time"', () => {
    expect(get(run({ fromZone: 'est', toZone: 'est', time: '3:15 PM', date: '2026-05-05' }), 'timeDifference')).toBe('Same time');
  });

  it('labels the offset and flags daylight time', () => {
    const r = run({ fromZone: 'pst', toZone: 'bst', time: '9:00 AM', date: '2026-06-15' });
    expect(get(r, 'fromInfo')).toBe('Pacific (PST/PDT) -- UTC-7 (DST)');
    expect(get(r, 'toInfo')).toBe('United Kingdom (GMT/BST) -- UTC+1 (DST)');
    const w = run({ fromZone: 'pst', toZone: 'bst', time: '9:00 AM', date: '2026-01-15' });
    expect(get(w, 'fromInfo')).toBe('Pacific (PST/PDT) -- UTC-8');
    expect(get(w, 'toInfo')).toBe('United Kingdom (GMT/BST) -- UTC+0');
    expect(get(run({ fromZone: 'est', toZone: 'ist', time: '2:00 PM', date: '2026-01-20' }), 'toInfo')).toBe('India (IST) -- UTC+5:30');
  });

  it('blank date uses today (UTC) and says so', () => {
    const r = run({ fromZone: 'gmt', toZone: 'gmt', time: '9:00 AM', date: '' });
    expect(get(r, 'dateUsed')).toMatch(/^\d{4}-\d{2}-\d{2} \(today\)$/);
    expect(get(r, 'convertedTime')).toBe('9:00 AM');
  });
});

describe('time-zone audit: clock changes', () => {
  it('spring-forward gap: 2:30 AM in New York on 2026-03-08 does not exist', () => {
    const r = run({ fromZone: 'est', toZone: 'gmt', time: '2:30 AM', date: '2026-03-08' });
    expect(get(r, 'convertedTime')).toBe('7:30 AM'); // read as 3:30 AM EDT
    expect(String(get(r, 'dstNote'))).toContain('does not exist');
    expect(JSON.parse(String(get(r, '_tz'))).sourceClock).toBe('3:30 AM');
  });

  it('fall-back overlap: 1:30 AM in New York on 2026-11-01 happens twice, first one used', () => {
    const r = run({ fromZone: 'est', toZone: 'gmt', time: '1:30 AM', date: '2026-11-01' });
    expect(get(r, 'convertedTime')).toBe('5:30 AM');
    expect(String(get(r, 'dstNote'))).toContain('happens twice');
  });

  it('no note on an ordinary day', () => {
    expect(get(run({ fromZone: 'est', toZone: 'gmt', time: '2:30 AM', date: '2026-03-09' }), 'dstNote')).toBeUndefined();
  });

  it('tzMath primitives agree with the tz database', () => {
    const jan = Date.UTC(2026, 0, 15);
    const jul = Date.UTC(2026, 6, 15);
    expect(offsetMinutes('America/New_York', jan)).toBe(-300);
    expect(offsetMinutes('America/New_York', jul)).toBe(-240);
    expect(offsetMinutes('Australia/Adelaide', jan)).toBe(630);
    expect(offsetMinutes('Australia/Adelaide', jul)).toBe(570);
    expect(wallToUtc('America/New_York', Date.UTC(2026, 2, 8, 2, 30)).kind).toBe('gap');
    expect(wallToUtc('America/New_York', Date.UTC(2026, 10, 1, 1, 30)).kind).toBe('ambiguous');
  });
});

describe('time-zone audit: business-hours overlap', () => {
  it('finds a window that wraps past midnight (LA 4 PM = Tokyo 9 AM next day)', () => {
    const r = config.calculate({ fromZone: 'pst', toZone: 'jst', time: '4:00 PM', date: '2026-01-12', includeBusinessHours: 'yes' });
    expect(get(r, 'convertedTime')).toBe('9:00 AM (next day)');
    expect(get(r, 'businessOverlap')).toBe('9:00 AM -- 10:00 AM (1 hour, Japan (JST) time)');
  });

  it('NY -> London winter has 3 shared hours', () => {
    const r = config.calculate({ fromZone: 'est', toZone: 'bst', time: '9:00 AM', date: '2026-01-15', includeBusinessHours: 'yes' });
    expect(get(r, 'businessOverlap')).toBe('2:00 PM -- 5:00 PM (3 hours, United Kingdom (GMT/BST) time)');
  });

  it('no overlap for LA -> London and NY -> India', () => {
    expect(get(config.calculate({ fromZone: 'pst', toZone: 'bst', time: '9:00 AM', date: '2026-06-15', includeBusinessHours: 'yes' }), 'businessOverlap')).toBe(
      'No overlap in business hours',
    );
    expect(get(config.calculate({ fromZone: 'est', toZone: 'ist', time: '9:00 AM', date: '2026-01-20', includeBusinessHours: 'yes' }), 'businessOverlap')).toBe(
      'No overlap in business hours',
    );
  });

  it('calcOverlap: same zone = 8 h, 17 h apart = 1 h, grid has 24 cells', () => {
    expect(calcOverlap(0).durationHours).toBe(8);
    expect(calcOverlap(17 * 60).durationHours).toBe(1);
    expect(calcOverlap(630).durationHours).toBe(0);
    expect(calcOverlap(5 * 60).hours).toHaveLength(24);
  });
});

describe('time-zone audit: panel data and input validation', () => {
  it('_tz carries the real source time and the world clock for that instant', () => {
    const r = run({ fromZone: 'gmt', toZone: 'est', time: '2:00 PM', date: '2026-01-12' });
    const tz = JSON.parse(String(get(r, '_tz')));
    expect(tz.sourceClock).toBe('2:00 PM');
    expect(tz.targetClock).toBe('9:00 AM');
    const clock = Object.fromEntries(tz.worldClock.map((w: { label: string; clock: string; dayDelta: number }) => [w.label, [w.clock, w.dayDelta]]));
    expect(clock).toEqual({
      London: ['2:00 PM', 0],
      'New York': ['9:00 AM', 0],
      'Los Angeles': ['6:00 AM', 0],
      Tokyo: ['11:00 PM', 0],
      Sydney: ['1:00 AM', 1],
      Dubai: ['6:00 PM', 0],
      Singapore: ['10:00 PM', 0],
      Berlin: ['3:00 PM', 0],
    });
  });

  it('rejects malformed times, unknown zones, impossible dates', () => {
    const base = { fromZone: 'est', toZone: 'pst', time: '2:30 PM', date: '2026-01-15' };
    expect(run({ ...base, time: '25:99' })).toEqual([]);
    expect(run({ ...base, time: 'noonish' })).toEqual([]);
    expect(run({ ...base, fromZone: 'mars' })).toEqual([]);
    expect(run({ ...base, date: '2026-02-30' })).toEqual([]);
    expect(run({ ...base, date: '01-15-2026' })).toEqual([]);
  });

  it('dates outside 1970-2100 give a clear error', () => {
    const r = run({ fromZone: 'est', toZone: 'pst', time: '2:30 PM', date: '2101-01-01' });
    expect(r.map((x) => x.id)).toEqual(['error']);
  });
});
