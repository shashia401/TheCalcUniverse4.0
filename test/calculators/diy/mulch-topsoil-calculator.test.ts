import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/diy/mulch-topsoil/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('mulch-topsoil', () => {
  it('calculates mulch needed for a garden bed', () => {
    const r = config.calculate({
      material: 'mulch',
      length: '30',
      width: '10',
      depth: '3',
    });
    expect(r).toHaveLength(4);
    // depthFt = 3/12 = 0.25; cubicFeet = 30*10*0.25 = 75
    // cubicYards = 75/27 = 2.7778; withWaste = 2.7778 * 1.1 = 3.0556
    // formatted toFixed(2) → "3.06" → parseNumber gives 3.06
    near(parseNumber(getValue(r, 'cubicYards')), 3.06);
    near(parseNumber(getValue(r, 'cubicFeet')), 82.5);
    // bagsNeeded = ceil(75 * 1.1 / 2) = ceil(41.25) = 42
    near(parseNumber(getValue(r, 'bags')), 42);
    near(parseNumber(getValue(r, 'area')), 300);
  });

  it('calculates topsoil for a new bed with 6-inch depth', () => {
    const r = config.calculate({
      material: 'topsoil',
      length: '20',
      width: '5',
      depth: '6',
    });
    expect(r).toHaveLength(4);
    // depthFt = 6/12 = 0.5; cubicFeet = 20*5*0.5 = 50
    // cubicYards = 50/27 = 1.8519; withWaste = 1.8519 * 1.1 = 2.0370
    // formatted toFixed(2) → "2.04" → parseNumber gives 2.04
    near(parseNumber(getValue(r, 'cubicYards')), 2.04);
    near(parseNumber(getValue(r, 'area')), 100);
  });

  it('calculates gravel for a small pathway', () => {
    const r = config.calculate({
      material: 'gravel',
      length: '40',
      width: '3',
      depth: '2',
    });
    expect(r).toHaveLength(4);
    // depthFt = 2/12 = 0.1667; cubicFeet = 40*3*0.1667 = 20
    // cubicYards = 20/27 = 0.7407; withWaste = 0.7407 * 1.1 = 0.8148
    // formatted toFixed(2) → "0.81" → parseNumber gives 0.81
    near(parseNumber(getValue(r, 'cubicYards')), 0.81);
    near(parseNumber(getValue(r, 'area')), 120);
  });

  it('uses default material when omitted', () => {
    const r = config.calculate({
      length: '10',
      width: '10',
      depth: '3',
    });
    expect(r).toHaveLength(4);
    // Default is 'mulch', so label should reference Mulch
    expect(getValue(r, 'cubicYards')).toContain('cu yd');
  });

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for zero length', () => {
    const r = config.calculate({
      material: 'mulch',
      length: '0',
      width: '10',
      depth: '3',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for zero depth', () => {
    const r = config.calculate({
      material: 'mulch',
      length: '10',
      width: '10',
      depth: '0',
    });
    expect(r).toHaveLength(0);
  });

  it('calculates compost for a vegetable bed amendment', () => {
    const r = config.calculate({
      material: 'compost',
      length: '20',
      width: '5',
      depth: '3',
    });
    expect(r).toHaveLength(4);
    // depthFt = 3/12 = 0.25; cubicFeet = 20*5*0.25 = 25
    // cubicYards = 25/27 = 0.9259; withWaste = 1.0185 → 1.02
    near(parseNumber(getValue(r, 'cubicYards')), 1.02);
    // bagsNeeded = ceil(25 * 1.1 / 2) = ceil(13.75) = 14
    near(parseNumber(getValue(r, 'bags')), 14);
    near(parseNumber(getValue(r, 'area')), 100);
  });

  it('calculates sand for a sandbox at 6 inches deep', () => {
    const r = config.calculate({
      material: 'sand',
      length: '6',
      width: '6',
      depth: '6',
    });
    expect(r).toHaveLength(4);
    // depthFt = 6/12 = 0.5; cubicFeet = 6*6*0.5 = 18
    // cubicYards = 18/27 = 0.6667; withWaste = 0.7333 → 0.73
    near(parseNumber(getValue(r, 'cubicYards')), 0.73);
    near(parseNumber(getValue(r, 'area')), 36);
  });

  it('returns empty for negative depth', () => {
    expect(config.calculate({ material: 'mulch', length: '10', width: '10', depth: '-3' })).toHaveLength(0);
  });

  it('returns empty for non-numeric length', () => {
    expect(config.calculate({ material: 'mulch', length: 'xyz', width: '10', depth: '3' })).toHaveLength(0);
  });

  it('highlight result shows material name and cu yd', () => {
    const r = config.calculate({
      material: 'mulch',
      length: '10',
      width: '10',
      depth: '3',
    });
    const cy = r.find((x) => x.id === 'cubicYards');
    expect(cy).toBeDefined();
    expect(cy!.highlight).toBe(true);
    expect(cy!.color).toBe('positive');
    expect(cy!.label).toContain('Mulch');
    expect(getValue(r, 'cubicYards')).toContain('cu yd');
  });
});
