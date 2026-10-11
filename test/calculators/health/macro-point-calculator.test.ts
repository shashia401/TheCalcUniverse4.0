import { describe, it, expect } from 'vitest';
import macroPointConfig from '../../../src/calculators/health/macro-point/index';
import { getValue } from '../../helpers';
const config = macroPointConfig;

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
  // ── Audit regressions: every worked example recomputed from Cal*0.0305 + SatFat*0.275 + Sugar*0.12 - Protein*0.098 ──
  const pts = (calories: string, satFat: string, sugar: string, protein: string) =>
    config.calculate({ calories, satFat, sugar, protein });

  it('worked example 1: salad 350/3/6/32 = 9.084 -> 9.1; sandwich 530/5/12/28 = 16.236 -> 16.2', () => {
    expect(getValue(pts('350', '3', '6', '32'), 'macroPoints')).toBe('9.1 points');
    expect(getValue(pts('530', '5', '12', '28'), 'macroPoints')).toBe('16.2 points');
    expect(getValue(pts('350', '3', '6', '32'), 'pointsCategory')).toBe('Higher Points');
    expect(getValue(pts('530', '5', '12', '28'), 'pointsCategory')).toBe('High Points');
  });

  it('worked example 2: turkey 170/2/0/22 = 3.579 -> 3.6; 85% beef 240/8/0/21 = 7.462 -> 7.5', () => {
    expect(getValue(pts('170', '2', '0', '22'), 'macroPoints')).toBe('3.6 points');
    expect(getValue(pts('240', '8', '0', '21'), 'macroPoints')).toBe('7.5 points');
  });

  it('worked example 3: homemade smoothie 280/0.5/32/18 = 10.7535 -> 10.8; chain 390/2/67/3 = 20.191 -> 20.2', () => {
    expect(getValue(pts('280', '0.5', '32', '18'), 'macroPoints')).toBe('10.8 points');
    expect(getValue(pts('390', '2', '67', '3'), 'macroPoints')).toBe('20.2 points');
  });

  it('explanation example: 95 kcal apple = 5.1 pts (not zero, not fewer than crackers by magic); 200 kcal crackers 3/2/4 = 6.773 -> 6.8', () => {
    expect(getValue(pts('95', '0', '19', '0.5'), 'macroPoints')).toBe('5.1 points'); // 2.8975 + 2.28 - 0.049
    expect(getValue(pts('200', '3', '2', '4'), 'macroPoints')).toBe('6.8 points'); // 6.1 + 0.825 + 0.24 - 0.392
  });

  it('FAQ chicken breast per 100 g (165 kcal, 1 g sat fat, 31 g protein) = 2.27 pts, not negative', () => {
    expect(getValue(pts('165', '1', '0', '31'), 'macroPoints')).toBe('2.3 points');
  });

  it('category boundaries use the displayed (1-decimal) score: 3.0 Low, 3.1 Moderate, 0.0 Zero-Point', () => {
    expect(getValue(pts('0', '0', '25', '0'), 'macroPoints')).toBe('3.0 points'); // 25 * 0.12
    expect(getValue(pts('0', '0', '25', '0'), 'pointsCategory')).toBe('Low Points');
    expect(getValue(pts('0', '0', '25.9', '0'), 'pointsCategory')).toBe('Moderate Points'); // 3.108 -> 3.1
    expect(getValue(pts('100', '0', '0', '40'), 'macroPoints')).toBe('0.0 points'); // 3.05 - 3.92 floored at 0
    expect(getValue(pts('100', '0', '0', '40'), 'pointsCategory')).toBe('Zero-Point');
  });

  it('fibre is shown as reference only and the daily budget is labelled as illustration', () => {
    const r = config.calculate({ calories: '350', satFat: '5', sugar: '12', protein: '25', fibre: '5' });
    expect(getValue(r, 'fibreNote')).toContain('not included in the score');
    expect(getValue(r, 'dailyAllowance')).toContain('illustration');
    expect(config.calculate({ calories: '350', satFat: '5', sugar: '12', protein: '25', fibre: '' }).some((x) => x.id === 'fibreNote')).toBe(false);
  });

  it('inputs are bounded', () => {
    for (const id of ['calories', 'satFat', 'sugar', 'protein', 'fibre']) {
      expect(config.inputs.find((i) => i.id === id)!.max).toBeDefined();
    }
  });
});
