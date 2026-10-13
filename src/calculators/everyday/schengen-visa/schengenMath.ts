import { parseIsoDate, toIsoDate } from '../../../utils/dates';

// Pure 90/180-day maths shared by index.ts and the panel.
// Rule (European Commission short-stay calculator): a stay is allowed while, on every day of it, the days spent in the
// Schengen area during the 180 days ENDING THAT DAY (that day included) total at most 90. The day of entry and the day of
// exit both count as days of stay. Days are whole calendar days; a day touched by two trips is counted once.
// Source: https://home-affairs.ec.europa.eu/policies/schengen/border-crossing/short-stay-calculator_en

export const WINDOW_DAYS = 180;
export const MAX_DAYS = 90;
export const MAX_TRIPS = 5;

/** UTC day number of a local calendar date (immune to DST). */
export const dayNum = (d: Date) => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
export const fromDayNum = (n: number) => {
  const d = new Date(n * 86400000);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

export interface Trip {
  start: number; // day numbers, inclusive
  end: number;
}

/** Number of distinct stay days in [d - 179, d] given a set of stay day numbers. */
export function daysInWindow(stay: Set<number>, d: number): number {
  let n = 0;
  for (let x = d - (WINDOW_DAYS - 1); x <= d; x++) if (stay.has(x)) n++;
  return n;
}

export function staySet(trips: Trip[], upTo: number): Set<number> {
  const s = new Set<number>();
  for (const t of trips) for (let x = t.start; x <= Math.min(t.end, upTo); x++) s.add(x);
  return s;
}

/**
 * Longest continuous stay that could start on `checkDay` without the 180-day count ever exceeding 90 on any day,
 * given the earlier trips (days after the check date are ignored). Capped at 90.
 */
export function maxStayFrom(trips: Trip[], checkDay: number): number {
  const stay = staySet(trips, checkDay - 1);
  let n = 0;
  for (let d = checkDay; n < MAX_DAYS; d++) {
    stay.add(d);
    if (daysInWindow(stay, d) > MAX_DAYS) break;
    n++;
  }
  return n;
}

/** First day on or after `checkDay` on which one more stay day is allowed (that day plus the 179 before it, <= 90). */
export function firstAllowedDay(trips: Trip[], checkDay: number): number | null {
  const past = staySet(trips, checkDay - 1);
  for (let d = checkDay; d <= checkDay + 400; d++) {
    let n = 1;
    for (let x = d - (WINDOW_DAYS - 1); x < d; x++) if (past.has(x)) n++;
    if (n <= MAX_DAYS) return d;
  }
  return null;
}

export interface SchengenInfo {
  checkDay: number;
  windowStart: number;
  trips: Trip[];
  used: number;
  remaining: number;
  overstay: boolean;
  /** per trip: days of that trip inside the window */
  tripDays: number[];
  overlapping: boolean;
  maxStay: number;
  allowedFrom: number | null;
  /** trips longer than 366 days, ignored as probable typos */
  ignoredLong: number;
}

function parseDay(s: string | undefined): number | null {
  const d = parseIsoDate(s);
  if (!d) return null;
  const y = d.getFullYear();
  return y >= 1900 && y <= 2100 ? dayNum(d) : null;
}

/** null when no complete valid trip, or when a typed check date is not a real date. */
export function schengenInfo(values: Record<string, string>, todayDay: number = dayNum(new Date())): SchengenInfo | null {
  const checkStr = values.checkDate?.trim();
  let checkDay = todayDay;
  if (checkStr) {
    const c = parseDay(checkStr);
    if (c === null) return null;
    checkDay = c;
  }
  const trips: Trip[] = [];
  let ignoredLong = 0;
  for (let i = 1; i <= MAX_TRIPS; i++) {
    const s = parseDay(values[`trip${i}Start`]);
    const e = parseDay(values[`trip${i}End`]);
    if (s === null || e === null || e < s) continue;
    if (e - s + 1 > 366) ignoredLong++;
    else trips.push({ start: s, end: e });
  }
  if (trips.length === 0) return null;

  const windowStart = checkDay - (WINDOW_DAYS - 1);
  const stay = staySet(trips, checkDay);
  const used = daysInWindow(stay, checkDay);
  const tripDays = trips.map((t) => {
    const a = Math.max(t.start, windowStart);
    const b = Math.min(t.end, checkDay);
    return b >= a ? b - a + 1 : 0;
  });
  const sorted = [...trips].sort((a, b) => a.start - b.start);
  const overlapping = sorted.some((t, i) => i > 0 && t.start <= sorted[i - 1].end);
  return {
    checkDay,
    windowStart,
    trips,
    used,
    remaining: MAX_DAYS - used,
    overstay: used > MAX_DAYS,
    tripDays,
    overlapping,
    maxStay: maxStayFrom(trips, checkDay),
    allowedFrom: used >= MAX_DAYS ? firstAllowedDay(trips, checkDay) : null,
    ignoredLong,
  };
}

export { toIsoDate };
