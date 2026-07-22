import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/mulch/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Mulch Calculator', () => {
  it('rectangular bed: 20x10 at 2in depth', () => {
    const r = config.calculate({ length: '20', width: '10', depth: '2', shape: 'rect' });
    expect(r.length).toBeGreaterThan(0);
    const cy = parseNumber(getValue(r, 'cubicYards'));
    // (20 * 10 * 2) / 324 = 400 / 324 = 1.235
    near(cy, 1.235, 0.01);
  });

  it('rectangular bed at 3in depth has more volume than 2in', () => {
    const shallow = config.calculate({ length: '20', width: '10', depth: '2', shape: 'rect' });
    const deep = config.calculate({ length: '20', width: '10', depth: '3', shape: 'rect' });
    const sVol = parseNumber(getValue(shallow, 'cubicYards'));
    const dVol = parseNumber(getValue(deep, 'cubicYards'));
    expect(dVol).toBeGreaterThan(sVol);
  });

  it('rectangular bed at 4in depth has more volume than 3in', () => {
    const d3 = config.calculate({ length: '20', width: '10', depth: '3', shape: 'rect' });
    const d4 = config.calculate({ length: '20', width: '10', depth: '4', shape: 'rect' });
    expect(parseNumber(getValue(d4, 'cubicYards'))).toBeGreaterThan(parseNumber(getValue(d3, 'cubicYards')));
  });

  it('circle bed: 20ft diameter at 2in depth', () => {
    const r = config.calculate({ length: '20', width: '10', depth: '2', shape: 'circle' });
    const cy = parseNumber(getValue(r, 'cubicYards'));
    // area = π * 10^2 = 314.16, volume = 314.16 * 2 / 324 = 1.939
    near(cy, 1.939, 0.02);
  });

  it('circle bed uses length as diameter (ignores width for area)', () => {
    const r1 = config.calculate({ length: '20', width: '10', depth: '2', shape: 'circle' });
    const r2 = config.calculate({ length: '20', width: '30', depth: '2', shape: 'circle' });
    // Both should have same area since circle uses length as diameter
    const cy1 = parseNumber(getValue(r1, 'cubicYards'));
    const cy2 = parseNumber(getValue(r2, 'cubicYards'));
    near(cy1, cy2, 0.01);
  });

  it('2 cu ft bag count is ceiled correctly', () => {
    const r = config.calculate({ length: '20', width: '10', depth: '2', shape: 'rect' });
    const cf = parseNumber(getValue(r, 'cubicFeet'));
    const bags2 = parseInt(getValue(r, 'bags2ft'));
    // Cubic feet = cy * 27 = 1.235 * 27 = 33.33, / 2 = ceil(16.67) = 17
    expect(bags2).toBeGreaterThanOrEqual(Math.ceil(cf / 2));
  });

  it('3 cu ft bag count is less than 2 cu ft bag count', () => {
    const r = config.calculate({ length: '20', width: '10', depth: '2', shape: 'rect' });
    const bags2 = parseInt(getValue(r, 'bags2ft'));
    const bags3 = parseInt(getValue(r, 'bags3ft'));
    expect(bags3).toBeLessThanOrEqual(bags2);
  });

  it('bulk scoops are ceiled cubic yards', () => {
    const r = config.calculate({ length: '20', width: '10', depth: '2', shape: 'rect' });
    const cy = parseNumber(getValue(r, 'cubicYards'));
    const scoops = parseInt(getValue(r, 'bulkScoops'));
    expect(scoops).toBe(Math.ceil(cy));
  });

  it('cost comparison: shows dollar amounts when prices entered', () => {
    const r = config.calculate({ length: '20', width: '10', depth: '2', shape: 'rect', pricePerBag2: '4.50', pricePerBulkYard: '35' });
    const costBags = getValue(r, 'costBags');
    const costBulk = getValue(r, 'costBulk');
    expect(costBags).toContain('$');
    expect(costBulk).toContain('$');
  });

  it('cost shows placeholder when no prices entered', () => {
    const r = config.calculate({ length: '20', width: '10', depth: '2', shape: 'rect' });
    expect(getValue(r, 'costBags')).toContain('Enter');
    expect(getValue(r, 'costBulk')).toContain('Enter');
  });

  it('coverage area is calculated for rectangular bed', () => {
    const r = config.calculate({ length: '20', width: '10', depth: '2', shape: 'rect' });
    const area = parseNumber(getValue(r, 'coverageArea'));
    near(area, 200, 0.1);
  });

  it('coverage area is calculated for circle bed', () => {
    const r = config.calculate({ length: '20', width: '10', depth: '2', shape: 'circle' });
    const area = parseNumber(getValue(r, 'coverageArea'));
    // area = π * 10^2 = 314.16
    near(area, 314.16, 0.5);
  });

  it('returns empty for missing fields', () => {
    const r = config.calculate({ length: '', width: '', depth: '2', shape: 'rect' });
    expect(r).toEqual([]);
  });

  it('returns empty for zero length', () => {
    const r = config.calculate({ length: '0', width: '10', depth: '2', shape: 'rect' });
    expect(r).toEqual([]);
  });
});
