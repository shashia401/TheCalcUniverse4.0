// Time zone arithmetic on real IANA zones (via Intl), so Daylight Saving Time follows the chosen DATE.
//
// The previous version stored one fixed offset per zone ("Pacific -8", "British +1", "Australia Central +10.5") and never
// applied DST, even though the page told people the date was "for DST context": New York -> London in late March, or
// any July conversion from a US zone, came out an hour wrong, and "British (BST) +1" was wrong all winter.

export interface ZoneDef {
  id: string;
  label: string;
  iana: string;
}

/** Same ids as before (saved links keep working); labels now say which names apply when. */
export const ZONES: ZoneDef[] = [
  { id: 'pst', label: 'Pacific (PST/PDT)', iana: 'America/Los_Angeles' },
  { id: 'mst', label: 'Mountain (MST/MDT)', iana: 'America/Denver' },
  { id: 'cst_am', label: 'Central (CST/CDT)', iana: 'America/Chicago' },
  { id: 'est', label: 'Eastern (EST/EDT)', iana: 'America/New_York' },
  { id: 'gmt', label: 'GMT/UTC', iana: 'UTC' },
  { id: 'bst', label: 'United Kingdom (GMT/BST)', iana: 'Europe/London' },
  { id: 'cet', label: 'Central Europe (CET/CEST)', iana: 'Europe/Berlin' },
  { id: 'eet', label: 'Eastern Europe (EET/EEST)', iana: 'Europe/Athens' },
  { id: 'msk', label: 'Moscow (MSK)', iana: 'Europe/Moscow' },
  { id: 'gst', label: 'Gulf (GST)', iana: 'Asia/Dubai' },
  { id: 'ist', label: 'India (IST)', iana: 'Asia/Kolkata' },
  { id: 'bdt', label: 'Bangladesh (BDT)', iana: 'Asia/Dhaka' },
  { id: 'wib', label: 'Western Indonesia (WIB)', iana: 'Asia/Jakarta' },
  { id: 'cst_china', label: 'China (CST)', iana: 'Asia/Shanghai' },
  { id: 'awst', label: 'Australia Western (AWST)', iana: 'Australia/Perth' },
  { id: 'jst', label: 'Japan (JST)', iana: 'Asia/Tokyo' },
  { id: 'aest', label: 'Australia Eastern (AEST/AEDT)', iana: 'Australia/Sydney' },
  { id: 'acdt', label: 'Australia Central (ACST/ACDT)', iana: 'Australia/Adelaide' },
  { id: 'nzst', label: 'New Zealand (NZST/NZDT)', iana: 'Pacific/Auckland' },
  { id: 'hst', label: 'Hawaii (HST)', iana: 'Pacific/Honolulu' },
  { id: 'akst', label: 'Alaska (AKST/AKDT)', iana: 'America/Anchorage' },
  { id: 'nst', label: 'Newfoundland (NST/NDT)', iana: 'America/St_Johns' },
  { id: 'art', label: 'Argentina (ART)', iana: 'America/Argentina/Buenos_Aires' },
  { id: 'brt', label: 'Brasilia (BRT)', iana: 'America/Sao_Paulo' },
];

/** The reference cities in the panel's "World Clock" list. */
export const WORLD_CLOCK: ZoneDef[] = [
  { id: 'london', label: 'London', iana: 'Europe/London' },
  { id: 'ny', label: 'New York', iana: 'America/New_York' },
  { id: 'la', label: 'Los Angeles', iana: 'America/Los_Angeles' },
  { id: 'tokyo', label: 'Tokyo', iana: 'Asia/Tokyo' },
  { id: 'sydney', label: 'Sydney', iana: 'Australia/Sydney' },
  { id: 'dubai', label: 'Dubai', iana: 'Asia/Dubai' },
  { id: 'singapore', label: 'Singapore', iana: 'Asia/Singapore' },
  { id: 'berlin', label: 'Berlin', iana: 'Europe/Berlin' },
];

export const findZone = (id: string): ZoneDef | undefined => ZONES.find((z) => z.id === id);

/* ------------------------------------------------------------------ */
/*  Offsets                                                            */
/* ------------------------------------------------------------------ */

const DAY_MS = 86_400_000;
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(iana: string): Intl.DateTimeFormat {
  let f = formatters.get(iana);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: iana,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatters.set(iana, f);
  }
  return f;
}

/** Offset of `iana` from UTC in minutes (east of Greenwich positive) at the instant `utcMs`. */
export function offsetMinutes(iana: string, utcMs: number): number {
  const parts = formatterFor(iana).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const hour = get('hour') === 24 ? 0 : get('hour');
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'));
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60_000);
}

export type WallKind = 'ok' | 'gap' | 'ambiguous';

/**
 * The UTC instant for a wall-clock reading in a zone. `wallMs` is the reading written as if it were UTC
 * (Date.UTC(y, m, d, h, min)).
 *  - 'gap': the clocks skip over this time (02:30 on a spring-forward day). The instant is taken with the offset
 *    from before the change, i.e. 02:30 is read as 03:30 daylight time.
 *  - 'ambiguous': the clocks show this time twice (01:30 on a fall-back day). The first (daylight-time) one is used.
 */
export function wallToUtc(iana: string, wallMs: number): { utcMs: number; kind: WallKind } {
  const before = offsetMinutes(iana, wallMs - DAY_MS);
  const after = offsetMinutes(iana, wallMs + DAY_MS);
  const candidates = (before === after ? [before] : [before, after])
    .map((offset) => wallMs - offset * 60_000)
    .filter((utc, i, all) => all.indexOf(utc) === i)
    .filter((utc) => wallMs - utc === offsetMinutes(iana, utc) * 60_000)
    .sort((a, b) => a - b);
  if (candidates.length === 0) return { utcMs: wallMs - before * 60_000, kind: 'gap' };
  if (candidates.length === 1) return { utcMs: candidates[0], kind: 'ok' };
  return { utcMs: candidates[0], kind: 'ambiguous' };
}

export interface LocalMoment {
  minutesOfDay: number;
  /** Whole days since the epoch of the local calendar date. */
  dayNumber: number;
  offsetMin: number;
}

/** What the clocks in `iana` read at the instant `utcMs`. */
export function localAt(iana: string, utcMs: number): LocalMoment {
  const offsetMin = offsetMinutes(iana, utcMs);
  const t = utcMs + offsetMin * 60_000;
  const d = new Date(t);
  return { minutesOfDay: d.getUTCHours() * 60 + d.getUTCMinutes(), dayNumber: Math.floor(t / DAY_MS), offsetMin };
}

/** True when the zone is on daylight saving time at `utcMs` (its offset is above its smaller yearly offset). */
export function isDaylightTime(iana: string, utcMs: number): boolean {
  const year = new Date(utcMs).getUTCFullYear();
  const jan = offsetMinutes(iana, Date.UTC(year, 0, 1));
  const jul = offsetMinutes(iana, Date.UTC(year, 6, 1));
  return jan !== jul && offsetMinutes(iana, utcMs) === Math.max(jan, jul);
}

/* ------------------------------------------------------------------ */
/*  Formatting                                                         */
/* ------------------------------------------------------------------ */

export function formatClock(minutesOfDay: number): string {
  const h = Math.floor(minutesOfDay / 60) % 24;
  const m = minutesOfDay % 60;
  return `${h % 12 || 12}:${m < 10 ? `0${m}` : m} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** "UTC-7", "UTC+0", "UTC+5:30". */
export function formatOffset(offsetMin: number): string {
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? `:${m < 10 ? '0' : ''}${m}` : ''}`;
}

export const dayLabel = (delta: number): string => (delta === 0 ? '' : delta > 0 ? ' (next day)' : ' (previous day)');

/* ------------------------------------------------------------------ */
/*  Business-hours overlap (9 AM - 5 PM in each zone)                  */
/* ------------------------------------------------------------------ */

export interface BizHourCell {
  hour: number;
  color: 'green' | 'yellow' | 'gray';
}

export interface OverlapResult {
  /** Overlap window in the SOURCE zone's clock, minutes since midnight (both 0 when there is none). */
  overlapStart: number;
  overlapEnd: number;
  durationHours: number;
  /** One cell per hour of the source zone's day. */
  hours: BizHourCell[];
}

const BIZ_START = 9 * 60;
const BIZ_END = 17 * 60;
const inBiz = (minuteOfDay: number): boolean => minuteOfDay >= BIZ_START && minuteOfDay < BIZ_END;
const wrap = (m: number): number => ((m % 1440) + 1440) % 1440;

/**
 * `diffMin` = target offset - source offset. Works minute by minute around the clock, so a window that wraps past
 * midnight (California 4 PM - 5 PM is Tokyo 9 AM - 10 AM) is found; the old UTC-interval maths reported "no overlap".
 */
export function calcOverlap(diffMin: number): OverlapResult {
  let first = -1;
  let last = -1;
  let count = 0;
  for (let m = BIZ_START; m < BIZ_END; m++) {
    if (inBiz(wrap(m + diffMin))) {
      if (first < 0) first = m;
      last = m;
      count++;
    }
  }
  const hours: BizHourCell[] = [];
  for (let h = 0; h < 24; h++) {
    const src = inBiz(h * 60);
    const dst = inBiz(wrap(h * 60 + diffMin));
    hours.push({ hour: h, color: src && dst ? 'green' : src || dst ? 'yellow' : 'gray' });
  }
  return {
    overlapStart: count ? first : 0,
    overlapEnd: count ? last + 1 : 0,
    durationHours: count / 60,
    hours,
  };
}
