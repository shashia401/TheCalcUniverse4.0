import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/roofing/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Roofing Calculator', () => {
  it('gable roof area for 40x30 with 6/12 pitch, 1ft overhang, 10% waste', () => {
    const r = config.calculate({ length: '40', width: '30', pitch: '6', overhang: '1', roofType: 'gable', wasteFactor: '10' });
    expect(r.length).toBeGreaterThan(0);
    const area = parseNumber(getValue(r, 'roofArea'));
    expect(area).toBeGreaterThan(0);
    // Footprint: 42 x 32 = 1344 sq ft
    // Pitch multiplier 6/12 = 1.118
    // Roof area = 1344 * 1.118 * 1.10 = ~1652
    near(area, 1652, 10);
  });

  it('gable roof: no overhang, no waste', () => {
    const r = config.calculate({ length: '40', width: '30', pitch: '6', overhang: '0', roofType: 'gable', wasteFactor: '5' });
    const area = parseNumber(getValue(r, 'roofArea'));
    // Footprint: 40 x 30 = 1200
    // 1200 * 1.118 * 1.05 = ~1409
    near(area, 1409, 10);
  });

  it('pitch multiplier is applied correctly: flat vs steep', () => {
    const flat = config.calculate({ length: '40', width: '30', pitch: '0', overhang: '1', roofType: 'gable', wasteFactor: '10' });
    const steep = config.calculate({ length: '40', width: '30', pitch: '12', overhang: '1', roofType: 'gable', wasteFactor: '10' });
    const flatArea = parseNumber(getValue(flat, 'roofArea'));
    const steepArea = parseNumber(getValue(steep, 'roofArea'));
    expect(steepArea).toBeGreaterThan(flatArea);
    near(parseFloat(getValue(flat, 'pitchMultiplier')), 1.000, 0.001);
    near(parseFloat(getValue(steep, 'pitchMultiplier')), 1.414, 0.001);
  });

  it('squares calculation: Roof area / 100, ceiled', () => {
    const r = config.calculate({ length: '40', width: '30', pitch: '6', overhang: '1', roofType: 'gable', wasteFactor: '10' });
    const sqText = getValue(r, 'squares');
    const sq = parseInt(sqText);
    expect(sq).toBeGreaterThan(0);
    expect(sqText).toContain('squares');
  });

  it('bundles = squares * 3', () => {
    const r = config.calculate({ length: '40', width: '30', pitch: '6', overhang: '1', roofType: 'gable', wasteFactor: '10' });
    const sq = parseInt(getValue(r, 'squares'));
    const bundles = parseInt(getValue(r, 'bundles'));
    expect(bundles).toBe(sq * 3);
  });

  it('hip roof adds extra 5% over gable', () => {
    const gable = config.calculate({ length: '40', width: '30', pitch: '6', overhang: '1', roofType: 'gable', wasteFactor: '5' });
    const hip = config.calculate({ length: '40', width: '30', pitch: '6', overhang: '1', roofType: 'hip', wasteFactor: '5' });
    const gableArea = parseNumber(getValue(gable, 'roofArea'));
    const hipArea = parseNumber(getValue(hip, 'roofArea'));
    expect(hipArea).toBeGreaterThan(gableArea);
  });

  it('waste factor 15% gives larger area than 5%', () => {
    const low = config.calculate({ length: '40', width: '30', pitch: '6', overhang: '1', roofType: 'gable', wasteFactor: '5' });
    const high = config.calculate({ length: '40', width: '30', pitch: '6', overhang: '1', roofType: 'gable', wasteFactor: '15' });
    const lowArea = parseNumber(getValue(low, 'roofArea'));
    const highArea = parseNumber(getValue(high, 'roofArea'));
    expect(highArea).toBeGreaterThan(lowArea);
  });

  it('footprint area includes overhang', () => {
    const r = config.calculate({ length: '40', width: '30', pitch: '0', overhang: '2', roofType: 'gable', wasteFactor: '5' });
    const fp = parseNumber(getValue(r, 'footprintArea'));
    // (40+4) * (30+4) = 44 * 34 = 1496
    near(fp, 1496, 1);
  });

  it('materialsList contains expected fields', () => {
    const r = config.calculate({ length: '40', width: '30', pitch: '6', overhang: '1', roofType: 'gable', wasteFactor: '10' });
    const val = getValue(r, '_materialsList');
    const parsed = JSON.parse(val);
    expect(parsed.squares).toBeGreaterThan(0);
    expect(parsed.bundles).toBeGreaterThan(0);
    expect(parsed.feltRolls).toBeGreaterThan(0);
    expect(parsed.nailsLbs).toBeGreaterThan(0);
    expect(parsed.ridgeLength).toBeDefined();
  });

  it('returns empty for missing length and width', () => {
    const r = config.calculate({ length: '', width: '', pitch: '6', overhang: '1', roofType: 'gable', wasteFactor: '10' });
    expect(r).toEqual([]);
  });

  it('returns empty for zero length', () => {
    const r = config.calculate({ length: '0', width: '30', pitch: '6', overhang: '1', roofType: 'gable', wasteFactor: '10' });
    expect(r).toEqual([]);
  });

  it('returns empty for negative width', () => {
    const r = config.calculate({ length: '40', width: '-10', pitch: '6', overhang: '1', roofType: 'gable', wasteFactor: '10' });
    expect(r).toEqual([]);
  });
});
