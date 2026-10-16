// Strict "YYYY-MM-DD" parsing. `new Date('2025-02-31')` silently rolls over to March 3 in every browser, so
// calculators that take a typed date must not feed it to Date directly.

/**
 * UTC midnight (ms since the epoch) of a "YYYY-MM-DD" string, or null when it is malformed or not a real
 * calendar date (month 13, February 30, 2025-02-29, ...).
 */
export function parseIsoDateUtc(s: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((s ?? '').trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(0);
  dt.setUTCFullYear(y, mo - 1, d); // setUTCFullYear keeps years 0-99 as written (Date.UTC would map them to 19xx)
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return dt.getTime();
}
