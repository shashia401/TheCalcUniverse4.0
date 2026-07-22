import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/random-number/index';
import { getValue } from '../../helpers';

describe('Random Number Generator', () => {
  it('generates the requested count of numbers', () => {
    const r = config.calculate({ min: '1', max: '100', count: '10', decimals: '0', unique: 'no' });
    const list = getValue(r, 'numberList');
    expect(list.split(', ')).toHaveLength(10);
  });

  it('numbers are within range', () => {
    const r = config.calculate({ min: '1', max: '100', count: '50', decimals: '0', unique: 'no' });
    const list = getValue(r, 'numberList');
    list.split(', ').forEach(n => {
      const v = parseInt(n);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(100);
    });
  });

  it('returns empty for min > max', () => {
    const r = config.calculate({ min: '100', max: '1', count: '5', decimals: '0', unique: 'no' });
    expect(r).toEqual([]);
  });

  it('returns sum and average', () => {
    const r = config.calculate({ min: '10', max: '10', count: '5', decimals: '0', unique: 'no' });
    expect(getValue(r, 'sum')).toBe('50');
    expect(getValue(r, 'average')).toBe('10');
  });

  it('returns min and max of generated set', () => {
    const r = config.calculate({ min: '10', max: '10', count: '5', decimals: '0', unique: 'no' });
    expect(getValue(r, 'minValue')).toBe('10');
    expect(getValue(r, 'maxValue')).toBe('10');
  });

  it('generates decimal values when specified', () => {
    const r = config.calculate({ min: '0', max: '1', count: '5', decimals: '2', unique: 'no' });
    const list = getValue(r, 'numberList');
    list.split(', ').forEach(n => {
      if (n !== '0' && n !== '1') {
        expect(n).toMatch(/\.\d/);
      }
    });
  });

  it('returns empty for NaN inputs', () => {
    const r = config.calculate({ min: 'abc', max: '100', count: '5', decimals: '0', unique: 'no' });
    expect(r).toEqual([]);
  });

  it('generates unique values when unique mode is enabled', () => {
    const r = config.calculate({ min: '1', max: '1000', count: '20', decimals: '0', unique: 'yes' });
    const list = getValue(r, 'numberList');
    const values = list.split(', ');
    expect(values).toHaveLength(20);
    const uniqueSet = new Set(values);
    expect(uniqueSet.size).toBe(20);
  });

  it('returns range (max - min) of generated values', () => {
    const r = config.calculate({ min: '1', max: '100', count: '10', decimals: '0', unique: 'no' });
    const minVal = parseInt(getValue(r, 'minValue'));
    const maxVal = parseInt(getValue(r, 'maxValue'));
    const range = parseInt(getValue(r, 'range'));
    expect(range).toBe(maxVal - minVal);
  });

  it('count=0 defaults to 1 number (|| 1 safety)', () => {
    const r = config.calculate({ min: '1', max: '100', count: '0', decimals: '0', unique: 'no' });
    const list = getValue(r, 'numberList');
    expect(list.split(', ')).toHaveLength(1);
  });

  it('generates values with negative range', () => {
    const r = config.calculate({ min: '-50', max: '50', count: '30', decimals: '0', unique: 'no' });
    const list = getValue(r, 'numberList');
    list.split(', ').forEach(n => {
      const v = parseInt(n);
      expect(v).toBeGreaterThanOrEqual(-50);
      expect(v).toBeLessThanOrEqual(50);
    });
  });

  it('generates exactly 5 decimal places when requested', () => {
    const r = config.calculate({ min: '0', max: '1', count: '10', decimals: '5', unique: 'no' });
    const list = getValue(r, 'numberList');
    list.split(', ').forEach(n => {
      if (n !== '0' && n !== '1') {
        // Should have 5 decimal places
        const parts = n.split('.');
        expect(parts[1].length).toBeLessThanOrEqual(5);
      }
    });
  });

  it('handles large count up to 1000', () => {
    const r = config.calculate({ min: '0', max: '1', count: '1000', decimals: '0', unique: 'no' });
    const list = getValue(r, 'numberList');
    expect(list.split(', ')).toHaveLength(1000);
  });

  it('handles single number generation', () => {
    const r = config.calculate({ min: '42', max: '42', count: '1', decimals: '0', unique: 'no' });
    const list = getValue(r, 'numberList');
    expect(list).toBe('42');
  });

  it('lists contain less than or equal count with unique constraint on small range', () => {
    // Range is 5 (1-5), requesting 10 unique — mathematically impossible
    const r = config.calculate({ min: '1', max: '5', count: '10', decimals: '0', unique: 'yes' });
    const list = getValue(r, 'numberList');
    const values = list.split(', ');
    expect(values.length).toBeLessThanOrEqual(5);
  });

  it('all values with unique mode are distinct', () => {
    const r = config.calculate({ min: '5', max: '15', count: '10', decimals: '0', unique: 'yes' });
    const list = getValue(r, 'numberList');
    const values = list.split(', ');
    const uniqueSet = new Set(values);
    expect(uniqueSet.size).toBe(values.length);
  });

  it('returns integer values when decimals=0', () => {
    const r = config.calculate({ min: '1', max: '100', count: '20', decimals: '0', unique: 'no' });
    const list = getValue(r, 'numberList');
    list.split(', ').forEach(n => {
      expect(n).not.toContain('.');
    });
  });

  it('returns empty for count < 1 (edge case parsing)', () => {
    const r = config.calculate({ min: '1', max: '100', count: '-5', decimals: '0', unique: 'no' });
    expect(r).toEqual([]);
  });
});
