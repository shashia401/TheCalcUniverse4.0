import { describe, it, expect } from 'vitest';
import averageConfig from '../../../src/calculators/math/average/index';
import { getValue } from '../../helpers';

describe('Average Calculator', () => {
  describe('basic calculations', () => {
    it('calculates mean correctly', () => {
      const results = averageConfig.calculate({ data: '85, 92, 78, 95, 88' });
      const mean = getValue(results, 'mean');
      expect(parseFloat(mean)).toBeCloseTo(87.6, 1);
    });

    it('calculates median correctly for odd count', () => {
      const results = averageConfig.calculate({ data: '1, 3, 5, 7, 9' });
      const median = getValue(results, 'median');
      expect(parseFloat(median)).toBe(5);
    });

    it('calculates median correctly for even count', () => {
      const results = averageConfig.calculate({ data: '1, 2, 3, 4' });
      const median = getValue(results, 'median');
      expect(parseFloat(median)).toBe(2.5);
    });

    it('calculates count correctly', () => {
      const results = averageConfig.calculate({ data: '10, 20, 30' });
      const count = getValue(results, 'count');
      expect(count).toBe('3');
    });

    it('calculates sum correctly', () => {
      const results = averageConfig.calculate({ data: '10, 20, 30' });
      const sum = getValue(results, 'sum');
      expect(sum).toBe('60');
    });

    it('calculates min and max', () => {
      const results = averageConfig.calculate({ data: '10, 20, 5, 30, 15' });
      expect(getValue(results, 'min')).toBe('5');
      expect(getValue(results, 'max')).toBe('30');
    });
  });

  describe('input handling', () => {
    it('handles dollar signs and commas', () => {
      const results = averageConfig.calculate({ data: '$1,000, $2,000, $3,000' });
      const mean = getValue(results, 'mean');
      expect(parseFloat(mean)).toBeCloseTo(2000, 1);
    });

    it('handles percent signs', () => {
      const results = averageConfig.calculate({ data: '50%, 75%, 100%' });
      const mean = getValue(results, 'mean');
      expect(parseFloat(mean)).toBeCloseTo(75, 1);
    });

    it('handles mixed formatting', () => {
      const results = averageConfig.calculate({ data: '$100, 200%, 300' });
      const count = getValue(results, 'count');
      expect(count).toBe('3');
    });

    it('returns empty array for empty input', () => {
      const results = averageConfig.calculate({ data: '' });
      expect(results).toEqual([]);
    });

    it('returns empty array for missing input', () => {
      const results = averageConfig.calculate({});
      expect(results).toEqual([]);
    });

    it('returns empty array for whitespace-only input', () => {
      const results = averageConfig.calculate({ data: '   ' });
      expect(results).toEqual([]);
    });

    it('handles line breaks as separators', () => {
      const results = averageConfig.calculate({ data: '10\n20\n30' });
      const count = getValue(results, 'count');
      expect(count).toBe('3');
    });

    it('handles single number', () => {
      const results = averageConfig.calculate({ data: '42' });
      const mean = getValue(results, 'mean');
      expect(parseFloat(mean)).toBe(42);
      const count = getValue(results, 'count');
      expect(count).toBe('1');
    });
  });
});
