import { describe, it, expect } from 'vitest';
import areaPerimeterConfig from '../../../src/calculators/math/area-perimeter/index';

describe('Area & Perimeter Calculator', () => {
  const find = (results: ReturnType<typeof areaPerimeterConfig.calculate>, id: string) =>
    results.find((r) => r.id === id)?.value ?? '';

  it('calculates circle area and circumference correctly', () => {
    const results = areaPerimeterConfig.calculate({
      shape: 'circle',
      circleRadius: '5',
    });

    expect(find(results, 'area')).toBe('78.539816'); // π × 5² ≈ 78.54
    expect(find(results, 'circumference')).toBe('31.415927'); // 2π × 5 ≈ 31.42
    expect(find(results, 'diameter')).toBe('10'); // 2 × 5
  });

  it('calculates rectangle area, perimeter, and diagonal', () => {
    const results = areaPerimeterConfig.calculate({
      shape: 'rectangle',
      rectLength: '10',
      rectWidth: '5',
    });

    expect(find(results, 'area')).toBe('50'); // 10 × 5
    expect(find(results, 'perimeter')).toBe('30'); // 2 × (10 + 5)
    expect(find(results, 'diagonal')).toBe('11.18034'); // √(100 + 25)
  });

  it('handles compound shape (rectangle + semicircle)', () => {
    const results = areaPerimeterConfig.calculate({
      shape: 'rectangle',
      rectLength: '10',
      rectWidth: '5',
      compound: 'rectSemi',
      compRadius: '2.5',
    });

    expect(find(results, 'compoundLabel')).toContain('Rectangle + Semicircle');
    // Area should be > rectangle area alone
    const totalArea = parseFloat(find(results, 'area'));
    expect(totalArea).toBeGreaterThan(50);
    expect(totalArea).toBeLessThan(65); // ~59.8
  });

  it('calculates triangle area correctly', () => {
    const results = areaPerimeterConfig.calculate({
      shape: 'triangle',
      triBase: '8',
      triHeight: '6',
    });

    expect(find(results, 'area')).toBe('24'); // ½ × 8 × 6
  });

  it('returns empty array for zero radius circle', () => {
    const results = areaPerimeterConfig.calculate({
      shape: 'circle',
      circleRadius: '0',
    });
    expect(results).toEqual([]);
  });

  it('returns empty array for missing required values', () => {
    expect(areaPerimeterConfig.calculate({ shape: 'circle' })).toEqual([]);
    expect(areaPerimeterConfig.calculate({ shape: 'rectangle' })).toEqual([]);
  });
});
