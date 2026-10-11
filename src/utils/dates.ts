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
