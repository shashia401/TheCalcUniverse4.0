import { describe, it, expect } from 'vitest';
import { parseIsoDate, toIsoDate } from '../../../src/utils/dates';

describe('parseIsoDate', () => {
  it('accepts real dates, including 29 Feb in a leap year', () => {
    expect(toIsoDate(parseIsoDate('2026-03-15')!)).toBe('2026-03-15');
    expect(toIsoDate(parseIsoDate('2024-02-29')!)).toBe('2024-02-29');
  });
  it('rejects calendar-invalid dates that Date() would roll over', () => {
    expect(parseIsoDate('2025-02-31')).toBeNull(); // would become 3 March
    expect(parseIsoDate('2025-02-29')).toBeNull(); // 2025 is not a leap year
    expect(parseIsoDate('2026-04-31')).toBeNull();
    expect(parseIsoDate('2026-13-01')).toBeNull();
    expect(parseIsoDate('2026-00-10')).toBeNull();
  });
  it('rejects malformed input', () => {
    expect(parseIsoDate('')).toBeNull();
    expect(parseIsoDate(undefined)).toBeNull();
    expect(parseIsoDate('15/03/2026')).toBeNull();
    expect(parseIsoDate('2026-3-5')).toBeNull();
  });
});
