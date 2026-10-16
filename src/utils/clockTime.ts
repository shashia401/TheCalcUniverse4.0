// One parser for clock times typed as text ("9:00 AM", "5 pm", "17:30"). The time, time-duration and time-card
// calculators (and the time panel, twice) each used to carry their own copy of this logic.

export interface ClockTimeOptions {
  /** Also accept a bare hour with no colon as a 24-hour time ("9" = 09:00, "17" = 17:00). */
  bareHour?: boolean;
  /** Also accept "24:00" as the end of the day (1440 minutes). */
  endOfDay?: boolean;
}

/**
 * Minutes since midnight for a typed time, or null when it is not a real time of day.
 *
 *   "9:00 AM", "9 am", "9:00AM"  -> 540        "12:00 AM" -> 0       "12:00 PM" -> 720
 *   "14:30", "09:05"             -> 870, 545   "13:00 PM", "25:00", "9:75", "9:00:30", "abc", "" -> null
 */
export function parseClockTime(input: string, opts: ClockTimeOptions = {}): number | null {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i.exec((input ?? '').trim());
  if (!m) return null;
  const ap = m[3]?.toLowerCase();
  if (m[2] === undefined && !ap && !opts.bareHour) return null; // a bare "9" is only a time where the caller allows it
  let h = Number(m[1]);
  const min = m[2] === undefined ? 0 : Number(m[2]);
  if (min > 59) return null;
  if (ap) {
    if (h < 1 || h > 12) return null;
    if (ap === 'pm' && h !== 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    return h * 60 + min;
  }
  if (opts.endOfDay && h === 24 && min === 0) return 1440;
  if (h > 23) return null;
  return h * 60 + min;
}

/** Minutes from `start` to `end` (both minutes since midnight); an earlier end means the shift crosses midnight. */
export function minutesBetween(start: number, end: number): number {
  return end < start ? end + 1440 - start : end - start;
}
