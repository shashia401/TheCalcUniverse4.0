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
    // 1/8" grout joints: cell = 12.125^2 / 144 = 1.02094 sq ft -> ceil(120 / 1.02094) = 118 tiles; +10% = ceil(129.8) = 130
    // carton = 15.5 sq ft = round(15.5 / 1) = 16 tiles -> ceil(130 / 16) = 9 boxes
    near(parseNumber(getValue(r, 'sqFt')), 132);
    near(parseNumber(getValue(r, 'tiles')), 130);
    near(parseNumber(getValue(r, 'boxes')), 9);
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
    // cell = 18.125^2 / 144 = 2.2815 -> ceil(100 / 2.2815) = 44; +15% = ceil(50.6) = 51 tiles
    // carton = round(15.5 / 2.25) = 7 tiles -> ceil(51 / 7) = 8 boxes
    near(parseNumber(getValue(r, 'sqFt')), 115);
    near(parseNumber(getValue(r, 'tiles')), 51);
    near(parseNumber(getValue(r, 'boxes')), 8);
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
    // cell = 6.125^2 / 144 = 0.26052 -> ceil(180 / 0.26052) = 691; +20% = ceil(829.2) = 830 tiles
    // carton = round(15.5 / 0.25) = 62 tiles -> ceil(830 / 62) = 14 boxes
    near(parseNumber(getValue(r, 'sqFt')), 216);
    near(parseNumber(getValue(r, 'tiles')), 830);
    near(parseNumber(getValue(r, 'boxes')), 14);
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
    // cell = 24.125^2 / 144 = 4.0418 -> ceil(500 / 4.0418) = 124; +15% = ceil(142.6) = 143 tiles
    // carton = round(15.5 / 4) = 4 tiles -> ceil(143 / 4) = 36 boxes
    near(parseNumber(getValue(r, 'sqFt')), 575);
    near(parseNumber(getValue(r, 'tiles')), 143);
    near(parseNumber(getValue(r, 'boxes')), 36);
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
    // cell = 0.26052 -> ceil(22.5 / 0.26052) = 87; +15% = ceil(100.05) = 101 tiles (62 per carton -> 2 boxes)
    near(parseNumber(getValue(r, 'sqFt')), 25.9);
    near(parseNumber(getValue(r, 'tiles')), 101);
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
