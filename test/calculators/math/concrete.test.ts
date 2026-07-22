import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/concrete/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Concrete Calculator', () => {
  describe('Slab', () => {
    it('calculates 10x10 slab at 4" depth', () => {
      const r = config.calculate({ shape: 'slab', length: '10', width: '10', depth: '4', wastage: '0' });
      // 10 × 10 × (4/12) = 33.33 cu ft = 1.235 cu yd
      near(parseNumber(getValue(r, 'cubicFeet')), 33.33, 0.01);
      near(parseNumber(getValue(r, 'cubicYards')), 1.235, 0.01);
    });

    it('calculates 60lb bag count for slab', () => {
      const r = config.calculate({ shape: 'slab', length: '10', width: '10', depth: '4', wastage: '0' });
      // 33.33 cu ft / 0.45 = 74.07, ceil = 75
      expect(getValue(r, 'bags60lb')).toBe('75');
    });

    it('calculates 80lb bag count for slab', () => {
      const r = config.calculate({ shape: 'slab', length: '10', width: '10', depth: '4', wastage: '0' });
      // 33.33 cu ft / 0.60 = 55.55, ceil = 56
      expect(getValue(r, 'bags80lb')).toBe('56');
    });

    it('applies 10% waste allowance', () => {
      const r = config.calculate({ shape: 'slab', length: '10', width: '10', depth: '4', wastage: '10' });
      // Without waste: 33.33 cu ft. With 10%: 36.67 cu ft
      near(parseNumber(getValue(r, 'cubicFeet')), 36.67, 0.01);
      near(parseNumber(getValue(r, 'cubicYards')), 1.358, 0.01);
    });

    it('reports waste allowance in results', () => {
      const r = config.calculate({ shape: 'slab', length: '10', width: '10', depth: '4', wastage: '10' });
      expect(getValue(r, 'wastageApplied')).toBe('10%');
    });

    it('reports no waste when wastage is 0', () => {
      const r = config.calculate({ shape: 'slab', length: '10', width: '10', depth: '4', wastage: '0' });
      expect(getValue(r, 'wastageApplied')).toBe('None (exact)');
    });
  });

  describe('Round Hole / Footing', () => {
    it('calculates volume for 2ft diameter hole at 4ft depth', () => {
      const r = config.calculate({
        shape: 'hole',
        diameter: '2',
        depth: '48', // 4 ft in inches
        wastage: '0',
      });
      // π × 1² × (48/12) = π × 4 = 12.566 cu ft
      near(parseNumber(getValue(r, 'cubicFeet')), 12.566, 0.01);
      near(parseNumber(getValue(r, 'cubicYards')), 0.465, 0.01);
    });

    it('calculates bag counts for hole', () => {
      const r = config.calculate({
        shape: 'hole',
        diameter: '2',
        depth: '48',
        wastage: '0',
      });
      // 12.566 / 0.45 = 27.92, ceil = 28
      expect(getValue(r, 'bags60lb')).toBe('28');
      // 12.566 / 0.60 = 20.94, ceil = 21
      expect(getValue(r, 'bags80lb')).toBe('21');
    });
  });

  describe('Column / Cylinder', () => {
    it('calculates volume for 1ft diameter column at 6ft height', () => {
      const r = config.calculate({
        shape: 'column',
        diameter: '1',
        depth: '72', // 6 ft in inches
        wastage: '0',
      });
      // π × 0.5² × (72/12) = π × 0.25 × 6 = 4.712 cu ft
      near(parseNumber(getValue(r, 'cubicFeet')), 4.712, 0.01);
    });
  });

  describe('Stairs', () => {
    it('calculates volume for stairs', () => {
      const r = config.calculate({
        shape: 'stairs',
        stairsLength: '10',
        stairsWidth: '3',
        riserHeight: '7',
        numSteps: '10',
        wastage: '0',
      });
      // 10 × 3 × (7/12) × 10 × 0.5 = 87.5 cu ft
      near(parseNumber(getValue(r, 'cubicFeet')), 87.5, 0.01);
    });
  });

  describe('Validation', () => {
    it('returns empty for missing dimensions', () => {
      const r = config.calculate({ shape: 'slab', length: '', width: '10', depth: '4', wastage: '0' });
      expect(r).toEqual([]);
    });

    it('returns empty for zero dimensions', () => {
      const r = config.calculate({ shape: 'slab', length: '0', width: '10', depth: '4', wastage: '0' });
      expect(r).toEqual([]);
    });

    it('returns empty for negative dimensions', () => {
      const r = config.calculate({ shape: 'slab', length: '-5', width: '10', depth: '4', wastage: '0' });
      expect(r).toEqual([]);
    });
  });

  describe('Results metadata', () => {
    it('includes shape name in results', () => {
      const r = config.calculate({ shape: 'slab', length: '10', width: '10', depth: '4', wastage: '0' });
      expect(getValue(r, 'shape')).toBe('Slab/Patio');
    });

    it('includes weight estimate', () => {
      const r = config.calculate({ shape: 'slab', length: '10', width: '10', depth: '4', wastage: '0' });
      expect(getValue(r, 'weightEstimate')).toBe('4480 lbs'); // 56 × 80
    });

    it('includes formula for shape', () => {
      const r = config.calculate({ shape: 'slab', length: '10', width: '10', depth: '4', wastage: '0' });
      expect(getValue(r, 'formula')).toBeTruthy();
    });
  });

  describe('Educational content', () => {
    it('has formula defined', () => {
      expect(config.educational.formula).toBeTruthy();
    });

    it('has 3 variables', () => {
      expect(config.educational.variables).toHaveLength(3);
    });

    it('has how-to-use instructions', () => {
      expect(config.educational.howToUse?.length).toBeGreaterThanOrEqual(1);
    });

    it('has explanation', () => {
      expect(config.educational.explanation).toBeTruthy();
    });

    it('has 3 FAQs', () => {
      expect(config.educational.faqs).toHaveLength(3);
    });
  });
});
