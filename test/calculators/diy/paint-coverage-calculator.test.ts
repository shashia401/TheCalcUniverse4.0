import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/diy/paint-coverage/index';
import { getValue, parseNumber, near } from '../../helpers';

describe('paint-coverage-calculator (full)', () => {
  it('calculates gallons needed for a standard 14x12x9 room with 2 doors, 3 windows, 2 coats', () => {
    const r = config.calculate({
      roomLength: '14',
      roomWidth: '12',
      ceilingHeight: '9',
      doors: '2',
      windows: '3',
      coats: '2',
    });
    expect(r).toHaveLength(4);
    // wallArea = 2*(14+12)*9 = 468; doors = 42; windows = 45
    // paintableArea = 381; gallons = 381*2/350*1.1 = 2.4
    near(parseNumber(getValue(r, 'gallons')), 2.4);
    near(parseNumber(getValue(r, 'containers')), 3);
    near(parseNumber(getValue(r, 'paintableArea')), 381);
    near(parseNumber(getValue(r, 'totalWallArea')), 468);
  });

  it('calculates single coat with zero doors/windows', () => {
    const r = config.calculate({
      roomLength: '10',
      roomWidth: '10',
      ceilingHeight: '8',
      doors: '0',
      windows: '0',
      coats: '1',
    });
    expect(r).toHaveLength(4);
    // wallArea = 320, gallons = 320*1/350*1.1 = 1.0
    near(parseNumber(getValue(r, 'gallons')), 1.0);
    near(parseNumber(getValue(r, 'containers')), 2);
    near(parseNumber(getValue(r, 'totalWallArea')), 320);
  });

  it('defaults coats to 2 when omitted', () => {
    const r = config.calculate({
      roomLength: '10',
      roomWidth: '10',
      ceilingHeight: '8',
    });
    expect(r).toHaveLength(4);
    // wallArea = 320, gallons = 320*2/350*1.1 = 2.0
    near(parseNumber(getValue(r, 'gallons')), 2.0);
  });

  it('defaults doors and windows to 0 when omitted', () => {
    const r = config.calculate({
      roomLength: '12',
      roomWidth: '10',
      ceilingHeight: '8',
      doors: '1',
    });
    expect(r).toHaveLength(4);
    // wallArea = 352, doorArea = 21, paintable = 331
    near(parseNumber(getValue(r, 'paintableArea')), 331);
    near(parseNumber(getValue(r, 'gallons')), 2.1);
  });

  it('handles large rooms with 3 coats', () => {
    const r = config.calculate({
      roomLength: '30',
      roomWidth: '20',
      ceilingHeight: '12',
      doors: '4',
      windows: '6',
      coats: '3',
    });
    expect(r).toHaveLength(4);
    // wallArea = 2*(30+20)*12 = 1200; doors = 84; windows = 90; paintable = 1026
    // gallons = 1026*3/350*1.1 = 9.7
    near(parseNumber(getValue(r, 'paintableArea')), 1026);
    near(parseNumber(getValue(r, 'gallons')), 9.7);
    near(parseNumber(getValue(r, 'containers')), 10);
  });

  it('returns empty array for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for zero room dimensions', () => {
    expect(config.calculate({ roomLength: '0', roomWidth: '12', ceilingHeight: '9' })).toHaveLength(0);
    expect(config.calculate({ roomLength: '12', roomWidth: '0', ceilingHeight: '9' })).toHaveLength(0);
    expect(config.calculate({ roomLength: '12', roomWidth: '12', ceilingHeight: '0' })).toHaveLength(0);
  });

  it('returns empty for negative dimensions', () => {
    expect(config.calculate({ roomLength: '-5', roomWidth: '12', ceilingHeight: '9' })).toHaveLength(0);
  });

  it('returns empty for non-numeric dimensions', () => {
    expect(config.calculate({ roomLength: 'abc', roomWidth: '12', ceilingHeight: '9' })).toHaveLength(0);
  });

  it('highlight result has the "gallons" id and positive color', () => {
    const r = config.calculate({
      roomLength: '14',
      roomWidth: '12',
      ceilingHeight: '9',
      coats: '2',
    });
    const gallon = r.find((x) => x.id === 'gallons');
    expect(gallon).toBeDefined();
    expect(gallon!.highlight).toBe(true);
    expect(gallon!.color).toBe('positive');
  });
});
