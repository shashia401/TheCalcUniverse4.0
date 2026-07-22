import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/time-zone';
import { getValue, parseNumber, near } from '../../helpers';

describe('time zone calculator', () => {
  /* ------------------------------------------------------------------ */
  /*  Basic conversion                                                   */
  /* ------------------------------------------------------------------ */

  it('converts EST to PST (2:30 PM EST -> 11:30 AM PST)', () => {
    const r = config.calculate({
      fromZone: 'est',
      toZone: 'pst',
      time: '2:30 PM',
      date: '2025-01-15',
      includeBusinessHours: 'no',
    });
    expect(getValue(r, 'convertedTime')).toBe('11:30 AM');
    expect(getValue(r, 'timeDifference')).toBe('3 hours behind');
  });

  it('converts PST to CET (9:00 AM PST -> 6:00 PM CET)', () => {
    const r = config.calculate({
      fromZone: 'pst',
      toZone: 'cet',
      time: '9:00 AM',
      date: '2025-01-15',
      includeBusinessHours: 'no',
    });
    expect(getValue(r, 'convertedTime')).toBe('6:00 PM');
  });

  it('converts same zone returns same time', () => {
    const r = config.calculate({
      fromZone: 'est',
      toZone: 'est',
      time: '3:00 PM',
      date: '2025-01-15',
      includeBusinessHours: 'no',
    });
    expect(getValue(r, 'convertedTime')).toBe('3:00 PM');
    expect(getValue(r, 'timeDifference')).toBe('Same time');
  });

  /* ------------------------------------------------------------------ */
  /*  Time parsing: 12-hour format                                       */
  /* ------------------------------------------------------------------ */

  it('parses 12-hour PM time correctly', () => {
    const r = config.calculate({
      fromZone: 'gmt',
      toZone: 'gmt',
      time: '2:30 PM',
      date: '',
      includeBusinessHours: 'no',
    });
    expect(getValue(r, 'convertedTime')).toBe('2:30 PM');
  });

  it('parses 12-hour AM time correctly', () => {
    const r = config.calculate({
      fromZone: 'gmt',
      toZone: 'gmt',
      time: '9:00 AM',
      date: '',
      includeBusinessHours: 'no',
    });
    expect(getValue(r, 'convertedTime')).toBe('9:00 AM');
  });

  it('parses noon (12:00 PM) correctly', () => {
    const r = config.calculate({
      fromZone: 'gmt',
      toZone: 'est',
      time: '12:00 PM',
      date: '',
      includeBusinessHours: 'no',
    });
    // 12:00 GMT = 7:00 AM EST (UTC-5)
    expect(getValue(r, 'convertedTime')).toBe('7:00 AM');
  });

  it('parses midnight (12:00 AM) correctly', () => {
    const r = config.calculate({
      fromZone: 'gmt',
      toZone: 'cet',
      time: '12:00 AM',
      date: '',
      includeBusinessHours: 'no',
    });
    // 00:00 GMT = 1:00 AM CET (UTC+1)
    expect(getValue(r, 'convertedTime')).toBe('1:00 AM');
  });

  /* ------------------------------------------------------------------ */
  /*  Time parsing: 24-hour format                                       */
  /* ------------------------------------------------------------------ */

  it('parses 24-hour time correctly (14:30 -> 2:30 PM)', () => {
    const r = config.calculate({
      fromZone: 'gmt',
      toZone: 'gmt',
      time: '14:30',
      date: '',
      includeBusinessHours: 'no',
    });
    expect(getValue(r, 'convertedTime')).toBe('2:30 PM');
  });

  it('parses 24-hour time (09:00 -> 9:00 AM)', () => {
    const r = config.calculate({
      fromZone: 'gmt',
      toZone: 'gmt',
      time: '09:00',
      date: '',
      includeBusinessHours: 'no',
    });
    expect(getValue(r, 'convertedTime')).toBe('9:00 AM');
  });

  /* ------------------------------------------------------------------ */
  /*  Business hours overlap                                             */
  /* ------------------------------------------------------------------ */

  it('computes business hours overlap between EST and PST', () => {
    const r = config.calculate({
      fromZone: 'est',
      toZone: 'pst',
      time: '2:30 PM',
      date: '2025-01-15',
      includeBusinessHours: 'yes',
    });
    const overlap = getValue(r, 'businessOverlap');
    expect(overlap).toBeTruthy();
    expect(overlap).toContain('hours');
    // Should show non-zero hours overlap
    const hoursMatch = overlap.match(/(\d+)\s*hours?/);
    if (hoursMatch) {
      expect(parseInt(hoursMatch[1], 10)).toBeGreaterThan(0);
    }
  });

  it('includes overlap data when business hours requested', () => {
    const r = config.calculate({
      fromZone: 'est',
      toZone: 'pst',
      time: '2:30 PM',
      date: '2025-01-15',
      includeBusinessHours: 'yes',
    });
    const overlapRaw = getValue(r, 'overlapData');
    expect(overlapRaw).toBeTruthy();
    const parsed = JSON.parse(overlapRaw);
    expect(parsed).toHaveProperty('overlapStart');
    expect(parsed).toHaveProperty('overlapEnd');
    expect(parsed).toHaveProperty('durationHours');
    expect(parsed).toHaveProperty('hours');
    expect(parsed.hours).toHaveLength(24);
  });

  it('does not include business overlap when not requested', () => {
    const r = config.calculate({
      fromZone: 'est',
      toZone: 'pst',
      time: '2:30 PM',
      date: '2025-01-15',
      includeBusinessHours: 'no',
    });
    const biz = r.find((x) => x.id === 'businessOverlap');
    expect(biz).toBeUndefined();
  });

  /* ------------------------------------------------------------------ */
  /*  Half-hour offset zone (IST)                                        */
  /* ------------------------------------------------------------------ */

  it('converts correctly with half-hour offset zone (EST to IST)', () => {
    const r = config.calculate({
      fromZone: 'est',
      toZone: 'ist',
      time: '10:00 AM',
      date: '2025-01-15',
      includeBusinessHours: 'no',
    });
    // EST (UTC-5) to IST (UTC+5:30) = +10:30
    // 10:00 AM EST = 8:30 PM IST
    expect(getValue(r, 'convertedTime')).toBe('8:30 PM');
  });

  /* ------------------------------------------------------------------ */
  /*  Missing / invalid fields                                           */
  /* ------------------------------------------------------------------ */

  it('returns empty for missing time', () => {
    const r = config.calculate({
      fromZone: 'est',
      toZone: 'pst',
      time: '',
      date: '',
      includeBusinessHours: 'no',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing fromZone', () => {
    const r = config.calculate({
      fromZone: '',
      toZone: 'pst',
      time: '2:30 PM',
      date: '',
      includeBusinessHours: 'no',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for missing toZone', () => {
    const r = config.calculate({
      fromZone: 'est',
      toZone: '',
      time: '2:30 PM',
      date: '',
      includeBusinessHours: 'no',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for unparseable time', () => {
    const r = config.calculate({
      fromZone: 'est',
      toZone: 'pst',
      time: 'not-a-time',
      date: '',
      includeBusinessHours: 'no',
    });
    expect(r).toEqual([]);
  });

  /* ------------------------------------------------------------------ */
  /*  From/to info                                                       */
  /* ------------------------------------------------------------------ */

  it('shows correct from and to info', () => {
    const r = config.calculate({
      fromZone: 'est',
      toZone: 'gmt',
      time: '3:00 PM',
      date: '',
      includeBusinessHours: 'no',
    });
    expect(getValue(r, 'fromInfo')).toContain('Eastern');
    expect(getValue(r, 'toInfo')).toContain('GMT');
  });

  /* ------------------------------------------------------------------ */
  /*  Day boundary crossings                                              */
  /* ------------------------------------------------------------------ */

  it('converts PST to JST crossing into next day (9:00 AM PST -> 1:00 AM JST next day)', () => {
    const r = config.calculate({
      fromZone: 'pst',
      toZone: 'jst',
      time: '9:00 AM',
      date: '2025-06-15',
      includeBusinessHours: 'no',
    });
    // PST (UTC-8) to JST (UTC+9) = 17 hours ahead
    // 9:00 AM PST = 1:00 AM JST (next day)
    expect(getValue(r, 'convertedTime')).toContain('next day');
    expect(getValue(r, 'timeDifference')).toContain('ahead');
  });

  it('converts JST to PST crossing into previous day (6:00 PM JST -> 1:00 AM PST, same date)', () => {
    const r = config.calculate({
      fromZone: 'jst',
      toZone: 'pst',
      time: '6:00 PM',
      date: '2025-06-15',
      includeBusinessHours: 'no',
    });
    // JST (UTC+9) to PST (UTC-8) = 17 hours behind
    // 6:00 PM JST = 1:00 AM PST (same calendar date)
    expect(getValue(r, 'convertedTime')).toContain('1:00 AM');
  });

  /* ------------------------------------------------------------------ */
  /*  Date handling — date is a reference label, not validated           */
  /* ------------------------------------------------------------------ */

  it('still converts with non-standard date format (date is reference only)', () => {
    const r = config.calculate({
      fromZone: 'est',
      toZone: 'pst',
      time: '2:30 PM',
      date: '01-15-2025',
      includeBusinessHours: 'no',
    });
    expect(r).not.toEqual([]);
    expect(getValue(r, 'convertedTime')).toBe('11:30 AM');
  });

  it('still converts with unrealistic month (date is reference only)', () => {
    const r = config.calculate({
      fromZone: 'est',
      toZone: 'pst',
      time: '2:30 PM',
      date: '2025-13-01',
      includeBusinessHours: 'no',
    });
    expect(r).not.toEqual([]);
    expect(getValue(r, 'convertedTime')).toBe('11:30 AM');
  });

  it('still converts with unrealistic day (date is reference only)', () => {
    const r = config.calculate({
      fromZone: 'est',
      toZone: 'pst',
      time: '2:30 PM',
      date: '2025-01-32',
      includeBusinessHours: 'no',
    });
    expect(r).not.toEqual([]);
    expect(getValue(r, 'convertedTime')).toBe('11:30 AM');
  });

  it('still converts with historical date (date is reference only)', () => {
    const r = config.calculate({
      fromZone: 'est',
      toZone: 'pst',
      time: '2:30 PM',
      date: '1800-01-01',
      includeBusinessHours: 'no',
    });
    expect(r).not.toEqual([]);
    expect(getValue(r, 'convertedTime')).toBe('11:30 AM');
  });

  /* ------------------------------------------------------------------ */
  /*  Real-world search queries                                           */
  /* ------------------------------------------------------------------ */

  it('converts UTC to Tokyo — "what time is it in Tokyo" (9:00 AM UTC -> 6:00 PM JST)', () => {
    const r = config.calculate({
      fromZone: 'gmt',
      toZone: 'jst',
      time: '9:00 AM',
      date: '2025-06-15',
      includeBusinessHours: 'no',
    });
    // UTC+0 to JST (UTC+9) = 9 hours ahead
    expect(getValue(r, 'convertedTime')).toBe('6:00 PM');
    expect(getValue(r, 'timeDifference')).toBe('9 hours ahead');
  });

  it('converts EST to UTC — "UTC to EST converter" (3:00 PM EST -> 8:00 PM UTC)', () => {
    const r = config.calculate({
      fromZone: 'est',
      toZone: 'gmt',
      time: '3:00 PM',
      date: '2025-06-15',
      includeBusinessHours: 'no',
    });
    // EST (UTC-5) to UTC = 5 hours ahead
    expect(getValue(r, 'convertedTime')).toBe('8:00 PM');
    expect(getValue(r, 'timeDifference')).toBe('5 hours ahead');
  });

  /* ------------------------------------------------------------------ */
  /*  Meeting planner — business hours across distant zones               */
  /* ------------------------------------------------------------------ */

  it('computes business hours between London and Tokyo (no overlap due to 9-hour gap)', () => {
    const r = config.calculate({
      fromZone: 'gmt',
      toZone: 'jst',
      time: '12:00 PM',
      date: '2025-06-15',
      includeBusinessHours: 'yes',
    });
    const overlap = getValue(r, 'businessOverlap');
    // GMT business hours 9-17 map to JST 18-2 (next day) — no overlap
    expect(overlap).toBe('No overlap in business hours');
  });

  it('computes business hours between London and New York (partial overlap)', () => {
    const r = config.calculate({
      fromZone: 'gmt',
      toZone: 'est',
      time: '12:00 PM',
      date: '2025-06-15',
      includeBusinessHours: 'yes',
    });
    const overlap = getValue(r, 'businessOverlap');
    // GMT 9-17 (9-17 UTC) vs EST 9-17 (14-22 UTC) = overlap 14-17 UTC
    expect(overlap).toContain('hours');
    expect(overlap).not.toBe('No overlap in business hours');
  });

  /* ------------------------------------------------------------------ */
  /*  Validation: invalid zone IDs                                        */
  /* ------------------------------------------------------------------ */

  it('returns empty for invalid source zone ID', () => {
    const r = config.calculate({
      fromZone: 'nonexistent',
      toZone: 'pst',
      time: '2:30 PM',
      date: '',
      includeBusinessHours: 'no',
    });
    expect(r).toEqual([]);
  });

  it('returns empty for invalid target zone ID', () => {
    const r = config.calculate({
      fromZone: 'est',
      toZone: 'nonexistent',
      time: '2:30 PM',
      date: '',
      includeBusinessHours: 'no',
    });
    expect(r).toEqual([]);
  });
});
