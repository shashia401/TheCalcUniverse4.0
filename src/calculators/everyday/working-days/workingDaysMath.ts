import { parseIsoDate } from '../../../utils/dates';

// Pure working-day maths shared by index.ts and the panel. Work on UTC day numbers (no DST, no Date rollover).
// Working day = Monday-Friday that is not a US federal holiday (when holidays are excluded).
// Federal holidays follow 5 U.S.C. 6103 with the OBSERVED rule used for federal employees: a holiday that falls on a
// Saturday is observed on the preceding Friday, one that falls on a Sunday on the following Monday.

const dn = (y: number, m: number, d: number) => Math.round(Date.UTC(y, m, d) / 86400000);
/** 0 = Sunday ... 6 = Saturday for a UTC day number (1970-01-01 was a Thursday). */
export const weekdayOf = (n: number) => (((n + 4) % 7) + 7) % 7;

/** n-th (1-based) given weekday of a month; n = -1 for the last one. */
function nthWeekday(y: number, m: number, weekday: number, n: number): number {
  if (n > 0) {
    const first = dn(y, m, 1);
    return first + ((weekday - weekdayOf(first) + 7) % 7) + (n - 1) * 7;
  }
  const last = dn(y, m + 1, 0);
  return last - ((weekdayOf(last) - weekday + 7) % 7);
}

/** Observed federal holiday day-numbers that can fall in calendar year `y` (includes the 31 Dec observance of the next 1 Jan). */
export function federalHolidays(y: number): Map<number, string> {
  const out = new Map<number, string>();
  const observe = (n: number, name: string) => {
    const w = weekdayOf(n);
    out.set(w === 6 ? n - 1 : w === 0 ? n + 1 : n, name);
  };
  for (const yy of [y, y + 1]) {
    if (yy === y + 1) {
      // only New Year's Day of next year can be observed on 31 Dec of this year (Saturday 1 Jan -> Friday)
      const ny = dn(yy, 0, 1);
      if (weekdayOf(ny) === 6) out.set(ny - 1, "New Year's Day (observed)");
      continue;
    }
    observe(dn(yy, 0, 1), "New Year's Day");
    out.set(nthWeekday(yy, 0, 1, 3), 'Martin Luther King Jr. Day');
    out.set(nthWeekday(yy, 1, 1, 3), "Washington's Birthday (Presidents Day)");
    out.set(nthWeekday(yy, 4, 1, -1), 'Memorial Day');
    if (yy >= 2021) observe(dn(yy, 5, 19), 'Juneteenth');
    observe(dn(yy, 6, 4), 'Independence Day');
    out.set(nthWeekday(yy, 8, 1, 1), 'Labor Day');
    out.set(nthWeekday(yy, 9, 1, 2), 'Columbus Day');
    observe(dn(yy, 10, 11), 'Veterans Day');
    out.set(nthWeekday(yy, 10, 4, 4), 'Thanksgiving Day');
    observe(dn(yy, 11, 25), 'Christmas Day');
  }
  return out;
}

export type CountMethod = 'end' | 'both' | 'neither';

export interface WorkingDaysInfo {
  start: number;
  end: number;
  method: CountMethod;
  excludeHolidays: boolean;
  /** first/last day actually counted (countedFirst > countedLast means nothing is counted) */
  countedFirst: number;
  countedLast: number;
  calendarDays: number;
  weekendDays: number;
  holidayDays: number;
  workingDays: number;
  holidays: { day: number; name: string }[];
}

function parseDay(s: string | undefined): number | null {
  const d = parseIsoDate(s);
  if (!d) return null;
  const y = d.getFullYear();
  return y >= 1900 && y <= 2200 ? dn(y, d.getMonth(), d.getDate()) : null;
}

export function workingDaysInfo(values: Record<string, string>): WorkingDaysInfo | null {
  const start = parseDay(values.startDate);
  const end = parseDay(values.endDate);
  if (start === null || end === null || start > end) return null;
  const method: CountMethod = values.includeStart === 'both' ? 'both' : values.includeStart === 'neither' ? 'neither' : 'end';
  const excludeHolidays = (values.holidays || 'yes') === 'yes';

  const countedFirst = method === 'both' ? start : start + 1;
  const countedLast = method === 'neither' ? end - 1 : end;

  const holidayMap = new Map<number, string>();
  if (excludeHolidays && countedFirst <= countedLast) {
    const y0 = new Date(countedFirst * 86400000).getUTCFullYear();
    const y1 = new Date(countedLast * 86400000).getUTCFullYear();
    for (let y = y0 - 1; y <= y1 + 1; y++) for (const [k, v] of federalHolidays(y)) holidayMap.set(k, v);
  }

  let weekendDays = 0;
  let holidayDays = 0;
  let workingDays = 0;
  const holidays: { day: number; name: string }[] = [];
  for (let d = countedFirst; d <= countedLast; d++) {
    const w = weekdayOf(d);
    if (w === 0 || w === 6) weekendDays++;
    else if (holidayMap.has(d)) {
      holidayDays++;
      holidays.push({ day: d, name: holidayMap.get(d) as string });
    } else workingDays++;
  }
  return {
    start, end, method, excludeHolidays, countedFirst, countedLast,
    calendarDays: Math.max(0, countedLast - countedFirst + 1),
    weekendDays, holidayDays, workingDays, holidays,
  };
}
