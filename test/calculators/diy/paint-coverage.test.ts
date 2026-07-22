import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/diy/paint-coverage/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('paint-coverage', () => {
  it('calculates gallons needed for a standard room with doors and windows', () => {
    const r = config.calculate({
      roomLength: '14',
      roomWidth: '12',
      ceilingHeight: '9',
      doors: '2',
      windows: '3',
      coats: '2',
    });
    expect(r).toHaveLength(4);
    // wallArea = 2 * (14+12) * 9 = 468; doorArea = 42; windowArea = 45
    // paintableArea = 468 - 42 - 45 = 381
    // gallonsNeeded = 381 * 2 / 350 = 2.1771; withWaste = 2.1771 * 1.1 = 2.3948...
    // gallons formatted toFixed(1) → "2.4" → parseNumber gives 2.4
    near(parseNumber(getValue(r, 'gallons')), 2.4);
    near(parseNumber(getValue(r, 'containers')), 3);
    // fmt uses toFixed(1): 381 → "381.0" → parseNumber gives 381
    near(parseNumber(getValue(r, 'paintableArea')), 381);
    near(parseNumber(getValue(r, 'totalWallArea')), 468);
  });

  it('calculates single coat with no doors or windows', () => {
    const r = config.calculate({
      roomLength: '10',
      roomWidth: '10',
      ceilingHeight: '8',
      doors: '0',
      windows: '0',
      coats: '1',
    });
    expect(r).toHaveLength(4);
    // wallArea = 2 * (10+10) * 8 = 320
    // paintableArea = 320
    // gallonsNeeded = 320 * 1 / 350 = 0.9143; withWaste = 0.9143 * 1.1 = 1.0057...
    // gallons formatted toFixed(1) → "1.0" → parseNumber gives 1
    near(parseNumber(getValue(r, 'gallons')), 1.0);
    near(parseNumber(getValue(r, 'containers')), 2);
    near(parseNumber(getValue(r, 'totalWallArea')), 320);
  });

  it('uses 2 coats by default when coats is omitted', () => {
    const r = config.calculate({
      roomLength: '10',
      roomWidth: '10',
      ceilingHeight: '8',
    });
    expect(r).toHaveLength(4);
    // wallArea = 320, paintableArea = 320
    // gallonsNeeded = 320 * 2 / 350 = 1.8286; withWaste = 2.0114...
    // gallons formatted toFixed(1) → "2.0" → parseNumber gives 2
    near(parseNumber(getValue(r, 'gallons')), 2.0);
  });

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for zero length', () => {
    const r = config.calculate({
      roomLength: '0',
      roomWidth: '12',
      ceilingHeight: '9',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for negative dimensions', () => {
    const r = config.calculate({
      roomLength: '-5',
      roomWidth: '12',
      ceilingHeight: '9',
    });
    expect(r).toHaveLength(0);
  });

  it('handles partial or missing door/window inputs', () => {
    const r = config.calculate({
      roomLength: '12',
      roomWidth: '10',
      ceilingHeight: '8',
      doors: '1',
      // windows omitted — defaults to 0
    });
    expect(r).toHaveLength(4);
    // wallArea = 2 * (12+10) * 8 = 352; doorArea = 21
    // paintableArea = 331; gallonsNeeded = 331 * 2 / 350 = 1.8914; withWaste = 2.0806
    // gallons formatted toFixed(1) → "2.1" → parseNumber gives 2.1
    near(parseNumber(getValue(r, 'paintableArea')), 331);
    near(parseNumber(getValue(r, 'gallons')), 2.1);
  });
});
