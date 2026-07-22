import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/diy/drywall/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('drywall', () => {
  it('calculates sheets for a standard room with ceiling and openings', () => {
    const r = config.calculate({
      length: '16',
      width: '12',
      height: '9',
      sheetSize: '32',
      ceiling: 'yes',
      doors: '1',
      windows: '2',
    });
    expect(r).toHaveLength(7);
    // wallArea = 2 * (16+12) * 9 = 504
    // ceilingArea = 16 * 12 = 192
    // totalArea = 504 + 192 = 696
    // doorArea = 20; windowArea = 30; netArea = 696 - 50 = 646
    // withWaste = 646 * 1.1 = 710.6
    // sheetsNeeded = ceil(710.6 / 32) = ceil(22.206) = 23
    // netArea formatted toFixed(0) → "711" → parseNumber gives 711
    near(parseNumber(getValue(r, 'sheets')), 23);
    near(parseNumber(getValue(r, 'netArea')), 711);
    near(parseNumber(getValue(r, 'wallArea')), 504);
    near(parseNumber(getValue(r, 'ceilingArea')), 192);
  });

  it('calculates walls only (no ceiling)', () => {
    const r = config.calculate({
      length: '16',
      width: '12',
      height: '9',
      sheetSize: '32',
      ceiling: 'no',
      doors: '1',
      windows: '2',
    });
    expect(r).toHaveLength(7);
    // wallArea = 504; ceilingArea = 0
    // totalArea = 504; netArea = 504 - 50 = 454
    // withWaste = 454 * 1.1 = 499.4
    // netArea formatted toFixed(0) → "499" → parseNumber gives 499
    // sheetsNeeded = ceil(499.4 / 32) = ceil(15.606) = 16
    near(parseNumber(getValue(r, 'sheets')), 16);
    near(parseNumber(getValue(r, 'netArea')), 499);
    // When ceiling is excluded, value is the string "Not included" (not a number)
    expect(getValue(r, 'ceilingArea')).toBe('Not included');
  });

  it('calculates with larger 4x12 sheets', () => {
    const r = config.calculate({
      length: '20',
      width: '14',
      height: '10',
      sheetSize: '48',
      ceiling: 'yes',
    });
    expect(r).toHaveLength(7);
    // wallArea = 2 * (20+14) * 10 = 680
    // ceilingArea = 20 * 14 = 280
    // totalArea = 960; netArea = 960 (no doors/windows)
    // withWaste = 960 * 1.1 = 1056
    // sheetsNeeded = ceil(1056 / 48) = ceil(22) = 22
    near(parseNumber(getValue(r, 'sheets')), 22);
    near(parseNumber(getValue(r, 'wallArea')), 680);
    near(parseNumber(getValue(r, 'ceilingArea')), 280);
  });

  it('uses default sheet size (4x8) and ceiling (yes) when omitted', () => {
    const r = config.calculate({
      length: '10',
      width: '10',
      height: '8',
    });
    expect(r).toHaveLength(7);
    // wallArea = 2 * (10+10) * 8 = 320
    // ceilingArea = 10 * 10 = 100
    // totalArea = 420; netArea = 420
    // withWaste = 462; sheets = ceil(462/32) = ceil(14.4375) = 15
    near(parseNumber(getValue(r, 'sheets')), 15);
  });

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for zero width', () => {
    const r = config.calculate({
      length: '16',
      width: '0',
      height: '9',
    });
    expect(r).toHaveLength(0);
  });

  it('handles no doors or windows', () => {
    const r = config.calculate({
      length: '10',
      width: '10',
      height: '8',
      sheetSize: '32',
      ceiling: 'no',
    });
    expect(r).toHaveLength(7);
    // wallArea = 320; withWaste = 320 * 1.1 = 352
    // sheets = ceil(352 / 32) = 11
    near(parseNumber(getValue(r, 'sheets')), 11);
  });
});
