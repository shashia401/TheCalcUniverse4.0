import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/diy/gravel/index';
import { getValue } from '../../helpers';

describe('Gravel Calculator', () => {
  describe('volume calculations', () => {
    it('calculates cubic yards for a standard driveway', () => {
      const results = config.calculate({
        length: '20',
        width: '10',
        depth: '4',
        material: 'crushed-limestone',
      });
      const cuYd = getValue(results, 'cubic-yards');
      expect(cuYd).toBeTruthy();
      expect(parseFloat(cuYd)).toBeCloseTo(2.47, 1);
    });

    it('calculates weight in tons', () => {
      const results = config.calculate({
        length: '20',
        width: '10',
        depth: '4',
        material: 'crushed-limestone',
      });
      const tons = getValue(results, 'tons');
      expect(tons).toBeTruthy();
      // (20*10*4)/324 = 2.47 yd3; 2.47*2600/2000 = 3.21 tons
      expect(parseFloat(tons)).toBeCloseTo(3.21, 1);
    });

    it('calculates weed barrier fabric', () => {
      const results = config.calculate({
        length: '20',
        width: '10',
        depth: '4',
        material: 'crushed-limestone',
      });
      const barrier = getValue(results, 'weed-barrier');
      expect(barrier).toBeTruthy();
      expect(barrier).toContain('200');
    });
  });

  describe('material density differences', () => {
    it('river rock weighs more than pea gravel for same volume', () => {
      const pea = config.calculate({
        length: '10', width: '10', depth: '3', material: 'pea-gravel',
      });
      const river = config.calculate({
        length: '10', width: '10', depth: '3', material: 'river-rock',
      });
      const peaTons = parseFloat(getValue(pea, 'tons'));
      const riverTons = parseFloat(getValue(river, 'tons'));
      expect(riverTons).toBeGreaterThan(peaTons);
    });
  });

  describe('compaction', () => {
    it('shows compaction allowance for crushed limestone', () => {
      const results = config.calculate({
        length: '10', width: '10', depth: '4', material: 'crushed-limestone',
      });
      const compacted = getValue(results, 'compacted-yards');
      expect(compacted).toBeTruthy();
      expect(compacted).toContain('+15%');
    });

    it('shows no compaction for pea gravel', () => {
      const results = config.calculate({
        length: '10', width: '10', depth: '4', material: 'pea-gravel',
      });
      const compacted = getValue(results, 'compacted-yards');
      expect(compacted).toBeTruthy();
      expect(compacted).not.toContain('+15%');
    });
  });

  describe('cost estimation', () => {
    it('shows cost when price per yard is provided', () => {
      const results = config.calculate({
        length: '10', width: '10', depth: '3', material: 'crushed-limestone',
        pricePerYard: '45',
      });
      const cost = getValue(results, 'cost-per-yard');
      expect(cost).toContain('$');
    });

    it('shows cost when price per ton is provided', () => {
      const results = config.calculate({
        length: '10', width: '10', depth: '3', material: 'crushed-limestone',
        pricePerTon: '35',
      });
      const cost = getValue(results, 'cost-per-ton');
      expect(cost).toContain('$');
    });
  });

  describe('input validation', () => {
    it('returns empty array for missing dimensions', () => {
      const results = config.calculate({});
      expect(results).toEqual([]);
    });

    it('returns empty array for zero dimensions', () => {
      const results = config.calculate({
        length: '0', width: '10', depth: '4', material: 'crushed-limestone',
      });
      expect(results).toEqual([]);
    });

    it('returns empty array for NaN dimensions', () => {
      const results = config.calculate({
        length: 'abc', width: '10', depth: '4', material: 'crushed-limestone',
      });
      expect(results).toEqual([]);
    });
  });

  describe('educational content', () => {
    it('has formula defined', () => {
      expect(config.educational.formula).toBeTruthy();
    });

    it('has at least 3 variables', () => {
      expect(config.educational.variables.length).toBeGreaterThanOrEqual(3);
    });

    it('has 5 or more FAQs', () => {
      expect(config.educational.faqs.length).toBeGreaterThanOrEqual(5);
    });

    it('has how-to-use instructions', () => {
      expect(config.educational.howToUse?.length).toBeGreaterThanOrEqual(1);
    });

    it('has explanation', () => {
      expect(config.educational.explanation).toBeTruthy();
    });
  });
});
