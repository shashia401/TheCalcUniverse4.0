import { describe, it, expect } from 'vitest';
import mulchConfig from '../../../src/calculators/diy/mulch/index';
import { getValue } from '../../helpers';

describe('Mulch Calculator', () => {
  describe('rectangular beds', () => {
    it('calculates cubic yards for a standard bed', () => {
      const results = mulchConfig.calculate({
        length: '20',
        width: '10',
        depth: '2',
        shape: 'rect',
      });
      const cuYd = getValue(results, 'cubicYards');
      expect(cuYd).toBeTruthy();
      expect(parseFloat(cuYd)).toBeCloseTo(1.23, 1);
    });

    it('returns empty array for invalid input', () => {
      const results = mulchConfig.calculate({});
      expect(results).toEqual([]);
    });

    it('returns empty array for zero dimensions', () => {
      const results = mulchConfig.calculate({
        length: '0',
        width: '0',
        depth: '2',
        shape: 'rect',
      });
      expect(results).toEqual([]);
    });
  });

  describe('circular beds', () => {
    it('calculates cubic yards for a circular bed', () => {
      const results = mulchConfig.calculate({
        length: '10',
        width: '10',
        depth: '3',
        shape: 'circle',
      });
      const cuYd = getValue(results, 'cubicYards');
      expect(cuYd).toBeTruthy();
      // Circle with diameter 10ft, 3in depth: area=78.54, yards=(78.54*3)/324=0.727
      expect(parseFloat(cuYd)).toBeCloseTo(0.73, 1);
    });
  });

  describe('cost calculations', () => {
    it('shows cost for bagged mulch', () => {
      const results = mulchConfig.calculate({
        length: '20',
        width: '10',
        depth: '2',
        shape: 'rect',
        pricePerBag2: '4.50',
      });
      const costBags = getValue(results, 'costBags');
      expect(costBags).toContain('$');
    });

    it('shows cost for bulk delivery', () => {
      const results = mulchConfig.calculate({
        length: '20',
        width: '10',
        depth: '2',
        shape: 'rect',
        pricePerBulkYard: '35',
      });
      const costBulk = getValue(results, 'costBulk');
      expect(costBulk).toContain('$');
    });
  });

  describe('bags needed', () => {
    it('calculates 2 cu ft bags needed', () => {
      const results = mulchConfig.calculate({
        length: '20',
        width: '10',
        depth: '2',
        shape: 'rect',
      });
      const bags = getValue(results, 'bags2ft');
      expect(bags).toBeTruthy();
      expect(bags).toContain('bags');
    });
  });
});
