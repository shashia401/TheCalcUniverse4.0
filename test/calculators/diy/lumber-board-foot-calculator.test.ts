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

  it('reports actual dimensions for dimensional lumber', () => {
    const r = config.calculate({
      thickness: '2',
      width: '4',
      length: '8',
      quantity: '10',
    });
    // actual 2x4 is 1.5 x 3.5
    const dims = getValue(r, 'actualDimensions');
    expect(dims).toContain('1.5');
    expect(dims).toContain('3.5');
  });

  it('calculates actual board feet (not nominal)', () => {
    const r = config.calculate({
      thickness: '2',
      width: '4',
      length: '8',
      quantity: '10',
    });
    // actual: (1.5 * 3.5 * 8) / 12 = 3.5 per board, 35 total
    // nominal: (2 * 4 * 8) / 12 = 5.33 per board, 53.33 total
    const actual = parseNumber(getValue(r, 'actualBdFt'));
    const nominal = parseNumber(getValue(r, 'totalBdFt'));
    expect(actual).toBeLessThan(nominal);
    near(actual, 35, 0.01);
    near(nominal, 53.33, 0.01);
  });

  it('reports correct actual width for nominal 8-inch+ lumber (PS-20 standard) — regression fix', () => {
    // Bug: actualWidth formula only checked `width >= 4 ? width - 0.5 : width - 0.25`,
    // giving 2x8 an actual width of 7.5" instead of the real American Softwood Lumber
    // Standard (PS-20) value of 7.25" (widths 8"+ lose 0.75", not 0.5"). This also affected
    // 2x2/2x3-style narrow widths, which should lose 0.5" like 2x4-2x7, not 0.25".
    const r8 = config.calculate({ thickness: '1', width: '8', length: '10', quantity: '6' });
    const dims8 = getValue(r8, 'actualDimensions');
    expect(dims8).toContain('7.3'); // 7.25 rounds to 7.3 at one decimal
    const actualBdFt8 = parseNumber(getValue(r8, 'actualBdFt'));
    near(actualBdFt8, 27.19, 0.05); // 6 boards x (0.75 x 7.25 x 10)/12 = 27.1875

    const r2 = config.calculate({ thickness: '2', width: '2', length: '8', quantity: '1' });
    const dims2 = getValue(r2, 'actualDimensions');
    expect(dims2).toContain('1.5'); // actual 2x2 is 1.5 x 1.5, not 1.5 x 1.75
  });

  it('does not include cost result when price is omitted', () => {
    const r = config.calculate({
      thickness: '2',
      width: '4',
      length: '8',
      quantity: '10',
    });
    expect(r.find((x: { id: string }) => x.id === 'totalCost')).toBeUndefined();
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
    near(parseNumber(getValue(r, 'totalBdFt')), 10.67);
    near(parseNumber(getValue(r, 'perBoard')), 10.67);
    near(parseNumber(getValue(r, 'linearFt')), 8);
  });

  describe('Educational content', () => {
    it('has formula defined', () => {
      expect(config.educational.formula).toBeTruthy();
    });

    it('has 5 variables', () => {
      expect(config.educational.variables).toHaveLength(5);
    });

    it('has how-to-use instructions', () => {
      expect(config.educational.howToUse?.length).toBeGreaterThanOrEqual(4);
    });

    it('has explanation', () => {
      expect(config.educational.explanation).toBeTruthy();
      expect(config.educational.explanation.length).toBeGreaterThan(500);
    });

    it('has 5+ FAQs', () => {
      expect(config.educational.faqs?.length).toBeGreaterThanOrEqual(5);
    });

    it('has worked examples', () => {
      expect(config.educational.workedExamples?.length).toBeGreaterThanOrEqual(2);
    });

    it('has pro tips', () => {
      expect(config.educational.proTips?.length).toBeGreaterThanOrEqual(4);
    });

    it('has limitations', () => {
      expect(config.educational.limitations?.length).toBeGreaterThanOrEqual(3);
    });

    it('has quick reference', () => {
      expect(config.educational.quickReference?.length).toBeGreaterThanOrEqual(5);
    });
  });
});
