import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/dice-roller/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Dice Roller', () => {
  it('generates the correct number of rolls', () => {
    const r = config.calculate({ count: '5', sides: '6', modifier: '0' });
    const rolls = getValue(r, 'rolls');
    expect(rolls.split(', ')).toHaveLength(5);
  });

  it('each roll is within the valid range', () => {
    const r = config.calculate({ count: '10', sides: '6', modifier: '0' });
    const rollsStr = getValue(r, 'rolls');
    const rolls = rollsStr.split(', ').map(Number);

    rolls.forEach(roll => {
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(6);
    });
  });

  it('modifier is correctly applied to the total', () => {
    const r = config.calculate({ count: '2', sides: '6', modifier: '5' });
    const rollData = JSON.parse(getValue(r, '_rollData'));
    const rolls = rollData as number[];
    const rawSum = rolls.reduce((a: number, b: number) => a + b, 0);
    const expectedTotal = rawSum + 5;

    expect(parseInt(getValue(r, 'total'))).toBe(expectedTotal);
  });

  it('total equals sum of rolls plus modifier', () => {
    const r = config.calculate({ count: '3', sides: '10', modifier: '3' });
    const rollData = JSON.parse(getValue(r, '_rollData')) as number[];
    const rawSum = rollData.reduce((a, b) => a + b, 0);
    const expectedTotal = rawSum + 3;

    expect(parseInt(getValue(r, 'total'))).toBe(expectedTotal);
    expect(getValue(r, 'modifier')).toBe('+3');
  });

  it('calculates average correctly', () => {
    const r = config.calculate({ count: '4', sides: '6', modifier: '0' });
    const total = parseInt(getValue(r, 'total'));
    const average = parseNumber(getValue(r, 'average'));
    const expectedAvg = total / 4;

    near(average, expectedAvg, 0.1);
  });

  it('returns empty results for 0 or negative dice count', () => {
    const r = config.calculate({ count: '0', sides: '6', modifier: '0' });
    expect(r).toEqual([]);

    const r2 = config.calculate({ count: '-1', sides: '6', modifier: '0' });
    expect(r2).toEqual([]);
  });

  it('handles negative modifier correctly', () => {
    const r = config.calculate({ count: '2', sides: '6', modifier: '-3' });
    const rollData = JSON.parse(getValue(r, '_rollData')) as number[];
    const rawSum = rollData.reduce((a, b) => a + b, 0);
    const expectedTotal = rawSum - 3;

    expect(parseInt(getValue(r, 'total'))).toBe(expectedTotal);
    expect(getValue(r, 'modifier')).toBe('-3');
  });

  it('results contain valid rollData JSON', () => {
    const r = config.calculate({ count: '4', sides: '8', modifier: '2' });
    const rollDataStr = getValue(r, '_rollData');

    let rollData: number[];
    expect(() => { rollData = JSON.parse(rollDataStr); }).not.toThrow();

    rollData = JSON.parse(rollDataStr);
    expect(Array.isArray(rollData)).toBe(true);
    expect(rollData).toHaveLength(4);

    rollData.forEach(val => {
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(8);
      expect(Number.isInteger(val)).toBe(true);
    });
  });

  it('displays correct dice notation in count result', () => {
    const r = config.calculate({ count: '3', sides: '12', modifier: '0' });
    expect(getValue(r, 'count')).toBe('D12 × 3');
  });
});
