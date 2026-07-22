import { describe, it, expect } from 'vitest';
import config from '../../../src/calculators/diy/lumber/index';
import { getValue, parseNumber, parseMoney, near } from '../../helpers';

describe('lumber', () => {
  it('calculates board feet for 2x4x8 boards', () => {
    const r = config.calculate({
      thickness: '2',
      width: '4',
      length: '8',
      quantity: '20',
    });
    expect(r).toHaveLength(5);
    // boardFeetPerBoard = (2 * 4 * 8) / 12 = 5.3333
    // totalBoardFeet = 5.3333 * 20 = 106.6667
    // totalLinearFeet = 8 * 20 = 160
    // formatted toFixed(2) → "106.67" and "5.33"
    near(parseNumber(getValue(r, 'totalBdFt')), 106.67);
    near(parseNumber(getValue(r, 'perBoard')), 5.33);
    near(parseNumber(getValue(r, 'linearFt')), 160);
  });

  it('calculates with 2x6 lumber and includes cost', () => {
    const r = config.calculate({
      thickness: '2',
      width: '6',
      length: '12',
      quantity: '10',
      pricePerBdFt: '2.50',
    });
    expect(r).toHaveLength(6);
    // boardFeetPerBoard = (2 * 6 * 12) / 12 = 12
    // totalBoardFeet = 12 * 10 = 120
    // totalCost = 120 * 2.50 = 300
    near(parseNumber(getValue(r, 'totalBdFt')), 120);
    near(parseNumber(getValue(r, 'perBoard')), 12);
    near(parseNumber(getValue(r, 'linearFt')), 120);
    near(parseMoney(getValue(r, 'totalCost')), 300);
  });

  it('calculates for 1x6 trim boards', () => {
    const r = config.calculate({
      thickness: '1',
      width: '6',
      length: '10',
      quantity: '5',
    });
    expect(r).toHaveLength(5);
    // boardFeetPerBoard = (1 * 6 * 10) / 12 = 5
    // totalBoardFeet = 5 * 5 = 25
    // totalLinearFeet = 10 * 5 = 50
    near(parseNumber(getValue(r, 'totalBdFt')), 25);
    near(parseNumber(getValue(r, 'perBoard')), 5);
    near(parseNumber(getValue(r, 'linearFt')), 50);
  });

  it('does not include cost result when price is omitted', () => {
    const r = config.calculate({
      thickness: '2',
      width: '4',
      length: '8',
      quantity: '10',
    });
    expect(r.find((x) => x.id === 'totalCost')).toBeUndefined();
    expect(r).toHaveLength(5);
  });

  it('returns empty for empty inputs', () => {
    expect(config.calculate({})).toHaveLength(0);
  });

  it('returns empty for zero quantity', () => {
    const r = config.calculate({
      thickness: '2',
      width: '4',
      length: '8',
      quantity: '0',
    });
    expect(r).toHaveLength(0);
  });

  it('returns empty for zero length', () => {
    const r = config.calculate({
      thickness: '2',
      width: '4',
      length: '0',
      quantity: '10',
    });
    expect(r).toHaveLength(0);
  });

  it('handles single board', () => {
    const r = config.calculate({
      thickness: '4',
      width: '4',
      length: '8',
      quantity: '1',
    });
    expect(r).toHaveLength(5);
    // boardFeetPerBoard = (4 * 4 * 8) / 12 = 10.6667
    // formatted toFixed(2) → "10.67"
    near(parseNumber(getValue(r, 'totalBdFt')), 10.67);
    near(parseNumber(getValue(r, 'perBoard')), 10.67);
    near(parseNumber(getValue(r, 'linearFt')), 8);
  });
});
