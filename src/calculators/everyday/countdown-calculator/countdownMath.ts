import { addDays, calendarDiff, daysBetween, isLeapYear, parseIsoDate } from '../../../utils/dates';

// Pure countdown maths shared by index.ts and the panel. Differences use WALL-CLOCK time
// (local calendar date + HH:MM turned into UTC minutes), so a daylight-saving change can
// not add or drop an hour, and the Y/M/W/D breakdown is real calendar arithmetic.

export interface CountdownInfo {
  isPast: boolean;
  target: Date;
  start: Date;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  totalHours: number;
  totalMinutes: number;
  hoursPart: number;
  minutesPart: number;
  years: number;
  months: number;
  weeks: number;
  days: number;
  /** % of the target's calendar year that has passed at the target moment; null if start and target are in different years */
  yearPercent: number | null;
}

const wallMinutes = (d: Date) =>
  Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()) / 60000);

/** "HH:MM" (00:00-23:59) -> [h, m]; null when malformed. */
export function parseTime(s: string | undefined): [number, number] | null {
  const m = /^(\d{2}):(\d{2})$/.exec((s ?? '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  return h < 24 && mi < 60 ? [h, mi] : null;
}

export function countdownInfo(values: Record<string, string>, now: Date = new Date()): CountdownInfo | null {
  const targetDay = parseIsoDate(values.targetDate);
  if (!targetDay) return null;

  let h = 0;
  let mi = 0;
  if (values.includeTime !== 'No' && values.targetTime?.trim()) {
    const t = parseTime(values.targetTime);
    if (!t) return null;
    [h, mi] = t;
  }
  const target = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), h, mi);

  const startStr = values.startDate?.trim();
  let start = now;
  if (startStr) {
    const s = parseIsoDate(startStr);
    if (!s) return null;
    start = s;
  }

  const diff = wallMinutes(target) - wallMinutes(start);
  const isPast = diff < 0;
  const abs = Math.abs(diff);
  const earlier = isPast ? target : start;

  const totalDays = Math.floor(abs / 1440);
  const earlierDay = new Date(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
  const cal = calendarDiff(earlierDay, addDays(earlierDay, totalDays));

  let yearPercent: number | null = null;
  if (start.getFullYear() === target.getFullYear()) {
    const y = target.getFullYear();
    const dayOfYear = daysBetween(new Date(y, 0, 1), targetDay);
    const frac = (h * 60 + mi) / 1440;
    yearPercent = Math.round(((dayOfYear + frac) / (isLeapYear(y) ? 366 : 365)) * 100);
  }

  return {
    isPast,
    target,
    start,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalMonths: cal.years * 12 + cal.months,
    totalHours: Math.floor(abs / 60),
    totalMinutes: abs,
    hoursPart: Math.floor(abs / 60) % 24,
    minutesPart: abs % 60,
    years: cal.years,
    months: cal.months,
    weeks: Math.floor(cal.days / 7),
    days: cal.days % 7,
    yearPercent,
  };
}
