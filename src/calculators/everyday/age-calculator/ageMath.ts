import { zodiacSign, chineseAnimal } from '../../../utils/zodiac';
import { parseIsoDate, isLeapYear, daysBetween, addDays, calendarDiff } from '../../../utils/dates';

// Pure date maths for the age calculator. All differences use UTC day numbers so a
// DST change can never drop or add a day, and milestone dates are built with
// calendar arithmetic (new Date(y, m, d + n)) instead of 86 400 000 ms steps.

export { isLeapYear, daysBetween, addDays };

/** Local calendar date of "today" at midnight. */
export function today(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export const ageBreakdown = calendarDiff;

/** Birthday in a given year; a 29 Feb birthday falls on 1 Mar in non-leap years. */
export function birthdayInYear(birth: Date, year: number): Date {
  if (birth.getMonth() === 1 && birth.getDate() === 29 && !isLeapYear(year)) return new Date(year, 2, 1);
  return new Date(year, birth.getMonth(), birth.getDate());
}

export { zodiacSign, chineseAnimal };

export interface AgeInfo {
  birth: Date;
  to: Date;
  hasToDate: boolean;
  years: number;
  months: number;
  days: number;
  rawYears: number;
  borrowDays: boolean;
  borrowMonths: boolean;
  totalDays: number;
  nextBirthday: Date;
  daysUntilBirthday: number;
  /** days from the most recent birthday up to `to`, and the length of that birthday-year */
  daysSinceBirthday: number;
  birthdayYearLength: number;
  isBirthdayToday: boolean;
  day10k: Date;
  daysTo10k: number;
  nextDecadeAge: number;
  decadeDate: Date;
  decadeIn: { years: number; months: number; days: number };
}

/** Parse and compute everything; null for blank/invalid/future-birth input. */
export function computeAge(values: Record<string, string>, now: Date = today()): AgeInfo | null {
  const birth = parseIsoDate(values.birthDate);
  if (!birth) return null;
  const toStr = values.toDate?.trim();
  const toParsed = toStr ? parseIsoDate(toStr) : null;
  if (toStr && !toParsed) return null; // typed but invalid as-of date: don't silently use today
  const to = toParsed ?? now;
  if (birth > to) return null;

  const b = ageBreakdown(birth, to);

  const thisYear = birthdayInYear(birth, to.getFullYear());
  const isBirthdayToday = thisYear.getTime() === to.getTime();
  const nextBirthday = thisYear > to ? thisYear : birthdayInYear(birth, to.getFullYear() + 1);
  const lastBirthday = thisYear <= to ? thisYear : birthdayInYear(birth, to.getFullYear() - 1);
  const daysUntilBirthday = daysBetween(to, nextBirthday);
  const daysSinceBirthday = daysBetween(lastBirthday, to);

  const day10k = addDays(birth, 10000);
  const daysTo10k = Math.max(0, daysBetween(to, day10k));

  const nextDecadeAge = (Math.floor(b.years / 10) + 1) * 10;
  const decadeDate = birthdayInYear(birth, birth.getFullYear() + nextDecadeAge);
  const d = ageBreakdown(to, decadeDate);

  return {
    birth, to, hasToDate: !!toParsed,
    years: b.years, months: b.months, days: b.days, rawYears: b.rawYears,
    borrowDays: b.borrowDays, borrowMonths: b.borrowMonths, totalDays: b.totalDays,
    nextBirthday, daysUntilBirthday, daysSinceBirthday,
    birthdayYearLength: daysBetween(lastBirthday, nextBirthday),
    isBirthdayToday, day10k, daysTo10k, nextDecadeAge, decadeDate,
    decadeIn: { years: d.years, months: d.months, days: d.days },
  };
}
