import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/diy/tile-flooring/index';
import { getValue, parseNumber, parseMoney, near } from '../../helpers';

describe('tile-flooring', () => {
  it('calculates tiles needed for a standard room with 12x12 tiles', () => {
    const r = config.calculate({
      roomLength: '12',
      roomWidth: '10',
      tileSize: '1',
      wastePercent: '10',
    });
    expect(r).toHaveLength(4);
    // roomSqFt = 120; totalSqFtNeeded = 120 * 1.1 = 132
    // tilesNeeded = ceil(132 / 1) = 132
    // boxesNeeded = ceil(132 / 20) = 7
    near(parseNumber(getValue(r, 'sqFt')), 132);
    near(parseNumber(getValue(r, 'tiles')), 132);
    near(parseNumber(getValue(r, 'boxes')), 7);
    near(parseNumber(getValue(r, 'roomArea')), 120);
  });

  it('calculates with different tile size and cost', () => {
    const r = config.calculate({
      roomLength: '10',
      roomWidth: '10',
      tileSize: '2.25',
      wastePercent: '15',
      pricePerSqFt: '4.50',
    });
    expect(r).toHaveLength(5);
    // roomSqFt = 100; totalSqFtNeeded = 100 * 1.15 = 115
    // tilesNeeded = ceil(115 / 2.25) = ceil(51.11) = 52
    near(parseNumber(getValue(r, 'sqFt')), 115);
    near(parseNumber(getValue(r, 'tiles')), 52);
    near(parseNumber(getValue(r, 'boxes')), 6);
    near(parseMoney(getValue(r, 'cost')), 517.50);
  });

  it('uses default waste of 10% when omitted', () => {
    const r = config.calculate({
      roomLength: '10',
      roomWidth: '10',
      tileSize: '1',
    });
    expect(r).toHaveLength(4);
    near(parseNumber(getValue(r, 'sqFt')), 110);
  });

  it('uses default tile size of 1 sq ft when omitted', () => {
    const r = config.calculate({
      roomLength: '10',
      roomWidth: '10',
    });
    expect(r).toHaveLength(4);
    near(parseNumber(getValue(r, 'sqFt')), 110);
  });

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for zero room dimensions', () => {
    const r = config.calculate({
      roomLength: '0',
      roomWidth: '10',
      tileSize: '1',
    });
    expect(r).toHaveLength(0);
  });

  it('handles complex layout with 20% waste', () => {
    const r = config.calculate({
      roomLength: '15',
      roomWidth: '12',
      tileSize: '0.25',
      wastePercent: '20',
    });
    expect(r).toHaveLength(4);
    // roomSqFt = 180; totalSqFtNeeded = 180 * 1.2 = 216
    // tilesNeeded = ceil(216 / 0.25) = ceil(864) = 864
    near(parseNumber(getValue(r, 'sqFt')), 216);
    near(parseNumber(getValue(r, 'tiles')), 864);
    near(parseNumber(getValue(r, 'boxes')), 11);
  });

  it('does not include cost result when price is omitted', () => {
    const r = config.calculate({
      roomLength: '10',
      roomWidth: '10',
      tileSize: '1',
      wastePercent: '10',
    });
    expect(r.find((x) => x.id === 'cost')).toBeUndefined();
  });

  it('calculates large-format tiles with diagonal layout', () => {
    const r = config.calculate({
      roomLength: '25',
      roomWidth: '20',
      tileSize: '4',
      wastePercent: '15',
      pricePerSqFt: '12.00',
    });
    expect(r).toHaveLength(5);
    // roomSqFt = 500; totalSqFtNeeded = 500 * 1.15 = 575
    // tilesNeeded = ceil(575 / 4) = ceil(143.75) = 144
    // boxesNeeded = ceil(575 / 20) = ceil(28.75) = 29
    near(parseNumber(getValue(r, 'sqFt')), 575);
    near(parseNumber(getValue(r, 'tiles')), 144);
    near(parseNumber(getValue(r, 'boxes')), 29);
    near(parseMoney(getValue(r, 'cost')), 6900.00);
  });

  it('calculates backsplash with small 6x6 tiles', () => {
    const r = config.calculate({
      roomLength: '15',
      roomWidth: '1.5',
      tileSize: '0.25',
      wastePercent: '15',
    });
    expect(r).toHaveLength(4);
    // roomSqFt = 22.5; totalSqFtNeeded = 22.5 * 1.15 = 25.875
    // tilesNeeded = ceil(25.875 / 0.25) = ceil(103.5) = 104
    near(parseNumber(getValue(r, 'sqFt')), 25.9);
    near(parseNumber(getValue(r, 'tiles')), 104);
    near(parseNumber(getValue(r, 'boxes')), 2);
  });

  it('returns empty for non-numeric dimensions', () => {
    expect(config.calculate({ roomLength: 'abc', roomWidth: '10', tileSize: '1' })).toHaveLength(0);
  });

  it('highlight result is the sqFt value', () => {
    const r = config.calculate({
      roomLength: '12',
      roomWidth: '10',
      tileSize: '1',
    });
    const sqFt = r.find((x) => x.id === 'sqFt');
    expect(sqFt).toBeDefined();
    expect(sqFt!.highlight).toBe(true);
    expect(sqFt!.color).toBe('positive');
  });
});
