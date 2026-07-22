import { describe, it, expect } from 'vitest';
import macroPointConfig from '../../../src/calculators/health/macro-point/index';

describe('Macro Point Calculator', () => {
  const find = (r: ReturnType<typeof macroPointConfig.calculate>, id: string) => r.find(x => x.id === id)?.value ?? '';

  it('calculates macro points for a food item', () => {
    const r = macroPointConfig.calculate({ foodName: 'Test Food', calories: '250', satFat: '5', sugar: '12', protein: '20' });
    expect(find(r, 'macroPoints')).toContain('points');
  });

  it('shows zero or negative points for high-protein foods', () => {
    const r = macroPointConfig.calculate({ foodName: 'Chicken Breast', calories: '165', satFat: '1', sugar: '0', protein: '31' });
    expect(find(r, 'macroPoints')).toBeTruthy();
  });

  it('returns empty for missing required values', () => {
    expect(macroPointConfig.calculate({ calories: '', saturatedFat: '', sugar: '', protein: '' })).toEqual([]);
  });
});
