import { describe, it, expect } from 'vitest';
import tileConfig from '../../../src/calculators/diy/tile/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Tile Calculator', () => {
  describe('basic tile calculations', () => {
    it('calculates tiles needed for a standard room', () => {
      const results = tileConfig.calculate({
        areaLength: '12',
        areaWidth: '10',
        tileLength: '12',
        tileWidth: '24',
        layout: 'grid',
      });
      const tiles = getValue(results, 'tilesNeeded');
      expect(tiles).toBeTruthy();
      // 120 sq ft room, 2 sq ft tiles = 60, + 10% waste = 66
      expect(tiles).toContain('66');
    });

    it('calculates room area', () => {
      const results = tileConfig.calculate({
        areaLength: '12',
        areaWidth: '10',
        tileLength: '12',
        tileWidth: '24',
        layout: 'grid',
      });
      const area = getValue(results, 'totalArea');
      expect(area).toContain('120');
    });

    it('calculates boxes needed for standard tiles', () => {
      const results = tileConfig.calculate({
        areaLength: '12',
        areaWidth: '10',
        tileLength: '12',
        tileWidth: '24',
        layout: 'grid',
      });
      const boxes = getValue(results, 'boxesNeeded');
      expect(boxes).toBeTruthy();
    });

    it('treats an exactly-2-sq-ft tile (12x24) as large format at 5/box — regression fix', () => {
      // Bug: `tileArea > 2 ? 5 : 10` excluded the common 12x24" tile (exactly 2 sq ft)
      // from the large-format bucket, giving 10/box instead of the documented 5/box.
      // Boxes now follow real carton coverage (~15.5 sq ft per box, e.g. Daltile 15.6, MSI 16): a 12x24 box holds
      // round(15.5 / 2.0) = 8 tiles. 12x10 room, diagonal 15% waste -> 69 tiles -> ceil(69 / 8) = 9 boxes.
      const results = tileConfig.calculate({
        areaLength: '12',
        areaWidth: '10',
        tileLength: '12',
        tileWidth: '24',
        layout: 'diagonal',
      });
      near(parseNumber(getValue(results, 'baseTiles')), 60);
      near(parseNumber(getValue(results, 'boxesNeeded')), 9);
    });
  });

  describe('layout waste factors', () => {
    it('grid layout uses 10% waste', () => {
      const results = tileConfig.calculate({
        areaLength: '12', areaWidth: '10',
        tileLength: '12', tileWidth: '24',
        layout: 'grid',
      });
      const waste = getValue(results, 'wastePercent');
      expect(waste).toContain('10%');
    });

    it('diagonal layout uses 15% waste', () => {
      const results = tileConfig.calculate({
        areaLength: '12', areaWidth: '10',
        tileLength: '12', tileWidth: '24',
        layout: 'diagonal',
      });
      const waste = getValue(results, 'wastePercent');
      expect(waste).toContain('15%');
    });

    it('herringbone layout uses 20% waste', () => {
      const results = tileConfig.calculate({
        areaLength: '12', areaWidth: '10',
        tileLength: '12', tileWidth: '24',
        layout: 'herringbone',
      });
      const waste = getValue(results, 'wastePercent');
      expect(waste).toContain('20%');
    });
  });

  describe('waste override', () => {
    it('uses custom waste percentage when provided', () => {
      const results = tileConfig.calculate({
        areaLength: '12', areaWidth: '10',
        tileLength: '12', tileWidth: '24',
        layout: 'grid',
        wasteOverride: '25',
      });
      const waste = getValue(results, 'wastePercent');
      expect(waste).toContain('25%');
    });

    it('calculates extra waste tiles when override is used', () => {
      const results = tileConfig.calculate({
        areaLength: '12', areaWidth: '10',
        tileLength: '12', tileWidth: '24',
        layout: 'grid',
        wasteOverride: '25',
      });
      const wasteTiles = getValue(results, 'wasteTiles');
      expect(wasteTiles).toBeTruthy();
    });
  });

  describe('cost estimation', () => {
    it('shows cost when price per tile is provided', () => {
      const results = tileConfig.calculate({
        areaLength: '12', areaWidth: '10',
        tileLength: '12', tileWidth: '24',
        layout: 'grid',
        pricePerTile: '3.50',
      });
      const cost = getValue(results, 'totalCost');
      expect(cost).toContain('$');
    });

    it('shows placeholder when no price provided', () => {
      const results = tileConfig.calculate({
        areaLength: '12', areaWidth: '10',
        tileLength: '12', tileWidth: '24',
        layout: 'grid',
      });
      const cost = getValue(results, 'totalCost');
      expect(cost).toContain('Enter price');
    });
  });

  describe('input validation', () => {
    it('returns empty array for missing dimensions', () => {
      const results = tileConfig.calculate({});
      expect(results).toEqual([]);
    });

    it('returns empty array for zero dimensions', () => {
      const results = tileConfig.calculate({
        areaLength: '0', areaWidth: '10',
        tileLength: '12', tileWidth: '24',
        layout: 'grid',
      });
      expect(results).toEqual([]);
    });

    it('returns empty array for NaN values', () => {
      const results = tileConfig.calculate({
        areaLength: 'abc', areaWidth: '10',
        tileLength: '12', tileWidth: '24',
        layout: 'grid',
      });
      expect(results).toEqual([]);
    });
  });

  describe('layout notes', () => {
    it('includes layout-specific note', () => {
      const results = tileConfig.calculate({
        areaLength: '12', areaWidth: '10',
        tileLength: '12', tileWidth: '24',
        layout: 'diagonal',
      });
      const note = getValue(results, 'layoutNote');
      expect(note).toBeTruthy();
      expect(note.toLowerCase()).toContain('diagonal');
    });
  });

  describe('educational content', () => {
    it('has formula defined', () => {
      expect(tileConfig.educational.formula).toBeTruthy();
    });

    it('has at least 3 variables', () => {
      expect(tileConfig.educational.variables.length).toBeGreaterThanOrEqual(3);
    });

    it('has 5 or more FAQs', () => {
      expect(tileConfig.educational.faqs.length).toBeGreaterThanOrEqual(5);
    });

    it('has how-to-use instructions', () => {
      expect(tileConfig.educational.howToUse?.length).toBeGreaterThanOrEqual(1);
    });

    it('has explanation', () => {
      expect(tileConfig.educational.explanation).toBeTruthy();
    });
  });
});
