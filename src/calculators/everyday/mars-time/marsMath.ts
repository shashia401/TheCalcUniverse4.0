// Mars24 time maths (Allison & McEwen 2000; NASA GISS Mars24 Sunclock): https://www.giss.nasa.gov/tools/mars24/

export const SOL_DAYS = 1.0274912517; // Earth days per sol
export const SOL_SECONDS = 88775.244; // 24h 39m 35.244s
export const UNIX_EPOCH_JD = 2440587.5; // Julian Date of 1970-01-01T00:00:00Z
export const TT_MINUS_TAI = 32.184; // seconds
export const MSD_EPOCH_JD = 2451549.5; // JD(TT) at the Mars Sol Date epoch
export const MSD_EPOCH_OFFSET = 44796.0;
export const MSD_CORRECTION = 0.0009626;

/** TAI-UTC in seconds, effective on the given UTC date (1972 leap-second table, IERS/IANA). */
const LEAP: [number, number][] = [
  [Date.UTC(1972, 0, 1), 10], [Date.UTC(1972, 6, 1), 11], [Date.UTC(1973, 0, 1), 12], [Date.UTC(1974, 0, 1), 13],
  [Date.UTC(1975, 0, 1), 14], [Date.UTC(1976, 0, 1), 15], [Date.UTC(1977, 0, 1), 16], [Date.UTC(1978, 0, 1), 17],
  [Date.UTC(1979, 0, 1), 18], [Date.UTC(1980, 0, 1), 19], [Date.UTC(1981, 6, 1), 20], [Date.UTC(1982, 6, 1), 21],
  [Date.UTC(1983, 6, 1), 22], [Date.UTC(1985, 6, 1), 23], [Date.UTC(1988, 0, 1), 24], [Date.UTC(1990, 0, 1), 25],
  [Date.UTC(1991, 0, 1), 26], [Date.UTC(1992, 6, 1), 27], [Date.UTC(1993, 6, 1), 28], [Date.UTC(1994, 6, 1), 29],
  [Date.UTC(1996, 0, 1), 30], [Date.UTC(1997, 6, 1), 31], [Date.UTC(1999, 0, 1), 32], [Date.UTC(2006, 0, 1), 33],
  [Date.UTC(2009, 0, 1), 34], [Date.UTC(2012, 6, 1), 35], [Date.UTC(2015, 6, 1), 36], [Date.UTC(2017, 0, 1), 37],
];

export function taiMinusUtc(ms: number): number {
  let v = 10; // before 1972 the table is not defined; 10 s is the 1972 value
  for (const [t, s] of LEAP) if (ms >= t) v = s;
  return v;
}

/**
 * Strict ISO 8601 parse treating a missing zone as UTC (the field is labelled UTC).
 * Accepts YYYY-MM-DD, optionally followed by T or space and HH:MM[:SS[.fff]] and Z or +-HH:MM.
 * Calendar-invalid dates (2026-02-31) return null instead of rolling over.
 */
export function parseUtc(s: string | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i.exec((s ?? '').trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const h = Number(m[4] ?? 0);
  const mi = Number(m[5] ?? 0);
  const sec = Number(m[6] ?? 0);
  const ms = Number((m[7] ?? '0').padEnd(3, '0'));
  if (h > 23 || mi > 59 || sec > 59) return null;
  const t = Date.UTC(y, mo - 1, d, h, mi, sec, ms);
  const chk = new Date(t);
  if (chk.getUTCFullYear() !== y || chk.getUTCMonth() !== mo - 1 || chk.getUTCDate() !== d) return null;
  let offsetMin = 0;
  if (m[8] && m[8].toUpperCase() !== 'Z') {
    const sign = m[8][0] === '-' ? -1 : 1;
    const digits = m[8].slice(1).replace(':', '');
    offsetMin = sign * (Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2)));
  }
  return new Date(t - offsetMin * 60000);
}

/** Mars Sol Date: MSD = (JD_TT - 2451549.5) / 1.0274912517 + 44796.0 - 0.0009626 (JD_TT = JD_UTC + (TAI-UTC + 32.184 s)). */
export const jdUtcOf = (utc: Date): number => utc.getTime() / 86400000 + UNIX_EPOCH_JD;
export const jdTTOf = (utc: Date): number => jdUtcOf(utc) + (taiMinusUtc(utc.getTime()) + TT_MINUS_TAI) / 86400;
export function marsSolDate(utc: Date): number {
  return (jdTTOf(utc) - MSD_EPOCH_JD) / SOL_DAYS + MSD_EPOCH_OFFSET - MSD_CORRECTION;
}

/** Coordinated Mars Time (mean solar time at the prime meridian) as hours 0..24. */
export const mtcHours = (msd: number) => 24 * (msd - Math.floor(msd));

/** Local mean solar time in hours 0..24 at an EAST longitude in degrees. */
export function lmstHours(msd: number, lonEast: number): number {
  return (((mtcHours(msd) + lonEast / 15) % 24) + 24) % 24;
}

export function hms(hours: number): string {
  const total = Math.floor(hours * 3600 + 1e-6);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(total / 3600) % 24)}:${p(Math.floor((total % 3600) / 60))}:${p(total % 60)}`;
}
