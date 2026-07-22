import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/math/square-footage/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('Square Footage Calculator', () => {
  // ── Rectangle ──

  it('calculates rectangle area: 10 × 12 ft = 120 sq ft', () => {
    const r = config.calculate({ shape: 'rectangle', length: '10', width: '12', unit: 'ft', wastage: '0', pricePerSqFt: '' });
    near(parseNumber(getValue(r, 'sqft')), 120);
    expect(getValue(r, 'shape')).toBe('Rectangle');
  });

  it('calculates rectangle area with wastage', () => {
    const r = config.calculate({ shape: 'rectangle', length: '10', width: '10', unit: 'ft', wastage: '10', pricePerSqFt: '' });
    near(parseNumber(getValue(r, 'sqft')), 100);
    near(parseNumber(getValue(r, 'withWaste')), 110);
  });

  // ── Circle ──

  it('calculates circle area: radius 5 ft ≈ 78.54 sq ft', () => {
    const r = config.calculate({ shape: 'circle', radius: '5', unit: 'ft', wastage: '0', pricePerSqFt: '' });
    near(parseNumber(getValue(r, 'sqft')), 78.54, 0.01);
    expect(getValue(r, 'shape')).toBe('Circle');
  });

  it('calculates circle area with zero radius returns empty', () => {
    const r = config.calculate({ shape: 'circle', radius: '0', unit: 'ft', wastage: '0', pricePerSqFt: '' });
    expect(r).toEqual([]);
  });

  // ── L-Shape ──

  it('calculates L-shape area: (10×8) + (6×4) = 104 sq ft', () => {
    const r = config.calculate({
      shape: 'lshape', length: '10', width: '8',
      lLength2: '6', lWidth2: '4',
      unit: 'ft', wastage: '0', pricePerSqFt: '',
    });
    near(parseNumber(getValue(r, 'sqft')), 104);
    expect(getValue(r, 'shape')).toBe('L-Shape');
  });

  // ── Cost ──

  it('calculates total cost with price per sq ft', () => {
    const r = config.calculate({
      shape: 'rectangle', length: '10', width: '12',
      unit: 'ft', wastage: '0', pricePerSqFt: '2.50',
    });
    near(parseNumber(getValue(r, 'sqft')), 120);
    expect(getValue(r, 'totalCost')).toBe('$300.00');
  });

  it('includes waste in cost estimate', () => {
    const r = config.calculate({
      shape: 'rectangle', length: '10', width: '10',
      unit: 'ft', wastage: '10', pricePerSqFt: '5',
    });
    near(parseNumber(getValue(r, 'sqft')), 100);
    // 110 sq ft with waste × $5 = $550
    expect(getValue(r, 'totalCost')).toBe('$550.00');
  });

  // ── Missing inputs → empty ──

  it('returns empty for missing rectangle dimensions', () => {
    const r = config.calculate({ shape: 'rectangle', length: '', width: '', unit: 'ft', wastage: '0', pricePerSqFt: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for missing L-shape dimensions', () => {
    const r = config.calculate({
      shape: 'lshape', length: '10', width: '8',
      lLength2: '', lWidth2: '',
      unit: 'ft', wastage: '0', pricePerSqFt: '',
    });
    expect(r).toEqual([]);
  });

  // ── Unit conversion ──

  it('calculates rectangle area in meters and converts to sq ft', () => {
    // 10 m × 12 m = 120 sq m; 120 × 10.7639 = 1291.668 sq ft
    const r = config.calculate({ shape: 'rectangle', length: '10', width: '12', unit: 'm', wastage: '0', pricePerSqFt: '' });
    near(parseNumber(getValue(r, 'sqm')), 120);
    near(parseNumber(getValue(r, 'sqft')), 1291.67, 0.1);
  });

  // ── Zero dimensions ──

  it('returns empty for zero rectangle dimensions', () => {
    const r = config.calculate({ shape: 'rectangle', length: '0', width: '10', unit: 'ft', wastage: '0', pricePerSqFt: '' });
    expect(r).toEqual([]);
  });

  it('returns empty for negative dimensions', () => {
    const r = config.calculate({ shape: 'rectangle', length: '-5', width: '10', unit: 'ft', wastage: '0', pricePerSqFt: '' });
    expect(r).toEqual([]);
  });

  // ── Wastage = 0 ──

  it('withWaste equals sqft when wastage is 0', () => {
    const r = config.calculate({ shape: 'rectangle', length: '10', width: '10', unit: 'ft', wastage: '0', pricePerSqFt: '' });
    expect(getValue(r, 'withWaste')).toBe(getValue(r, 'sqft'));
  });
});
