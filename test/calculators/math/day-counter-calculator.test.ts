import { describe, it, expect } from 'vitest';
import dayCounterConfig from '../../../src/calculators/math/day-counter/index';

describe('Day Counter', () => {
  const find = (r: ReturnType<typeof dayCounterConfig.calculate>, id: string) => r.find(x => x.id === id)?.value ?? '';

  it('counts days between two dates', () => {
    const r = dayCounterConfig.calculate({ startDate: '2024-01-01', endDate: '2024-01-15', includeEndDate: 'no', countBusinessDays: 'no' });
    expect(find(r, 'totalDays')).toBeTruthy();
  });

  it('counts business days excluding weekends', () => {
    const r = dayCounterConfig.calculate({ startDate: '2024-04-01', endDate: '2024-04-30', includeEndDate: 'no', countBusinessDays: 'yes' });
    expect(find(r, 'businessDaysCount')).toBeTruthy();
  });

  it('returns empty for missing dates', () => {
    expect(dayCounterConfig.calculate({ startDate: '', endDate: '' })).toEqual([]);
  });
});
