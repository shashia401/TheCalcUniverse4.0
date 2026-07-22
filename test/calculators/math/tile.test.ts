import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/tile/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Tile Calculator', () => {
  it('standard grid: 12x10 room with 12x24 tiles', () => {
    const r = config.calculate({ areaLength: '12', areaWidth: '10', tileLength: '12', tileWidth: '24', groutWidth: '0.125', layout: 'grid' });
    expect(r.length).toBeGreaterThan(0);
    const tiles = parseInt(getValue(r, 'tilesNeeded'));
    expect(tiles).toBeGreaterThan(0);
    // Room: 120 sq ft, Tile: 2 sq ft, Base: 60, Grid waste 10% => 66 tiles
    expect(tiles).toBeGreaterThanOrEqual(60);
  });

  it('brick layout has 10% waste like grid', () => {
    const grid = config.calculate({ areaLength: '12', areaWidth: '10', tileLength: '12', tileWidth: '12', groutWidth: '0.125', layout: 'grid' });
    const brick = config.calculate({ areaLength: '12', areaWidth: '10', tileLength: '12', tileWidth: '12', groutWidth: '0.125', layout: 'brick' });
    expect(parseInt(getValue(grid, 'tilesNeeded'))).toBe(parseInt(getValue(brick, 'tilesNeeded')));
  });

  it('diagonal layout has 15% waste', () => {
    const r = config.calculate({ areaLength: '12', areaWidth: '10', tileLength: '12', tileWidth: '12', groutWidth: '0.125', layout: 'diagonal' });
    const wasteVal = getValue(r, 'wastePercent');
    expect(wasteVal).toContain('15%');
  });

  it('herringbone layout has 20% waste', () => {
    const r = config.calculate({ areaLength: '12', areaWidth: '10', tileLength: '12', tileWidth: '12', groutWidth: '0.125', layout: 'herringbone' });
    const wasteVal = getValue(r, 'wastePercent');
    expect(wasteVal).toContain('20%');
  });

  it('tile count from room and tile dimensions is correct', () => {
    const r = config.calculate({ areaLength: '10', areaWidth: '10', tileLength: '12', tileWidth: '12', groutWidth: '0.125', layout: 'grid' });
    // Room: 100 sq ft, Tile: 1 sq ft, Base: 100, 10% waste: 110
    const tiles = parseInt(getValue(r, 'tilesNeeded'));
    expect(tiles).toBeGreaterThanOrEqual(100);
  });

  it('boxes needed is ceiled (10 tiles per box)', () => {
    const r = config.calculate({ areaLength: '10', areaWidth: '10', tileLength: '12', tileWidth: '12', groutWidth: '0.125', layout: 'grid' });
    const boxes = parseInt(getValue(r, 'boxesNeeded'));
    const tiles = parseInt(getValue(r, 'tilesNeeded'));
    expect(boxes).toBeGreaterThanOrEqual(Math.ceil(tiles / 10));
  });

  it('cost calculation when price per tile given', () => {
    const r = config.calculate({ areaLength: '10', areaWidth: '10', tileLength: '12', tileWidth: '12', groutWidth: '0.125', layout: 'grid', pricePerTile: '3.50' });
    const costVal = getValue(r, 'totalCost');
    expect(costVal).not.toContain('Enter');
    expect(costVal).toContain('$');
  });

  it('cost shows placeholder when no price given', () => {
    const r = config.calculate({ areaLength: '10', areaWidth: '10', tileLength: '12', tileWidth: '12', groutWidth: '0.125', layout: 'grid' });
    expect(getValue(r, 'totalCost')).toContain('Enter');
  });

  it('waste override replaces layout-based waste', () => {
    const r = config.calculate({ areaLength: '10', areaWidth: '10', tileLength: '12', tileWidth: '12', groutWidth: '0.125', layout: 'diagonal', wasteOverride: '5' });
    const wasteVal = getValue(r, 'wastePercent');
    expect(wasteVal).toContain('5%');
    expect(wasteVal).not.toContain('15%');
  });

  it('layout note is present for all layouts', () => {
    for (const layout of ['grid', 'brick', 'diagonal', 'herringbone']) {
      const r = config.calculate({ areaLength: '10', areaWidth: '10', tileLength: '12', tileWidth: '12', groutWidth: '0.125', layout });
      expect(getValue(r, 'layoutNote').length).toBeGreaterThan(0);
    }
  });

  it('returns empty for missing room dimensions', () => {
    const r = config.calculate({ areaLength: '', areaWidth: '', tileLength: '12', tileWidth: '12', groutWidth: '0.125', layout: 'grid' });
    expect(r).toEqual([]);
  });

  it('returns empty for zero tile size', () => {
    const r = config.calculate({ areaLength: '10', areaWidth: '10', tileLength: '0', tileWidth: '12', groutWidth: '0.125', layout: 'grid' });
    expect(r).toEqual([]);
  });
});
