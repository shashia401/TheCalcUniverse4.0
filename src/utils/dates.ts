/**
 * Parse a strict YYYY-MM-DD string as a LOCAL calendar date.
 * Returns null for malformed or calendar-invalid input. `new Date('2025-02-31T00:00:00')`
 * silently rolls over to 3 March, so the parts are round-tripped and compared.
 */
export function parseIsoDate(s: string | undefined): Date | null {
  const str = s?.trim();
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const [y, m, d] = str.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

/** Local YYYY-MM-DD (the inverse of parseIsoDate; avoids toISOString's UTC shift). */
export function toIsoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** UTC day number of a local calendar date (DST-proof: no 86 400 000 ms arithmetic on local midnights). */
const dayNum = (d: Date) => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

/** Whole calendar days from a to b (negative when b is earlier). Ignores time of day and DST. */
export const daysBetween = (a: Date, b: Date) => dayNum(b) - dayNum(a);

/** Calendar date n days after d (local midnight), safe across DST and month ends. */
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/**
 * Calendar-borrow breakdown of `to` - `from` (from <= to) into years, months, days.
 * Days borrow the length of the month before `to`; if that still leaves a negative day count
 * (e.g. 31 Jan -> 1 Mar) the start is clamped to month-end and the real days are counted.
 */
export function calendarDiff(from: Date, to: Date) {
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();
  const rawYears = years;
  const borrowDays = days < 0;
  if (days < 0) {
    months -= 1;
    days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
  }
  const borrowMonths = months < 0;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (days < 0) {
    const idx = from.getFullYear() * 12 + from.getMonth() + years * 12 + months;
    const ay = Math.floor(idx / 12);
    const am = idx % 12;
    const dim = new Date(ay, am + 1, 0).getDate();
    days = daysBetween(new Date(ay, am, Math.min(from.getDate(), dim)), to);
  }
  return { years, months, days, rawYears, borrowDays, borrowMonths, totalDays: daysBetween(from, to) };
}
