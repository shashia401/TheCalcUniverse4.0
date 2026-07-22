import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/diy/concrete-slab/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('concrete-slab', () => {
  it('calculates cubic yards for a standard driveway slab', () => {
    const r = config.calculate({
      length: '20',
      width: '15',
      depth: '4',
      wastePct: '10',
    });
    expect(r).toHaveLength(4);
    // depthFt = 4/12 = 0.3333; cubicFeet = 20*15*0.3333 = 100
    // cubicYards = 100/27 = 3.7037; withWaste = 3.7037 * 1.1 = 4.07407
    // formatted toFixed(2) → "4.07" → parseNumber gives 4.07
    near(parseNumber(getValue(r, 'cubicYards')), 4.07);
    near(parseNumber(getValue(r, 'cubicFeet')), 110);
    // bags60 = ceil(4.07407 * 27 / 0.45) = ceil(244.444) = 245
    near(parseNumber(getValue(r, 'bags60')), 245);
    // bags80 = ceil(4.07407 * 27 / 0.6) = ceil(183.333) = 184
    near(parseNumber(getValue(r, 'bags80')), 184);
  });

  it('calculates for a small patio with 4-inch depth and no waste', () => {
    const r = config.calculate({
      length: '10',
      width: '10',
      depth: '4',
      wastePct: '5',
    });
    expect(r).toHaveLength(4);
    // depthFt = 4/12 = 0.3333; cubicFeet = 100 * 0.3333 = 33.33
    // cubicYards = 33.33/27 = 1.2346; withWaste = 1.2346 * 1.05 = 1.2963
    // formatted toFixed(2) → "1.30" → parseNumber gives 1.30
    near(parseNumber(getValue(r, 'cubicYards')), 1.30);
  });

  it('calculates with default waste when omitted', () => {
    const r = config.calculate({
      length: '10',
      width: '10',
      depth: '4',
    });
    expect(r).toHaveLength(4);
    // with default 10% waste
    // cubicYards = 33.33/27 = 1.2346; withWaste = 1.2346 * 1.1 = 1.3580
    // formatted toFixed(2) → "1.36" → parseNumber gives 1.36
    near(parseNumber(getValue(r, 'cubicYards')), 1.36);
  });

  it('uses default 4-inch depth when depth is omitted', () => {
    const r = config.calculate({
      length: '10',
      width: '10',
    });
    expect(r).toHaveLength(4);
    near(parseNumber(getValue(r, 'cubicYards')), 1.36);
  });

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for zero width', () => {
    const r = config.calculate({
      length: '20',
      width: '0',
      depth: '4',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for missing required dimensions', () => {
    const r = config.calculate({
      length: '',
      width: '10',
      depth: '4',
    });
    expect(r).toHaveLength(0);
  });

  it('calculates for a large driveway at 6-inch depth', () => {
    const r = config.calculate({
      length: '30',
      width: '25',
      depth: '6',
      wastePct: '10',
    });
    expect(r).toHaveLength(4);
    // depthFt = 6/12 = 0.5; cubicFeet = 30*25*0.5 = 375
    // cubicYards = 375/27 = 13.8889; withWaste = 15.2778 → rounded to 15.28
    near(parseNumber(getValue(r, 'cubicYards')), 15.28);
    near(parseNumber(getValue(r, 'cubicFeet')), 412.50);
  });

  it('calculates with 15% waste for irregular terrain', () => {
    const r = config.calculate({
      length: '12',
      width: '8',
      depth: '4',
      wastePct: '15',
    });
    expect(r).toHaveLength(4);
    // depthFt = 4/12 = 0.3333; cubicFeet = 12*8*0.3333 = 32
    // cubicYards = 32/27 = 1.1852; withWaste = 1.3630 → 1.36
    near(parseNumber(getValue(r, 'cubicYards')), 1.36);
  });

  it('returns empty for negative dimensions', () => {
    expect(config.calculate({ length: '-5', width: '10', depth: '4' })).toHaveLength(0);
  });

  it('returns empty for non-numeric input', () => {
    expect(config.calculate({ length: 'abc', width: '10', depth: '4' })).toHaveLength(0);
  });

  it('highlight result is cubicYards with positive color', () => {
    const r = config.calculate({
      length: '20',
      width: '15',
      depth: '4',
    });
    const cy = r.find((x) => x.id === 'cubicYards');
    expect(cy).toBeDefined();
    expect(cy!.highlight).toBe(true);
    expect(cy!.color).toBe('positive');
  });
});
