import { describe, it, expect } from 'vitest';
import dateCalculatorConfig from '../../../src/calculators/math/date/index';

describe('Date Calculator', () => {
  const find = (r: ReturnType<typeof dateCalculatorConfig.calculate>, id: string) => r.find(x => x.id === id)?.value ?? '';

  it('adds days to a date', () => {
    const r = dateCalculatorConfig.calculate({ startDate: '2024-01-15', action: 'add', days: '16', businessDays: 'all' });
    expect(find(r, 'resultDate')).toContain('Jan 31, 2024');
  });

  it('subtracts days from a date', () => {
    const r = dateCalculatorConfig.calculate({ startDate: '2024-03-15', action: 'subtract', days: '14', businessDays: 'all' });
    expect(find(r, 'resultDate')).toContain('Mar 1, 2024');
  });

  it('returns empty for invalid date format', () => {
    expect(dateCalculatorConfig.calculate({ startDate: 'not-a-date' })).toEqual([]);
    expect(dateCalculatorConfig.calculate({ startDate: '' })).toEqual([]);
  });

  it('adds business days skipping weekends', () => {
    const r = dateCalculatorConfig.calculate({ startDate: '2024-04-01', action: 'add', days: '16', businessDays: 'business' });
    expect(find(r, 'resultDate')).toBeTruthy();
  });
});
